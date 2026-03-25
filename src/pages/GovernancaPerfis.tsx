import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAccessControl } from '@/hooks/useAccessControl';
import { AccessDenied } from '@/components/governance/AccessDenied';
import type { ProfileListItemDto } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GovernancaPerfis() {
  const { canManageProfiles, isDefaultProfile, isLoadingMenus } = useAccessControl();

  const query = useQuery({
    queryKey: ['profiles', 'list'],
    queryFn: async () => {
      const { data } = await api.get<ProfileListItemDto[]>('/profiles');
      return data;
    },
    enabled: canManageProfiles,
  });

  if (!isDefaultProfile && isLoadingMenus) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando permissões…
      </div>
    );
  }

  if (!canManageProfiles) {
    return <AccessDenied title="Perfis de acesso" />;
  }

  if (query.isError) {
    return (
      <div className="p-6 text-destructive text-sm">
        {getApiErrorMessage(query.error, 'Não foi possível carregar os perfis.')}
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando perfis…
      </div>
    );
  }

  const rows = query.data ?? [];

  return (
    <div className="overflow-auto h-full p-4 md:p-6">
      <h1 className="text-lg font-semibold mb-1">Perfis de acesso</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Perfis vinculados ao seu tenant. O perfil padrão ignora checagens finas de menu no backend.
      </p>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  Nenhum perfil retornado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="max-w-md truncate" title={p.description}>
                    {p.description}
                  </TableCell>
                  <TableCell>{p.isDefault ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>{p.isActive ? 'Sim' : 'Não'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
