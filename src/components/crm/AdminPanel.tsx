import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, ArrowLeftRight, Settings, Shield, Activity, Bot, MessageSquare, Trash2, Edit, FileText, Palette, Upload, Building2, Phone, Mail, Globe, Gamepad2, Trophy, Smartphone, Link, CheckCircle, XCircle, Loader2, Brain, BookOpen, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { UserListItemDto, ProfileListItemDto, CreateUserRequest } from '@/types/api';

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
  updatedIn: string | null;
  members: TeamMember[];
}

interface TransferRequest {
  id: string;
  from: string;
  to: string;
  customer: string;
  reason: string;
  timestamp: Date;
}

interface WhatsAppConnection {
  instanceId: string;
  apiToken: string;
  isConnected: boolean;
  phoneNumber: string;
}

interface AISettings {
  systemPrompt: string;
  autopilotPrompt: string;
  suggestionPrompt: string;
  analysisPrompt: string;
  knowledgeBase: string[];
  companyInfo: string;
  productsInfo: string;
  faqInfo: string;
}

const mockTransfers: TransferRequest[] = [
  { id: '1', from: 'IA SDR', to: 'Ana Paula', customer: 'Roberto Lima', reason: 'Lead qualificado', timestamp: new Date() },
  { id: '2', from: 'Carlos Silva', to: 'Maria Santos', customer: 'Juliana Costa', reason: 'Especialista em cruzeiros', timestamp: new Date(Date.now() - 3600000) },
];

interface AdminPanelProps {
  gamificationEnabled?: boolean;
  onGamificationToggle?: (enabled: boolean) => void;
}

