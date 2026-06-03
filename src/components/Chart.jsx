import { memo, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Chart = memo(({ income, expense }) => {
  const data = useMemo(() => ({
    labels: ['Entradas', 'Saídas'],
    datasets: [{
      data: [income || 0, expense || 0],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 4,
      hoverBackgroundColor: ['#059669', '#dc2626'],
      hoverBorderWidth: 0,
    }],
  }), [income, expense]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 600, easing: 'easeOutQuart' },
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Inter', size: 13, weight: '600' },
          color: '#475569',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 13, weight: '600' },
        padding: 12,
        cornerRadius: 10,
        displayColors: true,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT`,
        },
      },
    },
  }), []);

  const balance = useMemo(() => (income || 0) - (expense || 0), [income, expense]);
  const total = (income || 0) + (expense || 0);
  const incomePct = total > 0 ? Math.round(((income || 0) / total) * 100) : 0;
  const expensePct = total > 0 ? Math.round(((expense || 0) / total) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.chartWrapper}>
        <Doughnut data={data} options={options} />
        <div style={styles.centerText}>
          <span style={styles.centerLabel}>Balanço</span>
          <span style={styles.centerValue}>
            {balance.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}
          </span>
          <span style={styles.centerCurrency}>MT</span>
        </div>
      </div>
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: '#10b981' }} />
          <div>
            <div style={styles.legendLabel}>Entradas</div>
            <div style={styles.legendValue}>{incomePct}%</div>
          </div>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: '#ef4444' }} />
          <div>
            <div style={styles.legendLabel}>Saídas</div>
            <div style={styles.legendValue}>{expensePct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
});

Chart.displayName = 'Chart';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  chartWrapper: {
    position: 'relative',
    width: '220px',
    height: '220px',
  },
  centerText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  centerLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  centerValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  centerCurrency: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94a3b8',
  },
  legend: {
    display: 'flex',
    gap: '32px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendLabel: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#64748b',
  },
  legendValue: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#0f172a',
  },
};

export default Chart;