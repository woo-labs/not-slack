import { useEffect, useRef } from "react"
import { MessageSquare, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageActions } from "./MessageActions"
import { LinearCard } from "./LinearCard"
import { useMessages } from "@/hooks/useMessages"
import { useChatStore } from "@/stores/chatStore"
import type { Message } from "@/stores/chatStore"
import { isIntegrationCard } from "@/lib/integrations"
import { IntegrationCard } from "@/components/integrations/IntegrationCard"

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

function isSameGroup(prev: Message | undefined, curr: Message) {
  if (!prev || prev.user_id !== curr.user_id) return false
  if (curr.message_type !== "text" || prev.message_type !== "text") return false
  const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()
  return diff < 60_000
}

export function MessageList({ channelId }: { channelId: string }) {
  const { data: messages = [] } = useMessages(channelId)
  const openThread = useChatStore((s) => s.openThread)
  const currentThreadId = useChatStore((s) => s.currentThreadId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <ScrollArea className="flex-1 min-h-0 px-4 py-2">
      <div className="flex flex-col">
        {messages.map((msg, i) => {
          const grouped = isSameGroup(messages[i - 1], msg)
          const displayName = msg.profiles?.display_name ?? msg.user_id.slice(0, 8)

          if (isIntegrationCard(msg)) {
            if (msg.metadata?.provider === "github") {
              return (
                <div key={msg.id} className="group relative px-2 py-2">
                  <IntegrationCard message={msg} onOpenThread={() => openThread(msg.id)} />
                </div>
              )
            }

            if (msg.metadata?.provider === "linear") {
              return (
                <div key={msg.id} className="group relative px-2 py-2">
                  <LinearCard metadata={msg.metadata} />
                </div>
              )
            }

            return (
              <div key={msg.id} className="group relative px-2 py-2">
                <IntegrationCard message={msg} onOpenThread={() => openThread(msg.id)} />
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className="group relative flex items-start gap-3 rounded-md px-2 py-0.5 hover:bg-accent"
            >
              {grouped ? (
                <div className="w-8 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTime(msg.created_at).split(" ")[1]}
                  </span>
                </div>
              ) : (
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  {msg.profiles?.avatar_url && <AvatarImage src={msg.profiles.avatar_url} />}
                  <AvatarFallback className="bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                {!grouped && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold hover:underline cursor-pointer">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                )}
                <p className="text-sm">{msg.content}</p>
                {(msg.reply_count ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => openThread(msg.id)}
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium text-primary hover:border-border hover:bg-background ${
                      currentThreadId === msg.id ? "border-border bg-background" : ""
                    }`}
                  >
                    <MessageSquare className="h-3 w-3" />
                    {msg.reply_count}개 답글
                  </button>
                )}
              </div>
              <MessageActions onReply={() => openThread(msg.id)} />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
