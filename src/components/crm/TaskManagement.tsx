import { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Calendar,
  User,
  AlertCircle,
  ChevronRight,
  ListTodo,
  CheckCheck,
  Timer
} from 'lucide-react';
import { CustomerTask, TaskStatus } from '@/types/crm';
import { cn } from '@/lib/utils';

interface TaskManagementProps {
  tasks: CustomerTask[];
  onComplete: (taskId: string) => void;
  onNavigate: (conversationId: string) => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  em_orcamento: { label: 'Em Orçamento', color: 'text-amber-600', bgColor: 'bg-amber-500' },
  follow_up: { label: 'Follow Up', color: 'text-blue-600', bgColor: 'bg-blue-500' },
  em_qualificacao: { label: 'Qualificação', color: 'text-purple-600', bgColor: 'bg-purple-500' },
  vendido: { label: 'Vendido', color: 'text-green-600', bgColor: 'bg-success' },
};

type FilterTab = 'all' | 'pending' | 'overdue' | 'completed';
type DateFilter = 'all' | 'today' | 'tomorrow' | 'week';

export function TaskManagement({ tasks, onComplete, onNavigate }: TaskManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !task.contactName.toLowerCase().includes(search) &&
          !task.nextStep.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const taskDate = new Date(task.scheduledDate);
        if (dateFilter === 'today' && !isToday(taskDate)) return false;
        if (dateFilter === 'tomorrow' && !isTomorrow(taskDate)) return false;
        if (dateFilter === 'week' && !isThisWeek(taskDate)) return false;
      }

      // Tab filter
      if (activeTab === 'pending' && (task.completed || isPast(new Date(task.scheduledDate)))) {
        return false;
      }
      if (activeTab === 'overdue' && (task.completed || !isPast(new Date(task.scheduledDate)))) {
        return false;
      }
      if (activeTab === 'completed' && !task.completed) {
        return false;
      }

      return true;
    });
  }, [tasks, searchTerm, statusFilter, dateFilter, activeTab]);

  const taskCounts = useMemo(() => {
    const now = new Date();
    return {
      all: tasks.length,
      pending: tasks.filter(t => !t.completed && !isPast(new Date(t.scheduledDate))).length,
      overdue: tasks.filter(t => !t.completed && isPast(new Date(t.scheduledDate))).length,
      completed: tasks.filter(t => t.completed).length,
    };
  }, [tasks]);

  const getTimeLabel = (date: Date) => {
    const taskDate = new Date(date);
    if (isToday(taskDate)) {
      return `Hoje às ${format(taskDate, 'HH:mm')}`;
    }
    if (isTomorrow(taskDate)) {
      return `Amanhã às ${format(taskDate, 'HH:mm')}`;
    }
    return format(taskDate, "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  const getTaskUrgency = (task: CustomerTask) => {
    if (task.completed) return 'completed';
    const taskDate = new Date(task.scheduledDate);
    if (isPast(taskDate)) return 'overdue';
    if (isToday(taskDate)) return 'today';
    return 'future';
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ListTodo className="h-7 w-7 text-primary" />
              Gestão de Tarefas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as atividades agendadas com seus clientes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Card className="px-4 py-2 border-primary/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">{taskCounts.overdue} atrasadas</span>
              </div>
            </Card>
            <Card className="px-4 py-2 border-success/20">
              <div className="flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">{taskCounts.completed} concluídas</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", config.bgColor)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Datas</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="tomorrow">Amanhã</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-6">
          <TabsList className="h-12 bg-transparent gap-4">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
            >
              Todas ({taskCounts.all})
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
            >
              <Timer className="h-4 w-4 mr-1.5" />
              Pendentes ({taskCounts.pending})
            </TabsTrigger>
            <TabsTrigger 
              value="overdue"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none px-1 text-destructive"
            >
              <AlertCircle className="h-4 w-4 mr-1.5" />
              Atrasadas ({taskCounts.overdue})
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-success rounded-none px-1"
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Concluídas ({taskCounts.completed})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ListTodo className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma tarefa encontrada</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Tente ajustar os filtros'
                      : 'As tarefas aparecerão aqui quando você registrar atividades'}
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const urgency = getTaskUrgency(task);
                  const config = statusConfig[task.status];

                  return (
                    <Card 
                      key={task.id}
                      className={cn(
                        "transition-all hover:shadow-md cursor-pointer",
                        urgency === 'overdue' && "border-destructive/50 bg-destructive/5",
                        urgency === 'today' && "border-primary/50 bg-primary/5",
                        urgency === 'completed' && "opacity-60"
                      )}
                      onClick={() => onNavigate(task.conversationId)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onComplete(task.id);
                            }}
                            className={cn(
                              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              task.completed 
                                ? "bg-success border-success text-white" 
                                : "border-muted-foreground/30 hover:border-primary"
                            )}
                          >
                            {task.completed && <CheckCircle2 className="h-4 w-4" />}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-foreground">{task.contactName}</span>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs text-white", config.bgColor)}
                              >
                                {config.label}
                              </Badge>
                              {urgency === 'overdue' && (
                                <Badge variant="destructive" className="text-xs">
                                  Atrasada
                                </Badge>
                              )}
                            </div>
                            <p className={cn(
                              "text-sm mb-2",
                              task.completed ? "line-through text-muted-foreground" : "text-foreground"
                            )}>
                              {task.nextStep}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{getTimeLabel(task.scheduledDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Criada {format(new Date(task.createdAt), "dd/MM 'às' HH:mm")}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action */}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(task.conversationId);
                            }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
