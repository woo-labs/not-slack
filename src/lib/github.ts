import type { Channel } from "@/stores/chatStore"

export const GITHUB_PR_CHANNEL_TOPIC = "github-prs"
export const GITHUB_PR_CHANNEL_NAME = "github-prs"

export function isGitHubPrChannel(channel: Channel | null | undefined) {
  if (!channel) return false

  return (
    channel.topic === GITHUB_PR_CHANNEL_TOPIC ||
    channel.name === GITHUB_PR_CHANNEL_NAME
  )
}
