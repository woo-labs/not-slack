import { create } from "zustand"

export interface Channel {
  id: string
  name: string | null
  type: number
  topic: string | null
  created_by: string | null
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  thread_id: string | null
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
  profiles?: { display_name: string; avatar_url: string | null }
}

interface ChatState {
  currentChannelId: string | null
  setCurrentChannelId: (id: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentChannelId: null,
  setCurrentChannelId: (id) => set({ currentChannelId: id }),
}))
