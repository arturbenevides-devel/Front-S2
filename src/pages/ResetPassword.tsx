import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiError';
import { isPasswordValid } from '@/lib/passwordValidation';
import api from '@/lib/api';
import type { ValidateResetTokenResponse } from '@/types/api';

const PASSWORD_RULES = [
  { label: 'Pelo menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Uma letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Um número', test: (p: string) => /\d/.test(p) },
  { label: 'Um caractere especial', test: (p: string) => /[^a-zA-Z\d\s]/.test(p) },
];

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const initialCnpj = searchParams.get('cnpj')?.replace(/\D/g, '').slice(0, 14) ?? '';

  const [cnpjDigits] = useState(initialCnpj);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const passwordOk = isPasswordValid(password);
  const passwordsMatch = password === passwordConfirmation;
  const canSubmit = passwordOk && passwordsMatch;

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

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>('/auth/change-password', {
        cnpj: cnpjDigits,
        resetToken: token!,
        auth: {
          email: validateQuery.data!.email,
          password,
        },
      });
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Senha redefinida com sucesso!' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao redefinir senha',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) resetMutation.mutate();
  };

  const isError = validateQuery.isError || (!validateQuery.isLoading && !validateQuery.data);
  const errorMessage = validateQuery.error
    ? getApiErrorMessage(validateQuery.error, '')
    : '';
  const isExpired = errorMessage.toLowerCase().includes('expirou');
  const isUsed = errorMessage.toLowerCase().includes('utilizado');

  return (
    <div className="rp-container">
      <div className="rp-card">
        <div className="rp-header">
          <div className="rp-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="url(#logo-grad)" />
              <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>
            {isError && isUsed
              ? 'Link já utilizado'
              : isError && isExpired
              ? 'Link expirado'
              : isError
              ? 'Link inválido'
              : resetMutation.isSuccess
              ? 'Senha redefinida'
              : 'Redefinir senha'}
          </h1>
          <p>
            {isError && isUsed
              ? 'Este link de redefinição já foi utilizado.'
              : isError && isExpired
              ? 'O link de redefinição de senha expirou.'
              : isError
              ? 'Não foi possível validar este link.'
              : resetMutation.isSuccess
              ? 'Sua senha foi alterada com sucesso.'
              : 'Crie uma nova senha para acessar sua conta.'}
          </p>
        </div>

        {validateQuery.isLoading ? (
          <div className="rp-status">
            <span className="rp-spinner" />
            Validando link…
          </div>
        ) : isError ? (
          <div className="rp-expired">
            {isUsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            )}
            <p className="rp-expired-text">
              {isUsed
                ? 'Este link já foi utilizado para redefinir a senha. Cada link pode ser usado apenas uma vez. Solicite um novo link abaixo caso precise.'
                : isExpired
                ? 'O link de redefinição expirou. Por segurança, os links são válidos por apenas 2 horas. Solicite um novo link abaixo.'
                : 'Este link não é válido. O endereço pode estar incorreto.'}
            </p>
            <Link to="/forgot-password" className="rp-button">Solicitar novo link</Link>
            <Link to="/login" className="rp-link" style={{ marginTop: '0.75rem', display: 'block', textAlign: 'center' }}>Voltar ao login</Link>
          </div>
        ) : resetMutation.isSuccess ? (
          <div className="rp-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <Link to="/login" className="rp-button">Ir para o login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rp-form">
            <div className="form-group">
              <label>E-mail</label>
              <input type="email" value={validateQuery.data!.email} readOnly className="input-readonly" />
            </div>

            <div className="form-group">
              <label htmlFor="rp-password">Nova senha</label>
              <div className="input-password-wrapper">
                <input
                  id="rp-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crie sua nova senha"
                  autoFocus
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="rp-confirm">Confirmar nova senha</label>
              <div className="input-password-wrapper">
                <input
                  id="rp-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repita a senha"
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((v) => !v)} tabIndex={-1}>
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {passwordConfirmation.length > 0 && !passwordsMatch && (
                <span className="field-error">Senhas não conferem</span>
              )}
            </div>

            {password.length > 0 && (
              <ul className="password-hints">
                {PASSWORD_RULES.map((rule) => (
                  <li key={rule.label} className={rule.test(password) ? 'hint-ok' : 'hint-fail'}>
                    {rule.test(password) ? '\u2713' : '\u2717'} {rule.label}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              className="rp-button"
              disabled={!canSubmit || resetMutation.isPending}
            >
              {resetMutation.isPending ? <span className="rp-spinner" /> : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>

      <style>{rpStyles}</style>
    </div>
  );
};

export default ResetPassword;

const rpStyles = `
  .rp-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f0a1a 0%, #1a1035 40%, #0d1b2a 100%);
    padding: 1rem;
  }

  .rp-card {
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  }

  .rp-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .rp-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .rp-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .rp-header p {
    font-size: 0.9rem;
    color: #94a3b8;
    margin: 0;
  }

  .rp-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  .form-group input {
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #f1f5f9;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input::placeholder {
    color: #475569;
  }

  .form-group input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .form-group input.input-readonly {
    opacity: 0.6;
    cursor: default;
  }

  .form-group input.input-readonly:focus {
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }

  .field-error {
    font-size: 0.8rem;
    color: #f87171;
  }

  .input-password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-password-wrapper input {
    width: 100%;
    padding-right: 2.75rem;
  }

  .password-toggle {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    color: #818cf8;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .password-toggle:hover {
    opacity: 1;
  }

  .password-hints {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
  }

  .password-hints .hint-ok {
    color: #4ade80;
  }

  .password-hints .hint-fail {
    color: #94a3b8;
  }

  .rp-button {
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
    text-decoration: none;
  }

  .rp-button:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  .rp-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .rp-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: rp-spin 0.6s linear infinite;
  }

  @keyframes rp-spin {
    to { transform: rotate(360deg); }
  }

  .rp-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
    padding: 2rem 0;
  }

  .rp-expired {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
  }

  .rp-expired-text {
    font-size: 0.9rem;
    color: #94a3b8;
    text-align: center;
    line-height: 1.5;
    margin: 0;
  }

  .rp-link {
    color: #818cf8;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.85rem;
    transition: color 0.2s;
  }

  .rp-link:hover {
    color: #a5b4fc;
  }

  .rp-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 1rem 0;
  }
`;
