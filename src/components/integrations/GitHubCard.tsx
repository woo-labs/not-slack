import { ExternalLink, GitPullRequest, GitMerge, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Message } from "@/stores/chatStore"
import { getIntegrationReplyCount, isGitHubMetadata } from "@/lib/integrations"

function formatDate(date: string) {
  return new Date(date).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function GitHubCard({
  message,
  compact = false,
  onOpenThread,
}: {
  message: Message
  compact?: boolean
  onOpenThread?: () => void
}) {
  const metadata = isGitHubMetadata(message.metadata) ? message.metadata : null

  if (!metadata) {
    return null
  }

  const replyCount = getIntegrationReplyCount(message)
  const merged = metadata.issue.merged

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitPullRequest className="h-4 w-4 text-emerald-600" />
            <span className="truncate font-medium text-foreground">
              {metadata.repository_full_name}
            </span>
            <Badge variant="secondary">{metadata.event_type}</Badge>
          </div>
          <div className="space-y-1">
            <h3 className={`${compact ? "text-sm" : "text-base"} font-semibold text-foreground`}>
              #{metadata.issue.number} {metadata.issue.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {metadata.issue.author_login} opened <code>{metadata.issue.head_branch}</code> into{" "}
              <code>{metadata.issue.base_branch}</code>
            </p>
          </div>
        </div>
        <a
          href={metadata.issue.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          aria-label="Open pull request on GitHub"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={merged ? "default" : "outline"}>{metadata.issue.state}</Badge>
        {metadata.issue.draft && <Badge variant="outline">draft</Badge>}
        {merged && (
          <Badge variant="secondary" className="gap-1">
            <GitMerge className="h-3 w-3" />
            merged
          </Badge>
        )}
        <span>{formatDate(message.created_at)}</span>
      </div>

      {onOpenThread && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={onOpenThread}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {replyCount > 0 ? `${replyCount} replies` : "Open thread"}
          </Button>
        </div>
      )}
    </article>
  )
}
