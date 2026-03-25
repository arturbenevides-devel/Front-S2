import { useState, useCallback } from 'react';

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'agent' | 'customer';
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
  is_group: boolean | null;
  created_at: string;
  updated_at: string;
}

/**
 * Mock hook — WhatsApp module will be implemented in a future phase.
 * Interfaces are preserved so components don't break.
 */
export const useWhatsAppMessages = (_conversationId?: string) => {
  const [messages] = useState<WhatsAppMessage[]>([]);
  const [conversations] = useState<WhatsAppConversation[]>([]);
  const [unreadCounts] = useState<Record<string, number>>({});
  const [loading] = useState(false);
  const [sending] = useState(false);
  const [pendingCount] = useState(0);

  const sendMessage = useCallback(async (_chatId: string, _message: string, _convId?: string) => {
    console.warn('[MOCK] sendMessage — WhatsApp not yet integrated');
    return { success: false, error: 'Not implemented' };
  }, []);

  const loadConversations = useCallback(async () => {
    console.warn('[MOCK] loadConversations — WhatsApp not yet integrated');
  }, []);

  const loadMessages = useCallback(async (_convId: string) => {
    console.warn('[MOCK] loadMessages — WhatsApp not yet integrated');
  }, []);

  const setMessages = useCallback(() => {}, []);
  const markAsRead = useCallback((_convId: string) => {}, []);

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
