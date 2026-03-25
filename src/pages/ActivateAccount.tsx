import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import type { ValidateResetTokenResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function maskCnpjInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function ActivateAccount() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const initialFromUrl = searchParams.get('cnpj')?.replace(/\D/g, '').slice(0, 14) ?? '';
  const [cnpjMasked, setCnpjMasked] = useState(() =>
    initialFromUrl ? maskCnpjInput(initialFromUrl) : '',
  );

  const cnpjDigits = useMemo(() => cnpjMasked.replace(/\D/g, ''), [cnpjMasked]);

  const validateQuery = useQuery({
    queryKey: ['auth', 'validate-reset-token', token, cnpjDigits],
    queryFn: async () => {
      const { data } = await api.post<ValidateResetTokenResponse>(
        `/auth/validate-reset-token/${encodeURIComponent(token!)}`,
        {},
        { params: { cnpj: cnpjDigits } },
      );
      return data;
    },
    enabled: Boolean(token && cnpjDigits.length === 14),
    retry: false,
  });

  const [password, setPassword] = useState('');

  const activateMutation = useMutation({
    mutationFn: async (payload: {
      cnpj: string;
      resetToken: string;
      auth: { email: string; password: string };
      firstAccess: boolean;
    }) => {
      const path = payload.firstAccess ? '/auth/first-access' : '/auth/change-password';
      const { data } = await api.post<{ message: string }>(path, {
        cnpj: payload.cnpj,
        resetToken: payload.resetToken,
        auth: payload.auth,
      });
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: data.message ?? 'Concluído',
        description: 'Você já pode entrar com seu e-mail e a nova senha.',
      });
      window.location.assign('/login');
    },
    onError: (err: unknown) => {
      toast({
        title: 'Não foi possível concluir',
        description: getApiErrorMessage(err, 'Tente novamente.'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !validateQuery.data) return;
    const trimmed = password.trim();
    if (!trimmed) {
      toast({
        title: 'Senha obrigatória',
        description: 'Informe sua senha para concluir a ativação.',
        variant: 'destructive',
      });
      return;
    }
    if (trimmed.length < 6) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    activateMutation.mutate({
      cnpj: cnpjDigits,
      resetToken: token,
      auth: { email: validateQuery.data.email, password: trimmed },
      firstAccess: validateQuery.data.firstAccess,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Falta o token de convite na URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validateErrorMessage = validateQuery.isError
    ? getApiErrorMessage(validateQuery.error, 'Token inválido ou expirado.')
    : null;

  const showPasswordStep = validateQuery.isSuccess && validateQuery.data;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>{showPasswordStep ? 'Definir senha' : 'Ativar conta'}</CardTitle>
          <CardDescription>
            {showPasswordStep
              ? validateQuery.data!.firstAccess
                ? 'Sua conta será ativada ao salvar a senha.'
                : 'Defina uma nova senha para sua conta.'
              : 'Informe o CNPJ da empresa (14 dígitos) para validar o convite recebido por e-mail.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordStep ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="act-cnpj">CNPJ da empresa</Label>
                <Input
                  id="act-cnpj"
                  value={cnpjMasked}
                  onChange={(e) => setCnpjMasked(maskCnpjInput(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  autoComplete="organization"
                  inputMode="numeric"
                />
              </div>
              {validateQuery.isFetching ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando convite…
                </div>
              ) : null}
              {validateQuery.isError && validateErrorMessage ? (
                <p className="text-sm text-destructive">{validateErrorMessage}</p>
              ) : null}
              {cnpjDigits.length === 14 && !validateQuery.isFetching && validateQuery.isError ? (
                <p className="text-xs text-muted-foreground">
                  Verifique o CNPJ ou solicite um novo convite ao administrador.
                </p>
              ) : null}
            </>
          ) : (
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={validateQuery.data!.email} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="act-pw">
                  Confirmar senha <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="act-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  aria-required
                />
                <p className="text-xs text-muted-foreground">Obrigatória, mínimo de 6 caracteres.</p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={activateMutation.isPending || password.trim().length < 6}
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando…
                  </>
                ) : validateQuery.data!.firstAccess ? (
                  'Ativar conta e salvar senha'
                ) : (
                  'Salvar nova senha'
                )}
              </Button>
            </form>
          )}

          <div className="pt-2 border-t border-border">
            <Button asChild variant="link" className="px-0 h-auto text-muted-foreground">
              <Link to="/login">Voltar ao login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
