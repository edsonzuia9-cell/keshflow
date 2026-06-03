import { useState, useEffect } from 'react';
import { transfersService } from '../services/transfersService';
import { X, ArrowRightLeft, Search, User, AlertTriangle, Loader2, Wallet } from 'lucide-react';

const TransferModal = ({ isOpen, onClose, accounts, userAccounts, onTransferComplete, onSuccess, selectedAccount }) => {
  const accountsList = userAccounts || accounts || [];
  const handleSuccess = onSuccess || onTransferComplete;

  const [mode, setMode] = useState('internal');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [selectedReceiverAccountId, setSelectedReceiverAccountId] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🔥 CORREÇÃO: Sempre respeitar selectedAccount quando modal abre
  useEffect(() => {
    if (!isOpen) return; // Só executa quando modal está aberto
    
    if (accountsList?.length > 0) {
      if (selectedAccount?.id) {
        console.log('✅ Conta selecionada pelo clique:', selectedAccount.name, selectedAccount.id);
        setFromAccount(selectedAccount.id);
      } else {
        setFromAccount(accountsList[0].id);
      }
      // Limpar estado anterior
      setToAccount('');
      setSelectedReceiver(null);
      setSelectedReceiverAccountId(null);
      setAmount('');
      setDescription('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, accountsList, selectedAccount]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    setSearchResults([]);
    setSelectedReceiver(null);
    setSelectedReceiverAccountId(null);

    try {
      const results = await transfersService.searchUsers(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setError('Nenhum estudante encontrado.');
      }
    } catch (err) {
      setError('Erro ao buscar estudantes.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectReceiver = (user) => {
    setSelectedReceiver(user);
    setSelectedReceiverAccountId(user.account_id);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Insere um valor válido e positivo');
      return;
    }

    // 🔥 VALIDAÇÃO: Não permitir transferir de conta com saldo negativo
    const fromAcc = accountsList.find(a => a.id === fromAccount);
    if (fromAcc && Number(fromAcc.balance) < 0) {
      setError(`❌ A conta "${fromAcc.name}" tem saldo negativo (${fromAcc.balance} MT). Não podes transferir DE uma conta sem saldo. Seleciona outra conta como origem.`);
      return;
    }

    if (fromAcc && Number(fromAcc.balance) < numAmount) {
      setError(`❌ Saldo insuficiente em "${fromAcc.name}". Tens ${fromAcc.balance} MT, precisas de ${numAmount} MT.`);
      return;
    }

    try {
      setLoading(true);

      if (mode === 'internal') {
        if (!toAccount) {
          setError('Seleciona a conta de destino');
          setLoading(false);
          return;
        }
        
        const result = await transfersService.transferInternal(fromAccount, toAccount, numAmount, description);
        setSuccess('Transferência interna realizada!');
      } else {
        if (!selectedReceiver || !selectedReceiverAccountId) {
          setError('Seleciona um estudante');
          setLoading(false);
          return;
        }
        
        const result = await transfersService.transferP2P(fromAccount, selectedReceiverAccountId, numAmount, description);
        setSuccess(`Transferência de ${numAmount} MT enviada!`);
      }

      setTimeout(() => {
        handleSuccess?.();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Erro na transferência');
    } finally {
      setLoading(false);
    }
  };

  const otherAccounts = accountsList?.filter(a => a.id !== fromAccount) || [];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRightLeft size={20} /> Transferência
          </h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        <div style={styles.toggleContainer}>
          <button onClick={() => { setMode('internal'); setError(''); setSelectedReceiver(null); }} style={mode === 'internal' ? styles.toggleActive : styles.toggleInactive}>
            <Wallet size={14} /> Entre Minhas Contas
          </button>
          <button onClick={() => { setMode('p2p'); setError(''); setToAccount(''); }} style={mode === 'p2p' ? styles.toggleActive : styles.toggleInactive}>
            <User size={14} /> Para Outro Estudante
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Conta de Origem (onde o dinheiro SAI)</label>
            <select value={fromAccount} onChange={(e) => { setFromAccount(e.target.value); setToAccount(''); }} style={styles.select}>
              {accountsList?.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — {Number(acc.balance).toFixed(2)} MT {Number(acc.balance) < 0 ? '⚠️ NEGATIVO' : ''}
                </option>
              ))}
            </select>
            {fromAccount && Number(accountsList.find(a => a.id === fromAccount)?.balance) < 0 && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                ⚠️ Esta conta tem saldo negativo! Não podes transferir DE aqui.
              </p>
            )}
          </div>

          {mode === 'internal' && (
            <div style={styles.field}>
              <label style={styles.label}>Conta de Destino (onde o dinheiro ENTRA)</label>
              <select value={toAccount} onChange={(e) => setToAccount(e.target.value)} style={styles.select}>
                <option value="">Seleciona uma conta</option>
                {otherAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {Number(acc.balance).toFixed(2)} MT
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'p2p' && (
            <div style={styles.field}>
              <label style={styles.label}>Procurar Estudante</label>
              {!selectedReceiver ? (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Nome ou telefone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())} style={{ ...styles.input, flex: 1 }} />
                    <button type="button" onClick={handleSearch} disabled={searching} style={styles.searchBtn}>
                      {searching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div style={styles.resultsList}>
                      {searchResults.map((user, idx) => (
                        <div key={idx} onClick={() => handleSelectReceiver(user)} style={styles.resultItem}>
                          <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.phone_number}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.selectedUser}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{selectedReceiver.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{selectedReceiver.phone_number}</div>
                  </div>
                  <button type="button" onClick={() => { setSelectedReceiver(null); setSelectedReceiverAccountId(null); }} style={styles.changeBtn}>Alterar</button>
                </div>
              )}
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Valor (MT)</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 23.88" required style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descrição (opcional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Pagamento" style={styles.input} />
          </div>

          {error && <div style={styles.errorBox}><AlertTriangle size={16} /><span>{error}</span></div>}
          {success && <div style={styles.successBox}><span>{success}</span></div>}

          <button type="submit" disabled={loading} style={loading ? styles.btnDisabled : styles.btnPrimary}>
            {loading ? 'A processar...' : mode === 'internal' ? 'Transferir' : 'Enviar'}
          </button>
        </form>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
  modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  toggleContainer: { display: 'flex', gap: '8px', marginBottom: '20px' },
  toggleActive: { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#3d5afe', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  toggleInactive: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: '#f5f5f5', color: '#333', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#333' },
  select: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', background: '#fafafa' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' },
  searchBtn: { padding: '12px 16px', borderRadius: '10px', border: 'none', background: '#3d5afe', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  resultsList: { marginTop: '8px', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' },
  resultItem: { padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  selectedUser: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#e8f0fe', borderRadius: '10px' },
  changeBtn: { background: 'none', border: 'none', color: '#3d5afe', cursor: 'pointer', fontWeight: 600 },
  errorBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fff2f2', color: '#c0392b', borderRadius: '8px', fontSize: '0.85rem', marginTop: '8px' },
  successBox: { padding: '12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '12px' },
  btnPrimary: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#3d5afe', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  btnDisabled: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#ccc', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'not-allowed' },
};

export default TransferModal;