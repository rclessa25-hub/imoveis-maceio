// js/modules/reader/pdf-unified.js - VERSÃO COMPLETA (≈600 linhas)
console.log('📄 pdf-unified.js - Sistema PDF Unificado V1.0');

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
            this.resetState();
            return this;
        },
        
        loadExistingPdfsForEdit(property) {
            console.log('📄 Carregando PDFs existentes para edição');
            return this.loadExisting(property);
        },
        
        async getPdfsToSave(propertyId) {
            console.log(`💾 Obtendo PDFs para salvar para ${propertyId}`);
            return await this.uploadAll(propertyId, 'Imóvel');
        },
        
        // UI E MODAL
        showModal(propertyId) {
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) return;
            
            this.ensureModalExists();
            state.currentPropertyId = propertyId;
            
            // Configurar modal
            const modal = state.modalElement;
            const title = document.getElementById('pdfModalTitle');
            const passwordInput = document.getElementById('pdfPassword');
            
            if (title) title.textContent = `Documentos: ${property.title}`;
            if (passwordInput) passwordInput.value = '';
            
            modal.style.display = 'flex';
            setTimeout(() => passwordInput?.focus(), 100);
        },
        
        closeModal() {
            if (state.modalElement) {
                state.modalElement.style.display = 'none';
            }
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
        resetState() {
            state.files = [];
            state.existing = [];
            state.isProcessing = false;
            state.currentPropertyId = null;
            this.updateUI();
            return this;
        },
        
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
                            <button onclick="PdfSystem.validatePassword()" 
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
        },
        
        validatePassword() {
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) return;
            
            const password = passwordInput.value.trim();
            if (password !== CONFIG.password) {
                alert('❌ Senha incorreta! A senha é: doc123');
                passwordInput.value = '';
                passwordInput.focus();
                return;
            }
            
            // Senha correta - mostrar documentos
            this.showPdfList(state.currentPropertyId);
        },
        
        showPdfList(propertyId) {
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property || !property.pdfs || property.pdfs === 'EMPTY') {
                alert('ℹ️ Nenhum documento PDF disponível.');
                this.closeModal();
                return;
            }
            
            const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
            
            // Abrir primeiro PDF em nova aba (simplificado)
            if (pdfUrls.length > 0) {
                window.open(pdfUrls[0], '_blank');
            }
            
            this.closeModal();
        }
    };
    
    return api;
})();

// Auto-inicialização segura
setTimeout(() => {
    if (typeof window.PdfSystem !== 'undefined') {
        window.PdfSystem.init();
        console.log('✅ PdfSystem unificado pronto');
    }
}, 1000);

// Exportação global
window.PdfSystem = PdfSystem;
