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

  const usersMenu = useMemo(
    () => (query.data ?? []).find((m) => m.action === '/users'),
    [query.data],
  );
  const usersPerms = usersMenu?.permissions;

  const canManageUsers =
    isDefaultProfile || (menusReady && Boolean(usersPerms?.canFindAll ?? hasMenuAction('/users')));

  const canCreateUsers = isDefaultProfile || (menusReady && Boolean(usersPerms?.canCreate));

  const canUpdateUsers = isDefaultProfile || (menusReady && Boolean(usersPerms?.canUpdate));

  const canChangeUserStatus =
    isDefaultProfile ||
    (menusReady && Boolean(usersPerms?.canUpdate || usersPerms?.canCreate));

  const canDeleteUsers = isDefaultProfile || (menusReady && Boolean(usersPerms?.canDelete));

  const canManageProfiles = isDefaultProfile || (menusReady && hasMenuAction('/profiles'));

  const teamsMenu = useMemo(
    () => (query.data ?? []).find((m) => m.action === '/teams'),
    [query.data],
  );
  const teamsPerms = teamsMenu?.permissions;

  const canManageTeams =
    isDefaultProfile || (menusReady && Boolean(teamsPerms?.canFindAll ?? hasMenuAction('/teams')));
  const canCreateTeams = isDefaultProfile || (menusReady && Boolean(teamsPerms?.canCreate));
  const canUpdateTeams = isDefaultProfile || (menusReady && Boolean(teamsPerms?.canUpdate));
  const canDeleteTeams = isDefaultProfile || (menusReady && Boolean(teamsPerms?.canDelete));

  const showTeamsNav = isDefaultProfile || query.isLoading || hasMenuAction('/teams');

  const canAccessCrmAdmin = isDefaultProfile || (menusReady && Boolean(teamsPerms?.canCreate || usersPerms?.canCreate));

  const canAccessCrmSupervision = isDefaultProfile || (menusReady && Boolean(teamsPerms?.canFindAll));

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
    canCreateUsers,
    canUpdateUsers,
    canChangeUserStatus,
    canDeleteUsers,
    canManageProfiles,
    showUsersNav,
    showProfilesNav,
    canManageTeams,
    canCreateTeams,
    canUpdateTeams,
    canDeleteTeams,
    showTeamsNav,
    canAccessCrmAdmin,
    canAccessCrmSupervision,
    refetchMenus: query.refetch,
  };
}
