// js/modules/media/media-unified.js - VERSÃO CORRIGIDA PARA UPLOAD
console.log('🔄 media-unified.js - VERSÃO CORRIGIDA PARA UPLOAD');

// ========== SUPABASE CONSTANTS ==========
if (typeof window.SUPABASE_CONSTANTS === 'undefined') {
    window.SUPABASE_CONSTANTS = {
        URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx1pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
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
        files: [],           // Arquivos NOVOS (com BLOB URLs)
        existing: [],        // Arquivos EXISTENTES (com URLs permanentes)
        pdfs: [],            // PDFs NOVOS
        existingPdfs: [],    // PDFs EXISTENTES
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

    // ========== CARREGAR ARQUIVOS EXISTENTES ==========
    loadExisting: function(property) {
        if (!property) return this;
        
        console.log(`📥 Carregando mídia para imóvel ${property.id}`);
        this.state.currentPropertyId = property.id;
        
        // Limpar arrays
        this.state.existing = [];
        this.state.existingPdfs = [];
        
        // Carregar imagens/vídeos EXISTENTES (apenas URLs permanentes)
        if (property.images && property.images !== 'EMPTY') {
            const urls = property.images.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            console.log(`📸 ${urls.length} URL(s) existente(s) encontrada(s)`);
            
            this.state.existing = urls.map((url, index) => {
                // Se for BLOB URL, ignorar (não deve acontecer em arquivos existentes)
                if (url.startsWith('blob:')) {
                    console.warn(`⚠️ BLOB URL em arquivo existente - ignorando: ${url.substring(0, 50)}...`);
                    return null;
                }
                
                // Reconstruir URL se necessário
                let finalUrl = url;
                if (!url.startsWith('http')) {
                    const reconstructed = this.reconstructSupabaseUrl(url);
                    if (reconstructed) {
                        finalUrl = reconstructed;
                    }
                }
                
                const fileName = this.extractFileName(url);
                
                return {
                    url: finalUrl,
                    preview: finalUrl,
                    id: `existing_${property.id}_${index}`,
                    name: fileName,
                    displayName: fileName,
                    type: this.getFileTypeFromUrl(finalUrl),
                    isExisting: true,
                    markedForDeletion: false
                };
            }).filter(item => item !== null);
        }
        
        // Carregar PDFs EXISTENTES
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY')
                .filter(url => !url.startsWith('blob:')); // Ignorar BLOB URLs
            
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

    // ========== ADICIONAR NOVOS ARQUIVOS ==========
    addFiles: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
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
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                preview: blobUrl,              // BLOB URL temporária
                isImage: isImage,
                isVideo: isVideo,
                isNew: true,                   // Marcar como NOVO
                uploaded: false,               // Ainda não foi enviado
                blobUrl: blobUrl               // Guardar a BLOB URL para limpeza
            };
            
            console.log(`📁 Adicionado NOVO arquivo: ${file.name} (BLOB URL criada)`);
            this.state.files.push(newItem);
            addedCount++;
        });
        
        console.log(`📁 ${addedCount} novo(s) arquivo(s) adicionado(s)`);
        this.updateUI();
        return addedCount;
    },

    // ========== FUNÇÃO DE PREVIEW INTELIGENTE ==========
    getMediaPreviewHTML: function(item) {
        const displayName = item.displayName || item.name || 'Arquivo';
        const shortName = displayName.length > 20 ? displayName.substring(0, 17) + '...' : displayName;
        
        // Se for arquivo NOVO (com BLOB URL), mostrar a imagem REAL
        if (item.isNew && !item.uploaded && item.preview && item.preview.startsWith('blob:')) {
            return `
                <div style="width:100%;height:70px;position:relative;background:#2c3e50;">
                    <img src="${item.preview}" 
                         alt="${displayName}"
                         style="width:100%;height:100%;object-fit:cover;"
                         onload="console.log('✅ Preview de novo arquivo carregado: ${displayName.replace(/'/g, "\\'")}')"
                         onerror="
                            console.log('❌ Falha no preview de novo arquivo: ${displayName.replace(/'/g, "\\'")}');
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
        
        // Se for arquivo EXISTENTE (com URL permanente)
        if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
            return `
                <div style="width:100%;height:70px;position:relative;background:#2c3e50;">
                    <img src="${item.url}" 
                         alt="${displayName}"
                         style="width:100%;height:100%;object-fit:cover;"
                         onload="console.log('✅ Imagem existente carregada: ${displayName.replace(/'/g, "\\'")}')"
                         onerror="
                            console.log('❌ Falha no carregamento de imagem existente: ${displayName.replace(/'/g, "\\'")}');
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

    // ========== UPLOAD COMPLETO - VERSÃO CORRIGIDA ==========
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            console.warn('⚠️ Upload já em andamento');
            return { images: '', pdfs: '' };
        }
        
        this.state.isUploading = true;
        console.group('🚀 UPLOAD COMPLETO DE MÍDIA');
        console.log(`📌 Property ID: ${propertyId}`);
        console.log(`📊 Estado: ${this.state.files.length} novo(s), ${this.state.existing.length} existente(s)`);
        
        try {
            const results = { images: '', pdfs: '' };
            
            // 1. Processar exclusões primeiro
            await this.processDeletions();
            
            // 2. Upload de NOVOS arquivos de mídia (CRÍTICO!)
            const newFiles = this.state.files.filter(item => item.isNew && item.file && !item.uploaded);
            console.log(`📸 ${newFiles.length} NOVO(S) arquivo(s) para upload`);
            
            if (newFiles.length > 0) {
                const uploadedUrls = await this.uploadFilesToSupabase(
                    newFiles.map(f => f.file),
                    propertyId,
                    'media'
                );
                
                console.log(`✅ ${uploadedUrls.length} URL(s) gerada(s) do upload`);
                
                // Atualizar os itens com URLs permanentes
                newFiles.forEach((fileItem, index) => {
                    if (uploadedUrls[index]) {
                        // Liberar a BLOB URL temporária
                        if (fileItem.preview && fileItem.preview.startsWith('blob:')) {
                            URL.revokeObjectURL(fileItem.preview);
                        }
                        
                        // Atualizar com URL permanente
                        fileItem.url = uploadedUrls[index];
                        fileItem.preview = uploadedUrls[index]; // Substituir BLOB URL por URL permanente
                        fileItem.uploaded = true;
                        fileItem.isNew = false;
                        
                        console.log(`🔄 "${fileItem.name}" atualizado com URL permanente`);
                    }
                });
                
                if (uploadedUrls.length > 0) {
                    results.images = uploadedUrls.join(',');
                }
            }
            
            // 3. Upload de NOVOS PDFs
            const newPdfs = this.state.pdfs.filter(pdf => pdf.isNew && pdf.file && !pdf.uploaded);
            if (newPdfs.length > 0) {
                console.log(`📄 ${newPdfs.length} NOVO(S) PDF(s) para upload`);
                
                const uploadedPdfUrls = await this.uploadFilesToSupabase(
                    newPdfs.map(p => p.file),
                    propertyId,
                    'pdf'
                );
                
                if (uploadedPdfUrls.length > 0) {
                    newPdfs.forEach((pdfItem, index) => {
                        if (uploadedPdfUrls[index]) {
                            pdfItem.url = uploadedPdfUrls[index];
                            pdfItem.uploaded = true;
                            pdfItem.isNew = false;
                        }
                    });
                    
                    results.pdfs = uploadedPdfUrls.join(',');
                }
            }
            
            // 4. Adicionar arquivos EXISTENTES não marcados para exclusão
            const existingUrls = this.state.existing
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            const existingPdfUrls = this.state.existingPdfs
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            console.log(`📁 ${existingUrls.length} arquivo(s) existente(s) mantido(s)`);
            console.log(`📄 ${existingPdfUrls.length} PDF(s) existente(s) mantido(s)`);
            
            // 5. Combinar tudo: NOVOS + EXISTENTES
            if (existingUrls.length > 0) {
                if (results.images) {
                    results.images = results.images + ',' + existingUrls.join(',');
                } else {
                    results.images = existingUrls.join(',');
                }
            }
            
            if (existingPdfUrls.length > 0) {
                if (results.pdfs) {
                    results.pdfs = results.pdfs + ',' + existingPdfUrls.join(',');
                } else {
                    results.pdfs = existingPdfUrls.join(',');
                }
            }
            
            console.log(`✅ Upload finalizado: ${results.images ? results.images.split(',').length : 0} imagem(ns), ${results.pdfs ? results.pdfs.split(',').length : 0} PDF(s)`);
            
            // 6. Limpar BLOB URLs temporárias após upload bem-sucedido
            this.cleanupTemporaryBlobUrls();
            
            return results;
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            return { images: '', pdfs: '' };
        } finally {
            this.state.isUploading = false;
            console.groupEnd();
        }
    },

    // ========== FUNÇÃO DE UPLOAD PARA SUPABASE ==========
    async uploadFilesToSupabase(files, propertyId, type = 'media') {
        if (!files || files.length === 0) {
            console.log('📭 Nenhum arquivo para upload');
            return [];
        }
        
        const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
        const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
        const bucket = this.config.buckets[this.config.currentSystem];
        const uploadedUrls = [];
        
        console.log(`📤 Iniciando upload de ${files.length} arquivo(s) para Supabase`);
        console.log(`🔧 Config: bucket=${bucket}, type=${type}`);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                console.log(`⬆️ [${i+1}/${files.length}] Upload: ${file.name} (${Math.round(file.size/1024)}KB)`);
                
                // Gerar nome único para evitar conflitos
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 10);
                const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 40);
                const prefix = type === 'pdf' ? 'pdf' : 'media';
                const fileName = `${prefix}_${propertyId}_${timestamp}_${random}_${safeName}`;
                const filePath = `${bucket}/${fileName}`;
                
                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;
                
                console.log(`📁 Caminho: ${filePath}`);
                
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
                
                console.log(`📡 Resposta: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                    uploadedUrls.push(publicUrl);
                    console.log(`✅ Sucesso: ${publicUrl.substring(0, 80)}...`);
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Falha: ${response.status} - ${errorText.substring(0, 200)}`);
                }
                
            } catch (error) {
                console.error(`❌ Erro ao enviar ${file.name}:`, error.message);
            }
        }
        
        console.log(`🎯 Resultado: ${uploadedUrls.length}/${files.length} arquivo(s) enviado(s) com sucesso`);
        return uploadedUrls;
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
                size: file.size,
                isNew: true,
                uploaded: false
            });
            addedCount++;
        });
        
        console.log(`📄 ${addedCount} NOVO(S) PDF(s) adicionado(s)`);
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
                    // Arquivo existente: marcar para exclusão
                    removed.markedForDeletion = true;
                    console.log(`🗑️ Arquivo existente marcado para exclusão: ${removed.name}`);
                } else {
                    // Arquivo novo: remover completamente
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

    // ========== PROCESSAR EXCLUSÕES ==========
    async processDeletions() {
        // Para imagens/vídeos
        const imagesToDelete = this.state.existing
            .filter(item => item.markedForDeletion && item.url)
            .map(item => ({ url: item.url, name: item.name }));
        
        // Para PDFs
        const pdfsToDelete = this.state.existingPdfs
            .filter(item => item.markedForDeletion && item.url)
            .map(item => ({ url: item.url, name: item.name }));
        
        console.log(`🗑️ Marcados para exclusão: ${imagesToDelete.length} imagem(ns), ${pdfsToDelete.length} PDF(s)`);
        
        // Remover dos arrays (mas não deletar fisicamente do Supabase por enquanto)
        this.state.existing = this.state.existing.filter(item => !item.markedForDeletion);
        this.state.existingPdfs = this.state.existingPdfs.filter(item => !item.markedForDeletion);
        
        return { imagesToDelete, pdfsToDelete };
    },

    // ========== LIMPAR BLOB URLs TEMPORÁRIAS ==========
    cleanupTemporaryBlobUrls: function() {
        console.log('🧹 Limpando BLOB URLs temporárias...');
        
        let cleanedCount = 0;
        
        // Para arquivos que já foram enviados
        this.state.files.forEach(item => {
            if (item.uploaded && item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
                item.preview = item.url; // Usar URL permanente
                cleanedCount++;
            }
        });
        
        console.log(`✅ ${cleanedCount} BLOB URL(s) temporária(s) limpa(s)`);
        return cleanedCount;
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
        if (!container) return;
        
        // Combinar todos os arquivos: existentes + novos
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
            const isNew = item.isNew;
            const borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : (isNew ? '#3498db' : '#f39c12'));
            const bgColor = isMarked ? '#ffebee' : (isExisting ? '#e8f8ef' : (isNew ? '#e8f4fc' : '#fef9e7'));
            const displayName = item.displayName || item.name || 'Arquivo';
            
            html += `
            <div class="media-preview-item draggable-item" 
                 draggable="true"
                 data-id="${item.id}"
                 title="Arraste para reordenar"
                 style="position:relative;width:110px;height:110px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:${bgColor};cursor:grab;">
                
                <!-- Preview -->
                <div style="width:100%;height:70px;overflow:hidden;">
                    ${this.getMediaPreviewHTML(item)}
                </div>
                
                <!-- Nome e Status -->
                <div style="padding:5px;font-size:0.7rem;text-align:center;height:40px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                    <span style="display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${displayName}
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
                <div style="position:absolute;bottom:2px;left:2px;background:${isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : (isNew ? '#3498db' : '#f39c12'))};color:white;font-size:0.5rem;padding:1px 3px;border-radius:2px;z-index:10;">
                    ${isMarked ? 'EXCLUIR' : (isExisting ? 'Existente' : (isNew ? 'Novo' : 'Processado'))}
                </div>
            </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Configurar drag & drop após renderizar
        setTimeout(() => {
            this.setupContainerDragEvents('uploadPreview');
        }, 100);
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
            const isNew = pdf.isNew;
            const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
            const bgColor = isMarked ? '#ffebee' : (isExisting ? '#e8f8ef' : (isNew ? '#e8f4fc' : '#fef9e7'));
            const borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : (isNew ? '#3498db' : '#f39c12'));
            
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
                        <small style="color:#7f8c8d;font-size:0.6rem;">
                            ${isExisting ? 'Existente' : (isNew ? 'Novo' : 'PDF')}
                        </small>
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
        
        // Configurar drag & drop para PDFs
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
        }
        
        this.updateUI();
    },

    // ========== FUNÇÕES DE COMPATIBILIDADE ==========
    getOrderedMediaUrls: function() {
        // Primeiro, garantir que os arquivos novos sejam enviados
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
                .filter(url => url && url !== 'EMPTY')
                .filter(url => !url.startsWith('blob:'));
            
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
        
        // Para arquivos que já foram enviados, usar URL permanente
        this.state.files.forEach(item => {
            if (item.uploaded && item.url && item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
                item.preview = item.url;
            }
        });
        
        return this;
    },

    // ========== SETUP EVENT LISTENERS ==========
    setupEventListeners: function() {
        console.log('🔧 Configurando event listeners...');
        
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
    },

    // ========== UTILIDADES ==========
    extractFileName: function(url) {
        if (!url) return 'arquivo';
        
        try {
            if (url.includes('/')) {
                const parts = url.split('/');
                let fileName = parts[parts.length - 1] || 'arquivo';
                fileName = fileName.split('?')[0];
                return decodeURIComponent(fileName);
            }
            return url;
        } catch {
            return 'arquivo';
        }
    },

    reconstructSupabaseUrl: function(filename) {
        if (!filename || typeof filename !== 'string') return null;
        
        const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
        const bucket = this.config.buckets[this.config.currentSystem];
        
        if (filename.startsWith('http')) return filename;
        
        if (filename.includes('.')) {
            try {
                return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
            } catch (error) {
                return null;
            }
        }
        
        return null;
    },

    getFileTypeFromUrl: function(url) {
        if (!url) return 'image/jpeg';
        
        try {
            const urlLower = url.toLowerCase();
            
            if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png') || 
                urlLower.includes('.gif') || urlLower.includes('.webp') || urlLower.includes('image/')) {
                return 'image/jpeg';
            }
            
            if (urlLower.includes('.mp4') || urlLower.includes('.mov') || urlLower.includes('video/')) {
                return 'video/mp4';
            }
            
            if (urlLower.includes('.pdf') || urlLower.includes('application/pdf')) {
                return 'application/pdf';
            }
            
            return 'image/jpeg';
        } catch (error) {
            return 'image/jpeg';
        }
    },

    resetState: function() {
        console.log('🧹 Resetando estado do sistema de mídia');
        
        // Liberar todas as BLOB URLs
        [...this.state.files, ...this.state.pdfs].forEach(item => {
            if (item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
            }
        });
        
        // Resetar arrays
        this.state.files = [];
        this.state.existing = [];
        this.state.pdfs = [];
        this.state.existingPdfs = [];
        
        // Resetar flags
        this.state.isUploading = false;
        this.state.currentPropertyId = null;
        
        return this;
    }
};

// ========== EXPORTAR ==========
window.MediaSystem = MediaSystem;

// ========== INICIALIZAÇÃO ==========
setTimeout(() => {
    window.MediaSystem.init('vendas');
    console.log('✅ Sistema de mídia CORRIGIDO pronto para upload');
    
    // Adicionar função de teste
    window.testMediaUpload = async function() {
        console.group('🧪 TESTE DE UPLOAD');
        
        // Criar arquivo de teste
        const testBlob = new Blob(['test content'], { type: 'image/jpeg' });
        const testFile = new File([testBlob], 'test_image.jpg', { type: 'image/jpeg' });
        
        console.log('📁 Arquivo de teste criado');
        
        // Adicionar ao sistema
        MediaSystem.addFiles([testFile]);
        
        // Testar upload
        const result = await MediaSystem.uploadAll('test_' + Date.now(), 'Test Property');
        
        if (result.images) {
            console.log('✅ UPLOAD BEM-SUCEDIDO! URL:', result.images);
            alert('✅ Upload funcionou! Verifique console.');
        } else {
            console.error('❌ UPLOAD FALHOU!');
            alert('❌ Upload falhou. Verifique console.');
        }
        
        console.groupEnd();
    };
    
}, 1000);

console.log('✅ media-unified.js CORRIGIDO carregado');
