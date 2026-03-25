import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAccessControl } from '@/hooks/useAccessControl';
import { AccessDenied } from '@/components/governance/AccessDenied';
import type { UserListItemDto } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GovernancaUsuarios() {
  const { canManageUsers, isDefaultProfile, isLoadingMenus } = useAccessControl();

  const query = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const { data } = await api.get<UserListItemDto[]>('/users');
      return data;
    },
    enabled: canManageUsers,
  });

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
      <h1 className="text-lg font-semibold mb-1">Usuários</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Dados do tenant atual (isolamento por empresa no backend). Usuário logado pode não aparecer na lista.
      </p>
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
                  Nenhum usuário retornado.
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
