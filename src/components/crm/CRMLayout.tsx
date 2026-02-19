import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { AIPanel } from './AIPanel';
import { MetricsDashboard } from './MetricsDashboard';
import { TaskModal } from './TaskModal';
import { TaskReminder } from './TaskReminder';
import { TaskManagement } from './TaskManagement';
import { AdminPanel } from './AdminPanel';
import { SupervisionPanel } from './SupervisionPanel';
import { UnresponsedAlert } from './UnresponsedAlert';
import { CampaignManagement } from './CampaignManagement';
import { GamificationDashboard } from './gamification/GamificationDashboard';
import { AgentProfile } from './gamification/AgentProfile';
import { currentAgent } from '@/data/gamificationData';
import { Conversation, Message, CustomerTask, DismissedActivityReport, ConversationReadStatus } from '@/types/crm';
import { mockAISuggestions, mockPackages } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useWhatsAppMessages, WhatsAppConversation } from '@/hooks/useWhatsAppMessages';
import { useAutopilot } from '@/hooks/useAutopilot';
import { BarChart3, MessageSquare, ListTodo, Settings, Eye, Sparkles, ArrowLeft, Menu, Bell, Gamepad2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ViewMode = 'chat' | 'dashboard' | 'tasks' | 'admin' | 'supervision' | 'gamification' | 'campaigns';
type MobilePanel = 'list' | 'chat' | 'ai';

// Mock initial tasks for demonstration
const initialTasks: CustomerTask[] = [
  {
    id: 'task-1',
    conversationId: '1',
    contactName: 'Maria Silva',
    status: 'follow_up',
    nextStep: 'Enviar orçamento do pacote para Cancún',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    completed: false,
  },
  {
    id: 'task-2',
    conversationId: '2',
    contactName: 'João Santos',
    status: 'em_orcamento',
    nextStep: 'Confirmar disponibilidade do resort',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 2),
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

// Map WhatsApp conversation from DB to CRM Conversation type
const mapWhatsAppToConversation = (wa: WhatsAppConversation): Conversation => {
  const readStatus: ConversationReadStatus = 
    wa.read_status === 'pending' ? 'pending' : 
    wa.read_status === 'unread' ? 'unread' : 'read';
  
  return {
    id: wa.id,
    chatId: wa.chat_id, // WhatsApp chat_id for Green API
    contact: {
      id: wa.id,
      name: wa.contact_name || wa.contact_phone,
      phone: wa.contact_phone,
      avatar: wa.contact_avatar || undefined,
      status: (wa.status as 'online' | 'offline' | 'away') || 'offline',
      tags: wa.tags || [],
    },
    lastMessage: '',
    lastMessageTime: wa.updated_at 
      ? new Date(wa.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '',
    unreadCount: wa.read_status === 'unread' || wa.read_status === 'pending' ? 1 : 0,
    messages: [],
    category: (wa.category as 'lead' | 'booking' | 'support' | 'followup') || 'lead',
    aiEnabled: wa.ai_enabled ?? true,
    readStatus,
    assignedTo: wa.assigned_to || undefined,
    isGroup: wa.is_group ?? false,
  };
};

export function CRMLayout() {
  const { conversations: whatsappConversations, loading: conversationsLoading, loadConversations, unreadCounts, markAsRead } = useWhatsAppMessages();
  const { enableAutopilot, disableAutopilot, isAutopilotActive } = useAutopilot();
  // Local state for conversation overrides (until DB update propagates)
  const [conversationOverrides, setConversationOverrides] = useState<Record<string, Partial<Conversation>>>({});
  
  // Map WhatsApp conversations to CRM format with local overrides and unread counts
  const conversations = useMemo(() => 
    whatsappConversations.map(wa => {
      const base = mapWhatsAppToConversation(wa);
      const override = conversationOverrides[base.id];
      const unreadCount = unreadCounts[base.id] || (wa.read_status === 'unread' || wa.read_status === 'pending' ? 1 : 0);
      return override ? { ...base, ...override, unreadCount } : { ...base, unreadCount };
    }),
    [whatsappConversations, conversationOverrides, unreadCounts]
  );
  
  // Helper to update a conversation locally
  const updateConversationLocal = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversationOverrides(prev => ({
      ...prev,
      [conversationId]: { ...prev[conversationId], ...updates },
    }));
  }, []);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { messages: selectedConversationMessages } = useWhatsAppMessages(selectedConversation?.id);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [tasks, setTasks] = useState<CustomerTask[]>(initialTasks);
  const [dismissedReports, setDismissedReports] = useState<DismissedActivityReport[]>(initialDismissedReports);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [pendingConversationChange, setPendingConversationChange] = useState<Conversation | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('list');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [capturedDocumentData, setCapturedDocumentData] = useState<{
    name?: string;
    cpf?: string;
    birthDate?: string;
  } | null>(null);
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();
  const previousPendingCountRef = useRef<number>(0);
  const [newLeadAlert, setNewLeadAlert] = useState(false);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [completedServiceConversations, setCompletedServiceConversations] = useState<Set<string>>(new Set());

  // Count pending conversations
  const pendingCount = conversations.filter(c => c.readStatus === 'pending').length;

  // Check for new pending leads and trigger notification
  useEffect(() => {
    if (pendingCount > previousPendingCountRef.current) {
      // New pending lead arrived
      playNotificationSound();
      setNewLeadAlert(true);
      
      toast({
        title: '🔔 Nova lead pendente!',
        description: `Você tem ${pendingCount} lead${pendingCount > 1 ? 's' : ''} aguardando atendimento.`,
        className: 'bg-warning/10 border-warning',
      });

      // Reset alert animation after 3 seconds
      setTimeout(() => setNewLeadAlert(false), 3000);
    }
    previousPendingCountRef.current = pendingCount;
  }, [pendingCount, playNotificationSound, toast]);

  // Check for due tasks periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => [...prev]); // Trigger re-render to check for due tasks
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleClaimConversation = useCallback((conversationId: string) => {
    updateConversationLocal(conversationId, { readStatus: 'unread' as const, assignedTo: 'current-user' });
    toast({
      title: 'Atendimento assumido',
      description: 'Você assumiu este atendimento.',
    });
  }, [toast, updateConversationLocal]);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    // If there's a selected conversation and user is switching, check for existing future task or completed service
    if (selectedConversation && selectedConversation.id !== conversation.id) {
      const hasFutureTask = tasks.some(
        t => t.conversationId === selectedConversation.id && !t.completed && new Date(t.scheduledDate) > new Date()
      );
      const hasCompletedService = completedServiceConversations.has(selectedConversation.id);
      if (!hasFutureTask && !hasCompletedService) {
        setPendingConversationChange(conversation);
        setShowTaskModal(true);
        return;
      }
      // Has future task or completed service, skip modal and switch directly
    }

    // Mark as read when selecting
    markAsRead(conversation.id);
    updateConversationLocal(conversation.id, { unreadCount: 0, readStatus: 'read' as const });
    setSelectedConversation({ ...conversation, unreadCount: 0, readStatus: 'read' });
    setViewMode('chat');
    setMobilePanel('chat');
  }, [selectedConversation, tasks, completedServiceConversations, updateConversationLocal, markAsRead]);

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
    updateConversationLocal(selectedConversation.id, { lastMessage: content, lastMessageTime: newMessage.timestamp });
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
    updateConversationLocal(selectedConversation.id, { aiEnabled: enabled });

    toast({
      title: enabled ? 'IA Ativada' : 'IA Desativada',
      description: `Assistente IA ${enabled ? 'ativado' : 'desativado'} para ${selectedConversation.contact.name}`,
    });
  };

  const handleUpdateTags = (conversationId: string, tags: string[]) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      updateConversationLocal(conversationId, { 
        contact: { ...conversation.contact, tags } 
      });
    }
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation((prev) =>
        prev ? { ...prev, contact: { ...prev.contact, tags } } : null
      );
    }
    
    toast({
      title: 'Etiquetas atualizadas',
      description: 'As etiquetas do cliente foram salvas.',
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
      updateConversationLocal(pendingConversationChange.id, { unreadCount: 0 });
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
      setSelectedConversation({ ...conversation, unreadCount: 0, readStatus: 'read' });
      setViewMode('chat');
      setMobilePanel('chat');
    }
  };

  // Handlers for unresponsed alert actions
  const handleEnableAIForConversation = (conversationId: string) => {
    updateConversationLocal(conversationId, { aiEnabled: true });
    toast({
      title: 'IA Automática Ativada',
      description: 'A IA responderá automaticamente este cliente.',
    });
  };

  const handleTransferConversation = (conversationId: string) => {
    // In real app, would open transfer dialog
    toast({
      title: 'Transferência Solicitada',
      description: 'A conversa será transferida para outro atendente.',
    });
  };

  const handleRequestSupervisorHelp = (conversationId: string) => {
    toast({
      title: 'Ajuda Solicitada',
      description: 'A supervisão foi notificada e irá auxiliar.',
      className: 'bg-warning/10 border-warning',
    });
  };

  const handleDismissActivity = (report: Omit<DismissedActivityReport, 'id' | 'dismissedAt'>) => {
    const newReport: DismissedActivityReport = {
      ...report,
      id: `dismiss-${Date.now()}`,
      dismissedAt: new Date(),
    };

    setDismissedReports((prev) => [...prev, newReport]);

    // If "later" dismiss, create a reminder task in 60 minutes
    if (report.dismissType === 'later' && selectedConversation) {
      const reminderTask: CustomerTask = {
        id: `task-dismiss-${Date.now()}`,
        conversationId: report.conversationId,
        contactName: report.contactName,
        status: 'follow_up',
        nextStep: `⚠️ Lembrete: registrar atividade dispensada para ${report.contactName}`,
        scheduledDate: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        completed: false,
      };
      setTasks((prev) => [...prev, reminderTask]);
    }

    toast({
      title: 'Registro dispensado',
      description: report.dismissType === 'permanent' 
        ? 'A supervisão foi notificada sobre esta dispensa.'
        : 'Você será lembrado em 60 minutos para registrar a atividade.',
      variant: report.dismissType === 'permanent' ? 'destructive' : 'default',
    });

    // Complete the conversation change if pending
    if (pendingConversationChange) {
      updateConversationLocal(pendingConversationChange.id, { unreadCount: 0 });
      setSelectedConversation({ ...pendingConversationChange, unreadCount: 0 });
      setPendingConversationChange(null);
    }
  };

  const handleServiceCompleted = useCallback((conversationId: string) => {
    setCompletedServiceConversations(prev => new Set(prev).add(conversationId));
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full">
        {/* Conversations Sidebar - 320px */}
        <div className="w-80 shrink-0 flex flex-col">
          {/* Navigation Tabs */}
          <div className="p-3 border-b border-border bg-card flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('chat')}
                className={cn(
                  "flex-1 gap-2 relative",
                  newLeadAlert && "animate-pulse"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Conversas
                {pendingCount > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-warning text-warning-foreground text-xs font-bold flex items-center justify-center",
                    newLeadAlert && "animate-bounce"
                  )}>
                    {pendingCount}
                  </span>
                )}
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
            {gamificationEnabled && (
              <Button
                variant={viewMode === 'gamification' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gamification')}
                className="flex-1 gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                Gamificação
              </Button>
            )}
            <Button
              variant={viewMode === 'campaigns' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('campaigns')}
              className="flex-1 gap-2"
            >
              <Megaphone className="w-4 h-4" />
              Campanhas
            </Button>
          </div>
          {/* Agent Profile Mini */}
          {gamificationEnabled && (
            <div className="px-3 pb-3">
              <AgentProfile agent={currentAgent} compact />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id || null}
              onSelect={handleSelectConversation}
              onClaimConversation={handleClaimConversation}
              onNewConversation={(id) => {
                loadConversations();
                const newConv = conversations.find(c => c.id === id);
                if (newConv) handleSelectConversation(newConv);
              }}
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
                capturedDocumentData={capturedDocumentData}
                onServiceCompleted={handleServiceCompleted}
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
                onUpdateTags={handleUpdateTags}
                onDocumentDataCaptured={setCapturedDocumentData}
                whatsappMessages={selectedConversationMessages}
                autopilotEnabled={selectedConversation ? isAutopilotActive(selectedConversation.id) : false}
                onAutopilotToggle={(enabled) => {
                  if (selectedConversation) {
                    if (enabled) {
                      enableAutopilot(selectedConversation.id);
                    } else {
                      disableAutopilot(selectedConversation.id);
                    }
                  }
                }}
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
          <AdminPanel 
            gamificationEnabled={gamificationEnabled}
            onGamificationToggle={setGamificationEnabled}
          />
        ) : viewMode === 'supervision' ? (
          <SupervisionPanel
            conversations={conversations}
            tasks={tasks}
            dismissedReports={dismissedReports}
            onViewConversation={handleNavigateToTask}
          />
        ) : viewMode === 'gamification' && gamificationEnabled ? (
          <GamificationDashboard />
        ) : viewMode === 'campaigns' ? (
          <CampaignManagement />
        ) : (
          <MetricsDashboard />
        )}
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col w-full h-full">
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
                : viewMode === 'campaigns' ? 'Campanhas'
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
                    <Button
                      variant={viewMode === 'campaigns' ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => { setViewMode('campaigns'); setShowMobileMenu(false); }}
                    >
                      <Megaphone className="w-5 h-5" />
                      Campanhas
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
                  onClaimConversation={handleClaimConversation}
                  onNewConversation={(id) => {
                    loadConversations();
                    setMobilePanel('chat');
                  }}
                />
              )}
              {mobilePanel === 'chat' && (
                <ChatWindow
                  conversation={selectedConversation}
                  onSendMessage={handleSendMessage}
                  capturedDocumentData={capturedDocumentData}
                  onServiceCompleted={handleServiceCompleted}
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
                  onUpdateTags={handleUpdateTags}
                  onDocumentDataCaptured={setCapturedDocumentData}
                  whatsappMessages={selectedConversationMessages}
                  autopilotEnabled={selectedConversation ? isAutopilotActive(selectedConversation.id) : false}
                  onAutopilotToggle={(enabled) => {
                    if (selectedConversation) {
                      if (enabled) {
                        enableAutopilot(selectedConversation.id);
                      } else {
                        disableAutopilot(selectedConversation.id);
                      }
                    }
                  }}
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
          ) : viewMode === 'campaigns' ? (
            <CampaignManagement />
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
              className={cn(
                "flex-col gap-1 h-auto py-2 px-3 relative",
                viewMode === 'chat' ? 'text-primary' : 'text-muted-foreground',
                newLeadAlert && "animate-pulse"
              )}
              onClick={() => { setViewMode('chat'); setMobilePanel('list'); }}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">Conversas</span>
              {pendingCount > 0 && (
                <span className={cn(
                  "absolute top-0 right-1 h-4 min-w-4 px-0.5 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center",
                  newLeadAlert && "animate-bounce"
                )}>
                  {pendingCount}
                </span>
              )}
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

      {/* Unresponsed Conversations Alert */}
      <UnresponsedAlert
        conversations={conversations}
        onEnableAI={handleEnableAIForConversation}
        onTransfer={handleTransferConversation}
        onRequestHelp={handleRequestSupervisorHelp}
        onNavigate={handleNavigateToTask}
        isSupervisor={viewMode === 'supervision'}
      />
    </div>
  );
}
