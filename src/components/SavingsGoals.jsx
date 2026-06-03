import { memo, useMemo } from 'react';
import { Target, Plus, TrendingUp } from 'lucide-react';

const SavingsGoals = memo(({ goals, transactions }) => {
  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const saved = transactions
        .filter(t => t.savings_goal_id === goal.id && t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0);
      const target = Number(goal.target_amount);
      const percentage = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
      return { ...goal, saved, target, percentage };
    });
  }, [goals, transactions]);

  if (!goalsWithProgress || goalsWithProgress.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>
          <Target size={28} style={{ color: '#cbd5e1' }} />
        </div>
        <p style={styles.emptyTitle}>Sem metas de poupança</p>
        <p style={styles.emptyText}>Cria a tua primeira meta para começar a poupar com propósito.</p>
        <button style={styles.emptyBtn}>
          <Plus size={16} /> Nova Meta
        </button>
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
            <div style={styles.percentageBadge}>
              <TrendingUp size={12} />
              {goal.percentage.toFixed(0)}%
            </div>
          </div>
          <div style={styles.track}>
            <div style={{
              ...styles.fill,
              width: `${goal.percentage}%`,
            }} />
          </div>
        </div>
      ))}
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
  track: {
    height: '6px',
    background: '#f1f5f9',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
    borderRadius: '999px',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export default SavingsGoals;