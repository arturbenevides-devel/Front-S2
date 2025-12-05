import { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { AIPanel } from './AIPanel';
import { MetricsDashboard } from './MetricsDashboard';
import { Conversation, Message } from '@/types/crm';
import { mockConversations, mockAISuggestions, mockPackages } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'chat' | 'dashboard';

export function CRMLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const { toast } = useToast();

  const handleSelectConversation = (conversation: Conversation) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );
    setSelectedConversation({ ...conversation, unreadCount: 0 });
    setViewMode('chat');
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
      <div className="w-80 shrink-0 flex flex-col">
        {/* Navigation Tabs */}
        <div className="p-3 border-b border-border bg-card flex gap-2">
          <Button
            variant={viewMode === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('chat')}
            className="flex-1 gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Conversas
          </Button>
          <Button
            variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('dashboard')}
            className="flex-1 gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Métricas
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id || null}
            onSelect={handleSelectConversation}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'chat' ? (
        <>
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
        </>
      ) : (
        <MetricsDashboard />
      )}
    </div>
  );
}
