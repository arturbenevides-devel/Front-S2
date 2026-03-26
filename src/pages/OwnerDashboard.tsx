import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useToast } from '@/hooks/use-toast';
import type { UserListItemDto, ProfileListItemDto } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Loader2,
  Trash2,
  Building2,
  Shield,
  Plus,
  Pencil,
  Save,
  ChevronRight,
  Users,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// ---------- Types ----------

interface Tenant {
  id: string;
  schemaName: string;
  companyName: string;
  createdAt: string;
}

interface OwnerUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

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

// ---------- Helpers ----------

function tenantHeaders(cnpj: string) {
  return { headers: { 'x-tenant-schema': cnpj } };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatCnpj(digits: string) {
  const d = (digits ?? '').replace(/\D/g, '');
  if (d.length !== 14) return digits;
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function maskCnpj(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// ========== Tenant Detail Sheet ==========

function TenantDetailSheet({
  tenant,
  open,
  onOpenChange,
}: {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cnpj = tenant?.schemaName ?? '';

  // Edit tenant name
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const updateTenantMutation = useMutation({
    mutationFn: async (companyName: string) => {
      const { data } = await api.put<Tenant>(`/owner/tenants/${cnpj}`, { companyName });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenants'] });
      setIsEditingName(false);
      toast({ title: 'Nome atualizado.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao atualizar', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: () => api.delete(`/owner/tenants/${cnpj}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenants'] });
      onOpenChange(false);
      toast({ title: 'Tenant excluído.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao excluir', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  // Tenant users
  const usersQuery = useQuery({
    queryKey: ['owner', 'tenant-users', cnpj],
    queryFn: async () => {
      const { data } = await api.get<UserListItemDto[]>('/users', tenantHeaders(cnpj));
      return data;
    },
    enabled: open && !!cnpj,
  });

  const profilesQuery = useQuery({
    queryKey: ['owner', 'tenant-profiles', cnpj],
    queryFn: async () => {
      const { data } = await api.get<ProfileListItemDto[]>('/profiles', tenantHeaders(cnpj));
      return data;
    },
    enabled: open && !!cnpj,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, profileId }: { userId: string; profileId: string }) =>
      api.put(`/users/${userId}`, { profileId }, tenantHeaders(cnpj)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenant-users', cnpj] });
      toast({ title: 'Perfil do usuário atualizado.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao atualizar perfil', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      api.post('/users/status', { id, status }, tenantHeaders(cnpj)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenant-users', cnpj] });
      toast({ title: 'Status atualizado.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao alterar status', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  // Teams
  const teamsQuery = useQuery({
    queryKey: ['owner', 'tenant-teams', cnpj],
    queryFn: async () => {
      const { data } = await api.get<TeamResponse[]>('/teams', tenantHeaders(cnpj));
      return data;
    },
    enabled: open && !!cnpj,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (body: { name: string; supervisorId?: string }) => {
      const { data } = await api.post<TeamResponse>('/teams', body, tenantHeaders(cnpj));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenant-teams', cnpj] });
      setNewTeamName('');
      setNewTeamSupervisorId('');
      setShowCreateTeam(false);
      toast({ title: 'Equipe criada.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao criar equipe', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, ...body }: { teamId: string; name?: string; supervisorId?: string | null; memberIds?: string[] }) => {
      const { data } = await api.put<TeamResponse>(`/teams/${teamId}`, body, tenantHeaders(cnpj));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenant-teams', cnpj] });
      toast({ title: 'Equipe atualizada.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao atualizar equipe', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(`/teams/${teamId}`, tenantHeaders(cnpj));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenant-teams', cnpj] });
      setEditingTeamId(null);
      toast({ title: 'Equipe removida.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao remover equipe', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  // Team UI state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSupervisorId, setNewTeamSupervisorId] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamSupervisorId, setEditTeamSupervisorId] = useState('');
  const [editTeamMemberIds, setEditTeamMemberIds] = useState<string[]>([]);

  const startEditTeam = (team: TeamResponse) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamSupervisorId(team.supervisorId || '');
    setEditTeamMemberIds(team.members.map((m) => m.id));
  };

  const saveTeam = () => {
    if (!editingTeamId) return;
    updateTeamMutation.mutate({
      teamId: editingTeamId,
      name: editTeamName,
      supervisorId: editTeamSupervisorId && editTeamSupervisorId !== '__none' ? editTeamSupervisorId : null,
      memberIds: editTeamMemberIds,
    });
    setEditingTeamId(null);
  };

  const toggleTeamMember = (userId: string) => {
    setEditTeamMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const users = usersQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  // Supervisors: users with "Supervisor" profile
  const supervisorUsers = users.filter((u) => u.profile?.name === 'Supervisor' && u.isActive);
  const teams = teamsQuery.data ?? [];

  // Seed default profiles (auto-trigger when only 1 profile)
  const seedProfilesMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ created: string[] }>(`/owner/tenants/${cnpj}/seed-profiles`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenant-profiles', cnpj] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenant-users', cnpj] });
      if (data.created.length) {
        toast({ title: `Perfis criados: ${data.created.join(', ')}` });
      }
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao criar perfis padrão', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  // Auto-seed when sheet opens and tenant has only 1 profile
  const profilesData = profilesQuery.data;
  const needsSeed = profilesQuery.isSuccess && (profilesData?.length ?? 0) <= 1;

  if (needsSeed && !seedProfilesMutation.isPending && !seedProfilesMutation.isSuccess) {
    seedProfilesMutation.mutate();
  }

  const startEditName = () => {
    setEditName(tenant?.companyName ?? '');
    setIsEditingName(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {tenant?.companyName}
          </SheetTitle>
          <SheetDescription>
            CNPJ: {formatCnpj(cnpj)} &middot; Criado em {formatDate(tenant?.createdAt ?? '')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* ---- Edit company name ---- */}
          <div>
            <h3 className="text-sm font-medium mb-2">Razão social</h3>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  disabled={updateTenantMutation.isPending || editName.trim().length < 2}
                  onClick={() => updateTenantMutation.mutate(editName.trim())}
                >
                  {updateTenantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">{tenant?.companyName}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEditName}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* ---- Users ---- */}
          <div>
            <h3 className="text-sm font-medium mb-2">Usuários do tenant</h3>

            {usersQuery.isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            )}

            {usersQuery.isError && (
              <p className="text-destructive text-sm">
                {getApiErrorMessage(usersQuery.error, 'Erro ao carregar usuários.')}
              </p>
            )}

            {usersQuery.isSuccess && (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-center text-sm">
                          Nenhum usuário.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div>
                              <span className="font-medium text-sm">{u.fullName}</span>
                              <br />
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.profile.id}
                              onValueChange={(profileId) =>
                                updateUserMutation.mutate({ userId: u.id, profileId })
                              }
                              disabled={updateUserMutation.isPending}
                            >
                              <SelectTrigger className="w-[160px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {profiles.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                    {p.isDefault ? ' (admin)' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={u.isActive}
                              disabled={statusMutation.isPending}
                              onCheckedChange={(checked) =>
                                statusMutation.mutate({ id: u.id, status: checked })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* ---- Teams ---- */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipes
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-7 text-xs"
                onClick={() => setShowCreateTeam(!showCreateTeam)}
              >
                <Plus className="h-3 w-3" />
                Nova equipe
              </Button>
            </div>

            {showCreateTeam && (
              <div className="rounded-md border border-border p-3 mb-3 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome da equipe</Label>
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Ex: Equipe Comercial"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Supervisor</Label>
                  <Select value={newTeamSupervisorId} onValueChange={setNewTeamSupervisorId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecionar supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisorUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                      ))}
                      {supervisorUsers.length === 0 && (
                        <SelectItem value="__none" disabled>Nenhum supervisor disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={createTeamMutation.isPending || newTeamName.trim().length < 2}
                    onClick={() =>
                      createTeamMutation.mutate({
                        name: newTeamName.trim(),
                        supervisorId: newTeamSupervisorId || undefined,
                      })
                    }
                  >
                    {createTeamMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Criar'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCreateTeam(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {teamsQuery.isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando equipes...
              </div>
            )}

            {teamsQuery.isSuccess && teams.length === 0 && (
              <p className="text-muted-foreground text-sm py-2">Nenhuma equipe criada.</p>
            )}

            {teamsQuery.isSuccess && teams.length > 0 && (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div key={team.id} className="rounded-md border border-border p-3">
                    {editingTeamId === team.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Editando equipe</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTeamId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Supervisor</Label>
                          <Select value={editTeamSupervisorId} onValueChange={setEditTeamSupervisorId}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Selecionar supervisor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">Sem supervisor</SelectItem>
                              {supervisorUsers.map((u) => (
                                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Membros</Label>
                          <div className="max-h-[150px] overflow-y-auto space-y-1 rounded-md border border-border p-2">
                            {users.filter((u) => u.isActive).map((u) => (
                              <label
                                key={u.id}
                                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                              >
                                <Checkbox
                                  checked={editTeamMemberIds.includes(u.id)}
                                  onCheckedChange={() => toggleTeamMember(u.id)}
                                />
                                <span>{u.fullName}</span>
                                <span className="text-muted-foreground">({u.profile?.name})</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            disabled={updateTeamMutation.isPending || editTeamName.trim().length < 2}
                            onClick={saveTeam}
                          >
                            {updateTeamMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Salvar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1">
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir equipe "{team.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Os membros serão desvinculados da equipe.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteTeamMutation.mutate(team.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => startEditTeam(team)}
                      >
                        <div>
                          <span className="font-medium text-sm">{team.name}</span>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {team.supervisorName ? `Supervisor: ${team.supervisorName}` : 'Sem supervisor'}
                            {' · '}
                            {team.members.length} membro{team.members.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- Profiles ---- */}
          <div>
            <h3 className="text-sm font-medium mb-2">Perfis de acesso</h3>

            {(profilesQuery.isLoading || seedProfilesMutation.isPending) && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {seedProfilesMutation.isPending ? 'Criando perfis padrão…' : 'Carregando…'}
              </div>
            )}

            {profilesQuery.isSuccess && !seedProfilesMutation.isPending && (
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => (
                  <Badge key={p.id} variant={p.isDefault ? 'default' : 'outline'}>
                    {p.name}
                    {p.isDefault ? ' (admin)' : ''}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ---- Delete tenant ---- */}
          <div className="border-t border-border pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir tenant
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Excluir "{tenant?.companyName}"?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todo o schema do banco de dados será removido,
                    incluindo todos os usuários, dados e configurações deste tenant.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={deleteTenantMutation.isPending}
                    onClick={() => deleteTenantMutation.mutate()}
                  >
                    {deleteTenantMutation.isPending ? 'Excluindo…' : 'Excluir permanentemente'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ========== Main Dashboard ==========

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Tenant detail sheet
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Create tenant dialog
  const [tenantOpen, setTenantOpen] = useState(false);
  const [tenantCnpj, setTenantCnpj] = useState('');
  const [tenantCompanyName, setTenantCompanyName] = useState('');
  const [tenantAdminName, setTenantAdminName] = useState('');
  const [tenantAdminEmail, setTenantAdminEmail] = useState('');
  const [tenantAdminPassword, setTenantAdminPassword] = useState('');

  // Create owner dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // ---------- Queries ----------

  const tenantsQuery = useQuery({
    queryKey: ['owner', 'tenants'],
    queryFn: async () => {
      const { data } = await api.get<Tenant[]>('/owner/tenants');
      return data;
    },
  });

  const ownersQuery = useQuery({
    queryKey: ['owner', 'users'],
    queryFn: async () => {
      const { data } = await api.get<OwnerUser[]>('/owner/users');
      return data;
    },
  });

  // ---------- Mutations ----------

  const createTenantMutation = useMutation({
    mutationFn: async (body: {
      cnpj: string;
      companyName: string;
      fullName: string;
      email: string;
      password: string;
    }) => {
      const { data } = await api.post<{ message: string }>('/owner/tenants', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'tenants'] });
      setTenantOpen(false);
      setTenantCnpj('');
      setTenantCompanyName('');
      setTenantAdminName('');
      setTenantAdminEmail('');
      setTenantAdminPassword('');
      toast({ title: 'Tenant criado com sucesso.', description: 'O admin receberá o e-mail de ativação.' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao criar tenant',
        description: getApiErrorMessage(err, 'Verifique os dados e tente novamente.'),
        variant: 'destructive',
      });
    },
  });

  const createOwnerMutation = useMutation({
    mutationFn: async (body: { email: string; fullName: string; password: string }) => {
      const { data } = await api.post<OwnerUser>('/owner/users', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'users'] });
      setCreateOpen(false);
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      toast({ title: 'Owner criado com sucesso.' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao criar owner',
        description: getApiErrorMessage(err, 'Verifique os dados e tente novamente.'),
        variant: 'destructive',
      });
    },
  });

  const deactivateOwnerMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/owner/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'users'] });
      toast({ title: 'Owner desativado.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao desativar owner', description: getApiErrorMessage(err), variant: 'destructive' });
    },
  });

  // ---------- Handlers ----------

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const cnpjDigits = tenantCnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      toast({ title: 'CNPJ inválido', description: 'Informe os 14 dígitos do CNPJ.', variant: 'destructive' });
      return;
    }
    if (tenantCompanyName.trim().length < 2) {
      toast({ title: 'Nome inválido', description: 'Informe pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }
    if (tenantAdminPassword.trim().length < 6) {
      toast({ title: 'Senha inválida', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    createTenantMutation.mutate({
      cnpj: cnpjDigits,
      companyName: tenantCompanyName.trim(),
      fullName: tenantAdminName.trim(),
      email: tenantAdminEmail.trim(),
      password: tenantAdminPassword.trim(),
    });
  };

  const handleCreateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newFullName.trim();
    const trimmedEmail = newEmail.trim();
    const trimmedPassword = newPassword.trim();
    if (trimmedName.length < 2) {
      toast({ title: 'Nome inválido', description: 'Informe pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }
    if (trimmedPassword.length < 6) {
      toast({ title: 'Senha inválida', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    createOwnerMutation.mutate({ email: trimmedEmail, fullName: trimmedName, password: trimmedPassword });
  };

  const openTenantDetail = (t: Tenant) => {
    setSelectedTenant(t);
    setSheetOpen(true);
  };

  // ---------- Render ----------

  return (
    <div className="overflow-auto h-full">
      <Tabs defaultValue="tenants" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tenants" className="gap-2">
            <Building2 className="h-4 w-4" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="owners" className="gap-2">
            <Shield className="h-4 w-4" />
            Owners
          </TabsTrigger>
        </TabsList>

        {/* ==================== TENANTS TAB ==================== */}
        <TabsContent value="tenants">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Tenants cadastrados</h2>
              <p className="text-sm text-muted-foreground">
                Clique em um tenant para gerenciar usuários e permissões.
              </p>
            </div>
            <Dialog open={tenantOpen} onOpenChange={setTenantOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Novo tenant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo tenant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTenant} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="ot-cnpj">CNPJ</Label>
                    <Input
                      id="ot-cnpj"
                      value={tenantCnpj}
                      onChange={(e) => setTenantCnpj(maskCnpj(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ot-companyName">Nome da empresa</Label>
                    <Input
                      id="ot-companyName"
                      value={tenantCompanyName}
                      onChange={(e) => setTenantCompanyName(e.target.value)}
                      placeholder="Empresa LTDA"
                      minLength={2}
                      required
                    />
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-sm font-medium mb-3 text-muted-foreground">Administrador do tenant</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ot-adminName">Nome completo</Label>
                        <Input
                          id="ot-adminName"
                          value={tenantAdminName}
                          onChange={(e) => setTenantAdminName(e.target.value)}
                          placeholder="Nome e sobrenome"
                          minLength={2}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ot-adminEmail">E-mail</Label>
                        <Input
                          id="ot-adminEmail"
                          type="email"
                          value={tenantAdminEmail}
                          onChange={(e) => setTenantAdminEmail(e.target.value)}
                          placeholder="admin@empresa.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ot-adminPassword">Senha</Label>
                        <Input
                          id="ot-adminPassword"
                          type="password"
                          value={tenantAdminPassword}
                          onChange={(e) => setTenantAdminPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createTenantMutation.isPending || tenantCnpj.replace(/\D/g, '').length !== 14}
                  >
                    {createTenantMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando…</>
                    ) : (
                      'Criar tenant'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {tenantsQuery.isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando tenants…
            </div>
          )}

          {tenantsQuery.isError && (
            <div className="p-4 text-destructive text-sm">
              {getApiErrorMessage(tenantsQuery.error, 'Não foi possível carregar os tenants.')}
            </div>
          )}

          {tenantsQuery.isSuccess && (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tenantsQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        Nenhum tenant cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (tenantsQuery.data ?? []).map((t) => (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openTenantDetail(t)}
                      >
                        <TableCell className="font-medium">{t.companyName}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCnpj(t.schemaName)}</TableCell>
                        <TableCell>{formatDate(t.createdAt)}</TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <TenantDetailSheet
            tenant={selectedTenant}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          />
        </TabsContent>

        {/* ==================== OWNERS TAB ==================== */}
        <TabsContent value="owners">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Usuários Owner</h2>
              <p className="text-sm text-muted-foreground">
                Administradores com acesso total a todos os tenants.
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shrink-0">
                  <UserPlus className="h-4 w-4" />
                  Novo owner
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo owner</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOwner} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="od-fullName">Nome completo</Label>
                    <Input
                      id="od-fullName"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Nome e sobrenome"
                      minLength={2}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="od-email">E-mail</Label>
                    <Input
                      id="od-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="admin@empresa.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="od-password">Senha</Label>
                    <Input
                      id="od-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createOwnerMutation.isPending || newPassword.trim().length < 6}
                  >
                    {createOwnerMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando…</>
                    ) : (
                      'Criar owner'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {ownersQuery.isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando owners…
            </div>
          )}

          {ownersQuery.isError && (
            <div className="p-4 text-destructive text-sm">
              {getApiErrorMessage(ownersQuery.error, 'Não foi possível carregar os owners.')}
            </div>
          )}

          {ownersQuery.isSuccess && (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ownersQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground text-center">
                        Nenhum owner cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (ownersQuery.data ?? []).map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.fullName}</TableCell>
                        <TableCell>{o.email}</TableCell>
                        <TableCell>
                          <Badge variant={o.isActive ? 'default' : 'secondary'}>
                            {o.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(o.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {o.isActive && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Desativar owner"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Desativar owner "{o.fullName}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Este usuário perderá acesso administrativo ao sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => deactivateOwnerMutation.mutate(o.id)}
                                  >
                                    Desativar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
