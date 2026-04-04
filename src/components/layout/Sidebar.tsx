import { useState } from "react"
import { Hash, Plus, ChevronDown, LogOut, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useChatStore } from "@/stores/chatStore"
import { useAuthStore } from "@/stores/authStore"
import { useChannels, useCreateChannel } from "@/hooks/useChannels"

export function Sidebar() {
  const { currentChannelId, setCurrentChannelId } = useChatStore()
  const user = useAuthStore((s) => s.user)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [channelName, setChannelName] = useState("")

  const { data: channels = [] } = useChannels()
  const createChannel = useCreateChannel()

  const handleCreate = async () => {
    if (!channelName.trim()) return

    const data = await createChannel.mutateAsync(channelName.trim())
    setCurrentChannelId(data.id)
    setChannelName("")
    setDialogOpen(false)
  }

  const handleLogout = () => {
    supabase.auth.signOut()
  }

  const publicChannels = channels.filter((c) => c.type === 10)
  const dmChannels = channels.filter((c) => c.type === 30)

  // 첫 채널 자동 선택
  if (!currentChannelId && channels.length > 0) {
    setCurrentChannelId(channels[0].id)
  }

  return (
    <div className="flex h-full w-60 flex-col bg-[#4A154B] text-gray-300">
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/15 shadow-sm">
        <button className="flex items-center gap-1 font-bold text-white text-base hover:opacity-80 transition-opacity">
          Not Slack
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
            Channels
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {publicChannels.map((ch) => (
          <Button
            key={ch.id}
            variant="ghost"
            className={`w-full justify-start gap-2 px-2 h-7 text-sm hover:bg-white/10 ${
              currentChannelId === ch.id
                ? "bg-[#1164A3] text-white"
                : "text-gray-300/80"
            }`}
            onClick={() => setCurrentChannelId(ch.id)}
          >
            <Hash className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left truncate">{ch.name}</span>
          </Button>
        ))}

        {dmChannels.length > 0 && (
          <>
            <Separator className="my-3 bg-white/10" />
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                Direct Messages
              </span>
            </div>
            {dmChannels.map((ch) => (
              <Button
                key={ch.id}
                variant="ghost"
                className={`w-full justify-start gap-2 px-2 h-7 text-sm hover:bg-white/10 ${
                  currentChannelId === ch.id
                    ? "bg-[#1164A3] text-white"
                    : "text-gray-300/80"
                }`}
                onClick={() => setCurrentChannelId(ch.id)}
              >
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-gray-600">
                    <User className="h-3 w-3 text-gray-300" />
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left truncate">{ch.name}</span>
              </Button>
            ))}
          </>
        )}
      </ScrollArea>

      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/15">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-white/20">
            <User className="h-4 w-4 text-white" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user?.email?.split("@")[0]}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>채널 만들기</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="channel-name">채널 이름</Label>
            <Input
              id="channel-name"
              placeholder="예: design, marketing"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={!channelName.trim() || createChannel.isPending}>
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
