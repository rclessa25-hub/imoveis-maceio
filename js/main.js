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
console.log('✅ main.js pronto para inicializar o sistema');
