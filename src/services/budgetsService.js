import { supabase } from './supabaseClient';

export const budgetsService = {
  async getAll(month, year) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year);
    if (error) throw error;
    return data || [];
  },

  async create(budget) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ ...budget, user_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};