// js/modules/reader/pdf-unified.js - ESQUELETO INICIAL
console.log('📄 pdf-unified.js - Sistema PDF Consolidadado');

const PdfSystem = {
    // CONFIGURAÇÃO (centralizada)
    config: {
        password: "doc123",
        maxFiles: 5,
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['application/pdf'],
        supabaseUrl: 'https://syztbxvpdaplpetmixmt.supabase.co'
    },
    
    // ESTADO GLOBAL (única fonte de verdade)
    state: {
        files: [],           // PDFs novos
        existing: [],        // PDFs existentes
        isProcessing: false,
        currentPropertyId: null
    },
    
    // API PÚBLICA (interface consistente com MediaSystem)
    init() { /* inicialização */ },
    addFiles() { /* adicionar PDFs */ },
    loadExisting() { /* carregar existentes */ },
    removeFile() { /* remover PDF */ },
    uploadAll() { /* upload para Supabase */ },
    resetState() { /* limpar estado */ },
    
    // FUNÇÕES DE COMPATIBILIDADE (mantêm admin.js funcionando)
    processAndSavePdfs() { /* wrapper para uploadAll */ },
    clearAllPdfs() { /* wrapper para resetState */ },
    loadExistingPdfsForEdit() { /* wrapper para loadExisting */ },
    getPdfsToSave() { /* wrapper para uploadAll */ }
};

// Exportação global
window.PdfSystem = PdfSystem;
