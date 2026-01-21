// js/modules/reader/pdf-unified.js - VERSÃO FINAL (COMPORTAMENTO ORIGINAL RESTAURADO)
console.log('📄 pdf-unified.js - VERSÃO FINAL - SEMPRE MOSTRAR CONTÊINER');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO ==========
    const CONFIG = {
        password: window.PDF_PASSWORD || "doc123"
    };
    
    // ========== ESTADO ==========
    let state = {
        currentPropertyId: null,
        currentPropertyTitle: '',
        currentPdfUrls: []
    };
    
    // ========== API PÚBLICA ==========
    const api = {
        init() {
            console.log('🔧 PdfSystem.init()');
            return this;
        },
        
        // ========== FUNÇÕES PRINCIPAIS ==========
        
        showModal(propertyId) {
            console.log(`📄 showModal(${propertyId})`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }
        
            // ✅ CRÍTICO: Armazenar estado
            state.currentPropertyId = propertyId;
            state.currentPropertyTitle = property.title;
            console.log('✅ Estado armazenado:', state.currentPropertyId);
        
            // Usar modal existente
            let modal = document.getElementById('pdfModal');
            if (!modal) {
                alert('Erro: sistema de documentos não disponível.');
                return;
            }
        
            // Configurar título
            const titleElement = document.getElementById('pdfModalTitle');
            const passwordInput = document.getElementById('pdfPassword');
            
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
                titleElement.dataset.propertyId = propertyId;
            }
            
            // Garantir campo visível
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.style.display = 'block';
                passwordInput.style.visibility = 'visible';
                passwordInput.style.opacity = '1';
            }
        
            modal.style.display = 'flex';
            
            setTimeout(() => {
                if (passwordInput) passwordInput.focus();
            }, 100);
        
            return modal;
        },

        // ✅✅✅ FUNÇÃO CRÍTICA - CORRIGIDA PARA SEMPRE MOSTRAR CONTÊINER
        validatePasswordAndShowList() {
            console.log('🔓 validatePasswordAndShowList() - INICIANDO');
            
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
            
            if (password !== CONFIG.password && password !== "doc123") {
                alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
                passwordInput.value = '';
                passwordInput.focus();
                return;
            }
            
            console.log('✅ Senha válida');
            
            // ✅ ESTRATÉGIA 1: Usar estado atual
            let propertyId = state.currentPropertyId;
            
            // ✅ ESTRATÉGIA 2: Buscar no título do modal
            if (!propertyId) {
                const titleElement = document.getElementById('pdfModalTitle');
                if (titleElement && titleElement.dataset.propertyId) {
                    propertyId = titleElement.dataset.propertyId;
                    console.log('✅ propertyId do dataset:', propertyId);
                }
            }
            
            if (!propertyId) {
                alert('⚠️ Não foi possível identificar o imóvel');
                this.closeModal();
                return;
            }
            
            console.log(`🔍 Buscando imóvel ID: ${propertyId}`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                this.closeModal();
                return;
            }
            
            if (!property.pdfs || property.pdfs === 'EMPTY') {
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
            
            // ✅✅✅ CRÍTICO: NÃO ABRIR PDFs AUTOMATICAMENTE
            // NÃO FAZER: window.open(pdfUrls[0], '_blank');
            
            // ✅✅✅ SEMPRE MOSTRAR CONTÊINER
            this.closeModal();
            
            // Pequeno delay para transição suave
            setTimeout(() => {
                this.showDocumentList(propertyId, property.title, pdfUrls);
            }, 300);
        },
        
        closeModal() {
            const modal = document.getElementById('pdfModal');
            if (modal) modal.style.display = 'none';
            return this;
        },
        
        // ✅✅✅ FUNÇÃO QUE SEMPRE MOSTRA O CONTÊINER
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            console.log(`📋 showDocumentList() - ${pdfUrls.length} documento(s)`);
            
            // Armazenar URLs
            state.currentPdfUrls = pdfUrls;
            
            // Remover modal anterior se existir
            let oldModal = document.getElementById('pdfSelectionModal');
            if (oldModal) oldModal.remove();
            
            // Criar novo modal
            const selectionModal = document.createElement('div');
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
            
            // ✅ Geração segura da lista SEM onclick inline
            const pdfListHtml = pdfUrls.map((url, index) => {
                const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
                const itemId = `pdf-item-${index}`;
                
                return `
                    <div id="${itemId}" class="pdf-list-item" style="
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
                        <button class="pdf-view-btn" data-pdf-index="${index}" 
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
                        ${pdfListHtml}
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
            
            document.body.appendChild(selectionModal);
            
            // ✅✅✅ CONFIGURAR EVENTOS DEPOIS de criar o HTML
            setTimeout(() => {
                this.setupPdfListEvents(pdfUrls);
            }, 50);
            
            selectionModal.style.display = 'flex';
            console.log('✅✅✅ CONTÊINER DE PDFs ABERTO COM SUCESSO!');
        },
        
        // ✅ Configuração segura de eventos
        setupPdfListEvents(pdfUrls) {
            console.log('🎮 Configurando eventos...');
            
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) return;
            
            // Botão Fechar
            const closeBtn = document.getElementById('closePdfListBtn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                    console.log('❌ Contêiner fechado');
                };
            }
            
            // Botões Visualizar
            const viewButtons = modal.querySelectorAll('.pdf-view-btn');
            viewButtons.forEach(button => {
                const index = button.getAttribute('data-pdf-index');
                if (index !== null && pdfUrls[index]) {
                    // Clone e substitui para limpar eventos
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    
                    // Adiciona evento
                    newButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log(`📄 Abrindo PDF ${index}: ${pdfUrls[index]}`);
                        window.open(pdfUrls[index], '_blank');
                    });
                }
            });
            
            // Itens da lista
            const listItems = modal.querySelectorAll('.pdf-list-item');
            listItems.forEach((item, index) => {
                if (pdfUrls[index]) {
                    item.addEventListener('click', (e) => {
                        if (e.target.closest('.pdf-view-btn')) return;
                        console.log(`📄 Abrindo PDF ${index} via clique no item`);
                        window.open(pdfUrls[index], '_blank');
                    });
                }
            });
            
            // Botão Baixar Todos
            const downloadBtn = document.getElementById('downloadAllPdfsBtn');
            if (downloadBtn && pdfUrls.length > 1) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadAllPdfs(pdfUrls);
                });
            }
            
            console.log(`✅ ${viewButtons.length} eventos configurados`);
        },
        
        downloadAllPdfs(urls) {
            console.log(`📥 Baixando ${urls.length} PDF(s)`);
            urls.forEach((url, index) => {
                try {
                    const fileName = url.split('/').pop() || `documento_${index + 1}.pdf`;
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log(`✅ Download: ${fileName}`);
                } catch (error) {
                    console.error(`❌ Erro: ${url}`, error);
                }
            });
            
            alert(`✅ ${urls.length} documento(s) enviado(s) para download!`);
        }
    };
    
    return api;
})();

// ========== EXPORTAÇÃO ==========
window.PdfSystem = PdfSystem;

// ========== FUNÇÕES GLOBAIS (para o modal HTML) ==========
window.accessPdfDocuments = function() {
    console.log('🔓 accessPdfDocuments() chamado');
    if (window.PdfSystem && window.PdfSystem.validatePasswordAndShowList) {
        return window.PdfSystem.validatePasswordAndShowList();
    }
    alert('Sistema de PDF não disponível');
};

window.closePdfModal = function() {
    const modal = document.getElementById('pdfModal');
    if (modal) modal.style.display = 'none';
};

// ========== INICIALIZAÇÃO ==========
if (!window.pdfSystemInitialized) {
    window.pdfSystemInitialized = true;
    setTimeout(() => {
        if (window.PdfSystem) {
            window.PdfSystem.init();
            console.log('✅ PdfSystem inicializado - CONTÊINER SEMPRE VISÍVEL');
        }
    }, 1000);
}
