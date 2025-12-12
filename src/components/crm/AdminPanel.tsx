import { useState } from 'react';
import { Users, UserPlus, ArrowLeftRight, Settings, Shield, Activity, Bot, MessageSquare, Trash2, Edit, FileText, Palette, Upload, Building2, Phone, Mail, Globe, Gamepad2, Trophy, Smartphone, Link, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'supervisor';
  status: 'online' | 'offline' | 'busy';
  activeConversations: number;
  totalSales: number;
}

interface TransferRequest {
  id: string;
  from: string;
  to: string;
  customer: string;
  reason: string;
  timestamp: Date;
}

interface AgencySettings {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  termsText: string;
}

interface WhatsAppConnection {
  instanceId: string;
  apiToken: string;
  isConnected: boolean;
  phoneNumber: string;
}

const defaultAgencySettings: AgencySettings = {
  name: 'Viagens Incríveis',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 99999-9999',
  email: 'contato@viagensincriveis.com.br',
  website: 'www.viagensincriveis.com.br',
  address: 'Av. Paulista, 1000 - São Paulo, SP',
  logo: '',
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  footerText: 'Orçamento válido por 7 dias. Sujeito a disponibilidade.',
  termsText: 'Consulte condições de pagamento e cancelamento.',
};

const mockAgents: Agent[] = [
  { id: '1', name: 'Ana Paula', email: 'ana@agencia.com', role: 'supervisor', status: 'online', activeConversations: 5, totalSales: 45600 },
  { id: '2', name: 'Carlos Silva', email: 'carlos@agencia.com', role: 'agent', status: 'online', activeConversations: 8, totalSales: 32400 },
  { id: '3', name: 'Maria Santos', email: 'maria@agencia.com', role: 'agent', status: 'busy', activeConversations: 10, totalSales: 28900 },
  { id: '4', name: 'João Pedro', email: 'joao@agencia.com', role: 'agent', status: 'offline', activeConversations: 0, totalSales: 19500 },
];

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
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [transfers] = useState<TransferRequest[]>(mockTransfers);
  const [sdrEnabled, setSdrEnabled] = useState(true);
  const [catalogEnabled, setCatalogEnabled] = useState(true);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgent, setNewAgent] = useState<{ name: string; email: string; role: 'admin' | 'agent' | 'supervisor' }>({ name: '', email: '', role: 'agent' });
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(defaultAgencySettings);
  
  // WhatsApp Connection State
  const [whatsappConnection, setWhatsappConnection] = useState<WhatsAppConnection>({
    instanceId: '',
    apiToken: '',
    isConnected: false,
    phoneNumber: '',
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleGamificationToggle = (enabled: boolean) => {
    onGamificationToggle?.(enabled);
    toast({
      title: enabled ? 'Gamificação Ativada' : 'Gamificação Desativada',
      description: enabled 
        ? 'O sistema de gamificação está ativo para todos os agentes.'
        : 'O sistema de gamificação foi desativado.',
    });
  };

  const handleAddAgent = () => {
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name: newAgent.name,
      email: newAgent.email,
      role: newAgent.role,
      status: 'offline',
      activeConversations: 0,
      totalSales: 0,
    };
    setAgents(prev => [...prev, agent]);
    setNewAgent({ name: '', email: '', role: 'agent' });
    setShowAddAgent(false);
    toast({
      title: 'Atendente Adicionado',
      description: `${agent.name} foi adicionado com sucesso.`,
    });
  };

  const handleRemoveAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));
    toast({
      title: 'Atendente Removido',
      description: `${agent?.name} foi removido da equipe.`,
    });
  };

  const handleTransfer = (fromAgent: string, toAgent: string) => {
    toast({
      title: 'Transferência Solicitada',
      description: `Atendimento será transferido de ${fromAgent} para ${toAgent}.`,
    });
  };

  const handleSaveAgencySettings = () => {
    toast({
      title: 'Configurações Salvas',
      description: 'As configurações da agência foram atualizadas com sucesso.',
    });
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

  const handleLogoUpload = () => {
    // Simulate logo upload
    setAgencySettings(prev => ({
      ...prev,
      logo: 'https://via.placeholder.com/200x80?text=Logo+Agência'
    }));
    toast({
      title: 'Logo Atualizado',
      description: 'O logo da agência foi carregado com sucesso.',
    });
  };

  const roleColors = {
    admin: 'bg-destructive/10 text-destructive',
    supervisor: 'bg-warning/10 text-warning',
    agent: 'bg-primary/10 text-primary',
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-muted-foreground',
    busy: 'bg-warning',
  };

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
          <TabsTrigger value="transfers" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Transferências
          </TabsTrigger>
          <TabsTrigger value="sdr" className="gap-2">
            <Bot className="h-4 w-4" />
            IA SDR
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
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Atendentes</h2>
            <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Adicionar Atendente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Atendente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newAgent.name}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@agencia.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <Select
                      value={newAgent.role}
                      onValueChange={(value: 'admin' | 'agent' | 'supervisor') => 
                        setNewAgent(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Atendente</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddAgent} className="w-full">
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="grid gap-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${statusColors[agent.status]}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{agent.name}</span>
                            <Badge className={roleColors[agent.role]} variant="secondary">
                              {agent.role === 'admin' ? 'Admin' : agent.role === 'supervisor' ? 'Supervisor' : 'Atendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-foreground">{agent.activeConversations}</p>
                          <p className="text-xs text-muted-foreground">Atendimentos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agent.totalSales)}
                          </p>
                          <p className="text-xs text-muted-foreground">Vendas</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveAgent(agent.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
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
                      {agents.filter(a => a.activeConversations > 0).map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.activeConversations} atendimentos)
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
                      {agents.filter(a => a.status === 'online').map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.activeConversations} atendimentos)
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
              <Button onClick={handleSaveAgencySettings} className="w-full">
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