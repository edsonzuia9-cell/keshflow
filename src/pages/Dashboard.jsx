import { useEffect, useState, useCallback, memo } from 'react';
import { supabase } from '../services/supabaseClient';
import { accountsService } from '../services/accountsService';
import { budgetsService } from '../services/budgetsService';
import { savingsGoalsService } from '../services/savingsGoalsService';
import { profilesService } from '../services/profilesService';
import TransactionList from '../components/TransactionList';
import Chart from '../components/Chart';
import BudgetProgress from '../components/BudgetProgress';
import SavingsGoals from '../components/SavingsGoals';
import { 
  Wallet, TrendingUp, TrendingDown, Calendar, ChevronDown, 
  AlertCircle, Settings, CheckCircle2, X, Pencil
} from 'lucide-react';

const months = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const years = [2025, 2026, 2027];

const MemoizedChart = memo(Chart);
const MemoizedBudgetProgress = memo(BudgetProgress);
const MemoizedSavingsGoals = memo(SavingsGoals);

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totals, setTotals] = useState({ balance: 0, income: 0, expense: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ id: null, description: '', amount: 0 });
  const [showBudgetSetup, setShowBudgetSetup] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: 'Alimentação', limit_amount: '' });

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfMonth = new Date(selectedYear, selectedMonth, 1).toISOString();
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 1).toISOString();

      const [
        { data: accountsData },
        { data: transData },
        { data: budgetsData },
        { data: goalsData },
        prof
      ] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').gte('created_at', startOfMonth).lt('created_at', endOfMonth).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('month', selectedMonth + 1).eq('year', selectedYear),
        supabase.from('savings_goals').select('*').eq('user_id', user.id),
        profilesService.getOrCreate()
      ]);

      setAccounts(accountsData || []);
      setTransactions(transData || []);
      setBudgets(budgetsData || []);
      setSavingsGoals(goalsData || []);
      setProfile(prof);

      const income = (transData || [])
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const expense = (transData || [])
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const totalBalance = (accountsData || [])
        .reduce((acc, curr) => acc + Number(curr.saldoReceita || curr.balance || 0), 0);

      setTotals({ balance: totalBalance, income, expense });

    } catch (error) {
      console.error("Erro no Dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Apagar este movimento?")) {
      await supabase.from('transactions').delete().eq('id', id);
      loadDashboardData();
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditData({ id: transaction.id, description: transaction.description, amount: transaction.amount });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEdit = async () => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ description: editData.description, amount: editData.amount })
        .eq('id', editData.id);
      if (error) throw error;
      setIsEditing(false);
      loadDashboardData();
      alert("Movimento atualizado com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar: " + err.message);
    }
  };

  const handleCreateBudget = async () => {
    try {
      await budgetsService.create({
        month: selectedMonth + 1, year: selectedYear,
        category: newBudget.category, limit_amount: parseFloat(newBudget.limit_amount)
      });
      setNewBudget({ category: 'Alimentação', limit_amount: '' });
      setShowBudgetSetup(false);
      loadDashboardData();
      alert("Orçamento definido com sucesso!");
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const handleCreateGoal = async (goal) => {
    try { await savingsGoalsService.create(goal); loadDashboardData(); }
    catch (err) { alert("Erro ao criar meta: " + err.message); }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm("Remover esta meta de poupança?")) {
      await savingsGoalsService.delete(id);
      loadDashboardData();
    }
  };

  const handleContributeGoal = async (id, amount) => {
    try { await savingsGoalsService.addToGoal(id, amount); loadDashboardData(); }
    catch (err) { alert("Erro: " + err.message); }
  };

  const getBudgetAlert = useCallback(() => {
    if (!budgets.length) return null;
    const currentMonthTrans = transactions.filter(t => t.type === 'expense');
    let overBudget = [], warning = [];
    budgets.forEach(b => {
      const spent = currentMonthTrans.filter(t => t.category === b.category).reduce((s, t) => s + Number(t.amount), 0);
      const pct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
      if (pct > 100) overBudget.push(b.category);
      else if (pct >= 80) warning.push(b.category);
    });
    if (overBudget.length) return { type: 'danger', msg: `Ultrapassaste o orçamento em: ${overBudget.join(', ')}` };
    if (warning.length) return { type: 'warning', msg: `Quase no limite em: ${warning.join(', ')}` };
    return null;
  }, [budgets, transactions]);

  const budgetAlert = getBudgetAlert();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>A carregar o teu painel...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={isMobile ? styles.headerMobile : styles.header}>
          <div style={{ flex: 1 }}>
            <h1 style={isMobile ? styles.pageTitleMobile : styles.pageTitle}>
              {profile?.nome ? `Olá, ${profile.nome.split(' ')[0]} 👋` : 'Dashboard'}
            </h1>
            <p style={styles.pageSubtitle}>
              O resumo financeiro real para estudantes do ISPT.
            </p>
          </div>
          <div style={isMobile ? styles.filtersMobile : styles.filters}>
            <div style={styles.selectWrapper}>
              <Calendar size={16} style={styles.selectIcon} />
              <select 
                style={styles.select} 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <ChevronDown size={14} style={styles.selectArrow} />
            </div>
            <div style={styles.selectWrapper}>
              <select 
                style={{...styles.select, width: '80px', paddingLeft: '12px'}} 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} style={styles.selectArrow} />
            </div>
          </div>
        </div>

        {/* Budget Alert */}
        {budgetAlert && (
          <div style={{
            ...styles.alertBanner,
            backgroundColor: budgetAlert.type === 'danger' ? '#fef2f2' : '#fffbeb',
            borderColor: budgetAlert.type === 'danger' ? '#fecaca' : '#fde68a',
            color: budgetAlert.type === 'danger' ? '#dc2626' : '#d97706',
            fontSize: isMobile ? '0.8125rem' : '0.9375rem',
          }}>
            <AlertCircle size={isMobile ? 16 : 18} />
            <span style={{ fontWeight: 600 }}>{budgetAlert.msg}</span>
          </div>
        )}

        {/* Edit Inline */}
        {isEditing && (
          <div style={styles.editCard}>
            <div style={styles.editHeader}>
              <h3 style={styles.editTitle}><Pencil size={18} /> Editar Movimento</h3>
              <button onClick={() => setIsEditing(false)} style={styles.editClose}>
                <X size={18} />
              </button>
            </div>
            <div style={isMobile ? styles.editRowMobile : styles.editRow}>
              <input 
                style={styles.editInput} 
                value={editData.description} 
                onChange={(e) => setEditData({...editData, description: e.target.value})} 
                placeholder="Descrição" 
              />
              <input 
                style={styles.editInput} 
                type="number" 
                step="0.01"
                value={editData.amount} 
                onChange={(e) => setEditData({...editData, amount: e.target.value})} 
                placeholder="Valor" 
              />
              <button style={styles.btnSave} onClick={saveEdit}>
                <CheckCircle2 size={16} /> Gravar
              </button>
              <button style={styles.btnCancel} onClick={() => setIsEditing(false)}>
                <X size={16} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div style={isMobile ? styles.statsGridMobile : styles.statsGrid}>
          <div style={{ ...styles.statCard, borderTop: '3px solid #0f172a' }}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>Saldo Total</span>
              <div style={{ ...styles.statIcon, background: '#f1f5f9', color: '#0f172a' }}>
                <Wallet size={isMobile ? 16 : 18} />
              </div>
            </div>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>
              {totals.balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span style={styles.statCurrency}>MT</span>
            </div>
            <div style={styles.statTrend}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>+{accounts.length} contas</span>
              <span style={{ color: '#94a3b8' }}> ativas</span>
            </div>
          </div>

          <div style={{ ...styles.statCard, borderTop: '3px solid #10b981' }}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>Entradas</span>
              <div style={{ ...styles.statIcon, background: '#d1fae5', color: '#059669' }}>
                <TrendingUp size={isMobile ? 16 : 18} />
              </div>
            </div>
            <div style={{ ...styles.statValue, color: '#059669', fontSize: isMobile ? '1.25rem' : '1.875rem' }}>
              +{totals.income.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span style={styles.statCurrency}>MT</span>
            </div>
            <div style={styles.statTrend}>
              <span style={{ color: '#94a3b8' }}>
                {transactions.filter(t => t.type === 'income').length} movimentos
              </span>
            </div>
          </div>

          <div style={{ ...styles.statCard, borderTop: '3px solid #ef4444' }}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>Saídas</span>
              <div style={{ ...styles.statIcon, background: '#fee2e2', color: '#dc2626' }}>
                <TrendingDown size={isMobile ? 16 : 18} />
              </div>
            </div>
            <div style={{ ...styles.statValue, color: '#dc2626', fontSize: isMobile ? '1.25rem' : '1.875rem' }}>
              -{totals.expense.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span style={styles.statCurrency}>MT</span>
            </div>
            <div style={styles.statTrend}>
              <span style={{ color: '#94a3b8' }}>
                {transactions.filter(t => t.type === 'expense').length} movimentos
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={isMobile ? styles.mainGridMobile : styles.mainGrid}>
          <div style={styles.leftColumn}>
            {/* Budget */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <Settings size={18} style={{ color: '#f59e0b' }} />
                  Orçamento do Mês
                </h3>
                <button 
                  onClick={() => setShowBudgetSetup(!showBudgetSetup)} 
                  style={styles.cardAction}
                >
                  <Settings size={14} /> {showBudgetSetup ? 'Fechar' : 'Definir'}
                </button>
              </div>

              {showBudgetSetup && (
                <div style={styles.budgetForm}>
                  <div style={isMobile ? styles.budgetRowMobile : styles.budgetRow}>
                    <select 
                      value={newBudget.category} 
                      onChange={e => setNewBudget({...newBudget, category: e.target.value})} 
                      style={styles.budgetSelect}
                    >
                      {['Alimentação','Transporte','Material Académico','Lazer','Aluguel','Propina','Saúde','Supermercado','Geral'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Limite (MT)" 
                      value={newBudget.limit_amount} 
                      onChange={e => setNewBudget({...newBudget, limit_amount: e.target.value})} 
                      style={styles.budgetInput}
                    />
                  </div>
                  <button onClick={handleCreateBudget} style={styles.budgetBtn}>
                    <CheckCircle2 size={16} /> Definir Orçamento
                  </button>
                </div>
              )}

              <MemoizedBudgetProgress budgets={budgets} transactions={transactions} month={selectedMonth} year={selectedYear} />
            </div>

            {/* Savings Goals */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <Wallet size={18} style={{ color: '#8b5cf6' }} />
                  Metas de Poupança
                </h3>
              </div>
              <MemoizedSavingsGoals 
                goals={savingsGoals} 
                accounts={accounts} 
                onCreate={handleCreateGoal} 
                onDelete={handleDeleteGoal} 
                onContribute={handleContributeGoal} 
              />
            </div>

            {/* Chart */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <TrendingUp size={18} style={{ color: '#0066ff' }} />
                  Distribuição da Bolada
                </h3>
              </div>
              <MemoizedChart income={totals.income} expense={totals.expense} />
            </div>
          </div>

          <div style={styles.rightColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Últimos Movimentos</h3>
                <span style={styles.listCount}>{transactions.length} registos</span>
              </div>
              <TransactionList 
                data={transactions.slice(0, 8)} 
                onDelete={handleDeleteTransaction} 
                onEdit={handleEditTransaction} 
              />
            </div>
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
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 64px)',
    background: '#f8fafc',
    padding: '32px 24px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  loadingContainer: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: '#f8fafc',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#0f172a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '0.9375rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },
  pageTitleMobile: {
    fontSize: '1.375rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    color: '#64748b',
    fontSize: '0.9375rem',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '10px',
  },
  filtersMobile: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  selectIcon: {
    position: 'absolute',
    left: '12px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  select: {
    appearance: 'none',
    padding: '10px 36px 10px 36px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#334155',
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  selectArrow: {
    position: 'absolute',
    right: '12px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderRadius: '12px',
    border: '1px solid',
    fontWeight: 600,
  },
  editCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 0 0 1px rgba(0, 102, 255, 0.2), 0 4px 20px rgba(0, 102, 255, 0.1)',
    border: '2px solid #0066ff',
  },
  editHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  editTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  editClose: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: '#f1f5f9',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  editRowMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  editInput: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, system-ui, sans-serif',
    flex: 1,
    minWidth: '200px',
    color: '#0f172a',
  },
  btnSave: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '15px',
    transition: 'all 0.2s ease',
  },
  btnCancel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '15px',
    transition: 'all 0.2s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  statsGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04)',
    transition: 'all 0.2s ease',
    cursor: 'default',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  statLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: '1.875rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  statValueMobile: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  statCurrency: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#94a3b8',
  },
  statTrend: {
    fontSize: '0.875rem',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    gap: '24px',
  },
  mainGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  listCount: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#94a3b8',
    padding: '4px 12px',
    background: '#f1f5f9',
    borderRadius: '999px',
  },
  budgetForm: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  budgetRow: {
    display: 'flex',
    gap: '12px',
  },
  budgetRowMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  budgetSelect: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '15px',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
    background: '#fff',
    color: '#0f172a',
  },
  budgetInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '15px',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
    color: '#0f172a',
  },
  budgetBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '15px',
    transition: 'all 0.2s ease',
  },
};

export default Dashboard;