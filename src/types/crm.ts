export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  tags?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status?: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'document' | 'audio';
}

export type ConversationReadStatus = 'pending' | 'unread' | 'read';

export interface Conversation {
  chatId?: string; // WhatsApp chat_id for Green API
  id: string;
  contact: Contact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  category?: 'lead' | 'booking' | 'support' | 'followup';
  aiEnabled?: boolean;
  readStatus: ConversationReadStatus;
  assignedTo?: string; // Agent ID who claimed the conversation
  isGroup?: boolean;
}

export interface AISuggestion {
  id: string;
  type: 'response' | 'action' | 'info';
  title: string;
  content: string;
  confidence: number;
  action?: () => void;
}

export interface TravelPackage {
  id: string;
  destination: string;
  price: number;
  duration: string;
  image?: string;
}

export type TaskStatus = 'em_orcamento' | 'follow_up' | 'em_qualificacao' | 'vendido';

export interface CustomerTask {
  id: string;
  conversationId: string;
  contactName: string;
  status: TaskStatus;
  nextStep: string;
  scheduledDate: Date;
  createdAt: Date;
  completed: boolean;
  snoozedUntil?: Date;
  value?: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type DismissType = 'permanent' | 'later';

export interface DismissedActivityReport {
  id: string;
  conversationId: string;
  contactName: string;
  agentName: string;
  dismissType: DismissType;
  reason?: string;
  dismissedAt: Date;
  conversationSummary: string;
}

export interface SupervisionReport {
  totalConversations: number;
  conversationsWithoutTasks: number;
  dismissedActivities: DismissedActivityReport[];
  agentStats: {
    agentName: string;
    totalDismissed: number;
    permanentDismissals: number;
    laterDismissals: number;
  }[];
}
