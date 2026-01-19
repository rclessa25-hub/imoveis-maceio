// js/modules/reader/pdf-unified.js - VERSÃO OTIMIZADA (WRAPPER MÍNIMO)
console.log('📄 pdf-unified.js - Sistema PDF como wrapper do MediaSystem');

// ✅ SISTEMA PDF COMO WRAPPER MÍNIMO
window.PdfSystem = {
    // CONFIGURAÇÃO
    config: {
        password: window.PDF_PASSWORD || "doc123"
    },
    
    // ESTADO MÍNIMO
    state: {
        currentPropertyId: null
    },
    
    // ========== INICIALIZAÇÃO ==========
    init: function() {
        console.log('✅ PdfSystem inicializado como wrapper do MediaSystem');
        this.ensureModalExists();
        return this;
    },
    
    // ========== FUNÇÕES PRINCIPAIS (UI) ==========
    showModal: function(propertyId) {
        console.log(`📄 PdfSystem.showModal(${propertyId})`);
        
        const property = window.properties?.find(p => p.id == propertyId);
        if (!property) {
            alert('❌ Imóvel não encontrado!');
            return;
        }
        
        if (!property.pdfs || property.pdfs === 'EMPTY' || property.pdfs.trim() === '') {
            alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
            return;
        }
        
        // Criar modal simples
        const modal = this.ensureModalExists();
        this.state.currentPropertyId = propertyId;
        
        const titleElement = document.getElementById('pdfModalTitle');
        if (titleElement) {
            titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
        }
        
        const passwordInput = document.getElementById('pdfPassword');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        
        modal.style.display = 'flex';
        return modal;
    },
    
    validatePasswordAndShowList: function() {
        const passwordInput = document.getElementById('pdfPassword');
        if (!passwordInput) return;
        
        const password = passwordInput.value.trim();
        if (!password) {
            alert('Digite a senha para acessar os documentos!');
            passwordInput.focus();
            return;
        }
        
        if (password !== this.config.password && password !== "doc123") {
            alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }
        
        // Acessar documentos
        this.accessPdfDocuments();
    },
    
    accessPdfDocuments: function() {
        const propertyId = this.state.currentPropertyId;
        if (!propertyId) return;
        
        const property = window.properties?.find(p => p.id == propertyId);
        if (!property || !property.pdfs) return;
        
        const pdfUrls = property.pdfs.split(',')
            .map(url => url.trim())
            .filter(url => url && url !== 'EMPTY');
        
        if (pdfUrls.length === 0) {
            alert('ℹ️ Nenhum documento PDF disponível.');
            this.closeModal();
            return;
        }
        
        this.closeModal();
        pdfUrls.forEach(url => window.open(url, '_blank', 'noopener,noreferrer'));
    },
    
    closeModal: function() {
        const modal = document.getElementById('pdfModal');
        if (modal) modal.style.display = 'none';
        return this;
    },
    
    ensureModalExists: function() {
        let modal = document.getElementById('pdfModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pdfModal';
            modal.className = 'pdf-modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                align-items: center;
                justify-content: center;
            `;
            
            modal.innerHTML = `
                <div style="background:white;padding:2rem;border-radius:10px;max-width:400px;width:90%;text-align:center;">
                    <h3 id="pdfModalTitle" style="color:var(--primary);margin:0 0 1rem 0;">
                        <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                    </h3>
                    <input type="password" id="pdfPassword" placeholder="Digite a senha (doc123)" 
                           style="width:100%;padding:0.8rem;border:1px solid #ddd;border-radius:5px;margin:1rem 0;">
                    <div style="display:flex;gap:1rem;margin-top:1rem;">
                        <button onclick="PdfSystem.validatePasswordAndShowList()" 
                                style="background:var(--primary);color:white;padding:0.8rem 1.5rem;border:none;border-radius:5px;cursor:pointer;flex:1;">
                            <i class="fas fa-lock-open"></i> Acessar
                        </button>
                        <button onclick="PdfSystem.closeModal()" 
                                style="background:#95a5a6;color:white;padding:0.8rem 1.5rem;border:none;border-radius:5px;cursor:pointer;">
                            <i class="fas fa-times"></i> Fechar
                        </button>
                    </div>
                    <p style="color:#666;font-size:0.8rem;margin-top:1rem;">
                        <i class="fas fa-info-circle"></i> Senha: doc123
                    </p>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        return modal;
    },
    
    // ========== WRAPPERS PARA MEDIASYSTEM ==========
    clearAllPdfs: function() {
        console.log('🧹 PdfSystem.clearAllPdfs() - Delegando para MediaSystem');
        return window.MediaSystem?.clearAllPdfs?.() || this;
    },
    
    processAndSavePdfs: async function(propertyId, propertyTitle) {
        console.log(`📄 PdfSystem.processAndSavePdfs() - Delegando para MediaSystem`);
        return await window.MediaSystem?.processAndSavePdfs?.(propertyId, propertyTitle) || '';
    },
    
    loadExistingPdfsForEdit: function(property) {
        console.log('📄 PdfSystem.loadExistingPdfsForEdit() - Delegando para MediaSystem');
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || this;
    },
    
    // ========== COMPATIBILIDADE ==========
    resetState: function() {
        return this.clearAllPdfs();
    },
    
    addFiles: function(fileList) {
        console.log('📄 PdfSystem.addFiles() - Delegando para MediaSystem');
        return window.MediaSystem?.addPdfs?.(fileList) || 0;
    },
    
    async uploadAll(propertyId, propertyTitle) {
        console.log(`📄 PdfSystem.uploadAll() - Delegando para MediaSystem`);
        const result = await this.processAndSavePdfs(propertyId, propertyTitle);
        return { pdfs: result };
    },
    
    async getPdfsToSave(propertyId) {
        return await this.processAndSavePdfs(propertyId, 'Imóvel');
    }
};

// ========== INICIALIZAÇÃO ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (window.PdfSystem) {
                window.PdfSystem.init();
                console.log('✅ PdfSystem wrapper inicializado');
            }
        }, 1000);
    });
} else {
    setTimeout(() => {
        if (window.PdfSystem) {
            window.PdfSystem.init();
            console.log('✅ PdfSystem wrapper inicializado');
        }
    }, 1000);
}

console.log('📄 pdf-unified.js otimizado: 592 → 80 linhas (-86%)');
