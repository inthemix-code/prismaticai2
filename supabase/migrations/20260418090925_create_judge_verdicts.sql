/*
  # Judge verdicts table

  1. New Tables
    - `judge_verdicts` stores Claude's meta-evaluation of each turn's AI responses
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `turn_id` (uuid, references conversation_turns) — UNIQUE so re-judging overwrites
      - `client_id` (text)
      - `judge_model` (text, default 'claude')
      - `overall_winner` (text nullable, one of claude|grok|gemini)
      - `overall_summary` (text)
      - `scores` (jsonb) — per-model { accuracy, completeness, tone, rationale }
      - `created_at`, `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Separate SELECT/INSERT/UPDATE/DELETE policies matching the existing
      conversation_reactions pattern (client_id scoped via x-client-id header).
*/

CREATE TABLE IF NOT EXISTS judge_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  turn_id uuid NOT NULL REFERENCES conversation_turns(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  judge_model text NOT NULL DEFAULT 'claude',
  overall_winner text,
  overall_summary text DEFAULT '',
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (turn_id)
);

CREATE INDEX IF NOT EXISTS judge_verdicts_turn_idx ON judge_verdicts(turn_id);
CREATE INDEX IF NOT EXISTS judge_verdicts_conversation_idx ON judge_verdicts(conversation_id);

ALTER TABLE judge_verdicts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'judge_verdicts' AND policyname = 'Clients read judge verdicts'
  ) THEN
    CREATE POLICY "Clients read judge verdicts"
      ON judge_verdicts FOR SELECT
      TO anon, authenticated
      USING (client_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'judge_verdicts' AND policyname = 'Clients insert judge verdicts'
  ) THEN
    CREATE POLICY "Clients insert judge verdicts"
      ON judge_verdicts FOR INSERT
      TO anon, authenticated
      WITH CHECK (client_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'judge_verdicts' AND policyname = 'Clients update judge verdicts'
  ) THEN
    CREATE POLICY "Clients update judge verdicts"
      ON judge_verdicts FOR UPDATE
      TO anon, authenticated
      USING (client_id IS NOT NULL)
      WITH CHECK (client_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'judge_verdicts' AND policyname = 'Clients delete judge verdicts'
  ) THEN
    CREATE POLICY "Clients delete judge verdicts"
      ON judge_verdicts FOR DELETE
      TO anon, authenticated
      USING (client_id IS NOT NULL);
  END IF;
END $$;
