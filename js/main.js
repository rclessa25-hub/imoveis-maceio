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

// ========== VERIFICAÇÃO DE SISTEMA SAUDÁVEL ==========
setTimeout(() => {
    console.group('🏥 VERIFICAÇÃO DE SAÚDE DO SISTEMA');
    
    // 1. Verificar sistemas essenciais
    const essentialSystems = {
        'SharedCore': typeof window.SharedCore,
        'MediaSystem': typeof window.MediaSystem,
        'PdfSystem': typeof window.PdfSystem,
        'properties (array)': Array.isArray(window.properties),
        'showPdfModal (função)': typeof window.showPdfModal
    };
    
    console.table(essentialSystems);
    
    // 2. Verificar duplicações
    const duplicateCheck = {};
    
    // Verificar funções duplicadas
    ['processAndSavePdfs', 'clearAllPdfs'].forEach(func => {
        const inGlobal = typeof window[func];
        const inMediaSystem = window.MediaSystem && typeof window.MediaSystem[func];
        duplicateCheck[func] = `Global: ${inGlobal}, MediaSystem: ${inMediaSystem}`;
    });
    
    console.log('🔍 Verificação de duplicações:', duplicateCheck);
    
    // 3. Recomendações
    const allEssentialOk = Object.values(essentialSystems).every(v => v !== 'undefined');
    
    if (allEssentialOk) {
        console.log('✅ SISTEMA SAUDÁVEL - Todos os módulos essenciais carregados');
    } else {
        console.warn('⚠️  ALGUNS MÓDULOS FALTANDO - Verificar ordem de carregamento');
    }
    
    console.groupEnd();
}, 3000); // Após 3 segundos

// ========== FUNÇÃO ÚNICA E SIMPLES PARA BOTÃO PDF ==========
window.pdfButtonHandler = function(event, propertyId) {
    // 1. Parar propagação IMEDIATAMENTE
    event.stopPropagation();
    event.preventDefault();
    
    // 2. Log para debug
    console.log('📄 PDF clicado para imóvel:', propertyId);
    
    // 3. Buscar imóvel
    const property = window.properties?.find(p => p.id == propertyId);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }
    
    // 4. Verificar se tem PDFs
    if (!property.pdfs || property.pdfs === 'EMPTY') {
        alert('ℹ️ Este imóvel não tem documentos disponíveis.');
        return false;
    }
    
    // 5. Senha simplificada (1 linha)
    const password = prompt("🔒 Digite a senha para acessar os documentos:\n\nSenha: doc123", "");
    
    if (password === "doc123") {
        // 6. Abrir PDFs (primeiro ou todos)
        const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
        if (pdfUrls.length === 1) {
            window.open(pdfUrls[0], '_blank');
        } else {
            pdfUrls.forEach((url, index) => {
                setTimeout(() => window.open(url, '_blank'), index * 100);
            });
        }
    } else if (password !== null) {
        alert('❌ Senha incorreta!\n\nA senha é: doc123');
    }
    
    return false;
};

console.log('✅ main.js pronto para inicializar o sistema');
