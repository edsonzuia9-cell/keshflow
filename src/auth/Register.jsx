import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Wallet, ArrowRight, Loader2, Mail, Lock, User } from 'lucide-react';

const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // 1. Criar utilizador no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome: nome }
        }
      });

      if (error) throw error;

      // 2. Criar perfil na tabela profiles (colunas: user_id, full_name, monthly_budget_global)
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              user_id: data.user.id, 
              full_name: nome,
              monthly_budget_global: 0
            }
          ]);

        if (profileError) {
          console.warn('Erro ao criar perfil:', profileError.message);
        }
      }

      setSuccess('Conta criada com sucesso! Podes fazer login agora.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message === 'User already registered'
        ? 'Este e-mail já está registado.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container} className="animate-fade-in">
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <Wallet size={28} strokeWidth={2.5} />
          </div>
          <h1 style={styles.logoText}>KeshFlow</h1>
          <p style={styles.tagline}>Cria a tua conta e começa a gerir a tua bolada.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Criar Conta</h2>
            <p style={styles.cardSubtitle}>Preenche os dados abaixo para te registares.</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ ...styles.errorBox, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span style={{ ...styles.errorText, color: '#16a34a' }}>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nome Completo</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Edson Zuia"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>E-mail</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Senha</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirmar Senha</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  A criar conta...
                </>
              ) : (
                <>
                  Criar Conta <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>ou</span>
            <span style={styles.dividerLine} />
          </div>

          <Link to="/login" style={styles.registerLink}>
            <button type="button" style={styles.registerBtn}>
              Já tenho conta — Entrar
            </button>
          </Link>
        </div>

        <p style={styles.footer}>
          © 2026 KeshFlow. Para estudantes do ISPT.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.25)',
  },
  logoText: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  tagline: {
    fontSize: '0.9375rem',
    color: '#64748b',
    margin: 0,
    fontWeight: 400,
  },
  card: {
    width: '100%',
    background: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.06), 0 20px 40px -10px rgba(15, 23, 42, 0.08)',
  },
  cardHeader: {
    marginBottom: '28px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  cardSubtitle: {
    fontSize: '0.9375rem',
    color: '#64748b',
    margin: 0,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '0.875rem',
    color: '#dc2626',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    fontSize: '15px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#ffffff',
    color: '#0f172a',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: '#0f172a',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '4px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '8px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e2e8f0',
  },
  dividerText: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: 500,
  },
  registerLink: {
    width: '100%',
    textDecoration: 'none',
  },
  registerBtn: {
    width: '100%',
    padding: '14px',
    background: 'transparent',
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: 600,
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  footer: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    margin: 0,
  },
};

export default Register;