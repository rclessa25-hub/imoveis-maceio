// js/modules/media/media-unified.js - VERSÃO COMPLETA 100% FUNCIONAL
console.log('🔄 media-unified.js - VERSÃO COMPLETA COM PREVIEW 100% FUNCIONAL');

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
 * SISTEMA UNIFICADO DE MÍDIA - VERSÃO OTIMIZADA
 * Responsabilidade única: Gerenciar todo o estado e operações de mídia
 * Dependências: Supabase, utils.js
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

    // ========== SISTEMA DE REORDENAÇÃO DRAG & DROP ==========
    setupDragAndDrop: function() {
        console.log('🎯 Configurando sistema de drag & drop avançado...');
        
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
        
        container.addEventListener('dragstart', (e) => {
            const draggable = e.target.closest('.draggable-item');
            if (!draggable) return;
            
            e.dataTransfer.setData('text/plain', draggable.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            
            draggable.classList.add('dragging');
            container.classList.add('drag-active');
            
            if (draggable.querySelector('img')) {
                const img = draggable.querySelector('img');
                e.dataTransfer.setDragImage(img, 50, 50);
            }
            
            console.log('👆 Iniciando drag:', draggable.dataset.id);
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const draggable = e.target.closest('.draggable-item');
            const afterElement = this.getDragAfterElement(container, e.clientY);
            
            if (draggable) {
                draggable.classList.add('drop-target');
            }
        });
        
        container.addEventListener('dragleave', (e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                document.querySelectorAll('.drop-target').forEach(el => {
                    el.classList.remove('drop-target');
                });
            }
        });
        
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
            this.reorderItems(draggedId, targetId);
            this.cleanupDragState();
        });
        
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
            this.reorderCombinedArray(draggedId, targetId);
            this.updateUI();
            console.groupEnd();
            return;
        }
        
        const draggedIndex = sourceArray.findIndex(item => item.id === draggedId);
        const targetIndex = sourceArray.findIndex(item => item.id === targetId);
        
        console.log(`📊 Índices: dragged[${draggedIndex}], target[${targetIndex}]`);
        
        if (targetIndex === -1) {
            console.log(`⚠️ Target ${targetId} não encontrado no array ${arrayName}`);
            
            const allVisibleItems = [
                ...this.state.existing.filter(item => !item.markedForDeletion),
                ...this.state.files,
                ...this.state.existingPdfs.filter(pdf => !pdf.markedForDeletion),
                ...this.state.pdfs
            ];
            
            const draggedIndexAll = allVisibleItems.findIndex(item => item.id === draggedId);
            const targetIndexAll = allVisibleItems.findIndex(item => item.id === targetId);
            
            if (draggedIndexAll !== -1 && targetIndexAll !== -1) {
                console.log(`🎯 Encontrado em array combinado: ${draggedIndexAll}→${targetIndexAll}`);
                this.reorderInCombinedArray(draggedIndexAll, targetIndexAll, allVisibleItems);
                this.updateUI();
                console.groupEnd();
                return;
            } else {
                console.error('❌ Não foi possível encontrar os itens!');
                console.groupEnd();
                return;
            }
        }
        
        const newArray = [...sourceArray];
        const [draggedItem] = newArray.splice(draggedIndex, 1);
        newArray.splice(targetIndex, 0, draggedItem);
        
        if (arrayName === 'files') this.state.files = newArray;
        else if (arrayName === 'existing') this.state.existing = newArray;
        else if (arrayName === 'pdfs') this.state.pdfs = newArray;
        else if (arrayName === 'existingPdfs') this.state.existingPdfs = newArray;
        
        console.log(`✅ Reordenação concluída no array ${arrayName}`);
        console.log('📋 Nova ordem:', newArray.map(item => item.name || item.id));
        
        this.updateUI();
        
        setTimeout(() => {
            this.addVisualOrderIndicators();
        }, 50);
        
        console.groupEnd();
    },

    reorderInCombinedArray: function(draggedIndex, targetIndex, combinedArray) {
        console.log('🔄 Reordenando no array combinado...');
        
        const newCombinedArray = [...combinedArray];
        const [draggedItem] = newCombinedArray.splice(draggedIndex, 1);
        newCombinedArray.splice(targetIndex, 0, draggedItem);
        
        let filesIndex = 0;
        let existingIndex = 0;
        let pdfsIndex = 0;
        let existingPdfsIndex = 0;
        
        const newFiles = [];
        const newExisting = [];
        const newPdfs = [];
        const newExistingPdfs = [];
        
        newCombinedArray.forEach(item => {
            if (item.id.includes('file_')) {
                newFiles.push({ ...item });
                filesIndex++;
            } else if (item.id.includes('existing_') && !item.id.includes('pdf_')) {
                newExisting.push({ ...item });
                existingIndex++;
            } else if (item.id.includes('pdf_') && !item.id.includes('existing_')) {
                newPdfs.push({ ...item });
                pdfsIndex++;
            } else if (item.id.includes('existing_pdf_')) {
                newExistingPdfs.push({ ...item });
                existingPdfsIndex++;
            }
        });
        
        this.state.files = newFiles;
        this.state.existing = newExisting;
        this.state.pdfs = newPdfs;
        this.state.existingPdfs = newExistingPdfs;
        
        console.log(`📊 Arrays reconstruídos: ${newFiles.length} files, ${newExisting.length} existing, ${newPdfs.length} pdfs, ${newExistingPdfs.length} existingPdfs`);
    },

    reorderCombinedArray: function(draggedId, targetId) {
        console.log('🔄 Reordenando array combinado...');
        
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
        
        let draggedArray, targetArray;
        
        if (draggedId.includes('file_')) draggedArray = this.state.files;
        else if (draggedId.includes('existing_')) draggedArray = this.state.existing;
        else if (draggedId.includes('pdf_')) draggedArray = this.state.pdfs;
        else if (draggedId.includes('existing_pdf_')) draggedArray = this.state.existingPdfs;
        
        if (targetId.includes('file_')) targetArray = this.state.files;
        else if (targetId.includes('existing_')) targetArray = this.state.existing;
        else if (targetId.includes('pdf_')) targetArray = this.state.pdfs;
        else if (targetId.includes('existing_pdf_')) targetArray = this.state.existingPdfs;
        
        if (draggedArray !== targetArray) {
            console.log(`🔄 Movendo entre arrays diferentes`);
            
            const sourceIndex = draggedArray.findIndex(item => item.id === draggedId);
            if (sourceIndex !== -1) {
                const [movedItem] = draggedArray.splice(sourceIndex, 1);
                targetArray.push(movedItem);
                console.log(`✅ Movido ${movedItem.id} entre arrays`);
            }
        }
        
        this.state.files = [...this.state.files];
        this.state.existing = [...this.state.existing];
        this.state.pdfs = [...this.state.pdfs];
        this.state.existingPdfs = [...this.state.existingPdfs];
    },

    addVisualOrderIndicators: function() {
        console.log('🔢 Adicionando indicadores visuais de ordem...');
        
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
            indicator.style.display = 'flex';
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
            indicator.style.display = 'flex';
        });
    },

    // ========== FUNÇÃO CRÍTICA: getMediaPreviewHTML - VERSÃO FINAL CORRIGIDA ==========
    getMediaPreviewHTML: function(item) {
        console.log(`🔍 Gerando preview para: ${item.name || item.id}`);
        
        // ✅✅✅ DETECTAR TIPO PRIMEIRO (ANTES DE VERIFICAR URL)
        const isImage = this.isImageFile(item);
        const isVideo = this.isVideoFile(item);
        const isPdf = this.isPdfFile(item);
        
        console.log(`📊 Detecção: ${isImage ? 'IMAGEM' : ''} ${isVideo ? 'VÍDEO' : ''} ${isPdf ? 'PDF' : ''}`);
        
        // ✅ CRÍTICO: Se sabemos que é uma imagem, mas não temos URL, usar fallback especial
        if (isImage && (!item.url && !item.preview)) {
            console.log(`🖼️ Imagem sem URL, usando fallback especial: ${item.name}`);
            return this.getImageFallbackPreview(item.name);
        }
        
        // ✅ AGORA SIM, buscar URL para mostrar
        let mediaUrl = null;
        
        // 1. Verificar se temos URL permanente válida
        if (item.url && this.isValidUrl(item.url)) {
            mediaUrl = item.url;
            console.log(`✅ Usando URL permanente: ${item.url.substring(0, 80)}...`);
        } 
        // 2. Se não, verificar preview
        else if (item.preview && this.isValidUrl(item.preview)) {
            mediaUrl = item.preview;
            console.log(`⚠️ Usando preview: ${item.preview.substring(0, 80)}...`);
        }
        // 3. Se for um arquivo com blob URL, usar diretamente
        else if (item.preview && item.preview.startsWith('blob:')) {
            mediaUrl = item.preview;
            console.log(`📎 Usando blob URL para: ${item.name}`);
        }
        // 4. Verificar se é uma URL do Supabase que precisa ser reconstruída
        else if (item.url && !this.isValidUrl(item.url)) {
            const reconstructedUrl = this.reconstructSupabaseUrl(item.url);
            if (reconstructedUrl) {
                mediaUrl = reconstructedUrl;
                console.log(`🔧 URL reconstruída: ${reconstructedUrl.substring(0, 80)}...`);
            }
        }
        
        // ✅ SE FOR IMAGEM: Mostrar a imagem real ou fallback
        if (isImage) {
            if (mediaUrl) {
                console.log(`🖼️ Mostrando imagem real: ${item.name}`);
                return this.getImagePreview(mediaUrl, item.name);
            } else {
                console.log(`🖼️ Imagem sem URL válida, usando fallback: ${item.name}`);
                return this.getImageFallbackPreview(item.name);
            }
        }
        
        // ✅ SE FOR VÍDEO: Mostrar ícone de vídeo
        if (isVideo) {
            console.log(`🎥 Mostrando vídeo: ${item.name}`);
            return this.getVideoPreview(item.name);
        }
        
        // ✅ SE FOR PDF: Mostrar ícone de PDF
        if (isPdf) {
            console.log(`📄 Mostrando PDF: ${item.name}`);
            return this.getPdfPreview(item.name);
        }
        
        // ✅ FALLBACK genérico (só chega aqui se não for imagem, vídeo ou PDF)
        console.warn(`⚠️ Tipo não reconhecido para: ${item.name}`, {
            url: item.url,
            preview: item.preview,
            type: item.type
        });
        return this.getFallbackPreview(item, 'Arquivo');
    },

    // ========== NOVA FUNÇÃO: getImageFallbackPreview ==========
    getImageFallbackPreview: function(imageName) {
        const shortName = imageName ? imageName.substring(0, 20) : 'Imagem';
        
        return `
            <div style="width:100%;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2c3e50;color:#ecf0f1;border:1px solid #7f8c8d;">
                <i class="fas fa-image" style="font-size:1.5rem;margin-bottom:5px;color:#3498db;"></i>
                <div style="font-size:0.65rem;text-align:center;">
                    ${shortName}
                </div>
                <div style="font-size:0.5rem;color:#bdc3c7;margin-top:2px;">
                    Imagem
                </div>
            </div>
        `;
    },

    // ========== PREVIEW DE IMAGEM - COM FALLBACK MELHORADO ==========
    getImagePreview: function(imageUrl, altText) {
        const shortName = altText ? altText.substring(0, 20) : 'Imagem';
        
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
        
        return `
            <img src="${imageUrl}" 
                 alt="${altText || 'Imagem'}"
                 style="width:100%;height:70px;object-fit:cover;background:#2c3e50;"
                 onload="console.log('✅ Imagem carregada: ${shortName}')"
                 onerror="
                    console.log('❌ Falha na imagem: ${shortName}'); 
                    this.onerror=null; 
                    this.src='${fallbackDataUrl}';
                    this.style.objectFit='contain';
                    this.style.padding='10px';
                 "
                 loading="lazy">
        `;
    },

    // ========== FUNÇÕES DE DETECÇÃO CORRIGIDAS ==========
    isImageFile: function(item) {
        // 1. Verificar flag explícita
        if (item.isImage === true) return true;
        if (item.isImage === false) return false;
        
        // 2. Verificar por tipo MIME
        if (item.type && item.type.includes('image')) return true;
        
        // 3. Verificar por extensão no nome (CRÍTICO PARA SEU CASO)
        if (item.name) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.jfif'];
            const nameLower = item.name.toLowerCase();
            
            // Verificar se termina com extensão de imagem
            if (imageExtensions.some(ext => nameLower.endsWith(ext))) {
                return true;
            }
            
            // ✅ NOVO: Se o nome começa com "Imagem_" (seus casos), assumir que é imagem
            if (nameLower.includes('imagem_') || nameLower.startsWith('imagem')) {
                return true;
            }
            
            // ✅ NOVO: Se o item tem arquivo (file) e é do tipo image
            if (item.file && item.file.type && item.file.type.includes('image')) {
                return true;
            }
        }
        
        // 4. Verificar por URL
        if (item.url || item.preview) {
            const url = (item.url || item.preview).toLowerCase();
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            
            if (imageExtensions.some(ext => url.includes(ext))) {
                return true;
            }
            
            if (url.includes('image/')) {
                return true;
            }
        }
        
        // 5. Verificar se é um arquivo existente com preview
        if (item.isExisting && item.preview) {
            return true;
        }
        
        return false;
    },

    isVideoFile: function(item) {
        if (item.isVideo === true) return true;
        if (item.type && item.type.includes('video')) return true;
        
        if (item.name) {
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
            return videoExtensions.some(ext => 
                item.name.toLowerCase().endsWith(ext)
            );
        }
        
        const url = item.url || item.preview || '';
        return url.toLowerCase().includes('.mp4') || 
               url.toLowerCase().includes('.mov') ||
               url.toLowerCase().includes('video/');
    },

    isPdfFile: function(item) {
        if (item.type && item.type.includes('pdf')) return true;
        
        if (item.name && item.name.toLowerCase().endsWith('.pdf')) {
            return true;
        }
        
        const url = item.url || item.preview || '';
        return url.toLowerCase().includes('.pdf') || 
               url.toLowerCase().includes('application/pdf');
    },

    // ========== FUNÇÕES DE VALIDAÇÃO DE URL ==========
    isValidUrl: function(url) {
        if (!url || typeof url !== 'string') return false;
        
        if (url.startsWith('http://') || url.startsWith('https://') || 
            url.startsWith('blob:') || url.startsWith('data:')) {
            return true;
        }
        
        const supabaseKeywords = ['supabase.co', 'storage/v1', 'object/public'];
        if (supabaseKeywords.some(keyword => url.includes(keyword))) {
            return true;
        }
        
        return false;
    },

    reconstructSupabaseUrl: function(filename) {
        if (!filename || typeof filename !== 'string') return null;
        
        const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
        const bucket = this.config.buckets[this.config.currentSystem];
        
        if (filename.startsWith('http')) return filename;
        
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(filename)) {
            console.warn(`⚠️ URL é apenas UUID: ${filename}`);
            return null;
        }
        
        if (filename.includes('.')) {
            try {
                const reconstructedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
                console.log(`🔧 URL reconstruída: ${reconstructedUrl.substring(0, 80)}...`);
                return reconstructedUrl;
            } catch (error) {
                console.error(`❌ Erro ao reconstruir URL para ${filename}:`, error);
                return null;
            }
        }
        
        return null;
    },

    // ========== FUNÇÃO loadExisting CORRIGIDA ==========
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
                let finalUrl = url;
                if (!this.isValidUrl(url)) {
                    const reconstructed = this.reconstructSupabaseUrl(url);
                    if (reconstructed) {
                        finalUrl = reconstructed;
                        console.log(`🔧 URL corrigida: ${url} → ${reconstructed.substring(0, 80)}...`);
                    }
                }
                
                const item = {
                    url: finalUrl,
                    preview: finalUrl,
                    id: `existing_${property.id}_${index}`,
                    name: this.extractFileName(finalUrl),
                    type: this.getFileTypeFromUrl(finalUrl),
                    isExisting: true,
                    markedForDeletion: false,
                    isVisible: true,
                    isImage: this.isImageFile({ url: finalUrl, name: this.extractFileName(finalUrl) })
                };
                
                console.log(`   📄 Item ${index + 1}:`, {
                    name: item.name,
                    url: finalUrl.substring(0, 80) + (finalUrl.length > 80 ? '...' : ''),
                    isImage: item.isImage
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
                markedForDeletion: false
            }));
        }
        
        setTimeout(() => {
            this.updateUI();
            this.forceReloadPreviews();
        }, 100);
        
        return this;
    },

    // ========== FUNÇÃO addFiles CORRIGIDA ==========
    addFiles: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        filesArray.forEach(file => {
            if (this.validateFile(file)) {
                const newItem = {
                    file: file,
                    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    preview: URL.createObjectURL(file),
                    isImage: this.config.allowedTypes.images.includes(file.type),
                    isVideo: this.config.allowedTypes.videos.includes(file.type),
                    isNew: true,
                    uploaded: false
                };
                
                if (!newItem.isImage && !newItem.isVideo) {
                    newItem.isImage = this.isImageFile(newItem);
                    newItem.isVideo = this.isVideoFile(newItem);
                }
                
                this.state.files.push(newItem);
                addedCount++;
                
                console.log(`📁 Arquivo adicionado: ${file.name}`, {
                    isImage: newItem.isImage,
                    isVideo: newItem.isVideo,
                    type: file.type
                });
            }
        });
        
        console.log(`📁 ${addedCount}/${filesArray.length} arquivo(s) adicionado(s)`);
        this.updateUI();
        return addedCount;
    },

    // ========== FUNÇÃO extractFileName MELHORADA ==========
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
                        if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
                            fileName = 'Imagem_' + Date.now().toString().substr(-6);
                        } else {
                            fileName = 'Arquivo_' + Date.now().toString().substr(-6);
                        }
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
            return 'Imagem_' + Date.now().toString().substr(-6);
        }
    },

    // ========== FUNÇÃO getFileTypeFromUrl MELHORADA ==========
    getFileTypeFromUrl: function(url) {
        if (!url) return 'file';
        
        try {
            const urlLower = url.toLowerCase();
            
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.jfif'];
            if (imageExtensions.some(ext => urlLower.includes(ext))) {
                return 'image';
            }
            
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
            if (videoExtensions.some(ext => urlLower.includes(ext))) {
                return 'video';
            }
            
            if (urlLower.includes('.pdf')) {
                return 'pdf';
            }
            
            if (urlLower.includes('image/')) return 'image';
            if (urlLower.includes('video/')) return 'video';
            if (urlLower.includes('application/pdf')) return 'pdf';
            
            return 'file';
        } catch (error) {
            console.error('❌ Erro ao detectar tipo do arquivo:', error);
            return 'file';
        }
    },

    // ========== FUNÇÃO forceReloadPreviews ==========
    forceReloadPreviews: function() {
        console.group('🔄 FORÇANDO RELOAD DE TODOS OS PREVIEWS');
        
        let updatedCount = 0;
        
        [...this.state.existing, ...this.state.files].forEach(item => {
            if (item.url && !item.preview) {
                item.preview = item.url;
                console.log(`✅ Preview restaurado para: ${item.name}`);
                updatedCount++;
            } 
            else if (item.url && item.preview && item.url !== item.preview) {
                const urlValid = this.isValidUrl(item.url);
                
                if (urlValid) {
                    if (item.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(item.preview);
                    }
                    
                    item.preview = item.url;
                    console.log(`🔄 Preview atualizado: ${item.name}`);
                    updatedCount++;
                }
            }
            
            if (!item.isImage && !item.isVideo) {
                item.isImage = this.isImageFile(item);
                item.isVideo = this.isVideoFile(item);
                
                if (item.isImage || item.isVideo) {
                    console.log(`🏷️ Flag corrigida para ${item.name}: isImage=${item.isImage}, isVideo=${item.isVideo}`);
                    updatedCount++;
                }
            }
        });
        
        if (updatedCount > 0) {
            console.log(`📊 ${updatedCount} item(s) atualizado(s)`);
            setTimeout(() => this.updateUI(), 50);
        }
        
        console.groupEnd();
        return this;
    },

    // ========== FUNÇÃO updateUI ==========
    updateUI: function() {
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        
        this._updateTimeout = setTimeout(() => {
            this.renderMediaPreview();
            this.renderPdfPreview();
        }, 50);
    },

    // ========== FUNÇÃO renderMediaPreview ==========
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
                    ">${allFiles.findIndex(f => f.id === item.id) + 1}</div>
                    
                    <button onclick="MediaSystem.removeFile('${item.id}')" 
                            style="position:absolute;top:0;right:0;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;width:24px;height:24px;cursor:pointer;font-size:14px;font-weight:bold;z-index:10;border-radius:0 0 0 8px;display:flex;align-items:center;justify-content:center;">
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

    // ========== API PÚBLICA - PDFs ==========
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

    // ========== UPLOAD PARA SUPABASE ==========
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            console.warn('⚠️ Upload já em andamento');
            return { images: '', pdfs: '' };
        }
    
        this.state.isUploading = true;
        console.group('🚀 UPLOAD UNIFICADO DEFINITIVO');
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
                this.forceReloadPreviews();
            }, 300);
            
            return results;
            
        } catch (error) {
            console.error('❌ Erro no upload unificado:', error);
            return { images: '', pdfs: '' };
        } finally {
            this.state.isUploading = false;
            console.groupEnd();
        }
    },

    async uploadFiles(files, propertyId, type = 'images') {
        console.group(`📤 UPLOAD FILES (${files.length} arquivo(s))`);
        
        if (!files || files.length === 0) {
            console.warn('⚠️ Nenhum arquivo para upload');
            console.groupEnd();
            return [];
        }
        
        const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
        const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
        
        const bucket = this.config.buckets[this.config.currentSystem];
        const uploadedUrls = [];
        
        console.log('🔧 Configuração:', {
            filesCount: files.length,
            propertyId,
            type,
            bucket,
            SUPABASE_URL: SUPABASE_URL.substring(0, 50) + '...',
            KEY_DISPONIVEL: SUPABASE_KEY ? '✅ Sim' : '❌ Não'
        });
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                console.log(`⬆️ Upload ${i+1}/${files.length}: ${file.name} (${Math.round(file.size/1024)}KB)`);
                
                const fileName = this.generateFileName(file, propertyId, type);
                const filePath = `${bucket}/${fileName}`;
                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;
                
                console.log(`📁 URL de upload: ${uploadUrl.substring(0, 80)}...`);
                
                if (!uploadUrl.includes('supabase.co')) {
                    console.error('❌ URL INCORRETA! Deve conter "supabase.co"');
                    console.error('URL atual:', uploadUrl);
                    continue;
                }
                
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
                    console.log(`✅ Upload concluído: ${publicUrl.substring(0, 80)}...`);
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Falha no upload ${file.name}:`, {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText.substring(0, 200)
                    });
                }
                
            } catch (error) {
                console.error(`❌ Erro ao enviar ${file.name}:`, error.message);
            }
        }
        
        console.log(`🎯 Resultado: ${uploadedUrls.length}/${files.length} sucesso(s)`);
        console.groupEnd();
        return uploadedUrls;
    },

    // ========== FUNÇÕES RESTANTES ==========
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
        
        this.state.files.length = 0;
        this.state.existing.length = 0;
        this.state.pdfs.length = 0;
        this.state.existingPdfs.length = 0;
        
        this.state.isUploading = false;
        this.state.currentPropertyId = null;
        
        this.revokeAllPreviewUrls();
        
        return this;
    },

    updateStateAfterUpload: function(uploadedUrls, uploadedPdfs) {
        console.group('🔄 ATUALIZANDO ESTADO APÓS UPLOAD');
        
        this.state.files.forEach((file, index) => {
            if (file.isNew && !file.uploaded && uploadedUrls.images) {
                const urls = uploadedUrls.images.split(',');
                if (urls[index]) {
                    if (file.preview && file.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(file.preview);
                    }
                    
                    file.url = urls[index];
                    file.preview = urls[index];
                    file.uploaded = true;
                    file.isNew = false;
                    
                    console.log(`✅ Arquivo "${file.name}" atualizado com URL permanente`);
                }
            }
        });
        
        this.state.pdfs.forEach((pdf, index) => {
            if (pdf.isNew && !pdf.uploaded && uploadedPdfs) {
                const urls = uploadedPdfs.split(',');
                if (urls[index]) {
                    pdf.url = urls[index];
                    pdf.uploaded = true;
                    pdf.isNew = false;
                    console.log(`✅ PDF "${pdf.name}" atualizado com URL permanente`);
                }
            }
        });
        
        this.state.existing.forEach(item => {
            if (item.markedForDeletion === false) {
                item.isExisting = true;
            }
        });
        
        this.state.existingPdfs.forEach(pdf => {
            if (pdf.markedForDeletion === false) {
                pdf.isExisting = true;
            }
        });
        
        [...this.state.existing, ...this.state.files].forEach(item => {
            if (item.url && item.preview && item.url !== item.preview) {
                if (item.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(item.preview);
                }
                item.preview = item.url;
                console.log(`🔄 Preview sincronizado: ${item.name}`);
            }
        });
        
        console.log('✅ Estado atualizado após upload');
        console.groupEnd();
        
        return this;
    },

    ensurePermanentUrls: function() {
        console.log('🔍 Verificando URLs permanentes...');
        
        [...this.state.existing, ...this.state.files].forEach(item => {
            if (item.url && item.url.startsWith('http') && item.preview && item.preview.startsWith('blob:')) {
                console.log(`🔄 Corrigindo preview para: ${item.name}`);
                URL.revokeObjectURL(item.preview);
                item.preview = item.url;
            }
        });
        
        return this;
    },

    processAndSavePdfs: async function(propertyId, propertyTitle) {
        console.group(`📄 MediaSystem.processAndSavePdfs CHAMADO para ${propertyId}`);
        
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

    // ========== VALIDAÇÃO ==========
    validateFile: function(file) {
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

    validatePdf: function(file) {
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
    console.log('✅ Sistema de mídia unificado pronto com preview 100% funcional');
    
    window.debugMediaSystem = function() {
        console.group('🐛 DIAGNÓSTICO DO SISTEMA DE MÍDIA');
        console.log('📊 Estado atual:', {
            existing: MediaSystem.state.existing.length,
            files: MediaSystem.state.files.length,
            existingPdfs: MediaSystem.state.existingPdfs.length,
            pdfs: MediaSystem.state.pdfs.length
        });
        
        MediaSystem.state.existing.forEach((item, index) => {
            console.log(`   📄 Item ${index + 1}:`, {
                name: item.name,
                url: item.url,
                preview: item.preview,
                isImage: item.isImage,
                isVideo: item.isVideo
            });
        });
        
        console.groupEnd();
    };
    
    console.log('💡 Execute debugMediaSystem() para diagnóstico');
    console.log('💡 Execute MediaSystem.forceReloadPreviews() para corrigir previews');
    
}, 1000);

console.log('✅ media-unified.js carregado com correção DEFINITIVA de preview');
