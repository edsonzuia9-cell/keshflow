import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './auth/Login';
import Register from './auth/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ForgotPassword from './auth/ForgotPassword'; 
import ResetPassword from './auth/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública: Login sem Navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas Privadas: Navbar + Página protegidas */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
        </Route>

        {/* Redirecionamento de segurança */}
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/forgot-password" element={<ForgotPassword />} /> 
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;