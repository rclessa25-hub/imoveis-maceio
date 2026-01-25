// js/modules/media/media-unified.js - VERSÃO DEFINITIVA CORRIGIDA
console.log('🔄 media-unified.js - VERSÃO DEFINITIVA COM DETECÇÃO DE BLOB URLs');

// ========== USAR window.SUPABASE_CONSTANTS DE SharedCore.js ==========
if (typeof window.SUPABASE_CONSTANTS === 'undefined') {
    window.SUPABASE_CONSTANTS = {
        URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
    console.log('✅ SUPABASE_CONSTANTS definido em media-unified.js');
}

if (typeof window.SUPABASE_URL === 'undefined' || window.SUPABASE_URL === 'undefined') {
    window.SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
    console.log('✅ SUPABASE_URL definida:', window.SUPABASE_URL.substring(0, 50) + '...');
}

if (typeof window.SUPABASE_KEY === 'undefined' || !window.SUPABASE_KEY) {
    window.SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
    console.log('✅ SUPABASE_KEY definida');
}

/**
 * SISTEMA UNIFICADO DE MÍDIA - VERSÃO DEFINITIVA COM DETECÇÃO DE BLOB URLs
 */

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

    // ========== ESTADO GLOBAL ==========
    state: {
        files: [],
        existing: [],
        pdfs: [],
        existingPdfs: [],
        isUploading: false,
        currentPropertyId: null
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

    // ========== FUNÇÃO CRÍTICA CORRIGIDA: DETECTAR TIPO DE BLOB URLs ==========
    detectRealFileType: function(item) {
        console.log(`🔍 Detectando tipo para: ${item.name || item.id}`, {
            url: item.url,
            preview: item.preview,
            type: item.type,
            isExisting: item.isExisting
        });

        // 1. VERIFICAR SE É BLOB URL - CASO ESPECIAL
        const url = item.url || item.preview || '';
        if (url.startsWith('blob:')) {
            console.log(`✅ É uma blob URL: ${url.substring(0, 50)}...`);
            
            // Heurística para blob URLs:
            // - Se foi adicionado recentemente via upload → provavelmente imagem
            // - Se é arquivo existente com nome UUID → provavelmente imagem
            // - Se o sistema de upload criou → provavelmente imagem
            
            if (item.isNew) {
                console.log(`   ↳ Blob URL + isNew = IMAGEM`);
                return 'image';
            }
            
            if (item.isExisting) {
                console.log(`   ↳ Blob URL + isExisting = IMAGEM (assumindo imagem)`);
                return 'image';
            }
            
            // Verificar nome UUID
            if (item.name && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.name)) {
                console.log(`   ↳ Blob URL + nome UUID = IMAGEM`);
                return 'image';
            }
            
            // Por padrão, assumir que blob URLs são imagens
            console.log(`   ↳ Blob URL genérica = IMAGEM (padrão)`);
            return 'image';
        }

        // 2. Tipo do arquivo físico (MIME type) - MAIS CONFIÁVEL
        if (item.file && item.file.type) {
            console.log(`✅ Tipo detectado por MIME do arquivo: ${item.file.type}`);
            if (item.file.type.includes('image')) return 'image';
            if (item.file.type.includes('video')) return 'video';
            if (item.file.type.includes('pdf')) return 'pdf';
        }
        
        // 3. Tipo no objeto item
        if (item.type && item.type !== 'file') {
            if (item.type.includes('image')) return 'image';
            if (item.type.includes('video')) return 'video';
            if (item.type.includes('pdf')) return 'pdf';
        }
        
        // 4. Extensão no nome
        if (item.name) {
            const name = item.name.toLowerCase();
            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.jfif', '.svg'];
            const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv'];
            
            for (const ext of imageExts) {
                if (name.endsWith(ext)) {
                    console.log(`✅ Tipo detectado por extensão: IMAGEM (${ext})`);
                    return 'image';
                }
            }
            for (const ext of videoExts) {
                if (name.endsWith(ext)) {
                    console.log(`✅ Tipo detectado por extensão: VÍDEO (${ext})`);
                    return 'video';
                }
            }
            if (name.endsWith('.pdf')) {
                console.log(`✅ Tipo detectado por extensão: PDF`);
                return 'pdf';
            }
            
            // Se nome contém palavras-chave
            if (name.includes('image') || name.includes('img') || name.includes('photo') || name.includes('foto')) {
                console.log(`✅ Tipo detectado por palavra-chave: IMAGEM`);
                return 'image';
            }
            if (name.includes('video') || name.includes('movie') || name.includes('clip')) {
                console.log(`✅ Tipo detectado por palavra-chave: VÍDEO`);
                return 'video';
            }
        }
        
        // 5. URL permanente
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            const urlLower = url.toLowerCase();
            if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png') || 
                urlLower.includes('.gif') || urlLower.includes('.webp') || 
                urlLower.includes('image/') || urlLower.includes('/images/')) {
                console.log(`✅ Tipo detectado por URL: IMAGEM`);
                return 'image';
            }
            if (urlLower.includes('.mp4') || urlLower.includes('.mov') || 
                urlLower.includes('video/') || urlLower.includes('/videos/')) {
                console.log(`✅ Tipo detectado por URL: VÍDEO`);
                return 'video';
            }
            if (urlLower.includes('.pdf') || urlLower.includes('application/pdf')) {
                console.log(`✅ Tipo detectado por URL: PDF`);
                return 'pdf';
            }
        }
        
        // 6. Heurística final
        if (item.isExisting) {
            // Arquivos existentes sem tipo explícito → assumir imagem
            console.log(`🔍 Heurística: isExisting = IMAGEM (padrão para existentes)`);
            return 'image';
        }
        
        if (item.isNew) {
            // Arquivos novos sem tipo → assumir imagem
            console.log(`🔍 Heurística: isNew = IMAGEM (padrão para novos)`);
            return 'image';
        }
        
        // 7. Flags explícitas
        if (item.isImage === true) return 'image';
        if (item.isVideo === true) return 'video';
        
        console.log(`⚠️ Tipo não detectado para: ${item.name || item.id}`, {
            url: url.substring(0, 100),
            type: item.type
        });
        return 'unknown';
    },

    // ========== OBTER MELHOR URL ==========
    getBestMediaUrl: function(item) {
        // Prioridade 1: URL permanente do Supabase
        if (item.url && item.url.startsWith('https://')) {
            return item.url;
        }
        
        // Prioridade 2: Preview (blob URL ou URL temporária)
        if (item.preview) {
            return item.preview;
        }
        
        // Prioridade 3: Reconstruir URL do Supabase se for só nome do arquivo
        if (item.url && !item.url.startsWith('http') && !item.url.startsWith('blob:')) {
            const reconstructed = this.reconstructSupabaseUrl(item.url);
            if (reconstructed) return reconstructed;
        }
        
        return null;
    },

    // ========== GERAR PREVIEW CORRETO PARA BLOB URLs ==========
    getMediaPreviewHTML: function(item) {
        console.log(`🎨 Gerando preview para: ${item.name || item.id}`);
        
        // 1. Determinar o tipo REAL
        const fileType = this.detectRealFileType(item);
        const shortName = item.name ? 
            (item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name) : 
            'Arquivo';
        
        // 2. Obter a melhor URL disponível
        const mediaUrl = this.getBestMediaUrl(item);
        
        console.log(`📊 Configuração do preview:`, {
            name: shortName,
            detectedType: fileType,
            hasMediaUrl: !!mediaUrl,
            url: mediaUrl ? mediaUrl.substring(0, 80) + '...' : 'none'
        });
        
        // 3. Gerar HTML baseado no tipo detectado
        switch(fileType) {
            case 'image':
                return this.generateImagePreview(item, mediaUrl, shortName);
            case 'video':
                return this.generateVideoPreview(shortName);
            case 'pdf':
                return this.generatePdfPreview(shortName);
            default:
                return this.generateFallbackPreview(shortName, fileType);
        }
    },

    // ========== GERADORES DE PREVIEW ==========
    generateImagePreview: function(item, mediaUrl, shortName) {
        console.log(`🖼️ Gerando preview de IMAGEM: ${shortName}`);
        
        if (mediaUrl) {
            console.log(`   🖼️ URL disponível: ${mediaUrl.substring(0, 80)}...`);
            
            // Criar fallback SVG
            const fallbackSVG = `
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="70" viewBox="0 0 100 70">
                    <rect width="100" height="70" fill="#2c3e50"/>
                    <text x="50" y="35" font-family="Arial" font-size="10" fill="#ecf0f1" 
                          text-anchor="middle" dominant-baseline="middle">
                        ${shortName}
                    </text>
                </svg>
            `;
            
            const fallbackDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fallbackSVG);
            
            // Gerar HTML da imagem
            return `
                <div style="width:100%;height:70px;position:relative;background:#2c3e50;">
                    <img src="${mediaUrl}" 
                         alt="${shortName}"
                         style="width:100%;height:100%;object-fit:cover;"
                         onload="console.log('✅ Imagem carregada: ${shortName.replace(/'/g, "\\'")}')"
                         onerror="
                            console.log('❌ Falha no carregamento: ${shortName.replace(/'/g, "\\'")}');
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                         "
                         loading="lazy">
                    <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;color:#ecf0f1;">
                        <i class="fas fa-image" style="font-size:1.5rem;margin-bottom:5px;color:#3498db;"></i>
                        <div style="font-size:0.65rem;text-align:center;">
                            ${shortName}
                        </div>
                    </div>
                </div>
            `;
        } else {
            console.log(`🖼️ Sem URL, usando fallback: ${shortName}`);
            return `
                <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;">
                    <i class="fas fa-image" style="font-size:1.5rem;margin-bottom:5px;color:#3498db;"></i>
                    <div style="font-size:0.65rem;text-align:center;">
                        ${shortName}
                    </div>
                </div>
            `;
        }
    },

    generateVideoPreview: function(shortName) {
        console.log(`🎥 Gerando preview de VÍDEO: ${shortName}`);
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;">
                <i class="fas fa-video" style="font-size:1.8rem;margin-bottom:5px;color:#e74c3c;"></i>
                <div style="font-size:0.65rem;text-align:center;max-width:100%;padding:0 5px;">
                    ${shortName}
                </div>
            </div>
        `;
    },

    generatePdfPreview: function(shortName) {
        console.log(`📄 Gerando preview de PDF: ${shortName}`);
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;">
                <i class="fas fa-file-pdf" style="font-size:1.8rem;margin-bottom:5px;color:#e74c3c;"></i>
                <div style="font-size:0.65rem;text-align:center;max-width:100%;padding:0 5px;">
                    ${shortName}
                </div>
            </div>
        `;
    },

    generateFallbackPreview: function(shortName, fileType) {
        console.log(`❓ Gerando preview de FALLBACK: ${shortName} (${fileType})`);
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;border:1px dashed #7f8c8d;">
                <i class="fas fa-file" style="font-size:1.5rem;margin-bottom:5px;"></i>
                <div style="font-size:0.65rem;text-align:center;">
                    ${shortName}
                </div>
                <div style="font-size:0.5rem;color:#bdc3c7;margin-top:2px;">
                    ${fileType === 'unknown' ? 'Tipo desconhecido' : fileType}
                </div>
            </div>
        `;
    },

    // ========== CARREGAR ARQUIVOS EXISTENTES (CORRIGIDO) ==========
    loadExisting: function(property) {
        if (!property) return;
        
        console.log(`📥 Carregando mídia existente para imóvel ${property.id}`);
        this.state.currentPropertyId = property.id;
        
        this.state.existing = [];
        this.state.existingPdfs = [];
        
        if (property.images && property.images !== 'EMPTY') {
            const urls = property.images.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            console.log(`📸 ${urls.length} URL(s) de mídia encontrada(s)`);
            
            this.state.existing = urls.map((url, index) => {
                // Verificar se é blob URL
                let finalUrl = url;
                let isBlobUrl = false;
                
                if (url.startsWith('blob:')) {
                    isBlobUrl = true;
                    console.log(`🔵 URL ${index + 1} é BLOB: ${url.substring(0, 80)}...`);
                } else if (!this.isValidUrl(url)) {
                    // Tentar reconstruir URL do Supabase
                    const reconstructed = this.reconstructSupabaseUrl(url);
                    if (reconstructed) {
                        finalUrl = reconstructed;
                        console.log(`🔧 URL ${index + 1} reconstruída: ${reconstructed.substring(0, 80)}...`);
                    }
                }
                
                const fileName = this.extractFileName(finalUrl);
                const item = {
                    url: finalUrl,
                    preview: finalUrl,
                    id: `existing_${property.id}_${index}`,
                    name: fileName,
                    type: this.getFileTypeFromUrl(finalUrl),
                    isExisting: true,
                    markedForDeletion: false,
                    isVisible: true,
                    isBlobUrl: isBlobUrl
                };
                
                // Detectar tipo automaticamente
                const detectedType = this.detectRealFileType(item);
                if (detectedType === 'image') {
                    item.isImage = true;
                    item.type = 'image/jpeg';
                } else if (detectedType === 'video') {
                    item.isVideo = true;
                    item.type = 'video/mp4';
                }
                
                console.log(`   📄 Item ${index + 1}:`, {
                    name: item.name,
                    type: item.type,
                    detectedType: detectedType,
                    isBlobUrl: isBlobUrl
                });
                
                return item;
            });
        }
        
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
        
        setTimeout(() => {
            this.updateUI();
            this.forceReloadPreviews();
        }, 100);
        
        return this;
    },

    // ========== ADICIONAR ARQUIVOS ==========
    addFiles: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        filesArray.forEach(file => {
            const isImage = this.config.allowedTypes.images.includes(file.type);
            const isVideo = this.config.allowedTypes.videos.includes(file.type);
            
            if (!isImage && !isVideo) {
                alert(`❌ "${file.name}" - Tipo não suportado!`);
                return;
            }
            
            if (file.size > this.config.limits.maxSize) {
                alert(`❌ "${file.name}" - Arquivo muito grande! Máximo: 5MB`);
                return;
            }
            
            const newItem = {
                file: file,
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                size: file.size,
                type: file.type,
                preview: URL.createObjectURL(file),
                isImage: isImage,
                isVideo: isVideo,
                isNew: true,
                uploaded: false,
                isBlobUrl: true
            };
            
            console.log(`📁 Adicionando arquivo:`, {
                name: file.name,
                type: file.type,
                isImage: isImage,
                isVideo: isVideo,
                preview: newItem.preview.substring(0, 80) + '...'
            });
            
            this.state.files.push(newItem);
            addedCount++;
        });
        
        console.log(`📁 ${addedCount}/${filesArray.length} arquivo(s) adicionado(s)`);
        this.updateUI();
        return addedCount;
    },

    // ========== REMOVER ARQUIVO ==========
    removeFile: function(fileId) {
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
                
                if (removed.isExisting) {
                    removed.markedForDeletion = true;
                    console.log(`🗑️ Arquivo existente marcado para exclusão: ${removed.name}`);
                } else {
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

    // ========== FORÇAR RELOAD DE PREVIEWS (CORRIGIDO) ==========
    forceReloadPreviews: function() {
        console.group('🔄 FORÇANDO RELOAD DE TODOS OS PREVIEWS');
        
        let updatedCount = 0;
        
        // Para arquivos existentes: garantir que blob URLs são detectadas como imagens
        this.state.existing.forEach(item => {
            if (item.isBlobUrl && !item.isImage && !item.isVideo) {
                // Blob URL sem flags → definir como imagem
                item.isImage = true;
                item.type = 'image/jpeg';
                updatedCount++;
                console.log(`✅ Blob URL "${item.name}" definida como IMAGEM`);
            }
            
            if (!item.type || item.type === 'file') {
                const detectedType = this.detectRealFileType(item);
                if (detectedType !== 'unknown') {
                    item.type = detectedType === 'image' ? 'image/jpeg' : 
                                detectedType === 'video' ? 'video/mp4' : 'application/pdf';
                    updatedCount++;
                    console.log(`🔍 Tipo detectado para ${item.name}: ${detectedType}`);
                }
            }
        });
        
        // Para arquivos novos: garantir que as flags estão corretas
        this.state.files.forEach(item => {
            if (item.file) {
                const shouldBeImage = this.config.allowedTypes.images.includes(item.file.type);
                const shouldBeVideo = this.config.allowedTypes.videos.includes(item.file.type);
                
                if (item.isImage !== shouldBeImage || item.isVideo !== shouldBeVideo) {
                    item.isImage = shouldBeImage;
                    item.isVideo = shouldBeVideo;
                    item.type = item.file.type;
                    updatedCount++;
                    console.log(`🏷️ Flags corrigidas para ${item.name}: isImage=${shouldBeImage}, isVideo=${shouldBeVideo}`);
                }
            }
        });
        
        if (updatedCount > 0) {
            console.log(`📊 ${updatedCount} item(s) atualizado(s)`);
            this.updateUI();
        } else {
            console.log(`📊 Nenhum item precisou ser atualizado`);
        }
        
        console.groupEnd();
        return this;
    },

    // ========== UPLOAD PARA SUPABASE ==========
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            console.warn('⚠️ Upload já em andamento');
            return { images: '', pdfs: '' };
        }
    
        this.state.isUploading = true;
        console.group('🚀 UPLOAD DEFINITIVO');
        console.log(`📌 Property ID: ${propertyId}, Title: ${propertyTitle}`);
        
        try {
            const results = { images: '', pdfs: '' };
            
            await this.processDeletions();
            
            const newFiles = this.state.files.filter(item => item.isNew && item.file && !item.uploaded);
            if (newFiles.length > 0) {
                console.log(`📸 ${newFiles.length} arquivo(s) de mídia para upload`);
                
                const fileObjects = newFiles.map(f => f.file);
                const imageUrls = await this.uploadFiles(fileObjects, propertyId, 'images');
                
                if (imageUrls.length > 0) {
                    newFiles.forEach((file, index) => {
                        if (imageUrls[index]) {
                            if (file.preview && file.preview.startsWith('blob:')) {
                                URL.revokeObjectURL(file.preview);
                            }
                            
                            file.url = imageUrls[index];
                            file.preview = imageUrls[index];
                            file.uploaded = true;
                            file.isNew = false;
                            file.isBlobUrl = false;
                            
                            console.log(`✅ Arquivo "${file.name}" atualizado com URL permanente`);
                        }
                    });
                    
                    results.images = imageUrls.join(',');
                }
            }
            
            const newPdfs = this.state.pdfs.filter(pdf => pdf.isNew && pdf.file && !pdf.uploaded);
            if (newPdfs.length > 0) {
                console.log(`📄 ${newPdfs.length} PDF(s) para upload`);
                
                const pdfObjects = newPdfs.map(p => p.file);
                const pdfUrls = await this.uploadFiles(pdfObjects, propertyId, 'pdfs');
                
                if (pdfUrls.length > 0) {
                    newPdfs.forEach((pdf, index) => {
                        if (pdfUrls[index]) {
                            pdf.url = pdfUrls[index];
                            pdf.uploaded = true;
                            pdf.isNew = false;
                            console.log(`✅ PDF "${pdf.name}" atualizado com URL permanente`);
                        }
                    });
                    
                    results.pdfs = pdfUrls.join(',');
                }
            }
            
            const existingUrls = this.state.existing
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            if (existingUrls.length > 0) {
                if (results.images) {
                    results.images = `${results.images},${existingUrls.join(',')}`;
                } else {
                    results.images = existingUrls.join(',');
                }
            }
            
            const existingPdfUrls = this.state.existingPdfs
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            if (existingPdfUrls.length > 0) {
                if (results.pdfs) {
                    results.pdfs = `${results.pdfs},${existingPdfUrls.join(',')}`;
                } else {
                    results.pdfs = existingPdfUrls.join(',');
                }
            }
            
            console.log('✅ Upload completo:', {
                images: results.images ? `${results.images.split(',').length} URL(s)` : 'Nenhuma',
                pdfs: results.pdfs ? `${results.pdfs.split(',').length} URL(s)` : 'Nenhum'
            });
            
            setTimeout(() => {
                this.ensurePermanentUrls();
            }, 300);
            
            return results;
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            return { images: '', pdfs: '' };
        } finally {
            this.state.isUploading = false;
            console.groupEnd();
        }
    },

    async uploadFiles(files, propertyId, type = 'images') {
        if (!files || files.length === 0) return [];
        
        const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
        const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
        const bucket = this.config.buckets[this.config.currentSystem];
        const uploadedUrls = [];
        
        console.log(`📤 Upload de ${files.length} arquivo(s) para bucket: ${bucket}`);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                console.log(`⬆️ Upload ${i+1}/${files.length}: ${file.name} (${Math.round(file.size/1024)}KB)`);
                
                const fileName = this.generateFileName(file, propertyId, type);
                const filePath = `${bucket}/${fileName}`;
                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;
                
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
                    uploadedUrls.push(publicUrl);
                    console.log(`✅ Upload concluído: ${publicUrl.substring(0, 80)}...`);
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Falha no upload ${file.name}:`, response.status, errorText.substring(0, 200));
                }
                
            } catch (error) {
                console.error(`❌ Erro ao enviar ${file.name}:`, error.message);
            }
        }
        
        console.log(`🎯 Resultado: ${uploadedUrls.length}/${files.length} sucesso(s)`);
        return uploadedUrls;
    },

    // ========== UI UPDATES ==========
    updateUI: function() {
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        
        this._updateTimeout = setTimeout(() => {
            this.renderMediaPreview();
            this.renderPdfPreview();
        }, 50);
    },

    renderMediaPreview: function() {
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
        
        allFiles.forEach((item, index) => {
            const isMarked = item.markedForDeletion;
            const isExisting = item.isExisting;
            const borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : '#3498db');
            const bgColor = isMarked ? '#ffebee' : (isExisting ? '#e8f8ef' : '#e8f4fc');
            
            html += `
            <div class="media-preview-item draggable-item" 
                     draggable="true"
                     data-id="${item.id}"
                     title="Arraste para reordenar"
                     style="position:relative;width:110px;height:110px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:${bgColor};cursor:grab;">
                    
                    <div style="width:100%;height:70px;overflow:hidden;">
                        ${this.getMediaPreviewHTML(item)}
                    </div>
                    
                    <div style="padding:5px;font-size:0.7rem;text-align:center;height:40px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                        <span style="display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                            ${item.name || this.extractFileName(item.url)}
                        </span>
                    </div>
                    
                    <div style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.7);color:white;width:22px;height:22px;border-radius:0 0 8px 0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:10;">
                        <i class="fas fa-arrows-alt"></i>
                    </div>
                    
                    <div class="order-indicator" style="
                        position:absolute;
                        bottom:2px;
                        right:2px;
                        background:rgba(0,0,0,0.8);
                        color:white;
                        width:18px;
                        height:18px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:10px;
                        font-weight:bold;
                        z-index:5;
                    ">${index + 1}</div>
                    
                    <button onclick="MediaSystem.removeFile('${item.id}')" 
                            style="position:absolute;top:0;right:0;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;width:24px;height:24px;cursor:pointer;font-size:14px;font-weight:bold;z-index:10;border-radius:0 0 0 8px;display:flex;align-items:center;justify-content:center;">
                        ${isMarked ? '↺' : '×'}
                    </button>
                    
                    ${isExisting ? 
                        `<div style="position:absolute;bottom:2px;left:2px;background:${isMarked ? '#e74c3c' : '#27ae60'};color:white;font-size:0.5rem;padding:1px 3px;border-radius:2px;z-index:10;">
                            ${isMarked ? 'EXCLUIR' : 'Existente'}
                        </div>` : ''
                    }
                    
                    ${item.isBlobUrl ? 
                        `<div style="position:absolute;top:2px;left:2px;background:#3498db;color:white;font-size:0.5rem;padding:1px 3px;border-radius:2px;z-index:10;">
                            BLOB
                        </div>` : ''
                    }
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    // ========== FUNÇÕES RESTANTES (igual à versão anterior) ==========
    setupDragAndDrop: function() {
        console.log('🎯 Configurando sistema de drag & drop...');
        
        setTimeout(() => {
            this.setupContainerDragEvents('uploadPreview');
            this.setupContainerDragEvents('pdfUploadPreview');
            this.addVisualOrderIndicators();
        }, 800);
    },

    setupContainerDragEvents: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Container ${containerId} não encontrado`);
            return;
        }
        
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
            
            console.log(`🎯 Reordenando: ${draggedId} → ${targetId}`);
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
        console.group(`🔀 Reordenando: ${draggedId} → ${targetId}`);
        
        let sourceArray = null;
        let arrayName = '';
        
        const allArrays = [
            { name: 'files', array: this.state.files, prefix: 'file_' },
            { name: 'existing', array: this.state.existing, prefix: 'existing_' },
            { name: 'pdfs', array: this.state.pdfs, prefix: 'pdf_' },
            { name: 'existingPdfs', array: this.state.existingPdfs, prefix: 'existing_pdf_' }
        ];
        
        for (const arr of allArrays) {
            const draggedIndex = arr.array.findIndex(item => item.id === draggedId);
            if (draggedIndex !== -1) {
                sourceArray = arr.array;
                arrayName = arr.name;
                console.log(`✅ Array identificado: ${arrayName}`);
                break;
            }
        }
        
        if (!sourceArray) {
            console.error('❌ Item arrastado não encontrado!');
            console.groupEnd();
            return;
        }
        
        const draggedIndex = sourceArray.findIndex(item => item.id === draggedId);
        const targetIndex = sourceArray.findIndex(item => item.id === targetId);
        
        console.log(`📊 Índices: dragged[${draggedIndex}], target[${targetIndex}]`);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const newArray = [...sourceArray];
            const [draggedItem] = newArray.splice(draggedIndex, 1);
            newArray.splice(targetIndex, 0, draggedItem);
            
            if (arrayName === 'files') this.state.files = newArray;
            else if (arrayName === 'existing') this.state.existing = newArray;
            else if (arrayName === 'pdfs') this.state.pdfs = newArray;
            else if (arrayName === 'existingPdfs') this.state.existingPdfs = newArray;
            
            console.log(`✅ Reordenação concluída no array ${arrayName}`);
        }
        
        this.updateUI();
        setTimeout(() => {
            this.addVisualOrderIndicators();
        }, 50);
        
        console.groupEnd();
    },

    addVisualOrderIndicators: function() {
        const mediaItems = document.querySelectorAll('#uploadPreview .draggable-item');
        mediaItems.forEach((item, index) => {
            let indicator = item.querySelector('.order-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'order-indicator';
                indicator.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    z-index: 5;
                `;
                item.appendChild(indicator);
            }
            indicator.textContent = index + 1;
        });
        
        const pdfItems = document.querySelectorAll('#pdfUploadPreview .draggable-item');
        pdfItems.forEach((item, index) => {
            let indicator = item.querySelector('.order-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'order-indicator';
                indicator.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    z-index: 5;
                `;
                item.appendChild(indicator);
            }
            indicator.textContent = index + 1;
        });
    },

    addPdfs: function(fileList) {
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

    getOrderedMediaUrls: function() {
        console.log('📋 Obtendo URLs ordenadas...');
        
        const orderedMedia = [...this.state.existing, ...this.state.files]
            .filter(item => !item.markedForDeletion)
            .map(item => item.url || item.preview);
        
        const orderedPdfs = [...this.state.existingPdfs, ...this.state.pdfs]
            .filter(pdf => !pdf.markedForDeletion)
            .map(pdf => pdf.url);
        
        return {
            images: orderedMedia.join(','),
            pdfs: orderedPdfs.join(',')
        };
    },

    resetState: function() {
        console.log('🧹 Resetando estado do sistema de mídia');
        
        this.revokeAllPreviewUrls();
        
        this.state.files = [];
        this.state.existing = [];
        this.state.pdfs = [];
        this.state.existingPdfs = [];
        
        this.state.isUploading = false;
        this.state.currentPropertyId = null;
        
        return this;
    },

    ensurePermanentUrls: function() {
        console.log('🔍 Garantindo URLs permanentes...');
        
        [...this.state.existing, ...this.state.files].forEach(item => {
            if (item.url && item.url.startsWith('http') && item.preview && item.preview.startsWith('blob:')) {
                console.log(`🔄 Substituindo blob URL por URL permanente: ${item.name}`);
                URL.revokeObjectURL(item.preview);
                item.preview = item.url;
            }
        });
        
        return this;
    },

    processAndSavePdfs: async function(propertyId, propertyTitle) {
        console.group(`📄 Processando PDFs para ${propertyId}`);
        const result = await this.uploadAll(propertyId, propertyTitle);
        console.groupEnd();
        return result.pdfs;
    },

    clearAllPdfs: function() {
        console.log('🧹 Limpando apenas PDFs');
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

    validateFile: function(file) {
        const isImage = this.config.allowedTypes.images.includes(file.type);
        const isVideo = this.config.allowedTypes.videos.includes(file.type);
        
        if (!isImage && !isVideo) {
            alert(`❌ "${file.name}" - Tipo não suportado!`);
            return false;
        }
        
        if (file.size > this.config.limits.maxSize) {
            alert(`❌ "${file.name}" - Arquivo muito grande! Máximo: 5MB`);
            return false;
        }
        
        return true;
    },

    validatePdf: function(file) {
        if (!this.config.allowedTypes.pdfs.includes(file.type)) {
            alert(`❌ "${file.name}" - Não é um PDF válido!`);
            return false;
        }
        
        if (file.size > this.config.limits.maxPdfSize) {
            alert(`❌ "${file.name}" - PDF muito grande! Máximo: 10MB`);
            return false;
        }
        
        return true;
    },

    async processDeletions() {
        const imagesToDelete = this.state.existing
            .filter(item => item.markedForDeletion && item.url)
            .map(item => item.url);
        
        const pdfsToDelete = this.state.existingPdfs
            .filter(item => item.markedForDeletion && item.url)
            .map(item => item.url);
        
        console.log(`🗑️ ${imagesToDelete.length} imagem(ns) e ${pdfsToDelete.length} PDF(s) marcados para exclusão`);
        
        this.state.existing = this.state.existing.filter(item => !item.markedForDeletion);
        this.state.existingPdfs = this.state.existingPdfs.filter(item => !item.markedForDeletion);
    },

    renderPdfPreview: function() {
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
        
        allPdfs.forEach((pdf, index) => {
            const isMarked = pdf.markedForDeletion;
            const isExisting = pdf.isExisting;
            const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
            const bgColor = isMarked ? '#ffebee' : (isExisting ? '#e8f8ef' : '#e8f4fc');
            const borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : '#3498db');
            
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
                        <small style="color:#7f8c8d;font-size:0.6rem;">PDF</small>
                    </div>
                    <button onclick="MediaSystem.removeFile('${pdf.id}')" 
                            style="position:absolute;top:0;right:0;background:${borderColor};color:white;border:none;width:22px;height:22px;font-size:14px;font-weight:bold;cursor:pointer;border-radius:0 0 0 6px;display:flex;align-items:center;justify-content:center;">
                        ×
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    setupEventListeners: function() {
        console.log('🔧 Configurando event listeners unificados...');
        
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
                }
            });
        }
        
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
        
        setTimeout(() => {
            this.setupDragAndDrop();
        }, 500);
    },

    isValidUrl: function(url) {
        if (!url || typeof url !== 'string') return false;
        return url.startsWith('http://') || url.startsWith('https://') || 
               url.startsWith('blob:') || url.startsWith('data:');
    },

    reconstructSupabaseUrl: function(filename) {
        if (!filename || typeof filename !== 'string') return null;
        
        const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
        const bucket = this.config.buckets[this.config.currentSystem];
        
        if (filename.startsWith('http')) return filename;
        
        if (filename.includes('.')) {
            try {
                const reconstructedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
                console.log(`🔧 URL reconstruída: ${reconstructedUrl.substring(0, 80)}...`);
                return reconstructedUrl;
            } catch (error) {
                console.error(`❌ Erro ao reconstruir URL:`, error);
                return null;
            }
        }
        
        return null;
    },

    extractFileName: function(url) {
        if (!url) return 'Arquivo';
        
        try {
            if (url.includes('/')) {
                const parts = url.split('/');
                let fileName = parts[parts.length - 1] || 'Arquivo';
                
                try { 
                    fileName = decodeURIComponent(fileName); 
                } catch (e) {}
                
                fileName = fileName.split('?')[0];
                
                if (fileName.length < 5 || fileName.match(/^[0-9a-f]{8}-/i)) {
                    if (url.includes('media_')) {
                        const match = url.match(/media_[^\/]+_([^\/]+)$/);
                        if (match && match[1]) {
                            fileName = match[1];
                        }
                    }
                    
                    if (fileName.length < 5) {
                        fileName = 'Arquivo_' + Date.now().toString().substr(-6);
                    }
                }
                
                return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
            } 
            else {
                if (url.match(/^[0-9a-f]{8}-/i)) {
                    return 'Imagem_' + Date.now().toString().substr(-6);
                }
                return url.length > 50 ? url.substring(0, 47) + '...' : url;
            }
        } catch (error) {
            console.error('❌ Erro ao extrair nome do arquivo:', error);
            return 'Arquivo_' + Date.now().toString().substr(-6);
        }
    },

    getFileTypeFromUrl: function(url) {
        if (!url) return 'file';
        
        try {
            const urlLower = url.toLowerCase();
            
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            if (imageExtensions.some(ext => urlLower.includes(ext))) {
                return 'image/jpeg';
            }
            
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
            if (videoExtensions.some(ext => urlLower.includes(ext))) {
                return 'video/mp4';
            }
            
            if (urlLower.includes('.pdf')) {
                return 'application/pdf';
            }
            
            if (urlLower.includes('image/')) return 'image/jpeg';
            if (urlLower.includes('video/')) return 'video/mp4';
            
            return 'file';
        } catch (error) {
            console.error('❌ Erro ao detectar tipo do arquivo:', error);
            return 'file';
        }
    },

    generateFileName: function(file, propertyId, type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const safeName = file.name
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 40);
        
        const prefix = type === 'pdfs' ? 'pdf' : 'media';
        return `${prefix}_${propertyId}_${timestamp}_${random}_${safeName}`;
    },

    revokeAllPreviewUrls: function() {
        [...this.state.files, ...this.state.pdfs].forEach(item => {
            if (item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
            }
        });
    }
};

