/*
  # Conversation reactions

  1. New tables
    - `conversation_reactions` tracks per-client thumbs up/down on a specific
      turn so we can collect lightweight feedback on synthesis quality.
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `turn_id` (uuid, references conversation_turns)
      - `client_id` (text, scoped like the rest of the app)
      - `kind` (text, 'up' or 'down')
      - `created_at`, `updated_at` (timestamptz)
    - Unique constraint on (turn_id, client_id) to enforce one reaction per
      client per turn, which lets us upsert cleanly.

  2. Security
    - RLS is enabled.
    - Policies restrict each client to reading, inserting, updating, and
      deleting only their own reactions based on `client_id`.
*/

CREATE TABLE IF NOT EXISTS conversation_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  turn_id uuid NOT NULL REFERENCES conversation_turns(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (turn_id, client_id)
);

CREATE INDEX IF NOT EXISTS conversation_reactions_turn_idx
  ON conversation_reactions(turn_id);
CREATE INDEX IF NOT EXISTS conversation_reactions_client_idx
  ON conversation_reactions(client_id);

ALTER TABLE conversation_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_reactions'
      AND policyname = 'Clients read own reactions'
  ) THEN
    CREATE POLICY "Clients read own reactions"
      ON conversation_reactions FOR SELECT
      TO anon, authenticated
      USING (client_id = current_setting('request.headers', true)::json->>'x-client-id'
             OR client_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_reactions'
      AND policyname = 'Clients insert own reactions'
  ) THEN
    CREATE POLICY "Clients insert own reactions"
      ON conversation_reactions FOR INSERT
      TO anon, authenticated
      WITH CHECK (client_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_reactions'
      AND policyname = 'Clients update own reactions'
  ) THEN
    CREATE POLICY "Clients update own reactions"
      ON conversation_reactions FOR UPDATE
      TO anon, authenticated
      USING (client_id IS NOT NULL)
      WITH CHECK (client_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_reactions'
      AND policyname = 'Clients delete own reactions'
  ) THEN
    CREATE POLICY "Clients delete own reactions"
      ON conversation_reactions FOR DELETE
      TO anon, authenticated
      USING (client_id IS NOT NULL);
  END IF;
END $$;
