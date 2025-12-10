// js/main.js - MÓDULO DE INICIALIZAÇÃO
console.log('🚀 main.js carregado - Sistema de Inicialização');

window.initializeWeberLessaSystem = async function() {
    console.log('🚀 Sistema Weber Lessa Iniciando');
    
    // Aplicar diretriz constitucional
    if (typeof enforceConstitutionalGuideline === 'function') {
        enforceConstitutionalGuideline();
    }
    
    // TESTE DE CONEXÃO
    console.log('🔍 Testando conexões...');
    let supabaseOk = false;
    
    if (typeof testSupabaseConnection === 'function') {
        supabaseOk = await testSupabaseConnection();
    }
    console.log(`🌐 Supabase: ${supabaseOk ? '✅ Conectado' : '⚠️ Usando modo local'}`);
    
    // INICIALIZAR SISTEMA DE IMÓVEIS (IMPORTANTE: fazer primeiro!)
    if (typeof initializeProperties === 'function') {
        await initializeProperties();
    } else {
        console.error('❌ initializeProperties() não disponível!');
        return false;
    }
    
    // Configurar formulário e sistemas de upload
    if (typeof setupForm === 'function') {
        setupForm();
    }
    
    if (typeof setupUploadSystem === 'function') {
        setupUploadSystem();
    }
    
    if (typeof setupPdfUploadSystem === 'function') {
        setupPdfUploadSystem();
    }
    
    // VERIFICAÇÃO FINAL DOS ELEMENTOS
    console.log('🔍 Verificação final do sistema:');
    console.log('- properties-container:', document.getElementById('properties-container') ? '✅' : '❌');
    
    if (typeof window.properties !== 'undefined') {
        console.log('- Total de imóveis carregados:', window.properties.length);
    }
    
    // TESTAR ACESSO ÀS IMAGENS
    if (typeof testImageAccess === 'function') {
        await testImageAccess();
    }
    
    // ========== INICIALIZAR GALERIA DE FOTOS ==========
    console.log('🎨 Inicializando galeria de fotos MOBILE FIRST...');
    
    // Adicionar estilos da galeria (se existir em gallery.js)
    if (typeof window.galleryStyles !== 'undefined') {
        const styleSheet = document.createElement("style");
        styleSheet.textContent = window.galleryStyles;
        document.head.appendChild(styleSheet);
    }
    
    // Configurar eventos da galeria
    if (typeof setupGalleryEvents === 'function') {
        setupGalleryEvents();
    }
    
    console.log('✅ Galeria de fotos MOBILE FIRST inicializada!');
    console.log('✅ Sistema Weber Lessa completamente carregado e pronto!');
    
    // TESTE FINAL: Verificar se os imóveis estão visíveis
    setTimeout(() => {
        const container = document.getElementById('properties-container');
        if (container && container.children.length > 0) {
            console.log(`🎉 ${container.children.length} imóveis visíveis na página!`);
        } else {
            console.error('❌ NENHUM IMÓVEL VISÍVEL! Verificando problemas...');
            // Tentativa de emergência: renderizar novamente
            if (typeof renderProperties === 'function') {
                renderProperties();
            }
        }
    }, 500);
    
    // Inicializar otimização mobile
    if (typeof isMobileDevice === 'function' && isMobileDevice()) {
        setTimeout(() => {
            if (typeof optimizeGalleryForMobile === 'function') {
                optimizeGalleryForMobile();
            }
        }, 1000);
    }
    
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
