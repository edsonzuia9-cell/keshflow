import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Wallet, LayoutDashboard, CreditCard, ArrowLeftRight, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleNavClick = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

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

        {/* Desktop Navigation */}
        <div style={styles.desktopMenu}>
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

        {/* Desktop Logout */}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={styles.mobileMenuBtn}
          aria-label="Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setMenuOpen(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileMenuHeader}>
              <span style={styles.mobileMenuTitle}>Menu</span>
              <button onClick={() => setMenuOpen(false)} style={styles.mobileCloseBtn}>
                <X size={24} />
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  style={{
                    ...styles.mobileNavLink,
                    color: active ? '#0f172a' : '#64748b',
                    background: active ? '#f1f5f9' : 'transparent',
                  }}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div style={styles.mobileDivider} />

            <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
              <LogOut size={22} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    padding: '0 24px',
    height: '64px',
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
    gap: '10px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  desktopMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '8px 14px',
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
    padding: '8px 16px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  mobileMenuBtn: {
    display: 'none',
    background: 'transparent',
    border: 'none',
    color: '#0f172a',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
  },
  mobileOverlay: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  mobileMenu: {
    display: 'none',
    position: 'fixed',
    top: 0,
    right: 0,
    width: '280px',
    height: '100vh',
    background: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
    zIndex: 1000,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  mobileMenuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
  },
  mobileMenuTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  mobileCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
  },
  mobileNavLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '1rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  mobileDivider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '12px 0',
  },
  mobileLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '1rem',
    color: '#ef4444',
    background: '#fef2f2',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    marginTop: 'auto',
  },
};

// Responsive styles via media query
const responsiveStyles = `
  @media (max-width: 767px) {
    .navbar-desktop-menu { display: none !important; }
    .navbar-logout-btn { display: none !important; }
    .navbar-mobile-btn { display: flex !important; }
    .navbar-mobile-overlay { display: block !important; }
    .navbar-mobile-menu { display: flex !important; }
  }
  @media (min-width: 768px) {
    .navbar-mobile-btn { display: none !important; }
    .navbar-mobile-overlay { display: none !important; }
  }
`;

export default Navbar;