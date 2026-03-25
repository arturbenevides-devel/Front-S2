import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';

/** Caminhos candidatos — ajuste com VITE_AUDIT_LOGS_PATH quando o backend expuser o recurso. */
function auditPaths(): string[] {
  const custom = import.meta.env.VITE_AUDIT_LOGS_PATH?.trim();
  const base = ['/audit/logs', '/audit', '/audit-log'];
  if (custom) return [custom, ...base.filter((p) => p !== custom)];
  return base;
}

async function fetchAuditResource(): Promise<{ path: string; data: unknown } | null> {
  for (const path of auditPaths()) {
    try {
      const { data } = await api.get(path);
      return { path, data };
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 404) continue;
      throw e;
    }
  }
  return null;
}

export default function GovernancaAuditoria() {
  const query = useQuery({
    queryKey: ['audit', 'logs', import.meta.env.VITE_AUDIT_LOGS_PATH ?? ''],
    queryFn: fetchAuditResource,
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Consultando logs de auditoria…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-6 text-destructive text-sm">
        {getApiErrorMessage(query.error, 'Erro ao consultar auditoria.')}
      </div>
    );
  }

  const result = query.data;

  if (!result) {
    return (
      <div className="overflow-auto h-full p-4 md:p-6 max-w-2xl">
        <h1 className="text-lg font-semibold mb-1">Auditoria</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Nenhum endpoint de auditoria respondeu entre os caminhos conhecidos. Quando o backend publicar a rota, defina{' '}
          <code className="text-xs bg-muted px-1 rounded">VITE_AUDIT_LOGS_PATH</code> no ambiente do front (ex.:{' '}
          <code className="text-xs bg-muted px-1 rounded">audit/logs</code>) para apontar para o contrato correto.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-4 md:p-6">
      <h1 className="text-lg font-semibold mb-1">Auditoria</h1>
      <p className="text-xs text-muted-foreground mb-4">Fonte: {result.path}</p>
      <pre className="text-xs bg-muted p-4 rounded-md border border-border overflow-auto max-h-[70vh]">
        {JSON.stringify(result.data, null, 2)}
      </pre>
    </div>
  );
}
