import { SmilePlus, MessageSquareText, MoreHorizontal, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MessageActions({ onOpenThread }: { onOpenThread?: () => void }) {
  return (
    <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-0.5 rounded-md border bg-background shadow-sm p-0.5">
      <Button variant="ghost" size="icon" className="h-7 w-7" title="이모지 추가">
        <SmilePlus className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title="스레드에서 답글"
        onClick={onOpenThread}
      >
        <MessageSquareText className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="북마크">
        <Bookmark className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="더보기">
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  )
}
