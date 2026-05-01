import { useState } from "react"
import { SendHorizontal, Plus, Smile, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSendMessage } from "@/hooks/useMessages"
import { useSendThreadReply } from "@/hooks/useThreads"

export function MessageInput({
  channelId,
  channelName,
  threadId,
  placeholder,
}: {
  channelId: string
  channelName: string
  threadId?: string | null
  placeholder?: string
}) {
  const [content, setContent] = useState("")
  const sendMessage = useSendMessage(channelId)
  const sendThreadReply = useSendThreadReply(channelId, threadId ?? null)

  const handleSend = () => {
    if (!content.trim()) return
    if (threadId) {
      sendThreadReply.mutate(content.trim())
    } else {
      sendMessage.mutate(content.trim())
    }
    setContent("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-end gap-1 rounded-lg border bg-background p-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </Button>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? `#${channelName}에 메시지 보내기`}
          rows={1}
          className="flex-1 min-h-[36px] max-h-[120px] resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <AtSign className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Smile className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSend}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
