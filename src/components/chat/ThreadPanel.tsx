import { useState } from "react"
import { X, SendHorizontal, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LinearCard } from "./LinearCard"
import { useChatStore } from "@/stores/chatStore"
import { useThreadMessages, useSendThreadReply } from "@/hooks/useThreadMessages"
import type { Message } from "@/stores/chatStore"

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

function MessageRow({ msg }: { msg: Message }) {
  const displayName = msg.profiles?.display_name ?? msg.user_id.slice(0, 8)
  return (
    <div className="flex items-start gap-3 px-2 py-1">
      <Avatar className="h-8 w-8 mt-1 shrink-0">
        {msg.profiles?.avatar_url && <AvatarImage src={msg.profiles.avatar_url} />}
        <AvatarFallback className="bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold">{displayName}</span>
          <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
        </div>
        {msg.message_type === "integration_card" && msg.metadata ? (
          <LinearCard metadata={msg.metadata} />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        )}
      </div>
    </div>
  )
}

export function ThreadPanel({ channelId }: { channelId: string }) {
  const threadId = useChatStore((s) => s.currentThreadId)
  const closeThread = useChatStore((s) => s.closeThread)
  const { data: messages = [], isLoading } = useThreadMessages(threadId)
  const sendReply = useSendThreadReply(channelId, threadId ?? "")
  const [draft, setDraft] = useState("")

  if (!threadId) return null

  const parent = messages[0]
  const replies = messages.slice(1)

  const handleSend = () => {
    if (!draft.trim() || !threadId) return
    sendReply.mutate(draft.trim())
    setDraft("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex w-[420px] shrink-0 flex-col border-l">
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold">스레드</span>
          {!isLoading && (
            <span className="text-xs text-muted-foreground">
              {replies.length}개 답글
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeThread}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-2 py-2">
        {parent && <MessageRow msg={parent} />}
        {replies.length > 0 && (
          <div className="my-2 flex items-center gap-2 px-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {replies.length}개 답글
            </span>
            <Separator className="flex-1" />
          </div>
        )}
        {replies.map((msg) => (
          <MessageRow key={msg.id} msg={msg} />
        ))}
      </ScrollArea>

      <div className="px-3 pb-3 pt-2">
        <div className="flex items-end gap-1 rounded-lg border bg-background p-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="스레드에 답글…"
            rows={1}
            className="flex-1 min-h-[36px] max-h-[120px] resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
