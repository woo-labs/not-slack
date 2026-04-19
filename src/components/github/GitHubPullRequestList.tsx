import { ExternalLink, GitPullRequest, GitMerge, CircleDot } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGitHubPullRequests } from "@/hooks/useGitHubPullRequests"
import type { GitHubPullRequestEvent } from "@/stores/chatStore"

function formatDate(date: string) {
  return new Date(date).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getActionLabel(event: GitHubPullRequestEvent) {
  if (event.merged) return "merged"
  if (event.draft) return "draft"
  return event.action
}

function getStateIcon(event: GitHubPullRequestEvent) {
  if (event.merged) {
    return <GitMerge className="h-4 w-4 text-violet-600" />
  }

  if (event.state === "open") {
    return <GitPullRequest className="h-4 w-4 text-emerald-600" />
  }

  return <CircleDot className="h-4 w-4 text-slate-500" />
}

export function GitHubPullRequestList({ channelId }: { channelId: string }) {
  const { data: events = [], isLoading } = useGitHubPullRequests(channelId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        GitHub PR 목록을 불러오는 중입니다
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        아직 들어온 GitHub PR 이벤트가 없습니다. GitHub webhook을 연결하면 여기에 PR이 쌓입니다.
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 px-4 py-4">
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getStateIcon(event)}
                  <span className="truncate font-medium text-foreground">
                    {event.repository_full_name}
                  </span>
                  <Badge variant="secondary">{getActionLabel(event)}</Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    #{event.pr_number} {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {event.author_login} opened `{event.head_branch}` into `{event.base_branch}`
                  </p>
                </div>
              </div>
              <a
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Open pull request on GitHub"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={event.merged ? "default" : "outline"}>{event.state}</Badge>
              {event.draft && <Badge variant="outline">draft</Badge>}
              <span>{formatDate(event.created_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </ScrollArea>
  )
}
