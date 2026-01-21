// js/modules/reader/pdf-unified.js - VERSÃO FINAL - BOTÕES VISUALIZAR FUNCIONANDO
console.log('📄 pdf-unified.js - VERSÃO FINAL - BOTÕES VISUALIZAR ATIVOS');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO ==========
    const CONFIG = {
        password: window.PDF_PASSWORD || "doc123"
    };
    
    // ========== ESTADO ==========
    let state = {
        currentPropertyId: null,
        currentPropertyTitle: '',
        currentPdfUrls: [],
        modalOpen: false,
        isProcessing: false
    };
    
    // ========== API PÚBLICA ==========
    const api = {
        init() {
            console.log('🔧 PdfSystem.init() - Sistema PDF inicializado');
            
            // Configurar eventos do modal principal
            this.setupMainModalEvents();
            
            return this;
        },
        
        // ========== CONFIGURAR EVENTOS DO MODAL PRINCIPAL ==========
        setupMainModalEvents() {
            console.log('🔧 Configurando eventos do modal principal...');
            
            const pdfAccessBtn = document.getElementById('pdfAccessBtn');
            const pdfCloseBtn = document.getElementById('pdfCloseBtn');
            
            // Configurar botão Acessar
            if (pdfAccessBtn) {
                console.log('✅ Configurando botão Acessar');
                
                // Remover event listeners anteriores
                const newAccessBtn = pdfAccessBtn.cloneNode(true);
                pdfAccessBtn.parentNode.replaceChild(newAccessBtn, pdfAccessBtn);
                
                // Adicionar novo event listener
                document.getElementById('pdfAccessBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Botão Acessar clicado');
                    this.validatePasswordAndShowList();
                });
            }
            
            // Configurar botão Fechar
            if (pdfCloseBtn) {
                console.log('✅ Configurando botão Fechar');
                
                const newCloseBtn = pdfCloseBtn.cloneNode(true);
                pdfCloseBtn.parentNode.replaceChild(newCloseBtn, pdfCloseBtn);
                
                document.getElementById('pdfCloseBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('❌ Botão Fechar clicado');
                    this.closeModal();
                });
            }
        },
        
        // ========== FUNÇÕES PRINCIPAIS ==========
        
        showModal(propertyId) {
            console.log(`📄 PdfSystem.showModal(${propertyId})`);
            
            // Evitar abrir múltiplos modais
            if (state.modalOpen) {
                console.log('⚠️ Modal já aberto, ignorando...');
                return;
            }
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }
        
            // ✅ Armazenar estado
            state.currentPropertyId = propertyId;
            state.currentPropertyTitle = property.title;
            state.modalOpen = true;
            
            console.log('✅ Estado armazenado:', { 
                propertyId, 
                title: property.title 
            });
        
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
                setTimeout(() => {
                    passwordInput.focus();
                    passwordInput.select();
                }, 100);
            }
        
            // Mostrar modal
            modal.style.display = 'flex';
            console.log('✅ Modal de senha exibido');
        },

        // ✅✅✅ FUNÇÃO CRÍTICA - SEM POP-UPS AUTOMÁTICOS
        validatePasswordAndShowList() {
            console.log('🔓 validatePasswordAndShowList() - INICIANDO');
            
            // Verificar se já está processando (evitar duplicação)
            if (state.isProcessing) {
                console.warn('⚠️ Validação já em andamento, ignorando...');
                return;
            }
            
            state.isProcessing = true;
            
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) {
                alert('Erro: campo de senha não disponível');
                state.isProcessing = false;
                return;
            }
            
            const password = passwordInput.value.trim();
            console.log('🔐 Senha digitada:', password ? '***' : '(vazia)');
            
            if (!password) {
                alert('Digite a senha para acessar os documentos!');
                passwordInput.focus();
                state.isProcessing = false;
                return;
            }
            
            if (password !== CONFIG.password && password !== "doc123") {
                alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
                passwordInput.value = '';
                passwordInput.focus();
                state.isProcessing = false;
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
                state.isProcessing = false;
                return;
            }
            
            console.log(`🔍 Buscando imóvel ID: ${propertyId}`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado no sistema!');
                this.closeModal();
                state.isProcessing = false;
                return;
            }
            
            if (!property.pdfs || property.pdfs === 'EMPTY') {
                alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
                this.closeModal();
                state.isProcessing = false;
                return;
            }
            
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            if (pdfUrls.length === 0) {
                alert('ℹ️ Nenhum documento PDF disponível.');
                this.closeModal();
                state.isProcessing = false;
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
                state.isProcessing = false;
            }, 300);
        },
        
        closeModal() {
            console.log('❌ Fechando modal de senha');
            const modal = document.getElementById('pdfModal');
            if (modal) {
                modal.style.display = 'none';
                state.modalOpen = false;
            }
        },
        
        // ✅✅✅ FUNÇÃO QUE MOSTRA O CONTÊINER COM BOTÕES FUNCIONAIS
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            console.log(`📋 Abrindo contêiner com ${pdfUrls.length} documento(s)`);
            
            // Armazenar URLs
            state.currentPdfUrls = pdfUrls;
            
            // Remover modal anterior se existir
            let oldModal = document.getElementById('pdfSelectionModal');
            if (oldModal) {
                console.log('🗑️ Removendo modal anterior');
                oldModal.remove();
            }
            
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
            
            // Gerar lista de documentos COM IDs únicos
            const pdfListHtml = pdfUrls.map((url, index) => {
                const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
                const itemId = `pdf-item-${Date.now()}-${index}`;
                const btnId = `view-btn-${Date.now()}-${index}`;
                
                return `
                    <div id="${itemId}" class="pdf-list-item" 
                         data-pdf-url="${url}"
                         data-index="${index}"
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
                        <button id="${btnId}" class="pdf-view-btn" 
                                data-pdf-url="${url}"
                                data-index="${index}"
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
            
            // ✅ CONFIGURAR EVENTOS IMEDIATAMENTE
            this.setupDocumentListEvents(pdfUrls);
            
            console.log('✅✅✅ CONTÊINER DE PDFs ABERTO COM SUCESSO!');
        },
        
        // ✅✅✅ FUNÇÃO CORRIGIDA - EVENTOS FUNCIONANDO
        setupDocumentListEvents(pdfUrls) {
            console.log('🎮 Configurando eventos do contêiner...');
            
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) {
                console.error('❌ Modal não encontrado');
                return;
            }
            
            // 1. Botão Fechar (simples e direto)
            const closeBtn = document.getElementById('closePdfListBtn');
            if (closeBtn) {
                // Usar onclick direto (não precisa de clone)
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                    console.log('❌ Contêiner fechado');
                };
            }
            
            // 2. Botões "Visualizar" - USAR DELEGAÇÃO DE EVENTOS
            // Adicionar evento no container pai (melhor performance)
            const container = document.getElementById('pdfListContainer');
            if (container) {
                container.addEventListener('click', (e) => {
                    const viewBtn = e.target.closest('.pdf-view-btn');
                    if (viewBtn) {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = viewBtn.getAttribute('data-pdf-url');
                        const index = viewBtn.getAttribute('data-index');
                        if (url) {
                            console.log(`📄 Botão Visualizar clicado: PDF ${index} - ${url}`);
                            window.open(url, '_blank');
                        }
                    }
                    
                    // Também permitir clique no item inteiro
                    const listItem = e.target.closest('.pdf-list-item');
                    if (listItem && !e.target.closest('.pdf-view-btn')) {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = listItem.getAttribute('data-pdf-url');
                        const index = listItem.getAttribute('data-index');
                        if (url) {
                            console.log(`📄 Item da lista clicado: PDF ${index} - ${url}`);
                            window.open(url, '_blank');
                        }
                    }
                });
            }
            
            // 3. Botão "Baixar Todos"
            const downloadBtn = document.getElementById('downloadAllPdfsBtn');
            if (downloadBtn && pdfUrls.length > 1) {
                downloadBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.downloadAllPdfs(pdfUrls);
                };
            }
            
            // 4. Adicionar efeitos hover (opcional)
            setTimeout(() => {
                const listItems = modal.querySelectorAll('.pdf-list-item');
                listItems.forEach(item => {
                    item.onmouseenter = () => {
                        item.style.transform = 'translateY(-2px)';
                        item.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
                    };
                    
                    item.onmouseleave = () => {
                        item.style.transform = 'translateY(0)';
                        item.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
                    };
                });
            }, 100);
            
            console.log(`✅ Eventos configurados para ${pdfUrls.length} PDF(s)`);
        },
        
        // Método alternativo SIMPLES para configurar eventos
        setupSimpleEvents(pdfUrls) {
            console.log('🎮 Configurando eventos SIMPLES...');
            
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) return;
            
            // Fechar modal
            const closeBtn = document.getElementById('closePdfListBtn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
            
            // Botões Visualizar - loop direto
            setTimeout(() => {
                const viewButtons = modal.querySelectorAll('.pdf-view-btn');
                console.log(`🔍 Encontrados ${viewButtons.length} botões Visualizar`);
                
                viewButtons.forEach((btn, index) => {
                    const url = pdfUrls[index];
                    if (url) {
                        // Configurar direto no onclick
                        btn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`📄 Abrindo PDF ${index}: ${url}`);
                            window.open(url, '_blank');
                        };
                    }
                });
                
                // Itens da lista
                const listItems = modal.querySelectorAll('.pdf-list-item');
                listItems.forEach((item, index) => {
                    const url = pdfUrls[index];
                    if (url) {
                        item.onclick = (e) => {
                            if (e.target.closest('.pdf-view-btn')) return;
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`📄 Abrindo PDF via item ${index}`);
                            window.open(url, '_blank');
                        };
                    }
                });
            }, 100);
            
            // Baixar Todos
            const downloadBtn = document.getElementById('downloadAllPdfsBtn');
            if (downloadBtn) {
                downloadBtn.onclick = (e) => {
                    e.preventDefault();
                    this.downloadAllPdfs(pdfUrls);
                };
            }
        },
        
        downloadAllPdfs(urls) {
            console.log(`📥 Baixando ${urls.length} PDF(s)`);
            let count = 0;
            
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
                    count++;
                    console.log(`✅ Download: ${fileName}`);
                } catch (error) {
                    console.error(`❌ Erro ao baixar ${url}:`, error);
                }
            });
            
            if (count > 0) {
                alert(`✅ ${count} documento(s) enviado(s) para download!`);
            }
        }
    };
    
    return api;
})();

// ========== EXPORTAÇÃO GLOBAL ==========
window.PdfSystem = PdfSystem;

// ========== INICIALIZAÇÃO SEGURA ==========
if (!window.pdfSystemInitialized) {
    window.pdfSystemInitialized = true;
    
    // Esperar DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.PdfSystem) {
                    window.PdfSystem.init();
                    console.log('✅ PdfSystem inicializado - BOTÕES VISUALIZAR ATIVOS');
                }
            }, 1000);
        });
    } else {
        setTimeout(() => {
            if (window.PdfSystem) {
                window.PdfSystem.init();
                console.log('✅ PdfSystem inicializado - BOTÕES VISUALIZAR ATIVOS');
            }
        }, 1000);
    }
}
