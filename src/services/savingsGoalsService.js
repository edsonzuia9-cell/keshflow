import { supabase } from './supabaseClient';

export const savingsGoalsService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*, accounts(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(goal) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('savings_goals')
      .insert([{ ...goal, user_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async addToGoal(id, amount) {
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('current_amount')
      .eq('id', id)
      .single();

    const newAmount = (goal?.current_amount || 0) + amount;
    return this.update(id, { current_amount: newAmount });
  }
};