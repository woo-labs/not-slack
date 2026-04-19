import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { GitHubPullRequestEvent } from "@/stores/chatStore"

export function useGitHubPullRequests(channelId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["github-pr-events", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("github_pr_events")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      return data as GitHubPullRequestEvent[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel(`github-pr-events:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "github_pr_events",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newEvent = payload.new as GitHubPullRequestEvent

          queryClient.setQueryData<GitHubPullRequestEvent[]>(
            ["github-pr-events", channelId],
            (old) => {
              if (old?.some((event) => event.id === newEvent.id)) {
                return old
              }

              return [newEvent, ...(old ?? [])]
            }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, queryClient])

  return query
}
