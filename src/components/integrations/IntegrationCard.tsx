import type { Message } from "@/stores/chatStore"
import { GitHubCard } from "./GitHubCard"

export function IntegrationCard({
  message,
  compact = false,
  onOpenThread,
}: {
  message: Message
  compact?: boolean
  onOpenThread?: () => void
}) {
  const provider = message.metadata?.provider

  if (provider === "github") {
    return <GitHubCard message={message} compact={compact} onOpenThread={onOpenThread} />
  }

  return (
    <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
      {provider ?? "integration"} 이벤트
    </div>
  )
}
