import { createClient } from "jsr:@supabase/supabase-js@2"

const encoder = new TextEncoder()

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

Deno.serve(async (req) => {
  const githubSecret = Deno.env.get("GITHUB_WEBHOOK_SECRET")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!githubSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing required env vars", { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get("x-hub-signature-256")
  const event = req.headers.get("x-github-event")

  if (!signature || signature !== await sign(githubSecret, rawBody)) {
    return new Response("Invalid signature", { status: 401 })
  }

  if (event !== "pull_request") {
    return new Response("Ignored", { status: 202 })
  }

  const payload = JSON.parse(rawBody)
  const pullRequest = payload.pull_request

  if (!pullRequest) {
    return new Response("Missing pull_request payload", { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: existingChannel, error: existingChannelError } = await supabase
    .from("channels")
    .select("id")
    .or("topic.eq.github-prs,name.eq.github-prs")
    .limit(1)
    .maybeSingle()

  if (existingChannelError) {
    return new Response(`Failed to load channel: ${existingChannelError.message}`, { status: 500 })
  }

  let channelId = existingChannel?.id

  if (!channelId) {
    const { data: createdChannel, error: channelError } = await supabase
      .from("channels")
      .insert({
        name: "github-prs",
        type: 10,
        topic: "github-prs",
      })
      .select("id")
      .single()

    if (channelError) {
      return new Response(`Failed to prepare channel: ${channelError.message}`, { status: 500 })
    }

    channelId = createdChannel.id
  }

  const { error: insertError } = await supabase.from("github_pr_events").insert({
    channel_id: channelId,
    repository_full_name: payload.repository?.full_name ?? "unknown/unknown",
    action: payload.action ?? "unknown",
    pr_number: pullRequest.number,
    title: pullRequest.title ?? "Untitled PR",
    url: pullRequest.html_url ?? pullRequest.url,
    author_login: pullRequest.user?.login ?? "unknown",
    base_branch: pullRequest.base?.ref ?? "unknown",
    head_branch: pullRequest.head?.ref ?? "unknown",
    state: pullRequest.state ?? "unknown",
    draft: Boolean(pullRequest.draft),
    merged: Boolean(pullRequest.merged),
    payload,
  })

  if (insertError) {
    return new Response(`Failed to insert event: ${insertError.message}`, { status: 500 })
  }

  return Response.json({ ok: true })
})
