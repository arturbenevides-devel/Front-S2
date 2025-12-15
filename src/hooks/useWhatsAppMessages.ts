import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';
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
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();
  const currentConversationIdRef = useRef<string | undefined>(conversationId);

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

  // Keep ref updated
  useEffect(() => {
    currentConversationIdRef.current = conversationId;
  }, [conversationId]);

  // Update pending count when conversations change
  useEffect(() => {
    const count = conversations.filter(c => c.read_status === 'pending').length;
    setPendingCount(count);
  }, [conversations]);

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
            const newConv = payload.new as WhatsAppConversation;
            setConversations(prev => [newConv, ...prev]);
            
            // Notify for new pending conversations
            if (newConv.read_status === 'pending') {
              playNotificationSound();
              toast({
                title: 'Nova conversa!',
                description: `${newConv.contact_name || newConv.contact_phone} iniciou uma conversa`,
              });
            }
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

    // Global messages channel for notifications
    const globalMessagesChannel = supabase
      .channel('whatsapp-all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          const newMsg = payload.new as { id: string; conversation_id: string; sender: string; content: string };
          
          // Only notify for incoming messages (from contacts, not agents)
          if (newMsg.sender !== 'agent' && newMsg.sender !== 'user') {
            // Increment unread count for this conversation
            setUnreadCounts(prev => ({
              ...prev,
              [newMsg.conversation_id]: (prev[newMsg.conversation_id] || 0) + 1,
            }));
            
            // Don't notify if we're already viewing this conversation
            if (currentConversationIdRef.current !== newMsg.conversation_id) {
              playNotificationSound();
              
              // Find conversation to get contact name
              const conv = conversations.find(c => c.id === newMsg.conversation_id);
              toast({
                title: conv?.contact_name || 'Nova mensagem',
                description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(globalMessagesChannel);
    };
  }, [playNotificationSound, toast, conversations]);

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

  // Function to mark conversation as read
  const markAsRead = useCallback((convId: string) => {
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[convId];
      return newCounts;
    });
  }, []);

  return {
    messages,
    conversations,
    unreadCounts,
    loading,
    sending,
    pendingCount,
    sendMessage,
    loadConversations,
    loadMessages,
    setMessages,
    markAsRead,
  };
};
