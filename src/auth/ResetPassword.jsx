import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Wallet, Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Verificar se há sessão ativa (o Supabase cria após clicar no link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Link inválido ou expirado. Solicita um novo.');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <Wallet size={28} strokeWidth={2.5} />
          </div>
          <h1 style={styles.logoText}>KeshFlow</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Nova Senha</h2>
            <p style={styles.cardSubtitle}>
              {success 
                ? 'Senha alterada com sucesso! Redirecionando...' 
                : 'Define a tua nova senha de acesso.'}
            </p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {success ? (
            <div style={styles.successBox}>
              <CheckCircle size={20} />
              <span>Senha redefinida! Podes fazer login agora.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nova Senha</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Confirmar Nova Senha</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
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
                    A guardar...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </button>
            </form>
          )}
        </div>
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
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px',
    color: '#16a34a',
    fontSize: '0.9375rem',
    fontWeight: 600,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
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
    padding: '12px 42px 12px 42px',
    fontSize: '15px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#ffffff',
    color: '#0f172a',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
  },
};

export default ResetPassword;