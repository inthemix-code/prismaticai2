/*
  # Projects, memory, streaming chunks, structured synthesis

  1. New Tables
    - `projects` - user projects grouping conversations with optional persona
      - `id` (uuid, primary key)
      - `client_id` (text) - device-scoped ID for RLS
      - `name` (text)
      - `description` (text)
      - `color` (text) - hex color for UI
      - `system_persona` (text) - optional prompt prefix injected into every model call in project
      - `created_at`, `updated_at` (timestamptz)
    - `project_memory` - pinned facts scoped to a project, user-curated (opt-in)
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK projects)
      - `client_id` (text)
      - `fact` (text)
      - `source_turn_id` (uuid, nullable)
      - `pinned` (boolean, default true)
      - `created_at` (timestamptz)
    - `conversation_turn_chunks` - live streaming chunks for refresh-resume
      - `id` (uuid, primary key)
      - `turn_id` (uuid, FK conversation_turns)
      - `client_id` (text)
      - `platform` (text)
      - `content` (text)
      - `completed` (boolean)
      - `updated_at` (timestamptz)

  2. Modified Tables
    - `conversations` add `project_id` (uuid, nullable, FK projects)
    - `conversation_turns` add `fusion_structured` (jsonb) for sentence-level citations

  3. Security
    - Enable RLS on all new tables with client_id scoping
    - Separate SELECT/INSERT/UPDATE/DELETE policies mirroring existing pattern
    - Shared conversations: structured fusion inherits parent share visibility
*/

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id text not null default '',
  name text not null default 'Untitled project',
  description text not null default '',
  color text not null default '#22d3ee',
  system_persona text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_memory (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  client_id text not null default '',
  fact text not null default '',
  source_turn_id uuid,
  pinned boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists conversation_turn_chunks (
  id uuid primary key default gen_random_uuid(),
  turn_id uuid not null references conversation_turns(id) on delete cascade,
  client_id text not null default '',
  platform text not null default '',
  content text not null default '',
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'conversations' and column_name = 'project_id'
  ) then
    alter table conversations add column project_id uuid references projects(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'conversation_turns' and column_name = 'fusion_structured'
  ) then
    alter table conversation_turns add column fusion_structured jsonb;
  end if;
end $$;

create index if not exists projects_client_id_idx on projects(client_id);
create index if not exists projects_updated_at_idx on projects(updated_at desc);
create index if not exists project_memory_project_id_idx on project_memory(project_id);
create index if not exists project_memory_client_id_idx on project_memory(client_id);
create index if not exists conversations_project_id_idx on conversations(project_id);
create index if not exists turn_chunks_turn_id_idx on conversation_turn_chunks(turn_id);
create index if not exists turn_chunks_client_id_idx on conversation_turn_chunks(client_id);

alter table projects enable row level security;
alter table project_memory enable row level security;
alter table conversation_turn_chunks enable row level security;

do $$
begin
  -- projects policies
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Clients can view own projects') then
    create policy "Clients can view own projects" on projects for select
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Clients can insert own projects') then
    create policy "Clients can insert own projects" on projects for insert
      to anon, authenticated
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '') and client_id <> '');
  end if;

  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Clients can update own projects') then
    create policy "Clients can update own projects" on projects for update
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Clients can delete own projects') then
    create policy "Clients can delete own projects" on projects for delete
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  -- project_memory policies
  if not exists (select 1 from pg_policies where tablename='project_memory' and policyname='Clients can view own memory') then
    create policy "Clients can view own memory" on project_memory for select
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (select 1 from pg_policies where tablename='project_memory' and policyname='Clients can insert own memory') then
    create policy "Clients can insert own memory" on project_memory for insert
      to anon, authenticated
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '') and client_id <> '');
  end if;

  if not exists (select 1 from pg_policies where tablename='project_memory' and policyname='Clients can update own memory') then
    create policy "Clients can update own memory" on project_memory for update
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (select 1 from pg_policies where tablename='project_memory' and policyname='Clients can delete own memory') then
    create policy "Clients can delete own memory" on project_memory for delete
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  -- conversation_turn_chunks policies
  if not exists (select 1 from pg_policies where tablename='conversation_turn_chunks' and policyname='Clients can view own chunks') then
    create policy "Clients can view own chunks" on conversation_turn_chunks for select
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (select 1 from pg_policies where tablename='conversation_turn_chunks' and policyname='Clients can insert own chunks') then
    create policy "Clients can insert own chunks" on conversation_turn_chunks for insert
      to anon, authenticated
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '') and client_id <> '');
  end if;

  if not exists (select 1 from pg_policies where tablename='conversation_turn_chunks' and policyname='Clients can update own chunks') then
    create policy "Clients can update own chunks" on conversation_turn_chunks for update
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      with check (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  if not exists (select 1 from pg_policies where tablename='conversation_turn_chunks' and policyname='Clients can delete own chunks') then
    create policy "Clients can delete own chunks" on conversation_turn_chunks for delete
      to anon, authenticated
      using (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  end if;

  -- shared visibility for chunks of shared conversations
  if not exists (select 1 from pg_policies where tablename='conversation_turn_chunks' and policyname='Anyone can view chunks of shared conversations') then
    create policy "Anyone can view chunks of shared conversations" on conversation_turn_chunks for select
      to anon, authenticated
      using (
        exists (
          select 1 from conversation_turns ct
          join conversations c on c.id = ct.conversation_id
          where ct.id = conversation_turn_chunks.turn_id
          and c.is_shared = true
        )
      );
  end if;
end $$;
