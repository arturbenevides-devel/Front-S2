import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { AIPanel } from './AIPanel';
import { MetricsDashboard } from './MetricsDashboard';
import { TaskModal } from './TaskModal';
import { TaskReminder } from './TaskReminder';
import { TaskManagement } from './TaskManagement';
import { Conversation, Message, CustomerTask } from '@/types/crm';
import { mockConversations, mockAISuggestions, mockPackages } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, MessageSquare, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'chat' | 'dashboard' | 'tasks';

// Mock initial tasks for demonstration
const initialTasks: CustomerTask[] = [
  {
    id: 'task-1',
    conversationId: '1',
    contactName: 'Maria Silva',
    status: 'follow_up',
    nextStep: 'Enviar orçamento do pacote para Cancún',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    completed: false,
  },
  {
    id: 'task-2',
    conversationId: '2',
    contactName: 'João Santos',
    status: 'em_orcamento',
    nextStep: 'Confirmar disponibilidade do resort',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    completed: false,
  },
];

export function CRMLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(
    mockConversations.map(c => ({ ...c, aiEnabled: true }))
  );
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [tasks, setTasks] = useState<CustomerTask[]>(initialTasks);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [pendingConversationChange, setPendingConversationChange] = useState<Conversation | null>(null);
  const { toast } = useToast();

  // Check for due tasks periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => [...prev]); // Trigger re-render to check for due tasks
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    // If there's a selected conversation and user is switching, show task modal
    if (selectedConversation && selectedConversation.id !== conversation.id) {
      setPendingConversationChange(conversation);
      setShowTaskModal(true);
      return;
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );
    setSelectedConversation({ ...conversation, unreadCount: 0 });
    setViewMode('chat');
  }, [selectedConversation]);

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

  const handleToggleAI = (enabled: boolean) => {
    if (!selectedConversation) return;

    const updatedConversation = { ...selectedConversation, aiEnabled: enabled };
    setSelectedConversation(updatedConversation);
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversation.id ? updatedConversation : c))
    );

    toast({
      title: enabled ? 'IA Ativada' : 'IA Desativada',
      description: `Assistente IA ${enabled ? 'ativado' : 'desativado'} para ${selectedConversation.contact.name}`,
    });
  };

  const handleSaveTask = (taskData: Omit<CustomerTask, 'id' | 'createdAt' | 'completed' | 'contactName'>) => {
    if (!selectedConversation) return;

    const newTask: CustomerTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      contactName: selectedConversation.contact.name,
      createdAt: new Date(),
      completed: false,
    };

    setTasks((prev) => [...prev, newTask]);

    toast({
      title: 'Tarefa salva',
      description: `Próximo passo agendado para ${new Date(taskData.scheduledDate).toLocaleString('pt-BR')}`,
    });

    // Complete the conversation change
    if (pendingConversationChange) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === pendingConversationChange.id ? { ...c, unreadCount: 0 } : c
        )
      );
      setSelectedConversation({ ...pendingConversationChange, unreadCount: 0 });
      setPendingConversationChange(null);
    }
  };

  const handleTaskModalClose = () => {
    setShowTaskModal(false);
    // Don't change conversation if modal is closed without saving
    setPendingConversationChange(null);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    toast({
      title: 'Tarefa concluída',
      description: 'A tarefa foi marcada como concluída.',
    });
  };

  const handleSnoozeTask = (taskId: string, minutes: number) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, snoozedUntil } : t))
    );
    toast({
      title: 'Lembrete adiado',
      description: `Você será lembrado em ${minutes} minutos.`,
    });
  };

  const handleDismissTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleNavigateToTask = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setSelectedConversation({ ...conversation, unreadCount: 0 });
      setViewMode('chat');
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Conversations Sidebar - 320px */}
      <div className="w-80 shrink-0 flex flex-col">
        {/* Navigation Tabs */}
        <div className="p-3 border-b border-border bg-card flex flex-col gap-2">
          <div className="flex gap-2">
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
              variant={viewMode === 'tasks' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tasks')}
              className="flex-1 gap-2"
            >
              <ListTodo className="w-4 h-4" />
              Tarefas
            </Button>
          </div>
          <Button
            variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('dashboard')}
            className="gap-2"
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
              aiEnabled={selectedConversation?.aiEnabled ?? true}
              onToggleAI={handleToggleAI}
            />
          </div>
        </>
      ) : viewMode === 'tasks' ? (
        <TaskManagement
          tasks={tasks}
          onComplete={handleCompleteTask}
          onNavigate={handleNavigateToTask}
        />
      ) : (
        <MetricsDashboard />
      )}

      {/* Task Modal */}
      <TaskModal
        open={showTaskModal}
        conversation={selectedConversation}
        onClose={handleTaskModalClose}
        onSave={handleSaveTask}
      />

      {/* Task Reminders */}
      <TaskReminder
        tasks={tasks}
        onComplete={handleCompleteTask}
        onSnooze={handleSnoozeTask}
        onDismiss={handleDismissTask}
        onNavigate={handleNavigateToTask}
      />
    </div>
  );
}
