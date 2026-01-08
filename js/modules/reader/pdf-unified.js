// js/modules/reader/pdf-unified.js - VERSÃO REFATORADA (ARQUITETURAL)
console.log('📄 pdf-unified.js - Sistema PDF Refatorado V1.3 (Cliente UI)');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO LEVE ==========
    const CONFIG = {
        password: window.PDF_PASSWORD || "doc123"
    };
    
    // ========== ESTADO MÍNIMO (APENAS UI) ==========
    let state = {
        currentPropertyId: null,
        modalElement: null
    };
    
    // ========== API PÚBLICA - DELEGAÇÃO AO MEDIASYSTEM ==========
    const api = {
        // INICIALIZAÇÃO LEVE
        init() {
            console.log('🔧 PdfSystem.init() - Inicializando como cliente UI');
            this.ensureModalExists();
            return this;
        },
        
        // ========== DELEGAÇÃO TOTAL AO MEDIASYSTEM ==========
        
        // Adicionar PDFs: Delegar ao MediaSystem
        addFiles(fileList) {
            console.log('📄 PdfSystem.addFiles() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                return window.MediaSystem.addPdfs(fileList);
            }
            console.warn('⚠️ MediaSystem não disponível para adicionar PDFs');
            return 0;
        },
        
        // Upload: Delegar ao MediaSystem
        async uploadAll(propertyId, propertyTitle) {
            console.log(`📄 PdfSystem.uploadAll() - Delegando ao MediaSystem para ${propertyId}`);
            if (window.MediaSystem && typeof window.MediaSystem.processAndSavePdfs === 'function') {
                return await window.MediaSystem.processAndSavePdfs(propertyId, propertyTitle);
            }
            console.warn('⚠️ MediaSystem não disponível para upload');
            return '';
        },
        
        // Reset state: Delegar ao MediaSystem
        resetState() {
            console.log('🧹 PdfSystem.resetState() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.clearAllPdfs === 'function') {
                window.MediaSystem.clearAllPdfs();
            }
            return this;
        },
        
        // Clear all PDFs: Delegar ao MediaSystem
        clearAllPdfs() {
            console.log('🧹 PdfSystem.clearAllPdfs() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.clearAllPdfs === 'function') {
                window.MediaSystem.clearAllPdfs();
            }
            return this;
        },
        
        // Load existing: Delegar ao MediaSystem
        loadExistingPdfsForEdit(property) {
            console.log('📄 PdfSystem.loadExistingPdfsForEdit() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.loadExistingPdfsForEdit === 'function') {
                return window.MediaSystem.loadExistingPdfsForEdit(property);
            }
            return this;
        },
        
        // ========== FUNÇÕES DE UI (RESPONSABILIDADE EXCLUSIVA) ==========
        
        // Modal de visualização (função principal)
        showModal(propertyId) {
            console.log(`📄 PdfSystem.showModal(${propertyId}) - Função UI principal`);
            // NÃO ALTERAR esta função - é o core do PdfSystem
            return window.ensurePdfModalExists(propertyId);
        },
        
        // Validação de senha (UI)
        validatePasswordAndShowList() {
            console.log('🔓 PdfSystem.validatePasswordAndShowList() - Função UI');
            return window.accessPdfDocuments();
        },
        
        // Fechar modal (UI)
        closeModal() {
            console.log('❌ PdfSystem.closeModal() - Função UI');
            const modal = document.getElementById('pdfModal');
            if (modal) modal.style.display = 'none';
            return this;
        },
        
        // Lista de seleção (UI)
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            console.log('📋 PdfSystem.showDocumentList() - Função UI');
            return window.showPdfSelectionList(propertyId, propertyTitle, pdfUrls);
        },
        
        // Download (UI)
        downloadAllPdfs(urls) {
            console.log(`📥 PdfSystem.downloadAllPdfs() - Função UI para ${urls.length} PDF(s)`);
            return window.downloadAllPdfs(urls);
        },
        
        // ========== COMPATIBILIDADE (WRAPPERS) ==========
        
        // Wrapper para getPdfsToSave
        async getPdfsToSave(propertyId) {
            console.log(`💾 PdfSystem.getPdfsToSave() - Wrapper para MediaSystem`);
            return await this.uploadAll(propertyId, 'Imóvel');
        },
        
        // Wrapper para processAndSavePdfs
        async processAndSavePdfs(propertyId, propertyTitle) {
            console.log(`📄 PdfSystem.processAndSavePdfs() - Wrapper para MediaSystem`);
            return await this.uploadAll(propertyId, propertyTitle);
        }
    };
    
    return api;
})();

// Exportação global (mantém compatibilidade)
window.PdfSystem = PdfSystem;

// Inicialização única (compatibilidade)
if (!window.pdfSystemInitialized) {
    window.pdfSystemInitialized = false;
    
    const initPdfSystem = function() {
        if (window.pdfSystemInitialized) return;
        if (typeof window.PdfSystem !== 'undefined') {
            window.PdfSystem.init();
            window.pdfSystemInitialized = true;
            console.log('✅ PdfSystem refatorado inicializado como cliente UI');
        }
    };
    
    // Inicializar após MediaSystem (CRÍTICO)
    setTimeout(() => {
        if (window.MediaSystem) {
            initPdfSystem();
        } else {
            console.log('⏳ Aguardando MediaSystem para inicializar PdfSystem...');
            setTimeout(initPdfSystem, 1000);
        }
    }, 1500);
}
