// js/modules/reader/pdf-integration.js
// SISTEMA DE INTEGRAÇÃO DO PDF COM OUTROS MÓDULOS

console.log('🔗 pdf-integration.js carregado - Integração entre módulos');

// ========== CONFIGURAÇÃO DE INTEGRAÇÃO ==========
const PDF_INTEGRATION_CONFIG = {
    autoInit: true,
    connectToAdmin: true,
    connectToProperties: true
};

// ========== INICIALIZAÇÃO DO SISTEMA ==========

// 4.6 Integração automática
window.setupPdfSupabaseIntegration = function() {
    console.log('🔗 Configurando integração do sistema PDF...');
    
    // Inicializar sistema básico de PDF
    if (typeof window.initPdfSystem === 'function') {
        window.initPdfSystem();
    }
    
    // Configurar teclas de atalho
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && typeof window.closePdfViewer === 'function') {
            window.closePdfViewer();
        }
    });
    
    // Fechar modal ao clicar fora
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('pdfViewerModal');
        if (modal && modal.style.display === 'flex' && e.target === modal) {
            if (typeof window.closePdfViewer === 'function') {
                window.closePdfViewer();
            }
        }
    });
    
    // ... RESTANTE DO CÓDIGO QUE VOCÊ JÁ TEM ...
    // (todo o código a partir da linha "window.savePdfsForProperty")
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
if (PDF_INTEGRATION_CONFIG.autoInit) {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (typeof window.setupPdfSupabaseIntegration === 'function') {
                window.setupPdfSupabaseIntegration();
                console.log('✅ Sistema de PDF integrado com outros módulos');
            }
        }, 1000);
    });
}

console.log('✅ pdf-integration.js pronto para integração');
