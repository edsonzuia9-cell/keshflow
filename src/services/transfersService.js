import { supabase } from './supabaseClient';

// 🔒 Garante 2 casas decimais exatas
const roundMoney = (value) => {
  return Math.round((parseFloat(value) + Number.EPSILON) * 100) / 100;
};

export const transfersService = {
  async searchUsers(query = '') {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Não autenticado');

      const { data, error } = await supabase.rpc('search_users_for_transfer', {
        search_query: query,
        exclude_user_id: user.id
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar estudantes:', error);
      return [];
    }
  },

  async transferP2P(senderAccountId, receiverAccountId, amount, description = '') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const safeAmount = roundMoney(amount);
    if (isNaN(safeAmount) || safeAmount <= 0) throw new Error('Valor inválido');

    const { data, error } = await supabase.rpc('execute_transfer_p2p', {
      p_sender_account_id: senderAccountId,
      p_receiver_account_id: receiverAccountId,
      p_amount: safeAmount,
      p_description: description || null
    });

    if (error) throw new Error('Erro na transferência: ' + error.message);
    if (!data?.success) throw new Error(data?.message || 'Erro desconhecido');

    return data;
  },

  async transferInternal(fromAccountId, toAccountId, amount, description = '') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const safeAmount = roundMoney(amount);
    if (isNaN(safeAmount) || safeAmount <= 0) throw new Error('Valor inválido');
    if (fromAccountId === toAccountId) throw new Error('Contas devem ser diferentes');

    const { data, error } = await supabase.rpc('execute_transfer_internal', {
      p_from_account_id: fromAccountId,
      p_to_account_id: toAccountId,
      p_amount: safeAmount,
      p_description: description || null
    });

    if (error) throw new Error('Erro na transferência interna: ' + error.message);
    if (!data?.success) throw new Error(data?.message || 'Erro desconhecido');

    return data;
  }
};