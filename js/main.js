// js/main.js - Sistema de inicialização principal Weber Lessa
console.log('🚀 main.js - Sistema de inicialização carregado');

// ========== CACHE DE VERIFICAÇÕES (OTIMIZAÇÃO 3) ==========
const criticalElementsCache = new Map();
function getCriticalElement(id) {
    if (!criticalElementsCache.has(id)) {
        criticalElementsCache.set(id, document.getElementById(id));
    }
    return criticalElementsCache.get(id);
}

// ========== INLINING CRÍTICO (OTIMIZAÇÃO 2) ==========
function checkCriticalElements() {
    return ['properties-container', 'adminPanel', 'propertyForm']
        .map(id => !!getCriticalElement(id))
        .every(Boolean);
}

// ========== SISTEMA DE INICIALIZAÇÃO PRINCIPAL ==========
window.initializeWeberLessaSystem = async function() {
    console.log('🌐 Iniciando sistema Weber Lessa...');
    
    try {
        // 1. Verificar diretriz constitucional
        if (typeof enforceConstitutionalGuideline === 'function') {
            enforceConstitutionalGuideline();
        }
        
        // 2. Testar conexão Supabase
        const supabaseOk = typeof testSupabaseConnection === 'function' 
            ? await testSupabaseConnection() 
            : false;
        console.log(`🌐 Supabase: ${supabaseOk ? '✅ Conectado' : '⚠️ Usando modo local'}`);
        
        // 3. Inicializar sistema de imóveis (CORE)
        if (typeof initializeProperties === 'function') {
            await initializeProperties();
        } else {
            console.error('❌ initializeProperties() não encontrado!');
            // Fallback: carregar dados básicos
            if (typeof getInitialProperties === 'function') {
                window.properties = getInitialProperties();
                if (typeof renderProperties === 'function') {
                    renderProperties();
                }
            }
        }
        
        // 4. Configurar sistemas auxiliares
        setupAuxiliarySystems();
        
        // 5. Executar verificações finais
        runFinalVerifications();
        
        console.log('✅ Sistema Weber Lessa completamente inicializado!');
        
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        // Fallback de emergência
        emergencyFallback();
    }
};

// ========== CONFIGURAÇÃO DE SISTEMAS AUXILIARES ==========
function setupAuxiliarySystems() {
    console.log('🔧 Configurando sistemas auxiliares...');
    
    // 1. Formulário admin
    if (typeof setupForm === 'function') {
        setupForm();
    }
    
    // 2. Sistema de upload
    if (typeof setupUploadSystem === 'function') {
        setupUploadSystem();
    }
    
    // 3. Sistema de PDFs
    if (typeof setupPdfUploadSystem === 'function') {
        setupPdfUploadSystem();
    }
    
    // 4. Sistema de galeria
    if (typeof setupGalleryEvents === 'function') {
        setupGalleryEvents();
    }
    
    // 5. Otimização mobile
    if (typeof isMobileDevice === 'function' && isMobileDevice()) {
        console.log('📱 Dispositivo mobile detectado, otimizando...');
        if (typeof optimizeGalleryForMobile === 'function') {
            setTimeout(optimizeGalleryForMobile, 1000);
        }
    }
}

// ========== VERIFICAÇÕES FINAIS ==========
function runFinalVerifications() {
    console.log('🔍 Executando verificações finais...');
    
    // Verificar elementos críticos
    const criticalElements = [
        'properties-container',
        'adminPanel',
        'propertyForm'
    ];
    
    criticalElements.forEach(id => {
        console.log(`- ${id}: ${getCriticalElement(id) ? '✅' : '❌'}`);
    });
    
    // Verificar funções críticas
    const criticalFunctions = [
        'renderProperties',
        'openGallery',
        'toggleAdminPanel',
        'contactAgent'
    ];
    
    criticalFunctions.forEach(func => {
        console.log(`- ${func}(): ${typeof window[func] === 'function' ? '✅' : '❌'}`);
    });
    
    // Contar imóveis renderizados
    setTimeout(() => {
        const container = getCriticalElement('properties-container');
        if (container && container.children.length > 0) {
            console.log(`🎉 ${container.children.length} imóveis visíveis na página!`);
        } else {
            console.warn('⚠️ Nenhum imóvel visível! Tentando recuperação...');
            if (typeof renderProperties === 'function') {
                renderProperties();
            }
        }
    }, 500);
}

// ========== FALLBACK DE EMERGÊNCIA ==========
function emergencyFallback() {
    console.log('🚨 ATIVANDO MODO DE EMERGÊNCIA');
    
    // Tentar carregar dados básicos
    if (typeof getInitialProperties === 'function') {
        window.properties = getInitialProperties();
        console.log('✅ Dados básicos carregados (emergência)');
    }
    
    // Tentar renderizar
    if (typeof renderProperties === 'function' && window.properties && window.properties.length > 0) {
        renderProperties();
        console.log('✅ Renderização de emergência executada');
    }
    
    alert('⚠️ Sistema iniciado em modo de segurança. Algumas funcionalidades podem estar limitadas.');
}

