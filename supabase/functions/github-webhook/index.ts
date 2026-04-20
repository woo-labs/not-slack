import { createClient } from "jsr:@supabase/supabase-js@2"

const encoder = new TextEncoder()
const GITHUB_BOT_USER_ID = "22222222-2222-2222-2222-222222222222"

type GitHubWebhookPayload = Record<string, unknown> & {
  action?: string
  repository?: {
    full_name?: string
  }
  sender?: {
    login?: string
  }
  issue?: {
    id?: number
    number?: number
    title?: string
    html_url?: string
    body?: string
    user?: {
      login?: string
    }
    pull_request?: unknown
  }
  comment?: {
    id?: number
    body?: string
    html_url?: string
    user?: {
      login?: string
    }
  }
  review?: {
    id?: number
    body?: string
    state?: string
    user?: {
      login?: string
    }
  }
  pull_request?: {
    id?: number
    number?: number
    title?: string
    html_url?: string
    body?: string
    draft?: boolean
    merged?: boolean
    state?: string
    base?: {
      ref?: string
    }
    head?: {
      ref?: string
    }
    user?: {
      login?: string
    }
  }
}

type SubscriptionRow = {
  channel_id: string
}

type MessageRow = {
  id: string
  channel_id: string
  message_type: string
  metadata: any
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function sign(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  return `sha256=${toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(body)))}`
}

function truncate(text: string, limit = 160) {
  const normalized = text.replace(/\s+/g, " ").trim()
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized
}

function getRepoFullName(payload: GitHubWebhookPayload) {
  return payload.repository?.full_name ?? "unknown/unknown"
}

function getIssueThreadId(payload: GitHubWebhookPayload) {
  return String(payload.issue?.id ?? payload.pull_request?.id ?? "")
}

function isPullRequestComment(payload: GitHubWebhookPayload) {
  return Boolean(payload.issue?.pull_request)
}

function getIssueNumber(payload: GitHubWebhookPayload) {
  return payload.pull_request?.number ?? payload.issue?.number ?? 0
}

function getIssueTitle(payload: GitHubWebhookPayload) {
  return payload.pull_request?.title ?? payload.issue?.title ?? "Untitled PR"
}

function getIssueUrl(payload: GitHubWebhookPayload) {
  return payload.pull_request?.html_url ?? payload.issue?.html_url ?? ""
}

function getAuthorLogin(payload: GitHubWebhookPayload) {
  return (
    payload.pull_request?.user?.login ??
    payload.issue?.user?.login ??
    payload.sender?.login ??
    "github-bot"
  )
}

function getBranchInfo(payload: GitHubWebhookPayload) {
  return {
    baseBranch: payload.pull_request?.base?.ref ?? "unknown",
    headBranch: payload.pull_request?.head?.ref ?? "unknown",
  }
}

function buildRootMetadata(payload: GitHubWebhookPayload, event: string, action: string) {
  const issueId = getIssueThreadId(payload)
  const number = getIssueNumber(payload)
  const title = getIssueTitle(payload)
  const url = getIssueUrl(payload)
  const { baseBranch, headBranch } = getBranchInfo(payload)
  const state = payload.pull_request?.state ?? (event === "pull_request" && action === "closed" ? "closed" : "open")

  return {
    provider: "github",
    event_type: `${event}.${action}`,
    repository_full_name: getRepoFullName(payload),
    issue: {
      id: issueId,
      number,
      title,
      url,
      reply_count: 0,
      author_login: getAuthorLogin(payload),
      state,
      draft: Boolean(payload.pull_request?.draft),
      merged: Boolean(payload.pull_request?.merged),
      base_branch: baseBranch,
      head_branch: headBranch,
    },
  }
}

function buildReplyContent(payload: GitHubWebhookPayload, event: string, action: string) {
  if (event === "issue_comment") {
    const author = payload.comment?.user?.login ?? getAuthorLogin(payload)
    return truncate(`${author} commented: ${payload.comment?.body ?? ""}`)
  }

  if (event === "pull_request_review") {
    const author = payload.review?.user?.login ?? getAuthorLogin(payload)
    const state = payload.review?.state ?? "commented"
    return truncate(`${author} left a ${state.toLowerCase()} review: ${payload.review?.body ?? ""}`)
  }

  if (event === "pull_request") {
    const author = getAuthorLogin(payload)
    if (action === "synchronize") {
      return truncate(`${author} pushed new commits to ${payload.pull_request?.head?.ref ?? "the branch"}`)
    }
    if (action === "closed" && payload.pull_request?.merged) {
      return truncate(`${author} merged the pull request`)
    }
    if (action === "closed") {
      return truncate(`${author} closed the pull request`)
    }
    if (action === "ready_for_review") {
      return truncate(`${author} marked the pull request ready for review`)
    }
    if (action === "reopened") {
      return truncate(`${author} reopened the pull request`)
    }
    if (action === "edited") {
      return truncate(`${author} updated the pull request`)
    }
  }

  return truncate(`${getAuthorLogin(payload)} triggered ${event}.${action}`)
}

function shouldCreateRoot(event: string, action: string) {
  if (event === "pull_request") {
    return action === "opened" || action === "reopened" || action === "ready_for_review"
  }

  return event === "issue_comment" || event === "pull_request_review"
}

function shouldCreateReply(event: string, action: string) {
  if (event === "pull_request") {
    return action !== "opened"
  }

  return event === "issue_comment" || event === "pull_request_review"
}

async function getSubscribedChannels(
  supabase: ReturnType<typeof createClient>,
  repoFullName: string
) {
  const { data, error } = await supabase
    .from("channel_subscriptions")
    .select("channel_id")
    .eq("provider", "github")
    .eq("external_id", repoFullName)

  if (error) throw error
  return (data ?? []) as SubscriptionRow[]
}

async function findRootMessage(
  supabase: ReturnType<typeof createClient>,
  channelId: string,
  issueId: string
) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, channel_id, message_type, metadata")
    .eq("channel_id", channelId)
    .eq("message_type", "integration_card")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error

  return (data ?? []).find((message) => message.metadata?.issue?.id === issueId) as
    | MessageRow
    | undefined
}

