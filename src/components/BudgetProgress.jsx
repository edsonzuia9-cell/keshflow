import { memo, useMemo } from 'react';
import { AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { getCategoryConfig } from './CategoryBadge';

const BudgetProgress = memo(({ budgets, transactions, month, year }) => {
  const currentMonthTrans = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [transactions, month, year]);

  const getSpent = useMemo(() => {
    const map = {};
    currentMonthTrans
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });
    return (category) => map[category] || 0;
  }, [currentMonthTrans]);

  if (!budgets || budgets.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>
          <TrendingDown size={32} style={{ color: '#cbd5e1' }} />
        </div>
        <p style={styles.emptyTitle}>Sem orçamentos definidos</p>
        <p style={styles.emptyText}>Define limites por categoria para controlar os teus gastos.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {budgets.map(budget => {
        const spent = getSpent(budget.category);
        const limit = Number(budget.limit_amount);
        const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const isOver = spent > limit;
        const isWarning = !isOver && percentage >= 80;
        const config = getCategoryConfig(budget.category);

        return (
          <div key={budget.id} style={styles.item}>
            <div style={styles.itemHeader}>
              <div style={styles.itemLeft}>
                <div style={{ ...styles.categoryDot, background: config.color }} />
                <span style={styles.categoryName}>{budget.category}</span>
                {isOver && <AlertTriangle size={14} color="#ef4444" />}
                {isWarning && <AlertTriangle size={14} color="#f59e0b" />}
                {!isOver && !isWarning && percentage >= 100 && <CheckCircle size={14} color="#10b981" />}
              </div>
              <span style={styles.amounts}>
                <span style={{ ...styles.spent, color: isOver ? '#ef4444' : '#0f172a' }}>
                  {spent.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}
                </span>
                <span style={styles.separator}> / </span>
                <span style={styles.limit}>{limit.toLocaleString('pt-PT', { minimumFractionDigits: 0 })} MT</span>
              </span>
            </div>
            <div style={styles.track}>
              <div style={{
                ...styles.fill,
                width: `${percentage}%`,
                background: isOver ? '#ef4444' : isWarning ? '#f59e0b' : config.color,
              }} />
            </div>
            <div style={styles.footer}>
              <span style={styles.percentage}>{percentage.toFixed(0)}% utilizado</span>
              <span style={{ 
                ...styles.remaining, 
                color: isOver ? '#ef4444' : '#64748b',
                fontWeight: isOver ? 700 : 500,
              }}>
                {isOver 
                  ? `⚠️ Ultrapassado em ${(spent - limit).toLocaleString('pt-PT')} MT` 
                  : `${(limit - spent).toLocaleString('pt-PT')} MT restantes`
                }
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

BudgetProgress.displayName = 'BudgetProgress';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
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
    maxWidth: '280px',
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
    gap: '10px',
  },
  categoryDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  categoryName: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#334155',
  },
  amounts: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  spent: {
    fontWeight: 700,
  },
  separator: {
    color: '#cbd5e1',
  },
  limit: {
    color: '#64748b',
  },
  track: {
    height: '8px',
    background: '#f1f5f9',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentage: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#94a3b8',
  },
  remaining: {
    fontSize: '0.8125rem',
  },
};

export default BudgetProgress;