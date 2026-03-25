import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AccessDenied({ title = 'Esta área' }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Acesso restrito</h1>
      <p className="text-muted-foreground max-w-md">
        {title} exige permissão de perfil. Se você precisa deste acesso, solicite ao administrador da empresa.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao CRM</Link>
      </Button>
    </div>
  );
}
