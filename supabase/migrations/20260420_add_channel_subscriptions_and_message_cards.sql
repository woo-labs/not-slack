create extension if not exists pgcrypto;

create table if not exists public.channel_subscriptions (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  provider text not null,
  external_id text not null,
  config jsonb not null default '{}'::jsonb,
  webhook_secret text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'channel_subscriptions_provider_check'
  ) then
    alter table public.channel_subscriptions
      add constraint channel_subscriptions_provider_check
      check (provider in ('linear', 'github'));
  end if;
end $$;

create unique index if not exists channel_subscriptions_unique_idx
  on public.channel_subscriptions (channel_id, provider, external_id);

alter table public.messages
  add column if not exists message_type text not null default 'text';

alter table public.messages
  add column if not exists metadata jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_message_type_check'
  ) then
    alter table public.messages
      add constraint messages_message_type_check
      check (message_type in ('text', 'integration_card'));
  end if;
end $$;

create index if not exists idx_messages_integration_issue_id
  on public.messages ((metadata->'issue'->>'id'))
  where message_type = 'integration_card';

insert into public.channels (name, type, topic)
select 'github-prs', 10, 'github-prs'
where not exists (
  select 1 from public.channels where name = 'github-prs' or topic = 'github-prs'
);

insert into public.channel_subscriptions (channel_id, provider, external_id, config)
select c.id, 'github', 'woo-labs/not-slack', '{}'::jsonb
from public.channels c
where c.name = 'github-prs' or c.topic = 'github-prs'
on conflict do nothing;
