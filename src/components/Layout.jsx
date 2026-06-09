import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main style={{ 
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden'
      }}>
        <Outlet />
      </main>
    </>
  );
};

export default Layout;