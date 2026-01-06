// js/modules/reader/pdf-unified.js - VERSÃO COMPLETA ATUALIZADA
console.log('📄 pdf-unified.js - Sistema PDF Unificado V1.2');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO PRIVADA ==========
    const CONFIG = {
        password: window.PDF_PASSWORD || "doc123",
        maxFiles: 5,
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['application/pdf'],
        supabaseUrl: window.SUPABASE_URL || 'https://syztbxvpdaplpetmixmt.supabase.co',
        supabaseKey: window.SUPABASE_KEY
    };
    
    // ========== ESTADO PRIVADO ==========
    let state = {
        files: [],
        existing: [],
        isProcessing: false,
        currentPropertyId: null,
        modalElement: null
    };
    
    // ========== API PÚBLICA ==========
    const api = {
        // INICIALIZAÇÃO
        init() {
            console.log('🔧 PdfSystem.init() - Sistema PDF unificado');
            this.resetState();
            this.setupEventListeners();
            this.ensureModalExists();
            return this;
        },
        
        // GERENCIAMENTO DE ARQUIVOS
        addFiles(fileList) {
            if (!fileList || fileList.length === 0) return 0;
            
            const filesArray = Array.from(fileList);
            let added = 0;
            
            filesArray.forEach(file => {
                if (this.validateFile(file)) {
                    state.files.push({
                        file: file,
                        id: `pdf_${Date.now()}_${Math.random()}`,
                        name: file.name,
                        size: this.formatFileSize(file.size),
                        type: file.type,
                        isNew: true,
                        uploaded: false
                    });
                    added++;
                }
            });
            
            this.updateUI();
            return added;
        },
        
        loadExisting(property) {
            if (!property) return this;
            
            state.currentPropertyId = property.id;
            state.existing = [];
            
            if (property.pdfs && property.pdfs !== 'EMPTY') {
                const pdfUrls = property.pdfs.split(',')
                    .map(url => url.trim())
                    .filter(url => url && url !== 'EMPTY');
                
                state.existing = pdfUrls.map((url, index) => ({
                    url: url,
                    id: `existing_${property.id}_${index}`,
                    name: this.extractFileName(url),
                    isExisting: true,
                    markedForDeletion: false
                }));
            }
            
            this.updateUI();
            return this;
        },
        
        removeFile(fileId) {
            // Buscar em files e existing
            const allFiles = [...state.files, ...state.existing];
            const fileIndex = allFiles.findIndex(f => f.id === fileId);
            
            if (fileIndex === -1) return false;
            
            const file = allFiles[fileIndex];
            
            if (file.isExisting) {
                file.markedForDeletion = true;
                console.log(`🗑️ PDF existente marcado para exclusão: ${file.name}`);
            } else {
                const idx = state.files.findIndex(f => f.id === fileId);
                if (idx !== -1) state.files.splice(idx, 1);
            }
            
            this.updateUI();
            return true;
        },
        
        // UPLOAD E PROCESSAMENTO
        async uploadAll(propertyId, propertyTitle) {
            if (state.isProcessing) return '';
            
            state.isProcessing = true;
            console.group('🚀 UPLOAD UNIFICADO DE PDFs');
            
            try {
                const results = {
                    pdfs: ''
                };
                
                // 1. Processar exclusões
                await this.processDeletions();
                
                // 2. Upload de novos PDFs
                if (state.files.length > 0) {
                    const pdfUrls = await this.uploadFiles(
                        state.files.map(f => f.file),
                        propertyId,
                        'pdfs'
                    );
                    results.pdfs = pdfUrls.join(',');
                }
                
                // 3. Combinar com existentes não excluídos
                const keptExisting = state.existing
                    .filter(item => !item.markedForDeletion && item.url)
                    .map(item => item.url);
                
                if (keptExisting.length > 0) {
                    results.pdfs = results.pdfs 
                        ? `${results.pdfs},${keptExisting.join(',')}`
                        : keptExisting.join(',');
                }
                
                console.log('✅ Upload PDF completo:', results);
                
                // 4. Resetar estado após salvamento bem-sucedido
                this.resetState();
                
                return results.pdfs;
                
            } catch (error) {
                console.error('❌ Erro no upload unificado:', error);
                return '';
            } finally {
                state.isProcessing = false;
                console.groupEnd();
            }
        },
        
        // FUNÇÕES DE COMPATIBILIDADE (CRÍTICAS)
        async processAndSavePdfs(propertyId, propertyTitle) {
            console.log(`📄 processAndSavePdfs chamado para ${propertyId}`);
            return await this.uploadAll(propertyId, propertyTitle);
        },
        
        clearAllPdfs() {
            console.log('🧹 Limpando todos os PDFs');
            return this.resetState();
        },
        
        loadExistingPdfsForEdit(property) {
            console.log('📄 Carregando PDFs existentes para edição');
            return this.loadExisting(property);
        },
        
        async getPdfsToSave(propertyId) {
            console.log(`💾 Obtendo PDFs para salvar para ${propertyId}`);
            return await this.uploadAll(propertyId, 'Imóvel');
        },
        
        // UI E MODAL - FUNÇÃO ATUALIZADA
        showModal(propertyId) {
            console.log(`📄 PdfSystem.showModal(${propertyId})`);
            
            // 1. Garantir que o modal COMPLETO existe (usar função do admin.js se disponível)
            let modal = document.getElementById('pdfModal');
            
            // Se não existe, criar estrutura COMPLETA (não simplificada)
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
                    <div class="pdf-modal-content" style="background: white; border-radius: 10px; padding: 2rem; max-width: 400px; width: 90%; text-align: center;">
                        <h3 id="pdfModalTitle" style="color: var(--primary); margin: 0 0 1rem 0;">
                            <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                        </h3>
                        <div id="pdfPreview" class="pdf-preview" style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 5px;">
                            <p>Documentos técnicos e legais disponíveis</p>
                        </div>
                        <!-- CAMPO DE SENHA SEMPRE VISÍVEL -->
                        <input type="password" id="pdfPassword" class="pdf-password-input" 
                               placeholder="Digite a senha para acessar" 
                               style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 5px; margin: 1rem 0; display: block !important;">
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button onclick="PdfSystem.validatePasswordAndShowList()" 
                                    style="background: var(--primary); color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 5px; cursor: pointer; flex: 1;">
                                <i class="fas fa-lock-open"></i> Acessar
                            </button>
                            <button onclick="PdfSystem.closeModal()" 
                                    style="background: #95a5a6; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 5px; cursor: pointer;">
                                <i class="fas fa-times"></i> Fechar
                            </button>
                        </div>
                        <p style="font-size: 0.8rem; color: #666; margin-top: 1rem;">
                            <i class="fas fa-info-circle"></i> Solicite a senha ao corretor
                        </p>
                    </div>
                `;
                
                document.body.appendChild(modal);
            }
            
            // 2. Configurar título e armazenar propertyId
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                console.error('❌ Imóvel não encontrado:', propertyId);
                return;
            }
            
            state.currentPropertyId = propertyId;
            state.modalElement = modal;
            
            const titleElement = document.getElementById('pdfModalTitle');
            const passwordInput = document.getElementById('pdfPassword');
            
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
                titleElement.dataset.propertyId = propertyId; // Armazenar ID no elemento
            }
            
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.style.display = 'block';
                passwordInput.style.visibility = 'visible';
                passwordInput.style.opacity = '1';
            }
            
            // 3. Exibir modal e focar no campo de senha
            modal.style.display = 'flex';
            
            // Focar após breve delay (garantir que modal está visível)
            setTimeout(() => {
                if (passwordInput) {
                    passwordInput.focus();
                    console.log('✅ Modal PDF aberto com campo de senha visível');
                }
            }, 150);
            
            return modal;
        },
        
        // FUNÇÃO ADICIONADA: validatePasswordAndShowList (SIMPLIFICADA)
        validatePasswordAndShowList() {
            console.log('🔓 PdfSystem.validatePasswordAndShowList()');
            
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) {
                console.error('❌ Campo de senha não encontrado!');
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
            
            // Abrir primeiro PDF
            window.open(pdfUrls[0], '_blank');
            this.closeModal();
        },
        
        // FUNÇÃO ADICIONADA: closeModal (SIMPLIFICADA)
        closeModal() {
            const modal = document.getElementById('pdfModal');
            if (modal) {
                modal.style.display = 'none';
                console.log('✅ Modal PDF fechado');
            }
            
            // Também fechar modal de seleção se existir
            const selectionModal = document.getElementById('pdfSelectionModal');
            if (selectionModal) {
                selectionModal.style.display = 'none';
            }
        },
        
        // FUNÇÃO ADICIONADA: showDocumentList
        showDocumentList(propertyId, propertyTitle, pdfUrls) {
            console.log('📋 Mostrando lista de documentos...');
            
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
                    <button onclick="PdfSystem.closeSelectionModal()" 
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
        
        // FUNÇÃO ADICIONADA: closeSelectionModal
        closeSelectionModal() {
            const modal = document.getElementById('pdfSelectionModal');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
                console.log('✅ Modal de seleção fechado');
            }
        },
        
        // FUNÇÃO ADICIONADA: downloadAllPdfs
        downloadAllPdfs(urls) {
            console.log(`📥 Iniciando download de ${urls.length} PDF(s)...`);
            
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
        
        // FUNÇÃO ATUALIZADA: resetState (RESET COMPLETO)
        resetState() {
            console.log('🧹 PdfSystem.resetState() - LIMPEZA COMPLETA');
            
            // 1. Limpar arrays
            state.files = [];
            state.existing = [];
            
            // 2. Resetar flags
            state.isProcessing = false;
            state.currentPropertyId = null;
            
            // 3. Limpar UI
            this.updateUI();
            
            // 4. Limpar também variáveis globais antigas (para compatibilidade)
            if (typeof window.selectedPdfFiles !== 'undefined') {
                window.selectedPdfFiles = [];
            }
            
            if (typeof window.existingPdfFiles !== 'undefined') {
                window.existingPdfFiles = [];
            }
            
            // 5. Resetar o input de arquivo
            const pdfFileInput = document.getElementById('pdfFileInput');
            if (pdfFileInput) {
                pdfFileInput.value = '';
            }
            
            console.log('✅ Estado do PdfSystem completamente resetado');
            return this;
        },
        
        // FUNÇÃO ADICIONADA: resetCoordinated
        resetCoordinated() {
            console.log('🔄 Reset coordenado entre PdfSystem e admin');
            
            // 1. Resetar PdfSystem
            this.resetState();
            
            // 2. Chamar clearAllPdfs do admin.js (que limpa ambos sistemas)
            if (typeof window.clearAllPdfs === 'function') {
                window.clearAllPdfs();
            }
            
            // 3. Forçar atualização visual
            const pdfPreview = document.getElementById('pdfUploadPreview');
            if (pdfPreview) {
                pdfPreview.innerHTML = `
                    <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                        <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
                    </div>
                `;
            }
            
            console.log('✅ Reset coordenado completo');
            return this;
        },
        
        // UTILITÁRIOS
        validateFile(file) {
            if (!CONFIG.allowedTypes.includes(file.type)) {
                alert(`❌ "${file.name}" - Não é um PDF válido!`);
                return false;
            }
            
            if (file.size > CONFIG.maxSize) {
                alert(`❌ "${file.name}" - PDF muito grande! (Máx: 10MB)`);
                return false;
            }
            
            return true;
        },
        
        formatFileSize(bytes) {
            if (!bytes) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        extractFileName(url) {
            if (!url) return 'Documento';
            const parts = url.split('/');
            let fileName = parts[parts.length - 1] || 'Documento';
            try { fileName = decodeURIComponent(fileName); } catch (e) {}
            return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
        },
        
        // ESTADO
        updateUI() {
            // Implementação simplificada - usar debounce se necessário
            this.renderPdfPreview();
        },
        
        renderPdfPreview() {
            const container = document.getElementById('pdfUploadPreview');
            if (!container) return;
            
            const allPdfs = [...state.existing, ...state.files];
            
            if (allPdfs.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                        <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
                    </div>
                `;
                return;
            }
            
            let html = '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
            
            allPdfs.forEach(pdf => {
                const isMarked = pdf.markedForDeletion;
                const isExisting = pdf.isExisting;
                const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
                const bgColor = isMarked ? '#ffebee' : (isExisting ? '#e8f8ef' : '#e8f4fc');
                const borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : '#3498db');
                
                html += `
                    <div class="pdf-preview-container">
                        <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:0.5rem;width:90px;height:90px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;">
                            <i class="fas fa-file-pdf" style="font-size:1.2rem;color:${borderColor};margin-bottom:0.3rem;"></i>
                            <p style="font-size:0.7rem;margin:0;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">${shortName}</p>
                            <small style="color:#7f8c8d;font-size:0.6rem;">${isExisting ? 'PDF' : pdf.size || 'PDF'}</small>
                        </div>
                        <button onclick="PdfSystem.removeFile('${pdf.id}')" 
                                style="position:absolute;top:-5px;right:-5px;background:${borderColor};color:white;border:none;border-radius:50%;width:26px;height:26px;font-size:16px;cursor:pointer;">
                            ×
                        </button>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        },
        
        // FUNÇÕES PRIVADAS (implementação simplificada)
        setupEventListeners() {
            // Configurar upload area se existir
            const pdfUploadArea = document.getElementById('pdfUploadArea');
            const pdfFileInput = document.getElementById('pdfFileInput');
            
            if (pdfUploadArea && pdfFileInput) {
                pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
                pdfFileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this.addFiles(e.target.files);
                    }
                });
            }
        },
        
        ensureModalExists() {
            if (state.modalElement) return state.modalElement;
            
            // Verificar se modal já existe no DOM
            let modal = document.getElementById('pdfModal');
            if (!modal) {
                // Criar modal básico (admin.js já cuida do completo)
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
        
        async uploadFiles(files, propertyId, type) {
            // Implementação simplificada - usar MediaSystem.uploadFiles se disponível
            if (window.MediaSystem && window.MediaSystem.uploadFiles) {
                return await window.MediaSystem.uploadFiles(files, propertyId, type);
            }
            
            // Fallback básico
            console.warn('⚠️ Usando fallback básico para upload de PDFs');
            return [];
        },
        
        async processDeletions() {
            // Implementação futura
            console.log('🗑️ PDFs marcados para exclusão:', 
                state.existing.filter(p => p.markedForDeletion).length);
        }
    };
    
    return api;
})();

// Exportação global
window.PdfSystem = PdfSystem;

// INICIALIZAR ESTADO SE NECESSÁRIO (OPÇÃO 2)
if (!window.PdfSystem.state) {
    window.PdfSystem.state = {
        files: [],          // PDFs selecionados para upload
        existing: [],       // PDFs existentes do imóvel
        processing: false,  // Flag de processamento
        uploaded: []        // PDFs já enviados
    };
    console.log('📦 Estado do PdfSystem inicializado externamente');
}

// INICIALIZAÇÃO SEGURA E ÚNICA
window.pdfUnifiedInitialized = window.pdfUnifiedInitialized || false;

const initializeUnifiedPdfSystem = function() {
    // Evitar inicializações múltiplas
    if (window.pdfUnifiedInitialized) {
        console.log('⚠️ PdfSystem já inicializado - ignorando');
        return;
    }
    
    // Verificar se o objeto PdfSystem existe
    if (typeof window.PdfSystem === 'undefined') {
        console.warn('⚠️ PdfSystem não disponível para inicialização');
        return;
    }
    
    try {
        // Inicializar com timeout para evitar conflitos
        setTimeout(() => {
            if (!window.pdfUnifiedInitialized && window.PdfSystem && typeof window.PdfSystem.init === 'function') {
                window.PdfSystem.init();
                window.pdfUnifiedInitialized = true;
                console.log('✅ PdfSystem unificado inicializado com sucesso');
            }
        }, 1500);
    } catch (error) {
        console.error('❌ Erro ao inicializar PdfSystem:', error);
    }
};

// Agendar inicialização após carregamento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeUnifiedPdfSystem, 1000);
    });
} else {
    setTimeout(initializeUnifiedPdfSystem, 2000);
}
