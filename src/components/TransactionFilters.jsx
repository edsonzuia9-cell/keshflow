import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Wallet, Tag, ArrowDownUp } from 'lucide-react';

export default function TransactionFilters({ accounts, onFilterChange, initialFilters = {} }) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [type, setType] = useState(initialFilters.type || '');
  const [period, setPeriod] = useState(initialFilters.period || '');
  const [accountId, setAccountId] = useState(initialFilters.accountId || '');

  const categories = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
    'Lazer', 'Vestuário', 'Transferência', 'Transferência Interna',
    'Casa', 'Salário', 'Outros'
  ];

  const periods = [
    { value: '', label: 'Todos os períodos' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mês' },
    { value: 'year', label: 'Este ano' }
  ];

  const types = [
    { value: '', label: 'Todos os tipos' },
    { value: 'income', label: 'Entradas' },
    { value: 'expense', label: 'Saídas' }
  ];

  // ✅ CORREÇÃO: useEffect sincroniza filtros quando estado muda
  useEffect(() => {
    const filters = {
      search: search.trim(),
      category,
      type,
      period,
      accountId
    };
    onFilterChange(filters);
  }, [search, category, type, period, accountId, onFilterChange]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setType('');
    setPeriod('');
    setAccountId('');
  };

  const hasActiveFilters = search || category || type || period || accountId;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Pesquisar movimentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={styles.clearBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} style={styles.clearAllBtn}>
            <Filter size={14} />
            Limpar filtros
          </button>
        )}
      </div>

      <div style={styles.filtersRow}>
        <div style={styles.filterGroup}>
          <ArrowDownUp size={14} style={styles.filterIcon} />
          <select value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
            {types.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <Tag size={14} style={styles.filterIcon} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
            <option value="">Todas as categorias</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <Wallet size={14} style={styles.filterIcon} />
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={styles.select}>
            <option value="">Todas as contas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.service_provider})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <Calendar size={14} style={styles.filterIcon} />
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={styles.select}>
            {periods.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 0 0 1px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0 14px',
    height: '44px',
    transition: 'all 0.2s',
  },
  searchIcon: {
    color: '#94a3b8',
    marginRight: '10px',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  clearAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#ffffff',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
    whiteSpace: 'nowrap',
  },
  filtersRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0 12px',
    height: '40px',
    flex: '1 1 200px',
    minWidth: '180px',
  },
  filterIcon: {
    color: '#94a3b8',
    flexShrink: 0,
  },
  select: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
    appearance: 'none',
    paddingRight: '8px',
  },
};
