import { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { AIPanel } from './AIPanel';
import { Conversation, Message } from '@/types/crm';
import { mockConversations, mockAISuggestions, mockPackages } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export function CRMLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { toast } = useToast();

  const handleSelectConversation = (conversation: Conversation) => {
    // Mark as read when selected
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );
    setSelectedConversation({ ...conversation, unreadCount: 0 });
  };

  const handleSendMessage = (content: string) => {
    if (!selectedConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId: selectedConversation.id,
      content,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      sender: 'user',
      status: 'sent',
      type: 'text',
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: content,
      lastMessageTime: newMessage.timestamp,
    };

    setSelectedConversation(updatedConversation);
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversation.id ? updatedConversation : c))
    );
  };

  const handleUseSuggestion = (suggestion: { type: string; content: string; title: string }) => {
    if (suggestion.type === 'response') {
      handleSendMessage(suggestion.content);
      toast({
        title: 'Mensagem enviada',
        description: 'A sugestão da IA foi utilizada.',
      });
    } else {
      toast({
        title: suggestion.title,
        description: 'Ação iniciada pelo assistente.',
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Conversations Sidebar - 320px */}
      <div className="w-80 shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Chat Window - Flex grow */}
      <div className="flex-1 min-w-0">
        <ChatWindow
          conversation={selectedConversation}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* AI Panel - 340px */}
      <div className="w-[340px] shrink-0">
        <AIPanel
          conversation={selectedConversation}
          suggestions={mockAISuggestions}
          packages={mockPackages}
          onUseSuggestion={handleUseSuggestion}
        />
      </div>
    </div>
  );
}
