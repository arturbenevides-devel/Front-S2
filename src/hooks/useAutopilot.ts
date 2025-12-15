import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppConversation } from './useWhatsAppMessages';

interface AutopilotConfig {
  conversationId: string;
  chatId: string;
  contactName: string;
}

export function useAutopilot() {
  const [activeAutopilots, setActiveAutopilots] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Enable autopilot for a conversation
  const enableAutopilot = useCallback((conversationId: string) => {
    setActiveAutopilots(prev => new Set([...prev, conversationId]));
    console.log('Autopilot enabled for:', conversationId);
  }, []);

  // Disable autopilot for a conversation
  const disableAutopilot = useCallback((conversationId: string) => {
    setActiveAutopilots(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      return newSet;
    });
    console.log('Autopilot disabled for:', conversationId);
  }, []);

  // Check if autopilot is active for a conversation
  const isAutopilotActive = useCallback((conversationId: string) => {
    return activeAutopilots.has(conversationId);
  }, [activeAutopilots]);

  // Generate and send AI response
  const generateAndSendResponse = useCallback(async (
    conversationId: string,
    chatId: string,
    contactName: string,
    incomingMessage: string
  ) => {
    // Skip if already processing this conversation
    if (isProcessing[conversationId]) {
      console.log('Already processing autopilot for:', conversationId);
      return;
    }

    setIsProcessing(prev => ({ ...prev, [conversationId]: true }));

    try {
      // Fetch recent messages for context
      const { data: messagesData, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(15);

      if (messagesError) throw messagesError;

      const recentMessages = (messagesData || []).reverse().map(m => ({
        sender: m.sender === 'customer' ? 'contact' : 'agent',
        content: m.content,
      }));

      // Call AI to generate response
      console.log('Generating autopilot response for:', contactName);
      
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: 'Gere uma resposta profissional e amigável para o cliente.' }],
          conversationContext: {
            contactName,
            category: 'lead',
            recentMessages,
          },
          type: 'autopilot',
        },
      });

      if (aiError) throw aiError;

      const aiResponse = aiData?.content;
      if (!aiResponse) {
        throw new Error('No AI response generated');
      }

      console.log('Autopilot response generated:', aiResponse.substring(0, 100) + '...');

      // Send the response via WhatsApp
      const { data: sendData, error: sendError } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          chatId,
          message: aiResponse,
          conversationId,
        },
      });

      if (sendError) throw sendError;

      if (!sendData?.success) {
        throw new Error(sendData?.error || 'Failed to send message');
      }

      console.log('Autopilot message sent successfully');

      toast({
        title: '🤖 Piloto Automático',
        description: `Resposta enviada para ${contactName}`,
      });

    } catch (error) {
      console.error('Autopilot error:', error);
      toast({
        title: 'Erro no Piloto Automático',
        description: error instanceof Error ? error.message : 'Falha ao gerar resposta automática.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(prev => ({ ...prev, [conversationId]: false }));
    }
  }, [isProcessing, toast]);

  // Listen for new messages and respond automatically
  useEffect(() => {
    if (activeAutopilots.size === 0) return;

    const channel = supabase
      .channel('autopilot-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            conversation_id: string;
            sender: string;
            content: string;
          };

          // Skip if not from customer or already processed
          if (newMsg.sender !== 'customer') return;
          if (processedMessagesRef.current.has(newMsg.id)) return;
          
          // Mark as processed
          processedMessagesRef.current.add(newMsg.id);

          // Check if autopilot is active for this conversation
          if (!activeAutopilots.has(newMsg.conversation_id)) return;

          console.log('Autopilot triggered for message:', newMsg.id);

          // Get conversation details
          const { data: convData, error: convError } = await supabase
            .from('whatsapp_conversations')
            .select('chat_id, contact_name, contact_phone')
            .eq('id', newMsg.conversation_id)
            .single();

          if (convError || !convData) {
            console.error('Failed to get conversation:', convError);
            return;
          }

          // Small delay to simulate natural response time
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

          // Generate and send response
          await generateAndSendResponse(
            newMsg.conversation_id,
            convData.chat_id,
            convData.contact_name || convData.contact_phone,
            newMsg.content
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeAutopilots, generateAndSendResponse]);

  return {
    enableAutopilot,
    disableAutopilot,
    isAutopilotActive,
    isProcessing,
    activeAutopilots: Array.from(activeAutopilots),
  };
}
