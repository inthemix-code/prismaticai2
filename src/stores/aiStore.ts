import { create } from 'zustand';
import { AIResponse, AnalysisData, FusionResult, ConversationTurn, Conversation } from '../types';
import { generateMockAnalysisData, generateMockFusionResult } from '../data/mockData';
import { validateSearchRequest } from '../utils/validation';
import { apiService } from '../services/apiService';

interface AIStore {
  // State
  currentConversation: Conversation | null;
  conversationHistory: Conversation[];
  queryHistory: string[];
  
  // Actions
  startNewConversation: (prompt: string, selectedModels?: { claude: boolean; grok: boolean; gemini: boolean }) => Promise<void>;
  continueConversation: (prompt: string, selectedModels?: { claude: boolean; grok: boolean; gemini: boolean }) => Promise<void>;
  setResponse: (turnId: string, responseId: string, response: Partial<AIResponse>) => void;
  clearResults: () => void;
  addToHistory: (prompt: string) => void;
  loadConversation: (conversationId: string) => void;
  
  // Computed getters
  getCurrentTurn: () => ConversationTurn | null;
  getLatestPrompt: () => string;
}

export const useAIStore = create<AIStore>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversationHistory: [],
  queryHistory: [],

  // Actions
  startNewConversation: async (prompt: string, selectedModels?: { claude: boolean; grok: boolean; gemini: boolean }) => {
    // Validate input before processing
    const validation = validateSearchRequest(prompt, selectedModels || { claude: true, grok: true, gemini: true });
    if (!validation.isValid) {
      console.error('Invalid conversation input:', validation.errors);
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedPrompt = validation.sanitizedPrompt || prompt;
    const conversationId = `conv-${Date.now()}`;
    const turnId = `turn-${Date.now()}`;
    
    // Add to history
    get().addToHistory(sanitizedPrompt);
    
    // Create loading responses for selected models
    const platforms = ['grok', 'claude', 'gemini'].filter(platform => 
      selectedModels ? selectedModels[platform as keyof typeof selectedModels] : true
    );
    
    const loadingResponses = platforms.map(platform => ({
      id: `${turnId}-${platform}`,
      platform: platform as 'grok' | 'claude' | 'gemini',
      content: '',
      confidence: 0,
      responseTime: 0,
      wordCount: 0,
      loading: true,
      timestamp: Date.now()
    }));
    
    // Create new conversation turn
    const newTurn: ConversationTurn = {
      id: turnId,
      prompt: sanitizedPrompt,
      timestamp: Date.now(),
      responses: loadingResponses,
      analysisData: null,
      fusionResult: null,
      loading: true,
      completed: false
    };

    // Create new conversation
    const newConversation: Conversation = {
      id: conversationId,
      title: sanitizedPrompt.slice(0, 50) + (sanitizedPrompt.length > 50 ? '...' : ''),
      turns: [newTurn],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Set as current conversation and add to history
    set(state => ({
      currentConversation: newConversation,
      conversationHistory: [newConversation, ...state.conversationHistory]
    }));
    
    // Process AI responses
    get().processAIResponses(turnId, conversationId, sanitizedPrompt, selectedModels || { claude: true, grok: true, gemini: true });
  },

  continueConversation: async (prompt: string, selectedModels?: { claude: boolean; grok: boolean; gemini: boolean }) => {
    // Validate input before processing
    const validation = validateSearchRequest(prompt, selectedModels || { claude: true, grok: true, gemini: true });
    if (!validation.isValid) {
      console.error('Invalid conversation input:', validation.errors);
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedPrompt = validation.sanitizedPrompt || prompt;
    const currentConv = get().currentConversation;
    if (!currentConv) {
      // If no current conversation, start a new one
      return get().startNewConversation(sanitizedPrompt, selectedModels);
    }

    const turnId = `turn-${Date.now()}`;
    
    // Add to history
    get().addToHistory(sanitizedPrompt);
    
    // Create loading responses for selected models
    const platforms = ['grok', 'claude', 'gemini'].filter(platform => 
      selectedModels ? selectedModels[platform as keyof typeof selectedModels] : true
    );
    
    const loadingResponses = platforms.map(platform => ({
      id: `${turnId}-${platform}`,
      platform: platform as 'grok' | 'claude' | 'gemini',
      content: '',
      confidence: 0,
      responseTime: 0,
      wordCount: 0,
      loading: true,
      timestamp: Date.now()
    }));
    
    // Create new conversation turn
    const newTurn: ConversationTurn = {
      id: turnId,
      prompt: sanitizedPrompt,
      timestamp: Date.now(),
      responses: loadingResponses,
      analysisData: null,
      fusionResult: null,
      loading: true,
      completed: false
    };

    // Add turn to current conversation
    set(state => ({
      currentConversation: state.currentConversation ? {
        ...state.currentConversation,
        turns: [...state.currentConversation.turns, newTurn],
        updatedAt: Date.now()
      } : null,
      conversationHistory: state.conversationHistory.map(conv =>
        conv.id === currentConv.id ? {
          ...conv,
          turns: [...conv.turns, newTurn],
          updatedAt: Date.now()
        } : conv
      )
    }));
    
    // Process AI responses
    get().processAIResponses(turnId, currentConv.id, sanitizedPrompt, selectedModels || { claude: true, grok: true, gemini: true });
  },

  processAIResponses: async (turnId: string, conversationId: string, prompt: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => {
    // Simulate progressive loading with real-time updates
    const totalSteps = 100;
    const stepDelay = 50; // 50ms per step = 5 seconds total
    
    // Update progress incrementally
    for (let step = 0; step <= totalSteps; step += 5) {
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      
      // Update the turn's progress
      set(state => {
        const updateTurnProgress = (turn: ConversationTurn) =>
          turn.id === turnId
            ? { ...turn, progress: step }
            : turn;

        return {
          currentConversation: state.currentConversation ? {
            ...state.currentConversation,
            turns: state.currentConversation.turns.map(updateTurnProgress)
          } : null,
          conversationHistory: state.conversationHistory.map(conv => ({
            ...conv,
            turns: conv.turns.map(updateTurnProgress)
          }))
        };
      });
    }
    
    try {
      // Use the API service wrapper
      const responses = await apiService.queryAllModels(prompt, selectedModels || { claude: true, grok: true, gemini: true });
      const analysisData = await apiService.getAnalysisData();
      
      // Pass the original prompt to getFusionResult for better synthesis
      const fusionResult = await apiService.getFusionResult(responses);
      
      // If we have Claude API and real responses, attempt real synthesis
      if (import.meta.env.VITE_CLAUDE_API_KEY && responses.length > 0) {
        try {
          console.log('🔄 Attempting real Claude synthesis with prompt context...');
          
          // Create a context-aware synthesis using realClaudeService
          const { realClaudeService } = await import('../services/realClaudeService');
          const synthesisResult = await realClaudeService.synthesizeResponses(prompt, responses);
          
          if (synthesisResult.success) {
            // Update fusion result with real synthesis
            const totalWords = responses.reduce((sum, r) => sum + r.wordCount, 0);
            const sources = {
              grok: Math.round((responses.find(r => r.platform === 'grok')?.wordCount || 0) / totalWords * 100),
              claude: Math.round((responses.find(r => r.platform === 'claude')?.wordCount || 0) / totalWords * 100),
              gemini: Math.round((responses.find(r => r.platform === 'gemini')?.wordCount || 0) / totalWords * 100)
            };
            
            // Normalize sources
            const total = sources.grok + sources.claude + sources.gemini;
            if (total > 0) {
              sources.grok = Math.round((sources.grok / total) * 100);
              sources.claude = Math.round((sources.claude / total) * 100);
              sources.gemini = 100 - sources.grok - sources.claude;
            }
            
            fusionResult.content = synthesisResult.data.content;
            fusionResult.confidence = synthesisResult.data.confidence;
            fusionResult.sources = sources;
            
            console.log('✅ Real Claude synthesis successful');
          }
        } catch (error) {
          console.warn('⚠️ Real synthesis failed, using mock:', error);
        }
      }
      
      // Update the store with the responses
      set(state => {
        const updateTurn = (turn: ConversationTurn) =>
          turn.id === turnId
            ? {
                ...turn,
                responses,
                loading: false,
                completed: true,
                progress: 100,
                analysisData,
                fusionResult
              }
            : turn;

        return {
          currentConversation: state.currentConversation ? {
            ...state.currentConversation,
            turns: state.currentConversation.turns.map(updateTurn)
          } : null,
          conversationHistory: state.conversationHistory.map(conv => ({
            ...conv,
            turns: conv.turns.map(updateTurn)
          }))
        };
      });
      
    } catch (error) {
      console.error('Error processing AI responses:', error);
      
      // Handle error - set error state for the turn
      set(state => {
        const updateTurnWithError = (turn: ConversationTurn) =>
          turn.id === turnId
            ? {
                ...turn,
                loading: false,
                completed: true,
                responses: turn.responses.map(response => ({
                  ...response,
                  loading: false,
                  error: 'Failed to process AI responses'
                })),
                progress: 0
              }
            : turn;

        return {
          currentConversation: state.currentConversation ? {
            ...state.currentConversation,
            turns: state.currentConversation.turns.map(updateTurnWithError)
          } : null,
          conversationHistory: state.conversationHistory.map(conv => ({
            ...conv,
            turns: conv.turns.map(updateTurnWithError)
          }))
        };
      });
    }
  },

  setResponse: (turnId: string, responseId: string, responseUpdate: Partial<AIResponse>) => {
    set(state => {
      const updateTurn = (turn: ConversationTurn) =>
        turn.id === turnId
          ? {
              ...turn,
              responses: turn.responses.map(response =>
                response.id === responseId ? { ...response, ...responseUpdate } : response
              )
            }
          : turn;

      return {
        currentConversation: state.currentConversation ? {
          ...state.currentConversation,
          turns: state.currentConversation.turns.map(updateTurn)
        } : null,
        conversationHistory: state.conversationHistory.map(conv => ({
          ...conv,
          turns: conv.turns.map(updateTurn)
        }))
      };
    });
  },

  clearResults: () => {
    set({
      currentConversation: null,
      conversationHistory: []
    });
  },

  addToHistory: (prompt: string) => {
    set(state => ({
      queryHistory: [prompt, ...state.queryHistory.filter(p => p !== prompt)].slice(0, 10)
    }));
  },

  loadConversation: (conversationId: string) => {
    const conversation = get().conversationHistory.find(conv => conv.id === conversationId);
    if (conversation) {
      set({ currentConversation: conversation });
    }
  },

  // Computed getters
  getCurrentTurn: () => {
    const currentConversation = get().currentConversation;
    if (!currentConversation || currentConversation.turns.length === 0) {
      return null;
    }
    return currentConversation.turns[currentConversation.turns.length - 1];
  },

  getLatestPrompt: () => {
    const currentTurn = get().getCurrentTurn();
    return currentTurn?.prompt || '';
  }
}));