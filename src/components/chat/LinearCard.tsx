import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { LinearCardMetadata } from "@/stores/chatStore"

function StateBadge({ state }: { state?: { name: string; color?: string } }) {
  if (!state) return null
  return (
    <Badge
      variant="outline"
      className="gap-1.5"
      style={state.color ? { borderColor: state.color } : undefined}
    >
      {state.color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: state.color }}
        />
      )}
      {state.name}
    </Badge>
  )
}

function IssueLink({ identifier, title, url }: { identifier: string; title: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-baseline gap-1.5 hover:underline"
    >
      <span className="font-mono text-xs text-muted-foreground">{identifier}</span>
      <span className="font-medium">{title}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground self-center" />
    </a>
  )
}

function headline(meta: LinearCardMetadata): string {
  switch (meta.event_type) {
    case "issue.created":
      return "New issue created"
    case "issue.removed":
      return "Issue removed"
    case "issue.status_changed":
      return "Status changed"
    case "issue.completed":
      return "Issue completed"
    case "issue.canceled":
      return "Issue canceled"
    case "issue.assigned":
      return "Assignee changed"
    case "issue.priority_changed":
      return "Priority changed"
    case "comment.created":
      return `${meta.comment.user?.name ?? "Someone"} commented`
  }
}

export function LinearCard({ metadata }: { metadata: LinearCardMetadata }) {
  const isComment = metadata.event_type === "comment.created"

  return (
    <div className="mt-0.5 max-w-xl rounded-md border border-border bg-background/50 px-3 py-2">
      <div className="mb-1.5 text-xs text-muted-foreground">{headline(metadata)}</div>

      <IssueLink
        identifier={metadata.issue.identifier}
        title={metadata.issue.title}
        url={metadata.issue.url}
      />

      {!isComment && "state" in metadata.issue && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StateBadge state={metadata.issue.state} />
          {metadata.issue.priorityLabel && metadata.issue.priorityLabel !== "No priority" && (
            <Badge variant="secondary">{metadata.issue.priorityLabel}</Badge>
          )}
          {metadata.issue.assignee && (
            <span className="text-xs text-muted-foreground">
              Assignee: <span className="text-foreground">{metadata.issue.assignee.name}</span>
            </span>
          )}
        </div>
      )}

      {isComment && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-4">
          {metadata.comment.body}
        </p>
      )}
    </div>
  )
}
