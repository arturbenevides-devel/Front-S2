import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiError';
import api from '@/lib/api';
import { isPasswordValid } from '@/lib/passwordValidation';
import { PasswordHints } from '@/components/ui/password-hints';
import { maskCpf, isValidCpf } from '@/lib/cpfValidation';

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

const W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function isValidCnpj(cnpj14: string): boolean {
  if (!/^\d{14}$/.test(cnpj14)) return false;
  if (/^(\d)\1{13}$/.test(cnpj14)) return false;
  const n = cnpj14.split('').map((c) => parseInt(c, 10));
  let s = 0;
  for (let i = 0; i < 12; i++) s += n[i] * W1[i];
  const d1 = (s % 11) < 2 ? 0 : 11 - (s % 11);
  if (d1 !== n[12]) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += n[i] * W2[i];
  const d2 = (s % 11) < 2 ? 0 : 11 - (s % 11);
  return d2 === n[13];
}

function stripNumbers(value: string): string {
  return value.replace(/[0-9]/g, '');
}

const Register = () => {
  const [cnpj, setCnpj] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const cnpjDigits = cnpj.replace(/\D/g, '');
  const cnpjComplete = cnpjDigits.length === 14;
  const cnpjValid = cnpjComplete && isValidCnpj(cnpjDigits);

  const cpfDigits = cpf.replace(/\D/g, '');
  const cpfComplete = cpfDigits.length === 11;
  const cpfValid = cpfComplete && isValidCpf(cpfDigits);

  const passwordsMatch = password === confirmPassword;

  const isFormValid =
    cnpjValid &&
    companyName.trim().length >= 2 &&
    fullName.trim().length >= 2 &&
    cpfValid &&
    email.includes('@') &&
    isPasswordValid(password) &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/register-tenant', {
        cnpj: cnpj.replace(/\D/g, ''),
        companyName: companyName.trim(),
        fullName: fullName.trim(),
        cpf: cpf.replace(/\D/g, ''),
        email: email.trim(),
        password,
      });

      toast({
        title: 'Cadastro realizado!',
        description: 'Verifique seu e-mail para ativar a conta e acessar o sistema.',
      });

      navigate('/login');
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Erro ao cadastrar. Tente novamente.');
      toast({
        title: 'Erro no cadastro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="url(#reg-logo-grad)" />
              <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="reg-logo-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Criar conta</h1>
          <p>Cadastre sua empresa para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="reg-cnpj">CNPJ da Empresa</label>
            <input
              id="reg-cnpj"
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              required
              autoFocus
            />
            {cnpjComplete && !cnpjValid && (
              <span className="field-error">CNPJ inválido</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-company">Nome da Empresa</label>
            <input
              id="reg-company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Razão social"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-name">Nome completo do Administrador</label>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(stripNumbers(e.target.value))}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-cpf">CPF do Administrador</label>
            <input
              id="reg-cpf"
              type="text"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              required
            />
            {cpfComplete && !cpfValid && (
              <span className="field-error">CPF inválido</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">E-mail do Administrador</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@suaempresa.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Senha</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 caracteres"
              minLength={8}
              required
              autoComplete="new-password"
            />
            <PasswordHints password={password} />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm-password">Confirmar Senha</label>
            <input
              id="reg-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              minLength={8}
              required
              autoComplete="new-password"
            />
            {confirmPassword && !passwordsMatch && (
              <span className="field-error">As senhas não coincidem</span>
            )}
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <span className="register-spinner" />
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>

        <div className="register-footer">
          <span>Já tem uma conta?</span>
          <Link to="/login" className="register-link">Entrar</Link>
        </div>
      </div>

      <style>{`
        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0a1a 0%, #1a1035 40%, #0d1b2a 100%);
          padding: 1rem;
        }

        .register-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .register-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .register-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .register-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .register-header p {
          font-size: 0.9rem;
          color: #94a3b8;
          margin: 0;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .register-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .register-form .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #cbd5e1;
        }

        .register-form .form-group input {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .register-form .form-group input::placeholder {
          color: #475569;
        }

        .register-form .form-group input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .field-error {
          font-size: 0.8rem;
          color: #f87171;
        }

        .register-button {
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

        .register-button:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .register-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .register-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .register-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: reg-spin 0.6s linear infinite;
        }

        @keyframes reg-spin {
          to { transform: rotate(360deg); }
        }

        .register-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.85rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .register-link {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .register-link:hover {
          color: #a5b4fc;
        }
      `}</style>
    </div>
  );
};

export default Register;
