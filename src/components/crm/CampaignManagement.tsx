import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Plus, Users, MapPin, Calendar, Send, Trash2, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignLead {
  id: string;
  conversation_id: string;
  contact_name: string;
  contact_phone: string | null;
  origin: string | null;
  destination: string;
  interest: string | null;
  travel_date: string | null;
  additional_interests: string[];
  notes: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  destination: string | null;
  interest: string | null;
  status: string;
  scheduled_date: string | null;
  created_at: string;
  lead_count?: number;
}

export function CampaignManagement() {
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCampaignDetail, setShowCampaignDetail] = useState<Campaign | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([]);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', destination: '', interest: '', scheduled_date: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [leadsRes, campaignsRes] = await Promise.all([
      supabase.from('campaign_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
    ]);

    if (leadsRes.data) setLeads(leadsRes.data as CampaignLead[]);
    if (campaignsRes.data) {
      // Get lead counts for each campaign
      const campaignsWithCounts = await Promise.all(
        (campaignsRes.data as Campaign[]).map(async (c) => {
          const { count } = await supabase
            .from('campaign_lead_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', c.id);
          return { ...c, lead_count: count || 0 };
        })
      );
      setCampaigns(campaignsWithCounts);
    }
    setLoading(false);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) return;

    const { data, error } = await supabase.from('campaigns').insert({
      name: newCampaign.name,
      description: newCampaign.description || null,
      destination: newCampaign.destination || null,
      interest: newCampaign.interest || null,
      scheduled_date: newCampaign.scheduled_date || null,
      status: 'draft',
    }).select().single();

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao criar campanha.', variant: 'destructive' });
      return;
    }

    // Assign selected leads
    if (selectedLeads.length > 0 && data) {
      await supabase.from('campaign_lead_assignments').insert(
        selectedLeads.map(leadId => ({ campaign_id: data.id, lead_id: leadId }))
      );
    }

    toast({ title: 'Campanha criada!', description: `${selectedLeads.length} leads adicionados.` });
    setShowCreateCampaign(false);
    setNewCampaign({ name: '', description: '', destination: '', interest: '', scheduled_date: '' });
    setSelectedLeads([]);
    loadData();
  };

  const handleViewCampaign = async (campaign: Campaign) => {
    setShowCampaignDetail(campaign);
    const { data } = await supabase
      .from('campaign_lead_assignments')
      .select('lead_id')
      .eq('campaign_id', campaign.id);
    
    if (data) {
      const leadIds = data.map(d => d.lead_id);
      const matchedLeads = leads.filter(l => leadIds.includes(l.id));
      setCampaignLeads(matchedLeads);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    await supabase.from('campaigns').delete().eq('id', campaignId);
    toast({ title: 'Campanha removida' });
    setShowCampaignDetail(null);
    loadData();
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleAllLeads = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-primary/10 text-primary',
    sent: 'bg-success/10 text-success',
    completed: 'bg-accent text-accent-foreground',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativa',
    sent: 'Enviada',
    completed: 'Concluída',
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Campanhas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie campanhas de marketing com leads capturados nos atendimentos
          </p>
        </div>
        <Button onClick={() => setShowCreateCampaign(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4 mt-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-foreground">Nenhuma campanha criada</h3>
                <p className="text-sm text-muted-foreground mt-1">Crie sua primeira campanha para enviar ofertas aos leads capturados.</p>
                <Button className="mt-4 gap-2" onClick={() => setShowCreateCampaign(true)}>
                  <Plus className="h-4 w-4" />
                  Criar Campanha
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(campaign => (
                <Card key={campaign.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleViewCampaign(campaign)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <Badge className={cn("text-xs", statusColors[campaign.status] || statusColors.draft)}>
                        {statusLabels[campaign.status] || campaign.status}
                      </Badge>
                    </div>
                    {campaign.description && (
                      <CardDescription className="text-xs">{campaign.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.lead_count} leads
                      </span>
                      {campaign.destination && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {campaign.destination}
                        </span>
                      )}
                      {campaign.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.scheduled_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          {leads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-foreground">Nenhum lead capturado</h3>
                <p className="text-sm text-muted-foreground mt-1">Leads serão adicionados automaticamente ao concluir atendimentos.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selectedLeads.length === leads.length && leads.length > 0}
                        onCheckedChange={toggleAllLeads}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Interesse</TableHead>
                    <TableHead>Data Viagem</TableHead>
                    <TableHead>Capturado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.contact_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {lead.destination}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.interest || '-'}</TableCell>
                      <TableCell>
                        {lead.travel_date ? new Date(lead.travel_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedLeads.length > 0 && (
                <div className="p-3 border-t border-border flex items-center justify-between bg-muted/50">
                  <span className="text-sm text-muted-foreground">{selectedLeads.length} leads selecionados</span>
                  <Button size="sm" className="gap-2" onClick={() => setShowCreateCampaign(true)}>
                    <Megaphone className="h-3.5 w-3.5" />
                    Criar Campanha com Selecionados
                  </Button>
                </div>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Nova Campanha
            </DialogTitle>
            <DialogDescription>
              {selectedLeads.length > 0 
                ? `${selectedLeads.length} leads serão adicionados a esta campanha`
                : 'Crie uma campanha e adicione leads posteriormente'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Campanha *</Label>
              <Input 
                placeholder="Ex: Promoção Cancún Verão 2026"
                value={newCampaign.name}
                onChange={e => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                placeholder="Descreva o objetivo da campanha..."
                value={newCampaign.description}
                onChange={e => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input 
                  placeholder="Ex: Cancún"
                  value={newCampaign.destination}
                  onChange={e => setNewCampaign(prev => ({ ...prev, destination: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Interesse</Label>
                <Input 
                  placeholder="Ex: Praia, Lua de Mel"
                  value={newCampaign.interest}
                  onChange={e => setNewCampaign(prev => ({ ...prev, interest: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Envio</Label>
              <Input 
                type="datetime-local"
                value={newCampaign.scheduled_date}
                onChange={e => setNewCampaign(prev => ({ ...prev, scheduled_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>Cancelar</Button>
            <Button onClick={handleCreateCampaign} disabled={!newCampaign.name}>
              <Send className="h-4 w-4 mr-2" />
              Criar Campanha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Modal */}
      <Dialog open={!!showCampaignDetail} onOpenChange={() => setShowCampaignDetail(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {showCampaignDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    {showCampaignDetail.name}
                  </DialogTitle>
                  <Badge className={cn("text-xs", statusColors[showCampaignDetail.status] || statusColors.draft)}>
                    {statusLabels[showCampaignDetail.status] || showCampaignDetail.status}
                  </Badge>
                </div>
                {showCampaignDetail.description && (
                  <DialogDescription>{showCampaignDetail.description}</DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {showCampaignDetail.destination && (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{showCampaignDetail.destination}</span>
                  )}
                  {showCampaignDetail.scheduled_date && (
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(showCampaignDetail.scheduled_date).toLocaleString('pt-BR')}</span>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Leads ({campaignLeads.length})</h4>
                  {campaignLeads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum lead associado a esta campanha.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Interesse</TableHead>
                          <TableHead>Telefone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignLeads.map(lead => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.contact_name}</TableCell>
                            <TableCell>{lead.destination}</TableCell>
                            <TableCell>{lead.interest || '-'}</TableCell>
                            <TableCell>{lead.contact_phone || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="flex justify-between pt-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteCampaign(showCampaignDetail.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
