import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import type { Message } from "@/stores/chatStore"

export function useThreadMessages(threadId: string | null) {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore.getState().user?.id

  const query = useQuery({
    queryKey: ["thread", threadId],
    enabled: !!threadId,
    staleTime: 0,
    queryFn: async () => {
      if (!threadId) return []
      const [parentRes, repliesRes] = await Promise.all([
        supabase
          .from("messages")
          .select("*, profiles(display_name, avatar_url)")
          .eq("id", threadId)
          .single(),
        supabase
          .from("messages")
          .select("*, profiles(display_name, avatar_url)")
          .eq("thread_id", threadId)
          .order("created_at"),
      ])
      if (parentRes.error) throw parentRes.error
      if (repliesRes.error) throw repliesRes.error
      return [parentRes.data, ...(repliesRes.data ?? [])] as Message[]
    },
  })

  useEffect(() => {
    if (!threadId) return
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.user_id === currentUserId) return

          const current = queryClient.getQueryData<Message[]>(["thread", threadId])
          if (current?.some((m) => m.id === newMsg.id)) return

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", newMsg.user_id)
            .single()

          newMsg.profiles = profile ?? undefined

          queryClient.setQueryData<Message[]>(["thread", threadId], (old) => [
            ...(old ?? []),
            newMsg,
          ])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, queryClient, currentUserId])

  return query
}

export function useSendThreadReply(channelId: string, threadId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        user_id: user!.id,
        thread_id: threadId,
        content,
      })
      if (error) throw error
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["thread", threadId] })
      const previous = queryClient.getQueryData<Message[]>(["thread", threadId])

      const optimistic: Message = {
        id: crypto.randomUUID(),
        channel_id: channelId,
        user_id: user!.id,
        thread_id: threadId,
        content,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_type: "text",
        metadata: null,
        profiles: {
          display_name: user!.email?.split("@")[0] ?? "",
          avatar_url: null,
        },
      }

      queryClient.setQueryData<Message[]>(["thread", threadId], (old) => [
        ...(old ?? []),
        optimistic,
      ])

      // Bump reply count on the parent (in messages list)
      queryClient.setQueriesData<Message[]>(
        { queryKey: ["messages", channelId] },
        (old) =>
          old?.map((m) =>
            m.id === threadId
              ? { ...m, reply_count: (m.reply_count ?? 0) + 1 }
              : m,
          ),
      )

      return { previous }
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["thread", threadId], context.previous)
      }
    },
  })
}
