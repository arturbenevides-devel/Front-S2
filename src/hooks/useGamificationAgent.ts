import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildGamificationAgentStats } from '@/data/gamificationData';

/** Perfil gamificado exibido na UI: nome/imagem do usuário logado; métricas ainda demonstrativas até haver API. */
export function useGamificationAgent() {
  const { user } = useAuth();
  return useMemo(() => buildGamificationAgentStats(user), [user]);
}
