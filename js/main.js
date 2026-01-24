// js/main.js - SISTEMA DE INICIALIZAÇÃO OTIMIZADO
console.log('🚀 main.js carregado - Sistema de Inicialização Otimizado');

/**
 * FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO OTIMIZADA
 * Aprimora o fluxo existente sem quebrar funcionalidades
 */
window.initializeWeberLessaSystem = async function() {
    console.log('⚙️ Inicializando Sistema Weber Lessa com otimizações...');
    
    // ✅ 1. LOADING INICIAL RÁPIDO (se disponível)
    let initLoading = null;
    const loadingStartTime = Date.now();
    
    if (window.LoadingManager && typeof window.LoadingManager.show === 'function') {
        initLoading = window.LoadingManager.show(
            'Iniciando Weber Lessa Imóveis...',
            'Carregando sistema completo...',
            { variant: 'processing' }
        );
        console.log('✅ Loading inicial ativado');
    }
    
    try {
        // ✅ 2. ATUALIZAR STATUS INTERMEDIÁRIO
        setTimeout(() => {
            initLoading?.updateMessage?.('Preparando módulos essenciais...');
        }, 400);
        
        // ✅ 3. EXECUTAR CARREGAMENTO DE IMÓVEIS (SISTEMA EXISTENTE)
        if (typeof window.loadPropertiesData === 'function') {
            console.log('🏠 Carregando imóveis via sistema existente...');
            await window.loadPropertiesData();
            console.log('✅ Imóveis carregados com sucesso');
        } else {
            console.error('❌ loadPropertiesData() não encontrado!');
        }
        
        // ✅ 4. ATUALIZAR STATUS APÓS IMÓVEIS
        initLoading?.updateMessage?.('Configurando interface...');
        
        // ✅ 5. CONFIGURAR FILTROS
        if (typeof window.setupFilters === 'function') {
            console.log('🎛️ Configurando filtros...');
            window.setupFilters();
            console.log('✅ Filtros configurados');
        }
        
        // ✅ 6. CONFIGURAR ADMIN
        if (typeof window.setupForm === 'function') {
            console.log('📝 Configurando formulário admin...');
            window.setupForm();
            console.log('✅ Formulário admin configurado');
        }
        
        // ✅ 7. CONFIGURAR GALERIA
        if (typeof window.setupGalleryEvents === 'function') {
            console.log('🎮 Configurando eventos da galeria...');
            window.setupGalleryEvents();
            console.log('✅ Galeria configurada');
        }
        
        // ✅ 8. OTIMIZAÇÃO: AGUARDAR IMAGENS PRINCIPAIS
        const imagesLoaded = await waitForCriticalImages();
        console.log(`🖼️ ${imagesLoaded} imagem(ns) principal(is) otimizada(s)`);
        
        // ✅ 9. FEEDBACK FINAL
        const totalTime = Date.now() - loadingStartTime;
        const propertyCount = window.properties ? window.properties.length : 0;
        
        console.log(`✅ Sistema completamente carregado em ${totalTime}ms`);
        console.log(`📊 ${propertyCount} imóveis disponíveis`);
        
        if (initLoading) {
            // Mensagem final personalizada baseada no resultado
            let finalMessage = '';
            if (propertyCount === 0) {
                finalMessage = 'Sistema pronto! Adicione seu primeiro imóvel 🏠';
            } else if (propertyCount <= 5) {
                finalMessage = `✨ ${propertyCount} oportunidade(s) disponível(eis)!`;
            } else {
                finalMessage = `🎯 ${propertyCount} oportunidades em Maceió!`;
            }
            
            initLoading.setVariant('success');
            initLoading.updateMessage(finalMessage);
        }
        
        // ✅ 10. TESTE DE INTEGRAÇÃO (APENAS DEBUG)
        setTimeout(() => {
            if (window.location.search.includes('debug=true')) {
                console.log('🧪 TESTE DE INTEGRAÇÃO OTIMIZADO:');
                const testResults = {
                    'Imóveis carregados': !!window.properties && window.properties.length > 0,
                    'Número de imóveis': window.properties ? window.properties.length : 0,
                    'Container encontrado': !!document.getElementById('properties-container'),
                    'Filtros ativos': document.querySelectorAll('.filter-btn.active').length > 0,
                    'Função renderProperties': typeof window.renderProperties === 'function',
                    'Função setupFilters': typeof window.setupFilters === 'function',
                    'Tempo total': `${totalTime}ms`,
                    'Imagens otimizadas': imagesLoaded
                };
                
                console.table(testResults);
            }
        }, 300);
        
    } catch (error) {
        console.error('❌ Erro na inicialização otimizada:', error);
        
        // ✅ 11. TRATAMENTO DE ERRO AMIGÁVEL
        if (initLoading) {
            initLoading.setVariant('error');
            initLoading.updateMessage('Sistema carregado com limitações');
            initLoading.updateTitle('Aviso de Inicialização');
        }
        
    } finally {
        // ✅ 12. FECHAR LOADING COM TRANSIÇÃO SUAVE
        setTimeout(() => {
            if (initLoading) {
                initLoading.hide();
                console.log('🎉 Loading inicial finalizado - Site 100% operacional');
            }
        }, 800);
    }
};

