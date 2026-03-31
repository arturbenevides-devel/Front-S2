import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiError';

const Login = () => {
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, ownerLogin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isOwnerMode) {
        await ownerLogin(email, password);
        navigate('/owner');
      } else {
        const cnpjDigits = cnpj.replace(/\D/g, '');
        await login(cnpjDigits, email, password);
        navigate('/');
      }
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Email ou senha incorretos.');
      toast({
        title: 'Erro ao entrar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
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
          <h1>{isOwnerMode ? 'Acesso administrativo' : 'Bem-vindo'}</h1>
          <p>{isOwnerMode ? 'Entre com suas credenciais de administrador do sistema' : 'Entre com suas credenciais para acessar o sistema'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isOwnerMode && (
            <div className="form-group">
              <label htmlFor="cnpj">CNPJ da Empresa</label>
              <input
                id="cnpj"
                type="text"
                value={cnpj}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
                  const masked = digits
                    .replace(/(\d{2})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1/$2')
                    .replace(/(\d{4})(\d)/, '$1-$2');
                  setCnpj(masked);
                }}
                placeholder="00.000.000/0000-00"
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              maxLength={254}
              autoComplete="email"
              autoFocus={isOwnerMode}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="input-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || (!isOwnerMode && !cnpj) || !email || !password}
          >
            {isLoading ? (
              <span className="login-spinner" />
            ) : (
              'Entrar'
            )}
          </button>

        </form>

        <div className="login-footer">
          {!isOwnerMode ? (
            <>
              <span>Ainda não tem conta?</span>
              <Link to="/register" className="login-link">Criar conta</Link>
            </>
          ) : (
            <button
              type="button"
              className="login-link"
              onClick={() => setIsOwnerMode(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            >
              Voltar ao login padrão
            </button>
          )}
        </div>

        {!isOwnerMode && (
          <div className="login-forgot">
            <Link to="/forgot-password" className="login-link">Esqueci minha senha</Link>
          </div>
        )}

        <div className="login-admin-toggle">
          {!isOwnerMode && (
            <button
              type="button"
              className="login-admin-btn"
              onClick={() => setIsOwnerMode(true)}
            >
              Acesso administrativo
            </button>
          )}
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0a1a 0%, #1a1035 40%, #0d1b2a 100%);
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .login-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .login-header p {
          font-size: 0.9rem;
          color: #94a3b8;
          margin: 0;
        }

        .login-form {
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

        .login-button {
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

        .login-button:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.85rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .login-link {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .login-link:hover {
          color: #a5b4fc;
        }

        .login-forgot {
          text-align: center;
          margin-top: 0.75rem;
          font-size: 0.85rem;
        }

        .login-admin-toggle {
          margin-top: 0.75rem;
          text-align: center;
        }

        .login-admin-btn {
          background: none;
          border: none;
          color: #475569;
          font-size: 0.75rem;
          cursor: pointer;
          transition: color 0.2s;
          font-family: inherit;
        }

        .login-admin-btn:hover {
          color: #94a3b8;
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
      `}</style>
    </div>
  );
};

export default Login;
