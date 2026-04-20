import type { GitHubCardMetadata, IntegrationCardMetadataBase, Message } from "@/stores/chatStore"

export function isIntegrationCard(message: Message) {
  return message.message_type === "integration_card" && Boolean(message.metadata)
}

export function isGitHubMetadata(
  metadata: IntegrationCardMetadataBase | Message["metadata"] | null
): metadata is GitHubCardMetadata {
  return metadata != null && metadata.provider === "github"
}

export function getIntegrationReplyCount(message: Message) {
  const value = (message.metadata as any)?.issue?.reply_count
  return typeof value === "number" ? value : 0
}
