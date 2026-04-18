import { supabase, getClientId } from '../lib/supabase';

export type NavPlacement = 'rail' | 'search' | 'both';
export type ReadingWidth = 'narrow' | 'comfortable' | 'wide';

export interface UIPreferences {
  referenceCollapsedDefault: boolean;
  responsesLayout: 'compact' | 'expanded';
  showTurnRail: boolean;
  autoCollapseOlderTurns: boolean;
  navRailCollapsed: boolean;
  navPlacement: NavPlacement;
  readingWidth: ReadingWidth;
}

const LOCAL_KEY = 'prismatic.uiPrefs';

export const defaultUIPreferences: UIPreferences = {
  referenceCollapsedDefault: true,
  responsesLayout: 'compact',
  showTurnRail: true,
  autoCollapseOlderTurns: true,
  navRailCollapsed: false,
  navPlacement: 'both',
  readingWidth: 'comfortable',
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

function normalizePlacement(value: unknown): NavPlacement {
  return value === 'rail' || value === 'search' || value === 'both' ? value : 'both';
}

function normalizeReadingWidth(value: unknown): ReadingWidth {
  return value === 'narrow' || value === 'wide' ? value : 'comfortable';
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending: UIPreferences | null = null;

async function flush(): Promise<void> {
  if (!pending) return;
  const prefs = pending;
  pending = null;
  try {
    await supabase
      .from('user_ui_preferences')
      .upsert({
        client_id: getClientId(),
        reference_collapsed_default: prefs.referenceCollapsedDefault,
        responses_layout: prefs.responsesLayout,
        show_turn_rail: prefs.showTurnRail,
        auto_collapse_older_turns: prefs.autoCollapseOlderTurns,
        nav_rail_collapsed: prefs.navRailCollapsed,
        nav_placement: prefs.navPlacement,
        reading_width: prefs.readingWidth,
        updated_at: new Date().toISOString(),
      });
  } catch { /* ignore */ }
}

export const uiPreferences = {
  readLocalSync(): UIPreferences {
    return readLocal();
  },

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
          navRailCollapsed: !!data.nav_rail_collapsed,
          navPlacement: normalizePlacement(data.nav_placement),
          readingWidth: normalizeReadingWidth(data.reading_width),
        };
        writeLocal(remote);
        return remote;
      }
    } catch { /* ignore network errors, use local */ }
    return local;
  },

  save(prefs: UIPreferences): void {
    writeLocal(prefs);
    pending = prefs;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void flush();
    }, 600);
  },

  async saveNow(prefs: UIPreferences): Promise<void> {
    writeLocal(prefs);
    pending = prefs;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await flush();
  },
};
