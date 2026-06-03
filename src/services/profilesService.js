import { supabase } from './supabaseClient';

export const profilesService = {
  async getOrCreate() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Buscar TODOS os perfis deste user (pode haver duplicados)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Se houver múltiplos, usar o mais recente e ignorar os outros
    if (allProfiles && allProfiles.length > 0) {
      return allProfiles[0];
    }

    // Criar se não existir nenhum
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        user_id: user.id, 
        full_name: user.email?.split('@')[0] || 'Utilizador' 
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};