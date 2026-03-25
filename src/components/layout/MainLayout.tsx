import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantCompany } from '@/hooks/useTenantCompany';
import { useAccessControl } from '@/hooks/useAccessControl';
import { formatCnpjDisplay } from '@/lib/formatCnpj';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { user, tenantCnpj, logout } = useAuth();
  const { company, isLoading: companyLoading } = useTenantCompany();
  const { showUsersNav, showProfilesNav } = useAccessControl();
  const location = useLocation();

  const items = [
    { to: '/', label: 'CRM', end: true, show: true },
    { to: '/governanca/usuarios', label: 'Usuários', end: false, show: showUsersNav },
    { to: '/governanca/perfis', label: 'Perfis', end: false, show: showProfilesNav },
    { to: '/governanca/empresa', label: 'Empresa', end: false, show: true },
    { to: '/governanca/auditoria', label: 'Auditoria', end: false, show: true },
  ];

  return (
    <div className="flex flex-col h-screen min-h-0 bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-card px-3 py-2 md:px-4 flex flex-wrap items-center gap-2 md:gap-4 justify-between">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold truncate text-sm md:text-base">
            {companyLoading && !company ? 'Carregando…' : company?.name ?? 'Empresa'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {tenantCnpj ? formatCnpjDisplay(tenantCnpj) : '—'}
            {user ? (
              <>
                {' · '}
                {user.fullName}
                {' · '}
                {user.profileName ?? user.profile?.name ?? '—'}
              </>
            ) : null}
          </span>
        </div>
        <nav className="flex flex-wrap gap-1 order-3 md:order-none w-full md:w-auto justify-start md:justify-end">
          {items
            .filter((i) => i.show)
            .map((item) => {
              const active = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <Button
                  key={item.to}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('text-xs md:text-sm')}
                  asChild
                >
                  <Link to={item.to}>{item.label}</Link>
                </Button>
              );
            })}
        </nav>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => logout()}>
          Sair
        </Button>
      </header>
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
