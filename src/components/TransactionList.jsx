import CategoryBadge from './CategoryBadge';
import { Pencil, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TransactionList = ({ data, onDelete, onEdit, compact = false }) => {
  if (!data || data.length === 0) return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>
        <ArrowDownRight size={28} style={{ color: '#cbd5e1' }} />
      </div>
      <p style={styles.emptyTitle}>Nenhum movimento registado</p>
      <p style={styles.emptyText}>Adiciona a tua primeira transação para começar.</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {data.map((t) => (
        <div key={t.id} style={styles.item}>
          <div style={styles.left}>
            <div style={{
              ...styles.iconBox,
              background: t.type === 'income' ? '#d1fae5' : '#fee2e2',
              color: t.type === 'income' ? '#059669' : '#dc2626',
            }}>
              {t.type === 'income' 
                ? <ArrowDownRight size={18} /> 
                : <ArrowUpRight size={18} />
              }
            </div>
            <div style={styles.info}>
              <div style={styles.infoTop}>
                <span style={styles.description}>{t.description}</span>
                {!compact && <CategoryBadge category={t.category || 'Geral'} size="sm" />}
              </div>
              <div style={styles.meta}>
                <span>{new Date(t.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</span>
                <span style={styles.metaDot}>•</span>
                <span>{t.type === 'income' ? 'Entrada' : 'Saída'}</span>
                {t.account_name && (
                  <>
                    <span style={styles.metaDot}>•</span>
                    <span>{t.account_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={styles.right}>
            <span style={{
              ...styles.amount,
              color: t.type === 'income' ? '#059669' : '#dc2626',
            }}>
              {t.type === 'income' ? '+' : '-'}{' '}
              {Number(t.amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
            </span>
            {!compact && (
              <div style={styles.actions}>
                <button onClick={() => onEdit(t)} style={styles.actionBtn} title="Editar">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(t.id)} style={{ ...styles.actionBtn, color: '#ef4444' }} title="Remover">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s ease',
    gap: '12px',
  },
  itemHover: {
    background: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  infoTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  description: {
    fontWeight: 600,
    color: '#0f172a',
    fontSize: '0.9375rem',
  },
  meta: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  metaDot: {
    color: '#cbd5e1',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  amount: {
    fontWeight: 700,
    fontSize: '0.9375rem',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    gap: '4px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default TransactionList;