import { useState, useCallback } from 'react';
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

export function useAIAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (
    messages: AIMessage[],
    conversationContext?: ConversationContext,
    type: 'chat' | 'suggest' | 'analyze' = 'chat'
  ): Promise<string | null> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages,
          conversationContext,
          type,
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
  }, [toast]);

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

  return {
    sendMessage,
    generateSuggestions,
    analyzeConversation,
    isLoading,
  };
}
