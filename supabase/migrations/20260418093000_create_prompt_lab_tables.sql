/*
  # Prompt Lab - A/B Variation Testing Tables

  Adds three tables to support the Prompt Lab feature where users can author
  2-4 prompt variants and run them across all selected AI models in parallel,
  viewing results in a variants x models grid.

  1. New Tables
     - `prompt_lab_sessions`
       - `id` (uuid, PK)
       - `client_id` (text) - device-scoped RLS
       - `project_id` (uuid, nullable) - optional project association
       - `title` (text)
       - `shared_context` (text) - system persona / shared instructions reused across variants
       - `selected_models` (jsonb) - array of ModelId strings
       - `is_shared` (boolean)
       - `created_at`, `updated_at` (timestamptz)
     - `prompt_lab_variants`
       - `id` (uuid, PK)
       - `session_id` (uuid, FK -> prompt_lab_sessions)
       - `client_id` (text)
       - `label` (text) - e.g. "Variant A"
       - `prompt` (text)
       - `variant_index` (int)
       - `notes` (text)
       - `created_at` (timestamptz)
     - `prompt_lab_results`
       - `id` (uuid, PK)
       - `session_id` (uuid, FK)
       - `variant_id` (uuid, FK -> prompt_lab_variants)
       - `client_id` (text)
       - `platform` (text) - claude | grok | gemini
       - `content` (text)
       - `status` (text) - pending | streaming | done | error
       - `response_time` (int)
       - `word_count` (int)
       - `confidence` (numeric)
       - `first_token_ms` (int)
       - `tokens_per_second` (numeric)
       - `error` (text)
       - `is_winner` (boolean) - user-marked winner in row
       - `created_at`, `updated_at` (timestamptz)

  2. Security
     - RLS enabled on all three tables
     - Policies scoped by `client_id` matching the `x-client-id` request header
     - Separate select/insert/update/delete policies for anon + authenticated roles

  3. Indexes
     - Fast lookup by session for variants and results
     - Composite index on (session_id, variant_id, platform) for grid cells
*/

CREATE TABLE IF NOT EXISTS prompt_lab_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL DEFAULT '',
  project_id uuid,
  title text NOT NULL DEFAULT 'Untitled lab session',
  shared_context text NOT NULL DEFAULT '',
  selected_models jsonb NOT NULL DEFAULT '["claude","grok","gemini"]'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_lab_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES prompt_lab_sessions(id) ON DELETE CASCADE,
  client_id text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT 'Variant',
  prompt text NOT NULL DEFAULT '',
  variant_index int NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES prompt_lab_sessions(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES prompt_lab_variants(id) ON DELETE CASCADE,
  client_id text NOT NULL DEFAULT '',
  platform text NOT NULL,
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  response_time int NOT NULL DEFAULT 0,
  word_count int NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 0,
  first_token_ms int NOT NULL DEFAULT 0,
  tokens_per_second numeric NOT NULL DEFAULT 0,
  error text NOT NULL DEFAULT '',
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_lab_variants_session ON prompt_lab_variants(session_id, variant_index);
CREATE INDEX IF NOT EXISTS idx_prompt_lab_results_session ON prompt_lab_results(session_id);
CREATE INDEX IF NOT EXISTS idx_prompt_lab_results_cell ON prompt_lab_results(session_id, variant_id, platform);
CREATE INDEX IF NOT EXISTS idx_prompt_lab_sessions_client ON prompt_lab_sessions(client_id, updated_at DESC);

ALTER TABLE prompt_lab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_lab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_lab_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_sessions' AND policyname='Lab sessions select by client') THEN
    CREATE POLICY "Lab sessions select by client" ON prompt_lab_sessions FOR SELECT TO anon, authenticated
      USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '') OR is_shared = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_sessions' AND policyname='Lab sessions insert by client') THEN
    CREATE POLICY "Lab sessions insert by client" ON prompt_lab_sessions FOR INSERT TO anon, authenticated
      WITH CHECK (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_sessions' AND policyname='Lab sessions update by client') THEN
    CREATE POLICY "Lab sessions update by client" ON prompt_lab_sessions FOR UPDATE TO anon, authenticated
      USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      WITH CHECK (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_sessions' AND policyname='Lab sessions delete by client') THEN
    CREATE POLICY "Lab sessions delete by client" ON prompt_lab_sessions FOR DELETE TO anon, authenticated
      USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_variants' AND policyname='Lab variants select by client') THEN
    CREATE POLICY "Lab variants select by client" ON prompt_lab_variants FOR SELECT TO anon, authenticated
      USING (
        client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '')
        OR EXISTS (SELECT 1 FROM prompt_lab_sessions s WHERE s.id = prompt_lab_variants.session_id AND s.is_shared = true)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_variants' AND policyname='Lab variants insert by client') THEN
    CREATE POLICY "Lab variants insert by client" ON prompt_lab_variants FOR INSERT TO anon, authenticated
      WITH CHECK (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_variants' AND policyname='Lab variants update by client') THEN
    CREATE POLICY "Lab variants update by client" ON prompt_lab_variants FOR UPDATE TO anon, authenticated
      USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      WITH CHECK (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_variants' AND policyname='Lab variants delete by client') THEN
    CREATE POLICY "Lab variants delete by client" ON prompt_lab_variants FOR DELETE TO anon, authenticated
      USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_results' AND policyname='Lab results select by client') THEN
    CREATE POLICY "Lab results select by client" ON prompt_lab_results FOR SELECT TO anon, authenticated
      USING (
        client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', '')
        OR EXISTS (SELECT 1 FROM prompt_lab_sessions s WHERE s.id = prompt_lab_results.session_id AND s.is_shared = true)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_results' AND policyname='Lab results insert by client') THEN
    CREATE POLICY "Lab results insert by client" ON prompt_lab_results FOR INSERT TO anon, authenticated
      WITH CHECK (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_results' AND policyname='Lab results update by client') THEN
    CREATE POLICY "Lab results update by client" ON prompt_lab_results FOR UPDATE TO anon, authenticated
      USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''))
      WITH CHECK (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompt_lab_results' AND policyname='Lab results delete by client') THEN
    CREATE POLICY "Lab results delete by client" ON prompt_lab_results FOR DELETE TO anon, authenticated
      USING (client_id = coalesce(current_setting('request.headers', true)::json->>'x-client-id', ''));
  END IF;
END $$;
