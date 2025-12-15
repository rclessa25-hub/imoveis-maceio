// js/modules/supabase.js - Cliente Supabase Oficial CORRIGIDO
console.log('🚀 Supabase.js carregado - Cliente Oficial CORRIGIDO');

// Configuração GLOBAL - disponível para todos os módulos
window.SUPABASE_CONFIG = {
    url: 'https://syztbxvpdaplpetmixmt.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
    options: {
        auth: {
            persistSession: false, // IMPORTANTE para GitHub Pages
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
};

// Inicializar o cliente Supabase IMEDIATAMENTE após carregar
(function initializeSupabase() {
    console.log('🔧 Inicializando cliente Supabase...');
    
    // Verificar se a biblioteca Supabase foi carregada
    if (typeof supabase === 'undefined') {
        console.error('❌ Biblioteca Supabase não carregada!');
        console.log('📦 Verificando se o script foi incluído antes dos outros scripts');
        
        // Tentar carregar dinamicamente
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.onload = function() {
            console.log('✅ Biblioteca Supabase carregada dinamicamente');
            setupSupabaseClient();
        };
        document.head.appendChild(script);
        return;
    }
    
    setupSupabaseClient();
})();

function setupSupabaseClient() {
    try {
        // Criar cliente Supabase
        window.supabaseClient = supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key,
            window.SUPABASE_CONFIG.options
        );
        
        console.log('✅ Cliente Supabase criado com sucesso');
        console.log('🌐 URL:', window.SUPABASE_CONFIG.url);
        console.log('🔑 Key disponível:', window.SUPABASE_CONFIG.key ? 'SIM' : 'NÃO');
        
        // Testar conexão imediata
        testConnection();
        
    } catch (error) {
        console.error('❌ Erro ao criar cliente Supabase:', error);
    }
}

// Função de teste de conexão
async function testConnection() {
    console.log('🔍 Testando conexão com Supabase...');
    
    try {
        // Teste simples
        const { data, error } = await window.supabaseClient
            .from('properties')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('❌ Erro na conexão:', error.message);
            console.log('📌 Verifique:');
            console.log('1. CORS configurado no dashboard do Supabase');
            console.log('2. URL do projeto:', window.SUPABASE_CONFIG.url);
            console.log('3. Chave anon key:', window.SUPABASE_CONFIG.key?.substring(0, 20) + '...');
            return false;
        }
        
        console.log(`✅ Conexão estabelecida! ${data?.length || 0} registros encontrados`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro fatal na conexão:', error.message);
        return false;
    }
}

// ========== FUNÇÕES DE ACESSO À API ==========

// 1. Carregar todos os imóveis
window.supabaseLoadProperties = async function() {
    console.log('📥 supabaseLoadProperties() chamada');
    
    if (!window.supabaseClient) {
        console.error('❌ supabaseClient não disponível');
        return { data: [], error: 'Cliente não inicializado' };
    }
    
    try {
        const { data, error, count } = await window.supabaseClient
            .from('properties')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Erro ao carregar imóveis:', error.message);
            return { data: [], error: error.message };
        }
        
        console.log(`✅ ${data?.length || 0} imóveis carregados do Supabase`);
        return { data: data || [], count: count || 0, error: null };
        
    } catch (error) {
        console.error('❌ Erro fatal:', error.message);
        return { data: [], error: error.message };
    }
};

// 2. Salvar novo imóvel (CORRIGIDA)
window.supabaseSaveProperty = async function(propertyData) {
    console.log('💾 supabaseSaveProperty() chamada:', propertyData);
    
    if (!window.supabaseClient) {
        console.error('❌ supabaseClient não disponível para salvar');
        return { success: false, error: 'Cliente não inicializado' };
    }
    
    try {
        console.log('📤 Enviando dados para Supabase:', propertyData);
        
        const { data, error } = await window.supabaseClient
            .from('properties')
            .insert([propertyData])
            .select()
            .single(); // Retorna um único objeto
        
        if (error) {
            console.error('❌ Erro ao salvar no Supabase:', error);
            console.error('Código:', error.code);
            console.error('Detalhes:', error.details);
            console.error('Hint:', error.hint);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Imóvel salvo no Supabase com sucesso!');
        console.log('📊 Dados retornados:', data);
        
        return { 
            success: true, 
            data: data,
            id: data.id 
        };
        
    } catch (error) {
        console.error('❌ Erro fatal ao salvar:', error);
        return { success: false, error: error.message };
    }
};

// 3. Atualizar imóvel existente
window.supabaseUpdateProperty = async function(id, propertyData) {
    console.log(`✏️ supabaseUpdateProperty() chamada para ID ${id}`);
    
    if (!window.supabaseClient) {
        console.error('❌ supabaseClient não disponível');
        return { success: false, error: 'Cliente não inicializado' };
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('properties')
            .update(propertyData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Erro ao atualizar:', error.message);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Imóvel atualizado no Supabase');
        return { success: true, data: data };
        
    } catch (error) {
        console.error('❌ Erro fatal ao atualizar:', error.message);
        return { success: false, error: error.message };
    }
};

// 4. Deletar imóvel
window.supabaseDeleteProperty = async function(id) {
    console.log(`🗑️ supabaseDeleteProperty() chamada para ID ${id}`);
    
    if (!window.supabaseClient) {
        console.error('❌ supabaseClient não disponível');
        return { success: false, error: 'Cliente não inicializado' };
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('properties')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('❌ Erro ao deletar:', error.message);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Imóvel deletado do Supabase');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Erro fatal ao deletar:', error.message);
        return { success: false, error: error.message };
    }
};

// ========== SISTEMA DE SINCRONIZAÇÃO ==========

// Sincronizar imóveis locais com Supabase
window.syncLocalWithSupabase = async function() {
    console.log('🔄 Sincronizando dados locais com Supabase...');
    
    // Carregar do Supabase
    const supabaseResult = await window.supabaseLoadProperties();
    
    if (supabaseResult.error) {
        console.error('❌ Não foi possível sincronizar:', supabaseResult.error);
        return { success: false, error: supabaseResult.error };
    }
    
    // Atualizar localmente
    if (supabaseResult.data && supabaseResult.data.length > 0) {
        window.properties = supabaseResult.data;
        window.savePropertiesToStorage();
        
        console.log(`✅ ${supabaseResult.data.length} imóveis sincronizados`);
        
        // Renderizar
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }
        
        // Atualizar admin
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }
        
        return { 
            success: true, 
            count: supabaseResult.data.length 
        };
    }
    
    return { success: false, error: 'Nenhum dado para sincronizar' };
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========

// Aguardar DOM estar pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - verificando Supabase...');
        
        // Verificar se supabaseClient foi criado
        setTimeout(() => {
            if (!window.supabaseClient) {
                console.log('⚠️ supabaseClient não criado automaticamente, tentando manualmente...');
                setupSupabaseClient();
            } else {
                console.log('✅ supabaseClient já está disponível');
            }
        }, 1000);
    });
} else {
    // DOM já carregado
    setTimeout(() => {
        if (!window.supabaseClient) {
            setupSupabaseClient();
        }
    }, 500);
}

console.log('✅ Módulo Supabase.js completamente carregado');
