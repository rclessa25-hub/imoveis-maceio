// js/main.js - MÓDULO DE INICIALIZAÇÃO
console.log('🚀 main.js carregado - Sistema de Inicialização');

window.initializeWeberLessaSystem = async function() {
    console.log('🚀 Sistema Weber Lessa Iniciando');
    
    // 1. Testar conexão Supabase
    if (typeof testSupabaseConnection === 'function') {
        const supabaseOk = await testSupabaseConnection();
        console.log(`🌐 Supabase: ${supabaseOk ? '✅ Conectado' : '⚠️ Usando modo local'}`);
    }
    
    // 2. Inicializar propriedades
    if (typeof initializeProperties === 'function') {
        await initializeProperties();
    } else {
        console.error('❌ initializeProperties() não disponível!');
        return false;
    }
    
    // 3. Configurar eventos da galeria
    if (typeof setupGalleryEvents === 'function') {
        setTimeout(() => {
            setupGalleryEvents();
            console.log('✅ Galeria configurada');
        }, 500);
    }
    
    console.log('✅ Sistema Weber Lessa completamente carregado!');
    return true;
};

// main.js - ADICIONAR NO FINAL DA FUNÇÃO initializeWeberLessaSystem

    // ========== CONFIGURAR FILTROS (CRÍTICO) ==========
    console.log('🎛️ Configurando sistema de filtros...');
    if (typeof setupFilters === 'function') {
        setupFilters();
        console.log('✅ Filtros configurados');
    } else {
        console.error('❌ setupFilters() não disponível!');
    }
    
    // ========== TESTE DE INTEGRAÇÃO RÁPIDO ==========
    setTimeout(() => {
        console.log('🧪 TESTE DE INTEGRAÇÃO:');
        
        const testResults = {
            'Imóveis carregados': window.properties && Array.isArray(window.properties),
            'Número de imóveis': window.properties ? window.properties.length : 0,
            'Container encontrado': !!document.getElementById('properties-container'),
            'Filtros ativos': document.querySelectorAll('.filter-btn').length > 0,
            'Função renderProperties': typeof renderProperties === 'function',
            'Função setupFilters': typeof setupFilters === 'function'
        };
        
        console.table(testResults);
        
        // Se imóveis carregados mas não visíveis, forçar renderização
        if (window.properties && window.properties.length > 0) {
            const container = document.getElementById('properties-container');
            if (!container || container.children.length === 0) {
                console.log('🔄 Imóveis carregados mas não visíveis - Forçando renderização...');
                if (typeof renderProperties === 'function') {
                    renderProperties();
                }
            }
        }
    }, 1000);
