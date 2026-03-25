import { useTenantCompany } from '@/hooks/useTenantCompany';
import { useAuth } from '@/contexts/AuthContext';
import { formatCnpjDisplay } from '@/lib/formatCnpj';
import { getApiErrorMessage } from '@/lib/apiError';

export default function GovernancaEmpresa() {
  const { tenantCnpj } = useAuth();
  const { company, companies, isLoading, error } = useTenantCompany();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando dados da empresa…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive text-sm">
        {getApiErrorMessage(error, 'Não foi possível carregar as empresas do tenant.')}
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-4 md:p-6 max-w-2xl">
      <h1 className="text-lg font-semibold mb-1">Empresa (tenant)</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Configuração persistida no schema da empresa. O backend restringe dados ao tenant do JWT (CNPJ do login).
      </p>
      {company ? (
        <dl className="rounded-md border border-border p-4 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Razão social</dt>
            <dd className="font-medium">{company.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">CNPJ</dt>
            <dd>{company.federalRegistration}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">CNPJ do login (sessão)</dt>
            <dd>{tenantCnpj ? formatCnpjDisplay(tenantCnpj) : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{company.isActive ? 'Ativa' : 'Inativa'}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-muted-foreground text-sm">Nenhuma empresa encontrada para este tenant.</p>
      )}
      {companies && companies.length > 1 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Este tenant possui {companies.length} cadastros de empresa; exibindo a vinculada ao seu usuário ou ao CNPJ da
          sessão.
        </p>
      ) : null}
    </div>
  );
}
