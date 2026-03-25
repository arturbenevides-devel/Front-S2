import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  AlertTriangle, 
  Bot, 
  ArrowRightLeft, 
  HandHelping, 
  Clock, 
  X,
  Bell,
  Users,
  Eye
} from 'lucide-react';
import { Conversation } from '@/types/crm';
import { cn } from '@/lib/utils';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface UnresponsedConversation {
  conversation: Conversation;
  waitingMinutes: number;
  agentName?: string;
}

interface UnresponsedAlertProps {
  conversations: Conversation[];
  onEnableAI: (conversationId: string) => void;
  onTransfer: (conversationId: string) => void;
  onRequestHelp: (conversationId: string) => void;
  onNavigate: (conversationId: string) => void;
  isSupervisor?: boolean;
  currentUserFullName?: string;
}

function resolveAgentLabel(conv: Conversation, currentUserFullName?: string): string {
  if (conv.id === 'sdr-1') return 'IA Automática';
  if (conv.assignedTo) return conv.assignedTo;
  if (currentUserFullName?.trim()) return currentUserFullName.trim();
  return 'Não atribuído';
}

export function UnresponsedAlert({
  conversations,
  onEnableAI,
  onTransfer,
  onRequestHelp,
  onNavigate,
  isSupervisor = false,
  currentUserFullName,
}: UnresponsedAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { playNotificationSound } = useNotificationSound();

  // Find conversations without response for more than 1 hour (simulated with 2 minutes for demo)
  const getUnresponsedConversations = (): UnresponsedConversation[] => {
    return conversations
      .filter((conv) => {
        // Check if last message is from contact (not user)
        const lastMessage = conv.messages[conv.messages.length - 1];
        if (!lastMessage || lastMessage.sender !== 'contact') return false;
        
        // Simulate time check (in real app, parse timestamp properly)
        // For demo, use unreadCount > 0 as proxy for "unresponded"
        return conv.unreadCount > 0 && !dismissedIds.includes(conv.id);
      })
      .map((conv) => ({
        conversation: conv,
        waitingMinutes: Math.floor(Math.random() * 120) + 60, // Simulated waiting time
        agentName: resolveAgentLabel(conv, currentUserFullName),
      }));
  };

  const unresponsedConversations = getUnresponsedConversations();
  const hasAlerts = unresponsedConversations.length > 0;

  // Check periodically and play notification
  useEffect(() => {
    if (hasAlerts && !isOpen) {
      const interval = setInterval(() => {
        playNotificationSound();
      }, 300000); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [hasAlerts, isOpen, playNotificationSound]);

  const handleDismiss = (conversationId: string) => {
    setDismissedIds((prev) => [...prev, conversationId]);
  };

  const handleAction = (action: 'ai' | 'transfer' | 'help', conversationId: string) => {
    switch (action) {
      case 'ai':
        onEnableAI(conversationId);
        break;
      case 'transfer':
        onTransfer(conversationId);
        break;
      case 'help':
        onRequestHelp(conversationId);
        break;
    }
    handleDismiss(conversationId);
  };

  const formatWaitingTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (!hasAlerts) return null;

  return (
    <>
      {/* Floating Alert Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-50 rounded-full h-14 w-14 shadow-lg",
          "bg-destructive hover:bg-destructive/90 animate-pulse"
        )}
      >
        <div className="relative">
          <Bell className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-warning text-warning-foreground text-xs font-bold flex items-center justify-center">
            {unresponsedConversations.length}
          </span>
        </div>
      </Button>

      {/* Alert Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {isSupervisor ? 'Atendimentos Pendentes - Supervisão' : 'Atendimentos sem Resposta'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isSupervisor 
                ? `${unresponsedConversations.length} atendimento(s) aguardando resposta há mais de 1 hora`
                : 'Conversas aguardando sua resposta há mais de 1 hora'
              }
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-3">
              {unresponsedConversations.map((item, index) => (
                <div key={item.conversation.id}>
                  {index > 0 && <Separator className="my-2" />}
                  
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-destructive/20 text-destructive text-xs">
                            {item.conversation.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{item.conversation.contact.name}</p>
                          <div className="flex items-center gap-1.5 text-destructive">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-medium">
                              Aguardando há {formatWaitingTime(item.waitingMinutes)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleDismiss(item.conversation.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Agent info (for supervisor view) */}
                    {isSupervisor && (
                      <div className="flex items-center gap-1 mb-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Atendente: {item.agentName}
                        </span>
                      </div>
                    )}

                    {/* Last message preview */}
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 bg-muted/50 p-2 rounded">
                      "{item.conversation.lastMessage}"
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1 border-primary text-primary hover:bg-primary/10 flex-1"
                        onClick={() => handleAction('ai', item.conversation.id)}
                      >
                        <Bot className="h-3 w-3" />
                        Ligar IA
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1 border-info text-info hover:bg-info/10 flex-1"
                        onClick={() => handleAction('transfer', item.conversation.id)}
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        Transferir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1 border-warning text-warning hover:bg-warning/10 flex-1"
                        onClick={() => handleAction('help', item.conversation.id)}
                      >
                        <HandHelping className="h-3 w-3" />
                        Ajuda
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-[10px] gap-1 flex-1"
                        onClick={() => {
                          onNavigate(item.conversation.id);
                          setIsOpen(false);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center pt-2 border-t">
            <Badge variant="destructive" className="text-[10px]">
              {unresponsedConversations.length} pendente(s)
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="h-7 text-xs"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
