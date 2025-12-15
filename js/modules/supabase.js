// js/modules/supabase.js - Cliente Supabase Oficial
console.log('🚀 Supabase.js carregado - Cliente Oficial');

// Inicializar cliente Supabase globalmente
window.supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      storage: window.localStorage,
      autoRefreshToken: true
    },
    global: {
      headers: {
        'apikey': window.SUPABASE_KEY,
        'Authorization': `Bearer ${window.SUPABASE_KEY}`
      }
    }
  }
);

// Função de teste de conexão
window.testSupabaseConnection = async function() {
  try {
    console.log('🔍 Testando conexão Supabase oficial...');
    const { data, error } = await window.supabaseClient
      .from('properties')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Conexão Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão Supabase:', error.message);
    return false;
  }
};

// Função para carregar imóveis
window.supabaseLoadProperties = async function() {
  try {
    console.log('📥 Carregando imóveis do Supabase...');
    
    const { data, error, count } = await window.supabaseClient
      .from('properties')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ ${data.length} imóveis carregados do Supabase`);
    return { data, count };
  } catch (error) {
    console.error('❌ Erro ao carregar imóveis:', error.message);
    return { data: [], error: error.message };
  }
};

// Função para salvar imóvel
window.supabaseSaveProperty = async function(propertyData) {
  try {
    console.log('💾 Salvando imóvel no Supabase...', propertyData);
    
    const { data, error } = await window.supabaseClient
      .from('properties')
      .insert([propertyData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Imóvel salvo no Supabase:', data[0].id);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Erro ao salvar no Supabase:', error.message);
    return { success: false, error: error.message };
  }
};

// Função para atualizar imóvel
window.supabaseUpdateProperty = async function(id, propertyData) {
  try {
    console.log(`✏️ Atualizando imóvel ${id} no Supabase...`);
    
    const { data, error } = await window.supabaseClient
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    console.log('✅ Imóvel atualizado no Supabase');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Erro ao atualizar no Supabase:', error.message);
    return { success: false, error: error.message };
  }
};

// Testar conexão automaticamente
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    window.testSupabaseConnection();
  }, 1000);
});

console.log('✅ Cliente Supabase oficial configurado');
