import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Wallet, LayoutDashboard, CreditCard, ArrowLeftRight, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/accounts', label: 'Contas', icon: CreditCard },
    { path: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logoLink}>
          <div style={styles.logoIcon}>
            <Wallet size={20} strokeWidth={2.5} />
          </div>
          <span style={styles.logoText}>KeshFlow</span>
        </Link>

        {/* Navigation */}
        <div style={styles.menu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  color: active ? '#0f172a' : '#64748b',
                  background: active ? '#f1f5f9' : 'transparent',
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    padding: '0 24px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
  },
  logoText: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9375rem',
    padding: '8px 16px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    color: '#ef4444',
    border: '1.5px solid #fecaca',
    padding: '8px 18px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default Navbar;