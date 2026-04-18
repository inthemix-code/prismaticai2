/*
  # User UI Preferences

  1. New Tables
    - `user_ui_preferences` - stores per-device UI preferences for the Results page
      - `client_id` (text, primary key) - device-scoped identifier (matches existing `x-client-id` pattern)
      - `reference_collapsed_default` (boolean, default true) - whether the Reference Material section starts collapsed
      - `responses_layout` (text, default 'compact') - layout mode for the individual responses grid ('compact' | 'expanded')
      - `show_turn_rail` (boolean, default true) - whether to show the left turn navigator rail on desktop
      - `auto_collapse_older_turns` (boolean, default true) - whether previous turns collapse to summary when a new turn starts
      - `created_at`, `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Public (anon) read/write restricted to rows matching the caller's `x-client-id` header

  3. Notes
    - This app uses device-scoped `client_id`s (no auth). Policies follow the pattern established
      by `projects` and `project_memory` tables for consistency.
*/

CREATE TABLE IF NOT EXISTS user_ui_preferences (
  client_id text PRIMARY KEY,
  reference_collapsed_default boolean NOT NULL DEFAULT true,
  responses_layout text NOT NULL DEFAULT 'compact',
  show_turn_rail boolean NOT NULL DEFAULT true,
  auto_collapse_older_turns boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_ui_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ui_preferences' AND policyname = 'Client can read own prefs'
  ) THEN
    CREATE POLICY "Client can read own prefs"
      ON user_ui_preferences FOR SELECT
      TO anon, authenticated
      USING (client_id = current_setting('request.headers', true)::json->>'x-client-id');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ui_preferences' AND policyname = 'Client can insert own prefs'
  ) THEN
    CREATE POLICY "Client can insert own prefs"
      ON user_ui_preferences FOR INSERT
      TO anon, authenticated
      WITH CHECK (client_id = current_setting('request.headers', true)::json->>'x-client-id');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ui_preferences' AND policyname = 'Client can update own prefs'
  ) THEN
    CREATE POLICY "Client can update own prefs"
      ON user_ui_preferences FOR UPDATE
      TO anon, authenticated
      USING (client_id = current_setting('request.headers', true)::json->>'x-client-id')
      WITH CHECK (client_id = current_setting('request.headers', true)::json->>'x-client-id');
  END IF;
END $$;
