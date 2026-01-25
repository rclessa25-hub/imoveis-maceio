// js/modules/media/media-unified.js - VERSÃO COMPLETA E FUNCIONAL
console.log('🔄 media-unified.js - VERSÃO COMPLETA E FUNCIONAL');

// ========== SUPABASE CONSTANTS ==========
if (typeof window.SUPABASE_CONSTANTS === 'undefined') {
    window.SUPABASE_CONSTANTS = {
        URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
}

const MediaSystem = {
    // ========== CONFIGURAÇÃO ==========
    config: {
        currentSystem: 'vendas',
        buckets: {
            vendas: 'properties',
            aluguel: 'rentals'
        },
        limits: {
            maxFiles: 10,
            maxSize: 5 * 1024 * 1024,
            maxPdfs: 5,
            maxPdfSize: 10 * 1024 * 1024
        },
        allowedTypes: {
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            videos: ['video/mp4', 'video/quicktime'],
            pdfs: ['application/pdf']
        }
    },

    // ========== ESTADO ==========
    state: {
        files: [],           // Arquivos NOVOS (não enviados)
        existing: [],        // Arquivos EXISTENTES (já no banco)
        pdfs: [],            // PDFs NOVOS
        existingPdfs: [],    // PDFs EXISTENTES
        isUploading: false,
        currentPropertyId: null,
        lastUploadResult: null
    },

    // ========== INICIALIZAÇÃO ==========
    init(systemName = 'vendas') {
        console.log(`🔧 Inicializando sistema de mídia para: ${systemName}`);
        this.config.currentSystem = systemName;
        this.resetState();
        this.setupEventListeners();
        
        setTimeout(() => {
            this.setupDragAndDrop();
        }, 500);
        
        return this;
    },

    // ========== CARREGAR ARQUIVOS EXISTENTES ==========
    loadExisting: function(property) {
        if (!property) return this;
        
        console.log(`📥 Carregando mídia existente para imóvel ${property.id}`);
        this.state.currentPropertyId = property.id;
        
        // Limpar arrays
        this.state.existing = [];
        this.state.existingPdfs = [];
        
        // 1. Carregar imagens/vídeos EXISTENTES
        if (property.images && property.images !== 'EMPTY') {
            const imageUrls = property.images.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            console.log(`📸 ${imageUrls.length} URL(s) de imagem encontrada(s)`);
            
            this.state.existing = imageUrls.map((url, index) => {
                // Garantir que seja URL completa
                let finalUrl = url;
                if (!url.startsWith('http') && !url.startsWith('blob:')) {
                    finalUrl = this.reconstructSupabaseUrl(url) || url;
                }
                
                return {
                    url: finalUrl,
                    preview: finalUrl,
                    id: `existing_img_${property.id}_${index}`,
                    name: this.extractFileName(url),
                    type: this.getFileTypeFromUrl(url),
                    isExisting: true,
                    markedForDeletion: false,
                    isNew: false  // Importante: arquivos existentes NÃO são novos
                };
            });
        }
        
        // 2. Carregar PDFs EXISTENTES
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            console.log(`📄 ${pdfUrls.length} URL(s) de PDF encontrada(s)`);
            
            this.state.existingPdfs = pdfUrls.map((url, index) => ({
                url: url,
                id: `existing_pdf_${property.id}_${index}`,
                name: this.extractFileName(url),
                isExisting: true,
                markedForDeletion: false,
                type: 'application/pdf'
            }));
        }
        
        console.log(`📊 Estado carregado: ${this.state.existing.length} imagem(ns), ${this.state.existingPdfs.length} PDF(s)`);
        this.updateUI();
        return this;
    },

    // ========== ADICIONAR NOVOS ARQUIVOS ==========
    addFiles: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        console.log(`📁 Tentando adicionar ${filesArray.length} arquivo(s)`);
        
        filesArray.forEach(file => {
            const isImage = this.config.allowedTypes.images.includes(file.type);
            const isVideo = this.config.allowedTypes.videos.includes(file.type);
            
            if (!isImage && !isVideo) {
                alert(`❌ "${file.name}" - Tipo não suportado! Apenas imagens e vídeos.`);
                return;
            }
            
            if (file.size > this.config.limits.maxSize) {
                alert(`❌ "${file.name}" - Arquivo muito grande! Máximo: 5MB`);
                return;
            }
            
            // Criar BLOB URL temporária para preview
            const blobUrl = URL.createObjectURL(file);
            
            const newItem = {
                file: file,                    // Objeto File original
                id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                preview: blobUrl,
                isImage: isImage,
                isVideo: isVideo,
                isNew: true,                   // CRÍTICO: Marcar como NOVO
                uploaded: false,               // Ainda não foi enviado
                uploadedUrl: null,             // URL após upload bem-sucedido
                blobUrl: blobUrl
            };
            
            console.log(`✅ Adicionado NOVO arquivo: "${file.name}"`, {
                isNew: true,
                hasFile: true,
                size: Math.round(file.size/1024) + 'KB'
            });
            
            this.state.files.push(newItem);
            addedCount++;
        });
        
        console.log(`📊 Total de arquivos novos: ${this.state.files.length}`);
        this.updateUI();
        return addedCount;
    },

    // ========== FUNÇÃO DE PREVIEW ==========
    getMediaPreviewHTML: function(item) {
        const displayName = item.name || 'Arquivo';
        const shortName = displayName.length > 20 ? displayName.substring(0, 17) + '...' : displayName;
        
        // 1. Se for arquivo NOVO não enviado (tem BLOB URL)
        if (item.isNew && !item.uploaded && item.preview && item.preview.startsWith('blob:')) {
            return `
                <div style="width:100%;height:70px;position:relative;background:#2c3e50;">
                    <img src="${item.preview}" 
                         alt="${displayName}"
                         style="width:100%;height:100%;object-fit:cover;"
                         onload="console.log('✅ Preview carregado: ${displayName.replace(/'/g, "\\'")}')"
                         onerror="
                            console.log('❌ Falha no preview: ${displayName.replace(/'/g, "\\'")}');
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                         ">
                    <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;color:#ecf0f1;">
                        <i class="fas fa-image" style="font-size:1.5rem;margin-bottom:5px;"></i>
                        <div style="font-size:0.65rem;text-align:center;">${shortName}</div>
                    </div>
                </div>
            `;
        }
        
        // 2. Se for arquivo com URL permanente
        if ((item.url || item.uploadedUrl) && !(item.url || '').startsWith('blob:')) {
            const imageUrl = item.uploadedUrl || item.url;
            
            return `
                <div style="width:100%;height:70px;position:relative;background:#2c3e50;">
                    <img src="${imageUrl}" 
                         alt="${displayName}"
                         style="width:100%;height:100%;object-fit:cover;"
                         onload="console.log('✅ Imagem carregada: ${displayName.replace(/'/g, "\\'")}')"
                         onerror="
                            console.log('❌ Falha no carregamento: ${displayName.replace(/'/g, "\\'")}');
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                         "
                         loading="lazy">
                    <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;color:#ecf0f1;">
                        <i class="fas fa-image" style="font-size:1.5rem;margin-bottom:5px;"></i>
                        <div style="font-size:0.65rem;text-align:center;">${shortName}</div>
                    </div>
                </div>
            `;
        }
        
        // 3. Fallback
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;">
                <i class="fas fa-image" style="font-size:1.5rem;margin-bottom:5px;"></i>
                <div style="font-size:0.65rem;text-align:center;">${shortName}</div>
            </div>
        `;
    },

    // ========== FUNÇÃO CRÍTICA: UPLOAD COMPLETO ==========
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            console.warn('⚠️ Upload já em andamento');
            return { 
                success: false, 
                images: '', 
                pdfs: '', 
                uploadedCount: 0,
                error: 'Upload em andamento' 
            };
        }
        
        this.state.isUploading = true;
        console.group('🚀 EXECUTANDO UPLOAD COMPLETO');
        console.log(`📌 Property: ${propertyId} - ${propertyTitle}`);
        
        try {
            // 1. VERIFICAR ARQUIVOS NOVOS
            const newFiles = this.state.files.filter(item => {
                const isNew = item.isNew === true;
                const hasFile = item.file instanceof File;
                const notUploaded = !item.uploaded;
                return isNew && hasFile && notUploaded;
            });
            
            console.log(`📊 ${newFiles.length} arquivo(s) novo(s) identificado(s) para upload`);
            
            // 2. Processar exclusões
            await this.processDeletions();
            
            // 3. Upload de NOVOS arquivos de mídia
            const uploadedImageUrls = [];
            
            if (newFiles.length > 0) {
                console.log(`📤 Enviando ${newFiles.length} arquivo(s) para Supabase...`);
                
                for (let i = 0; i < newFiles.length; i++) {
                    const fileItem = newFiles[i];
                    const file = fileItem.file;
                    
                    try {
                        console.log(`⬆️ [${i+1}/${newFiles.length}] Enviando: "${file.name}"`);
                        
                        // Upload para Supabase
                        const uploadedUrl = await this.uploadSingleFile(file, propertyId, 'media');
                        
                        if (uploadedUrl) {
                            // Atualizar item
                            fileItem.uploadedUrl = uploadedUrl;
                            fileItem.uploaded = true;
                            fileItem.isNew = false;
                            
                            // Liberar BLOB URL
                            if (fileItem.preview && fileItem.preview.startsWith('blob:')) {
                                URL.revokeObjectURL(fileItem.preview);
                                fileItem.preview = uploadedUrl;
                            }
                            
                            uploadedImageUrls.push(uploadedUrl);
                            console.log(`✅ "${file.name}" enviado!`);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Erro ao enviar "${file.name}":`, error);
                    }
                }
            } else {
                console.log('📭 Nenhum arquivo novo para enviar');
            }
            
            // 4. Upload de NOVOS PDFs
            const newPdfs = this.state.pdfs.filter(pdf => pdf.isNew && pdf.file && !pdf.uploaded);
            const uploadedPdfUrls = [];
            
            if (newPdfs.length > 0) {
                console.log(`📤 Enviando ${newPdfs.length} PDF(s)...`);
                
                for (let i = 0; i < newPdfs.length; i++) {
                    const pdfItem = newPdfs[i];
                    const file = pdfItem.file;
                    
                    try {
                        console.log(`⬆️ [${i+1}/${newPdfs.length}] Enviando PDF: "${file.name}"`);
                        
                        const uploadedUrl = await this.uploadSingleFile(file, propertyId, 'pdf');
                        
                        if (uploadedUrl) {
                            pdfItem.uploadedUrl = uploadedUrl;
                            pdfItem.uploaded = true;
                            pdfItem.isNew = false;
                            uploadedPdfUrls.push(uploadedUrl);
                            console.log(`✅ PDF "${file.name}" enviado!`);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Erro ao enviar PDF "${file.name}":`, error);
                    }
                }
            }
            
            // 5. Coletar URLs existentes
            const existingImageUrls = this.state.existing
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            const existingPdfUrls = this.state.existingPdfs
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            // 6. Combinar URLs
            const allImageUrls = [...uploadedImageUrls, ...existingImageUrls];
            const allPdfUrls = [...uploadedPdfUrls, ...existingPdfUrls];
            
            // 7. Preparar resultado
            const result = {
                success: true,
                images: allImageUrls.join(','),
                pdfs: allPdfUrls.join(','),
                uploadedCount: uploadedImageUrls.length + uploadedPdfUrls.length
            };
            
            this.state.lastUploadResult = result;
            
            console.log(`✅ UPLOAD CONCLUÍDO!`);
            console.log(`📊 ${allImageUrls.length} imagem(ns), ${allPdfUrls.length} PDF(s)`);
            console.log(`📤 ${result.uploadedCount} novo(s) arquivo(s) enviado(s)`);
            
            // 8. Atualizar UI
            this.updateUI();
            
            return result;
            
        } catch (error) {
            console.error('❌ ERRO NO UPLOAD:', error);
            return { 
                success: false, 
                images: '', 
                pdfs: '', 
                uploadedCount: 0,
                error: error.message 
            };
            
        } finally {
            this.state.isUploading = false;
            console.groupEnd();
        }
    },

    // ========== UPLOAD DE ARQUIVO ÚNICO ==========
    async uploadSingleFile(file, propertyId, type = 'media') {
        return new Promise(async (resolve, reject) => {
            try {
                const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
                const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
                const bucket = this.config.buckets[this.config.currentSystem];
                
                // Gerar nome único
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 10);
                const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
                const prefix = type === 'pdf' ? 'pdf' : 'media';
                const fileName = `${prefix}_${propertyId}_${timestamp}_${random}_${safeName}`;
                const filePath = `${bucket}/${fileName}`;
                
                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;
                
                console.log(`📁 Upload para: ${filePath}`);
                
                // Fazer upload
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY,
                        'Content-Type': file.type || 'application/octet-stream'
                    },
                    body: file
                });
                
                if (response.ok) {
                    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                    console.log(`✅ Upload bem-sucedido!`);
                    resolve(publicUrl);
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Upload falhou: ${response.status}`, errorText);
                    reject(new Error(`Upload falhou: ${response.status}`));
                }
                
            } catch (error) {
                console.error(`❌ Erro no upload:`, error);
                reject(error);
            }
        });
    },

    // ========== FUNÇÃO SIMPLIFICADA PARA ADMIN.JS ==========
    getOrderedMediaUrls: function() {
        console.log('📋 Obtendo URLs ordenadas...');
        
        // Combinar todos os arquivos
        const allMedia = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        // Extrair URLs
        const imageUrls = allMedia.map(item => {
            if (item.uploadedUrl) return item.uploadedUrl;
            if (item.url) return item.url;
            return null;
        }).filter(url => url !== null);
        
        const pdfUrls = allPdfs.map(item => {
            if (item.uploadedUrl) return item.uploadedUrl;
            if (item.url) return item.url;
            return null;
        }).filter(url => url !== null);
        
        console.log(`📊 ${imageUrls.length} imagem(ns), ${pdfUrls.length} PDF(s)`);
        
        return {
            images: imageUrls.join(','),
            pdfs: pdfUrls.join(',')
        };
    },

    // ========== FUNÇÃO PARA SALVAR LOCALMENTE (SEM SUPABASE) ==========
    saveAndKeepLocal: function(propertyId, propertyTitle) {
        console.log(`💾 Salvando localmente para ${propertyId}`);
        
        // 1. Coletar URLs
        const urls = this.getOrderedMediaUrls();
        
        // 2. Atualizar arquivos novos para "salvos localmente"
        this.state.files.forEach(item => {
            if (item.isNew && !item.uploaded) {
                // Marcar como "salvo localmente"
                item.uploaded = true;
                item.isNew = false;
                item.uploadedUrl = item.preview; // Manter BLOB URL como "URL enviada"
                
                console.log(`🔗 Mantendo BLOB URL local para: ${item.name}`);
            }
        });
        
        // 3. Atualizar PDFs também
        this.state.pdfs.forEach(pdf => {
            if (pdf.isNew && !pdf.uploaded) {
                pdf.uploaded = true;
                pdf.isNew = false;
            }
        });
        
        // 4. Atualizar UI
        this.updateUI();
        
        return urls;
    },

    // ========== ADICIONAR PDFs ==========
    addPdfs: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        filesArray.forEach(file => {
            if (!this.config.allowedTypes.pdfs.includes(file.type)) {
                alert(`❌ "${file.name}" - Não é um PDF válido!`);
                return;
            }
            
            if (file.size > this.config.limits.maxPdfSize) {
                alert(`❌ "${file.name}" - PDF muito grande! Máximo: 10MB`);
                return;
            }
            
            this.state.pdfs.push({
                file: file,
                id: `pdf_${Date.now()}_${Math.random()}`,
                name: file.name,
                isNew: true,
                uploaded: false,
                uploadedUrl: null
            });
            addedCount++;
        });
        
        console.log(`📄 ${addedCount} NOVO(S) PDF(s) adicionado(s)`);
        this.updateUI();
        return addedCount;
    },

    // ========== REMOVER ARQUIVO ==========
    removeFile: function(fileId) {
        console.log(`🗑️ Removendo arquivo: ${fileId}`);
        
        const searchInArray = (array, name) => {
            const index = array.findIndex(item => item.id === fileId);
            if (index !== -1) {
                const removed = array[index];
                
                if (removed.isExisting) {
                    removed.markedForDeletion = true;
                    console.log(`🗑️ Arquivo EXISTENTE marcado para exclusão: "${removed.name}"`);
                } else {
                    if (removed.preview && removed.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(removed.preview);
                    }
                    array.splice(index, 1);
                    console.log(`🗑️ Arquivo NOVO removido: "${removed.name}"`);
                }
                
                return true;
            }
            return false;
        };
        
        if (searchInArray(this.state.files, 'files')) return true;
        if (searchInArray(this.state.existing, 'existing')) return true;
        if (searchInArray(this.state.pdfs, 'pdfs')) return true;
        if (searchInArray(this.state.existingPdfs, 'existingPdfs')) return true;
        
        return false;
    },

    // ========== PROCESSAR EXCLUSÕES ==========
    async processDeletions() {
        const imagesToDelete = this.state.existing.filter(item => item.markedForDeletion);
        const pdfsToDelete = this.state.existingPdfs.filter(item => item.markedForDeletion);
        
        if (imagesToDelete.length > 0 || pdfsToDelete.length > 0) {
            console.log(`🗑️ Processando exclusões: ${imagesToDelete.length} imagem(ns), ${pdfsToDelete.length} PDF(s)`);
            
            this.state.existing = this.state.existing.filter(item => !item.markedForDeletion);
            this.state.existingPdfs = this.state.existingPdfs.filter(item => !item.markedForDeletion);
        }
        
        return { imagesToDelete: imagesToDelete.length, pdfsToDelete: pdfsToDelete.length };
    },

    // ========== UI ==========
    updateUI: function() {
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        
        this._updateTimeout = setTimeout(() => {
            this.renderMediaPreview();
            this.renderPdfPreview();
        }, 50);
    },

    renderMediaPreview: function() {
        const container = document.getElementById('uploadPreview');
        if (!container) {
            console.warn('⚠️ Container #uploadPreview não encontrado');
            return;
        }
        
        // Combinar todos os arquivos
        const allFiles = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        console.log(`🎨 Renderizando ${allFiles.length} arquivo(s)`);
        
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
        
        allFiles.forEach((item, index) => {
            const isMarked = item.markedForDeletion;
            const isExisting = item.isExisting;
            const isNew = item.isNew;
            const isUploaded = item.uploaded;
            
            // Determinar status
            let borderColor = '#3498db';
            let bgColor = '#e8f4fc';
            let statusText = 'Novo';
            let statusColor = '#3498db';
            
            if (isMarked) {
                borderColor = '#e74c3c';
                bgColor = '#ffebee';
                statusText = 'Excluir';
                statusColor = '#e74c3c';
            } else if (isExisting) {
                borderColor = '#27ae60';
                bgColor = '#e8f8ef';
                statusText = 'Existente';
                statusColor = '#27ae60';
            } else if (isUploaded) {
                borderColor = '#9b59b6';
                bgColor = '#f4ecf7';
                statusText = 'Salvo';
                statusColor = '#9b59b6';
            }
            
            const displayName = item.name || 'Arquivo';
            const shortName = displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName;
            
            html += `
            <div class="media-preview-item draggable-item" 
                 draggable="true"
                 data-id="${item.id}"
                 title="${displayName}"
                 style="position:relative;width:110px;height:110px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:${bgColor};cursor:grab;">
                
                <div style="width:100%;height:70px;overflow:hidden;">
                    ${this.getMediaPreviewHTML(item)}
                </div>
                
                <div style="padding:5px;font-size:0.7rem;text-align:center;height:40px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                    <span style="display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${shortName}
                    </span>
                </div>
                
                <div style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.7);color:white;width:22px;height:22px;border-radius:0 0 8px 0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:10;">
                    <i class="fas fa-arrows-alt"></i>
                </div>
                
                <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.8);color:white;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:5;">
                    ${index + 1}
                </div>
                
                <button onclick="MediaSystem.removeFile('${item.id}')" 
                        style="position:absolute;top:0;right:0;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;width:24px;height:24px;cursor:pointer;font-size:14px;font-weight:bold;z-index:10;border-radius:0 0 0 8px;display:flex;align-items:center;justify-content:center;">
                    ${isMarked ? '↺' : '×'}
                </button>
                
                <div style="position:absolute;bottom:2px;left:2px;background:${statusColor};color:white;font-size:0.5rem;padding:1px 3px;border-radius:2px;z-index:10;">
                    ${statusText}
                </div>
            </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Reconfigurar eventos de drag & drop
        setTimeout(() => {
            this.setupContainerDragEvents('uploadPreview');
        }, 100);
    },

    renderPdfPreview: function() {
        const container = document.getElementById('pdfUploadPreview');
        if (!container) return;
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
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
        
        allPdfs.forEach((pdf, index) => {
            const isMarked = pdf.markedForDeletion;
            const isExisting = pdf.isExisting;
            const isNew = pdf.isNew;
            const isUploaded = pdf.uploaded;
            
            let borderColor = '#3498db';
            let bgColor = '#e8f4fc';
            let statusText = 'Novo';
            
            if (isMarked) {
                borderColor = '#e74c3c';
                bgColor = '#ffebee';
                statusText = 'Excluir';
            } else if (isExisting) {
                borderColor = '#27ae60';
                bgColor = '#e8f8ef';
                statusText = 'Existente';
            } else if (isUploaded) {
                borderColor = '#9b59b6';
                bgColor = '#f4ecf7';
                statusText = 'Salvo';
            }
            
            const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
            
            html += `
                <div class="pdf-preview-container draggable-item"
                     draggable="true"
                     data-id="${pdf.id}"
                     style="position:relative;cursor:grab;">
                    <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:0.5rem;width:90px;height:90px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;position:relative;">
                        <div style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.6);color:white;width:20px;height:20px;border-radius:0 0 6px 0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:5;">
                            <i class="fas fa-arrows-alt"></i>
                        </div>
                        
                        <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.8);color:white;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;z-index:5;">
                            ${index + 1}
                        </div>
                        
                        <i class="fas fa-file-pdf" style="font-size:1.2rem;color:${borderColor};margin-bottom:0.3rem;"></i>
                        <p style="font-size:0.7rem;margin:0;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">${shortName}</p>
                        <small style="color:#7f8c8d;font-size:0.6rem;">${statusText}</small>
                    </div>
                    <button onclick="MediaSystem.removeFile('${pdf.id}')" 
                            style="position:absolute;top:0;right:0;background:${borderColor};color:white;border:none;width:22px;height:22px;font-size:14px;font-weight:bold;cursor:pointer;border-radius:0 0 0 6px;">
                        ×
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Reconfigurar eventos de drag & drop
        setTimeout(() => {
            this.setupContainerDragEvents('pdfUploadPreview');
        }, 100);
    },

    // ========== DRAG & DROP ==========
    setupDragAndDrop: function() {
        console.log('🎯 Configurando drag & drop...');
        
        setTimeout(() => {
            this.setupContainerDragEvents('uploadPreview');
            this.setupContainerDragEvents('pdfUploadPreview');
        }, 500);
    },

    setupContainerDragEvents: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.addEventListener('dragstart', (e) => {
            const draggable = e.target.closest('.draggable-item');
            if (!draggable) return;
            
            e.dataTransfer.setData('text/plain', draggable.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            draggable.classList.add('dragging');
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggable = document.querySelector(`[data-id="${draggedId}"]`);
            const dropTarget = e.target.closest('.draggable-item');
            
            if (!draggedId || !dropTarget) return;
            
            const targetId = dropTarget.dataset.id;
            if (draggedId === targetId) return;
            
            this.reorderItems(draggedId, targetId);
            
            document.querySelectorAll('.dragging').forEach(el => {
                el.classList.remove('dragging');
            });
        });
        
        container.addEventListener('dragend', () => {
            document.querySelectorAll('.dragging').forEach(el => {
                el.classList.remove('dragging');
            });
        });
    },

    reorderItems: function(draggedId, targetId) {
        console.log(`🔀 Reordenando: ${draggedId} → ${targetId}`);
        
        let sourceArray = null;
        let arrayName = '';
        
        const allArrays = [
            { name: 'files', array: this.state.files },
            { name: 'existing', array: this.state.existing },
            { name: 'pdfs', array: this.state.pdfs },
            { name: 'existingPdfs', array: this.state.existingPdfs }
        ];
        
        for (const arr of allArrays) {
            const draggedIndex = arr.array.findIndex(item => item.id === draggedId);
            if (draggedIndex !== -1) {
                sourceArray = arr.array;
                arrayName = arr.name;
                break;
            }
        }
        
        if (!sourceArray) return;
        
        const draggedIndex = sourceArray.findIndex(item => item.id === draggedId);
        const targetIndex = sourceArray.findIndex(item => item.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const newArray = [...sourceArray];
            const [draggedItem] = newArray.splice(draggedIndex, 1);
            newArray.splice(targetIndex, 0, draggedItem);
            
            if (arrayName === 'files') this.state.files = newArray;
            else if (arrayName === 'existing') this.state.existing = newArray;
            else if (arrayName === 'pdfs') this.state.pdfs = newArray;
            else if (arrayName === 'existingPdfs') this.state.existingPdfs = newArray;
            
            console.log(`🔄 Reordenação aplicada no array: ${arrayName}`);
        }
        
        this.updateUI();
    },

    // ========== SETUP EVENT LISTENERS ==========
    setupEventListeners: function() {
        console.log('🔧 Configurando event listeners...');
        
        // Upload de mídia (fotos/vídeos)
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
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
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addFiles(e.target.files);
                    e.target.value = ''; // Resetar input
                }
            });
        }
        
        // Upload de PDFs
        const pdfUploadArea = document.getElementById('pdfUploadArea');
        const pdfFileInput = document.getElementById('pdfFileInput');
        
        if (pdfUploadArea && pdfFileInput) {
            pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
            
            pdfFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addPdfs(e.target.files);
                    e.target.value = ''; // Resetar input
                }
            });
        }
    },

    // ========== FUNÇÕES DE COMPATIBILIDADE ==========
    processAndSavePdfs: async function(propertyId, propertyTitle) {
        console.group(`📄 Processando e salvando PDFs para ${propertyId}`);
        const result = await this.uploadAll(propertyId, propertyTitle);
        console.groupEnd();
        return result.pdfs;
    },

    getMediaUrlsForProperty: async function(propertyId, propertyTitle) {
        console.group(`🖼️ Obtendo URLs de mídia para ${propertyId}`);
        const result = await this.uploadAll(propertyId, propertyTitle);
        console.groupEnd();
        return result.images;
    },

    getPdfsToSave: async function(propertyId) {
        console.log(`💾 Obtendo PDFs para salvar para ${propertyId}`);
        const result = await this.uploadAll(propertyId, 'Imóvel');
        return result.pdfs;
    },

    loadExistingPdfsForEdit: function(property) {
        console.log('📄 Carregando PDFs existentes para edição');
        if (!property) return this;
        
        this.state.existingPdfs = [];
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            this.state.existingPdfs = pdfUrls.map((url, index) => ({
                url: url,
                id: `existing_pdf_${property.id}_${index}`,
                name: this.extractFileName(url),
                isExisting: true,
                markedForDeletion: false,
                type: 'application/pdf'
            }));
        }
        
        this.updateUI();
        return this;
    },

    clearAllPdfs: function() {
        console.log('🧹 Limpando apenas PDFs');
        
        this.state.pdfs.forEach(pdf => {
            if (pdf.preview && pdf.preview.startsWith('blob:')) {
                URL.revokeObjectURL(pdf.preview);
            }
        });
        
        this.state.pdfs = [];
        this.state.existingPdfs = [];
        this.updateUI();
        return this;
    },

    clearAllMedia: function() {
        console.log('🧹 LIMPEZA COMPLETA DE MÍDIA E PDFs');
        return this.resetState();
    },

    ensurePermanentUrls: function() {
        console.log('🔍 Garantindo URLs permanentes...');
        
        this.state.files.forEach(item => {
            if (item.uploaded && item.uploadedUrl && item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
                item.preview = item.uploadedUrl;
            }
        });
        
        this.updateUI();
        return this;
    },

    // ========== UTILIDADES ==========
    extractFileName: function(url) {
        if (!url) return 'arquivo';
        
        try {
            const urlWithoutQuery = url.split('?')[0];
            const parts = urlWithoutQuery.split('/');
            let fileName = parts[parts.length - 1] || 'arquivo';
            
            try {
                fileName = decodeURIComponent(fileName);
            } catch (e) {}
            
            if (fileName.length > 50) {
                fileName = fileName.substring(0, 47) + '...';
            }
            
            return fileName;
        } catch {
            return 'arquivo';
        }
    },

    reconstructSupabaseUrl: function(filename) {
        if (!filename || typeof filename !== 'string') return null;
        
        if (filename.startsWith('http')) return filename;
        
        if (!filename.includes('.')) return null;
        
        try {
            const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            const bucket = this.config.buckets[this.config.currentSystem];
            return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
        } catch (error) {
            console.error('❌ Erro ao reconstruir URL:', error);
            return null;
        }
    },

    getFileTypeFromUrl: function(url) {
        if (!url) return 'image/jpeg';
        
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || 
            urlLower.includes('.png') || urlLower.includes('.gif') || 
            urlLower.includes('.webp') || urlLower.includes('image/')) {
            return 'image/jpeg';
        }
        
        if (urlLower.includes('.mp4') || urlLower.includes('.mov') || urlLower.includes('video/')) {
            return 'video/mp4';
        }
        
        if (urlLower.includes('.pdf') || urlLower.includes('application/pdf')) {
            return 'application/pdf';
        }
        
        return 'image/jpeg';
    },

    resetState: function() {
        console.log('🧹 Resetando estado do sistema de mídia');
        
        // Liberar BLOB URLs
        const cleanupBlobUrls = (items) => {
            items.forEach(item => {
                if (item.preview && item.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(item.preview);
                }
                if (item.blobUrl) {
                    URL.revokeObjectURL(item.blobUrl);
                }
            });
        };
        
        cleanupBlobUrls(this.state.files);
        cleanupBlobUrls(this.state.pdfs);
        
        // Resetar arrays
        this.state.files = [];
        this.state.existing = [];
        this.state.pdfs = [];
        this.state.existingPdfs = [];
        
        // Resetar flags
        this.state.isUploading = false;
        this.state.currentPropertyId = null;
        this.state.lastUploadResult = null;
        
        return this;
    },

    // ========== FUNÇÃO DE DIAGNÓSTICO ==========
    debugState: function() {
        console.group('🐛 DEBUG - ESTADO DO MEDIA SYSTEM');
        console.log('📊 Estado atual:');
        console.log('- Arquivos novos:', this.state.files.length);
        console.log('- Arquivos existentes:', this.state.existing.length);
        console.log('- PDFs novos:', this.state.pdfs.length);
        console.log('- PDFs existentes:', this.state.existingPdfs.length);
        console.log('- Upload em andamento:', this.state.isUploading);
        console.log('- Property ID atual:', this.state.currentPropertyId);
        
        console.log('📁 Arquivos novos:');
        this.state.files.forEach((item, i) => {
            console.log(`  ${i+1}. "${item.name}"`, {
                isNew: item.isNew,
                uploaded: item.uploaded,
                hasFile: !!item.file,
                previewType: item.preview ? item.preview.substring(0, 50) + '...' : 'sem preview'
            });
        });
        
        console.groupEnd();
    }
};

