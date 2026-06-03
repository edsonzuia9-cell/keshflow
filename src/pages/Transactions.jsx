import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import TransactionFilters from '../components/TransactionFilters';
import CategoryBadge from '../components/CategoryBadge';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, AlertCircle,
  ArrowDownRight, ArrowUpRight, X, Check, Loader2
} from 'lucide-react';

export default function Transactions() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense',
    account_id: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Buscar user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Buscar contas e transações
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Buscar contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, service_provider, balance, type, phone_number')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Buscar transações
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('id, created_at, type, amount, category, description, account_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transError) throw transError;
      setTransactions(transData || []);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Categorias predefinidas
  const categories = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
    'Lazer', 'Vestuário', 'Transferência', 'Casa', 'Salário', 'Outros'
  ];

  // Filtros
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(t =>
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.category && t.category.toLowerCase().includes(term))
      );
    }

    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }

    if (filters.type) {
      result = result.filter(t => t.type === filters.type);
    }

    if (filters.accountId) {
      result = result.filter(t => t.account_id === filters.accountId);
    }

    if (filters.period) {
      const now = new Date();
      result = result.filter(t => {
        const tDate = new Date(t.created_at);
        switch (filters.period) {
          case 'today':
            return tDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return tDate >= weekAgo;
          case 'month':
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          case 'year':
            return tDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return result;
  }, [transactions, filters]);

  // Resumo dinâmico baseado nos filtros
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return {
      income,
      expense,
      total: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Criar transação
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.account_id || !formData.amount || !formData.category) {
      setError('Preenche conta, valor e categoria.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Valor inválido');

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: formData.account_id,
          type: formData.type,
          amount: amount,
          category: formData.category,
          description: formData.description || '',
          created_at: new Date(formData.date).toISOString(),
        });

      if (insertError) throw insertError;

      // Atualizar saldo da conta
      const account = accounts.find(a => a.id === formData.account_id);
      if (account) {
        const newBalance = formData.type === 'income'
          ? (parseFloat(account.balance) || 0) + amount
          : (parseFloat(account.balance) || 0) - amount;

        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', formData.account_id);
      }

      setSuccess('Movimento registado com sucesso!');
      setFormData({
        type: 'expense',
        account_id: '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar transação
  const handleDelete = async (id) => {
    if (!confirm('Eliminar este movimento?')) return;
    try {
      const tx = transactions.find(t => t.id === id);
      if (!tx) return;

      // Reverter saldo
      const account = accounts.find(a => a.id === tx.account_id);
      if (account) {
        const newBalance = tx.type === 'income'
          ? (parseFloat(account.balance) || 0) - (parseFloat(tx.amount) || 0)
          : (parseFloat(account.balance) || 0) + (parseFloat(tx.amount) || 0);

        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', tx.account_id);
      }

      await supabase.from('transactions').delete().eq('id', id);
      fetchData();
    } catch (err) {
      setError('Erro ao eliminar: ' + err.message);
    }
  };

  // Helpers
  const getAccountName = (accountId) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc ? `${acc.name} (${acc.service_provider})` : 'Conta desconhecida';
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val || 0);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Transações</h1>
            <p style={styles.subtitle}>Regista e consulta todos os teus movimentos</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderTop: '3px solid #059669' }}>
            <div style={styles.statHeader}>
              <ArrowDownRight size={18} style={{ color: '#059669' }} />
              <span style={styles.statLabel}>Entradas</span>
            </div>
            <div style={{ ...styles.statValue, color: '#059669' }}>{formatMoney(summary.income)}</div>
          </div>
          <div style={{ ...styles.statCard, borderTop: '3px solid #dc2626' }}>
            <div style={styles.statHeader}>
              <ArrowUpRight size={18} style={{ color: '#dc2626' }} />
              <span style={styles.statLabel}>Saídas</span>
            </div>
            <div style={{ ...styles.statValue, color: '#dc2626' }}>{formatMoney(summary.expense)}</div>
          </div>
          <div style={{ ...styles.statCard, borderTop: '3px solid #0f172a' }}>
            <div style={styles.statHeader}>
              <Wallet size={18} style={{ color: '#0f172a' }} />
              <span style={styles.statLabel}>Total</span>
            </div>
            <div style={{ ...styles.statValue, color: summary.total >= 0 ? '#059669' : '#dc2626' }}>
              {formatMoney(summary.total)}
            </div>
          </div>
          <div style={{ ...styles.statCard, borderTop: '3px solid #64748b' }}>
            <div style={styles.statHeader}>
              <TrendingUp size={18} style={{ color: '#64748b' }} />
              <span style={styles.statLabel}>Movimentos</span>
            </div>
            <div style={styles.statValue}>{summary.count}</div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={styles.alertError}>
            <AlertCircle size={18} />
            {error}
            <button onClick={() => setError(null)} style={styles.alertClose}><X size={14} /></button>
          </div>
        )}
        {success && (
          <div style={styles.alertSuccess}>
            <Check size={18} />
            {success}
            <button onClick={() => setSuccess(null)} style={styles.alertClose}><X size={14} /></button>
          </div>
        )}

        {/* Filters */}
        <TransactionFilters
          accounts={accounts}
          onFilterChange={setFilters}
        />

        <div style={styles.grid}>
          {/* Formulário */}
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>
              <Plus size={18} />
              Novo Movimento
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <label style={styles.label}>Tipo</label>
                <div style={styles.typeToggle}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    style={{
                      ...styles.typeBtn,
                      ...(formData.type === 'expense' ? styles.typeBtnActiveExpense : {})
                    }}
                  >
                    <ArrowUpRight size={16} />
                    Saída
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    style={{
                      ...styles.typeBtn,
                      ...(formData.type === 'income' ? styles.typeBtnActiveIncome : {})
                    }}
                  >
                    <ArrowDownRight size={16} />
                    Entrada
                  </button>
                </div>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Conta</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  style={styles.input}
                  required
                >
                  <option value="">Seleciona uma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.service_provider}) — {formatMoney(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.input}
                  required
                >
                  <option value="">Seleciona</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Valor (MZN)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={styles.input}
                  placeholder="0.00"
                  required
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={styles.input}
                  placeholder="Ex: Compra no mercado"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" disabled={saving} style={styles.submitBtn}>
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={18} />}
                {saving ? 'A guardar...' : 'Registar Movimento'}
              </button>
            </form>
          </div>

          {/* Histórico */}
          <div style={styles.listCard}>
            <h2 style={styles.cardTitle}>
              <TrendingUp size={18} />
              Histórico de Movimentos
              <span style={styles.badgeCount}>{filteredTransactions.length}</span>
            </h2>

            {loading ? (
              <div style={styles.emptyState}>
                <Loader2 size={32} style={{ color: '#94a3b8', animation: 'spin 1s linear infinite' }} />
                <p style={styles.emptyText}>A carregar...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div style={styles.emptyState}>
                <Wallet size={32} style={{ color: '#cbd5e1' }} />
                <p style={styles.emptyText}>Nenhum movimento encontrado</p>
                <p style={styles.emptySub}>Cria o primeiro movimento ou ajusta os filtros</p>
              </div>
            ) : (
              <div style={styles.transactionList}>
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} style={styles.transactionItem}>
                    <div style={styles.txLeft}>
                      <div style={{
                        ...styles.txIcon,
                        background: tx.type === 'income' ? '#ecfdf5' : '#fef2f2',
                        color: tx.type === 'income' ? '#059669' : '#dc2626',
                      }}>
                        {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div style={styles.txInfo}>
                        <div style={styles.txTop}>
                          <span style={styles.txDesc}>{tx.description || tx.category}</span>
                          <CategoryBadge category={tx.category} />
                        </div>
                        <div style={styles.txMeta}>
                          {getAccountName(tx.account_id)} • {formatDate(tx.created_at)}
                        </div>
                      </div>
                    </div>
                    <div style={styles.txRight}>
                      <span style={{
                        ...styles.txAmount,
                        color: tx.type === 'income' ? '#059669' : '#dc2626',
                      }}>
                        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        style={styles.deleteBtn}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '24px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '14px 18px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 500,
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#059669',
    padding: '14px 18px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 500,
  },
  alertClose: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '24px',
  },
  formCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)',
    height: 'fit-content',
  },
  listCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 20px 0',
    letterSpacing: '-0.01em',
  },
  badgeCount: {
    marginLeft: 'auto',
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    height: '44px',
    padding: '0 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  typeToggle: {
    display: 'flex',
    gap: '8px',
  },
  typeBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '44px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 0.2s',
  },
  typeBtnActiveExpense: {
    background: '#fef2f2',
    borderColor: '#fecaca',
    color: '#dc2626',
  },
  typeBtnActiveIncome: {
    background: '#ecfdf5',
    borderColor: '#a7f3d0',
    color: '#059669',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '48px',
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
    boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
    marginTop: '8px',
    transition: 'transform 0.1s',
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  transactionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: '12px',
    background: '#f8fafc',
    transition: 'background 0.2s',
  },
  txLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  txIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  txTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  txDesc: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
  },
  txMeta: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  txRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  txAmount: {
    fontSize: '15px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
    gap: '12px',
  },
  emptyText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#64748b',
    margin: 0,
  },
  emptySub: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },
};

// Responsive
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 900px) {
      div[style*="gridTemplateColumns: 380px 1fr"] {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}
