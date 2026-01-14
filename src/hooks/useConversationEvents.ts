import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ConversationEvent {
  id: string;
  conversation_id: string;
  event_type: string;
  event_data: Json;
  actor_name: string | null;
  actor_department: string | null;
  created_at: string;
}

export type EventType = 
  | 'agent_transfer'
  | 'tag_added'
  | 'tag_removed'
  | 'quote_created'
  | 'quote_sent'
  | 'status_changed'
  | 'category_changed'
  | 'ai_enabled'
  | 'ai_disabled'
  | 'sale_completed'
  | 'service_completed'
  | 'note_added'
  | 'custom';

export const EVENT_LABELS: Record<EventType, string> = {
  agent_transfer: 'Transferência de atendente',
  tag_added: 'Etiqueta adicionada',
  tag_removed: 'Etiqueta removida',
  quote_created: 'Orçamento criado',
  quote_sent: 'Orçamento enviado',
  status_changed: 'Status alterado',
  category_changed: 'Categoria alterada',
  ai_enabled: 'IA ativada',
  ai_disabled: 'IA desativada',
  sale_completed: 'Venda concluída',
  service_completed: 'Atendimento concluído',
  note_added: 'Nota interna adicionada',
  custom: 'Evento personalizado',
};

export const EVENT_ICONS: Record<EventType, string> = {
  agent_transfer: '🔄',
  tag_added: '🏷️',
  tag_removed: '🏷️',
  quote_created: '📋',
  quote_sent: '📤',
  status_changed: '📊',
  category_changed: '📂',
  ai_enabled: '🤖',
  ai_disabled: '🤖',
  sale_completed: '💰',
  service_completed: '✅',
  note_added: '📝',
  custom: '📌',
};

export function useConversationEvents(conversationId: string | undefined) {
  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!conversationId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation_events')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Load events on mount and when conversation changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`events-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_events',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newEvent = payload.new as ConversationEvent;
          setEvents(prev => [...prev, newEvent]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const addEvent = useCallback(async (
    eventType: EventType,
    eventData: Record<string, unknown> = {},
    actorName?: string,
    actorDepartment?: string
  ) => {
    if (!conversationId) return null;

    // Get actor info from localStorage if not provided
    const name = actorName || localStorage.getItem('userName') || 'Sistema';
    const department = actorDepartment || localStorage.getItem('userDepartment') || 'Sistema';

    try {
      const { data, error } = await supabase
        .from('conversation_events')
        .insert([{
          conversation_id: conversationId,
          event_type: eventType,
          event_data: eventData as Json,
          actor_name: name,
          actor_department: department,
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding event:', error);
      return null;
    }
  }, [conversationId]);

  return {
    events,
    loading,
    addEvent,
    loadEvents,
  };
}