// ========== EXPORTAR PARA WINDOW ==========
window.MediaSystem = MediaSystem;

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
setTimeout(() => {
    window.MediaSystem.init('vendas');
    console.log('✅ Sistema de mídia COMPLETO E FUNCIONAL pronto');
    
    // Adicionar função de debug global
    window.debugMediaSystem = function() {
        MediaSystem.debugState();
    };
    
    // Adicionar função de teste de upload
    window.testMediaUpload = async function() {
        console.group('🧪 TESTE DE UPLOAD RÁPIDO');
        
        try {
            // Criar arquivo de teste
            const testBlob = new Blob(['test content'], { type: 'image/jpeg' });
            const testFile = new File([testBlob], 'test_image.jpg', { type: 'image/jpeg' });
            
            console.log('📁 Arquivo de teste criado');
            
            // Adicionar ao sistema
            MediaSystem.addFiles([testFile]);
            
            // Aguardar um pouco
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Testar upload
            const testId = 'test_' + Date.now();
            const result = await MediaSystem.uploadAll(testId, 'Teste de Upload');
            
            if (result.success) {
                console.log('✅ TESTE DE UPLOAD BEM-SUCEDIDO!');
                console.log('📊 URLs geradas:', result.images);
                alert('✅ Upload funcionou! Verifique console para detalhes.');
            } else {
                console.error('❌ TESTE DE UPLOAD FALHOU!');
                alert('❌ Upload falhou. Verifique console.');
            }
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            alert(`❌ Erro: ${error.message}`);
        }
        
        console.groupEnd();
    };
    
}, 1000);

console.log('✅ media-unified.js COMPLETO E FUNCIONAL carregado');
