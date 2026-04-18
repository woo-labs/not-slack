import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import type { Message } from "@/stores/chatStore"

export function useMessages(channelId: string) {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore.getState().user?.id

  const query = useQuery({
    queryKey: ["messages", channelId],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(display_name, avatar_url)")
        .eq("channel_id", channelId)
        .is("thread_id", null)
        .order("created_at")
        .limit(100)

      if (error) throw error
      const messages = data as Message[]

      const parentIds = messages.map((m) => m.id)
      if (parentIds.length === 0) return messages

      const { data: replies } = await supabase
        .from("messages")
        .select("thread_id")
        .in("thread_id", parentIds)

      const counts = new Map<string, number>()
      for (const r of replies ?? []) {
        if (r.thread_id) counts.set(r.thread_id, (counts.get(r.thread_id) ?? 0) + 1)
      }
      return messages.map((m) => ({ ...m, reply_count: counts.get(m.id) ?? 0 }))
    },
  })

  // Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message

          // 본인 메시지는 낙관적 업데이트로 이미 표시됨 → 스킵
          if (newMsg.user_id === currentUserId) return

          // 쓰레드 답글이면 부모 reply_count만 증가시키고 메인 리스트엔 추가하지 않음
          if (newMsg.thread_id) {
            queryClient.setQueryData<Message[]>(
              ["messages", channelId],
              (old) =>
                old?.map((m) =>
                  m.id === newMsg.thread_id
                    ? { ...m, reply_count: (m.reply_count ?? 0) + 1 }
                    : m,
                ),
            )
            return
          }

          const current = queryClient.getQueryData<Message[]>(["messages", channelId])
          if (current?.some((m) => m.id === newMsg.id)) return

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", newMsg.user_id)
            .single()

          newMsg.profiles = profile ?? undefined

          queryClient.setQueryData<Message[]>(
            ["messages", channelId],
            (old) => [...(old ?? []), newMsg]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, queryClient, currentUserId])

  return query
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        user_id: user!.id,
        content,
      })
      if (error) throw error
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["messages", channelId] })
      const previous = queryClient.getQueryData<Message[]>(["messages", channelId])

      const optimistic: Message = {
        id: crypto.randomUUID(),
        channel_id: channelId,
        user_id: user!.id,
        thread_id: null,
        content,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_type: "text",
        metadata: null,
        profiles: { display_name: user!.email?.split("@")[0] ?? "", avatar_url: null },
      }

      queryClient.setQueryData<Message[]>(
        ["messages", channelId],
        (old) => [...(old ?? []), optimistic]
      )

      return { previous }
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", channelId], context.previous)
      }
    },
  })
}
