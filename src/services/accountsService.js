import { supabase } from './supabaseClient';

export const accountsService = {
  async getAll(includeArchived = false) {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('archived', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(account) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ ...account, user_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async archive(id, archived = true) {
    return this.update(id, { archived });
  },

  async setDefault(id) {
    return this.update(id, { is_default: true });
  },

  async getTransactions(accountId, limit = 5) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async transferInternal(fromId, toId, amount, description = '') {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('transfers')
      .insert([{
        sender_user_id: user.id,
        receiver_user_id: user.id,
        sender_account_id: fromId,
        receiver_account_id: toId,
        amount: parseFloat(amount),
        description,
        transfer_type: 'internal',
        status: 'completed'
      }])
      .select();

    if (error) throw error;
    return data[0];
  }
};