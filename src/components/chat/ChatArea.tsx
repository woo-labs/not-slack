import { Hash, Search, Users, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageList } from "./MessageList"
import { MessageInput } from "./MessageInput"
import { useEffect } from "react"
import { useChatStore } from "@/stores/chatStore"
import { useChannels } from "@/hooks/useChannels"

export function ChatArea() {
  const currentChannelId = useChatStore((s) => s.currentChannelId)
  const setOpenThreadMessageId = useChatStore((s) => s.setOpenThreadMessageId)
  const { data: channels = [] } = useChannels()
  const channel = channels.find((c) => c.id === currentChannelId)

  useEffect(() => {
    setOpenThreadMessageId(null)
  }, [currentChannelId, setOpenThreadMessageId])

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        채널을 선택하거나 새로 만들어주세요
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold">{channel.name}</span>
          {channel.topic && (
            <span className="text-xs text-muted-foreground ml-1">
              {channel.topic}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Users className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pin className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <MessageList channelId={channel.id} />
      <MessageInput channelId={channel.id} channelName={channel.name ?? ""} />
    </div>
  )
}