async function createRootMessage(
  supabase: ReturnType<typeof createClient>,
  channelId: string,
  payload: GitHubWebhookPayload,
  event: string,
  action: string
) {
  const metadata = buildRootMetadata(payload, event, action)
  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      user_id: GITHUB_BOT_USER_ID,
      thread_id: null,
      message_type: "integration_card",
      content: metadata.issue.title,
      metadata,
    })
    .select("id, channel_id, message_type, metadata")
    .single()

  if (error) throw error
  return data as MessageRow
}

async function bumpRootReplyCount(
  supabase: ReturnType<typeof createClient>,
  rootMessage: MessageRow
) {
  const currentReplyCount = Number(rootMessage.metadata?.issue?.reply_count ?? 0)
  const nextMetadata = {
    ...(rootMessage.metadata ?? {}),
    issue: {
      ...(rootMessage.metadata?.issue ?? {}),
      reply_count: currentReplyCount + 1,
    },
  }

  const { error } = await supabase
    .from("messages")
    .update({ metadata: nextMetadata })
    .eq("id", rootMessage.id)

  if (error) throw error
}

async function updateRootMetadata(
  supabase: ReturnType<typeof createClient>,
  rootMessage: MessageRow,
  payload: GitHubWebhookPayload,
  event: string,
  action: string
) {
  const existingReplyCount = Number(rootMessage.metadata?.issue?.reply_count ?? 0)
  const nextMetadata = buildRootMetadata(payload, event, action)
  nextMetadata.issue.reply_count = existingReplyCount

  const { error } = await supabase
    .from("messages")
    .update({ metadata: nextMetadata, content: nextMetadata.issue.title })
    .eq("id", rootMessage.id)

  if (error) throw error
}

Deno.serve(async (req) => {
  const githubSecret = Deno.env.get("GITHUB_WEBHOOK_SECRET")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!githubSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing required env vars", { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get("x-hub-signature-256")
  const event = req.headers.get("x-github-event") ?? ""

  if (!signature || signature !== (await sign(githubSecret, rawBody))) {
    return new Response("Invalid signature", { status: 401 })
  }

  const payload = JSON.parse(rawBody) as GitHubWebhookPayload
  const action = payload.action ?? "unknown"
  const repoFullName = getRepoFullName(payload)
  const issueId = getIssueThreadId(payload)

  if (!issueId || repoFullName === "unknown/unknown") {
    return new Response("Unsupported payload", { status: 400 })
  }

  if (!["pull_request", "issue_comment", "pull_request_review"].includes(event)) {
    return new Response("Ignored", { status: 202 })
  }

  if (event === "issue_comment" && !isPullRequestComment(payload)) {
    return new Response("Ignored", { status: 202 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  const subscriptions = await getSubscribedChannels(supabase, repoFullName)

  if (subscriptions.length === 0) {
    return new Response("No subscriptions for repository", { status: 202 })
  }

  for (const subscription of subscriptions) {
    let rootMessage = await findRootMessage(supabase, subscription.channel_id, issueId)

    if (!rootMessage && shouldCreateRoot(event, action)) {
      rootMessage = await createRootMessage(supabase, subscription.channel_id, payload, event, action)
    }

    if (!rootMessage) {
      continue
    }

    if (shouldCreateReply(event, action)) {
      const replyContent = buildReplyContent(payload, event, action)

      const { error: replyError } = await supabase.from("messages").insert({
        channel_id: subscription.channel_id,
        user_id: GITHUB_BOT_USER_ID,
        thread_id: rootMessage.id,
        message_type: "text",
        metadata: {
          provider: "github",
          event_type: `${event}.${action}`,
          issue: {
            id: issueId,
          },
        },
        content: replyContent,
      })

      if (replyError) {
        return new Response(`Failed to insert reply: ${replyError.message}`, { status: 500 })
      }

      await bumpRootReplyCount(supabase, rootMessage)
    }

    if (event === "pull_request") {
      await updateRootMetadata(supabase, rootMessage, payload, event, action)
    }
  }

  return Response.json({ ok: true })
})
