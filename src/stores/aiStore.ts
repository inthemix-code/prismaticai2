import { create } from 'zustand';
import {
  AIResponse,
  ConversationTurn,
  Conversation,
  Project,
  ProjectMemory,
  ModelId,
} from '../types';
import { validateSearchRequest } from '../utils/validation';
import { apiService } from '../services/apiService';
import {
  conversationPersistence,
  projectPersistence,
  memoryPersistence,
  rankMemoryForPrompt,
} from '../services/conversationPersistence';

type SelectedModels = { claude: boolean; grok: boolean; gemini: boolean };

const LIVE_MODE_KEY = 'prismatic.liveMode';

function loadLiveMode(): boolean {
  try {
    return localStorage.getItem(LIVE_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistLiveMode(value: boolean) {
  try {
    localStorage.setItem(LIVE_MODE_KEY, value ? '1' : '0');
  } catch { /* ignore */ }
}

interface AIStore {
  currentConversation: Conversation | null;
  conversationHistory: Conversation[];
  queryHistory: string[];

  projects: Project[];
  activeProjectId: string | null;
  projectMemory: Record<string, ProjectMemory[]>;

  liveMode: boolean;

  startNewConversation: (prompt: string, selectedModels?: SelectedModels) => Promise<void>;
  continueConversation: (prompt: string, selectedModels?: SelectedModels) => Promise<void>;
  setResponse: (turnId: string, responseId: string, response: Partial<AIResponse>) => void;
  clearResults: () => void;
  addToHistory: (prompt: string) => void;
  loadConversation: (conversationId: string) => void;
  setActiveConversation: (conversation: Conversation) => void;
  processAIResponses: (
    turnId: string,
    prompt: string,
    selectedModels: SelectedModels,
    memoryUsed: string[]
  ) => Promise<void>;
  processAIResponsesStreaming: (
    turnId: string,
    prompt: string,
    selectedModels: SelectedModels,
    memoryUsed: string[]
  ) => Promise<void>;

  getCurrentTurn: () => ConversationTurn | null;

  setLiveMode: (v: boolean) => void;

  loadProjects: () => Promise<void>;
  createProject: (input: { name: string; description?: string; color?: string; systemPersona?: string }) => Promise<Project | null>;
  updateProject: (id: string, patch: Partial<{ name: string; description: string; color: string; systemPersona: string }>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;

  loadMemoryForActiveProject: () => Promise<void>;
  pinMemory: (fact: string, sourceTurnId?: string | null) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  updateMemoryFact: (id: string, fact: string) => Promise<void>;
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildLoadingResponses(turnId: string, selectedModels: SelectedModels, streaming: boolean): AIResponse[] {
  const platforms = (['grok', 'claude', 'gemini'] as const).filter(p => selectedModels[p]);
  return platforms.map(platform => ({
    id: `${turnId}-${platform}`,
    platform,
    content: '',
    confidence: 0,
    responseTime: 0,
    wordCount: 0,
    loading: true,
    streaming,
    timestamp: Date.now(),
  }));
}

function updateTurnInConversations(
  state: Pick<AIStore, 'currentConversation' | 'conversationHistory'>,
  turnId: string,
  updater: (turn: ConversationTurn) => ConversationTurn
) {
  const applyUpdate = (conv: Conversation): Conversation => ({
    ...conv,
    turns: conv.turns.map(t => (t.id === turnId ? updater(t) : t)),
  });

  return {
    currentConversation: state.currentConversation ? applyUpdate(state.currentConversation) : null,
    conversationHistory: state.conversationHistory.map(applyUpdate),
  };
}

export const useAIStore = create<AIStore>((set, get) => ({
  currentConversation: null,
  conversationHistory: [],
  queryHistory: [],

  projects: [],
  activeProjectId: null,
  projectMemory: {},

  liveMode: loadLiveMode(),

  setLiveMode: (v) => {
    persistLiveMode(v);
    set({ liveMode: v });
  },

  startNewConversation: async (prompt, selectedModels) => {
    const models = selectedModels ?? { claude: true, grok: true, gemini: true };
    const validation = validateSearchRequest(prompt, models);
    if (!validation.isValid) throw new Error(`Invalid input: ${validation.errors.join(', ')}`);

    const sanitizedPrompt = validation.sanitizedPrompt ?? prompt;
    const conversationId = makeId('conv');
    const turnId = makeId('turn');
    const projectId = get().activeProjectId;
    const streaming = get().liveMode;

    get().addToHistory(sanitizedPrompt);

    const memoryFacts = projectId ? rankMemoryForPrompt(get().projectMemory[projectId] ?? [], sanitizedPrompt) : [];
    const memoryFactTexts = memoryFacts.map(m => m.fact);

    const newTurn: ConversationTurn = {
      id: turnId,
      prompt: sanitizedPrompt,
      timestamp: Date.now(),
      responses: buildLoadingResponses(turnId, models, streaming),
      analysisData: null,
      fusionResult: null,
      fusionStructured: null,
      loading: true,
      completed: false,
      memoryUsed: memoryFactTexts,
    };

    const newConversation: Conversation = {
      id: conversationId,
      title: sanitizedPrompt.slice(0, 50) + (sanitizedPrompt.length > 50 ? '...' : ''),
      turns: [newTurn],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectId,
    };

    set(state => ({
      currentConversation: newConversation,
      conversationHistory: [newConversation, ...state.conversationHistory],
    }));

    void conversationPersistence.upsertConversation(newConversation);
    void conversationPersistence.upsertTurn(conversationId, newTurn, 0);

    if (streaming) {
      get().processAIResponsesStreaming(turnId, sanitizedPrompt, models, memoryFactTexts);
    } else {
      get().processAIResponses(turnId, sanitizedPrompt, models, memoryFactTexts);
    }
  },

  continueConversation: async (prompt, selectedModels) => {
    const models = selectedModels ?? { claude: true, grok: true, gemini: true };
    const validation = validateSearchRequest(prompt, models);
    if (!validation.isValid) throw new Error(`Invalid input: ${validation.errors.join(', ')}`);

    const sanitizedPrompt = validation.sanitizedPrompt ?? prompt;
    const currentConv = get().currentConversation;
    if (!currentConv) return get().startNewConversation(sanitizedPrompt, models);

    const turnId = makeId('turn');
    const projectId = currentConv.projectId ?? get().activeProjectId;
    const streaming = get().liveMode;
    get().addToHistory(sanitizedPrompt);

    const memoryFacts = projectId ? rankMemoryForPrompt(get().projectMemory[projectId] ?? [], sanitizedPrompt) : [];
    const memoryFactTexts = memoryFacts.map(m => m.fact);

    const newTurn: ConversationTurn = {
      id: turnId,
      prompt: sanitizedPrompt,
      timestamp: Date.now(),
      responses: buildLoadingResponses(turnId, models, streaming),
      analysisData: null,
      fusionResult: null,
      fusionStructured: null,
      loading: true,
      completed: false,
      memoryUsed: memoryFactTexts,
    };

    set(state => ({
      currentConversation: state.currentConversation
        ? { ...state.currentConversation, turns: [...state.currentConversation.turns, newTurn], updatedAt: Date.now() }
        : null,
      conversationHistory: state.conversationHistory.map(conv =>
        conv.id === currentConv.id
          ? { ...conv, turns: [...conv.turns, newTurn], updatedAt: Date.now() }
          : conv
      ),
    }));

    const newIndex = currentConv.turns.length;
    const updated = get().currentConversation;
    if (updated) void conversationPersistence.upsertConversation(updated);
    void conversationPersistence.upsertTurn(currentConv.id, newTurn, newIndex);

    if (streaming) {
      get().processAIResponsesStreaming(turnId, sanitizedPrompt, models, memoryFactTexts);
    } else {
      get().processAIResponses(turnId, sanitizedPrompt, models, memoryFactTexts);
    }
  },

  processAIResponses: async (turnId, prompt, selectedModels, memoryUsed) => {
    const projectId = get().currentConversation?.projectId ?? get().activeProjectId;
    const project = projectId ? get().projects.find(p => p.id === projectId) : null;
    const options = {
      systemPersona: project?.systemPersona || undefined,
      memoryFacts: memoryUsed,
    };

    const responses = await apiService.queryAllModels(prompt, selectedModels, options);
    const [analysisData, fusionResult, fusionStructured] = await Promise.all([
      apiService.getAnalysisData(responses),
      apiService.getFusionResultWithPrompt(prompt, responses),
      apiService.getStructuredSynthesis(prompt, responses),
    ]);

    set(state =>
      updateTurnInConversations(state, turnId, turn => ({
        ...turn,
        responses,
        loading: false,
        completed: true,
        analysisData,
        fusionResult,
        fusionStructured,
      }))
    );

    const convo = get().currentConversation;
    if (convo) {
      const idx = convo.turns.findIndex(t => t.id === turnId);
      const turn = convo.turns[idx];
      if (turn) {
        void conversationPersistence.upsertConversation({ ...convo, updatedAt: Date.now() });
        void conversationPersistence.upsertTurn(convo.id, turn, idx);
      }
    }
  },

  processAIResponsesStreaming: async (turnId, prompt, selectedModels, memoryUsed) => {
    const projectId = get().currentConversation?.projectId ?? get().activeProjectId;
    const project = projectId ? get().projects.find(p => p.id === projectId) : null;
    const options = {
      systemPersona: project?.systemPersona || undefined,
      memoryFacts: memoryUsed,
    };

    const models: ModelId[] = (['claude', 'grok', 'gemini'] as const).filter(m => selectedModels[m]);

    const streamOne = async (model: ModelId): Promise<AIResponse> => {
      const responseId = `${turnId}-${model}`;
      let acc = '';
      return apiService.streamModel(
        model,
        prompt,
        {
          onDelta: (text) => {
            acc += text;
            get().setResponse(turnId, responseId, {
              content: acc,
              loading: true,
              streaming: true,
            });
          },
          onFirstToken: () => {
            get().setResponse(turnId, responseId, { streaming: true });
          },
          onDone: () => {
            get().setResponse(turnId, responseId, { streaming: false });
          },
          onError: () => {
            get().setResponse(turnId, responseId, { streaming: false });
          },
        },
        options
      ).then((finalResp) => {
        get().setResponse(turnId, responseId, {
          ...finalResp,
          id: responseId,
          loading: false,
          streaming: false,
        });
        return { ...finalResp, id: responseId };
      });
    };

    const settled = await Promise.allSettled(models.map(streamOne));
    const responses: AIResponse[] = settled.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        id: `${turnId}-${models[i]}`,
        platform: models[i],
        content: '',
        confidence: 0,
        responseTime: 0,
        wordCount: 0,
        loading: false,
        error: 'stream failed',
        timestamp: Date.now(),
      };
    });

    const [analysisData, fusionResult, fusionStructured] = await Promise.all([
      apiService.getAnalysisData(responses),
      apiService.getFusionResultWithPrompt(prompt, responses),
      apiService.getStructuredSynthesis(prompt, responses),
    ]);

    set(state =>
      updateTurnInConversations(state, turnId, turn => ({
        ...turn,
        responses,
        loading: false,
        completed: true,
        analysisData,
        fusionResult,
        fusionStructured,
      }))
    );

    const convo = get().currentConversation;
    if (convo) {
      const idx = convo.turns.findIndex(t => t.id === turnId);
      const turn = convo.turns[idx];
      if (turn) {
        void conversationPersistence.upsertConversation({ ...convo, updatedAt: Date.now() });
        void conversationPersistence.upsertTurn(convo.id, turn, idx);
      }
    }
  },

  setResponse: (turnId, responseId, responseUpdate) => {
    set(state =>
      updateTurnInConversations(state, turnId, turn => ({
        ...turn,
        responses: turn.responses.map(r =>
          r.id === responseId ? { ...r, ...responseUpdate } : r
        ),
      }))
    );
  },

  clearResults: () => {
    set({ currentConversation: null, conversationHistory: [] });
  },

  addToHistory: (prompt) => {
    set(state => ({
      queryHistory: [prompt, ...state.queryHistory.filter(p => p !== prompt)].slice(0, 10),
    }));
  },

  loadConversation: (conversationId) => {
    const conversation = get().conversationHistory.find(c => c.id === conversationId);
    if (conversation) set({ currentConversation: conversation });
  },

  setActiveConversation: (conversation) => {
    set(state => {
      const exists = state.conversationHistory.some(c => c.id === conversation.id);
      return {
        currentConversation: conversation,
        conversationHistory: exists
          ? state.conversationHistory.map(c => (c.id === conversation.id ? conversation : c))
          : [conversation, ...state.conversationHistory],
      };
    });
  },

  getCurrentTurn: () => {
    const conv = get().currentConversation;
    if (!conv || conv.turns.length === 0) return null;
    return conv.turns[conv.turns.length - 1];
  },

  loadProjects: async () => {
    const projects = await projectPersistence.list();
    set({ projects });
  },

  createProject: async (input) => {
    const p = await projectPersistence.create(input);
    if (p) set(state => ({ projects: [p, ...state.projects] }));
    return p;
  },

  updateProject: async (id, patch) => {
    const ok = await projectPersistence.update(id, patch);
    if (!ok) return;
    set(state => ({
      projects: state.projects.map(p =>
        p.id === id
          ? {
              ...p,
              ...(patch.name !== undefined ? { name: patch.name } : {}),
              ...(patch.description !== undefined ? { description: patch.description } : {}),
              ...(patch.color !== undefined ? { color: patch.color } : {}),
              ...(patch.systemPersona !== undefined ? { systemPersona: patch.systemPersona } : {}),
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
  },

  deleteProject: async (id) => {
    const ok = await projectPersistence.delete(id);
    if (!ok) return;
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
      projectMemory: Object.fromEntries(Object.entries(state.projectMemory).filter(([k]) => k !== id)),
    }));
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id });
    if (id) void get().loadMemoryForActiveProject();
  },

  loadMemoryForActiveProject: async () => {
    const id = get().activeProjectId;
    if (!id) return;
    const list = await memoryPersistence.listForProject(id);
    set(state => ({ projectMemory: { ...state.projectMemory, [id]: list } }));
  },

  pinMemory: async (fact, sourceTurnId) => {
    const id = get().activeProjectId;
    if (!id) return;
    const m = await memoryPersistence.add(id, fact, sourceTurnId);
    if (!m) return;
    set(state => ({
      projectMemory: {
        ...state.projectMemory,
        [id]: [m, ...(state.projectMemory[id] ?? [])],
      },
    }));
  },

  removeMemory: async (id) => {
    const ok = await memoryPersistence.remove(id);
    if (!ok) return;
    set(state => {
      const next: Record<string, ProjectMemory[]> = {};
      for (const [pid, list] of Object.entries(state.projectMemory)) {
        next[pid] = list.filter(m => m.id !== id);
      }
      return { projectMemory: next };
    });
  },

  updateMemoryFact: async (id, fact) => {
    const ok = await memoryPersistence.update(id, fact);
    if (!ok) return;
    set(state => {
      const next: Record<string, ProjectMemory[]> = {};
      for (const [pid, list] of Object.entries(state.projectMemory)) {
        next[pid] = list.map(m => (m.id === id ? { ...m, fact } : m));
      }
      return { projectMemory: next };
    });
  },
}));
