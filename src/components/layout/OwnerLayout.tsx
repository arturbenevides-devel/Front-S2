import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function OwnerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen min-h-0 bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-card px-3 py-2 md:px-4 flex items-center gap-4 justify-between">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold truncate text-sm md:text-base">
            Painel do Owner
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.fullName ?? '—'} · {user?.email ?? '—'}
          </span>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => logout()}>
          Sair
        </Button>
      </header>
      <main className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
