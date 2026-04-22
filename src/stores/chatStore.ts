import { create } from "zustand"

export interface Channel {
  id: string
  name: string | null
  type: number
  topic: string | null
  created_by: string | null
  created_at: string
}

export type MessageType = "text" | "integration_card"

export type IntegrationProvider = "github" | "linear"

export interface IntegrationCardMetadataBase {
  provider: IntegrationProvider
  issue: {
    id: string
    title: string
    url: string
    reply_count?: number
  }
  event_type: string
}

export interface GitHubCardMetadata extends IntegrationCardMetadataBase {
  provider: "github"
  repository_full_name: string
  issue: IntegrationCardMetadataBase["issue"] & {
    number: number
    author_login: string
    state: string
    draft: boolean
    merged: boolean
    base_branch: string
    head_branch: string
  }
}

export interface LinearCardMetadata extends IntegrationCardMetadataBase {
  provider: "linear"
  issue: IntegrationCardMetadataBase["issue"] & {
    identifier: string
    status: string
  }
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  thread_id: string | null
  message_type: MessageType
  content: string
  metadata: GitHubCardMetadata | LinearCardMetadata | null
  is_edited: boolean
  created_at: string
  updated_at: string
  profiles?: { display_name: string; avatar_url: string | null }
}

interface ChatState {
  currentChannelId: string | null
  setCurrentChannelId: (id: string | null) => void
  openThreadMessageId: string | null
  setOpenThreadMessageId: (id: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentChannelId: null,
  setCurrentChannelId: (id) => set({ currentChannelId: id }),
  openThreadMessageId: null,
  setOpenThreadMessageId: (id) => set({ openThreadMessageId: id }),
}))
