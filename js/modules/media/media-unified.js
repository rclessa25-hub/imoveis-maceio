// js/modules/media/media-unified.js - SISTEMA UNIFICADO DE MÍDIA
console.log('🔄 media-unified.js carregado - Sistema Centralizado');

/**
 * SISTEMA UNIFICADO DE MÍDIA - VERSÃO OTIMIZADA
 * Responsabilidade única: Gerenciar todo o estado e operações de mídia
 * Dependências: Supabase, utils.js
 */

const MediaSystem = {
    // ========== CONFIGURAÇÃO ==========
    config: {
        currentSystem: 'vendas', // 'vendas' ou 'aluguel'
        buckets: {
            vendas: 'properties',
            aluguel: 'rentals'
        },
        limits: {
            maxFiles: 10,
            maxSize: 5 * 1024 * 1024, // 5MB
            maxPdfs: 5,
            maxPdfSize: 10 * 1024 * 1024 // 10MB
        },
        allowedTypes: {
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            videos: ['video/mp4', 'video/quicktime'],
            pdfs: ['application/pdf']
        }
    },

    // ========== ESTADO GLOBAL ==========
    state: {
        files: [],           // Arquivos selecionados (novos)
        existing: [],        // Arquivos existentes (do banco)
        pdfs: [],            // PDFs selecionados (novos)
        existingPdfs: [],    // PDFs existentes (do banco)
        isUploading: false,
        currentPropertyId: null
    },

    // ========== INICIALIZAÇÃO ==========
    init(systemName = 'vendas') {
        console.log(`🔧 Inicializando sistema de mídia para: ${systemName}`);
        
        this.config.currentSystem = systemName;
        this.resetState();
        
        // Configurar event listeners uma única vez
        this.setupEventListeners();
        
        return this;
    },

    // ========== GERENCIAMENTO DE ESTADO ==========
    resetState() {
        console.log('🧹 Resetando estado do sistema de mídia');
        
        // Limpar arrays
        this.state.files.length = 0;
        this.state.existing.length = 0;
        this.state.pdfs.length = 0;
        this.state.existingPdfs.length = 0;
        
        // Resetar flags
        this.state.isUploading = false;
        this.state.currentPropertyId = null;
        
        // Liberar URLs de preview para evitar memory leaks
        this.revokeAllPreviewUrls();
        
        return this;
    },

    // ========== API PÚBLICA - FOTOS/VIDEOS ==========
    
    // Adicionar novos arquivos
    addFiles(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        filesArray.forEach(file => {
            if (this.validateFile(file)) {
                this.state.files.push({
                    file: file,
                    id: `file_${Date.now()}_${Math.random()}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    preview: URL.createObjectURL(file),
                    isImage: this.config.allowedTypes.images.includes(file.type),
                    isVideo: this.config.allowedTypes.videos.includes(file.type),
                    isNew: true,
                    uploaded: false
                });
                addedCount++;
            }
        });
        
        console.log(`📁 ${addedCount}/${filesArray.length} arquivo(s) adicionado(s)`);
        this.updateUI();
        return addedCount;
    },

    // Carregar arquivos existentes
    loadExisting(property) {
        if (!property) return;
        
        this.state.currentPropertyId = property.id;
        
        // Carregar fotos/vídeos existentes
        if (property.images && property.images !== 'EMPTY') {
            const urls = property.images.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            this.state.existing = urls.map((url, index) => ({
                url: url,
                id: `existing_${property.id}_${index}`,
                name: this.extractFileName(url),
                type: this.getFileTypeFromUrl(url),
                isExisting: true,
                markedForDeletion: false,
                isVisible: true
            }));
        }
        
        // Carregar PDFs existentes
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            this.state.existingPdfs = pdfUrls.map((url, index) => ({
                url: url,
                id: `existing_pdf_${property.id}_${index}`,
                name: this.extractFileName(url),
                isExisting: true,
                markedForDeletion: false
            }));
        }
        
        this.updateUI();
        return this;
    },

    // Remover arquivo
    removeFile(fileId) {
        // Buscar em todos os arrays
        const allArrays = [
            { name: 'files', array: this.state.files },
            { name: 'existing', array: this.state.existing },
            { name: 'pdfs', array: this.state.pdfs },
            { name: 'existingPdfs', array: this.state.existingPdfs }
        ];
        
        for (const { name, array } of allArrays) {
            const index = array.findIndex(item => item.id === fileId);
            if (index !== -1) {
                const removed = array[index];
                
                // Se é um arquivo existente, marcar para exclusão
                if (removed.isExisting) {
                    removed.markedForDeletion = true;
                    console.log(`🗑️ Arquivo existente marcado para exclusão: ${removed.name}`);
                } else {
                    // Se é um arquivo novo, remover e liberar URL
                    if (removed.preview && removed.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(removed.preview);
                    }
                    array.splice(index, 1);
                    console.log(`🗑️ Arquivo novo removido: ${removed.name}`);
                }
                
                this.updateUI();
                return true;
            }
        }
        
        return false;
    },

    // ========== API PÚBLICA - PDFs ==========
    
    addPdfs(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        filesArray.forEach(file => {
            if (this.validatePdf(file)) {
                this.state.pdfs.push({
                    file: file,
                    id: `pdf_${Date.now()}_${Math.random()}`,
                    name: file.name,
                    size: file.size,
                    isNew: true,
                    uploaded: false
                });
                addedCount++;
            }
        });
        
        console.log(`📄 ${addedCount}/${filesArray.length} PDF(s) adicionado(s)`);
        this.updateUI();
        return addedCount;
    },

    // ========== UPLOAD PARA SUPABASE ==========
    
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            console.warn('⚠️ Upload já em andamento');
            return { images: '', pdfs: '' };
        }
        
        this.state.isUploading = true;
        console.group('🚀 UPLOAD UNIFICADO PARA SUPABASE');
        
        try {
            const results = {
                images: '',
                pdfs: ''
            };
            
            // 1. Processar exclusões primeiro
            await this.processDeletions();
            
            // 2. Upload de fotos/vídeos
            if (this.state.files.length > 0) {
                const imageUrls = await this.uploadFiles(
                    this.state.files.map(f => f.file),
                    propertyId,
                    'images'
                );
                results.images = imageUrls.join(',');
            }
            
            // 3. Upload de PDFs
            if (this.state.pdfs.length > 0) {
                const pdfUrls = await this.uploadFiles(
                    this.state.pdfs.map(p => p.file),
                    propertyId,
                    'pdfs'
                );
                results.pdfs = pdfUrls.join(',');
            }
            
            // 4. Combinar com arquivos existentes não excluídos
            const keptExistingImages = this.state.existing
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            const keptExistingPdfs = this.state.existingPdfs
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            if (keptExistingImages.length > 0) {
                results.images = results.images 
                    ? `${results.images},${keptExistingImages.join(',')}`
                    : keptExistingImages.join(',');
            }
            
            if (keptExistingPdfs.length > 0) {
                results.pdfs = results.pdfs
                    ? `${results.pdfs},${keptExistingPdfs.join(',')}`
                    : keptExistingPdfs.join(',');
            }
            
            console.log('✅ Upload completo:', results);
            return results;
            
        } catch (error) {
            console.error('❌ Erro no upload unificado:', error);
            return { images: '', pdfs: '' };
        } finally {
            this.state.isUploading = false;
            console.groupEnd();
        }
    },

    // ========== FUNÇÕES DE COMPATIBILIDADE COM ADMIN.JS ==========
    // ADICIONADAS APÓS uploadAll (linha ~350)

    processAndSavePdfs: async function(propertyId, propertyTitle) {
        console.log(`📄 processAndSavePdfs chamado para ${propertyId}`);
        const result = await this.uploadAll(propertyId, propertyTitle);
        return result.pdfs;
    },

    clearAllPdfs: function() {
        console.log('🧹 Limpando apenas PDFs');
        this.state.pdfs.length = 0;
        this.state.existingPdfs.length = 0;
        this.updateUI();
        return this;
    },

    loadExistingPdfsForEdit: function(property) {
        console.log('📄 Carregando PDFs existentes para edição');
        if (!property) return this;
        this.state.existingPdfs.length = 0;
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            this.state.existingPdfs = pdfUrls.map((url, index) => ({
                url: url,
                id: `existing_pdf_${property.id}_${index}`,
                name: this.extractFileName(url),
                isExisting: true,
                markedForDeletion: false
            }));
        }
        this.updateUI();
        return this;
    },

    getPdfsToSave: async function(propertyId) {
        console.log(`💾 Obtendo PDFs para salvar para ${propertyId}`);
        const result = await this.uploadAll(propertyId, 'Imóvel');
        return result.pdfs;
    },

    getMediaUrlsForProperty: async function(propertyId, propertyTitle) {
        console.log(`🖼️ Obtendo URLs de mídia para ${propertyId}`);
        const result = await this.uploadAll(propertyId, propertyTitle);
        return result.images;
    },

    clearAllMedia: function() {
        console.log('🧹 LIMPEZA COMPLETA DE MÍDIA E PDFs');
        return this.resetState();
    },
    
    // ===== RESTANTE DAS FUNÇÕES (UI, validação, utilidades) FUNÇÕES PRIVADAS ======
    
    validateFile(file) {
        const isImage = this.config.allowedTypes.images.includes(file.type);
        const isVideo = this.config.allowedTypes.videos.includes(file.type);
        
        if (!isImage && !isVideo) {
            alert(`❌ "${file.name}" - Tipo não suportado!`);
            return false;
        }
        
        if (file.size > this.config.limits.maxSize) {
            alert(`❌ "${file.name}" - Arquivo muito grande!`);
            return false;
        }
        
        return true;
    },
    
    validatePdf(file) {
        if (!this.config.allowedTypes.pdfs.includes(file.type)) {
            alert(`❌ "${file.name}" - Não é um PDF válido!`);
            return false;
        }
        
        if (file.size > this.config.limits.maxPdfSize) {
            alert(`❌ "${file.name}" - PDF muito grande!`);
            return false;
        }
        
        return true;
    },
    
    async uploadFiles(files, propertyId, type = 'images') {
        const bucket = this.config.buckets[this.config.currentSystem];
        const uploadedUrls = [];
        
        for (const file of files) {
            try {
                const fileName = this.generateFileName(file, propertyId, type);
                const filePath = `${bucket}/${fileName}`;
                
                const response = await fetch(
                    `${window.SUPABASE_URL}/storage/v1/object/${filePath}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                            'apikey': window.SUPABASE_KEY,
                            'Content-Type': file.type
                        },
                        body: file
                    }
                );
                
                if (response.ok) {
                    const publicUrl = `${window.SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                    uploadedUrls.push(publicUrl);
                    console.log(`✅ ${type} enviado: ${file.name}`);
                }
            } catch (error) {
                console.error(`❌ Erro ao enviar ${file.name}:`, error);
            }
        }
        
        return uploadedUrls;
    },
    
    async processDeletions() {
        // Processar exclusões de fotos/vídeos
        const imagesToDelete = this.state.existing
            .filter(item => item.markedForDeletion && item.url)
            .map(item => item.url);
        
        // Processar exclusões de PDFs
        const pdfsToDelete = this.state.existingPdfs
            .filter(item => item.markedForDeletion && item.url)
            .map(item => item.url);
        
        // TODO: Implementar exclusão do Supabase Storage
        console.log(`🗑️ ${imagesToDelete.length} imagem(ns) e ${pdfsToDelete.length} PDF(s) marcados para exclusão`);
        
        // Remover itens marcados dos arrays
        this.state.existing = this.state.existing.filter(item => !item.markedForDeletion);
        this.state.existingPdfs = this.state.existingPdfs.filter(item => !item.markedForDeletion);
    },
    
    // ========== UI UPDATES ==========
    
    updateUI() {
        // Debounce para evitar múltiplas renderizações
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        
        this._updateTimeout = setTimeout(() => {
            this.renderMediaPreview();
            this.renderPdfPreview();
        }, 50);
    },
    
    renderMediaPreview() {
        const container = document.getElementById('uploadPreview');
        if (!container) return;
        
        const allFiles = [...this.state.existing, ...this.state.files];
        
        if (allFiles.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                    <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p style="margin: 0;">Nenhuma foto ou vídeo adicionada</p>
                    <small style="font-size: 0.8rem;">Arraste ou clique para adicionar</small>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        
        allFiles.forEach(item => {
            const isMarked = item.markedForDeletion;
            const isExisting = item.isExisting;
            const borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : '#3498db');
            const bgColor = isMarked ? '#ffebee' : (isExisting ? '#e8f8ef' : '#e8f4fc');
            
            html += `
                <div class="media-preview-item" style="position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:${bgColor}">
                    ${item.isImage ? 
                        `<img src="${item.preview || item.url}" style="width:100%;height:100%;object-fit:cover" alt="Preview">` :
                        `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2c3e50;">
                            <i class="fas fa-video" style="font-size:2rem;color:#ecf0f1;"></i>
                        </div>`
                    }
                    <button onclick="MediaSystem.removeFile('${item.id}')" 
                            style="position:absolute;top:-8px;right:-8px;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;">
                        ${isMarked ? '↺' : '×'}
                    </button>
                    ${isExisting ? 
                        `<div style="position:absolute;bottom:2px;left:2px;background:${isMarked ? '#e74c3c' : '#27ae60'};color:white;font-size:0.6rem;padding:1px 4px;border-radius:3px;">
                            ${isMarked ? 'EXCLUIR' : 'Existente'}
                        </div>` : ''
                    }
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    renderPdfPreview() {
        const container = document.getElementById('pdfUploadPreview');
        if (!container) return;
        
        const allPdfs = [...this.state.existingPdfs, ...this.state.pdfs];
        
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
                <div class="pdf-preview-container" style="position:relative">
                    <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:0.5rem;width:90px;height:90px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;">
                        <i class="fas fa-file-pdf" style="font-size:1.2rem;color:${borderColor};margin-bottom:0.3rem;"></i>
                        <p style="font-size:0.7rem;margin:0;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">${shortName}</p>
                        <small style="color:#7f8c8d;font-size:0.6rem;">PDF</small>
                    </div>
                    <button onclick="MediaSystem.removeFile('${pdf.id}')" 
                            style="position:absolute;top:-5px;right:-5px;background:${borderColor};color:white;border:none;border-radius:50%;width:26px;height:26px;font-size:16px;cursor:pointer;">
                        ×
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    // ========== UTILITIES ==========
    
    setupEventListeners() {
        console.log('🔧 Configurando event listeners unificados...');
        
        // Configurar upload de mídia
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            // Clique na área
            uploadArea.addEventListener('click', () => fileInput.click());
            
            // Drag & drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#3498db';
                uploadArea.style.background = '#e8f4fc';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.background = '#fafafa';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.background = '#fafafa';
                
                if (e.dataTransfer.files.length > 0) {
                    this.addFiles(e.dataTransfer.files);
                }
            });
            
            // Change no input
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addFiles(e.target.files);
                }
            });
        }
        
        // Configurar upload de PDFs
        const pdfUploadArea = document.getElementById('pdfUploadArea');
        const pdfFileInput = document.getElementById('pdfFileInput');
        
        if (pdfUploadArea && pdfFileInput) {
            pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
            
            pdfFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addPdfs(e.target.files);
                }
            });
        }
    },
    
    extractFileName(url) {
        if (!url) return 'Arquivo';
        const parts = url.split('/');
        let fileName = parts[parts.length - 1] || 'Arquivo';
        try { fileName = decodeURIComponent(fileName); } catch (e) {}
        return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
    },
    
    getFileTypeFromUrl(url) {
        if (!url) return 'file';
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
        if (ext === 'pdf') return 'pdf';
        return 'file';
    },
    
    generateFileName(file, propertyId, type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const safeName = file.name
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 40);
        
        const prefix = type === 'pdfs' ? 'pdf' : 'media';
        return `${prefix}_${propertyId}_${timestamp}_${random}_${safeName}`;
    },
    
    revokeAllPreviewUrls() {
        [...this.state.files, ...this.state.pdfs].forEach(item => {
            if (item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
            }
        });
    }
};

