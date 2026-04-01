import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { formatCnpjDisplay } from '@/lib/formatCnpj';
import type { CompanyDto } from '@/types/api';

/** Dados da empresa do tenant (nome + CNPJ exibidos na UI). */
export function useTenantCompany() {
  const { user, tenantCnpj, token, isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ['companies', 'tenant', user?.id, tenantCnpj],
    queryFn: async () => {
      const { data } = await api.get<CompanyDto[]>('/companies');
      return data;
    },
    enabled: !!token && isAuthenticated,
    staleTime: 120_000,
  });

  const company = useMemo(() => {
    const list = query.data;
    if (!list?.length) return null;
    if (user?.companyId) {
      const byId = list.find((c) => c.id === user.companyId);
      if (byId) return byId;
    }
    if (tenantCnpj) {
      const formatted = formatCnpjDisplay(tenantCnpj);
      const digits = tenantCnpj.replace(/\D/g, '');
      return (
        list.find((c) => c.federalRegistration.replace(/\D/g, '') === digits) ??
        list.find((c) => c.federalRegistration === formatted) ??
        list[0]
      );
    }
    return list[0];
  }, [query.data, user?.companyId, tenantCnpj]);

  return {
    company,
    companies: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
