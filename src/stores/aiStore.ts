import { create } from 'zustand';
import { AIResponse, ConversationTurn, Conversation } from '../types';
import { validateSearchRequest } from '../utils/validation';
import { apiService } from '../services/apiService';
import { conversationPersistence } from '../services/conversationPersistence';

interface AIStore {
  currentConversation: Conversation | null;
  conversationHistory: Conversation[];
  queryHistory: string[];

  startNewConversation: (prompt: string, selectedModels?: { claude: boolean; grok: boolean; gemini: boolean }) => Promise<void>;
  continueConversation: (prompt: string, selectedModels?: { claude: boolean; grok: boolean; gemini: boolean }) => Promise<void>;
  setResponse: (turnId: string, responseId: string, response: Partial<AIResponse>) => void;
  clearResults: () => void;
  addToHistory: (prompt: string) => void;
  loadConversation: (conversationId: string) => void;
  setActiveConversation: (conversation: Conversation) => void;
  processAIResponses: (turnId: string, prompt: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => Promise<void>;

  getCurrentTurn: () => ConversationTurn | null;
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildLoadingResponses(turnId: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }): AIResponse[] {
  const platforms = (['grok', 'claude', 'gemini'] as const).filter(p => selectedModels[p]);
  return platforms.map(platform => ({
    id: `${turnId}-${platform}`,
    platform,
    content: '',
    confidence: 0,
    responseTime: 0,
    wordCount: 0,
    loading: true,
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
    currentConversation: state.currentConversation
      ? applyUpdate(state.currentConversation)
      : null,
    conversationHistory: state.conversationHistory.map(applyUpdate),
  };
}

export const useAIStore = create<AIStore>((set, get) => ({
  currentConversation: null,
  conversationHistory: [],
  queryHistory: [],

  startNewConversation: async (prompt, selectedModels) => {
    const models = selectedModels ?? { claude: true, grok: true, gemini: true };
    const validation = validateSearchRequest(prompt, models);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const sanitizedPrompt = validation.sanitizedPrompt ?? prompt;
    const conversationId = makeId('conv');
    const turnId = makeId('turn');

    get().addToHistory(sanitizedPrompt);

    const newTurn: ConversationTurn = {
      id: turnId,
      prompt: sanitizedPrompt,
      timestamp: Date.now(),
      responses: buildLoadingResponses(turnId, models),
      analysisData: null,
      fusionResult: null,
      loading: true,
      completed: false,
    };

    const newConversation: Conversation = {
      id: conversationId,
      title: sanitizedPrompt.slice(0, 50) + (sanitizedPrompt.length > 50 ? '...' : ''),
      turns: [newTurn],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set(state => ({
      currentConversation: newConversation,
      conversationHistory: [newConversation, ...state.conversationHistory],
    }));

    void conversationPersistence.upsertConversation(newConversation);
    void conversationPersistence.upsertTurn(conversationId, newTurn, 0);

    get().processAIResponses(turnId, sanitizedPrompt, models);
  },

  continueConversation: async (prompt, selectedModels) => {
    const models = selectedModels ?? { claude: true, grok: true, gemini: true };
    const validation = validateSearchRequest(prompt, models);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const sanitizedPrompt = validation.sanitizedPrompt ?? prompt;
    const currentConv = get().currentConversation;
    if (!currentConv) {
      return get().startNewConversation(sanitizedPrompt, models);
    }

    const turnId = makeId('turn');
    get().addToHistory(sanitizedPrompt);

    const newTurn: ConversationTurn = {
      id: turnId,
      prompt: sanitizedPrompt,
      timestamp: Date.now(),
      responses: buildLoadingResponses(turnId, models),
      analysisData: null,
      fusionResult: null,
      loading: true,
      completed: false,
    };

    set(state => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            turns: [...state.currentConversation.turns, newTurn],
            updatedAt: Date.now(),
          }
        : null,
      conversationHistory: state.conversationHistory.map(conv =>
        conv.id === currentConv.id
          ? { ...conv, turns: [...conv.turns, newTurn], updatedAt: Date.now() }
          : conv
      ),
    }));

    const newIndex = currentConv.turns.length;
    const updated = get().currentConversation;
    if (updated) {
      void conversationPersistence.upsertConversation(updated);
    }
    void conversationPersistence.upsertTurn(currentConv.id, newTurn, newIndex);

    get().processAIResponses(turnId, sanitizedPrompt, models);
  },

  processAIResponses: async (turnId, prompt, selectedModels) => {
    const responses = await apiService.queryAllModels(prompt, selectedModels);
    const [analysisData, fusionResult] = await Promise.all([
      apiService.getAnalysisData(responses),
      apiService.getFusionResultWithPrompt(prompt, responses),
    ]);

    set(state =>
      updateTurnInConversations(state, turnId, turn => ({
        ...turn,
        responses,
        loading: false,
        completed: true,
        analysisData,
        fusionResult,
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
}));