// ========== EXPORTAR ==========
window.MediaSystem = MediaSystem;

// ========== INICIALIZAÇÃO ==========
setTimeout(() => {
    window.MediaSystem.init('vendas');
    console.log('✅ Sistema de mídia DEFINITIVO pronto - BLOB URLs 100% suportadas');
    
    window.debugMediaSystem = function() {
        console.group('🐛 DIAGNÓSTICO DO SISTEMA DE MÍDIA');
        console.log('📊 Estado atual:', {
            existing: MediaSystem.state.existing.length,
            files: MediaSystem.state.files.length
        });
        
        console.log('📁 Blob URLs detectadas:');
        [...MediaSystem.state.existing, ...MediaSystem.state.files].forEach((item, index) => {
            if (item.url && item.url.startsWith('blob:')) {
                console.log(`   ${index + 1}. ${item.name}`, {
                    type: item.type,
                    isImage: item.isImage,
                    isVideo: item.isVideo,
                    isBlobUrl: item.isBlobUrl,
                    url: item.url.substring(0, 80) + '...'
                });
            }
        });
        
        console.groupEnd();
    };
    
    console.log('💡 Execute debugMediaSystem() para verificar blob URLs');
    console.log('💡 Execute MediaSystem.forceReloadPreviews() para corrigir automaticamente');
    
}, 1000);

console.log('✅ media-unified.js DEFINITIVO - DETECÇÃO DE BLOB URLs IMPLEMENTADA');
