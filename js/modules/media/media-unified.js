// js/modules/media/media-unified.js - VERSÃO FINAL FUNCIONAL
console.log('🔄 media-unified.js - VERSÃO FINAL FUNCIONAL');

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
        files: [],           // Arquivos NOVOS (ainda não enviados)
        existing: [],        // Arquivos EXISTENTES (já no Supabase)
        pdfs: [],            // PDFs NOVOS
        existingPdfs: [],    // PDFs EXISTENTES
        isUploading: false,
        currentPropertyId: null,
        uploadedUrls: {      // Cache de URLs já enviadas nesta sessão
            images: [],
            pdfs: []
        }
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

    // ========== CARREGAR ARQUIVOS EXISTENTES - VERSÃO SIMPLIFICADA ==========
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
                .filter(url => url && url !== 'EMPTY' && !url.startsWith('blob:'));
            
            console.log(`📸 ${imageUrls.length} URL(s) de imagem válida(s)`);
            
            this.state.existing = imageUrls.map((url, index) => {
                // Normalizar URL - garantir que seja URL completa do Supabase
                let finalUrl = url;
                if (!url.startsWith('http')) {
                    finalUrl = this.reconstructSupabaseUrl(url) || url;
                }
                
                return {
                    url: finalUrl,
                    preview: finalUrl,
                    id: `existing_img_${property.id}_${index}`,
                    name: this.extractFileName(url),
                    type: this.getFileTypeFromUrl(url),
                    isExisting: true,
                    markedForDeletion: false
                };
            });
        }
        
        // 2. Carregar PDFs EXISTENTES
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY' && !url.startsWith('blob:'));
            
            console.log(`📄 ${pdfUrls.length} URL(s) de PDF válida(s)`);
            
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
        
        // Verificar limites
        const totalAfterAdd = this.state.files.length + this.state.existing.length + filesArray.length;
        if (totalAfterAdd > this.config.limits.maxFiles) {
            alert(`❌ Limite máximo de ${this.config.limits.maxFiles} arquivos atingido!`);
            return 0;
        }
        
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
            
            // Criar BLOB URL para preview
            const blobUrl = URL.createObjectURL(file);
            
            const newItem = {
                file: file,                    // Objeto File original
                id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                preview: blobUrl,              // BLOB URL temporária para preview
                isImage: isImage,
                isVideo: isVideo,
                isNew: true,                   // Marcar como NOVO (não enviado)
                uploaded: false,               // Ainda não foi enviado ao Supabase
                uploadedUrl: null,             // URL após upload bem-sucedido
                blobUrl: blobUrl               // Guardar para limpeza
            };
            
            console.log(`📁 Adicionado NOVO arquivo: "${file.name}" (${(file.size/1024).toFixed(1)}KB)`);
            this.state.files.push(newItem);
            addedCount++;
        });
        
        console.log(`📁 ${addedCount} novo(s) arquivo(s) adicionado(s)`);
        this.updateUI();
        return addedCount;
    },

    // ========== FUNÇÃO DE PREVIEW INTELIGENTE ==========
    getMediaPreviewHTML: function(item) {
        const displayName = item.name || 'Arquivo';
        const shortName = displayName.length > 20 ? displayName.substring(0, 17) + '...' : displayName;
        
        // Se for arquivo NOVO não enviado (tem BLOB URL)
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
        
        // Se for arquivo EXISTENTE ou NOVO já enviado (tem URL permanente)
        if ((item.url || item.uploadedUrl) && !item.url?.startsWith('blob:')) {
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
        
        // Fallback: mostrar ícone
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;">
                <i class="fas fa-image" style="font-size:1.5rem;margin-bottom:5px;"></i>
                <div style="font-size:0.65rem;text-align:center;">${shortName}</div>
            </div>
        `;
    },

    // ========== UPLOAD COMPLETO - VERSÃO OTIMIZADA ==========
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            console.warn('⚠️ Upload já em andamento');
            return { success: false, images: '', pdfs: '' };
        }
        
        this.state.isUploading = true;
        console.group('🚀 INICIANDO UPLOAD COMPLETO');
        console.log(`📌 Property: ${propertyId} - ${propertyTitle}`);
        console.log(`📊 Arquivos para processar: ${this.state.files.length} novo(s), ${this.state.existing.length} existente(s)`);
        
        try {
            // 1. Processar exclusões primeiro
            await this.processDeletions();
            
            // 2. Upload de NOVOS arquivos de mídia
            const newFiles = this.state.files.filter(item => item.isNew && item.file && !item.uploaded);
            const uploadedImageUrls = [];
            
            if (newFiles.length > 0) {
                console.log(`📤 Enviando ${newFiles.length} NOVO(S) arquivo(s) para o Supabase...`);
                
                for (let i = 0; i < newFiles.length; i++) {
                    const fileItem = newFiles[i];
                    const file = fileItem.file;
                    
                    try {
                        console.log(`⬆️ [${i+1}/${newFiles.length}] Enviando: "${file.name}"`);
                        
                        // Upload para Supabase
                        const uploadedUrl = await this.uploadSingleFile(file, propertyId, 'image');
                        
                        if (uploadedUrl) {
                            // Atualizar o item com a URL permanente
                            fileItem.uploadedUrl = uploadedUrl;
                            fileItem.uploaded = true;
                            fileItem.isNew = false;
                            
                            // Liberar BLOB URL temporária
                            if (fileItem.preview && fileItem.preview.startsWith('blob:')) {
                                URL.revokeObjectURL(fileItem.preview);
                                fileItem.preview = uploadedUrl; // Usar URL permanente
                            }
                            
                            uploadedImageUrls.push(uploadedUrl);
                            console.log(`✅ "${file.name}" enviado com sucesso!`);
                        } else {
                            console.error(`❌ Falha ao enviar "${file.name}"`);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Erro ao enviar "${file.name}":`, error);
                    }
                }
            } else {
                console.log('📭 Nenhum novo arquivo para enviar');
            }
            
            // 3. Upload de NOVOS PDFs
            const newPdfs = this.state.pdfs.filter(pdf => pdf.isNew && pdf.file && !pdf.uploaded);
            const uploadedPdfUrls = [];
            
            if (newPdfs.length > 0) {
                console.log(`📤 Enviando ${newPdfs.length} NOVO(S) PDF(s) para o Supabase...`);
                
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
                            console.log(`✅ PDF "${file.name}" enviado com sucesso!`);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Erro ao enviar PDF "${file.name}":`, error);
                    }
                }
            }
            
            // 4. Coletar todas as URLs (novas + existentes não excluídas)
            const allImageUrls = [
                ...uploadedImageUrls,
                ...this.state.existing
                    .filter(item => !item.markedForDeletion && item.url)
                    .map(item => item.url)
            ];
            
            const allPdfUrls = [
                ...uploadedPdfUrls,
                ...this.state.existingPdfs
                    .filter(item => !item.markedForDeletion && item.url)
                    .map(item => item.url)
            ];
            
            // 5. Preparar resultado
            const result = {
                success: true,
                images: allImageUrls.join(','),
                pdfs: allPdfUrls.join(','),
                uploadedCount: uploadedImageUrls.length + uploadedPdfUrls.length
            };
            
            console.log(`✅ UPLOAD CONCLUÍDO COM SUCESSO!`);
            console.log(`📊 Resultado: ${allImageUrls.length} imagem(ns), ${allPdfUrls.length} PDF(s)`);
            console.log(`📤 ${result.uploadedCount} novo(s) arquivo(s) enviado(s)`);
            
            // 6. Atualizar cache de URLs enviadas
            this.state.uploadedUrls.images = [...this.state.uploadedUrls.images, ...uploadedImageUrls];
            this.state.uploadedUrls.pdfs = [...this.state.uploadedUrls.pdfs, ...uploadedPdfUrls];
            
            // 7. Atualizar UI para mostrar URLs permanentes
            this.updateUI();
            
            return result;
            
        } catch (error) {
            console.error('❌ ERRO NO UPLOAD:', error);
            return {
                success: false,
                images: '',
                pdfs: '',
                error: error.message
            };
            
        } finally {
            this.state.isUploading = false;
            console.groupEnd();
        }
    },

    // ========== UPLOAD DE ARQUIVO ÚNICO ==========
    async uploadSingleFile(file, propertyId, type = 'image') {
        return new Promise(async (resolve, reject) => {
            try {
                const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
                const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
                const bucket = this.config.buckets[this.config.currentSystem];
                
                // Gerar nome único para o arquivo
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 10);
                const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
                const prefix = type === 'pdf' ? 'pdf' : 'media';
                const fileName = `${prefix}_${propertyId}_${timestamp}_${random}_${safeName}`;
                const filePath = `${bucket}/${fileName}`;
                
                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;
                
                console.log(`📁 Upload para: ${filePath}`);
                
                // Configurar timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
                
                // Fazer upload
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY,
                        'Content-Type': file.type || 'application/octet-stream'
                    },
                    body: file,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                    console.log(`✅ Upload bem-sucedido: ${publicUrl.substring(0, 100)}...`);
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

    // ========== ADICIONAR PDFs ==========
    addPdfs: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        // Verificar limites
        const totalAfterAdd = this.state.pdfs.length + this.state.existingPdfs.length + filesArray.length;
        if (totalAfterAdd > this.config.limits.maxPdfs) {
            alert(`❌ Limite máximo de ${this.config.limits.maxPdfs} PDFs atingido!`);
            return 0;
        }
        
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
                size: file.size,
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
        console.log(`🗑️ Tentando remover arquivo: ${fileId}`);
        
        // Buscar em todos os arrays
        const searchInArray = (array, name) => {
            const index = array.findIndex(item => item.id === fileId);
            if (index !== -1) {
                const removed = array[index];
                
                if (removed.isExisting) {
                    // Arquivo existente: marcar para exclusão
                    removed.markedForDeletion = true;
                    console.log(`🗑️ Arquivo EXISTENTE marcado para exclusão: "${removed.name}"`);
                } else {
                    // Arquivo novo: remover completamente
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
        
        // Tentar em cada array
        if (searchInArray(this.state.files, 'files')) return true;
        if (searchInArray(this.state.existing, 'existing')) return true;
        if (searchInArray(this.state.pdfs, 'pdfs')) return true;
        if (searchInArray(this.state.existingPdfs, 'existingPdfs')) return true;
        
        console.warn(`⚠️ Arquivo não encontrado: ${fileId}`);
        return false;
    },

    // ========== PROCESSAR EXCLUSÕES ==========
    async processDeletions() {
        const imagesToDelete = this.state.existing.filter(item => item.markedForDeletion);
        const pdfsToDelete = this.state.existingPdfs.filter(item => item.markedForDeletion);
        
        if (imagesToDelete.length > 0 || pdfsToDelete.length > 0) {
            console.log(`🗑️ Processando exclusões: ${imagesToDelete.length} imagem(ns), ${pdfsToDelete.length} PDF(s)`);
            
            // TODO: Implementar exclusão real do Supabase Storage
            // Por enquanto, apenas removemos do array
            
            // Remover dos arrays
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
        
        // Combinar todos os arquivos visíveis
        const allFiles = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        console.log(`🎨 Renderizando ${allFiles.length} arquivo(s) de mídia`);
        
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
            
            // Determinar cores e status
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
                statusText = 'Enviado';
                statusColor = '#9b59b6';
            }
            
            const displayName = item.name || 'Arquivo';
            const shortName = displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName;
            
            html += `
            <div class="media-preview-item draggable-item" 
                 draggable="true"
                 data-id="${item.id}"
                 title="${displayName} - ${statusText}"
                 style="position:relative;width:110px;height:110px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:${bgColor};cursor:grab;">
                
                <!-- Preview da imagem/vídeo -->
                <div style="width:100%;height:70px;overflow:hidden;">
                    ${this.getMediaPreviewHTML(item)}
                </div>
                
                <!-- Nome do arquivo -->
                <div style="padding:5px;font-size:0.7rem;text-align:center;height:40px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                    <span style="display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${shortName}
                    </span>
                </div>
                
                <!-- Ícone de arrastar (CRUZ DE MALTA) -->
                <div style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.7);color:white;width:22px;height:22px;border-radius:0 0 8px 0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:10;">
                    <i class="fas fa-arrows-alt"></i>
                </div>
                
                <!-- Número da ordem -->
                <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.8);color:white;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:5;">
                    ${index + 1}
                </div>
                
                <!-- Botão remover -->
                <button onclick="MediaSystem.removeFile('${item.id}')" 
                        style="position:absolute;top:0;right:0;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;width:24px;height:24px;cursor:pointer;font-size:14px;font-weight:bold;z-index:10;border-radius:0 0 0 8px;display:flex;align-items:center;justify-content:center;">
                    ${isMarked ? '↺' : '×'}
                </button>
                
                <!-- Badge de status -->
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
        if (!container) {
            console.warn('⚠️ Container #pdfUploadPreview não encontrado');
            return;
        }
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        console.log(`🎨 Renderizando ${allPdfs.length} PDF(s)`);
        
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
                statusText = 'Enviado';
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
        console.log('🎯 Configurando sistema de drag & drop...');
        
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

    // ========== FUNÇÕES DE COMPATIBILIDADE ==========
    getOrderedMediaUrls: function() {
        console.log('📋 Obtendo URLs ordenadas para salvar...');
        
        // Primeiro combinar tudo na ordem correta
        const allMedia = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        // Extrair URLs (priorizando uploadedUrl para novos arquivos)
        const imageUrls = allMedia.map(item => {
            if (item.uploadedUrl) return item.uploadedUrl;
            if (item.url && !item.url.startsWith('blob:')) return item.url;
            return null;
        }).filter(url => url !== null);
        
        const pdfUrls = allPdfs.map(item => {
            if (item.uploadedUrl) return item.uploadedUrl;
            if (item.url && !item.url.startsWith('blob:')) return item.url;
            return null;
        }).filter(url => url !== null);
        
        console.log(`📊 URLs para salvar: ${imageUrls.length} imagem(ns), ${pdfUrls.length} PDF(s)`);
        
        return {
            images: imageUrls.join(','),
            pdfs: pdfUrls.join(',')
        };
    },

    processAndSavePdfs: async function(propertyId, propertyTitle) {
        console.group(`📄 Processando e salvando PDFs para ${propertyId}`);
        const result = await this.uploadAll(propertyId, propertyTitle);
        console.groupEnd();
        return result.pdfs;
    },

    clearAllPdfs: function() {
        console.log('🧹 Limpando apenas PDFs');
        
        // Liberar BLOB URLs
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

    loadExistingPdfsForEdit: function(property) {
        console.log('📄 Carregando PDFs existentes para edição');
        if (!property) return this;
        
        this.state.existingPdfs = [];
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY' && !url.startsWith('blob:'));
            
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

    ensurePermanentUrls: function() {
        console.log('🔍 Garantindo URLs permanentes...');
        
        // Para arquivos novos já enviados, garantir que usam URL permanente
        this.state.files.forEach(item => {
            if (item.uploaded && item.uploadedUrl && item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
                item.preview = item.uploadedUrl;
            }
        });
        
        this.updateUI();
        return this;
    },

    // ========== SETUP EVENT LISTENERS ==========
    setupEventListeners: function() {
        console.log('🔧 Configurando event listeners...');
        
        // Upload de mídia
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
                    // Resetar input para permitir selecionar o mesmo arquivo novamente
                    e.target.value = '';
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
                    e.target.value = '';
                }
            });
        }
    },

    // ========== UTILIDADES ==========
    extractFileName: function(url) {
        if (!url) return 'arquivo';
        
        try {
            // Remover query string
            const urlWithoutQuery = url.split('?')[0];
            
            // Extrair nome do arquivo
            const parts = urlWithoutQuery.split('/');
            let fileName = parts[parts.length - 1] || 'arquivo';
            
            // Decodificar URL encoding
            try {
                fileName = decodeURIComponent(fileName);
            } catch (e) {
                // Se falhar, usar como está
            }
            
            // Limitar tamanho
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
        
        // Se já é URL completa, retornar como está
        if (filename.startsWith('http')) return filename;
        
        // Se for apenas um UUID ou nome simples, não tentar reconstruir
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
        
        // Liberar todas as BLOB URLs
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
        this.state.uploadedUrls = { images: [], pdfs: [] };
        
        // Resetar flags
        this.state.isUploading = false;
        this.state.currentPropertyId = null;
        
        return this;
    },

    // ========== FUNÇÃO PARA DEBUG ==========
    debugState: function() {
        console.group('🐛 DEBUG - ESTADO DO SISTEMA DE MÍDIA');
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
                uploadedUrl: item.uploadedUrl ? '✅' : '❌',
                preview: item.preview ? 'Sim' : 'Não'
            });
        });
        
        console.log('📁 Arquivos existentes:');
        this.state.existing.forEach((item, i) => {
            console.log(`  ${i+1}. "${item.name}"`, {
                url: item.url ? item.url.substring(0, 80) + '...' : 'Sem URL',
                markedForDeletion: item.markedForDeletion
            });
        });
        
        console.groupEnd();
    }
};

// ========== EXPORTAR ==========
window.MediaSystem = MediaSystem;

// ========== INICIALIZAÇÃO ==========
setTimeout(() => {
    window.MediaSystem.init('vendas');
    console.log('✅ Sistema de mídia FUNCIONAL pronto');
    
    // Adicionar função de debug global
    window.debugMedia = function() {
        MediaSystem.debugState();
    };
    
}, 1000);

console.log('✅ media-unified.js FUNCIONAL carregado');
