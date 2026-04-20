import { useEffect, useRef } from "react"
import { User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageActions } from "./MessageActions"
import { useMessages } from "@/hooks/useMessages"
import type { Message } from "@/stores/chatStore"
import { isIntegrationCard } from "@/lib/integrations"
import { useChatStore } from "@/stores/chatStore"
import { IntegrationCard } from "@/components/integrations/IntegrationCard"

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

function isSameGroup(prev: Message | undefined, curr: Message) {
  if (!prev || prev.user_id !== curr.user_id) return false
  const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()
  return diff < 60_000
}

export function MessageList({ channelId }: { channelId: string }) {
  const { data: messages = [] } = useMessages(channelId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const setOpenThreadMessageId = useChatStore((s) => s.setOpenThreadMessageId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <ScrollArea className="flex-1 px-4 py-2">
      <div className="flex flex-col">
        {messages.map((msg, i) => {
          const grouped = isSameGroup(messages[i - 1], msg)
          const displayName = msg.profiles?.display_name ?? msg.user_id.slice(0, 8)

          if (isIntegrationCard(msg)) {
            return (
              <div key={msg.id} className="group relative px-2 py-2">
                <IntegrationCard message={msg} onOpenThread={() => setOpenThreadMessageId(msg.id)} />
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
              </div>
              <MessageActions onOpenThread={() => setOpenThreadMessageId(msg.id)} />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
