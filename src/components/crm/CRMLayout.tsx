import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { AIPanel } from './AIPanel';
import { MetricsDashboard } from './MetricsDashboard';
import { TaskModal } from './TaskModal';
import { TaskReminder } from './TaskReminder';
import { TaskManagement } from './TaskManagement';
import { AdminPanel } from './AdminPanel';
import { SupervisionPanel } from './SupervisionPanel';
import { Conversation, Message, CustomerTask, DismissedActivityReport } from '@/types/crm';
import { mockConversations, mockAISuggestions, mockPackages, sdrConversation } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, MessageSquare, ListTodo, Settings, Eye, Sparkles, ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type ViewMode = 'chat' | 'dashboard' | 'tasks' | 'admin' | 'supervision';
type MobilePanel = 'list' | 'chat' | 'ai';

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

// Mock dismissed reports for demonstration
const initialDismissedReports: DismissedActivityReport[] = [
  {
    id: 'dismiss-1',
    conversationId: '3',
    contactName: 'Pedro Almeida',
    agentName: 'Carlos Silva',
    dismissType: 'permanent',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    conversationSummary: 'Cliente desistiu da viagem por motivos pessoais',
  },
  {
    id: 'dismiss-2',
    conversationId: '4',
    contactName: 'Ana Costa',
    agentName: 'Maria Santos',
    dismissType: 'later',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 30),
    conversationSummary: 'Aguardando retorno do cliente sobre datas',
  },
];

export function CRMLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(
    [...mockConversations, sdrConversation].map(c => ({ ...c, aiEnabled: true }))
  );
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [tasks, setTasks] = useState<CustomerTask[]>(initialTasks);
  const [dismissedReports, setDismissedReports] = useState<DismissedActivityReport[]>(initialDismissedReports);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [pendingConversationChange, setPendingConversationChange] = useState<Conversation | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('list');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    setMobilePanel('chat');
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

  const handleDismissActivity = (report: Omit<DismissedActivityReport, 'id' | 'dismissedAt'>) => {
    const newReport: DismissedActivityReport = {
      ...report,
      id: `dismiss-${Date.now()}`,
      dismissedAt: new Date(),
    };

    setDismissedReports((prev) => [...prev, newReport]);

    toast({
      title: 'Registro dispensado',
      description: report.dismissType === 'permanent' 
        ? 'A supervisão foi notificada sobre esta dispensa.'
        : 'Lembre-se de registrar a atividade posteriormente.',
      variant: report.dismissType === 'permanent' ? 'destructive' : 'default',
    });

    // Complete the conversation change if pending
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full">
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
              className="flex-1 gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Métricas
            </Button>
            <Button
              variant={viewMode === 'admin' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('admin')}
              className="flex-1 gap-2"
            >
              <Settings className="w-4 h-4" />
              Admin
            </Button>
            <Button
              variant={viewMode === 'supervision' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('supervision')}
              className="flex-1 gap-2"
            >
              <Eye className="w-4 h-4" />
              Supervisão
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
        ) : viewMode === 'admin' ? (
          <AdminPanel />
        ) : viewMode === 'supervision' ? (
          <SupervisionPanel
            conversations={conversations}
            tasks={tasks}
            dismissedReports={dismissedReports}
            onViewConversation={handleNavigateToTask}
          />
        ) : (
          <MetricsDashboard />
        )}
      </div>

      {/* Mobile Layout */}
      <div className="flex lg:hidden flex-col w-full h-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            {mobilePanel !== 'list' && viewMode === 'chat' && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobilePanel('list')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground">
              {viewMode === 'chat' 
                ? (mobilePanel === 'list' ? 'Conversas' : mobilePanel === 'ai' ? 'Assistente IA' : selectedConversation?.contact.name || 'Chat')
                : viewMode === 'tasks' ? 'Tarefas'
                : viewMode === 'dashboard' ? 'Métricas'
                : viewMode === 'admin' ? 'Administração'
                : 'Supervisão'
              }
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'chat' && mobilePanel === 'chat' && selectedConversation && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobilePanel('ai')}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </Button>
            )}
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="font-semibold text-foreground">Menu</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <Button
                      variant={viewMode === 'chat' ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => { setViewMode('chat'); setMobilePanel('list'); setShowMobileMenu(false); }}
                    >
                      <MessageSquare className="w-5 h-5" />
                      Conversas
                    </Button>
                    <Button
                      variant={viewMode === 'tasks' ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => { setViewMode('tasks'); setShowMobileMenu(false); }}
                    >
                      <ListTodo className="w-5 h-5" />
                      Tarefas
                    </Button>
                    <Button
                      variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => { setViewMode('dashboard'); setShowMobileMenu(false); }}
                    >
                      <BarChart3 className="w-5 h-5" />
                      Métricas
                    </Button>
                    <Button
                      variant={viewMode === 'admin' ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => { setViewMode('admin'); setShowMobileMenu(false); }}
                    >
                      <Settings className="w-5 h-5" />
                      Administração
                    </Button>
                    <Button
                      variant={viewMode === 'supervision' ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => { setViewMode('supervision'); setShowMobileMenu(false); }}
                    >
                      <Eye className="w-5 h-5" />
                      Supervisão
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'chat' ? (
            <>
              {mobilePanel === 'list' && (
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversation?.id || null}
                  onSelect={handleSelectConversation}
                />
              )}
              {mobilePanel === 'chat' && (
                <ChatWindow
                  conversation={selectedConversation}
                  onSendMessage={handleSendMessage}
                />
              )}
              {mobilePanel === 'ai' && (
                <AIPanel
                  conversation={selectedConversation}
                  suggestions={mockAISuggestions}
                  packages={mockPackages}
                  onUseSuggestion={handleUseSuggestion}
                  aiEnabled={selectedConversation?.aiEnabled ?? true}
                  onToggleAI={handleToggleAI}
                />
              )}
            </>
          ) : viewMode === 'tasks' ? (
            <TaskManagement
              tasks={tasks}
              onComplete={handleCompleteTask}
              onNavigate={handleNavigateToTask}
            />
          ) : viewMode === 'admin' ? (
            <AdminPanel />
          ) : viewMode === 'supervision' ? (
            <SupervisionPanel
              conversations={conversations}
              tasks={tasks}
              dismissedReports={dismissedReports}
              onViewConversation={handleNavigateToTask}
            />
          ) : (
            <MetricsDashboard />
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="border-t border-border bg-card px-2 py-2 safe-area-bottom">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 px-3 ${viewMode === 'chat' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => { setViewMode('chat'); setMobilePanel('list'); }}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">Conversas</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 px-3 ${viewMode === 'tasks' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('tasks')}
            >
              <ListTodo className="w-5 h-5" />
              <span className="text-xs">Tarefas</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 px-3 ${viewMode === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('dashboard')}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Métricas</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 px-3 ${viewMode === 'admin' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('admin')}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Admin</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={showTaskModal}
        conversation={selectedConversation}
        onClose={handleTaskModalClose}
        onSave={handleSaveTask}
        onDismiss={handleDismissActivity}
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
