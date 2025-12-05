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

export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  category?: 'lead' | 'booking' | 'support' | 'followup';
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