/**
 * FUNÇÃO AUXILIAR: AGUARDAR IMAGENS CRÍTICAS
 * Utiliza o ImageLoader do SharedCore quando disponível
 */
async function waitForCriticalImages() {
    return window.SharedCore?.ImageLoader?.waitForCriticalImages?.() || 0;
}

/**
 * FUNÇÃO DE COMPATIBILIDADE
 * Garante que o site funcione mesmo se partes do sistema falharem
 */
function ensureBasicFunctionality() {
    console.log('🔧 Verificando funcionalidade básica...');
    
    // Fallback para propriedades se não carregarem
    if (!window.properties || window.properties.length === 0) {
        const stored = localStorage.getItem('weberlessa_properties');
        if (stored) {
            try {
                window.properties = JSON.parse(stored);
                console.log(`✅ Recuperado ${window.properties.length} imóveis do localStorage`);
            } catch (e) {
                console.warn('⚠️ Não foi possível recuperar imóveis do localStorage');
            }
        }
    }
    
    // Fallback para renderização
    if (typeof window.renderProperties !== 'function') {
        console.warn('⚠️ renderProperties() não disponível - criando fallback básico');
        window.renderProperties = function(filter = 'todos') {
            const container = document.getElementById('properties-container');
            if (container) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">Imóveis carregando...</p>';
            }
        };
    }
}

/**
 * INICIALIZAÇÃO AUTOMÁTICA COM FALLBACKS ROBUSTOS
 * - Usa o sistema otimizado se disponível
 * - Tem fallbacks para garantir funcionalidade básica
 * - Totalmente compatível com o fluxo existente
 */
function startOptimizedInitialization() {
    console.log('🏁 Iniciando inicialização otimizada...');
    
    // Garantir funcionalidade básica primeiro
    ensureBasicFunctionality();
    
    // Se a função otimizada existe, usá-la
    if (typeof window.initializeWeberLessaSystem === 'function') {
        setTimeout(() => {
            window.initializeWeberLessaSystem();
        }, 200);
    } 
    // Fallback para o fluxo original
    else {
        console.log('⚠️ Usando inicialização fallback (fluxo original)...');
        
        // Tentar carregar propriedades diretamente
        if (typeof window.loadPropertiesData === 'function') {
            setTimeout(() => {
                window.loadPropertiesData().then(() => {
                    if (typeof window.setupFilters === 'function') {
                        window.setupFilters();
                    }
                    console.log('✅ Sistema inicializado via fallback');
                });
            }, 300);
        } else {
            console.error('❌ Nenhum sistema de inicialização disponível');
            // Último recurso: mostrar conteúdo básico
            document.body.style.opacity = '1';
        }
    }
}

/**
 * DETECTAR QUANDO INICIAR
 * - Aguarda DOM estar pronto
 * - Dá tempo para módulos carregarem
 * - Inicia de forma não-bloqueante
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM completamente carregado');
        
        // Pequeno delay para módulos essenciais carregarem
        setTimeout(startOptimizedInitialization, 150);
    });
} else {
    console.log('⚡ DOM já carregado - iniciando agora');
    setTimeout(startOptimizedInitialization, 150);
}

/**
 * MONITORAMENTO DE PERFORMANCE
 * - Mede tempo total de carregamento
 * - Detecta problemas de performance
 * - Loga métricas úteis
 */
setTimeout(() => {
    const perfData = {
        domReady: document.readyState,
        modulesLoaded: document.querySelectorAll('script[src*="modules/"]').length,
        loadingManagerAvailable: !!window.LoadingManager,
        propertiesAvailable: !!window.properties,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        connection: navigator.connection ? navigator.connection.effectiveType : 'desconhecido'
    };
    
    console.log('📊 Dados de performance:', perfData);
    
    // Apenas em debug, mostrar mais detalhes
    if (window.location.search.includes('debug=true')) {
        console.log('🔍 DEBUG - Estado do sistema:', {
            windowProperties: Object.keys(window).filter(k => k.includes('prop') || k.includes('load') || k.includes('init')),
            localStorageKeys: Object.keys(localStorage),
            scriptsLoaded: Array.from(document.scripts).map(s => s.src.split('/').pop())
        });
    }
}, 1000);

console.log('✅ main.js otimizado carregado - Sistema pronto para inicializar');
