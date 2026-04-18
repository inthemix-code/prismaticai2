/*
  # Add conversation turn branching

  1. Changes to `conversation_turns`
    - Add `parent_turn_id` (uuid, nullable, self-reference) so turns form a tree rather than a pure linear chain
    - Add `is_active_branch` (boolean, default true) marking which sibling is on the currently active linear path
    - Add index on `(conversation_id, parent_turn_id)` for fast sibling lookups

  2. Notes
    - Existing turns keep `parent_turn_id = NULL` and `is_active_branch = TRUE`, so the existing linear path is preserved
    - New turns in a continuation chain should set `parent_turn_id` to the previous active turn
    - Forks create a new sibling of an existing turn (same `parent_turn_id`) with `is_active_branch = TRUE`, and the displaced sibling becomes `FALSE`
    - RLS policies already exist for `conversation_turns` scoped by `client_id` and are unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_turns' AND column_name = 'parent_turn_id'
  ) THEN
    ALTER TABLE conversation_turns
      ADD COLUMN parent_turn_id uuid NULL REFERENCES conversation_turns(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_turns' AND column_name = 'is_active_branch'
  ) THEN
    ALTER TABLE conversation_turns
      ADD COLUMN is_active_branch boolean NOT NULL DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS conversation_turns_parent_idx
  ON conversation_turns (conversation_id, parent_turn_id);
