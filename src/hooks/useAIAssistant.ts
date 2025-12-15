import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationContext {
  contactName: string;
  category?: string;
  recentMessages?: { sender: string; content: string }[];
}

interface AISettings {
  systemPrompt?: string;
  autopilotPrompt?: string;
  suggestionPrompt?: string;
  analysisPrompt?: string;
  knowledgeBase?: string[];
  companyInfo?: string;
  productsInfo?: string;
  faqInfo?: string;
}

export function useAIAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const { toast } = useToast();

  // Load AI settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai_settings');
    if (savedSettings) {
      try {
        setAISettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse AI settings:', e);
      }
    }
  }, []);

  const sendMessage = useCallback(async (
    messages: AIMessage[],
    conversationContext?: ConversationContext,
    type: 'chat' | 'suggest' | 'analyze' | 'autopilot' = 'chat'
  ): Promise<string | null> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages,
          conversationContext,
          type,
          aiSettings, // Pass custom AI settings
        },
      });

      if (error) {
        console.error('AI Assistant error:', error);
        toast({
          title: 'Erro na IA',
          description: error.message || 'Não foi possível processar a solicitação.',
          variant: 'destructive',
        });
        return null;
      }

      if (data.error) {
        toast({
          title: 'Erro na IA',
          description: data.error,
          variant: 'destructive',
        });
        return null;
      }

      return data.content;
    } catch (err) {
      console.error('AI Assistant exception:', err);
      toast({
        title: 'Erro na IA',
        description: 'Falha ao conectar com o assistente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, aiSettings]);

  const generateSuggestions = useCallback(async (
    conversationContext: ConversationContext
  ): Promise<string | null> => {
    return sendMessage(
      [{ role: 'user', content: 'Gere sugestões de respostas para o cliente baseado no contexto.' }],
      conversationContext,
      'suggest'
    );
  }, [sendMessage]);

  const analyzeConversation = useCallback(async (
    conversationContext: ConversationContext
  ): Promise<string | null> => {
    return sendMessage(
      [{ role: 'user', content: 'Analise o perfil deste cliente e recomende próximos passos.' }],
      conversationContext,
      'analyze'
    );
  }, [sendMessage]);

  const refreshSettings = useCallback(() => {
    const savedSettings = localStorage.getItem('ai_settings');
    if (savedSettings) {
      try {
        setAISettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse AI settings:', e);
      }
    }
  }, []);

  return {
    sendMessage,
    generateSuggestions,
    analyzeConversation,
    isLoading,
    aiSettings,
    refreshSettings,
  };
}