// Exportar para window
window.MediaSystem = MediaSystem;

// Auto-inicialização
setTimeout(() => {
    window.MediaSystem.init('vendas');
    console.log('✅ Sistema de mídia unificado pronto');
}, 1000);

// NO FINAL do media-unified.js - ANTES do console.log final

// ========== VERIFICAÇÃO DE INTEGRIDADE ==========

// Verificar se todas as funções necessárias estão disponíveis
setTimeout(() => {
    console.log('🔍 Verificação de integridade do MediaSystem');
    
    const requiredFunctions = [
        'addFiles',
        'addPdfs', 
        'loadExisting',
        'resetState',
        'uploadAll',
        'processAndSavePdfs',     // Nova
        'clearAllPdfs',           // Nova
        'loadExistingPdfsForEdit', // Nova
        'getPdfsToSave',          // Nova
        'getMediaUrlsForProperty' // Nova
    ];
    
    const missing = [];
    requiredFunctions.forEach(func => {
        if (typeof MediaSystem[func] !== 'function') {
            missing.push(func);
        }
    });
    
    if (missing.length === 0) {
        console.log('✅ Todas as funções necessárias disponíveis');
    } else {
        console.error('❌ Funções faltando:', missing);
    }
}, 2000);

// ========== COMPATIBILIDADE COM MÓDULOS DE SUPORTE ==========

// Criar fallbacks silenciosos para funções que os módulos de suporte podem procurar
if (typeof window.initMediaSystem === 'undefined') {
    window.initMediaSystem = function() {
        console.log('🔧 initMediaSystem chamada (fallback para compatibilidade)');
        return MediaSystem ? MediaSystem.init('vendas') : null;
    };
}

if (typeof window.updateMediaPreview === 'undefined') {
    window.updateMediaPreview = function() {
        console.log('🎨 updateMediaPreview chamada (fallback para compatibilidade)');
        return MediaSystem ? MediaSystem.updateUI() : null;
    };
}

console.log('✅ Sistema de mídia unificado pronto com compatibilidade total');
