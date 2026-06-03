import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Procura a sessão atual imediatamente ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Fica a escutar alterações (ex: se o utilizador clicar em Sair noutra página)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // 3. Limpa o "escutador" quando o componente é desmontado
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        A verificar segurança...
      </div>
    );
  }

  // Se não existir sessão ativa, redireciona imediatamente para o Login
  if (!session) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
