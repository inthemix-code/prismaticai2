/*
  # Add navigation layout preferences

  1. Changes to existing tables
    - `user_ui_preferences`
      - Add `nav_rail_collapsed` (boolean, default false) to remember whether
        the left navigation rail is collapsed to icons only.
      - Add `nav_placement` (text, default 'both', values 'rail' | 'search' |
        'both') to control where the quick action controls appear.

  2. Security
    - RLS on `user_ui_preferences` is already enabled and the policies already
      scope reads and writes to the current client. No additional policies
      needed.

  3. Notes
    - Both columns are additive and nullable-safe with sensible defaults so
      existing rows work without a backfill.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ui_preferences' AND column_name = 'nav_rail_collapsed'
  ) THEN
    ALTER TABLE user_ui_preferences
      ADD COLUMN nav_rail_collapsed boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ui_preferences' AND column_name = 'nav_placement'
  ) THEN
    ALTER TABLE user_ui_preferences
      ADD COLUMN nav_placement text NOT NULL DEFAULT 'both'
      CHECK (nav_placement IN ('rail', 'search', 'both'));
  END IF;
END $$;
