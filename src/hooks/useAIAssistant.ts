import { useState, useCallback } from 'react';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationContext {
  contactName: string;
  category?: string;
  recentMessages?: { sender: string; content: string }[];
}

/**
 * Mock hook — AI Assistant will be implemented in a future phase.
 */
export function useAIAssistant() {
  const [isLoading] = useState(false);
  const [aiSettings] = useState(null);

  const sendMessage = useCallback(async (
    _messages: AIMessage[],
    _conversationContext?: ConversationContext,
    _type: 'chat' | 'suggest' | 'analyze' | 'autopilot' = 'chat'
  ): Promise<string | null> => {
    console.warn('[MOCK] AI sendMessage — not yet integrated');
    return null;
  }, []);

  const generateSuggestions = useCallback(async (
    _conversationContext: ConversationContext
  ): Promise<string | null> => {
    console.warn('[MOCK] AI generateSuggestions — not yet integrated');
    return null;
  }, []);

  const analyzeConversation = useCallback(async (
    _conversationContext: ConversationContext
  ): Promise<string | null> => {
    console.warn('[MOCK] AI analyzeConversation — not yet integrated');
    return null;
  }, []);

  const refreshSettings = useCallback(() => {}, []);

  return {
    sendMessage,
    generateSuggestions,
    analyzeConversation,
    isLoading,
    aiSettings,
    refreshSettings,
  };
}
