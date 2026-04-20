import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageInput } from "./MessageInput"
import { IntegrationCard } from "@/components/integrations/IntegrationCard"
import { useThreadMessages } from "@/hooks/useThreads"
import { useChatStore } from "@/stores/chatStore"
import { User } from "lucide-react"

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

export function ThreadPanel() {
  const openThreadMessageId = useChatStore((s) => s.openThreadMessageId)
  const setOpenThreadMessageId = useChatStore((s) => s.setOpenThreadMessageId)
  const { data, isLoading } = useThreadMessages(openThreadMessageId)

  if (!openThreadMessageId) {
    return null
  }

  if (isLoading || !data?.parent) {
    return (
      <aside className="flex h-full w-[360px] shrink-0 flex-col border-l bg-background">
        <div className="flex h-12 items-center justify-between border-b px-4">
          <p className="text-sm font-semibold">Thread</p>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpenThreadMessageId(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          스레드를 불러오는 중입니다
        </div>
      </aside>
    )
  }

  const { parent, replies, channelId } = data

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l bg-background">
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div>
          <p className="text-sm font-semibold">Thread</p>
          <p className="text-xs text-muted-foreground">
            {replies.length} replies
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpenThreadMessageId(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {parent.message_type === "integration_card" ? (
            <IntegrationCard message={parent} compact />
          ) : (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  {parent.profiles?.avatar_url && <AvatarImage src={parent.profiles.avatar_url} />}
                  <AvatarFallback className="bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{parent.profiles?.display_name ?? parent.user_id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(parent.created_at)}</span>
                  </div>
                  <p className="text-sm">{parent.content}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-3 rounded-lg px-1 py-1">
                <Avatar className="h-7 w-7">
                  {reply.profiles?.avatar_url && <AvatarImage src={reply.profiles.avatar_url} />}
                  <AvatarFallback className="bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">
                      {reply.profiles?.display_name ?? reply.user_id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <MessageInput
        channelId={channelId}
        channelName="thread"
        threadId={parent.id}
        placeholder="답글을 입력하세요"
      />
    </aside>
  )
}
