import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTenantCompany } from '@/hooks/useTenantCompany';
import { AccessDenied } from '@/components/governance/AccessDenied';
import type { CreateUserRequest, ProfileListItemDto, UpdateUserRequest, UserListItemDto } from '@/types/api';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, Pencil, Trash2 } from 'lucide-react';

export default function GovernancaUsuarios() {
  const {
    canManageUsers,
    canCreateUsers,
    canUpdateUsers,
    canChangeUserStatus,
    canDeleteUsers,
    isDefaultProfile,
    isLoadingMenus,
  } = useAccessControl();
  const { companies } = useTenantCompany();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [profileId, setProfileId] = useState('');
  const [companyId, setCompanyId] = useState<string>('');

  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItemDto | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editProfileId, setEditProfileId] = useState('');
  const [editCompanyId, setEditCompanyId] = useState<string>('');

  const query = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const { data } = await api.get<UserListItemDto[]>('/users');
      return data;
    },
    enabled: canManageUsers,
  });

  const profilesQuery = useQuery({
    queryKey: ['profiles', 'list'],
    queryFn: async () => {
      const { data } = await api.get<ProfileListItemDto[]>('/profiles');
      return data;
    },
    enabled: canManageUsers,
  });

  const createMutation = useMutation({
    mutationFn: async (body: CreateUserRequest) => {
      const { data } = await api.post<UserListItemDto>('/users', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setEmail('');
      setFullName('');
      setPassword('');
      setProfileId('');
      setCompanyId('');
      toast({
        title: 'Usuário criado',
        description: 'O cadastro foi enviado. O usuário receberá o e-mail para ativar a conta, se o envio estiver configurado.',
      });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Não foi possível criar o usuário',
        description: getApiErrorMessage(err, 'Verifique os dados e tente novamente.'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateUserRequest }) => {
      const { data } = await api.put<UserListItemDto>(`/users/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditOpen(false);
      setEditingUser(null);
      toast({ title: 'Usuário atualizado.' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Não foi possível atualizar o usuário',
        description: getApiErrorMessage(err, 'Verifique os dados e tente novamente.'),
        variant: 'destructive',
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      api.post('/users/status', { id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Status do usuário atualizado.' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao atualizar status',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário removido',
        description: 'O cadastro foi desativado (soft delete no servidor).',
      });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao remover usuário',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      });
    },
  });

  const activeProfiles = (profilesQuery.data ?? []).filter((p) => p.isActive);

  const profilesForEdit = (profilesQuery.data ?? []).filter(
    (p) => p.isActive || p.id === editingUser?.profile.id,
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 2) {
      toast({ title: 'Nome inválido', description: 'Informe pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }
    if (!profileId) {
      toast({ title: 'Perfil obrigatório', description: 'Selecione um perfil de acesso.', variant: 'destructive' });
      return;
    }
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      toast({
        title: 'Senha obrigatória',
        description: 'Informe uma senha com pelo menos 6 caracteres para o novo usuário.',
        variant: 'destructive',
      });
      return;
    }
    if (trimmedPassword.length < 6) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    const body: CreateUserRequest = {
      email: trimmedEmail,
      fullName: trimmedName,
      profileId,
      password: trimmedPassword,
      ...(companyId ? { companyId } : {}),
    };
    createMutation.mutate(body);
  };

  const openEdit = (u: UserListItemDto) => {
    setEditingUser(u);
    setEditEmail(u.email);
    setEditFullName(u.fullName);
    setEditProfileId(u.profile.id);
    setEditCompanyId(u.companyId ?? '');
    setEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const trimmedName = editFullName.trim();
    const trimmedEmail = editEmail.trim();
    if (trimmedName.length < 2) {
      toast({ title: 'Nome inválido', description: 'Informe pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }
    if (!editProfileId) {
      toast({ title: 'Perfil obrigatório', description: 'Selecione um perfil de acesso.', variant: 'destructive' });
      return;
    }
    const body: UpdateUserRequest = {
      email: trimmedEmail,
      fullName: trimmedName,
      profileId: editProfileId,
    };
    if (companies && companies.length > 0) {
      if (editCompanyId) {
        body.companyId = editCompanyId;
      }
    }
    updateMutation.mutate({ id: editingUser.id, body });
  };

  if (!isDefaultProfile && isLoadingMenus) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando permissões…
      </div>
    );
  }

  if (!canManageUsers) {
    return <AccessDenied title="Listagem de usuários" />;
  }

  if (query.isError) {
    return (
      <div className="p-6 text-destructive text-sm">
        {getApiErrorMessage(query.error, 'Não foi possível carregar os usuários.')}
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando usuários…
      </div>
    );
  }

  const rows = query.data ?? [];

  return (
    <div className="overflow-auto h-full p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold mb-1">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Listagem do tenant (GET /users). O usuário logado pode ser omitido pelo backend. Cadastro conforme
            CreateUserDto; edição e status exigem permissões no menu de usuários (ou perfil padrão). Remover
            aplica soft delete no servidor.
          </p>
        </div>
        {canCreateUsers ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 shrink-0">
                <UserPlus className="h-4 w-4" />
                Novo usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="gu-fullName">Nome completo</Label>
                  <Input
                    id="gu-fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome e sobrenome"
                    minLength={2}
                    maxLength={255}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gu-email">E-mail</Label>
                  <Input
                    id="gu-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gu-password">
                    Senha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="gu-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    aria-required
                  />
                  <p className="text-xs text-muted-foreground">Obrigatória. O usuário poderá alterá-la ao ativar o convite.</p>
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={profileId || undefined} onValueChange={setProfileId} required>
                    <SelectTrigger>
                      <SelectValue placeholder={profilesQuery.isLoading ? 'Carregando perfis…' : 'Selecione o perfil'} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProfiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                          {p.isDefault ? ' (padrão)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {companies && companies.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Empresa (opcional)</Label>
                    <Select value={companyId || '__none__'} onValueChange={(v) => setCompanyId(v === '__none__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || password.trim().length < 6}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvando…
                    </>
                  ) : (
                    'Cadastrar'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditingUser(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          {editingUser ? (
            <form onSubmit={handleUpdate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="gu-edit-fullName">Nome completo</Label>
                <Input
                  id="gu-edit-fullName"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Nome e sobrenome"
                  minLength={2}
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gu-edit-email">E-mail</Label>
                <Input
                  id="gu-edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={editProfileId || undefined} onValueChange={setEditProfileId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={profilesQuery.isLoading ? 'Carregando perfis…' : 'Selecione o perfil'} />
                  </SelectTrigger>
                  <SelectContent>
                    {profilesForEdit.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.isDefault ? ' (padrão)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {companies && companies.length > 0 ? (
                <div className="space-y-2">
                  <Label>Empresa (opcional)</Label>
                  <Select value={editCompanyId || '__none__'} onValueChange={(v) => setEditCompanyId(v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando…
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right w-[140px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  Nenhum usuário retornado pela API (ou apenas o logado, que o backend omite).
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.profile?.name ?? '—'}</TableCell>
                  <TableCell>
                    {canChangeUserStatus ? (
                      <Switch
                        checked={u.isActive}
                        disabled={statusMutation.isPending}
                        onCheckedChange={(checked) => statusMutation.mutate({ id: u.id, status: checked })}
                        title="Ativar ou desativar usuário"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{u.isActive ? 'Sim' : 'Não'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdateUsers ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEdit(u)}
                          disabled={!u.isActive}
                          title={u.isActive ? 'Editar' : 'Reative o usuário para editar dados'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {canDeleteUsers ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Remover usuário (desativar)"
                              disabled={!u.isActive}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover usuário "{u.fullName}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O cadastro será desativado no servidor (soft delete), como na API DELETE /users.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(u.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
