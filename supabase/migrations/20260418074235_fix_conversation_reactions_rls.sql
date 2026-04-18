/*
  # Tighten conversation_reactions RLS

  1. Changes
    - Replace the permissive `client_id IS NOT NULL` policies created in the
      previous migration with header-scoped policies matching the pattern
      used on `conversations` and `conversation_turns`.
    - Each policy now uses the `x-client-id` request header so a client can
      only read, insert, update, or delete their own reaction rows.

  2. Security
    - RLS remains enabled.
    - No USING (true) policies remain on the table.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_reactions' AND policyname = 'Clients read own reactions') THEN
    DROP POLICY "Clients read own reactions" ON conversation_reactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_reactions' AND policyname = 'Clients insert own reactions') THEN
    DROP POLICY "Clients insert own reactions" ON conversation_reactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_reactions' AND policyname = 'Clients update own reactions') THEN
    DROP POLICY "Clients update own reactions" ON conversation_reactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_reactions' AND policyname = 'Clients delete own reactions') THEN
    DROP POLICY "Clients delete own reactions" ON conversation_reactions;
  END IF;
END $$;

CREATE POLICY "Clients read own reactions"
  ON conversation_reactions FOR SELECT
  TO anon, authenticated
  USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));

CREATE POLICY "Clients insert own reactions"
  ON conversation_reactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '')
    AND client_id <> ''
  );

CREATE POLICY "Clients update own reactions"
  ON conversation_reactions FOR UPDATE
  TO anon, authenticated
  USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
  WITH CHECK (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));

CREATE POLICY "Clients delete own reactions"
  ON conversation_reactions FOR DELETE
  TO anon, authenticated
  USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
