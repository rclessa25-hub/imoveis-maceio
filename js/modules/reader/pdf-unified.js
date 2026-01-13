// js/modules/reader/pdf-unified.js - VERSÃO REFATORADA (ARQUITETURAL) - CORRIGIDA

// Configuração SharedCore
const SC = window.SharedCore || {
    elementExists: (id) => document.getElementById(id) !== null,
    logModule: (module, msg) => console.log(`[${module}] ${msg}`)
};

SC.logModule('pdf', '📄 pdf-unified.js - Sistema PDF Refatorado V1.3 (Cliente UI)');

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
            SC.logModule('pdf', '🔧 PdfSystem.init() - Inicializando como cliente UI');
            this.ensureModalExists();
            return this;
        },
        
        // ========== DELEGAÇÃO TOTAL AO MEDIASYSTEM ==========
        
        // Adicionar PDFs: Delegar ao MediaSystem
        addFiles(fileList) {
            SC.logModule('pdf', '📄 PdfSystem.addFiles() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                return window.MediaSystem.addPdfs(fileList);
            }
            SC.logModule('pdf', '⚠️ MediaSystem não disponível para adicionar PDFs');
            return 0;
        },
        
        // Upload: Delegar ao MediaSystem
        async uploadAll(propertyId, propertyTitle) {
            SC.logModule('pdf', `📄 PdfSystem.uploadAll() - Delegando ao MediaSystem para ${propertyId}`);
            if (window.MediaSystem && typeof window.MediaSystem.processAndSavePdfs === 'function') {
                return await window.MediaSystem.processAndSavePdfs(propertyId, propertyTitle);
            }
            SC.logModule('pdf', '⚠️ MediaSystem não disponível para upload');
            return '';
        },
        
        // Reset state: Delegar ao MediaSystem
        resetState() {
            SC.logModule('pdf', '🧹 PdfSystem.resetState() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.clearAllPdfs === 'function') {
                window.MediaSystem.clearAllPdfs();
            }
            return this;
        },
        
        // Clear all PDFs: Delegar ao MediaSystem
        clearAllPdfs() {
            SC.logModule('pdf', '🧹 PdfSystem.clearAllPdfs() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.clearAllPdfs === 'function') {
                window.MediaSystem.clearAllPdfs();
            }
            return this;
        },
        
        // Load existing: Delegar ao MediaSystem
        loadExistingPdfsForEdit(property) {
            SC.logModule('pdf', '📄 PdfSystem.loadExistingPdfsForEdit() - Delegando ao MediaSystem');
            if (window.MediaSystem && typeof window.MediaSystem.loadExistingPdfsForEdit === 'function') {
                return window.MediaSystem.loadExistingPdfsForEdit(property);
            }
            return this;
        },
        
        // ========== FUNÇÕES DE UI (RESPONSABILIDADE EXCLUSIVA) ==========
        
        // Modal de visualização (função principal)
        showModal(propertyId) {
            SC.logModule('pdf', `📄 PdfSystem.showModal(${propertyId}) - Função UI principal`);
            // 1. Buscar imóvel
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                SC.logModule('pdf', '❌ Imóvel não encontrado:', propertyId);
                alert('❌ Imóvel não encontrado!');
                return;
            }
        
            // 2. GARANTIR que o modal COMPLETO existe com todos os elementos
            let modal = document.getElementById('pdfModal');
            
            // Se não existe ou está incompleto, recriar COMPLETAMENTE
            if (!modal || !SC.elementExists('pdfPassword')) {
                SC.logModule('pdf', '🔄 Criando modal PDF completo (campo de senha ausente)...');
                
                // Remover modal antigo se existir
                if (modal) {
                    modal.remove();
                }
                
                // Criar novo modal COMPLETO
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
                    background: rgba(0,0,0,0.95);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                `;
                
                // HTML COMPLETO com TODOS os elementos VISÍVEIS
                modal.innerHTML = `
                    <div class="pdf-modal-content" style="
                        background: white;
                        border-radius: 10px;
                        padding: 2rem;
                        max-width: 400px;
                        width: 90%;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    ">
                        <h3 id="pdfModalTitle" style="
                            color: var(--primary);
                            margin: 0 0 1rem 0;
                            padding-right: 30px;
                            font-size: 1.4rem;
                        ">
                            <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                        </h3>
                        
                        <div id="pdfPreview" style="
                            margin: 1rem 0;
                            padding: 1rem;
                            background: #f8f9fa;
                            border-radius: 5px;
                            font-size: 0.9rem;
                            color: #666;
                        ">
                            <p>Digite a senha para visualizar os documentos</p>
                        </div>
                        
                        <!-- ✅ CAMPO DE SENHA 100% VISÍVEL -->
                        <input type="password" 
                               id="pdfPassword" 
                               class="pdf-password-input"
                               placeholder="Digite a senha para acessar"
                               style="
                                   width: 100%;
                                   padding: 0.9rem;
                                   border: 1px solid #ddd;
                                   border-radius: 5px;
                                   margin: 1rem 0;
                                   font-size: 1rem;
                                   display: block !important;
                                   visibility: visible !important;
                                   opacity: 1 !important;
                               "
                               autocomplete="off">
                        
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                            <button onclick="PdfSystem.validatePasswordAndShowList()" 
                                    style="
                                        background: var(--primary);
                                        color: white;
                                        padding: 0.9rem 1.5rem;
                                        border: none;
                                        border-radius: 5px;
                                        cursor: pointer;
                                        flex: 1;
                                        font-size: 1rem;
                                        font-weight: 600;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 0.5rem;
                                    ">
                                <i class="fas fa-lock-open"></i> Acessar
                            </button>
                            
                            <button onclick="PdfSystem.closeModal()" 
                                    style="
                                        background: #95a5a6;
                                        color: white;
                                        padding: 0.9rem 1.5rem;
                                        border: none;
                                        border-radius: 5px;
                                        cursor: pointer;
                                        font-size: 1rem;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 0.5rem;
                                    ">
                                <i class="fas fa-times"></i> Fechar
                            </button>
                        </div>
                        
                        <p style="
                            font-size: 0.8rem;
                            color: #666;
                            margin-top: 1.5rem;
                            text-align: center;
                        ">
                            <i class="fas fa-info-circle"></i> Solicite a senha ao corretor
                        </p>
                    </div>
                `;
                
                document.body.appendChild(modal);
                SC.logModule('pdf', '✅ Modal PDF criado com campo de senha VISÍVEL');
            }
        
            // 3. Configurar título e armazenar propertyId
            state.currentPropertyId = propertyId;
            state.modalElement = modal;
        
            const titleElement = document.getElementById('pdfModalTitle');
            const passwordInput = document.getElementById('pdfPassword');
        
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
                titleElement.dataset.propertyId = propertyId;
            }
        
            // ✅ 4. GARANTIR VISIBILIDADE ABSOLUTA DO CAMPO DE SENHA
            if (passwordInput) {
                // Remover qualquer estilo que possa estar ocultando
                passwordInput.style.display = 'block';
                passwordInput.style.visibility = 'visible';
                passwordInput.style.opacity = '1';
                passwordInput.style.position = 'static';
                passwordInput.style.width = '100%';
                passwordInput.style.margin = '1rem 0';
                passwordInput.value = ''; // Limpar campo
                
                // Verificar estilo do pai também
                if (passwordInput.parentElement) {
                    passwordInput.parentElement.style.display = 'block';
                }
            } else {
                SC.logModule('pdf', '❌ Campo de senha NÃO encontrado após criação!');
                alert('Erro: campo de senha não disponível. Recarregue a página.');
                return;
            }
        
            // 5. Exibir modal
            modal.style.display = 'flex';
        
            // 6. Focar no campo de senha com delay para garantir visibilidade
            setTimeout(() => {
                if (passwordInput) {
                    passwordInput.focus();
                    passwordInput.select();
                    SC.logModule('pdf', '✅ Modal aberto com foco no campo de senha');
                    
                    // DEBUG: Verificar visibilidade final
                    const style = window.getComputedStyle(passwordInput);
                    SC.logModule('pdf', '🔍 VERIFICAÇÃO FINAL - Campo senha:', {
                        display: style.display,
                        visibility: style.visibility,
                        opacity: style.opacity,
                        width: style.width,
                        height: style.height
                    });
                }
            }, 100);
        
            return modal;
        },

        // Validação de senha (UI) - VERSÃO CORRIGIDA
        validatePasswordAndShowList() {
            SC.logModule('pdf', '🔓 PdfSystem.validatePasswordAndShowList() - Função UI');
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
            
            SC.logModule('pdf', '✅ Senha válida! Buscando documentos...');
            
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
            
            // ✅ CORREÇÃO: Em vez de abrir apenas o primeiro PDF,
            // mostrar a lista de documentos para o usuário escolher
            this.closeModal();
            this.showDocumentList(propertyId, property.title, pdfUrls);
        },
        
        // Fechar modal (UI)
        closeModal() {
            SC.logModule('pdf', '❌ PdfSystem.closeModal() - Função UI');
            const modal = document.getElementById('pdfModal');
            if (modal) modal.style.display = 'none';
            return this;
        },
        
        // Lista de seleção (UI)
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            SC.logModule('pdf', '📋 PdfSystem.showDocumentList() - Função UI');
            // Criar modal de seleção
            let selectionModal = document.getElementById('pdfSelectionModal');
            
            if (!selectionModal) {
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
            }
            
            // Gerar lista de documentos
            const pdfListHtml = pdfUrls.map((url, index) => {
                const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
                
                return `
                    <div class="pdf-list-item" style="
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
                        <button onclick="window.open('${url}', '_blank')" 
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
                    <button onclick="this.parentElement.parentElement.style.display = 'none'" 
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
                    
                    <h3 style="color: var(--primary); margin: 0 0 1.5rem 0;">
                        <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                    </h3>
                    
                    <p style="color: #666; margin-bottom: 1.5rem;">
                        <strong>${propertyTitle}</strong><br>
                        Selecione o documento que deseja visualizar:
                    </p>
                    
                    <div style="margin-bottom: 1.5rem;">
                        ${pdfListHtml}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <small style="color: #95a5a6;">
                            <i class="fas fa-info-circle"></i> Clique em "Visualizar" para abrir em nova aba
                        </small>
                        <button onclick="PdfSystem.downloadAllPdfs(${JSON.stringify(pdfUrls)})" 
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
                    </div>
                </div>
            `;
            
            selectionModal.style.display = 'flex';
        },
        
        // Download (UI)
        downloadAllPdfs(urls) {
            SC.logModule('pdf', `📥 PdfSystem.downloadAllPdfs() - Função UI para ${urls.length} PDF(s)`);
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
                    SC.logModule('pdf', `✅ Download iniciado: ${fileName}`);
                    
                } catch (error) {
                    SC.logModule('pdf', `❌ Erro ao baixar ${url}:`, error);
                }
            });
            
            if (successCount > 0) {
                alert(`✅ ${successCount} documento(s) enviado(s) para download!\n\nVerifique a barra de downloads do seu navegador.`);
            }
        },

        // Função ensureModalExists (CRÍTICA - estava faltando)
        ensureModalExists() {
            if (state.modalElement) return state.modalElement;
            
            // Verificar se modal já existe no DOM
            let modal = document.getElementById('pdfModal');
            if (!modal) {
                // Criar modal básico
                modal = document.createElement('div');
                modal.id = 'pdfModal';
                modal.className = 'pdf-modal';
                modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;align-items:center;justify-content:center;';
                modal.innerHTML = `
                    <div style="background:white;border-radius:10px;padding:2rem;max-width:400px;width:90%;text-align:center;">
                        <h3 id="pdfModalTitle" style="color:#1a5276;margin:0 0 1rem 0;">
                            <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                        </h3>
                        <div id="pdfPreview" style="margin:1rem 0;padding:1rem;background:#f8f9fa;border-radius:5px;">
                            <p>Documentos técnicos e legais disponíveis</p>
                        </div>
                        <input type="password" id="pdfPassword" placeholder="Digite a senha para acessar" 
                               style="width:100%;padding:0.8rem;border:1px solid #ddd;border-radius:5px;margin:1rem 0;display:block;">
                        <div style="display:flex;gap:1rem;margin-top:1rem;">
                            <button onclick="PdfSystem.validatePasswordAndShowList()" 
                                    style="background:#1a5276;color:white;padding:0.8rem 1.5rem;border:none;border-radius:5px;cursor:pointer;flex:1;">
                                <i class="fas fa-lock-open"></i> Acessar
                            </button>
                            <button onclick="PdfSystem.closeModal()" 
                                    style="background:#95a5a6;color:white;padding:0.8rem 1.5rem;border:none;border-radius:5px;cursor:pointer;">
                                <i class="fas fa-times"></i> Fechar
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            state.modalElement = modal;
            return modal;
        },
        
        // ========== COMPATIBILIDADE (WRAPPERS) ==========
        
        // Wrapper para getPdfsToSave
        async getPdfsToSave(propertyId) {
            SC.logModule('pdf', `💾 PdfSystem.getPdfsToSave() - Wrapper para MediaSystem`);
            return await this.uploadAll(propertyId, 'Imóvel');
        },
        
        // Wrapper para processAndSavePdfs
        async processAndSavePdfs(propertyId, propertyTitle) {
            SC.logModule('pdf', `📄 PdfSystem.processAndSavePdfs() - Wrapper para MediaSystem`);
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
            SC.logModule('pdf', '✅ PdfSystem refatorado inicializado como cliente UI');
        }
    };
    
    // Inicializar após MediaSystem (CRÍTICO)
    setTimeout(() => {
        if (window.MediaSystem) {
            initPdfSystem();
        } else {
            SC.logModule('pdf', '⏳ Aguardando MediaSystem para inicializar PdfSystem...');
            setTimeout(initPdfSystem, 1000);
        }
    }, 1500);
}
