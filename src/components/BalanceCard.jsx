const BalanceCard = ({ title, amount, color = "#111" }) => {
  return (
    <div style={{ ...styles.card, borderLeft: `6px solid ${color}` }}>
      <small style={styles.label}>{title}</small>
      <h2 style={styles.amount}>
        {amount.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
      </h2>
    </div>
  );
};

const styles = {
  card: { background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', minWidth: '200px' },
  label: { color: '#888', textTransform: 'uppercase', letterSpacing: '1px' },
  amount: { margin: '10px 0 0 0', fontSize: '1.8rem' }
};

export default BalanceCard;