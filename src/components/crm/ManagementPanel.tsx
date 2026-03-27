import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, startOfDay, endOfDay, subWeeks, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Briefcase,
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
  X,
  Loader2,
  Save,
  Shield,
} from 'lucide-react';
import { DismissedActivityReport, Conversation, CustomerTask } from '@/types/crm';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiError';
import { Checkbox } from '@/components/ui/checkbox';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

interface TeamResponse {
  id: string;
  name: string;
  supervisorId: string | null;
  supervisorName: string | null;
  createdIn: string;
  isActive: boolean;
  members: TeamMember[];
}

interface ManagementPanelProps {
  conversations: Conversation[];
  tasks: CustomerTask[];
  dismissedReports: DismissedActivityReport[];
  onViewConversation: (conversationId: string) => void;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type DismissTypeFilter = 'all' | 'permanent' | 'later';

export function ManagementPanel({
  conversations,
  tasks,
  dismissedReports,
  onViewConversation,
}: ManagementPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [dismissTypeFilter, setDismissTypeFilter] = useState<DismissTypeFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editingMembers, setEditingMembers] = useState(false);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all teams
  const teamsQuery = useQuery({
    queryKey: ['management-teams'],
    queryFn: async () => {
      const { data } = await api.get<TeamResponse[]>('/teams');
      return data;
    },
  });

  // Auto-select first team
  const teams = teamsQuery.data ?? [];
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  // Fetch available members when editing
  const availableQuery = useQuery({
    queryKey: ['management-teams', 'available-members'],
    queryFn: async () => {
      const { data } = await api.get<TeamMember[]>('/teams/my-team/available-members');
      return data;
    },
    enabled: editingMembers,
  });

