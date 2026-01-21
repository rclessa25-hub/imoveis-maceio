// js/modules/reader/pdf-unified.js - VERSÃO DEFINITIVA - BOTÕES VISUALIZAR 100% FUNCIONAIS
console.log('📄 pdf-unified.js - VERSÃO DEFINITIVA - BOTÕES ATIVOS');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO ==========
    const CONFIG = {
        password: "doc123"
    };
    
    // ========== ESTADO ==========
    let state = {
        currentPropertyId: null,
        currentPropertyTitle: '',
        currentPdfUrls: []
    };
    
    // ========== FUNÇÃO CRÍTICA: CRIAR CONTÊINER COM EVENTOS FUNCIONAIS ==========
    function createDocumentListModal(propertyId, propertyTitle, pdfUrls) {
        console.log(`📋 Criando contêiner para ${pdfUrls.length} PDF(s)`);
        
        // Remover modal anterior se existir
        const oldModal = document.getElementById('pdfSelectionModal');
        if (oldModal) oldModal.remove();
        
        // Criar novo modal
        const modal = document.createElement('div');
        modal.id = 'pdfSelectionModal';
        modal.className = 'pdf-modal';
        modal.style.cssText = `
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
        
        // Gerar HTML da lista - SEM onclick inline
        const pdfListHtml = pdfUrls.map((url, index) => {
            const fileName = url.split('/').pop() || `Documento ${index + 1}`;
            const displayName = fileName.length > 35 ? fileName.substring(0, 32) + '...' : fileName;
            
            return `
                <div class="pdf-list-item" 
                     data-pdf-index="${index}"
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
                        border-left: 4px solid #1a5276;
                        transition: all 0.3s;
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
                    <button class="view-pdf-btn" 
                            data-pdf-index="${index}"
                            style="
                                background: #1a5276;
                                color: white;
                                border: none;
                                padding: 0.6rem 1.2rem;
                                border-radius: 5px;
                                cursor: pointer;
                                font-weight: 600;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                                transition: all 0.3s;
                            ">
                        <i class="fas fa-eye"></i> Visualizar
                    </button>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
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
                <button id="closeSelectionModalBtn"
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
                
                <h3 style="color: #1a5276; margin: 0 0 1.5rem 0; padding-right: 30px;">
                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                </h3>
                
                <p style="color: #666; margin-bottom: 1.5rem;">
                    <strong>${propertyTitle}</strong><br>
                    Selecione o documento que deseja visualizar:
                </p>
                
                <div id="pdfItemsContainer" style="margin-bottom: 1.5rem;">
                    ${pdfListHtml}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: #95a5a6;">
                        <i class="fas fa-info-circle"></i> Clique em "Visualizar" para abrir em nova aba
                    </small>
                    ${pdfUrls.length > 1 ? `
                        <button id="downloadAllPdfsBtn"
                                style="
                                    background: #27ae60;
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
        
        document.body.appendChild(modal);
        
        // ✅✅✅ CONFIGURAR EVENTOS DOS BOTÕES - MÉTODO GARANTIDO
        setTimeout(() => setupDocumentListEvents(pdfUrls), 50);
        
        console.log('✅✅✅ CONTÊINER CRIADO COM SUCESSO!');
        return modal;
    }
    
    // ✅✅✅ FUNÇÃO QUE GARANTE OS EVENTOS DOS BOTÕES
    function setupDocumentListEvents(pdfUrls) {
        console.log('🎮 Configurando eventos dos botões...');
        
        const modal = document.getElementById('pdfSelectionModal');
        if (!modal) {
            console.error('❌ Modal não encontrado!');
            return;
        }
        
        // 1. Botão Fechar (SIMPLES E DIRETO)
        const closeBtn = document.getElementById('closeSelectionModalBtn');
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.preventDefault();
                modal.style.display = 'none';
                console.log('❌ Contêiner fechado');
            };
        }
        
        // 2. Botões "Visualizar" - LOOP DIRETO GARANTIDO
        const viewButtons = modal.querySelectorAll('.view-pdf-btn');
        console.log(`🔍 Encontrados ${viewButtons.length} botões Visualizar`);
        
        viewButtons.forEach(button => {
            const index = parseInt(button.getAttribute('data-pdf-index'));
            const url = pdfUrls[index];
            
            if (url) {
                // REMOVER qualquer evento anterior
                button.onclick = null;
                
                // ADICIONAR evento DIRETO (100% garantido)
                button.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`📄 Clicou no botão Visualizar: PDF ${index + 1}`);
                    console.log(`🔗 URL: ${url}`);
                    window.open(url, '_blank');
                    return false;
                };
                
                console.log(`✅ Botão ${index} configurado para: ${url.substring(0, 50)}...`);
            }
        });
        
        // 3. Itens da lista (clicar no item inteiro também abre)
        const listItems = modal.querySelectorAll('.pdf-list-item');
        listItems.forEach(item => {
            const index = parseInt(item.getAttribute('data-pdf-index'));
            const url = pdfUrls[index];
            
            if (url) {
                item.onclick = function(e) {
                    // Não fazer nada se clicou no botão "Visualizar"
                    if (e.target.closest('.view-pdf-btn')) {
                        return;
                    }
                    
                    e.preventDefault();
                    console.log(`📄 Clicou no item: PDF ${index + 1}`);
                    window.open(url, '_blank');
                };
                
                // Efeitos hover
                item.onmouseenter = function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
                };
                
                item.onmouseleave = function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
                };
            }
        });
        
        // 4. Botão "Baixar Todos"
        const downloadBtn = document.getElementById('downloadAllPdfsBtn');
        if (downloadBtn && pdfUrls.length > 1) {
            downloadBtn.onclick = function(e) {
                e.preventDefault();
                downloadAllPdfs(pdfUrls);
            };
        }
        
        console.log(`🎉 ${viewButtons.length} botões configurados com SUCESSO!`);
        
        // TESTE AUTOMÁTICO - Verificar se os eventos estão ativos
        setTimeout(() => {
            const testButtons = modal.querySelectorAll('.view-pdf-btn');
            let activeCount = 0;
            testButtons.forEach(btn => {
                if (btn.onclick) activeCount++;
            });
            console.log(`🧪 TESTE: ${activeCount}/${testButtons.length} botões com eventos ativos`);
        }, 100);
    }
    
    // Função auxiliar para download
    function downloadAllPdfs(urls) {
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
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
                console.log(`✅ Download iniciado: ${fileName}`);
            } catch (error) {
                console.error(`❌ Erro ao baixar ${url}:`, error);
            }
        });
        
        alert(`✅ ${urls.length} documento(s) enviado(s) para download!`);
    }
    
    // ========== API PÚBLICA ==========
    const api = {
        init() {
            console.log('🔧 PdfSystem.init() - Sistema PDF inicializado');
            this.setupMainModalEvents();
            return this;
        },
        
        setupMainModalEvents() {
            console.log('🔧 Configurando eventos do modal principal...');
            
            // Botão Acessar
            const accessBtn = document.getElementById('pdfAccessBtn');
            if (accessBtn) {
                accessBtn.onclick = (e) => {
                    e.preventDefault();
                    this.validatePasswordAndShowList();
                };
            }
            
            // Botão Fechar
            const closeBtn = document.getElementById('pdfCloseBtn');
            if (closeBtn) {
                closeBtn.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById('pdfModal').style.display = 'none';
                };
            }
            
            // Permitir Enter no campo de senha
            const passwordInput = document.getElementById('pdfPassword');
            if (passwordInput) {
                passwordInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.validatePasswordAndShowList();
                    }
                };
            }
        },
        
        showModal(propertyId) {
            console.log(`📄 Abrindo modal para imóvel ${propertyId}`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }
            
            state.currentPropertyId = propertyId;
            state.currentPropertyTitle = property.title;
            
            // Atualizar título
            const titleElement = document.getElementById('pdfModalTitle');
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
            }
            
            // Mostrar modal e focar no campo
            const modal = document.getElementById('pdfModal');
            if (modal) {
                modal.style.display = 'flex';
                const passwordInput = document.getElementById('pdfPassword');
                if (passwordInput) {
                    passwordInput.value = '';
                    setTimeout(() => {
                        passwordInput.focus();
                        passwordInput.select();
                    }, 100);
                }
            }
            
            console.log('✅ Modal de senha exibido');
        },
        
        validatePasswordAndShowList() {
            console.log('🔓 Validando senha...');
            
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) {
                alert('Erro: campo de senha não encontrado');
                return;
            }
            
            const password = passwordInput.value.trim();
            if (!password) {
                alert('Digite a senha para acessar os documentos!');
                passwordInput.focus();
                return;
            }
            
            if (password !== CONFIG.password) {
                alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
                passwordInput.value = '';
                passwordInput.focus();
                return;
            }
            
            console.log('✅ Senha válida!');
            
            const propertyId = state.currentPropertyId;
            if (!propertyId) {
                alert('⚠️ Não foi possível identificar o imóvel');
                this.closeModal();
                return;
            }
            
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
            
            console.log(`✅ ${pdfUrls.length} documento(s) encontrado(s)`);
            
            // Fechar modal de senha
            this.closeModal();
            
            // Criar e mostrar contêiner com lista
            setTimeout(() => {
                createDocumentListModal(propertyId, property.title, pdfUrls);
            }, 300);
        },
        
        closeModal() {
            const modal = document.getElementById('pdfModal');
            if (modal) modal.style.display = 'none';
        },
        
        // Função pública para testes
        testButtons() {
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) {
                console.log('❌ Contêiner não está aberto');
                return;
            }
            
            const buttons = modal.querySelectorAll('.view-pdf-btn');
            console.log(`🧪 TESTANDO ${buttons.length} BOTÕES:`);
            
            buttons.forEach((btn, index) => {
                console.log(`Botão ${index}:`, {
                    temOnclick: !!btn.onclick,
                    dataIndex: btn.getAttribute('data-pdf-index'),
                    url: state.currentPdfUrls[btn.getAttribute('data-pdf-index')]
                });
            });
        }
    };
    
    return api;
})();

// ========== EXPORTAÇÃO GLOBAL ==========
window.PdfSystem = PdfSystem;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 DOM carregado - Inicializando PDF System...');
    
    setTimeout(() => {
        if (window.PdfSystem) {
            window.PdfSystem.init();
            console.log('✅ Sistema PDF inicializado!');
            console.log('🎯 Botões "Visualizar" estarão 100% funcionais!');
        }
    }, 1000);
});
