// js/main.js - SISTEMA DE INICIALIZAÇÃO
console.log('🚀 main.js carregado - Sistema de Inicialização');

// PATCH DE EMERGÊNCIA PARA PDFSYSTEM
(function fixPdfSystemModal() {
    'use strict';
    
    // Guardar função original
    const originalShowModal = window.PdfSystem?.showModal;
    
    if (originalShowModal) {
        // Substituir por versão corrigida
        window.PdfSystem.showModal = function(propertyId) {
            console.log(`🔧 PdfSystem.showModal CORRIGIDO chamado para: ${propertyId}`);
            
            // Chamar função original
            const result = originalShowModal.call(this, propertyId);
            
            // 🔴 CORREÇÃO: Garantir que o modal fique visível
            setTimeout(() => {
                const modal = document.getElementById('pdfViewerModal');
                if (modal) {
                    // REMOVER qualquer display: none
                    modal.style.display = 'flex';
                    modal.style.opacity = '1';
                    modal.style.visibility = 'visible';
                    
                    console.log('✅ Modal PDF forçado a ficar visível');
                    
                    // Scroll para o modal
                    modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
            
            return result;
        };
        
        console.log('🔧 Patch aplicado: PdfSystem.showModal corrigido');
    }
})();

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

// ========== FUNÇÃO ÚNICA PARA BOTÃO PDF ==========
window.handlePdfButtonClick = function(event, propertyId) {
    // 1. Prevenir comportamento padrão
    event.preventDefault();
    
    // 2. Log simples
    console.log('📄 PDF clicado para imóvel:', propertyId);
    
    // 3. Usar a função global showPdfModal se existir
    if (typeof window.showPdfModal === 'function') {
        window.showPdfModal(propertyId);
    } else {
        // Fallback básico
        const property = window.properties?.find(p => p.id == propertyId);
        if (property?.pdfs && property.pdfs !== 'EMPTY') {
            const password = prompt("🔒 Digite a senha para acessar os documentos:");
            if (password === "doc123") {
                const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
                if (pdfUrls.length > 0) {
                    window.open(pdfUrls[0], '_blank');
                }
            }
        }
    }
    
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

console.log('✅ main.js pronto para inicializar o sistema');
