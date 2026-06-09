import { memo, useMemo, useState } from 'react';
import { Target, Plus, TrendingUp, Trash2, X, Check, Wallet } from 'lucide-react';

const SavingsGoals = memo(({ goals, accounts, onCreate, onDelete, onContribute }) => {
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', deadline: '' });
  const [contributeForm, setContributeForm] = useState({ goalId: null, amount: '', accountId: '' });

  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const saved = Number(goal.current_amount || 0);
      const target = Number(goal.target_amount || 0);
      const percentage = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
      return { ...goal, saved, target, percentage };
    });
  }, [goals]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_amount) return;
    onCreate({
      name: newGoal.name,
      target_amount: parseFloat(newGoal.target_amount),
      deadline: newGoal.deadline || null,
      current_amount: 0
    });
    setNewGoal({ name: '', target_amount: '', deadline: '' });
    setShowForm(false);
  };

  const handleContribute = (e) => {
    e.preventDefault();
    if (!contributeForm.amount || !contributeForm.accountId) return;
    onContribute(contributeForm.goalId, parseFloat(contributeForm.amount));
    setContributeForm({ goalId: null, amount: '', accountId: '' });
  };

  if (!goalsWithProgress || goalsWithProgress.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>
          <Target size={28} style={{ color: '#cbd5e1' }} />
        </div>
        <p style={styles.emptyTitle}>Sem metas de poupança</p>
        <p style={styles.emptyText}>Cria a tua primeira meta para começar a poupar com propósito.</p>
        
        {showForm ? (
          <form onSubmit={handleCreate} style={styles.form}>
            <input
              type="text"
              placeholder="Nome da meta (ex: Novo Laptop)"
              value={newGoal.name}
              onChange={e => setNewGoal({...newGoal, name: e.target.value})}
              style={styles.formInput}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor alvo (MT)"
              value={newGoal.target_amount}
              onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})}
              style={styles.formInput}
              required
            />
            <input
              type="date"
              placeholder="Prazo (opcional)"
              value={newGoal.deadline}
              onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
              style={styles.formInput}
            />
            <div style={styles.formActions}>
              <button type="submit" style={styles.btnPrimary}>
                <Check size={16} /> Criar Meta
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={styles.btnGhost}>
                <X size={16} /> Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)} style={styles.emptyBtn}>
            <Plus size={16} /> Nova Meta
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {goalsWithProgress.map(goal => (
        <div key={goal.id} style={styles.item}>
          <div style={styles.itemHeader}>
            <div style={styles.itemLeft}>
              <div style={styles.goalIcon}>
                <Target size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <div style={styles.goalName}>{goal.name}</div>
                <div style={styles.goalMeta}>
                  {goal.saved.toLocaleString('pt-PT')} / {goal.target.toLocaleString('pt-PT')} MT
                </div>
              </div>
            </div>
            <div style={styles.itemRight}>
              <div style={styles.percentageBadge}>
                <TrendingUp size={12} />
                {goal.percentage.toFixed(0)}%
              </div>
              <button onClick={() => onDelete(goal.id)} style={styles.deleteBtn} title="Apagar">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          <div style={styles.track}>
            <div style={{
              ...styles.fill,
              width: `${goal.percentage}%`,
            }} />
          </div>

          {/* Contribuir */}
          {contributeForm.goalId === goal.id ? (
            <form onSubmit={handleContribute} style={styles.contributeForm}>
              <select
                value={contributeForm.accountId}
                onChange={e => setContributeForm({...contributeForm, accountId: e.target.value})}
                style={styles.formSelect}
                required
              >
                <option value="">Seleciona conta</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance} MT)</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Valor (MT)"
                value={contributeForm.amount}
                onChange={e => setContributeForm({...contributeForm, amount: e.target.value})}
                style={styles.formInput}
                required
              />
              <div style={styles.formActions}>
                <button type="submit" style={styles.btnPrimarySmall}>
                  <Wallet size={14} /> Contribuir
                </button>
                <button type="button" onClick={() => setContributeForm({ goalId: null, amount: '', accountId: '' })} style={styles.btnGhostSmall}>
                  <X size={14} />
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setContributeForm({ goalId: goal.id, amount: '', accountId: '' })} style={styles.contributeBtn}>
              <Plus size={14} /> Contribuir
            </button>
          )}
        </div>
      ))}

      {/* Adicionar nova meta */}
      {showForm ? (
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            type="text"
            placeholder="Nome da meta"
            value={newGoal.name}
            onChange={e => setNewGoal({...newGoal, name: e.target.value})}
            style={styles.formInput}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor alvo (MT)"
            value={newGoal.target_amount}
            onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})}
            style={styles.formInput}
            required
          />
          <input
            type="date"
            placeholder="Prazo"
            value={newGoal.deadline}
            onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
            style={styles.formInput}
          />
          <div style={styles.formActions}>
            <button type="submit" style={styles.btnPrimary}>
              <Check size={16} /> Criar
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={styles.btnGhost}>
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} style={styles.addBtn}>
          <Plus size={16} /> Adicionar Meta
        </button>
      )}
    </div>
  );
});

SavingsGoals.displayName = 'SavingsGoals';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#475569',
    margin: 0,
  },
  emptyText: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
    maxWidth: '260px',
  },
  emptyBtn: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  goalIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#ede9fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#0f172a',
  },
  goalMeta: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    marginTop: '2px',
  },
  percentageBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: '#f1f5f9',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#8b5cf6',
  },
  deleteBtn: {
    width: '28px',
    height: '28px',
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
  track: {
    height: '6px',
    background: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
    borderRadius: '999px',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  contributeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#fff',
    color: '#8b5cf6',
    border: '1.5px solid #ddd6fe',
    borderRadius: '10px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
  },
  contributeForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginTop: '8px',
  },
  formInput: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#0f172a',
    width: '100%',
  },
  formSelect: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#0f172a',
    background: '#fff',
    cursor: 'pointer',
    width: '100%',
  },
  formActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnPrimarySmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnGhost: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnGhostSmall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: '#f1f5f9',
    color: '#64748b',
    border: '1.5px dashed #cbd5e1',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px',
  },
};

export default SavingsGoals;
