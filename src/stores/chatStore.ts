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

export interface LinearIssueRef {
  id?: string
  identifier: string
  title: string
  url: string
}

export interface LinearStateRef {
  name: string
  type: string
  color?: string
}

export interface LinearUserRef {
  id?: string
  name: string
  avatarUrl?: string | null
}

export type LinearCardMetadata =
  | {
      provider: "linear"
      event_type:
        | "issue.created"
        | "issue.removed"
        | "issue.status_changed"
        | "issue.completed"
        | "issue.canceled"
        | "issue.assigned"
        | "issue.priority_changed"
      issue: LinearIssueRef & {
        state?: LinearStateRef
        priority?: number
        priorityLabel?: string
        assignee?: LinearUserRef | null
        team?: { id?: string; name?: string; key?: string }
      }
      changes?: Record<string, unknown>
    }
  | {
      provider: "linear"
      event_type: "comment.created"
      issue: LinearIssueRef
      comment: { id?: string; body: string; user?: LinearUserRef }
    }

export type MessageMetadata = GitHubCardMetadata | LinearCardMetadata

export interface Message {
  id: string
  channel_id: string
  user_id: string
  thread_id: string | null
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
  message_type: MessageType
  metadata: MessageMetadata | null
  reply_count?: number
  profiles?: { display_name: string; avatar_url: string | null }
}

interface ChatState {
  currentChannelId: string | null
  setCurrentChannelId: (id: string | null) => void
  currentThreadId: string | null
  openThread: (id: string) => void
  closeThread: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentChannelId: null,
  setCurrentChannelId: (id) => set({ currentChannelId: id, currentThreadId: null }),
  currentThreadId: null,
  openThread: (id) => set({ currentThreadId: id }),
  closeThread: () => set({ currentThreadId: null }),
}))
