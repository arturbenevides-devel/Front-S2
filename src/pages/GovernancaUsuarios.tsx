import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTenantCompany } from '@/hooks/useTenantCompany';
import { AccessDenied } from '@/components/governance/AccessDenied';
import type { CreateUserRequest, ProfileListItemDto, UserListItemDto } from '@/types/api';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

export default function GovernancaUsuarios() {
  const { canManageUsers, isDefaultProfile, isLoadingMenus } = useAccessControl();
  const { companies } = useTenantCompany();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [profileId, setProfileId] = useState('');
  const [companyId, setCompanyId] = useState<string>('');

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
        description:
          'O cadastro foi enviado. Se não informou senha, o convite segue por e-mail (confirmação no back-S2).',
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

  const activeProfiles = (profilesQuery.data ?? []).filter((p) => p.isActive);

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
    if (password.length > 0 && password.length < 6) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter pelo menos 6 caracteres ou ficar em branco para convite por e-mail.',
        variant: 'destructive',
      });
      return;
    }
    const body: CreateUserRequest = {
      email: trimmedEmail,
      fullName: trimmedName,
      profileId,
      ...(password.length >= 6 ? { password } : {}),
      ...(companyId ? { companyId } : {}),
    };
    createMutation.mutate(body);
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
            Listagem real do tenant (GET /users). O usuário logado pode ser omitido pelo backend. Cadastro conforme
            CreateUserDto: e-mail, nome, perfil (UUID); senha opcional (mín. 6); empresa opcional.
          </p>
        </div>
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
                <Label htmlFor="gu-password">Senha (opcional)</Label>
                <Input
                  id="gu-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres; vazio = convite por e-mail"
                  autoComplete="new-password"
                  minLength={0}
                />
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
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
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
      </div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  Nenhum usuário retornado pela API (ou apenas o logado, que o backend omite).
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.profile?.name ?? '—'}</TableCell>
                  <TableCell>{u.isActive ? 'Sim' : 'Não'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
