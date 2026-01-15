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
        
        // Inicializar sistema de drag & drop
        setTimeout(() => {
            this.setupDragAndDrop();
        }, 500);
        
        return this;
    },

    // ========== SISTEMA DE REORDENAÇÃO DRAG & DROP CORRIGIDO ==========
    setupDragAndDrop: function() {
        console.log('🎯 Configurando sistema de drag & drop avançado...');
        
        // Configurar após pequeno delay para garantir DOM carregado
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
        
        console.log(`🎯 Configurando drag para: ${containerId}`);
        
        // Evento de início do drag
        container.addEventListener('dragstart', (e) => {
            const draggable = e.target.closest('.draggable-item');
            if (!draggable) return;
            
            e.dataTransfer.setData('text/plain', draggable.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            
            // Adicionar classe de arraste
            draggable.classList.add('dragging');
            container.classList.add('drag-active');
            
            // Criar ghost image com preview
            if (draggable.querySelector('img')) {
                const img = draggable.querySelector('img');
                e.dataTransfer.setDragImage(img, 50, 50);
            }
            
            console.log('👆 Iniciando drag:', draggable.dataset.id);
        });
        
        // Evento durante o drag
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const draggable = e.target.closest('.draggable-item');
            const afterElement = this.getDragAfterElement(container, e.clientY);
            
            if (draggable) {
                draggable.classList.add('drop-target');
            }
        });
        
        // Evento de saída
        container.addEventListener('dragleave', (e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                document.querySelectorAll('.drop-target').forEach(el => {
                    el.classList.remove('drop-target');
                });
            }
        });
        
        // Evento de soltar
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggable = document.querySelector(`[data-id="${draggedId}"]`);
            const dropTarget = e.target.closest('.draggable-item');
            
            if (!draggedId || !dropTarget) {
                console.log('❌ Drop inválido');
                this.cleanupDragState();
                return;
            }
            
            const targetId = dropTarget.dataset.id;
            
            if (draggedId === targetId) {
                console.log('⚠️ Mesmo item, ignorando');
                this.cleanupDragState();
                return;
            }
            
            console.log(`🎯 Drop: ${draggedId} → ${targetId}`);
            
            // Executar reordenação
            this.reorderItems(draggedId, targetId);
            
            // Limpar estado
            this.cleanupDragState();
        });
        
        // Finalizar drag
        container.addEventListener('dragend', () => {
            this.cleanupDragState();
        });
    },

    getDragAfterElement: function(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    cleanupDragState: function() {
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
        });
        
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        
        document.querySelectorAll('.drag-active').forEach(el => {
            el.classList.remove('drag-active');
        });
    },

    reorderItems: function(draggedId, targetId) {
        console.group(`🔀 REORDENAÇÃO: ${draggedId} → ${targetId}`);
        
        // Determinar qual array está sendo modificado
        let sourceArray, targetArray;
        
        if (draggedId.includes('file_')) {
            sourceArray = this.state.files;
            console.log('📸 Movendo arquivo NOVO');
        } else if (draggedId.includes('existing_')) {
            sourceArray = this.state.existing;
            console.log('🖼️ Movendo arquivo EXISTENTE');
        } else if (draggedId.includes('pdf_')) {
            sourceArray = this.state.pdfs;
            console.log('📄 Movendo PDF NOVO');
        } else if (draggedId.includes('existing_pdf_')) {
            sourceArray = this.state.existingPdfs;
            console.log('📋 Movendo PDF EXISTENTE');
        } else {
            console.error('❌ Tipo de item não reconhecido:', draggedId);
            return;
        }
        
        // Encontrar índices no array REAL
        const draggedIndex = sourceArray.findIndex(item => item.id === draggedId);
        const targetIndex = sourceArray.findIndex(item => item.id === targetId);
        
        console.log(`📊 Índices: dragged[${draggedIndex}], target[${targetIndex}]`);
        
        // Se não encontrou no array atual, procurar no array correspondente
        if (draggedIndex === -1 || targetIndex === -1) {
            console.log('🔍 Item não encontrado no array principal, verificando outro...');
            
            // Para mídias, verificar ambos arrays
            if (draggedId.includes('_') && !draggedId.includes('pdf_')) {
                const allMedia = [...this.state.files, ...this.state.existing];
                const draggedIndexAll = allMedia.findIndex(item => item.id === draggedId);
                const targetIndexAll = allMedia.findIndex(item => item.id === targetId);
                
                if (draggedIndexAll !== -1 && targetIndexAll !== -1) {
                    console.log(`🎯 Reordenando em array combinado: ${draggedIndexAll}→${targetIndexAll}`);
                    this.reorderCombinedArray(draggedId, targetId);
                    this.updateUI();
                    console.groupEnd();
                    return;
                }
            }
            
            console.error('❌ Não foi possível encontrar os itens');
            console.groupEnd();
            return;
        }
        
        // Realizar reordenação NO ARRAY REAL
        const [draggedItem] = sourceArray.splice(draggedIndex, 1);
        sourceArray.splice(targetIndex, 0, draggedItem);
        
        console.log(`✅ Reordenado: ${draggedItem.name || draggedItem.id}`);
        console.log('📋 Novo array:', sourceArray.map(item => item.id));
        
        // Atualizar UI IMEDIATAMENTE
        this.updateUI();
        
        // Adicionar índice visual
        setTimeout(() => {
            this.addVisualOrderIndicators();
        }, 100);
        
        console.groupEnd();
    },

    reorderCombinedArray: function(draggedId, targetId) {
        console.log('🔄 Reordenando array combinado...');
        
        // Combinar todos os itens visíveis
        const allItems = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files,
            ...this.state.existingPdfs.filter(pdf => !pdf.markedForDeletion),
            ...this.state.pdfs
        ];
        
        const draggedIndex = allItems.findIndex(item => item.id === draggedId);
        const targetIndex = allItems.findIndex(item => item.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('❌ Índices não encontrados no array combinado');
            return;
        }
        
        // Determinar arrays de origem
        let draggedArray, targetArray;
        
        if (draggedId.includes('file_')) draggedArray = this.state.files;
        else if (draggedId.includes('existing_')) draggedArray = this.state.existing;
        else if (draggedId.includes('pdf_')) draggedArray = this.state.pdfs;
        else if (draggedId.includes('existing_pdf_')) draggedArray = this.state.existingPdfs;
        
        if (targetId.includes('file_')) targetArray = this.state.files;
        else if (targetId.includes('existing_')) targetArray = this.state.existing;
        else if (targetId.includes('pdf_')) targetArray = this.state.pdfs;
        else if (targetId.includes('existing_pdf_')) targetArray = this.state.existingPdfs;
        
        // Mover entre arrays se necessário
        if (draggedArray !== targetArray) {
            console.log(`🔄 Movendo entre arrays diferentes`);
            
            // Remover do array de origem
            const sourceIndex = draggedArray.findIndex(item => item.id === draggedId);
            if (sourceIndex !== -1) {
                const [movedItem] = draggedArray.splice(sourceIndex, 1);
                
                // Adicionar ao array de destino (no final)
                targetArray.push(movedItem);
                
                console.log(`✅ Movido ${movedItem.id} entre arrays`);
            }
        }
        
        // Atualizar estado para refletir mudanças
        this.state.files = [...this.state.files];
        this.state.existing = [...this.state.existing];
        this.state.pdfs = [...this.state.pdfs];
        this.state.existingPdfs = [...this.state.existingPdfs];
    },

    addVisualOrderIndicators: function() {
        console.log('🔢 Adicionando indicadores visuais de ordem...');
        
        // Para mídias
        const mediaItems = document.querySelectorAll('#uploadPreview .draggable-item');
        mediaItems.forEach((item, index) => {
            let indicator = item.querySelector('.order-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'order-indicator';
                item.appendChild(indicator);
            }
            indicator.textContent = index + 1;
            indicator.style.display = 'flex';
        });
        
        // Para PDFs
        const pdfItems = document.querySelectorAll('#pdfUploadPreview .draggable-item');
        pdfItems.forEach((item, index) => {
            let indicator = item.querySelector('.order-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'order-indicator';
                item.appendChild(indicator);
            }
            indicator.textContent = index + 1;
            indicator.style.display = 'flex';
        });
    },

    // ========== FUNÇÃO DE PREVIEW CORRIGIDA - VERSÃO SIMPLES E FUNCIONAL ==========
    getMediaPreviewHTML: function(item) {
        console.log(`🔍 Gerando preview para: ${item.name || item.id}`);
        
        // Detectar se é imagem de forma mais assertiva
        const hasImageExtension = item.name && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(item.name);
        const isImageType = item.type && item.type.includes('image');
        const isImage = item.isImage || isImageType || hasImageExtension;
        
        // Detectar se é vídeo
        const hasVideoExtension = item.name && /\.(mp4|mov|avi|mkv|webm)$/i.test(item.name);
        const isVideoType = item.type && item.type.includes('video');
        const isVideo = item.isVideo || isVideoType || hasVideoExtension;
        
        // Detectar se é PDF
        const isPdf = item.type && item.type.includes('pdf');
        
        const mediaUrl = item.preview || item.url;
        
        if (!mediaUrl) {
            console.warn(`❌ Sem URL para ${item.name}`);
            return this.getFallbackPreview(item, 'Sem URL');
        }
        
        // 1. SE FOR IMAGEM: Mostrar a imagem real
        if (isImage) {
            console.log(`🖼️ Mostrando imagem: ${item.name}`);
            return this.getImagePreview(mediaUrl, item.name);
        }
        
        // 2. SE FOR VÍDEO: Mostrar ícone de vídeo
        if (isVideo) {
            console.log(`🎥 Mostrando vídeo: ${item.name}`);
            return this.getVideoPreview(item.name);
        }
        
        // 3. SE FOR PDF: Mostrar ícone de PDF
        if (isPdf) {
            console.log(`📄 Mostrando PDF: ${item.name}`);
            return this.getPdfPreview(item.name);
        }
        
        // 4. SE NÃO RECONHECER: Verificar pelo nome do arquivo
        if (item.name) {
            // Se parece com um UUID (arquivo do Supabase sem extensão), tratar como vídeo
            if (item.name.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)) {
                console.log(`🎥 UUID detectado, tratando como vídeo: ${item.name}`);
                return this.getVideoPreview('Vídeo');
            }
            
            // Se tem "media" no nome, tratar como imagem
            if (item.name.toLowerCase().includes('media')) {
                console.log(`🖼️ Nome contém 'media', tratando como imagem: ${item.name}`);
                return this.getImagePreview(mediaUrl, item.name);
            }
        }
        
        // 5. FALLBACK genérico
        console.warn(`⚠️ Tipo não reconhecido para: ${item.name}`);
        return this.getFallbackPreview(item, 'Tipo desconhecido');
    },

    // ========== PREVIEW DE IMAGEM - SIMPLES E DIRETO ==========
    getImagePreview: function(imageUrl, altText) {
        // SVG de fallback (mostrado apenas se a imagem falhar)
        const fallbackSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="70" viewBox="0 0 100 70">
                <rect width="100" height="70" fill="#2c3e50"/>
                <text x="50" y="35" font-family="Arial" font-size="10" fill="#ecf0f1" 
                      text-anchor="middle" dominant-baseline="middle">
                    ${altText ? altText.substring(0, 12) : 'Imagem'}
                </text>
            </svg>
        `;
        const fallbackDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fallbackSVG);
        
        return `
            <img src="${imageUrl}" 
                 alt="${altText || 'Imagem'}"
                 style="width:100%;height:70px;object-fit:cover;background:#2c3e50;"
                 onload="console.log('✅ Imagem carregada: ${altText}')"
                 onerror="console.log('❌ Falha na imagem: ${altText}'); 
                          this.onerror=null; 
                          this.src='${fallbackDataUrl}';
                          this.style.objectFit='contain';
                          this.style.padding='10px';">
        `;
    },

    // ========== PREVIEW DE VÍDEO ==========
    getVideoPreview: function(altText) {
        const shortName = altText ? 
            (altText.length > 12 ? altText.substring(0, 10) + '...' : altText) : 
            'Vídeo';
        
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;">
                <i class="fas fa-video" style="font-size:1.8rem;margin-bottom:5px;"></i>
                <div style="font-size:0.65rem;text-align:center;max-width:100%;padding:0 5px;">
                    ${shortName}
                </div>
            </div>
        `;
    },

    // ========== PREVIEW DE PDF ==========
    getPdfPreview: function(altText) {
        const shortName = altText ? 
            (altText.length > 12 ? altText.substring(0, 10) + '...' : altText) : 
            'PDF';
        
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;">
                <i class="fas fa-file-pdf" style="font-size:1.8rem;margin-bottom:5px;"></i>
                <div style="font-size:0.65rem;text-align:center;max-width:100%;padding:0 5px;">
                    ${shortName}
                </div>
            </div>
        `;
    },

    // ========== FALLBACK PREVIEW ==========
    getFallbackPreview: function(item, reason) {
        const shortName = item.name ? 
            (item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name) : 
            'Arquivo';
        
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;border:1px dashed #7f8c8d;">
                <i class="fas fa-file" style="font-size:1.5rem;margin-bottom:5px;"></i>
                <div style="font-size:0.65rem;text-align:center;">
                    ${shortName}
                </div>
                <div style="font-size:0.5rem;color:#bdc3c7;margin-top:2px;">
                    ${reason}
                </div>
            </div>
        `;
    },
        
    getOrderedMediaUrls: function() {
        console.log('📋 Obtendo URLs ordenadas...');
        
        // Combinar arquivos novos e existentes mantendo a ordem visual
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
            
            // 2. Upload de fotos/vídeos (usar ordem visual)
            if (this.state.files.length > 0 || this.state.existing.length > 0) {
                // Usar ordem atual dos itens
                const allMedia = [...this.state.existing, ...this.state.files]
                    .filter(item => !item.markedForDeletion);
                
                // Upload apenas dos novos
                const newFiles = allMedia.filter(item => item.isNew && item.file);
                if (newFiles.length > 0) {
                    const imageUrls = await this.uploadFiles(
                        newFiles.map(f => f.file),
                        propertyId,
                        'images'
                    );
                    results.images = imageUrls.join(',');
                }
                
                // Adicionar existentes (já ordenados)
                const existingUrls = allMedia
                    .filter(item => item.isExisting && item.url && !item.markedForDeletion)
                    .map(item => item.url);
                
                if (existingUrls.length > 0) {
                    results.images = results.images 
                        ? `${results.images},${existingUrls.join(',')}`
                        : existingUrls.join(',');
                }
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
            const keptExistingPdfs = this.state.existingPdfs
                .filter(item => !item.markedForletion && item.url)
                .map(item => item.url);
            
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
    // ADICIONADAS APÓS uploadAll 

    processAndSavePdfs: async function(propertyId, propertyTitle) {
        console.group(`📄 MediaSystem.processAndSavePdfs CHAMADO para ${propertyId}`);
        console.log('🔍 Estado atual dos PDFs:');
        console.log('- PDFs novos:', this.state.pdfs.length);
        console.log('- PDFs existentes:', this.state.existingPdfs.length);
        console.log('- PDFs marcados para exclusão:', 
            this.state.existingPdfs.filter(p => p.markedForDeletion).length);
        
        const result = await this.uploadAll(propertyId, propertyTitle);
        
        console.log('📊 Resultado do uploadAll:', {
            pdfs: result.pdfs ? `${result.pdfs.split(',').length} URL(s)` : 'Nenhum'
        });
        console.groupEnd();
        
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
            <div class="media-preview-item draggable-item" 
                     draggable="true"
                     data-id="${item.id}"
                     title="Arraste para reordenar"
                     style="position:relative;width:110px;height:110px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:${bgColor};cursor:grab;">
                    
                    <!-- PREVIEW DE IMAGEM OU VÍDEO (70px de altura) -->
                    <div style="width:100%;height:70px;overflow:hidden;">
                        ${this.getMediaPreviewHTML(item)}
                    </div>
                    
                    <!-- Nome do arquivo (40px de altura) -->
                    <div style="padding:5px;font-size:0.7rem;text-align:center;height:40px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                        <span style="display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                            ${item.name || this.extractFileName(item.url)}
                        </span>
                    </div>
                    
                    <!-- Ícone de arrastar (CRUZ DE MALTA) -->
                    <div style="position:absolute;top:2px;left:2px;background:rgba(0,0,0,0.7);color:white;width:20px;height:20px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;z-index:10;">
                        <i class="fas fa-arrows-alt"></i>
                    </div>
                    
                    <!-- Indicador de ordem -->
                    <div class="order-indicator" style="display:none;"></div>
                    
                    <!-- Botão de remover (X VERMELHO) -->
                    <button onclick="MediaSystem.removeFile('${item.id}')" 
                            style="position:absolute;top:2px;right:2px;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:10px;z-index:10;">
                        ${isMarked ? '↺' : '×'}
                    </button>
                    
                    ${isExisting ? 
                        `<div style="position:absolute;bottom:2px;left:2px;background:${isMarked ? '#e74c3c' : '#27ae60'};color:white;font-size:0.5rem;padding:1px 3px;border-radius:2px;z-index:10;">
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
                <div class="pdf-preview-container draggable-item"
                     draggable="true"
                     data-id="${pdf.id}"
                     style="position:relative;cursor:grab;">
                    <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:0.5rem;width:90px;height:90px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;">
                        <!-- Ícone de arrastar -->
                        <div style="position:absolute;top:2px;left:2px;background:rgba(0,0,0,0.6);color:white;padding:2px 5px;border-radius:3px;font-size:0.7rem;z-index:5;">
                            <i class="fas fa-arrows-alt"></i>
                        </div>
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
        
        // Inicializar sistema de drag & drop após setup dos containers
        setTimeout(() => {
            this.setupDragAndDrop();
        }, 500);
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
        'processAndSavePdfs',
        'clearAllPdfs',
        'loadExistingPdfsForEdit',
        'getPdfsToSave',
        'getMediaUrlsForProperty',
        'getOrderedMediaUrls',
        'setupDragAndDrop',
        'setupContainerDragEvents',
        'getDragAfterElement',
        'cleanupDragState',
        'reorderItems',
        'reorderCombinedArray',
        'addVisualOrderIndicators',
        'getMediaPreviewHTML',
        'getImagePreview',
        'getVideoPreview',
        'getPdfPreview',
        'getFallbackPreview'
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
