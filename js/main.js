// js/main.js - Sistema de Inicialização e Orquestração
console.log('🚀 main.js - Sistema de inicialização carregado');

// ========== CONFIGURAÇÃO DE INICIALIZAÇÃO ==========
window.APP_CONFIG = {
    version: '3.0',
    lastUpdate: new Date().toISOString().split('T')[0],
    modules: ['utils', 'properties', 'gallery', 'main']
};

// ========== FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ==========
window.initializeWeberLessaSystem = async function(options = {}) {
    console.log('🏁 ========================================');
    console.log('🏁 INICIALIZANDO SISTEMA WEBER LESSA');
    console.log('🏁 ========================================');
    
    const startTime = performance.now();
    
    try {
        // 1. VALIDAR MÓDULOS DISPONÍVEIS
        console.log('🔍 Validando módulos disponíveis...');
        const availableModules = validateModules();
        
        if (!availableModules.core) {
            console.error('❌ Módulos core não disponíveis!');
            return false;
        }
        
        // 2. APLICAR DIRETRIZ CONSTITUCIONAL (se disponível)
        if (typeof enforceConstitutionalGuideline === 'function') {
            enforceConstitutionalGuideline();
        }
        
        // 3. TESTAR CONEXÕES EXTERNAS
        console.log('🔗 Testando conexões externas...');
        const connections = await testSystemConnections();
        
        // 4. INICIALIZAR SISTEMA DE IMÓVEIS
        console.log('🏠 Inicializando sistema de imóveis...');
        await initializeProperties();
        
        // 5. CONFIGURAR SISTEMAS DE INTERFACE
        console.log('🎨 Configurando sistemas de interface...');
        setupInterfaceSystems();
        
        // 6. INICIALIZAR GALERIA
        console.log('🖼️ Inicializando sistema de galeria...');
        initializeGallerySystem();
        
        // 7. VALIDAÇÃO FINAL
        console.log('✅ Validando sistema completo...');
        const validation = validateSystem();
        
        // 8. PERFORMANCE REPORT
        const endTime = performance.now();
        const loadTime = (endTime - startTime).toFixed(2);
        
        console.log('📊 ========================================');
        console.log('📊 RELATÓRIO DE INICIALIZAÇÃO');
        console.log('📊 ========================================');
        console.log(`⏱️  Tempo de inicialização: ${loadTime}ms`);
        console.log(`📦 Módulos carregados: ${availableModules.count}/4`);
        console.log(`🌐 Conexões: Supabase ${connections.supabase ? '✅' : '⚠️'}`);
        console.log(`🏠 Imóveis carregados: ${window.properties ? window.properties.length : 0}`);
        console.log(`🎨 Galeria: ${validation.gallery ? '✅' : '❌'}`);
        console.log('📊 ========================================');
        
        // 9. EVENTO DE SISTEMA PRONTO
        document.dispatchEvent(new CustomEvent('weberlessa:system-ready', {
            detail: {
                time: loadTime,
                properties: window.properties ? window.properties.length : 0,
                modules: availableModules
            }
        }));
        
        console.log('🎉 SISTEMA WEBER LESSA INICIALIZADO COM SUCESSO!');
        return true;
        
    } catch (error) {
        console.error('❌ ERRO NA INICIALIZAÇÃO DO SISTEMA:', error);
        emergencyFallback();
        return false;
    }
};

// ========== FUNÇÕES AUXILIARES ==========

// Validar módulos disponíveis
function validateModules() {
    const modules = {
        utils: typeof window.isMobileDevice === 'function',
        properties: typeof window.initializeProperties === 'function',
        gallery: typeof window.openGallery === 'function',
        core: false
    };
    
    modules.core = modules.utils && modules.properties;
    modules.count = Object.values(modules).filter(Boolean).length;
    
    console.log('📦 Status dos módulos:');
    Object.entries(modules).forEach(([name, available]) => {
        console.log(`  ${name}: ${available ? '✅' : '❌'}`);
    });
    
    return modules;
}

// Testar conexões do sistema
async function testSystemConnections() {
    const connections = {
        supabase: false,
        images: false
    };
    
    try {
        // Testar Supabase
        if (typeof testSupabaseConnection === 'function') {
            connections.supabase = await testSupabaseConnection();
            console.log(`🌐 Supabase: ${connections.supabase ? '✅ Conectado' : '⚠️ Modo local'}`);
        }
        
        // Testar acesso a imagens
        if (typeof testImageAccess === 'function') {
            // Executar em background
            setTimeout(testImageAccess, 1000);
        }
        
    } catch (error) {
        console.log('⚠️ Teste de conexões com falha:', error.message);
    }
    
    return connections;
}

// Configurar sistemas de interface
function setupInterfaceSystems() {
    // Configurar formulário admin (se disponível)
    if (typeof setupForm === 'function') {
        setupForm();
    }
    
    // Configurar uploads (se disponíveis)
    if (typeof setupUploadSystem === 'function') {
        setupUploadSystem();
    }
    
    if (typeof setupPdfUploadSystem === 'function') {
        setupPdfUploadSystem();
    }
    
    // VERIFICAÇÃO DE ELEMENTOS CRÍTICOS
    console.log('🔍 Verificando elementos críticos...');
    const criticalElements = [
        'properties-container',
        'adminPanel',
        'propertyForm'
    ];
    
    criticalElements.forEach(id => {
        const exists = document.getElementById(id) !== null;
        console.log(`  ${id}: ${exists ? '✅' : '❌'}`);
    });
}

