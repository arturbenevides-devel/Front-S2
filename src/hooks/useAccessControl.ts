import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { AuthorizedMenuDto } from '@/types/api';

function isDefaultUser(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.profileIsDefault === true) return true;
  if (user.profile?.isDefault === true) return true;
  return false;
}

export function useAccessControl() {
  const { user, token, isAuthenticated } = useAuth();
  const isDefaultProfile = isDefaultUser(user);

  const query = useQuery({
    queryKey: ['authorizedMenus', 'DESKTOP', user?.id],
    queryFn: async () => {
      const { data } = await api.get<AuthorizedMenuDto[]>('/menu/authorized/DESKTOP');
      return data;
    },
    enabled: !!token && !!user && isAuthenticated,
    staleTime: 60_000,
  });

  const menuActions = useMemo(() => {
    const set = new Set<string>();
    for (const m of query.data ?? []) {
      if (m.action) set.add(m.action);
    }
    return set;
  }, [query.data]);

  const hasMenuAction = (action: string) => menuActions.has(action);

  const menusReady = query.isFetched || query.isError;

  /** Listagem/edição de usuários (alinhado ao menu /users do backend). */
  const canManageUsers = isDefaultProfile || (menusReady && hasMenuAction('/users'));

  /** Perfis de acesso (menu /profiles). */
  const canManageProfiles = isDefaultProfile || (menusReady && hasMenuAction('/profiles'));

  /** Painel Admin do CRM (integrações Green API etc.): apenas administrador do tenant. */
  const canAccessCrmAdmin = isDefaultProfile;

  /** Supervisão operacional do CRM: apenas administrador do tenant. */
  const canAccessCrmSupervision = isDefaultProfile;

  const showUsersNav =
    isDefaultProfile || query.isLoading || hasMenuAction('/users');
  const showProfilesNav =
    isDefaultProfile || query.isLoading || hasMenuAction('/profiles');

  return {
    authorizedMenus: query.data ?? [],
    isLoadingMenus: query.isLoading,
    menusReady,
    isDefaultProfile,
    hasMenuAction,
    canManageUsers,
    canManageProfiles,
    showUsersNav,
    showProfilesNav,
    canAccessCrmAdmin,
    canAccessCrmSupervision,
    refetchMenus: query.refetch,
  };
}
