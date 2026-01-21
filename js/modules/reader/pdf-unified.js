// js/modules/reader/pdf-unified.js - VERSÃO DEFINITIVA COM RESPONSIVIDADE PARA MOBILE
console.log('📄 pdf-unified.js - VERSÃO DEFINITIVA COM RESPONSIVIDADE');

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
        console.log(`📋 Criando contêiner responsivo para ${pdfUrls.length} PDF(s)`);
        
        // Detectar se é dispositivo móvel
        const isMobile = window.innerWidth <= 768;
        console.log(`📱 Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'} (${window.innerWidth}px)`);
        
        // Remover modal anterior se existir
        const oldModal = document.getElementById('pdfSelectionModal');
        if (oldModal) oldModal.remove();
        
        // Criar novo modal com design responsivo
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
            align-items: ${isMobile ? 'flex-start' : 'center'};
            justify-content: center;
            padding: ${isMobile ? '10px' : '20px'};
            overflow-y: auto;
        `;
        
        // Gerar HTML da lista - DESIGN RESPONSIVO
        const pdfListHtml = pdfUrls.map((url, index) => {
            const fileName = url.split('/').pop() || `Documento ${index + 1}`;
            
            // TRATAMENTO ESPECIAL PARA MOBILE: nome mais curto
            let displayName;
            if (isMobile) {
                // Mobile: máximo 25 caracteres
                displayName = fileName.length > 25 
                    ? fileName.substring(0, 22) + '...' 
                    : fileName;
            } else {
                // Desktop: máximo 40 caracteres
                displayName = fileName.length > 40 
                    ? fileName.substring(0, 37) + '...' 
                    : fileName;
            }
            
            return `
                <div class="pdf-list-item" 
                     data-pdf-index="${index}"
                     style="
                        background: white;
                        border-radius: 8px;
                        padding: ${isMobile ? '0.8rem' : '1rem'};
                        margin-bottom: ${isMobile ? '0.6rem' : '0.8rem'};
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        cursor: pointer;
                        border-left: 4px solid #1a5276;
                        transition: all 0.3s;
                        flex-wrap: ${isMobile ? 'wrap' : 'nowrap'};
                        gap: ${isMobile ? '0.5rem' : '0'};
                     ">
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: ${isMobile ? '8px' : '10px'};">
                            <i class="fas fa-file-pdf" style="color: #e74c3c; font-size: ${isMobile ? '1.2rem' : '1.5rem'}; flex-shrink: 0;"></i>
                            <div style="min-width: 0;">
                                <strong style="
                                    display: block; 
                                    color: #2c3e50; 
                                    font-size: ${isMobile ? '0.9rem' : '1rem'};
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    max-width: ${isMobile ? '200px' : '300px'};
                                " title="${fileName}">
                                    ${displayName}
                                </strong>
                                <small style="color: #7f8c8d; font-size: ${isMobile ? '0.7rem' : '0.8rem'};">
                                    PDF • ${index + 1}/${pdfUrls.length}
                                </small>
                            </div>
                        </div>
                    </div>
                    <button class="view-pdf-btn" 
                            data-pdf-index="${index}"
                            style="
                                background: #1a5276;
                                color: white;
                                border: none;
                                padding: ${isMobile ? '0.5rem 1rem' : '0.6rem 1.2rem'};
                                border-radius: 5px;
                                cursor: pointer;
                                font-weight: 600;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                                transition: all 0.3s;
                                font-size: ${isMobile ? '0.85rem' : '0.9rem'};
                                white-space: nowrap;
                                flex-shrink: 0;
                            ">
                        <i class="fas fa-eye"></i> 
                        <span style="${isMobile ? 'display: none;' : ''}">Visualizar</span>
                        ${isMobile ? '<span>Ver</span>' : ''}
                    </button>
                </div>
            `;
        }).join('');
        
        // Dimensões responsivas do container
        const modalWidth = isMobile ? '95%' : '90%';
        const modalMaxWidth = isMobile ? '500px' : '600px';
        const modalPadding = isMobile ? '1.2rem' : '2rem';
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 10px;
                padding: ${modalPadding};
                max-width: ${modalMaxWidth};
                width: ${modalWidth};
                max-height: ${isMobile ? '90vh' : '80vh'};
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                margin-top: ${isMobile ? '20px' : '0'};
                margin-bottom: ${isMobile ? '20px' : '0'};
            ">
                <button id="closeSelectionModalBtn"
                        style="
                            position: absolute;
                            top: ${isMobile ? '8px' : '10px'};
                            right: ${isMobile ? '8px' : '10px'};
                            background: #e74c3c;
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: ${isMobile ? '28px' : '30px'};
                            height: ${isMobile ? '28px' : '30px'};
                            cursor: pointer;
                            font-size: ${isMobile ? '0.9rem' : '1rem'};
                            z-index: 10;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        "
                        aria-label="Fechar">
                    ×
                </button>
                
                <h3 style="
                    color: #1a5276; 
                    margin: 0 0 ${isMobile ? '1rem' : '1.5rem'} 0; 
                    padding-right: ${isMobile ? '25px' : '30px'};
                    font-size: ${isMobile ? '1.2rem' : '1.4rem'};
                    line-height: 1.3;
                ">
                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                </h3>
                
                <p style="
                    color: #666; 
                    margin-bottom: ${isMobile ? '1rem' : '1.5rem'};
                    font-size: ${isMobile ? '0.9rem' : '1rem'};
                    line-height: 1.4;
                ">
                    <strong>${propertyTitle}</strong><br>
                    Selecione o documento que deseja visualizar:
                </p>
                
                <div id="pdfItemsContainer" style="margin-bottom: ${isMobile ? '1.2rem' : '1.5rem'};">
                    ${pdfUrls.length > 0 ? pdfListHtml : `
                        <div style="text-align: center; padding: 2rem; color: #666;">
                            <i class="fas fa-file-pdf" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <p>Nenhum documento disponível</p>
                        </div>
                    `}
                </div>
                
                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    flex-wrap: wrap;
                    gap: ${isMobile ? '0.5rem' : '0'};
                ">
                    <small style="
                        color: #95a5a6; 
                        font-size: ${isMobile ? '0.75rem' : '0.8rem'};
                        ${isMobile ? 'order: 2; width: 100%; text-align: center; margin-top: 0.5rem;' : ''}
                    ">
                        <i class="fas fa-info-circle"></i> 
                        ${isMobile ? 'Toque para abrir' : 'Clique em "Visualizar" para abrir em nova aba'}
                    </small>
                    
                    ${pdfUrls.length > 1 ? `
                        <button id="downloadAllPdfsBtn"
                                style="
                                    background: #27ae60;
                                    color: white;
                                    border: none;
                                    padding: ${isMobile ? '0.5rem 1rem' : '0.6rem 1.2rem'};
                                    border-radius: 5px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    gap: 5px;
                                    font-size: ${isMobile ? '0.85rem' : '0.9rem'};
                                    ${isMobile ? 'order: 1;' : ''}
                                ">
                            <i class="fas fa-download"></i> 
                            <span>${isMobile ? 'Baixar' : 'Baixar Todos'}</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ✅✅✅ CONFIGURAR EVENTOS DOS BOTÕES - MÉTODO GARANTIDO
        setTimeout(() => setupDocumentListEvents(pdfUrls), 50);
        
        // Configurar comportamento responsivo
        setupResponsiveBehavior();
        
        console.log('✅✅✅ CONTÊINER RESPONSIVO CRIADO!');
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
    
    // ========== FUNÇÃO DE REDIMENSIONAMENTO DINÂMICO ==========
    function setupResponsiveBehavior() {
        console.log('🔄 Configurando comportamento responsivo...');
        
        // Função para ajustar layout quando a janela é redimensionada
        function handleResize() {
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) return;
            
            const isMobile = window.innerWidth <= 768;
            const container = modal.querySelector('div');
            
            if (container) {
                // Ajustar alinhamento
                modal.style.alignItems = isMobile ? 'flex-start' : 'center';
                modal.style.padding = isMobile ? '10px' : '20px';
                
                // Ajustar dimensões
                container.style.width = isMobile ? '95%' : '90%';
                container.style.maxWidth = isMobile ? '500px' : '600px';
                container.style.padding = isMobile ? '1.2rem' : '2rem';
                container.style.maxHeight = isMobile ? '90vh' : '80vh';
                container.style.marginTop = isMobile ? '20px' : '0';
                container.style.marginBottom = isMobile ? '20px' : '0';
                
                // Ajustar título
                const title = container.querySelector('h3');
                if (title) {
                    title.style.marginBottom = isMobile ? '1rem' : '1.5rem';
                    title.style.paddingRight = isMobile ? '25px' : '30px';
                    title.style.fontSize = isMobile ? '1.2rem' : '1.4rem';
                }
                
                // Ajustar parágrafo
                const paragraph = container.querySelector('p');
                if (paragraph) {
                    paragraph.style.marginBottom = isMobile ? '1rem' : '1.5rem';
                    paragraph.style.fontSize = isMobile ? '0.9rem' : '1rem';
                }
                
                // Ajustar itens da lista
                const listItems = container.querySelectorAll('.pdf-list-item');
                listItems.forEach(item => {
                    item.style.padding = isMobile ? '0.8rem' : '1rem';
                    item.style.marginBottom = isMobile ? '0.6rem' : '0.8rem';
                    item.style.flexWrap = isMobile ? 'wrap' : 'nowrap';
                    item.style.gap = isMobile ? '0.5rem' : '0';
                    
                    // Ajustar ícone
                    const icon = item.querySelector('.fa-file-pdf');
                    if (icon) {
                        icon.style.fontSize = isMobile ? '1.2rem' : '1.5rem';
                    }
                    
                    // Ajustar nome
                    const strong = item.querySelector('strong');
                    if (strong) {
                        strong.style.fontSize = isMobile ? '0.9rem' : '1rem';
                        strong.style.maxWidth = isMobile ? '200px' : '300px';
                    }
                    
                    // Ajustar small
                    const small = item.querySelector('small');
                    if (small) {
                        small.style.fontSize = isMobile ? '0.7rem' : '0.8rem';
                    }
                    
                    // Ajustar gap interno
                    const innerDiv = item.querySelector('div > div');
                    if (innerDiv) {
                        innerDiv.style.gap = isMobile ? '8px' : '10px';
                    }
                    
                    // Ajustar botão Visualizar
                    const button = item.querySelector('.view-pdf-btn');
                    if (button) {
                        button.style.padding = isMobile ? '0.5rem 1rem' : '0.6rem 1.2rem';
                        button.style.fontSize = isMobile ? '0.85rem' : '0.9rem';
                        
                        const span = button.querySelector('span');
                        if (span) {
                            if (isMobile) {
                                if (span.previousElementSibling && span.previousElementSibling.tagName === 'I') {
                                    span.previousElementSibling.style.marginRight = '0';
                                }
                                span.textContent = 'Ver';
                            } else {
                                if (span.previousElementSibling && span.previousElementSibling.tagName === 'I') {
                                    span.previousElementSibling.style.marginRight = '5px';
                                }
                                span.textContent = 'Visualizar';
                            }
                        }
                    }
                });
                
                // Ajustar botão Fechar
                const closeBtn = container.querySelector('#closeSelectionModalBtn');
                if (closeBtn) {
                    closeBtn.style.top = isMobile ? '8px' : '10px';
                    closeBtn.style.right = isMobile ? '8px' : '10px';
                    closeBtn.style.width = isMobile ? '28px' : '30px';
                    closeBtn.style.height = isMobile ? '28px' : '30px';
                    closeBtn.style.fontSize = isMobile ? '0.9rem' : '1rem';
                }
                
                // Ajustar container de itens
                const itemsContainer = container.querySelector('#pdfItemsContainer');
                if (itemsContainer) {
                    itemsContainer.style.marginBottom = isMobile ? '1.2rem' : '1.5rem';
                }
                
                // Ajustar footer
                const footer = container.querySelector('div > div:last-child');
                if (footer) {
                    footer.style.gap = isMobile ? '0.5rem' : '0';
                    
                    const small = footer.querySelector('small');
                    if (small && isMobile) {
                        small.style.order = '2';
                        small.style.width = '100%';
                        small.style.textAlign = 'center';
                        small.style.marginTop = '0.5rem';
                        small.style.fontSize = '0.75rem';
                    } else if (small) {
                        small.style.order = '';
                        small.style.width = '';
                        small.style.textAlign = '';
                        small.style.marginTop = '';
                        small.style.fontSize = '0.8rem';
                    }
                    
                    const downloadBtn = footer.querySelector('#downloadAllPdfsBtn');
                    if (downloadBtn) {
                        downloadBtn.style.padding = isMobile ? '0.5rem 1rem' : '0.6rem 1.2rem';
                        downloadBtn.style.fontSize = isMobile ? '0.85rem' : '0.9rem';
                        
                        if (isMobile) {
                            downloadBtn.style.order = '1';
                            const span = downloadBtn.querySelector('span');
                            if (span) span.textContent = 'Baixar';
                        } else {
                            downloadBtn.style.order = '';
                            const span = downloadBtn.querySelector('span');
                            if (span) span.textContent = 'Baixar Todos';
                        }
                    }
                }
            }
        }
        
        // Adicionar listener de redimensionamento
        window.addEventListener('resize', handleResize);
        
        // Executar uma vez para configurar estado inicial
        setTimeout(handleResize, 100);
        
        console.log('✅ Comportamento responsivo configurado');
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
