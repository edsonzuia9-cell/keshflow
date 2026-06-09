import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { accountsService } from '../services/accountsService';
import TransferModal from '../components/TransferModal';
import { 
  Smartphone, Landmark, Banknote, PiggyBank, Star, Archive, ArchiveRestore,
  Pencil, Check, X, AlertTriangle, ArrowRightLeft, ChevronDown, ChevronUp,
  Trash2, Plus, Wallet, TrendingUp, TrendingDown, Eye, EyeOff
} from 'lucide-react';

const ACCOUNT_TYPES = {
  'mpesa': { label: 'M-Pesa (Vodacom)', icon: Smartphone, color: '#e74c3c', bg: '#fef2f2', prefix: ['84','85'] },
  'emola': { label: 'e-Mola (Movitel)', icon: Smartphone, color: '#eab308', bg: '#fefce8', prefix: ['86','87'] },
  'mkesh': { label: 'm-Kesh (Tmcel)', icon: Smartphone, color: '#f59e0b', bg: '#fffbeb', prefix: ['82','83'] },
  'bim': { label: 'Millennium BIM', icon: Landmark, color: '#1e3a5f', bg: '#eff6ff', prefix: [] },
  'bci': { label: 'BCI', icon: Landmark, color: '#065f46', bg: '#ecfdf5', prefix: [] },
  'moza': { label: 'MOZA BANCO', icon: Landmark, color: '#0055a4', bg: '#eff6ff', prefix: [] },
  'cash': { label: 'Dinheiro Físico', icon: Banknote, color: '#16a34a', bg: '#f0fdf4', prefix: [] },
  'savings': { label: 'Poupança', icon: PiggyBank, color: '#7c3aed', bg: '#f5f3ff', prefix: [] }
};

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('mpesa');
  const [alertThreshold, setAlertThreshold] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [expandedId, setExpandedId] = useState(null);
  const [accountHistory, setAccountHistory] = useState({});

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAccount, setTransferAccount] = useState(null);

  const [showBalances, setShowBalances] = useState({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const prefix = phone.substring(0, 2);
    for (const [key, config] of Object.entries(ACCOUNT_TYPES)) {
      if (config.prefix.includes(prefix)) {
        setType(key);
        return;
      }
    }
  }, [phone]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const active = await accountsService.getAll(false);
    const archived = await accountsService.getAll(true);
    setAccounts(active.filter(a => !a.archived));
    setArchivedAccounts(archived.filter(a => a.archived));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await accountsService.create({
        name,
        phone_number: phone,
        balance: parseFloat(balance) || 0,
        type,
        alert_threshold: parseFloat(alertThreshold) || 0,
        service_provider: ACCOUNT_TYPES[type]?.label || type
      });
      alert('Conta criada com sucesso! ✅');
      setPhone(''); setName(''); setBalance(''); setType('mpesa'); setAlertThreshold('');
      loadAccounts();
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Desejas remover permanentemente esta conta?')) {
      await accountsService.delete(id);
      loadAccounts();
    }
  };

  const handleArchive = async (id, archive) => {
    await accountsService.archive(id, archive);
    loadAccounts();
  };

  const handleSetDefault = async (id) => {
    await accountsService.setDefault(id);
    loadAccounts();
  };

  const startEdit = (acc) => {
    setEditingId(acc.id);
    setEditForm({ ...acc });
  };

  const saveEdit = async () => {
    try {
      await accountsService.update(editingId, {
        name: editForm.name,
        phone_number: editForm.phone_number,
        type: editForm.type,
        alert_threshold: editForm.alert_threshold,
        service_provider: ACCOUNT_TYPES[editForm.type]?.label || editForm.type
      });
      setEditingId(null);
      loadAccounts();
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  const toggleHistory = async (accId) => {
    if (expandedId === accId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(accId);
    const history = await accountsService.getTransactions(accId, 5);
    setAccountHistory(prev => ({ ...prev, [accId]: history }));
  };

  const openTransfer = (acc) => {
    setTransferAccount(acc);
    setShowTransfer(true);
  };

  const toggleBalance = (id) => {
    setShowBalances(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTypeConfig = (t) => ACCOUNT_TYPES[t] || ACCOUNT_TYPES['mpesa'];

  const renderAccountCard = (acc, isArchived = false) => {
    const config = getTypeConfig(acc.type);
    const Icon = config.icon;
    const isLowBalance = acc.alert_threshold > 0 && Number(acc.balance) <= Number(acc.alert_threshold);
    const isDefault = acc.is_default;
    const isExpanded = expandedId === acc.id;
    const history = accountHistory[acc.id] || [];
    const show = showBalances[acc.id] !== false;

    return (
      <div key={acc.id} style={{...styles.card, opacity: isArchived ? 0.7 : 1}}>
        {/* Header */}
        <div style={isMobile ? styles.cardHeaderMobile : styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{...styles.iconCircle, backgroundColor: config.bg, color: config.color}}>
              <Icon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              {editingId === acc.id ? (
                <input 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  style={{...styles.editInput, fontWeight: '700', fontSize: '1rem'}}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1rem', wordBreak: 'break-word' }}>{acc.name}</span>
                  {isDefault && <Star size={14} fill="#f59e0b" color="#f59e0b" />}
                </div>
              )}
              <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
                {config.label} {acc.phone_number && `• ${acc.phone_number}`}
              </div>
            </div>
          </div>

          <div style={isMobile ? styles.actionsMobile : styles.actions}>
            {!isArchived && (
              <>
                <button onClick={() => openTransfer(acc)} style={styles.actionBtn} title="Transferir">
                  <span style={{ fontSize: "16px" }}>↔</span>
                </button>
                <button onClick={() => startEdit(acc)} style={styles.actionBtn} title="Editar">
                  <span style={{ fontSize: "16px" }}>✏️</span>
                </button>
                <button onClick={() => handleSetDefault(acc.id)} style={styles.actionBtn} title="Definir padrão">
                  <span style={{ fontSize: "16px", filter: isDefault ? "none" : "grayscale(100%)", opacity: isDefault ? 1 : 0.5 }}>⭐</span>
                </button>
                <button onClick={() => handleArchive(acc.id, true)} style={styles.actionBtn} title="Arquivar">
                  <span style={{ fontSize: "16px" }}>🗄️</span>
                </button>
              </>
            )}
            {isArchived && (
              <button onClick={() => handleArchive(acc.id, false)} style={styles.actionBtn} title="Restaurar">
                <span style={{ fontSize: "16px" }}>📂</span>
              </button>
            )}
            <button onClick={() => handleDelete(acc.id)} style={{...styles.actionBtn, color: '#ef4444'}} title="Apagar">
              <span style={{ fontSize: "16px" }}>🗑️</span>
            </button>
          </div>
        </div>

        {/* Alerta saldo baixo */}
        {isLowBalance && (
          <div style={styles.lowBalanceAlert}>
            <AlertTriangle size={14} strokeWidth={2} />
            <span>Saldo baixo! ({Number(acc.balance).toLocaleString()} MT)</span>
          </div>
        )}

        {/* Saldo */}
        <div style={isMobile ? styles.balanceRowMobile : styles.balanceRow}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '6px' }}>Saldo Atual</div>
            <div style={{ fontSize: isMobile ? '1.375rem' : '1.75rem', fontWeight: 800, color: isLowBalance ? '#ef4444' : '#0f172a', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {show ? `${Number(acc.balance).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT` : '•••••• MT'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => toggleBalance(acc.id)} style={styles.expandBtn} title={show ? 'Ocultar saldo' : 'Mostrar saldo'}>
              {show ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
            </button>
            <button onClick={() => toggleHistory(acc.id)} style={styles.expandBtn}>
              {isExpanded ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{isExpanded ? 'Fechar' : 'Movimentos'}</span>
            </button>
          </div>
        </div>

        {/* Mini histórico */}
        {isExpanded && (
          <div style={styles.historyBox}>
            {history.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '16px' }}>Sem movimentos nesta conta.</p>
            ) : (
              history.map(t => (
                <div key={t.id} style={styles.historyItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {t.type === 'income' ? <TrendingUp size={16} color="#10b981" strokeWidth={2} /> : <TrendingDown size={16} color="#ef4444" strokeWidth={2} />}
                    <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>{t.description}</span>
                  </div>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 700, 
                    color: t.type === 'income' ? '#059669' : '#dc2626',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {t.type === 'income' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Edit mode actions */}
        {editingId === acc.id && (
          <div style={isMobile ? styles.editRowMobile : styles.editRow}>
            <div style={{ flex: 1 }}>
              <label style={{...styles.label, fontSize: '0.75rem', marginBottom: '4px', display: 'block'}}>Tipo</label>
              <select 
                value={editForm.type} 
                onChange={e => setEditForm({...editForm, type: e.target.value})}
                style={{...styles.select, fontSize: '0.875rem', padding: '8px 12px'}}
              >
                {Object.entries(ACCOUNT_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{...styles.label, fontSize: '0.75rem', marginBottom: '4px', display: 'block'}}>Alerta (MT)</label>
              <input 
                type="number" 
                value={editForm.alert_threshold || ''} 
                onChange={e => setEditForm({...editForm, alert_threshold: e.target.value})}
                style={{...styles.input, fontSize: '0.875rem', padding: '8px 12px'}}
                placeholder="0"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button onClick={saveEdit} style={{...styles.editActionBtn, background: '#0f172a', color: '#fff'}}><Check size={16} strokeWidth={2} /></button>
              <button onClick={() => setEditingId(null)} style={{...styles.editActionBtn, background: '#f1f5f9', color: '#64748b'}}><X size={16} strokeWidth={2} /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={isMobile ? styles.pageTitleMobile : styles.pageTitle}>Minhas Contas</h1>
            <p style={styles.pageSubtitle}>Gerencia todos os teus instrumentos financeiros num só lugar.</p>
          </div>
        </div>

        <div style={isMobile ? styles.mainGridMobile : styles.mainGrid}>
          {/* Formulário */}
          <section style={styles.formSection}>
            <h2 style={styles.formTitle}>
              <Wallet size={20} strokeWidth={2} /> Nova Carteira
            </h2>
            <form onSubmit={handleCreate} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Tipo de Conta</label>
                <div style={isMobile ? styles.typeGridMobile : styles.typeGrid}>
                  {Object.entries(ACCOUNT_TYPES).map(([key, config]) => {
                    const TypeIcon = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        style={{
                          ...styles.typeBtn,
                          borderColor: type === key ? config.color : '#e2e8f0',
                          backgroundColor: type === key ? config.bg : '#fff',
                          color: type === key ? config.color : '#475569'
                        }}
                      >
                        <TypeIcon size={18} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  {type === 'cash' ? 'Referência/Local' : type === 'savings' ? 'Nome da Poupança' : 'Número de Telefone'}
                </label>
                <input 
                  type="text" 
                  maxLength={type === 'cash' || type === 'savings' ? '50' : '9'}
                  placeholder={
                    type === 'cash' ? 'Ex: Carteira, Mealheiro...' : 
                    type === 'savings' ? 'Ex: Fundo de Emergência' : 
                    ACCOUNT_TYPES[type]?.prefix.length ? '84xxxxxxx' : 'N/A'
                  }
                  value={phone} 
                  onChange={e => setPhone(e.target.value.replace(type === 'cash' || type === 'savings' ? /[^a-zA-Z0-9 ]/g : /[^0-9]/g, ''))} 
                  style={styles.input}
                />
                {ACCOUNT_TYPES[type]?.label && phone.length >= 2 && type !== 'cash' && type !== 'savings' && (
                  <span style={styles.detectedBadge}>{ACCOUNT_TYPES[type].label}</span>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nome da Conta</label>
                <input 
                  type="text" 
                  placeholder={type === 'cash' ? 'Ex: Dinheiro da Bolada' : 'Ex: M-Pesa Principal'} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  style={styles.input}
                  required
                />
              </div>

              <div style={isMobile ? styles.fieldRowMobile : styles.fieldRow}>
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Saldo Inicial (MT)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={balance} 
                    onChange={e => setBalance(e.target.value)} 
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Alerta Saldo Baixo (MT)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Ex: 500" 
                    value={alertThreshold} 
                    onChange={e => setAlertThreshold(e.target.value)} 
                    style={styles.input}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? 'A processar...' : <><Plus size={16} strokeWidth={2} /> Adicionar Conta</>}
              </button>
            </form>
          </section>

          {/* Lista de Contas */}
          <section style={styles.listSection}>
            <div style={isMobile ? styles.listHeaderMobile : styles.listHeader}>
              <h3 style={styles.subTitle}>Minhas Contas</h3>
              <div style={styles.tabSwitcher}>
                <button 
                  onClick={() => setActiveTab('active')}
                  style={{...styles.tabBtn, background: activeTab === 'active' ? '#0f172a' : 'transparent', color: activeTab === 'active' ? '#fff' : '#64748b'}}
                >
                  Ativas <span style={{...styles.tabBadge, background: activeTab === 'active' ? 'rgba(255,255,255,0.2)' : '#f1f5f9'}}>{accounts.length}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('archived')}
                  style={{...styles.tabBtn, background: activeTab === 'archived' ? '#64748b' : 'transparent', color: activeTab === 'archived' ? '#fff' : '#64748b'}}
                >
                  Arquivadas <span style={{...styles.tabBadge, background: activeTab === 'archived' ? 'rgba(255,255,255,0.2)' : '#f1f5f9'}}>{archivedAccounts.length}</span>
                </button>
              </div>
            </div>

            <div style={styles.grid}>
              {activeTab === 'active' && accounts.map(acc => renderAccountCard(acc, false))}
              {activeTab === 'archived' && archivedAccounts.map(acc => renderAccountCard(acc, true))}
            </div>

            {activeTab === 'active' && accounts.length === 0 && (
              <div style={styles.emptyState}>
                <Wallet size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} strokeWidth={2} />
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#475569', margin: 0 }}>Nenhuma conta ativa.</p>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Adiciona a tua primeira carteira digital ou conta bancária.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <TransferModal 
        isOpen={showTransfer} 
        onClose={() => setShowTransfer(false)} 
        accounts={accounts}
        selectedAccount={transferAccount}
        onSuccess={loadAccounts}
      />
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 64px)',
    background: '#f8fafc',
    padding: '24px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '24px',
  },
  mainGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
  },
  formSection: {
    background: '#fff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)',
    height: 'fit-content',
  },
  formTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  fieldRowMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  fieldHalf: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, system-ui, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
    color: '#0f172a',
  },
  select: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, system-ui, sans-serif',
    background: '#fff',
    width: '100%',
    cursor: 'pointer',
    color: '#0f172a',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  typeGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
  typeBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 8px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#fff',
  },
  detectedBadge: {
    fontSize: '0.75rem',
    color: '#0066ff',
    fontWeight: 600,
    marginTop: '4px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#0f172a',
    color: '#fff',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '15px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
    marginTop: '8px',
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  listHeaderMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  subTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  tabSwitcher: {
    display: 'flex',
    gap: '4px',
    background: '#f1f5f9',
    padding: '4px',
    borderRadius: '12px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
  },
  tabBadge: {
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    background: '#fff',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04)',
    transition: 'all 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  cardHeaderMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  iconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  actionsMobile: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    width: '100%',
  },
  actionBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  lowBalanceAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '16px',
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceRowMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'flex-start',
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
  },
  historyBox: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: '#f8fafc',
    borderRadius: '10px',
  },
  editInput: {
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1.5px solid #0066ff',
    outline: 'none',
    width: '100%',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#0f172a',
  },
  editRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  editRowMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  editActionBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
};

export default Accounts;