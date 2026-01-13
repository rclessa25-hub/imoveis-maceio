// js/main.js - SISTEMA DE INICIALIZAÇÃO
console.log('🚀 main.js carregado - Sistema de Inicialização');

window.initializeWeberLessaSystem = async function() {
    console.log('⚙️ Inicializando Sistema Weber Lessa...');
    
    try {
        // 1. Carregar imóveis
        if (typeof window.initializeProperties === 'function') {
            console.log('🏠 Carregando imóveis...');
            await window.initializeProperties();
            console.log('✅ Imóveis carregados');
        } else {
            console.error('❌ initializeProperties() não encontrado!');
        }
        
        // 2. Configurar filtros
        if (typeof window.setupFilters === 'function') {
            console.log('🎛️ Configurando filtros...');
            window.setupFilters();
            console.log('✅ Filtros configurados');
        }
        
        // 3. Configurar admin
        if (typeof window.setupForm === 'function') {
            console.log('📝 Configurando formulário admin...');
            window.setupForm();
            console.log('✅ Formulário admin configurado');
        }
        
        // 4. Configurar galeria
        if (typeof window.setupGalleryEvents === 'function') {
            console.log('🎮 Configurando eventos da galeria...');
            window.setupGalleryEvents();
            console.log('✅ Galeria configurada');
        }
        
        console.log('✅ Sistema Weber Lessa completamente carregado!');
        
        // TESTE DE INTEGRAÇÃO
        setTimeout(() => {
            console.log('🧪 TESTE DE INTEGRAÇÃO:');
            const testResults = {
                'Imóveis carregados': !!window.properties && window.properties.length > 0,
                'Número de imóveis': window.properties ? window.properties.length : 0,
                'Container encontrado': !!document.getElementById('properties-container'),
                'Filtros ativos': document.querySelectorAll('.filter-btn').length > 0,
                'Função renderProperties': typeof window.renderProperties === 'function',
                'Função setupFilters': typeof window.setupFilters === 'function'
            };
            
            console.table(testResults);
        }, 500);
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
};

// ========== FUNÇÃO PARA MANIPULAR CLIQUE NO BOTÃO PDF ==========
window.handlePdfButtonClick = function(event, propertyId) {
    console.log('📄 Botão PDF clicado para imóvel:', propertyId);
    
    // 1. Parar propagação IMEDIATAMENTE
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
    
    // 2. Pequeno delay para garantir que o evento não se propague
    setTimeout(() => {
        // 3. Verificar se PdfSystem está disponível
        if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
            console.log('✅ Chamando PdfSystem.showModal()');
            window.PdfSystem.showModal(propertyId);
        } else {
            console.error('❌ PdfSystem não disponível');
            alert('Sistema de documentos temporariamente indisponível. Tente novamente em alguns instantes.');
        }
    }, 10);
    
    return false;
};
console.log('✅ main.js pronto para inicializar o sistema');
