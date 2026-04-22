create extension if not exists pgcrypto;

create table if not exists public.github_pr_events (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  repository_full_name text not null,
  action text not null,
  pr_number integer not null,
  title text not null,
  url text not null,
  author_login text not null,
  base_branch text not null,
  head_branch text not null,
  state text not null,
  draft boolean not null default false,
  merged boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists github_pr_events_channel_created_at_idx
  on public.github_pr_events (channel_id, created_at desc);

alter table public.github_pr_events enable row level security;

create policy "authenticated users can read github pr events"
  on public.github_pr_events
  for select
  to authenticated
  using (true);

create policy "service role can insert github pr events"
  on public.github_pr_events
  for insert
  to service_role
  with check (true);

insert into public.channels (name, type, topic)
select 'github-prs', 10, 'github-prs'
where not exists (
  select 1
  from public.channels
  where topic = 'github-prs' or name = 'github-prs'
);
