import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import type { ValidateResetTokenResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { isPasswordValid } from '@/lib/passwordValidation';
import { PasswordHints } from '@/components/ui/password-hints';

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

  const validateErrorMessage = validateQuery.isError
    ? getApiErrorMessage(validateQuery.error, 'Token inválido ou expirado.')
    : null;

  const showPasswordStep = validateQuery.isSuccess && validateQuery.data;

  if (!token) {
    return (
      <div className="activate-container">
        <div className="activate-card">
          <div className="activate-header">
            <div className="activate-logo">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="12" fill="url(#act-logo-grad)" />
                <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="act-logo-grad" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1>Link inválido</h1>
            <p>Falta o token de convite na URL.</p>
          </div>
          <Link to="/login" className="activate-button" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Ir para o login
          </Link>
        </div>
        <style>{activateStyles}</style>
      </div>
    );
  }

  return (
    <div className="activate-container">
      <div className="activate-card">
        <div className="activate-header">
          <div className="activate-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="url(#act-logo-grad)" />
              <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="act-logo-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>{showPasswordStep ? 'Definir senha' : 'Ativar conta'}</h1>
          <p>
            {showPasswordStep
              ? validateQuery.data!.firstAccess
                ? 'Sua conta será ativada ao salvar a senha.'
                : 'Defina uma nova senha para sua conta.'
              : 'Informe o CNPJ da empresa para validar o convite recebido por e-mail.'}
          </p>
        </div>

        {!showPasswordStep ? (
          <div className="activate-form">
            <div className="form-group">
              <label htmlFor="act-cnpj">CNPJ da Empresa</label>
              <input
                id="act-cnpj"
                type="text"
                value={cnpjMasked}
                onChange={(e) => setCnpjMasked(maskCnpjInput(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                autoFocus
              />
            </div>

            {validateQuery.isFetching && (
              <div className="activate-status">
                <span className="activate-spinner" />
                Validando convite…
              </div>
            )}

            {validateQuery.isError && validateErrorMessage && (
              <span className="field-error">{validateErrorMessage}</span>
            )}

            {cnpjDigits.length === 14 && !validateQuery.isFetching && validateQuery.isError && (
              <p className="activate-hint">
                Verifique o CNPJ ou solicite um novo convite ao administrador.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitPassword} className="activate-form">
            <div className="form-group">
              <label>E-mail</label>
              <input
                type="email"
                value={validateQuery.data!.email}
                readOnly
                className="input-readonly"
              />
            </div>

            <div className="form-group">
              <label htmlFor="act-pw">Nova senha</label>
              <input
                id="act-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
                autoFocus
              />
              <PasswordHints password={password} />
            </div>

            <button
              type="submit"
              className="activate-button"
              disabled={activateMutation.isPending || !isPasswordValid(password)}
            >
              {activateMutation.isPending ? (
                <span className="activate-spinner" />
              ) : validateQuery.data!.firstAccess ? (
                'Ativar conta e salvar senha'
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>
        )}

        <div className="activate-footer">
          <Link to="/login" className="activate-link">Voltar ao login</Link>
        </div>
      </div>

      <style>{activateStyles}</style>
    </div>
  );
}

const activateStyles = `
  .activate-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f0a1a 0%, #1a1035 40%, #0d1b2a 100%);
    padding: 1rem;
  }

  .activate-card {
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  }

  .activate-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .activate-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .activate-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .activate-header p {
    font-size: 0.9rem;
    color: #94a3b8;
    margin: 0;
  }

  .activate-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .activate-form .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .activate-form .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  .activate-form .form-group input {
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #f1f5f9;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .activate-form .form-group input::placeholder {
    color: #475569;
  }

  .activate-form .form-group input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .activate-form .form-group input.input-readonly {
    opacity: 0.6;
    cursor: default;
  }

  .activate-form .form-group input.input-readonly:focus {
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }

  .field-error {
    font-size: 0.8rem;
    color: #f87171;
  }

  .activate-hint {
    font-size: 0.8rem;
    color: #64748b;
  }

  .activate-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .activate-button {
    margin-top: 0.5rem;
    padding: 0.85rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
  }

  .activate-button:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  .activate-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .activate-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .activate-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: act-spin 0.6s linear infinite;
  }

  @keyframes act-spin {
    to { transform: rotate(360deg); }
  }

  .activate-footer {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.85rem;
  }

  .activate-link {
    color: #818cf8;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .activate-link:hover {
    color: #a5b4fc;
  }
`;
