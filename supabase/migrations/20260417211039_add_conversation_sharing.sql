/*
  # Add shareable conversations

  1. Changes
    - Add `is_shared` boolean column to `conversations` (default false)
    - Add public read policies so anyone with a permalink can view a conversation
      that has been explicitly shared by its owner

  2. Security
    - Owners (matching client_id header) retain full CRUD access
    - Anonymous visitors can only SELECT rows where `is_shared = true` (conversations)
      or where the parent conversation has `is_shared = true` (conversation_turns)
    - Writes remain strictly owner-only
*/

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'conversations' and column_name = 'is_shared'
  ) then
    alter table conversations add column is_shared boolean not null default false;
  end if;
end $$;

create index if not exists conversations_is_shared_idx on conversations(is_shared) where is_shared = true;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'conversations' and policyname = 'Anyone can view shared conversations'
  ) then
    create policy "Anyone can view shared conversations"
      on conversations for select
      to anon, authenticated
      using (is_shared = true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'conversation_turns' and policyname = 'Anyone can view turns of shared conversations'
  ) then
    create policy "Anyone can view turns of shared conversations"
      on conversation_turns for select
      to anon, authenticated
      using (
        exists (
          select 1 from conversations c
          where c.id = conversation_turns.conversation_id
          and c.is_shared = true
        )
      );
  end if;
end $$;
