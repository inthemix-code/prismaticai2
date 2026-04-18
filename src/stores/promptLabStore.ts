import { create } from 'zustand';
import {
  ModelId,
  PromptLabCellResult,
  PromptLabSession,
  PromptVariant,
} from '../types';
import { apiService } from '../services/apiService';
import * as lab from '../services/promptLabPersistence';

const DEFAULT_MODELS: ModelId[] = ['claude', 'grok', 'gemini'];
const VARIANT_LABELS = ['Variant A', 'Variant B', 'Variant C', 'Variant D'];
const MAX_VARIANTS = 4;
const MIN_VARIANTS = 2;

function localVariant(index: number, sessionId: string = ''): PromptVariant {
  const id = `local-${crypto.randomUUID()}`;
  return {
    id,
    sessionId,
    label: VARIANT_LABELS[index] ?? `Variant ${index + 1}`,
    prompt: '',
    variantIndex: index,
    notes: '',
    createdAt: Date.now(),
  };
}

interface PromptLabState {
  sessionId: string | null;
  title: string;
  sharedContext: string;
  selectedModels: ModelId[];
  variants: PromptVariant[];
  results: PromptLabCellResult[];
  running: boolean;
  cellsTotal: number;
  cellsDone: number;
  recentSessions: Array<Omit<PromptLabSession, 'variants' | 'results'>>;

  resetDraft: () => void;
  setTitle: (title: string) => void;
  setSharedContext: (value: string) => void;
  toggleModel: (model: ModelId) => void;
  addVariant: () => void;
  removeVariant: (id: string) => void;
  updateVariantPrompt: (id: string, prompt: string) => void;
  updateVariantLabel: (id: string, label: string) => void;
  duplicateVariant: (id: string) => void;

  runLab: () => Promise<string | null>;
  rerunCell: (variantId: string, platform: ModelId) => Promise<void>;
  toggleWinner: (variantId: string, resultId: string) => Promise<void>;