// Inicializar sistema de galeria
function initializeGallerySystem() {
    if (typeof galleryStyles === 'string') {
        // Adicionar estilos da galeria
        const styleSheet = document.createElement("style");
        styleSheet.textContent = galleryStyles;
        styleSheet.id = 'gallery-styles';
        document.head.appendChild(styleSheet);
        console.log('🎨 Estilos da galeria adicionados');
    }
    
    if (typeof setupGalleryEvents === 'function') {
        setupGalleryEvents();
        console.log('🎮 Eventos da galeria configurados');
    }
    
    // Otimização mobile (se necessário)
    setTimeout(() => {
        if (typeof isMobileDevice === 'function' && isMobileDevice()) {
            if (typeof optimizeGalleryForMobile === 'function') {
                optimizeGalleryForMobile();
                console.log('📱 Galeria otimizada para mobile');
            }
        }
    }, 500);
}

// Validar sistema completo
function validateSystem() {
    const validation = {
        properties: false,
        gallery: false,
        interface: false
    };
    
    // Validar imóveis
    if (window.properties && Array.isArray(window.properties)) {
        validation.properties = true;
        console.log(`✅ ${window.properties.length} imóveis carregados`);
    }
    
    // Validar galeria
    validation.gallery = typeof openGallery === 'function' && 
                        typeof closeGallery === 'function';
    
    // Validar interface
    const container = document.getElementById('properties-container');
    validation.interface = container !== null;
    
    // TESTE FINAL: Verificar se imóveis estão visíveis
    setTimeout(() => {
        if (container && container.children.length > 0) {
            console.log(`🎉 ${container.children.length} imóveis visíveis na página!`);
        } else if (validation.properties) {
            console.warn('⚠️ Imóveis carregados mas não visíveis');
            // Tentar renderizar novamente
            if (typeof renderProperties === 'function') {
                renderProperties();
            }
        }
    }, 300);
    
    return validation;
}

// Fallback de emergência
function emergencyFallback() {
    console.warn('🚨 ATIVANDO MODO DE EMERGÊNCIA');
    
    // Tentar carregar imóveis diretamente
    if (typeof initializeProperties === 'function') {
        setTimeout(() => {
            initializeProperties();
            console.log('🔄 Sistema de imóveis inicializado em modo emergência');
        }, 1000);
    }
    
    // Mostrar alerta para usuário (opcional)
    setTimeout(() => {
        const container = document.getElementById('properties-container');
        if (!container || container.children.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: #fff3cd; border-radius: 10px;">
                    <h3 style="color: #856404;">⚠️ Sistema em manutenção</h3>
                    <p>Algumas funcionalidades podem estar temporariamente indisponíveis.</p>
                    <button onclick="location.reload()" style="background: #856404; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 1rem;">
                        Recarregar página
                    </button>
                </div>
            `;
        }
    }, 2000);
}

// ========== INICIALIZAÇÃO AUTOMÁTICA (OPCIONAL) ==========
// Descomente para inicialização automática

/*
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM completamente carregado');
    
    // Pequeno delay para garantir que todos scripts carregaram
    setTimeout(() => {
        if (typeof initializeWeberLessaSystem === 'function') {
            initializeWeberLessaSystem();
        } else {
            console.error('❌ Sistema não pode ser inicializado!');
            emergencyFallback();
        }
    }, 100);
});
*/

// ========== UTILITÁRIOS PÚBLICOS ==========
window.reloadWeberLessaSystem = function() {
    console.log('🔄 Recarregando sistema Weber Lessa...');
    if (typeof initializeWeberLessaSystem === 'function') {
        return initializeWeberLessaSystem();
    }
    return false;
};

window.getSystemStatus = function() {
    return {
        properties: window.properties ? window.properties.length : 0,
        modules: validateModules(),
        time: new Date().toISOString()
    };
};

// Função emergencial para configurar filtros
function setupFiltersEmergency() {
    console.log('🚨 Configurando filtros em modo emergência...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (filterButtons.length === 0) {
        console.error('❌ Botões de filtro não encontrados!');
        return;
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adicionar ao clicado
            this.classList.add('active');
            
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            console.log(`🎯 Filtrando por: ${filter}`);
            
            // Renderizar com filtro
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filter);
            } else {
                console.error('❌ renderProperties não disponível');
            }
        });
    });
    
    console.log(`✅ ${filterButtons.length} botões de filtro configurados`);
}

// Executar após carregamento
setTimeout(() => {
    if (typeof setupFilters !== 'function') {
        setupFiltersEmergency();
    }
}, 1000);

// ========== EXPORTAÇÃO DO MÓDULO ==========
console.log('✅ main.js completamente carregado e pronto');
console.log('💡 Use: initializeWeberLessaSystem() para iniciar o sistema');
