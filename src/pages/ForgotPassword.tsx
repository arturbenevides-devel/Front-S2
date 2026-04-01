import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiError';
import api from '@/lib/api';

const ForgotPassword = () => {
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cnpjDigits = cnpj.replace(/\D/g, '');
      await api.post('/auth/forgot-password', { cnpj: cnpjDigits, email });
      setSent(true);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Erro ao processar solicitação.');
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fp-container">
      <div className="fp-card">
        <div className="fp-header">
          <div className="fp-logo">
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
          <h1>Esqueci minha senha</h1>
          <p>
            {sent
              ? 'Verifique sua caixa de entrada.'
              : 'Informe seus dados para receber o link de redefinição.'}
          </p>
        </div>

        {sent ? (
          <div className="fp-success">
            <div className="fp-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="fp-success-text">
              Se o email estiver cadastrado, você receberá um link para redefinir sua senha. O link expira em 2 horas.
            </p>
            <Link to="/login" className="fp-button">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fp-form">
            <div className="form-group">
              <label htmlFor="fp-cnpj">CNPJ da Empresa</label>
              <input
                id="fp-cnpj"
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

            <div className="form-group">
              <label htmlFor="fp-email">E-mail</label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                maxLength={254}
              />
            </div>

            <button
              type="submit"
              className="fp-button"
              disabled={isLoading || !cnpj || !email}
            >
              {isLoading ? <span className="fp-spinner" /> : 'Enviar link de redefinição'}
            </button>
          </form>
        )}

        {!sent && (
          <div className="fp-footer">
            <Link to="/login" className="fp-link">Voltar ao login</Link>
          </div>
        )}
      </div>

      <style>{`
        .fp-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0a1a 0%, #1a1035 40%, #0d1b2a 100%);
          padding: 1rem;
        }

        .fp-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .fp-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .fp-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .fp-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .fp-header p {
          font-size: 0.9rem;
          color: #94a3b8;
          margin: 0;
        }

        .fp-form {
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

        .fp-button {
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

        .fp-button:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .fp-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fp-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: fp-spin 0.6s linear infinite;
        }

        @keyframes fp-spin {
          to { transform: rotate(360deg); }
        }

        .fp-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem 0;
        }

        .fp-success-icon {
          display: flex;
        }

        .fp-success-text {
          font-size: 0.9rem;
          color: #94a3b8;
          text-align: center;
          line-height: 1.5;
          margin: 0;
        }

        .fp-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.85rem;
        }

        .fp-link {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .fp-link:hover {
          color: #a5b4fc;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
