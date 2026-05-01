import { useEffect } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import type { Message } from "@/stores/chatStore"

type ThreadData = {
  parent: Message
  replies: Message[]
  channelId: string
}

function bumpReplyCount(message: Message) {
  const metadata = message.metadata as any
  const currentReplyCount = metadata?.issue?.reply_count ?? 0

  if (!metadata) {
    return message
  }

  return {
    ...message,
    metadata: {
      ...metadata,
      issue: {
        ...metadata.issue,
        reply_count: currentReplyCount + 1,
      },
    },
  } as Message
}

export function useThreadMessages(parentMessageId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["thread", parentMessageId],
    enabled: Boolean(parentMessageId),
    queryFn: async () => {
      if (!parentMessageId) return null

      const [parentResult, repliesResult] = await Promise.all([
        supabase
          .from("messages")
          .select("*, profiles(display_name, avatar_url)")
          .eq("id", parentMessageId)
          .single(),
        supabase
          .from("messages")
          .select("*, profiles(display_name, avatar_url)")
          .eq("thread_id", parentMessageId)
          .order("created_at", { ascending: true }),
      ])

      if (parentResult.error) throw parentResult.error
      if (repliesResult.error) throw repliesResult.error

      return {
        parent: parentResult.data as Message,
        replies: repliesResult.data as Message[],
        channelId: parentResult.data.channel_id,
      }
    },
  })

  useEffect(() => {
    if (!parentMessageId) return

    const channel = supabase
      .channel(`thread:${parentMessageId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${parentMessageId}` },
        async (payload) => {
          const newReply = payload.new as Message
          const current = queryClient.getQueryData<ThreadData>(["thread", parentMessageId])
          if (!current) return

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", newReply.user_id)
            .single()

          newReply.profiles = profile ?? undefined

          const nextParent = bumpReplyCount(current.parent)

          queryClient.setQueryData(["thread", parentMessageId], {
            ...current,
            parent: nextParent,
            replies: [...current.replies, newReply],
          })

          queryClient.setQueryData<Message[]>(["messages", current.channelId], (old) =>
            old?.map((message) =>
              message.id === nextParent.id ? (nextParent as Message) : message
            ) ?? old
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [parentMessageId, queryClient])

  return query
}

export function useSendThreadReply(channelId: string, parentMessageId: string | null) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (content: string) => {
      if (!parentMessageId) {
        throw new Error("Missing thread id")
      }

      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        user_id: user!.id,
        thread_id: parentMessageId,
        message_type: "text",
        metadata: null,
        content,
      })
      if (error) throw error
    },
    onMutate: async (content) => {
      if (!parentMessageId) {
        return { previous: null }
      }

      await queryClient.cancelQueries({ queryKey: ["thread", parentMessageId] })
      const previous = queryClient.getQueryData<ThreadData>(["thread", parentMessageId])
      const previousMain = queryClient.getQueryData<Message[]>(["messages", channelId])

      const optimistic: Message = {
        id: crypto.randomUUID(),
        channel_id: channelId,
        user_id: user!.id,
        thread_id: parentMessageId,
        message_type: "text",
        content,
        metadata: null,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: { display_name: user!.email?.split("@")[0] ?? "", avatar_url: null },
      }

      queryClient.setQueryData(["thread", parentMessageId], (old: ThreadData | undefined) => {
        if (!old) return old
        const nextParent = bumpReplyCount(old.parent)
        return {
          ...old,
          parent: nextParent,
          replies: [...old.replies, optimistic],
        }
      })

      queryClient.setQueryData<Message[]>(["messages", channelId], (old) =>
        old?.map((message) =>
          message.id === parentMessageId ? bumpReplyCount(message) : message
        ) ?? old
      )

      return { previous, previousMain }
    },
    onError: (_err, _content, context) => {
      if (parentMessageId && context?.previous) {
        queryClient.setQueryData(["thread", parentMessageId], context.previous)
      }

      if (context?.previousMain) {
        queryClient.setQueryData(["messages", channelId], context.previousMain)
      }
    },
  })
}
