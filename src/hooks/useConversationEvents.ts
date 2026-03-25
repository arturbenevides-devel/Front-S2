import { useState, useCallback } from 'react';

export interface ConversationEvent {
  id: string;
  conversation_id: string;
  event_type: string;
  event_data: unknown;
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

/**
 * Mock hook — Conversation Events will be implemented in a future phase.
 */
export function useConversationEvents(_conversationId: string | undefined) {
  const [events] = useState<ConversationEvent[]>([]);
  const [loading] = useState(false);

  const loadEvents = useCallback(async () => {
    console.warn('[MOCK] loadEvents — not yet integrated');
  }, []);

  const addEvent = useCallback(async (
    _eventType: EventType,
    _eventData: Record<string, unknown> = {},
    _actorName?: string,
    _actorDepartment?: string,
  ) => {
    console.warn('[MOCK] addEvent — not yet integrated');
    return null;
  }, []);

  return {
    events,
    loading,
    addEvent,
    loadEvents,
  };
}
