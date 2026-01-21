// js/modules/reader/pdf-unified.js - VERSÃO DEFINITIVA - COMPORTAMENTO ORIGINAL RESTAURADO
console.log('📄 pdf-unified.js - VERSÃO DEFINITIVA - FLUXO ORIGINAL GARANTIDO');

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
            console.log('🔧 PdfSystem.init() - Sistema PDF inicializado');
            this.setupGlobalEvents();
            return this;
        },
        
        // ========== CONFIGURAÇÃO DE EVENTOS GLOBAIS (CRÍTICO) ==========
        setupGlobalEvents() {
            console.log('🔧 Configurando eventos globais do PDF');
            
            // Remover qualquer evento anterior para evitar duplicação
            document.removeEventListener('click', this.handleGlobalClick);
            
            // Adicionar listener global para interceptar cliques
            document.addEventListener('click', this.handleGlobalClick.bind(this));
            
            console.log('✅ Eventos globais configurados');
        },
        
        // Handler para interceptar cliques
        handleGlobalClick(e) {
            // Verificar se é clique no botão "Acessar" do modal PDF
            if (e.target.closest('button') && 
                e.target.closest('button').getAttribute('onclick')?.includes('accessPdfDocuments')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Interceptando clique no botão Acessar');
                this.validatePasswordAndShowList();
            }
        },
        
        // ========== FUNÇÕES PRINCIPAIS ==========
        
        showModal(propertyId) {
            console.log(`📄 PdfSystem.showModal(${propertyId})`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }
        
            // ✅ Armazenar estado
            state.currentPropertyId = propertyId;
            state.currentPropertyTitle = property.title;
            console.log('✅ Estado armazenado:', { propertyId, title: property.title });
        
            // Usar modal existente
            let modal = document.getElementById('pdfModal');
            if (!modal) {
                console.error('❌ Modal PDF não encontrado!');
                alert('Erro: sistema de documentos não disponível.');
                return;
            }
        
            // Configurar título
            const titleElement = document.getElementById('pdfModalTitle');
            const passwordInput = document.getElementById('pdfPassword');
            
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
                // ✅ Backup no dataset
                titleElement.dataset.propertyId = propertyId;
                titleElement.dataset.propertyTitle = property.title;
            }
            
            // Limpar e focar campo de senha
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.style.display = 'block';
                passwordInput.style.visibility = 'visible';
                passwordInput.focus();
            }
        
            // Mostrar modal
            modal.style.display = 'flex';
            console.log('✅ Modal de senha exibido');
        },

        // ✅✅✅ FUNÇÃO CRÍTICA - COMPORTAMENTO ORIGINAL GARANTIDO
        validatePasswordAndShowList() {
            console.log('🔓 PdfSystem.validatePasswordAndShowList() - INICIANDO');
            
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) {
                alert('Erro: campo de senha não disponível');
                return;
            }
            
            const password = passwordInput.value.trim();
            console.log('🔐 Senha digitada:', password ? '***' : '(vazia)');
            
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
            
            console.log('✅ Senha válida!');
            
            // ✅ ESTRATÉGIA ROBUSTA para obter propertyId
            let propertyId = state.currentPropertyId;
            
            if (!propertyId) {
                console.warn('⚠️ propertyId não encontrado no estado, tentando estratégias alternativas...');
                
                const titleElement = document.getElementById('pdfModalTitle');
                if (titleElement && titleElement.dataset.propertyId) {
                    propertyId = titleElement.dataset.propertyId;
                    console.log('✅ propertyId recuperado do dataset:', propertyId);
                }
            }
            
            if (!propertyId) {
                alert('⚠️ Não foi possível identificar o imóvel. Por favor, tente novamente.');
                this.closeModal();
                return;
            }
            
            console.log(`🔍 Buscando imóvel ID: ${propertyId}`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado no sistema!');
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
            
            console.log(`✅ ${pdfUrls.length} documento(s) encontrado(s)`);
            
            // ✅✅✅ CRÍTICO: NUNCA abrir PDFs automaticamente
            // ✅✅✅ SEMPRE mostrar contêiner primeiro
            
            // Fechar modal de senha
            this.closeModal();
            
            // Pequeno delay para transição suave
            setTimeout(() => {
                this.showDocumentList(propertyId, property.title, pdfUrls);
            }, 300);
        },
        
        closeModal() {
            console.log('❌ Fechando modal de senha');
            const modal = document.getElementById('pdfModal');
            if (modal) {
                modal.style.display = 'none';
            }
        },
        
        // ✅✅✅ FUNÇÃO QUE SEMPRE MOSTRA O CONTÊINER
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            console.log(`📋 Abrindo contêiner com ${pdfUrls.length} documento(s)`);
            
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
                background: rgba(0,0,0,0.95);
                z-index: 10001;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;
            
            // Gerar lista de documentos SEM onclick inline
            const pdfListHtml = pdfUrls.map((url, index) => {
                const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
                const itemId = `pdf-item-${Date.now()}-${index}`;
                
                return `
                    <div id="${itemId}" class="pdf-list-item" 
                         data-pdf-url="${url}"
                         style="
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
                        <button class="pdf-view-btn" 
                                data-pdf-url="${url}"
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
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                ">
                    <button id="closePdfListBtn" 
                            style="
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
                                z-index: 10;
                            ">
                        ×
                    </button>
                    
                    <h3 style="color: var(--primary); margin: 0 0 1.5rem 0; padding-right: 30px;">
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
            
            // ✅ CONFIGURAR EVENTOS DEPOIS de criar o HTML
            setTimeout(() => {
                this.setupDocumentListEvents(pdfUrls);
            }, 50);
            
            console.log('✅✅✅ CONTÊINER DE PDFs ABERTO COM SUCESSO!');
        },
        
        // ✅ Configuração segura de eventos
        setupDocumentListEvents(pdfUrls) {
            console.log('🎮 Configurando eventos do contêiner...');
            
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) return;
            
            // 1. Botão Fechar
            const closeBtn = document.getElementById('closePdfListBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                    console.log('❌ Contêiner fechado');
                });
            }
            
            // 2. Botões "Visualizar"
            const viewButtons = modal.querySelectorAll('.pdf-view-btn');
            viewButtons.forEach(button => {
                const url = button.getAttribute('data-pdf-url');
                if (url) {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log(`📄 Abrindo PDF: ${url}`);
                        window.open(url, '_blank');
                    });
                }
            });
            
            // 3. Itens da lista
            const listItems = modal.querySelectorAll('.pdf-list-item');
            listItems.forEach(item => {
                const url = item.getAttribute('data-pdf-url');
                if (url) {
                    item.addEventListener('click', (e) => {
                        if (e.target.closest('.pdf-view-btn')) return;
                        console.log(`📄 Abrindo PDF via clique no item: ${url}`);
                        window.open(url, '_blank');
                    });
                }
            });
            
            // 4. Botão "Baixar Todos"
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

// ========== EXPORTAÇÃO GLOBAL ==========
window.PdfSystem = PdfSystem;

// ========== INICIALIZAÇÃO SEGURA ==========
if (!window.pdfSystemInitialized) {
    window.pdfSystemInitialized = true;
    
    setTimeout(() => {
        if (window.PdfSystem) {
            window.PdfSystem.init();
            console.log('✅ PdfSystem DEFINITIVO inicializado - COMPORTAMENTO ORIGINAL GARANTIDO');
        }
    }, 1000);
}

// ========== ADICIONAR ESTILOS DE ANIMAÇÃO ==========
if (!document.getElementById('pdf-animation-style')) {
    const style = document.createElement('style');
    style.id = 'pdf-animation-style';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .pdf-modal {
            animation: fadeIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}