// ========== PASSAGEM POR REFERÊNCIA (OTIMIZAÇÃO 4) ==========
const moduleStatuses = {};
function updateModuleStatus(moduleName, status) {
    // Modifica objeto existente por referência (eficiente)
    moduleStatuses[moduleName] = status;
    return moduleStatuses;
}

// ========== INICIALIZAÇÃO AUTOMÁTICA SEGURA ==========
function safeInitialize() {
    console.log('🔒 Inicialização segura iniciada...');
    
    // Verificar se módulos carregaram
    const loadedModules = performance.getEntriesByType('resource')
        .filter(r => r.name.includes('modules/'))
        .map(r => r.name.split('/').pop());
    
    console.log('📦 Módulos carregados:', loadedModules);
    
    // Verificar constantes críticas
    if (typeof SUPABASE_URL === 'undefined') {
        console.warn('⚠️ SUPABASE_URL não definido, aguardando utils.js...');
        // Aguardar mais tempo se necessário
        setTimeout(() => {
            if (typeof SUPABASE_URL !== 'undefined') {
                continueInitialization();
            } else {
                console.error('❌ SUPABASE_URL nunca carregou');
                emergencyFallback();
            }
        }, 500);
    } else {
        continueInitialization();
    }
    
    function continueInitialization() {
        if (typeof initializeWeberLessaSystem === 'function') {
            // Atualizar status por referência
            updateModuleStatus('main', 'initializing');
            initializeWeberLessaSystem().then(() => {
                updateModuleStatus('main', 'complete');
                
                // Testar filtros após inicialização
                setTimeout(() => {
                    if (typeof testFilters === 'function') {
                        testFilters();
                    }
                }, 1000);
            });
        } else {
            console.error('❌ initializeWeberLessaSystem não disponível');
            emergencyFallback();
        }
    }
}
// ========== TESTE INCREMENTAL (Passo 3) ==========
// Colocar NO FINAL do arquivo, APÓS todas as funções
console.log('🧪 TESTE 1: main.js carregado?', typeof safeInitialize === 'function');
console.log('🧪 TESTE 2: Otimizações ativas?', {
    cache: typeof getCriticalElement === 'function',
    inline: typeof checkCriticalElements === 'function',
    reference: typeof updateModuleStatus === 'function'
});

// Teste de inicialização manual (debug - opcional)
window.debugInitialize = function() {
    console.log('🧪 TESTE MANUAL: Executando inicialização...');
    if (typeof initializeWeberLessaSystem === 'function') {
        initializeWeberLessaSystem().then(() => {
            console.log('✅ TESTE MANUAL: Inicialização completa');
        }).catch(err => {
            console.error('❌ TESTE MANUAL: Erro:', err);
        });
    }
};

// ========== CORREÇÃO DOS FILTROS ==========
function setupFiltersFix() {
    console.log('🎛️ Configurando filtros corrigidos...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length === 0) {
        console.warn('⚠️ Botões de filtro não encontrados!');
        return;
    }
    
    filterButtons.forEach(button => {
        // Remover listeners antigos
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Re-aplicar listeners
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos os botões
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Obter o texto do filtro
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            console.log(`🎯 Filtrando por: ${filter}`);
            
            // Chamar renderProperties se existir
            if (typeof renderProperties === 'function') {
                renderProperties(filter);
            } else {
                console.error('❌ renderProperties() não disponível');
            }
        });
    });
    
    console.log(`✅ ${filterButtons.length} filtros configurados`);
}

// ========== INICIALIZAÇÃO CORRIGIDA ==========
// Modificar a função setupAuxiliarySystems para incluir filtros
const originalSetupAuxiliarySystems = setupAuxiliarySystems;
window.setupAuxiliarySystems = function() {
    console.log('🔧 Configurando sistemas auxiliares CORRIGIDOS...');
    
    // Chamar original
    if (typeof originalSetupAuxiliarySystems === 'function') {
        originalSetupAuxiliarySystems();
    }
    
    // Adicionar configuração dos filtros
    setupFiltersFix();
    
    // Se houver função setupFilters no properties.js, também chamar
    if (typeof setupFilters === 'function') {
        setupFilters();
    }
};

// ========== TESTE DOS FILTROS ==========
window.testFilters = function() {
    console.log('🧪 Testando filtros...');
    
    // Verificar se filtros existem
    const filtersContainer = document.querySelector('.filter-options');
    if (!filtersContainer) {
        console.error('❌ Container de filtros não encontrado!');
        return false;
    }
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    console.log(`✅ ${filterButtons.length} botões de filtro encontrados`);
    
    // Testar clique no primeiro filtro
    if (filterButtons.length > 0) {
        console.log('🧪 Simulando clique no filtro...');
        filterButtons[0].click();
    }
    
    return filterButtons.length > 0;
};

// ========== EXPORTAÇÃO ==========
console.log('✅ main.js completamente carregado e pronto');