  // Update team members
  const updateMembersMutation = useMutation({
    mutationFn: async ({ teamId, memberIds }: { teamId: string; memberIds: string[] }) => {
      const { data } = await api.put<TeamResponse>(`/teams/${teamId}`, { memberIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-teams'] });
      setEditingMembers(false);
      toast({ title: 'Membros atualizados' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao atualizar membros', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  const startEditMembers = () => {
    if (selectedTeam) {
      setEditMemberIds(selectedTeam.members.map((m) => m.id));
      setEditingMembers(true);
    }
  };

  const cancelEditMembers = () => {
    setEditingMembers(false);
    setEditMemberIds([]);
  };

  const toggleMember = (userId: string) => {
    setEditMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const selectableUsers = (availableQuery.data ?? []).filter(
    (u) => u.id !== selectedTeam?.supervisorId,
  );

  // Date range based on period filter
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

  const filteredReports = useMemo(() => {
    return dismissedReports.filter((report) => {
      if (selectedAgent && report.agentName !== selectedAgent) return false;
      if (dismissTypeFilter !== 'all' && report.dismissType !== dismissTypeFilter) return false;
      if (getDateRange) {
        const reportDate = new Date(report.dismissedAt);
        if (!isWithinInterval(reportDate, { start: getDateRange.start, end: getDateRange.end })) return false;
      }
      return true;
    });
  }, [dismissedReports, selectedAgent, dismissTypeFilter, getDateRange]);

  const conversationsWithoutTasks = useMemo(() => {
    const now = new Date();
    const idsWithFutureTasks = new Set(
      tasks.filter((t) => !t.completed && new Date(t.scheduledDate) > now).map((t) => t.conversationId),
    );
    return conversations.filter((c) => !idsWithFutureTasks.has(c.id));
  }, [conversations, tasks]);

  const agentStats = useMemo(() => {
    const stats: Record<string, { total: number; permanent: number; later: number }> = {};
    filteredReports.forEach((report) => {
      if (!stats[report.agentName]) stats[report.agentName] = { total: 0, permanent: 0, later: 0 };
      stats[report.agentName].total++;
      if (report.dismissType === 'permanent') stats[report.agentName].permanent++;
      else stats[report.agentName].later++;
    });
    return Object.entries(stats).map(([name, data]) => ({ agentName: name, ...data }));
  }, [filteredReports]);

  const filteredStats = useMemo(
    () => ({
      total: filteredReports.length,
      permanent: filteredReports.filter((r) => r.dismissType === 'permanent').length,
      later: filteredReports.filter((r) => r.dismissType === 'later').length,
    }),
    [filteredReports],
  );

  const hasActiveFilters = periodFilter !== 'all' || dismissTypeFilter !== 'all' || selectedAgent !== null;

  const clearAllFilters = () => {
    setPeriodFilter('all');
    setDismissTypeFilter('all');
    setSelectedAgent(null);
    setCustomDateRange({ from: undefined, to: undefined });
  };

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    if (value !== 'custom') setCustomDateRange({ from: undefined, to: undefined });
  };

  const showFilters = activeTab !== 'teams';

  return (
    <div className="flex-1 p-6 overflow-hidden bg-muted/20">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Painel de Gerência
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie equipes e monitore atividades dos agentes
          </p>
        </div>

        {/* Filters — only on monitoring tabs */}
        {showFilters && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>

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
                          if (range?.from && range?.to) setIsCalendarOpen(false);
                        }}
                        numberOfMonths={2}
                        locale={ptBR}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}

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

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4 mr-1" />
                    Limpar filtros
                  </Button>
                )}

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
        )}

        {/* Stats Cards — only on monitoring tabs */}
        {showFilters && (
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
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-fit">
            <TabsTrigger value="teams" className="gap-2">
              <Users className="w-4 h-4" />
              Equipes
            </TabsTrigger>
            <TabsTrigger value="dismissed" className="gap-2">
              <ClipboardX className="w-4 h-4" />
              Registros Dispensados
            </TabsTrigger>
            <TabsTrigger value="without-tasks" className="gap-2">
              <MessageSquareOff className="w-4 h-4" />
              Sem Atividades
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <User className="w-4 h-4" />
              Por Agente
            </TabsTrigger>
          </TabsList>

          {/* Teams Tab */}
          <TabsContent value="teams" className="flex-1 mt-4 overflow-auto">
            {teamsQuery.isLoading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando equipes…
              </div>
            ) : teams.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <Card className="max-w-md w-full">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">Nenhuma equipe encontrada</h3>
                    <p className="text-sm text-muted-foreground">
                      Crie equipes no painel de administração para vê-las aqui.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Team selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Equipe:</span>
                  <Select value={selectedTeamId ?? ''} onValueChange={(v) => { setSelectedTeamId(v); setEditingMembers(false); }}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Selecione uma equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {teams.length} equipe{teams.length !== 1 ? 's' : ''} no total
                  </span>
                </div>

                {/* Selected team detail */}
                {selectedTeam && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{selectedTeam.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Shield className="w-3.5 h-3.5" />
                            Supervisor: {selectedTeam.supervisorName || 'Não atribuído'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={selectedTeam.isActive ? 'default' : 'secondary'}>
                            {selectedTeam.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                          {!editingMembers ? (
                            <Button size="sm" variant="outline" className="gap-2" onClick={startEditMembers}>
                              <Users className="h-4 w-4" />
                              Gerenciar membros
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={cancelEditMembers} disabled={updateMembersMutation.isPending}>
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => updateMembersMutation.mutate({ teamId: selectedTeam.id, memberIds: editMemberIds })}
                                disabled={updateMembersMutation.isPending}
                              >
                                {updateMembersMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Salvar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedTeam.members.length} membro{selectedTeam.members.length !== 1 ? 's' : ''}
                      </p>

                      {!editingMembers ? (
                        selectedTeam.members.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum membro na equipe. Clique em "Gerenciar membros" para adicionar.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {selectedTeam.members.map((member) => (
                              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {member.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{member.fullName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                </div>
                                <Badge variant={member.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {member.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="space-y-2">
                          {availableQuery.isLoading ? (
                            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Carregando usuários…
                            </div>
                          ) : selectableUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum usuário disponível para adicionar.
                            </p>
                          ) : (
                            selectableUsers.map((user) => (
                              <label
                                key={user.id}
                                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  checked={editMemberIds.includes(user.id)}
                                  onCheckedChange={() => toggleMember(user.id)}
                                />
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{user.fullName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Dismissed Activities Tab */}
          <TabsContent value="dismissed" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Relatório de Dispensas</CardTitle>
                    <CardDescription>Registros de atividades dispensadas pelos agentes</CardDescription>
                  </div>
                  {selectedAgent && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedAgent(null)}>
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
                                {new Date(report.dismissedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                              <Badge variant={report.dismissType === 'permanent' ? 'destructive' : 'secondary'} className="text-xs">
                                {report.dismissType === 'permanent' ? 'Permanente' : 'Temporário'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate text-sm text-muted-foreground">{report.conversationSummary}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => onViewConversation(report.conversationId)}>
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

          {/* Without Tasks Tab */}
          <TabsContent value="without-tasks" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Conversas Sem Atividades Futuras
                </CardTitle>
                <CardDescription>Clientes que não possuem nenhuma tarefa agendada</CardDescription>
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
                                  <span
                                    className={cn(
                                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                                      conversation.contact.status === 'online' ? 'bg-success' : 'bg-muted-foreground',
                                    )}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">{conversation.contact.name}</p>
                                  <p className="text-xs text-muted-foreground">{conversation.contact.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage}</p>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{conversation.lastMessageTime}</TableCell>
                            <TableCell>
                              {conversation.category && (
                                <Badge variant="outline" className="capitalize">
                                  {conversation.category}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => onViewConversation(conversation.id)}>
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
                              <Button variant="outline" size="sm" onClick={() => setSelectedAgent(stat.agentName)}>
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
