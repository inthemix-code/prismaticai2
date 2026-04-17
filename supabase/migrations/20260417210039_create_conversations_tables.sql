/*
  # Conversations persistence schema

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key) - unique conversation identifier
      - `client_id` (text) - device-scoped anonymous identifier used for RLS
      - `title` (text) - short label derived from first prompt
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp
    - `conversation_turns`
      - `id` (uuid, primary key) - unique turn identifier
      - `conversation_id` (uuid, foreign key) - references conversations
      - `client_id` (text) - device-scoped anonymous identifier used for RLS
      - `turn_index` (int) - order of turn within conversation
      - `prompt` (text) - user prompt text
      - `responses` (jsonb) - array of AI responses
      - `analysis_data` (jsonb) - analytics payload
      - `fusion_result` (jsonb) - synthesized response payload
      - `completed` (boolean) - whether turn finished
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on both tables
    - Policies scoped to anonymous device identifier via request header "x-client-id"
    - Authenticated and anonymous users can manage only their own rows (matching client_id)

  3. Notes
    - Uses anon + header-based scoping so the existing unauthenticated app can persist
      per-device without requiring sign-in.
    - All policies are restrictive by default; no blanket USING (true) is permitted.
*/

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  client_id text not null default '',
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversation_turns (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  client_id text not null default '',
  turn_index int not null default 0,
  prompt text not null default '',
  responses jsonb not null default '[]'::jsonb,
  analysis_data jsonb,
  fusion_result jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists conversations_client_id_idx on conversations(client_id);
create index if not exists conversations_updated_at_idx on conversations(updated_at desc);
create index if not exists conversation_turns_conversation_id_idx on conversation_turns(conversation_id);
create index if not exists conversation_turns_client_id_idx on conversation_turns(client_id);

alter table conversations enable row level security;
alter table conversation_turns enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'conversations' and policyname = 'Clients can view own conversations'
  ) then
    create policy "Clients can view own conversations"
      on conversations for select
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversations' and policyname = 'Clients can insert own conversations'
  ) then
    create policy "Clients can insert own conversations"
      on conversations for insert
      to anon, authenticated
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '') and client_id <> '');
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversations' and policyname = 'Clients can update own conversations'
  ) then
    create policy "Clients can update own conversations"
      on conversations for update
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversations' and policyname = 'Clients can delete own conversations'
  ) then
    create policy "Clients can delete own conversations"
      on conversations for delete
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversation_turns' and policyname = 'Clients can view own turns'
  ) then
    create policy "Clients can view own turns"
      on conversation_turns for select
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversation_turns' and policyname = 'Clients can insert own turns'
  ) then
    create policy "Clients can insert own turns"
      on conversation_turns for insert
      to anon, authenticated
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '') and client_id <> '');
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversation_turns' and policyname = 'Clients can update own turns'
  ) then
    create policy "Clients can update own turns"
      on conversation_turns for update
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversation_turns' and policyname = 'Clients can delete own turns'
  ) then
    create policy "Clients can delete own turns"
      on conversation_turns for delete
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;
end $$;