export function AdminPanel({ gamificationEnabled = true, onGamificationToggle }: AdminPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canCreateTeams, canUpdateTeams, canDeleteTeams, canCreateUsers, isDefaultProfile } = useAccessControl();
  const queryClient = useQueryClient();
  const [transfers] = useState<TransferRequest[]>(mockTransfers);
  const [sdrEnabled, setSdrEnabled] = useState(true);
  const [catalogEnabled, setCatalogEnabled] = useState(true);
  // ── Company / Branding ──
  const companyQuery = useQuery({
    queryKey: ['company-branding'],
    queryFn: async () => {
      const { data } = await api.get<import('@/types/api').CompanyDto[]>('/companies');
      return data[0] ?? null;
    },
  });

  const [agencySettings, setAgencySettings] = useState({
    name: '', cnpj: '', phone: '', email: '', website: '', address: '',
    logo: '', primaryColor: '#3b82f6', secondaryColor: '#1e40af',
    footerText: '', termsText: '',
  });
  const [brandingLoaded, setBrandingLoaded] = useState(false);

  // Sync company data into local state once loaded
  const companyData = companyQuery.data;
  if (companyData && !brandingLoaded) {
    setAgencySettings({
      name: companyData.name || '',
      cnpj: companyData.federalRegistration || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      website: companyData.website || '',
      address: companyData.address || '',
      logo: companyData.logo || '',
      primaryColor: companyData.primaryColor || '#3b82f6',
      secondaryColor: companyData.secondaryColor || '#1e40af',
      footerText: companyData.footerText || '',
      termsText: companyData.termsText || '',
    });
    setBrandingLoaded(true);
  }

  const saveBrandingMutation = useMutation({
    mutationFn: async () => {
      if (!companyData) return;
      await api.put(`/companies/${companyData.id}`, {
        name: agencySettings.name,
        federalRegistration: agencySettings.cnpj,
        phone: agencySettings.phone,
        email: agencySettings.email,
        website: agencySettings.website,
        address: agencySettings.address,
        logo: agencySettings.logo,
        primaryColor: agencySettings.primaryColor,
        secondaryColor: agencySettings.secondaryColor,
        footerText: agencySettings.footerText,
        termsText: agencySettings.termsText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-branding'] });
      toast({ title: 'Configurações salvas com sucesso' });
    },
    onError: () => toast({ title: 'Erro ao salvar configurações', variant: 'destructive' }),
  });

  // ── Teams API ──
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get<TeamResponse[]>('/teams');
      return data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users-for-teams'],
    queryFn: async () => {
      const { data } = await api.get<UserListItemDto[]>('/users');
      return data;
    },
  });

  const profilesQuery = useQuery({
    queryKey: ['profiles-for-teams'],
    queryFn: async () => {
      const { data } = await api.get<ProfileListItemDto[]>('/profiles');
      return data;
    },
  });

  const teams = teamsQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const profileOrder: Record<string, number> = { 'Administrador': 0, 'Gerente': 1, 'Supervisor': 2, 'Atendente': 3 };
  const activeProfiles = profiles
    .filter((p) => p.isActive)
    .sort((a, b) => (profileOrder[a.name] ?? 99) - (profileOrder[b.name] ?? 99));
  const supervisorUsers = allUsers.filter((u) => u.profile?.name === 'Supervisor' && u.isActive);

  // ── Create User ──
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserProfileId, setNewUserProfileId] = useState('');

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const body: CreateUserRequest = {
        fullName: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        profileId: newUserProfileId,
      };
      const { data } = await api.post('/users', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-for-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserProfileId('');
      setShowCreateUser(false);
      toast({ title: 'Usuário criado com sucesso' });
    },
    onError: () => toast({ title: 'Erro ao criar usuário', variant: 'destructive' }),
  });

  // Team CRUD state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSupervisorId, setNewTeamSupervisorId] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamSupervisorId, setEditTeamSupervisorId] = useState('');
  const [editTeamMemberIds, setEditTeamMemberIds] = useState<string[]>([]);

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<TeamResponse>('/teams', {
        name: newTeamName,
        supervisorId: newTeamSupervisorId && newTeamSupervisorId !== '__none' ? newTeamSupervisorId : undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setNewTeamName('');
      setNewTeamSupervisorId('');
      setShowCreateTeam(false);
      toast({ title: 'Equipe criada com sucesso' });
    },
    onError: () => toast({ title: 'Erro ao criar equipe', variant: 'destructive' }),
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; supervisorId?: string | null; memberIds?: string[] }) => {
      const { data } = await api.put<TeamResponse>(`/teams/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['users-for-teams'] });
      setEditingTeamId(null);
      toast({ title: 'Equipe atualizada' });
    },
    onError: () => toast({ title: 'Erro ao atualizar equipe', variant: 'destructive' }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['users-for-teams'] });
      toast({ title: 'Equipe removida' });
    },
    onError: () => toast({ title: 'Erro ao remover equipe', variant: 'destructive' }),
  });

  const startEditTeam = (team: TeamResponse) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamSupervisorId(team.supervisorId ?? '__none');
    setEditTeamMemberIds(team.members.map((m) => m.id));
  };

  const saveTeam = () => {
    if (!editingTeamId) return;
    updateTeamMutation.mutate({
      id: editingTeamId,
      name: editTeamName,
      supervisorId: editTeamSupervisorId && editTeamSupervisorId !== '__none' ? editTeamSupervisorId : null,
      memberIds: editTeamMemberIds,
    });
  };

  const toggleTeamMember = (userId: string) => {
    setEditTeamMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const profileName = user?.profileName ?? user?.profile?.name ?? '';
  
  // WhatsApp Connection State
  const [whatsappConnection, setWhatsappConnection] = useState<WhatsAppConnection>({
    instanceId: '',
    apiToken: '',
    isConnected: false,
    phoneNumber: '',
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // AI Settings State
  const [aiSettings, setAISettings] = useState<AISettings>({
    systemPrompt: `Você é um assistente de IA especializado em vendas de viagens para uma agência de turismo.
Seu objetivo é ajudar os atendentes a:
- Responder dúvidas sobre destinos, preços e disponibilidade
- Sugerir respostas para clientes
- Analisar perfil de clientes e recomendar pacotes
- Fornecer informações de mercado e tendências

Seja conciso, profissional e sempre ofereça sugestões práticas.
Responda sempre em português brasileiro.`,
    autopilotPrompt: `Você está no modo PILOTO AUTOMÁTICO. Responda diretamente ao cliente como se fosse o atendente.
REGRAS IMPORTANTES:
- Responda de forma amigável, profissional e natural
- Use linguagem adequada para WhatsApp (informal mas respeitosa)
- Seja proativo, ofereça ajuda e faça perguntas para qualificar o lead
- Se o cliente perguntar sobre pacotes ou preços, diga que vai verificar e retornar em breve
- NUNCA diga que é uma IA ou assistente virtual
- Limite sua resposta a 2-3 parágrafos curtos no máximo
- Use emojis moderadamente para parecer natural 🌴✈️`,
    suggestionPrompt: `Analise a conversa e sugira 2-3 respostas prontas que o atendente pode enviar ao cliente.
Forneça respostas curtas e diretas, adequadas para WhatsApp.`,
    analysisPrompt: `Analise o perfil do cliente baseado nas mensagens e forneça:
1. Interesse principal (destino, tipo de viagem)
2. Urgência (baixa, média, alta)
3. Recomendação de próximo passo`,
    knowledgeBase: [],
    companyInfo: '',
    productsInfo: '',
    faqInfo: '',
  });
  const [newKnowledgeItem, setNewKnowledgeItem] = useState('');

  const handleGamificationToggle = (enabled: boolean) => {
    onGamificationToggle?.(enabled);
    toast({
      title: enabled ? 'Gamificação Ativada' : 'Gamificação Desativada',
      description: enabled 
        ? 'O sistema de gamificação está ativo para todos os agentes.'
        : 'O sistema de gamificação foi desativado.',
    });
  };

  const handleTransfer = (fromAgent: string, toAgent: string) => {
    toast({
      title: 'Transferência Solicitada',
      description: `Atendimento será transferido de ${fromAgent} para ${toAgent}.`,
    });
  };

  const handleSaveAgencySettings = () => {
    saveBrandingMutation.mutate();
  };

  const handleTestWhatsAppConnection = async () => {
    if (!whatsappConnection.instanceId || !whatsappConnection.apiToken) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha o Instance ID e API Token para testar a conexão.',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingConnection(true);
    
    try {
      // Test connection by calling Green API getStateInstance
      const response = await fetch(
        `https://api.green-api.com/waInstance${whatsappConnection.instanceId}/getStateInstance/${whatsappConnection.apiToken}`
      );
      
      const data = await response.json();
      
      if (data.stateInstance === 'authorized') {
        setWhatsappConnection(prev => ({ ...prev, isConnected: true }));
        toast({
          title: 'Conexão bem-sucedida!',
          description: 'WhatsApp conectado e pronto para uso.',
        });
      } else if (data.stateInstance === 'notAuthorized') {
        toast({
          title: 'WhatsApp não autorizado',
          description: 'Escaneie o QR Code no painel Green API para autorizar.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Status: ' + data.stateInstance,
          description: 'Verifique o painel Green API para mais detalhes.',
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar. Verifique as credenciais.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveWhatsAppConnection = () => {
    // In a real app, this would save to Supabase secrets
    toast({
      title: 'Configurações salvas',
      description: 'As credenciais do WhatsApp foram salvas. O webhook está configurado automaticamente.',
    });
  };

  const handleSaveAISettings = () => {
    // Save to localStorage for now (could be Supabase in production)
    localStorage.setItem('ai_settings', JSON.stringify(aiSettings));
    toast({
      title: 'Configurações de IA salvas',
      description: 'Os prompts e base de conhecimento foram atualizados.',
    });
  };

  const handleAddKnowledgeItem = () => {
    if (newKnowledgeItem.trim()) {
      setAISettings(prev => ({
        ...prev,
        knowledgeBase: [...prev.knowledgeBase, newKnowledgeItem.trim()]
      }));
      setNewKnowledgeItem('');
      toast({
        title: 'Item adicionado',
        description: 'Novo item adicionado à base de conhecimento.',
      });
    }
  };

  const handleRemoveKnowledgeItem = (index: number) => {
    setAISettings(prev => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.filter((_, i) => i !== index)
    }));
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setAgencySettings(prev => ({ ...prev, logo: reader.result as string }));
        toast({ title: 'Logo carregado', description: 'Clique em Salvar para aplicar.' });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Profiles that only see their own team (read-only)
  const isReadOnlyTeamView = profileName === 'Supervisor' || profileName === 'Atendente';
  // Only Administrador sees all admin tabs
  const showAllAdminTabs = isDefaultProfile;

  return (
    <div className="flex-1 overflow-hidden p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua equipe e configure o sistema</p>
      </div>

      <Tabs defaultValue="team" className="flex-1">
        <TabsList className="mb-4">
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Equipe
          </TabsTrigger>
          {showAllAdminTabs && (
            <>
              <TabsTrigger value="transfers" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Transferências
              </TabsTrigger>
              <TabsTrigger value="sdr" className="gap-2">
                <Bot className="h-4 w-4" />
                IA SDR
              </TabsTrigger>
              <TabsTrigger value="ai-config" className="gap-2">
                <Brain className="h-4 w-4" />
                IA Config
              </TabsTrigger>
              <TabsTrigger value="pdf" className="gap-2">
                <FileText className="h-4 w-4" />
                PDF & Branding
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2">
                <Smartphone className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Equipes</h2>
            <div className="flex gap-2">
              {canCreateUsers && (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowCreateUser(true)}>
                  <UserPlus className="h-4 w-4" />
                  Novo Usuário
                </Button>
              )}
              {canCreateTeams && (
                <Button size="sm" className="gap-2" onClick={() => setShowCreateTeam(true)}>
                  <Plus className="h-4 w-4" />
                  Nova Equipe
                </Button>
              )}
            </div>
          </div>

          {/* Create User Dialog */}
          <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <Select value={newUserProfileId} onValueChange={setNewUserProfileId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar perfil..." /></SelectTrigger>
                    <SelectContent>
                      {activeProfiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 6 || !newUserProfileId || createUserMutation.isPending}
                  onClick={() => createUserMutation.mutate()}
                >
                  {createUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Usuário
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Team Form */}
          {showCreateTeam && canCreateTeams && (
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Nova Equipe</h3>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowCreateTeam(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome</Label>
                    <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Nome da equipe" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Supervisor</Label>
                    <Select value={newTeamSupervisorId} onValueChange={setNewTeamSupervisorId}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Nenhum</SelectItem>
                        {supervisorUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" disabled={!newTeamName.trim() || createTeamMutation.isPending} onClick={() => createTeamMutation.mutate()}>
                  {createTeamMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Criar
                </Button>
              </CardContent>
            </Card>
          )}

          {teamsQuery.isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : teams.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma equipe cadastrada</p>
                <p className="text-sm">Crie uma equipe para organizar seus atendentes.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3">
                {teams.map((team) => (
                  <Card key={team.id} className="border-border/50">
                    <CardContent className="p-4">
                      {editingTeamId === team.id ? (
                        /* ── Edit Mode ── */
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Nome</Label>
                              <Input value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Supervisor</Label>
                              <Select value={editTeamSupervisorId} onValueChange={setEditTeamSupervisorId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none">Nenhum</SelectItem>
                                  {supervisorUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Membros</Label>
                            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                              {allUsers.filter((u) => u.isActive && !u.profile?.isDefault).map((u) => (
                                <label key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
                                  <Checkbox checked={editTeamMemberIds.includes(u.id)} onCheckedChange={() => toggleTeamMember(u.id)} />
                                  <span>{u.fullName}</span>
                                  <Badge variant="outline" className="ml-auto text-[10px]">{u.profile?.name}</Badge>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" disabled={updateTeamMutation.isPending} onClick={saveTeam}>
                              {updateTeamMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTeamId(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        /* ── View Mode ── */
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{team.name}</span>
                              {team.supervisorName && (
                                <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
                                  Supervisor: {team.supervisorName}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">{team.members.length} membro{team.members.length !== 1 ? 's' : ''}</Badge>
                            </div>
                            {!isReadOnlyTeamView && (
                              <div className="flex gap-1">
                                {canUpdateTeams && (
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditTeam(team)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDeleteTeams && (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteTeamMutation.mutate(team.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          {team.members.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {team.members.map((m) => (
                                <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 text-sm">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                      {m.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{m.fullName}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sem membros</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transferir Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>De</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.filter(u => u.isActive).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Para</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.filter(u => u.isActive).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full gap-2"
                onClick={() => handleTransfer('Carlos Silva', 'Ana Paula')}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Transferir
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Transferências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {transfer.from} → {transfer.to}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cliente: {transfer.customer} • {transfer.reason}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {transfer.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                IA SDR - Qualificação Automática
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${sdrEnabled ? 'bg-success/10' : 'bg-muted'}`}>
                    <Bot className={`h-5 w-5 ${sdrEnabled ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">SDR Automático</p>
                    <p className="text-sm text-muted-foreground">
                      IA qualifica novos leads automaticamente
                    </p>
                  </div>
                </div>
                <Switch checked={sdrEnabled} onCheckedChange={setSdrEnabled} />
              </div>

              {sdrEnabled && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-border/50">
                      <CardContent className="p-4 text-center">
                        <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">47</p>
                        <p className="text-xs text-muted-foreground">Leads qualificados hoje</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="h-8 w-8 text-info mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">156</p>
                        <p className="text-xs text-muted-foreground">Mensagens trocadas</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-4 text-center">
                        <ArrowLeftRight className="h-8 w-8 text-success mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">12</p>
                        <p className="text-xs text-muted-foreground">Transferidos para agentes</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <Label>Perguntas de Qualificação</Label>
                    <div className="space-y-2">
                      {['Destino de interesse', 'Data prevista', 'Número de viajantes', 'Orçamento estimado', 'Preferências especiais'].map((question, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <span className="text-xs font-medium text-primary">{i + 1}.</span>
                          <span className="text-sm text-foreground">{question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Catalog Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${catalogEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <FileText className={`h-5 w-5 ${catalogEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Enviar Catálogo</p>
                    <p className="text-sm text-muted-foreground">
                      Permite que atendentes enviem catálogo de pacotes
                    </p>
                  </div>
                </div>
                <Switch checked={catalogEnabled} onCheckedChange={setCatalogEnabled} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF & Branding Tab */}
        <TabsContent value="pdf" className="space-y-4">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-4">
              {/* Agency Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Dados da Agência
                  </CardTitle>
                  <CardDescription>
                    Informações que aparecerão nos PDFs e documentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Agência</Label>
                      <Input
                        value={agencySettings.name}
                        onChange={(e) => setAgencySettings(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome da agência"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input
                        value={agencySettings.cnpj}
                        onChange={(e) => setAgencySettings(prev => ({ ...prev, cnpj: e.target.value }))}
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        Telefone
                      </Label>
                      <Input
                        value={agencySettings.phone}
                        onChange={(e) => setAgencySettings(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        E-mail
                      </Label>
                      <Input
                        type="email"
                        value={agencySettings.email}
                        onChange={(e) => setAgencySettings(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@agencia.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        Website
                      </Label>
                      <Input
                        value={agencySettings.website}
                        onChange={(e) => setAgencySettings(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="www.suaagencia.com.br"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Endereço</Label>
                      <Input
                        value={agencySettings.address}
                        onChange={(e) => setAgencySettings(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Endereço completo"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Identidade Visual
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência dos seus PDFs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo */}
                  <div className="space-y-3">
                    <Label>Logo da Agência</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-48 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                        {agencySettings.logo ? (
                          <img 
                            src={agencySettings.logo} 
                            alt="Logo" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-1" />
                            <span className="text-xs">Sem logo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={handleLogoUpload}>
                          <Upload className="h-4 w-4 mr-2" />
                          Carregar Logo
                        </Button>
                        {agencySettings.logo && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => setAgencySettings(prev => ({ ...prev, logo: '' }))}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recomendado: PNG ou JPG, máximo 2MB, proporção 2.5:1
                    </p>
                  </div>

                  <Separator />

                  {/* Colors */}
                  <div className="space-y-3">
                    <Label>Cores do Tema</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Cor Primária</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={agencySettings.primaryColor}
                            onChange={(e) => setAgencySettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-12 h-10 rounded border border-border cursor-pointer"
                          />
                          <Input
                            value={agencySettings.primaryColor}
                            onChange={(e) => setAgencySettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Cor Secundária</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={agencySettings.secondaryColor}
                            onChange={(e) => setAgencySettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-12 h-10 rounded border border-border cursor-pointer"
                          />
                          <Input
                            value={agencySettings.secondaryColor}
                            onChange={(e) => setAgencySettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-3">
                    <Label>Pré-visualização do Cabeçalho</Label>
                    <div 
                      className="p-4 rounded-lg text-white"
                      style={{ background: `linear-gradient(135deg, ${agencySettings.primaryColor}, ${agencySettings.secondaryColor})` }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{agencySettings.name}</h3>
                          <p className="text-sm opacity-90">{agencySettings.website}</p>
                        </div>
                        {agencySettings.logo && (
                          <img src={agencySettings.logo} alt="Logo" className="h-10 object-contain" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PDF Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Conteúdo do PDF
                  </CardTitle>
                  <CardDescription>
                    Textos padrão para orçamentos e roteiros
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Texto do Rodapé</Label>
                    <Textarea
                      value={agencySettings.footerText}
                      onChange={(e) => setAgencySettings(prev => ({ ...prev, footerText: e.target.value }))}
                      placeholder="Texto que aparecerá no rodapé dos documentos"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Termos e Condições</Label>
                    <Textarea
                      value={agencySettings.termsText}
                      onChange={(e) => setAgencySettings(prev => ({ ...prev, termsText: e.target.value }))}
                      placeholder="Termos e condições padrão"
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button onClick={handleSaveAgencySettings} className="w-full" disabled={saveBrandingMutation.isPending}>
                {saveBrandingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Configurações
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Gamification Settings */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Gamificação
              </CardTitle>
              <CardDescription>
                Sistema de níveis, badges, ranking e desafios para a equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${gamificationEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Trophy className={`h-5 w-5 ${gamificationEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Habilitar Gamificação</p>
                    <p className="text-sm text-muted-foreground">
                      Ativa rankings, badges, XP e desafios diários
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={gamificationEnabled} 
                  onCheckedChange={handleGamificationToggle}
                />
              </div>

              {gamificationEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🏆</span>
                      <span className="font-medium text-foreground">Rankings</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Competição saudável entre a equipe com ranking diário, semanal e mensal
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎖️</span>
                      <span className="font-medium text-foreground">Badges</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Conquistas desbloqueáveis por metas de vendas, velocidade e satisfação
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⚡</span>
                      <span className="font-medium text-foreground">XP & Níveis</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Progressão com pontos de experiência por atividades realizadas
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎯</span>
                      <span className="font-medium text-foreground">Desafios</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Metas diárias com recompensas em XP para motivar a equipe
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Notificações por e-mail</p>
                  <p className="text-sm text-muted-foreground">Receber alertas de novas conversas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Distribuição automática</p>
                  <p className="text-sm text-muted-foreground">Distribuir leads entre atendentes online</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Horário de atendimento</p>
                  <p className="text-sm text-muted-foreground">Fora do horário, IA assume atendimento</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration Tab */}
        <TabsContent value="ai-config" className="space-y-4">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-4">
              {/* System Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Prompt Principal
                  </CardTitle>
                  <CardDescription>
                    Configure o comportamento base da IA em todos os atendimentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prompt do Sistema</Label>
                    <Textarea
                      value={aiSettings.systemPrompt}
                      onChange={(e) => setAISettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      placeholder="Descreva como a IA deve se comportar..."
                      className="min-h-[150px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Este é o prompt base que define a personalidade e capacidades da IA
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Autopilot Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Prompt do Piloto Automático
                  </CardTitle>
                  <CardDescription>
                    Configure como a IA responde automaticamente aos clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Instruções do Autopilot</Label>
                    <Textarea
                      value={aiSettings.autopilotPrompt}
                      onChange={(e) => setAISettings(prev => ({ ...prev, autopilotPrompt: e.target.value }))}
                      placeholder="Instruções para respostas automáticas..."
                      className="min-h-[150px] font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suggestion & Analysis Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Prompts de Sugestão e Análise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prompt de Sugestões</Label>
                    <Textarea
                      value={aiSettings.suggestionPrompt}
                      onChange={(e) => setAISettings(prev => ({ ...prev, suggestionPrompt: e.target.value }))}
                      placeholder="Instruções para gerar sugestões..."
                      className="min-h-[80px] font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prompt de Análise</Label>
                    <Textarea
                      value={aiSettings.analysisPrompt}
                      onChange={(e) => setAISettings(prev => ({ ...prev, analysisPrompt: e.target.value }))}
                      placeholder="Instruções para analisar conversas..."
                      className="min-h-[80px] font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Knowledge Base */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Base de Conhecimento
                  </CardTitle>
                  <CardDescription>
                    Adicione informações que a IA deve usar nos atendimentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Info */}
                  <div className="space-y-2">
                    <Label>Informações da Empresa</Label>
                    <Textarea
                      value={aiSettings.companyInfo}
                      onChange={(e) => setAISettings(prev => ({ ...prev, companyInfo: e.target.value }))}
                      placeholder="Descreva sua agência, história, diferenciais, políticas..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Products Info */}
                  <div className="space-y-2">
                    <Label>Produtos e Serviços</Label>
                    <Textarea
                      value={aiSettings.productsInfo}
                      onChange={(e) => setAISettings(prev => ({ ...prev, productsInfo: e.target.value }))}
                      placeholder="Liste seus principais pacotes, destinos, promoções..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* FAQ Info */}
                  <div className="space-y-2">
                    <Label>Perguntas Frequentes (FAQ)</Label>
                    <Textarea
                      value={aiSettings.faqInfo}
                      onChange={(e) => setAISettings(prev => ({ ...prev, faqInfo: e.target.value }))}
                      placeholder="Liste perguntas e respostas comuns dos clientes..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <Separator />

                  {/* Additional Knowledge Items */}
                  <div className="space-y-3">
                    <Label>Itens Adicionais de Conhecimento</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newKnowledgeItem}
                        onChange={(e) => setNewKnowledgeItem(e.target.value)}
                        placeholder="Ex: Aceitamos PIX com 5% de desconto"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddKnowledgeItem()}
                      />
                      <Button onClick={handleAddKnowledgeItem} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {aiSettings.knowledgeBase.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {aiSettings.knowledgeBase.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <span className="flex-1 text-sm">{item}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveKnowledgeItem(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSaveAISettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Configurações de IA
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Conectar Número WhatsApp
              </CardTitle>
              <CardDescription>
                Configure a integração com WhatsApp via Green API para receber e enviar mensagens em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Status */}
              <div className={`flex items-center justify-between p-4 rounded-lg ${whatsappConnection.isConnected ? 'bg-success/10 border border-success/20' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-3">
                  {whatsappConnection.isConnected ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {whatsappConnection.isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {whatsappConnection.isConnected 
                        ? 'Pronto para enviar e receber mensagens' 
                        : 'Configure as credenciais abaixo para conectar'}
                    </p>
                  </div>
                </div>
                {whatsappConnection.isConnected && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Online
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Credentials Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceId">Instance ID</Label>
                  <Input
                    id="instanceId"
                    placeholder="Ex: 1234567890"
                    value={whatsappConnection.instanceId}
                    onChange={(e) => setWhatsappConnection(prev => ({ ...prev, instanceId: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Encontre o Instance ID no painel da Green API
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    placeholder="Seu token de API"
                    value={whatsappConnection.apiToken}
                    onChange={(e) => setWhatsappConnection(prev => ({ ...prev, apiToken: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token de autenticação da sua instância Green API
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTestWhatsAppConnection}
                    disabled={isTestingConnection || !whatsappConnection.instanceId || !whatsappConnection.apiToken}
                    className="gap-2"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )}
                    Testar Conexão
                  </Button>
                  <Button
                    onClick={handleSaveWhatsAppConnection}
                    disabled={!whatsappConnection.instanceId || !whatsappConnection.apiToken}
                    className="gap-2"
                  >
                    Salvar Configurações
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Webhook Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Configuração do Webhook
                </h4>
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Configure este URL de webhook no painel da Green API:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded bg-background text-xs font-mono break-all">
                      https://jqupflvdfycpnqzhtmqb.supabase.co/functions/v1/whatsapp-webhook
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText('https://jqupflvdfycpnqzhtmqb.supabase.co/functions/v1/whatsapp-webhook');
                        toast({
                          title: 'URL copiada!',
                          description: 'Cole no campo de webhook da Green API.',
                        });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-2">Como configurar:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse o painel da Green API e crie uma instância</li>
                    <li>Escaneie o QR Code com seu WhatsApp</li>
                    <li>Copie o Instance ID e API Token</li>
                    <li>Cole as credenciais nos campos acima</li>
                    <li>Configure o URL de webhook no painel Green API</li>
                    <li>Clique em "Testar Conexão" para verificar</li>
                  </ol>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}