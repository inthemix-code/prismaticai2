/*
  # Results page optimizations

  1. Changes to existing tables
    - `user_ui_preferences`
      - Add `reading_width` (text, default 'comfortable', values 'narrow' | 'comfortable' | 'wide') to control the content column width on the results page.

  2. New tables
    - `conversation_scroll_positions`
      - `id` (uuid, primary key)
      - `client_id` (text, not null) — anonymous client identifier
      - `conversation_id` (text, not null) — conversation being tracked
      - `turn_index` (integer, default 0) — the turn index the user was last viewing
      - `scroll_offset` (integer, default 0) — pixel offset within the turn
      - `updated_at` (timestamptz, default now())
      - Unique (`client_id`, `conversation_id`) so upserts keep a single row per client/conversation pair.

  3. Security
    - Enable RLS on `conversation_scroll_positions`.
    - Policies scope all access to the current client, mirroring the existing UI preferences pattern (header `x-client-id`).
    - Separate policies for select, insert, update, and delete.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ui_preferences' AND column_name = 'reading_width'
  ) THEN
    ALTER TABLE user_ui_preferences
      ADD COLUMN reading_width text NOT NULL DEFAULT 'comfortable'
      CHECK (reading_width IN ('narrow', 'comfortable', 'wide'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS conversation_scroll_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  conversation_id text NOT NULL,
  turn_index integer NOT NULL DEFAULT 0,
  scroll_offset integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS conversation_scroll_positions_client_conv_idx
  ON conversation_scroll_positions (client_id, conversation_id);

ALTER TABLE conversation_scroll_positions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_scroll_positions' AND policyname = 'Client can read own scroll positions'
  ) THEN
    CREATE POLICY "Client can read own scroll positions"
      ON conversation_scroll_positions FOR SELECT
      TO anon, authenticated
      USING (client_id = current_setting('request.headers', true)::json ->> 'x-client-id');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_scroll_positions' AND policyname = 'Client can insert own scroll positions'
  ) THEN
    CREATE POLICY "Client can insert own scroll positions"
      ON conversation_scroll_positions FOR INSERT
      TO anon, authenticated
      WITH CHECK (client_id = current_setting('request.headers', true)::json ->> 'x-client-id');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_scroll_positions' AND policyname = 'Client can update own scroll positions'
  ) THEN
    CREATE POLICY "Client can update own scroll positions"
      ON conversation_scroll_positions FOR UPDATE
      TO anon, authenticated
      USING (client_id = current_setting('request.headers', true)::json ->> 'x-client-id')
      WITH CHECK (client_id = current_setting('request.headers', true)::json ->> 'x-client-id');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_scroll_positions' AND policyname = 'Client can delete own scroll positions'
  ) THEN
    CREATE POLICY "Client can delete own scroll positions"
      ON conversation_scroll_positions FOR DELETE
      TO anon, authenticated
      USING (client_id = current_setting('request.headers', true)::json ->> 'x-client-id');
  END IF;
END $$;
