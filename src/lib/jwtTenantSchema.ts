/**
 * CNPJ do tenant no JWT: claim `tenantSchema` (14 dígitos), igual ao payload do login no back-S2.
 * O servidor não espera header de tenant para isso; usa o JWT + TenantSchemaInterceptor (ALS).
 */

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Lê `tenantSchema` do access token (mesmo nome do payload JWT no back-S2). */
export function getTenantSchemaFromAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const payload = parseJwtPayload(token);
  const raw = payload?.tenantSchema;
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length === 14 ? digits : null;
}

/** Lê `role` do access token (OWNER, TENANT_ADMIN, USER). */
export function getRoleFromAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const payload = parseJwtPayload(token);
  const role = payload?.role;
  return typeof role === 'string' ? role : null;
}