  loadSession: (sessionId: string) => Promise<void>;
  loadRecent: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

function defaultVariants(): PromptVariant[] {
  return [localVariant(0), localVariant(1)];
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const usePromptLabStore = create<PromptLabState>((set, get) => ({
  sessionId: null,
  title: 'Untitled lab session',
  sharedContext: '',
  selectedModels: [...DEFAULT_MODELS],
  variants: defaultVariants(),
  results: [],
  running: false,
  cellsTotal: 0,
  cellsDone: 0,
  recentSessions: [],

  resetDraft: () => {
    set({
      sessionId: null,
      title: 'Untitled lab session',
      sharedContext: '',
      selectedModels: [...DEFAULT_MODELS],
      variants: defaultVariants(),
      results: [],
      running: false,
      cellsTotal: 0,
      cellsDone: 0,
    });
  },

  setTitle: (title) => set({ title }),
  setSharedContext: (value) => set({ sharedContext: value }),

  toggleModel: (model) => {
    const { selectedModels } = get();
    const next = selectedModels.includes(model)
      ? selectedModels.filter((m) => m !== model)
      : [...selectedModels, model];
    set({ selectedModels: next.length > 0 ? next : selectedModels });
  },

  addVariant: () => {
    const { variants } = get();
    if (variants.length >= MAX_VARIANTS) return;
    set({ variants: [...variants, localVariant(variants.length)] });
  },

  removeVariant: (id) => {
    const { variants } = get();
    if (variants.length <= MIN_VARIANTS) return;
    const filtered = variants.filter((v) => v.id !== id).map((v, i) => ({
      ...v,
      variantIndex: i,
      label: VARIANT_LABELS[i] ?? `Variant ${i + 1}`,
    }));
    set({ variants: filtered });
  },

  updateVariantPrompt: (id, prompt) => {
    set({
      variants: get().variants.map((v) => (v.id === id ? { ...v, prompt } : v)),
    });
  },

  updateVariantLabel: (id, label) => {
    set({
      variants: get().variants.map((v) => (v.id === id ? { ...v, label } : v)),
    });
  },

  duplicateVariant: (id) => {
    const { variants } = get();
    if (variants.length >= MAX_VARIANTS) return;
    const source = variants.find((v) => v.id === id);
    if (!source) return;
    const next: PromptVariant = {
      ...source,
      id: `local-${crypto.randomUUID()}`,
      variantIndex: variants.length,
      label: VARIANT_LABELS[variants.length] ?? `Variant ${variants.length + 1}`,
    };
    set({ variants: [...variants, next] });
  },

  runLab: async () => {
    const { title, sharedContext, selectedModels, variants } = get();
    const usable = variants.filter((v) => v.prompt.trim().length > 0);
    if (usable.length < MIN_VARIANTS || selectedModels.length === 0) return null;

    const sessionId = await lab.createSession({
      title: title.trim() || 'Untitled lab session',
      sharedContext,
      selectedModels,
    });

    const persistedVariants: PromptVariant[] = [];
    for (const v of usable) {
      const persisted = await lab.upsertVariant({
        sessionId,
        label: v.label,
        prompt: v.prompt,
        variantIndex: v.variantIndex,
        notes: v.notes,
      });
      persistedVariants.push(persisted);
    }

    const cellsTotal = persistedVariants.length * selectedModels.length;
    set({
      sessionId,
      variants: persistedVariants,
      results: [],
      running: true,
      cellsTotal,
      cellsDone: 0,
    });

    const tasks: Array<Promise<void>> = [];
    for (const variant of persistedVariants) {
      for (const platform of selectedModels) {
        const task = (async () => {
          const pending = await lab.upsertResult({
            sessionId,
            variantId: variant.id,
            platform,
            content: '',
            status: 'streaming',
          });
          set((state) => ({ results: [...state.results.filter((r) => r.id !== pending.id), pending] }));
          try {
            const response = await apiService.queryModel(platform, variant.prompt, {
              systemPersona: sharedContext || undefined,
            });
            const saved = await lab.upsertResult({
              id: pending.id,
              sessionId,
              variantId: variant.id,
              platform,
              content: response.content,
              status: 'done',
              responseTime: response.responseTime,
              wordCount: response.wordCount || countWords(response.content),
              confidence: response.confidence,
              firstTokenMs: response.firstTokenMs ?? 0,
              tokensPerSecond: response.tokensPerSecond ?? 0,
            });
            set((state) => ({
              results: state.results.map((r) => (r.id === saved.id ? saved : r)),
              cellsDone: state.cellsDone + 1,
            }));
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            const saved = await lab.upsertResult({
              id: pending.id,
              sessionId,
              variantId: variant.id,
              platform,
              content: '',
              status: 'error',
              error: errorMsg,
            });
            set((state) => ({
              results: state.results.map((r) => (r.id === saved.id ? saved : r)),
              cellsDone: state.cellsDone + 1,
            }));
          }
        })();
        tasks.push(task);
      }
    }

    await Promise.all(tasks);
    set({ running: false });
    return sessionId;
  },

  rerunCell: async (variantId, platform) => {
    const { sessionId, variants, sharedContext, results } = get();
    if (!sessionId) return;
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const existing = results.find((r) => r.variantId === variantId && r.platform === platform);

    const pending = await lab.upsertResult({
      id: existing?.id,
      sessionId,
      variantId,
      platform,
      content: '',
      status: 'streaming',
    });
    set((state) => ({
      results: [...state.results.filter((r) => r.id !== pending.id), pending],
    }));

    try {
      const response = await apiService.queryModel(platform, variant.prompt, {
        systemPersona: sharedContext || undefined,
      });
      const saved = await lab.upsertResult({
        id: pending.id,
        sessionId,
        variantId,
        platform,
        content: response.content,
        status: 'done',
        responseTime: response.responseTime,
        wordCount: response.wordCount || countWords(response.content),
        confidence: response.confidence,
        firstTokenMs: response.firstTokenMs ?? 0,
        tokensPerSecond: response.tokensPerSecond ?? 0,
      });
      set((state) => ({
        results: state.results.map((r) => (r.id === saved.id ? saved : r)),
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const saved = await lab.upsertResult({
        id: pending.id,
        sessionId,
        variantId,
        platform,
        content: '',
        status: 'error',
        error: errorMsg,
      });
      set((state) => ({
        results: state.results.map((r) => (r.id === saved.id ? saved : r)),
      }));
    }
  },

  toggleWinner: async (variantId, resultId) => {
    const { sessionId, results } = get();
    if (!sessionId) return;
    const current = results.find((r) => r.id === resultId);
    const makeWinner = !current?.isWinner;
    await lab.setWinner(sessionId, variantId, makeWinner ? resultId : null);
    set((state) => ({
      results: state.results.map((r) => {
        if (r.variantId !== variantId) return r;
        return { ...r, isWinner: r.id === resultId ? makeWinner : false };
      }),
    }));
  },

  loadSession: async (sessionId) => {
    const session = await lab.loadSession(sessionId);
    if (!session) return;
    set({
      sessionId: session.id,
      title: session.title,
      sharedContext: session.sharedContext,
      selectedModels: session.selectedModels,
      variants: session.variants,
      results: session.results,
      running: false,
      cellsTotal: session.variants.length * session.selectedModels.length,
      cellsDone: session.results.filter((r) => r.status === 'done' || r.status === 'error').length,
    });
  },

  loadRecent: async () => {
    try {
      const list = await lab.listSessions(10);
      set({ recentSessions: list });
    } catch (err) {
      console.error('Failed to load recent lab sessions', err);
    }
  },

  deleteSession: async (sessionId) => {
    await lab.deleteSession(sessionId);
    set((state) => ({ recentSessions: state.recentSessions.filter((s) => s.id !== sessionId) }));
  },
}));
