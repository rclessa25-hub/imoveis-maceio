// js/modules/reader/pdf-unified.js - VERSÃO ULTRA-GARANTIDA - CAMPO DE SENHA 100% FUNCIONAL
console.log('📄 pdf-unified.js - VERSÃO ULTRA-GARANTIDA - SENHA FUNCIONANDO');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO ==========
    const CONFIG = {
        password: "doc123" // SENHA FIXA PARA GARANTIR
    };
    
    // ========== ESTADO ==========
    let state = {
        currentPropertyId: null,
        currentPropertyTitle: '',
        currentPdfUrls: [],
        modalOpen: false
    };
    
    // ========== FUNÇÕES AUXILIARES ==========
    function focusPasswordField() {
        const passwordInput = document.getElementById('pdfPassword');
        if (passwordInput) {
            console.log('🎯 Focando no campo de senha...');
            passwordInput.focus();
            passwordInput.select();
            
            // Verificar se realmente está focável
            setTimeout(() => {
                if (document.activeElement === passwordInput) {
                    console.log('✅ Campo de senha FOCOU com sucesso!');
                } else {
                    console.warn('⚠️ Campo de senha não focou, tentando novamente...');
                    passwordInput.focus();
                }
            }, 100);
        } else {
            console.error('❌ Campo de senha não encontrado!');
        }
    }
    
    function showPasswordModal() {
        const modal = document.getElementById('pdfModal');
        if (modal) {
            console.log('🔓 Exibindo modal de senha...');
            
            // Garantir que o modal está visível
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            
            // Garantir que o campo de senha está 100% visível
            const passwordInput = document.getElementById('pdfPassword');
            if (passwordInput) {
                passwordInput.style.display = 'block';
                passwordInput.style.visibility = 'visible';
                passwordInput.style.opacity = '1';
                passwordInput.style.width = '100%';
                passwordInput.style.height = 'auto';
                passwordInput.style.position = 'static';
                passwordInput.value = ''; // Limpar campo
                
                // Forçar redisplay (às vezes o navegador buga)
                passwordInput.style.display = 'none';
                setTimeout(() => {
                    passwordInput.style.display = 'block';
                    focusPasswordField();
                }, 10);
            }
            
            console.log('✅ Modal de senha exibido com sucesso!');
        } else {
            console.error('❌ Modal PDF não encontrado!');
        }
    }
    
    // ========== API PÚBLICA ==========
    const api = {
        init() {
            console.log('🔧 PdfSystem.init() - Sistema PDF inicializado');
            
            // Configurar eventos UMA VEZ
            this.setupModalEvents();
            
            // Garantir que o modal existe e está configurado
            this.ensureModalExists();
            
            return this;
        },
        
        ensureModalExists() {
            console.log('🔍 Verificando se modal existe...');
            
            let modal = document.getElementById('pdfModal');
            if (!modal) {
                console.warn('⚠️ Modal não encontrado, criando...');
                this.createEmergencyModal();
            } else {
                console.log('✅ Modal encontrado no HTML');
                
                // Garantir que o campo de senha existe
                const passwordInput = document.getElementById('pdfPassword');
                if (!passwordInput) {
                    console.error('❌ Campo de senha não encontrado no modal!');
                    this.createEmergencyModal();
                } else {
                    console.log('✅ Campo de senha encontrado');
                }
            }
        },
        
        createEmergencyModal() {
            console.log('🚨 CRIANDO MODAL DE EMERGÊNCIA...');
            
            // Remover modal antigo se existir
            const oldModal = document.getElementById('pdfModal');
            if (oldModal) oldModal.remove();
            
            // Criar novo modal com ESTILOS INLINE (100% garantido)
            const modal = document.createElement('div');
            modal.id = 'pdfModal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 10000;
                align-items: center;
                justify-content: center;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 10px;
                    padding: 2rem;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                ">
                    <h3 id="pdfModalTitle" style="
                        color: #1a5276;
                        margin: 0 0 1rem 0;
                        font-size: 1.4rem;
                    ">
                        <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                    </h3>
                    
                    <div style="
                        margin: 1rem 0;
                        padding: 1rem;
                        background: #f8f9fa;
                        border-radius: 5px;
                        font-size: 0.9rem;
                        color: #666;
                    ">
                        <p>Digite a senha para visualizar os documentos</p>
                    </div>
                    
                    <!-- ✅✅✅ CAMPO DE SENHA GARANTIDO -->
                    <input type="password" 
                           id="pdfPassword" 
                           placeholder="Digite a senha: doc123"
                           style="
                               width: 100% !important;
                               padding: 0.9rem !important;
                               border: 2px solid #3498db !important;
                               border-radius: 5px !important;
                               margin: 1rem 0 !important;
                               font-size: 1rem !important;
                               display: block !important;
                               visibility: visible !important;
                               opacity: 1 !important;
                               background: white !important;
                               color: #333 !important;
                           "
                           autocomplete="off">
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button id="pdfAccessBtn"
                                style="
                                    background: #1a5276;
                                    color: white;
                                    padding: 0.9rem 1.5rem;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    flex: 1;
                                    font-size: 1rem;
                                    font-weight: 600;
                                ">
                            <i class="fas fa-lock-open"></i> Acessar
                        </button>
                        
                        <button id="pdfCloseBtn"
                                style="
                                    background: #95a5a6;
                                    color: white;
                                    padding: 0.9rem 1.5rem;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: pointer;
                                ">
                            <i class="fas fa-times"></i> Fechar
                        </button>
                    </div>
                    
                    <p style="
                        font-size: 0.8rem;
                        color: #666;
                        margin-top: 1.5rem;
                    ">
                        <i class="fas fa-info-circle"></i> Senha: <strong>doc123</strong>
                    </p>
                </div>
            `;
            
            document.body.appendChild(modal);
            console.log('✅ Modal de emergência criado!');
            
            // Configurar eventos do novo modal
            this.setupModalEvents();
        },
        
        setupModalEvents() {
            console.log('🔧 Configurando eventos do modal...');
            
            // Botão Acessar
            const accessBtn = document.getElementById('pdfAccessBtn');
            if (accessBtn) {
                console.log('✅ Configurando botão Acessar');
                
                // Remover qualquer evento anterior
                accessBtn.onclick = null;
                
                // Adicionar evento SIMPLES E DIRETO
                accessBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Botão Acessar CLICADO!');
                    this.validatePasswordAndShowList();
                    return false;
                };
            }
            
            // Botão Fechar
            const closeBtn = document.getElementById('pdfCloseBtn');
            if (closeBtn) {
                console.log('✅ Configurando botão Fechar');
                closeBtn.onclick = (e) => {
                    e.preventDefault();
                    const modal = document.getElementById('pdfModal');
                    if (modal) modal.style.display = 'none';
                };
            }
            
            // Permitir Enter no campo de senha
            const passwordInput = document.getElementById('pdfPassword');
            if (passwordInput) {
                passwordInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        console.log('↵ Enter pressionado no campo de senha');
                        this.validatePasswordAndShowList();
                    }
                };
            }
        },
        
        // ========== FUNÇÃO PRINCIPAL - ABRIR MODAL ==========
        showModal(propertyId) {
            console.log(`📄 ABRINDO MODAL para imóvel ${propertyId}`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }
        
            // Armazenar estado
            state.currentPropertyId = propertyId;
            state.currentPropertyTitle = property.title;
            state.modalOpen = true;
            
            console.log('📋 Dados do imóvel:', {
                id: propertyId,
                title: property.title,
                temPDFs: !!(property.pdfs && property.pdfs !== 'EMPTY')
            });
        
            // Atualizar título
            const titleElement = document.getElementById('pdfModalTitle');
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
                titleElement.dataset.propertyId = propertyId;
            }
        
            // MOSTRAR MODAL E FOCAR NO CAMPO
            showPasswordModal();
            
            return true;
        },
        
        // ========== VALIDAÇÃO DE SENHA ==========
        validatePasswordAndShowList() {
            console.log('🔓 VALIDANDO SENHA...');
            
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) {
                alert('❌ Erro: campo de senha não encontrado!');
                return;
            }
            
            const password = passwordInput.value.trim();
            console.log('🔐 Senha digitada:', password || '(vazio)');
            
            if (!password) {
                alert('⚠️ Digite a senha para acessar os documentos!');
                focusPasswordField();
                return;
            }
            
            if (password !== CONFIG.password) {
                alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
                passwordInput.value = '';
                focusPasswordField();
                return;
            }
            
            console.log('✅ SENHA CORRETA!');
            
            // Buscar imóvel
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
            
            // Verificar se tem PDFs
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
            
            // Abrir contêiner com lista
            setTimeout(() => {
                this.showDocumentList(propertyId, property.title, pdfUrls);
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
        
        // ========== CONTÊINER COM LISTA DE PDFs ==========
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            console.log(`📋 Mostrando lista com ${pdfUrls.length} PDF(s)`);
            
            // Remover contêiner anterior
            const oldModal = document.getElementById('pdfSelectionModal');
            if (oldModal) oldModal.remove();
            
            // Criar novo contêiner
            const modal = document.createElement('div');
            modal.id = 'pdfSelectionModal';
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
            
            // Gerar lista
            const itemsHtml = pdfUrls.map((url, index) => {
                const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                const shortName = fileName.length > 35 ? fileName.substring(0, 32) + '...' : fileName;
                
                return `
                    <div class="pdf-item" 
                         onclick="window.open('${url}', '_blank')"
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
                         "
                         onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 5px 15px rgba(0,0,0,0.15)'"
                         onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 3px 10px rgba(0,0,0,0.1)'">
                        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-file-pdf" style="color: #e74c3c; font-size: 1.5rem;"></i>
                            <div>
                                <strong style="display: block; color: #2c3e50;">${shortName}</strong>
                                <small style="color: #7f8c8d;">PDF • ${index + 1}/${pdfUrls.length}</small>
                            </div>
                        </div>
                        <button onclick="event.stopPropagation(); window.open('${url}', '_blank')"
                                style="
                                    background: #1a5276;
                                    color: white;
                                    border: none;
                                    padding: 0.6rem 1.2rem;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-weight: 600;
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
                ">
                    <button onclick="document.getElementById('pdfSelectionModal').style.display='none'"
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
                            ">
                        ×
                    </button>
                    
                    <h3 style="color: #1a5276; margin: 0 0 1.5rem 0;">
                        <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                    </h3>
                    
                    <p style="color: #666; margin-bottom: 1.5rem;">
                        <strong>${propertyTitle}</strong><br>
                        Selecione o documento que deseja visualizar:
                    </p>
                    
                    <div style="margin-bottom: 1.5rem;">
                        ${itemsHtml}
                    </div>
                    
                    ${pdfUrls.length > 1 ? `
                        <button onclick="PdfSystem.downloadAllPdfs(${JSON.stringify(pdfUrls)})"
                                style="
                                    background: #27ae60;
                                    color: white;
                                    border: none;
                                    padding: 0.6rem 1.2rem;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    float: right;
                                ">
                            <i class="fas fa-download"></i> Baixar Todos
                        </button>
                    ` : ''}
                </div>
            `;
            
            document.body.appendChild(modal);
            console.log('✅✅✅ CONTÊINER COM LISTA DE PDFs ABERTO!');
        },
        
        downloadAllPdfs(urls) {
            console.log(`📥 Iniciando download de ${urls.length} PDF(s)`);
            
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

// ========== INICIALIZAÇÃO GARANTIDA ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 DOM carregado - Inicializando sistema PDF...');
    
    // Esperar um pouco para garantir que tudo carregou
    setTimeout(() => {
        if (window.PdfSystem) {
            window.PdfSystem.init();
            console.log('🎉 SISTEMA PDF INICIALIZADO COM SUCESSO!');
            console.log('🔑 Senha configurada: doc123');
            console.log('📝 Campo de senha: PRONTO PARA DIGITAR!');
        } else {
            console.error('❌ ERRO CRÍTICO: PdfSystem não carregou!');
        }
    }, 1500);
});
