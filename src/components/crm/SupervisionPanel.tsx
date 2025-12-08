import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Eye, 
  Users, 
  MessageSquareOff, 
  ClipboardX, 
  TrendingDown,
  Calendar,
  User,
  Clock,
  Filter,
  CalendarDays,
  X
} from 'lucide-react';
import { DismissedActivityReport, Conversation, CustomerTask, DismissType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface SupervisionPanelProps {
  conversations: Conversation[];
  tasks: CustomerTask[];
  dismissedReports: DismissedActivityReport[];
  onViewConversation: (conversationId: string) => void;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type DismissTypeFilter = 'all' | 'permanent' | 'later';

export function SupervisionPanel({ 
  conversations, 
  tasks, 
  dismissedReports,
  onViewConversation 
}: SupervisionPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [dismissTypeFilter, setDismissTypeFilter] = useState<DismissTypeFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Calculate date range based on period filter
  const getDateRange = useMemo(() => {
    const now = new Date();
    const end = endOfDay(now);
    
    switch (periodFilter) {
      case 'today':
        return { start: startOfDay(now), end };
      case 'week':
        return { start: startOfDay(subWeeks(now, 1)), end };
      case 'month':
        return { start: startOfDay(subMonths(now, 1)), end };
      case 'custom':
        return customDateRange.from && customDateRange.to
          ? { start: startOfDay(customDateRange.from), end: endOfDay(customDateRange.to) }
          : null;
      default:
        return null;
    }
  }, [periodFilter, customDateRange]);

  // Filter reports by all criteria
  const filteredReports = useMemo(() => {
    return dismissedReports.filter(report => {
      // Filter by agent
      if (selectedAgent && report.agentName !== selectedAgent) return false;
      
      // Filter by dismiss type
      if (dismissTypeFilter !== 'all' && report.dismissType !== dismissTypeFilter) return false;
      
      // Filter by date range
      if (getDateRange) {
        const reportDate = new Date(report.dismissedAt);
        if (!isWithinInterval(reportDate, { start: getDateRange.start, end: getDateRange.end })) {
          return false;
        }
      }
      
      return true;
    });
  }, [dismissedReports, selectedAgent, dismissTypeFilter, getDateRange]);

  // Calculate conversations without future tasks
  const conversationsWithoutTasks = useMemo(() => {
    const now = new Date();
    const conversationIdsWithFutureTasks = new Set(
      tasks
        .filter(t => !t.completed && new Date(t.scheduledDate) > now)
        .map(t => t.conversationId)
    );

    return conversations.filter(c => !conversationIdsWithFutureTasks.has(c.id));
  }, [conversations, tasks]);

  // Calculate agent statistics from filtered reports
  const agentStats = useMemo(() => {
    const stats: Record<string, { total: number; permanent: number; later: number }> = {};
    
    filteredReports.forEach(report => {
      if (!stats[report.agentName]) {
        stats[report.agentName] = { total: 0, permanent: 0, later: 0 };
      }
      stats[report.agentName].total++;
      if (report.dismissType === 'permanent') {
        stats[report.agentName].permanent++;
      } else {
        stats[report.agentName].later++;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      agentName: name,
      ...data
    }));
  }, [filteredReports]);

  // Stats from filtered data
  const filteredStats = useMemo(() => ({
    total: filteredReports.length,
    permanent: filteredReports.filter(r => r.dismissType === 'permanent').length,
    later: filteredReports.filter(r => r.dismissType === 'later').length
  }), [filteredReports]);

  const hasActiveFilters = periodFilter !== 'all' || dismissTypeFilter !== 'all' || selectedAgent !== null;

  const clearAllFilters = () => {
    setPeriodFilter('all');
    setDismissTypeFilter('all');
    setSelectedAgent(null);
    setCustomDateRange({ from: undefined, to: undefined });
  };

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    if (value !== 'custom') {
      setCustomDateRange({ from: undefined, to: undefined });
    }
  };

  return (
    <div className="flex-1 p-6 overflow-hidden bg-muted/20">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              Painel de Supervisão
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitore atividades dispensadas e conversas sem acompanhamento
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              
              {/* Period Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Período:</span>
                <Select value={periodFilter} onValueChange={(v) => handlePeriodChange(v as PeriodFilter)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {periodFilter === 'custom' && (
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <CalendarDays className="w-4 h-4" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, 'dd/MM/yy')} - {format(customDateRange.to, 'dd/MM/yy')}
                          </>
                        ) : (
                          format(customDateRange.from, 'dd/MM/yyyy')
                        )
                      ) : (
                        'Selecionar datas'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: customDateRange.from, to: customDateRange.to }}
                      onSelect={(range) => {
                        setCustomDateRange({ from: range?.from, to: range?.to });
                        if (range?.from && range?.to) {
                          setIsCalendarOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Dismiss Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <Select value={dismissTypeFilter} onValueChange={(v) => setDismissTypeFilter(v as DismissTypeFilter)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="permanent">Permanentes</SelectItem>
                    <SelectItem value="later">Temporárias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </Button>
              )}

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Exibindo {filteredReports.length} de {dismissedReports.length} registros
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <MessageSquareOff className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversationsWithoutTasks.length}</p>
                <p className="text-sm text-muted-foreground">Sem Atividades Futuras</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/20">
                <ClipboardX className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredStats.total}</p>
                <p className="text-sm text-muted-foreground">Registros Dispensados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <TrendingDown className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredStats.permanent}</p>
                <p className="text-sm text-muted-foreground">Dispensas Permanentes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentStats.length}</p>
                <p className="text-sm text-muted-foreground">Agentes Monitorados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dismissed" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-fit">
            <TabsTrigger value="dismissed" className="gap-2">
              <ClipboardX className="w-4 h-4" />
              Registros Dispensados
            </TabsTrigger>
            <TabsTrigger value="without-tasks" className="gap-2">
              <MessageSquareOff className="w-4 h-4" />
              Sem Atividades
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <Users className="w-4 h-4" />
              Por Agente
            </TabsTrigger>
          </TabsList>

          {/* Dismissed Activities Tab */}
          <TabsContent value="dismissed" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Relatório de Dispensas</CardTitle>
                    <CardDescription>
                      Registros de atividades dispensadas pelos agentes
                    </CardDescription>
                  </div>
                  {selectedAgent && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedAgent(null)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Limpar Filtro de Agente
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Agente</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Resumo</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum registro dispensado encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((report) => (
                          <TableRow key={report.id} className="hover:bg-muted/50">
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                {new Date(report.dismissedAt).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(report.dismissedAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-medium">{report.agentName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{report.contactName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={report.dismissType === 'permanent' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {report.dismissType === 'permanent' ? 'Permanente' : 'Temporário'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate text-sm text-muted-foreground">
                                {report.conversationSummary}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewConversation(report.conversationId)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversations Without Tasks Tab */}
          <TabsContent value="without-tasks" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Conversas Sem Atividades Futuras
                </CardTitle>
                <CardDescription>
                  Clientes que não possuem nenhuma tarefa agendada
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Última Mensagem</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversationsWithoutTasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Todas as conversas possuem atividades futuras
                          </TableCell>
                        </TableRow>
                      ) : (
                        conversationsWithoutTasks.map((conversation) => (
                          <TableRow key={conversation.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-semibold">
                                    {conversation.contact.name.charAt(0)}
                                  </div>
                                  <span className={cn(
                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                                    conversation.contact.status === 'online' 
                                      ? 'bg-success' 
                                      : 'bg-muted-foreground'
                                  )} />
                                </div>
                                <div>
                                  <p className="font-medium">{conversation.contact.name}</p>
                                  <p className="text-xs text-muted-foreground">{conversation.contact.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate text-sm text-muted-foreground">
                                {conversation.lastMessage}
                              </p>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {conversation.lastMessageTime}
                            </TableCell>
                            <TableCell>
                              {conversation.category && (
                                <Badge variant="outline" className="capitalize">
                                  {conversation.category}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewConversation(conversation.id)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Abrir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Estatísticas por Agente</CardTitle>
                <CardDescription>
                  Resumo de dispensas de registro por cada agente
                  {hasActiveFilters && ' (filtros aplicados)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agente</TableHead>
                        <TableHead className="text-center">Total Dispensas</TableHead>
                        <TableHead className="text-center">Permanentes</TableHead>
                        <TableHead className="text-center">Temporárias</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentStats.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma estatística disponível
                          </TableCell>
                        </TableRow>
                      ) : (
                        agentStats.map((stat) => (
                          <TableRow key={stat.agentName} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <span className="font-medium">{stat.agentName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-base px-3">
                                {stat.total}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive" className="text-base px-3">
                                {stat.permanent}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-base px-3">
                                {stat.later}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAgent(stat.agentName)}
                              >
                                <Filter className="w-4 h-4 mr-1" />
                                Filtrar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}