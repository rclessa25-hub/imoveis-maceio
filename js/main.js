// js/main.js - Inicialização principal do sistema Weber Lessa
console.log('🚀 main.js - Sistema de inicialização carregado');

// ========== INICIALIZAÇÃO DO SISTEMA ==========
window.initializeWeberLessaSystem = async function() {
    console.log('🏁 Iniciando sistema Weber Lessa...');
    
    // Aplicar diretriz constitucional
    if (typeof enforceConstitutionalGuideline === 'function') {
        enforceConstitutionalGuideline();
    }
    
    // Testar conexão Supabase
    console.log('🔍 Testando conexões...');
    const supabaseOk = typeof testSupabaseConnection === 'function' 
        ? await testSupabaseConnection() 
        : false;
    console.log(`🌐 Supabase: ${supabaseOk ? '✅ Conectado' : '⚠️ Modo local'}`);
    
    // Inicializar sistema de imóveis (IMPORTANTE!)
    if (typeof initializeProperties === 'function') {
        await initializeProperties();
    } else {
        console.error('❌ initializeProperties() não encontrada!');
    }
    
    // Configurar formulário admin se disponível
    if (typeof setupForm === 'function') {
        setupForm();
    }
    
    // Configurar sistemas de upload se disponíveis
    if (typeof setupUploadSystem === 'function') {
        setupUploadSystem();
    }
    
    if (typeof setupPdfUploadSystem === 'function') {
        setupPdfUploadSystem();
    }
    
    // VERIFICAÇÃO FINAL
    console.log('🔍 Verificação final do sistema:');
    console.log('- properties-container:', document.getElementById('properties-container') ? '✅' : '❌');
    console.log('- Total de imóveis carregados:', window.properties ? window.properties.length : 0);
    
    // Testar acesso às imagens
    if (typeof testImageAccess === 'function') {
        testImageAccess();
    }
    
    // ========== INICIALIZAR GALERIA ==========
    console.log('🎨 Inicializando galeria de fotos...');
    
    if (typeof setupGalleryEvents === 'function') {
        setupGalleryEvents();
        console.log('✅ Galeria inicializada!');
    }
    
    // Inicializar otimização mobile
    if (typeof isMobileDevice === 'function' && isMobileDevice()) {
        setTimeout(() => {
            if (typeof optimizeGalleryForMobile === 'function') {
                optimizeGalleryForMobile();
            }
        }, 1000);
    }
    
    // TESTE FINAL: Verificar se os imóveis estão visíveis
    setTimeout(() => {
        const container = document.getElementById('properties-container');
        if (container && container.children.length > 0) {
            console.log(`🎉 ${container.children.length} imóveis visíveis na página!`);
        } else {
            console.warn('⚠️ Verificando problemas de exibição...');
        }
    }, 500);
    
    console.log('✅ Sistema Weber Lessa completamente carregado e pronto!');
    return true;
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
// Opção 1: Inicializar imediatamente (se todas dependências carregadas)
// Opção 2: Chamar manualmente via DOMContentLoaded

console.log('✅ main.js carregado - Aguardando inicialização...');
