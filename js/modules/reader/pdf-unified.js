// js/modules/reader/pdf-unified.js - VERSÃO REFATORADA (ARQUITETURAL) - COMPORTAMENTO ORIGINAL RESTAURADO
console.log('📄 pdf-unified.js - Sistema PDF Refatorado V1.4 (COMPORTAMENTO ORIGINAL)');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO LEVE ==========
    const CONFIG = {
        password: window.PDF_PASSWORD || "doc123"
    };
    
    // ========== ESTADO MÍNIMO (APENAS UI) ==========
    let state = {
        currentPropertyId: null,
        modalElement: null,
        currentPdfUrls: [],
        currentPropertyTitle: ''
    };
    
    // ========== API PÚBLICA - DELEGAÇÃO AO MEDIASYSTEM ==========
    const api = {
        // INICIALIZAÇÃO LEVE
        init() {
            console.log('🔧 PdfSystem.init() - Inicializando como cliente UI');
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
        
        // Modal de visualização (função principal) - USANDO MODAL EXISTENTE DO HTML
        showModal(propertyId) {
            console.log(`📄 PdfSystem.showModal(${propertyId}) - Função UI principal`);
            
            // 1. Buscar imóvel
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                console.error('❌ Imóvel não encontrado:', propertyId);
                alert('❌ Imóvel não encontrado!');
                return;
            }
        
            // 2. Armazenar estado atual
            state.currentPropertyId = propertyId;
            state.currentPropertyTitle = property.title;
            state.currentPdfUrls = [];
            
            // 3. Usar o modal JÁ EXISTENTE no HTML (linhas 418-440 do index.html)
            let modal = document.getElementById('pdfModal');
            
            if (!modal) {
                console.error('❌ Modal PDF não encontrado no HTML!');
                alert('Erro: sistema de documentos não disponível.');
                return;
            }
        
            // 4. Configurar título
            const titleElement = document.getElementById('pdfModalTitle');
            const passwordInput = document.getElementById('pdfPassword');
            
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
            }
            
            // 5. Garantir que o campo de senha está visível
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.style.display = 'block';
                passwordInput.style.visibility = 'visible';
                passwordInput.style.opacity = '1';
                passwordInput.style.width = '100%';
                passwordInput.style.margin = '1rem 0';
            }
        
            // 6. Exibir modal
            modal.style.display = 'flex';
        
            // 7. Focar no campo de senha
            setTimeout(() => {
                if (passwordInput) {
                    passwordInput.focus();
                    passwordInput.select();
                    console.log('✅ Modal aberto com foco no campo de senha');
                }
            }, 100);
        
            return modal;
        },

        // Validação de senha (UI) - ✅ COMPORTAMENTO ORIGINAL RESTAURADO
        validatePasswordAndShowList() {
            console.log('🔓 PdfSystem.validatePasswordAndShowList() - Função UI');
            
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) {
                alert('Erro: campo de senha não disponível');
                return;
            }
            
            const password = passwordInput.value.trim();
            if (!password) {
                alert('Digite a senha para acessar os documentos!');
                passwordInput.focus();
                return;
            }
            
            // Verificar senha
            if (password !== CONFIG.password && password !== "doc123") {
                alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
                passwordInput.value = '';
                passwordInput.focus();
                return;
            }
            
            console.log('✅ Senha válida! Buscando documentos...');
            
            // Buscar imóvel atual
            const propertyId = state.currentPropertyId;
            if (!propertyId) {
                alert('❌ Não foi possível identificar o imóvel');
                this.closeModal();
                return;
            }
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property || !property.pdfs || property.pdfs === 'EMPTY') {
                alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
                this.closeModal();
                return;
            }
            
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            if (pdfUrls.length === 0) {
                alert('ℹ️ Nenhum documento PDF disponível.');
                this.closeModal();
                return;
            }
            
            // ✅ COMPORTAMENTO ORIGINAL RESTAURADO: SEMPRE mostrar lista
            this.closeModal(); // Fechar modal de senha
            this.showDocumentList(propertyId, property.title, pdfUrls);
        },
        
        // Fechar modal de senha (UI)
        closeModal() {
            console.log('❌ PdfSystem.closeModal() - Fechando modal de senha');
            const modal = document.getElementById('pdfModal');
            if (modal) modal.style.display = 'none';
            return this;
        },
        
        // Fechar modal de lista (UI)
        closeDocumentList() {
            console.log('❌ PdfSystem.closeDocumentList() - Fechando lista de documentos');
            const modal = document.getElementById('pdfSelectionModal');
            if (modal) modal.style.display = 'none';
            return this;
        },
        
        // Lista de seleção (UI) - ✅ COMPORTAMENTO ORIGINAL: SEMPRE mostrar contêiner
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            console.log('📋 PdfSystem.showDocumentList() - Mostrando contêiner com lista');
            
            // Armazenar URLs no estado para uso posterior
            state.currentPdfUrls = pdfUrls;
            
            // Criar ou atualizar modal de seleção
            let selectionModal = document.getElementById('pdfSelectionModal');
            
            // Remover modal antigo se existir
            if (selectionModal) {
                selectionModal.remove();
            }
            
            // Criar novo modal
            selectionModal = document.createElement('div');
            selectionModal.id = 'pdfSelectionModal';
            selectionModal.className = 'pdf-modal';
            selectionModal.style.cssText = `
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10001;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;
            
            document.body.appendChild(selectionModal);
            
            // Gerar lista de documentos
            const pdfListHtml = pdfUrls.map((url, index) => {
                const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
                
                return `
                    <div class="pdf-list-item" data-pdf-url="${url}" style="
                        background: white;
                        border-radius: 8px;
                        padding: 1rem;
                        margin-bottom: 0.8rem;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        cursor: pointer;
                        border-left: 4px solid var(--primary);
                        transition: all 0.3s ease;
                    ">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-file-pdf" style="color: #e74c3c; font-size: 1.5rem;"></i>
                                <div>
                                    <strong style="display: block; color: #2c3e50;">${displayName}</strong>
                                    <small style="color: #7f8c8d;">PDF • Documento ${index + 1}/${pdfUrls.length}</small>
                                </div>
                            </div>
                        </div>
                        <button class="pdf-view-btn" data-pdf-url="${url}" 
                                style="
                                    background: var(--primary);
                                    color: white;
                                    border: none;
                                    padding: 0.6rem 1.2rem;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    display: flex;
                                    align-items: center;
                                    gap: 5px;
                                    transition: all 0.3s ease;
                                ">
                            <i class="fas fa-eye"></i> Visualizar
                        </button>
                    </div>
                `;
            }).join('');
            
            selectionModal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 10px;
                    padding: 2rem;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    animation: fadeIn 0.3s ease;
                ">
                    <button id="closePdfListBtn" style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        cursor: pointer;
                        font-size: 1rem;
                    ">
                        ×
                    </button>
                    
                    <h3 style="color: var(--primary); margin: 0 0 1.5rem 0;">
                        <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                    </h3>
                    
                    <p style="color: #666; margin-bottom: 1.5rem;">
                        <strong>${propertyTitle}</strong><br>
                        Selecione o documento que deseja visualizar:
                    </p>
                    
                    <div id="pdfListContainer" style="margin-bottom: 1.5rem;">
                        ${pdfUrls.length > 0 ? pdfListHtml : '<p style="text-align: center; color: #666;">Nenhum documento disponível</p>'}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <small style="color: #95a5a6;">
                            <i class="fas fa-info-circle"></i> Clique em "Visualizar" para abrir em nova aba
                        </small>
                        ${pdfUrls.length > 1 ? `
                            <button id="downloadAllPdfsBtn" 
                                    style="
                                        background: var(--success);
                                        color: white;
                                        border: none;
                                        padding: 0.6rem 1.2rem;
                                        border-radius: 5px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 5px;
                                    ">
                                <i class="fas fa-download"></i> Baixar Todos
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // ✅ CRÍTICO: Configurar eventos DEPOIS que o HTML foi inserido
            setTimeout(() => {
                this.setupPdfListEvents();
            }, 50);
            
            selectionModal.style.display = 'flex';
        },
        
        // ✅ Configurar eventos para a lista de PDFs
        setupPdfListEvents() {
            console.log('🎮 Configurando eventos para lista de PDFs...');
            
            const selectionModal = document.getElementById('pdfSelectionModal');
            if (!selectionModal) return;
            
            // 1. Botão Fechar
            const closeBtn = document.getElementById('closePdfListBtn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    selectionModal.style.display = 'none';
                };
            }
            
            // 2. Botões "Visualizar"
            const viewButtons = selectionModal.querySelectorAll('.pdf-view-btn');
            viewButtons.forEach(button => {
                const url = button.getAttribute('data-pdf-url');
                if (url) {
                    // Remover qualquer evento anterior
                    button.onclick = null;
                    
                    // Adicionar novo evento
                    button.onclick = (e) => {
                        e.stopPropagation();
                        console.log(`📄 Abrindo PDF: ${url}`);
                        window.open(url, '_blank');
                    };
                }
            });
            
            // 3. Itens da lista (clicar no item inteiro)
            const listItems = selectionModal.querySelectorAll('.pdf-list-item');
            listItems.forEach(item => {
                const url = item.getAttribute('data-pdf-url');
                if (url) {
                    item.onclick = (e) => {
                        // Não abrir se clicar no botão "Visualizar"
                        if (e.target.closest('.pdf-view-btn')) {
                            return;
                        }
                        console.log(`📄 Abrindo PDF via clique no item: ${url}`);
                        window.open(url, '_blank');
                    };
                    
                    // Efeitos hover
                    item.onmouseenter = () => {
                        item.style.transform = 'translateY(-2px)';
                        item.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
                    };
                    
                    item.onmouseleave = () => {
                        item.style.transform = 'translateY(0)';
                        item.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
                    };
                }
            });
            
            // 4. Botão "Baixar Todos"
            const downloadAllBtn = document.getElementById('downloadAllPdfsBtn');
            if (downloadAllBtn && state.currentPdfUrls.length > 1) {
                downloadAllBtn.onclick = () => {
                    this.downloadAllPdfs(state.currentPdfUrls);
                };
            }
            
            console.log(`✅ ${viewButtons.length} botões de PDF configurados`);
        },
        
        // Download (UI)
        downloadAllPdfs(urls) {
            console.log(`📥 PdfSystem.downloadAllPdfs() - Função UI para ${urls.length} PDF(s)`);
            let successCount = 0;
            
            urls.forEach((url, index) => {
                try {
                    const fileName = url.split('/').pop() || `documento_${index + 1}.pdf`;
                    const tempAnchor = document.createElement('a');
                    tempAnchor.href = url;
                    tempAnchor.download = fileName;
                    tempAnchor.style.display = 'none';
                    document.body.appendChild(tempAnchor);
                    tempAnchor.click();
                    document.body.removeChild(tempAnchor);
                    
                    successCount++;
                    console.log(`✅ Download iniciado: ${fileName}`);
                    
                } catch (error) {
                    console.error(`❌ Erro ao baixar ${url}:`, error);
                }
            });
            
            if (successCount > 0) {
                alert(`✅ ${successCount} documento(s) enviado(s) para download!\n\nVerifique a barra de downloads do seu navegador.`);
            }
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

// ========== FUNÇÕES GLOBAIS DE COMPATIBILIDADE ==========

// Função global para acessar documentos (usada pelo modal no HTML)
window.accessPdfDocuments = function() {
    console.log('🔓 accessPdfDocuments() - Função global chamada');
    
    // Usar PdfSystem se disponível
    if (window.PdfSystem && typeof window.PdfSystem.validatePasswordAndShowList === 'function') {
        return window.PdfSystem.validatePasswordAndShowList();
    }
    
    // Fallback básico
    const passwordInput = document.getElementById('pdfPassword');
    if (!passwordInput) {
        alert('Erro: campo de senha não disponível');
        return;
    }
    
    const password = passwordInput.value.trim();
    if (!password) {
        alert('Digite a senha para acessar os documentos!');
        passwordInput.focus();
        return;
    }
    
    if (password !== "doc123") {
        alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    
    // Se chegou aqui, a senha está correta
    // O comportamento correto será executado por validatePasswordAndShowList()
    console.log('✅ Senha válida via função global');
};

// Função global para fechar modal
window.closePdfModal = function() {
    console.log('❌ closePdfModal() - Função global');
    const modal = document.getElementById('pdfModal');
    if (modal) modal.style.display = 'none';
};

// ========== INICIALIZAÇÃO ÚNICA ==========
if (!window.pdfSystemInitialized) {
    window.pdfSystemInitialized = false;
    
    const initPdfSystem = function() {
        if (window.pdfSystemInitialized) return;
        if (typeof window.PdfSystem !== 'undefined') {
            window.PdfSystem.init();
            window.pdfSystemInitialized = true;
            console.log('✅ PdfSystem inicializado - COMPORTAMENTO ORIGINAL RESTAURADO');
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

// Adicionar estilo para animação
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
