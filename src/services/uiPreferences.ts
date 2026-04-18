import { supabase, getClientId } from '../lib/supabase';

export interface UIPreferences {
  referenceCollapsedDefault: boolean;
  responsesLayout: 'compact' | 'expanded';
  showTurnRail: boolean;
  autoCollapseOlderTurns: boolean;
}

const LOCAL_KEY = 'prismatic.uiPrefs';

export const defaultUIPreferences: UIPreferences = {
  referenceCollapsedDefault: true,
  responsesLayout: 'compact',
  showTurnRail: true,
  autoCollapseOlderTurns: true,
};

function readLocal(): UIPreferences {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaultUIPreferences;
    const parsed = JSON.parse(raw);
    return { ...defaultUIPreferences, ...parsed };
  } catch {
    return defaultUIPreferences;
  }
}

function writeLocal(prefs: UIPreferences) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

export const uiPreferences = {
  async load(): Promise<UIPreferences> {
    const local = readLocal();
    try {
      const { data } = await supabase
        .from('user_ui_preferences')
        .select('*')
        .eq('client_id', getClientId())
        .maybeSingle();
      if (data) {
        const remote: UIPreferences = {
          referenceCollapsedDefault: !!data.reference_collapsed_default,
          responsesLayout: (data.responses_layout === 'expanded' ? 'expanded' : 'compact'),
          showTurnRail: !!data.show_turn_rail,
          autoCollapseOlderTurns: !!data.auto_collapse_older_turns,
        };
        writeLocal(remote);
        return remote;
      }
    } catch { /* ignore network errors, use local */ }
    return local;
  },

  async save(prefs: UIPreferences): Promise<void> {
    writeLocal(prefs);
    try {
      await supabase
        .from('user_ui_preferences')
        .upsert({
          client_id: getClientId(),
          reference_collapsed_default: prefs.referenceCollapsedDefault,
          responses_layout: prefs.responsesLayout,
          show_turn_rail: prefs.showTurnRail,
          auto_collapse_older_turns: prefs.autoCollapseOlderTurns,
          updated_at: new Date().toISOString(),
        });
    } catch { /* ignore */ }
  },
};
