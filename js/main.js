// js/main.js - Sistema de inicialização principal (VERSÃO CORRIGIDA)
console.log('🚀 main.js carregado - Inicialização principal');

// ========== VARIÁVEIS GLOBAIS ==========
window.APP_INITIALIZED = false;
window.FILTERS_INITIALIZED = false;

// ========== CACHE DE ELEMENTOS (OTIMIZAÇÃO) ==========
const elementCache = new Map();
window.getElement = function(id) {
    if (!elementCache.has(id)) {
        elementCache.set(id, document.getElementById(id));
    }
    return elementCache.get(id);
};

// ========== VERIFICAÇÃO DE MÓDULOS ==========
window.checkModules = function() {
    console.log('🔍 Verificando módulos carregados:');
    
    const modules = {
        'utils.js': typeof window.isMobileDevice === 'function',
        'properties.js': typeof window.getInitialProperties === 'function',
        'gallery.js': typeof window.openGallery === 'function'
    };
    
    Object.entries(modules).forEach(([module, loaded]) => {
        console.log(`- ${module}: ${loaded ? '✅' : '❌'}`);
    });
    
    return Object.values(modules).every(Boolean);
};

// ========== SISTEMA DE INICIALIZAÇÃO PRINCIPAL ==========
window.initializeWeberLessaSystem = async function() {
    console.log('🌐 Iniciando sistema Weber Lessa...');
    
    try {
        // 1. Verificar módulos
        if (!window.checkModules()) {
            console.warn('⚠️ Alguns módulos não carregaram completamente');
        }
        
        // 2. Inicializar propriedades
        if (typeof window.initializeProperties === 'function') {
            await window.initializeProperties();
            console.log('✅ Sistema de imóveis inicializado');
        } else {
            console.error('❌ initializeProperties não encontrado');
            window.loadFallbackProperties();
        }
        
        // 3. Configurar sistemas auxiliares
        window.setupAuxiliarySystems();
        
        // 4. Verificar funcionamento
        window.runFinalVerifications();
        
        window.APP_INITIALIZED = true;
        console.log('✅ Sistema Weber Lessa completamente inicializado!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        window.emergencyFallback();
    }
};

// ========== CONFIGURAÇÃO DE SISTEMAS AUXILIARES ==========
window.setupAuxiliarySystems = function() {
    console.log('🔧 Configurando sistemas auxiliares...');
    
    // 1. Formulário admin (se existir)
    if (typeof window.setupForm === 'function') {
        window.setupForm();
    }
    
    // 2. Sistema de upload (se existir)
    if (typeof window.setupUploadSystem === 'function') {
        window.setupUploadSystem();
    }
    
    // 3. Sistema de galeria
    if (typeof window.setupGalleryEvents === 'function') {
        window.setupGalleryEvents();
    }
    
    // 4. Otimização mobile
    if (typeof window.isMobileDevice === 'function' && window.isMobileDevice()) {
        console.log('📱 Otimizando para mobile...');
        if (typeof window.optimizeGalleryForMobile === 'function') {
            setTimeout(window.optimizeGalleryForMobile, 1000);
        }
    }
};

// ========== FALLBACK DE PROPRIEDADES ==========
window.loadFallbackProperties = function() {
    console.log('🔄 Carregando propriedades de fallback...');
    
    if (typeof window.getInitialProperties === 'function') {
        window.properties = window.getInitialProperties();
        console.log(`✅ ${window.properties.length} imóveis carregados (fallback)`);
        
        if (typeof window.renderProperties === 'function') {
            window.renderProperties();
        }
    }
};

// ========== VERIFICAÇÕES FINAIS ==========
window.runFinalVerifications = function() {
    console.log('🔍 Executando verificações finais...');
    
    // Verificar elementos críticos
    const criticalElements = [
        'properties-container',
        'adminPanel',
        'propertyForm'
    ];
    
    criticalElements.forEach(id => {
        const element = window.getElement(id);
        console.log(`- ${id}: ${element ? '✅' : '❌'}`);
    });
    
    // Contar imóveis renderizados
    setTimeout(() => {
        const container = window.getElement('properties-container');
        if (container && container.children.length > 0) {
            console.log(`🎉 ${container.children.length} imóveis visíveis na página!`);
        } else {
            console.warn('⚠️ Nenhum imóvel visível!');
        }
    }, 500);
};

// ========== FALLBACK DE EMERGÊNCIA ==========
window.emergencyFallback = function() {
    console.log('🚨 Ativando modo de emergência...');
    
    window.loadFallbackProperties();
    alert('⚠️ Sistema iniciado em modo de segurança.');
};

// ========== INICIALIZAÇÃO AUTOMÁTICA SEGURA ==========
window.safeInitialize = function() {
    console.log('🔒 Inicialização segura iniciada...');
    
    // Verificar se módulos carregaram
    const loadedModules = performance.getEntriesByType('resource')
        .filter(r => r.name.includes('modules/'))
        .map(r => r.name.split('/').pop());
    
    console.log('📦 Módulos carregados:', loadedModules);
    
    // Aguardar carregamento completo
    setTimeout(() => {
        if (typeof window.initializeWeberLessaSystem === 'function') {
            window.initializeWeberLessaSystem();
        } else {
            console.error('❌ initializeWeberLessaSystem não disponível');
            window.emergencyFallback();
        }
    }, 100);
};

// ========== TESTE DO MÓDULO ==========
window.testMainModule = function() {
    console.log('🧪 Testando módulo main.js:');
    
    const functions = [
        'safeInitialize',
        'initializeWeberLessaSystem',
        'setupAuxiliarySystems',
        'checkModules'
    ];
    
    functions.forEach(func => {
        console.log(`- ${func}: ${typeof window[func] === 'function' ? '✅' : '❌'}`);
    });
    
    return functions.every(func => typeof window[func] === 'function');
};

// ========== EXPORTAÇÃO CONSISTENTE ==========
console.log('✅ main.js carregado - Funções expostas via window');

// Teste automático do módulo
setTimeout(() => {
    if (typeof window.testMainModule === 'function') {
        window.testMainModule();
    }
}, 500);
