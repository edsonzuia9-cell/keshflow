import { Utensils, Bus, Home, Heart, GraduationCap, Gamepad2, Shirt, ArrowLeftRight, Wallet, Briefcase, HelpCircle } from 'lucide-react';

const categoryConfig = {
  'Alimentação': { icon: Utensils, color: '#ea580c', bg: '#fff7ed' },
  'Transporte': { icon: Bus, color: '#2563eb', bg: '#eff6ff' },
  'Moradia': { icon: Home, color: '#7c3aed', bg: '#f5f3ff' },
  'Saúde': { icon: Heart, color: '#dc2626', bg: '#fef2f2' },
  'Educação': { icon: GraduationCap, color: '#0891b2', bg: '#ecfeff' },
  'Lazer': { icon: Gamepad2, color: '#db2777', bg: '#fdf2f8' },
  'Vestuário': { icon: Shirt, color: '#9333ea', bg: '#faf5ff' },
  'Transferência': { icon: ArrowLeftRight, color: '#059669', bg: '#ecfdf5' },
  'Transferência Interna': { icon: ArrowLeftRight, color: '#059669', bg: '#ecfdf5' },
  'Casa': { icon: Home, color: '#7c3aed', bg: '#f5f3ff' },
  'Salário': { icon: Briefcase, color: '#059669', bg: '#ecfdf5' },
  'Outros': { icon: HelpCircle, color: '#64748b', bg: '#f8fafc' },
};

export function getCategoryConfig(category) {
  return categoryConfig[category] || categoryConfig['Outros'];
}

export default function CategoryBadge({ category }) {
  const config = categoryConfig[category] || categoryConfig['Outros'];
  const Icon = config.icon;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 500,
      color: config.color,
      background: config.bg,
      fontFamily: 'Inter, system-ui, sans-serif',
      whiteSpace: 'nowrap',
    }}>
      <Icon size={13} />
      {category || 'Outros'}
    </span>
  );
}