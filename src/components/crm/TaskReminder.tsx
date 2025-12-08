import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Check, X, ChevronRight } from 'lucide-react';
import { CustomerTask, TaskStatus } from '@/types/crm';
import { cn } from '@/lib/utils';

interface TaskReminderProps {
  tasks: CustomerTask[];
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
  onDismiss: (taskId: string) => void;
  onNavigate: (conversationId: string) => void;
}

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  em_orcamento: { label: 'Em Orçamento', color: 'bg-amber-500' },
  follow_up: { label: 'Follow Up', color: 'bg-blue-500' },
  em_qualificacao: { label: 'Qualificação', color: 'bg-purple-500' },
  vendido: { label: 'Vendido', color: 'bg-success' },
};

export function TaskReminder({ tasks, onComplete, onSnooze, onDismiss, onNavigate }: TaskReminderProps) {
  const [visibleTasks, setVisibleTasks] = useState<CustomerTask[]>([]);

  useEffect(() => {
    const now = new Date();
    const dueTasks = tasks.filter(task => {
      if (task.completed) return false;
      if (task.snoozedUntil && new Date(task.snoozedUntil) > now) return false;
      return new Date(task.scheduledDate) <= now;
    });
    setVisibleTasks(dueTasks);
  }, [tasks]);

  if (visibleTasks.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm animate-slide-up">
      {visibleTasks.slice(0, 3).map((task) => (
        <Card 
          key={task.id} 
          className="border-primary/20 bg-card shadow-lg animate-fade-in"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {task.contactName}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs text-white", statusLabels[task.status].color)}
                  >
                    {statusLabels[task.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {task.nextStep}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  <span>
                    Agendado: {new Date(task.scheduledDate).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onSnooze(task.id, 10)}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    +10 min
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onNavigate(task.conversationId)}
                  >
                    <ChevronRight className="mr-1 h-3 w-3" />
                    Ir para conversa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onComplete(task.id)}
                  >
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onDismiss(task.id)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {visibleTasks.length > 3 && (
        <div className="text-center text-xs text-muted-foreground">
          +{visibleTasks.length - 3} mais tarefas pendentes
        </div>
      )}
    </div>
  );
}
