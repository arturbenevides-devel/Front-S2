import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: string;
  message_type: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppConversation {
  id: string;
  chat_id: string;
  contact_name: string | null;
  contact_phone: string;
  contact_avatar: string | null;
  status: string | null;
  category: string | null;
  tags: string[] | null;
  assigned_to: string | null;
  ai_enabled: boolean | null;
  read_status: string | null;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Erro ao carregar conversas',
        description: 'Não foi possível carregar as conversas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      const formattedMessages: WhatsAppMessage[] = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        sender: msg.sender as 'user' | 'agent',
        timestamp: msg.timestamp,
        message_type: msg.message_type || 'text',
        status: msg.status || 'sent',
        metadata: msg.metadata as Record<string, unknown> | undefined,
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Erro ao carregar mensagens',
        description: 'Não foi possível carregar as mensagens.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Send message via Edge Function
  const sendMessage = useCallback(async (chatId: string, message: string, convId?: string) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          chatId,
          message,
          conversationId: convId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Add message to local state immediately
        if (convId) {
          const newMessage: WhatsAppMessage = {
            id: data.messageId || crypto.randomUUID(),
            conversation_id: convId,
            content: message,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            message_type: 'text',
            status: 'sent',
          };
          setMessages(prev => [...prev, newMessage]);
        }
        return { success: true, messageId: data.messageId };
      } else {
        throw new Error(data?.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setSending(false);
    }
  }, [toast]);

  // Subscribe to realtime updates
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('whatsapp-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
        },
        (payload) => {
          console.log('Conversation change:', payload);
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as WhatsAppConversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new as WhatsAppConversation : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setConversations(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  // Subscribe to messages for current conversation
  useEffect(() => {
    if (!conversationId) return;

    const messagesChannel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message:', payload);
          const newMsg = payload.new as WhatsAppMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [conversationId]);

  // Load messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  // Initial load of conversations
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    messages,
    conversations,
    loading,
    sending,
    sendMessage,
    loadConversations,
    loadMessages,
    setMessages,
  };
};
