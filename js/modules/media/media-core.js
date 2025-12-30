// js/modules/media/media-core.js - VERSÃO COMPLETA
console.log('🖼️ media-core.js carregado - Sistema de Mídia Compartilhado');

/**
 * MÓDULO CORE DE MÍDIA - Projetado para VENDAS e ALUGUEL
 * @param {string} systemName - 'vendas' ou 'aluguel' (define bucket e configurações)
 */
window.initMediaSystem = function(systemName = 'vendas') {
    console.log(`🔧 Inicializando módulo de mídia para: ${systemName.toUpperCase()}`);

    // CONFIGURAÇÃO POR SISTEMA
    const SYSTEM_CONFIG = {
        vendas: {
            supabaseBucket: 'properties',
            maxFiles: 10,
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            allowedVideoTypes: ['video/mp4', 'video/quicktime'],
            pathPrefix: 'property_media'
        },
        aluguel: {
            supabaseBucket: 'rentals',
            maxFiles: 10,
            maxSize: 5 * 1024 * 1024,
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            allowedVideoTypes: ['video/mp4', 'video/quicktime'],
            pathPrefix: 'rental_media'
        }
    };

    const config = SYSTEM_CONFIG[systemName] || SYSTEM_CONFIG.vendas;
    window.MEDIA_CONFIG = config;
    window.currentMediaSystem = systemName;

    // VARIÁVEIS DE ESTADO
    window.selectedMediaFiles = [];
    window.existingMediaFiles = [];
    window.isUploadingMedia = false;

    console.log(`✅ Módulo de mídia pronto para ${systemName}. Bucket: ${config.supabaseBucket}`);
    return config;
};

// ⚡ FUNÇÃO OTIMIZADA: Carregar mídia existente com passagem por referência
window.loadExistingMediaOptimized = function(property) {
    console.group('⚡ Carregamento Otimizado de Mídia Existente');
    
    // Referência direta ao array (sem cópia)
    const existingArray = window.existingMediaFiles;
    
    // Limpar array mantendo referência (mais rápido que nova atribuição)
    existingArray.length = 0;
    
    if (property.images && property.images !== 'EMPTY' && property.images.trim() !== '') {
        const imageUrls = property.images.split(',')
            .map(url => url.trim())
            .filter(url => url && url !== 'EMPTY');
        
        // Processamento em batch
        const batchSize = 5;
        for (let i = 0; i < imageUrls.length; i += batchSize) {
            const batch = imageUrls.slice(i, i + batchSize);
            
            batch.forEach((url, batchIndex) => {
                // Extrair nome do arquivo otimizado
                let fileName = url.split('/').pop() || `Imagem ${i + batchIndex + 1}`;
                if (fileName.length > 40) fileName = fileName.substring(0, 37) + '...';
                
                existingArray.push({
                    url,
                    id: `existing_${Date.now()}_${i + batchIndex}`,
                    name: fileName,
                    type: /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName) ? 'image' : 'video',
                    size: 'Existente',
                    isExisting: true,
                    markedForDeletion: false
                });
            });
        }
        
        console.log(`✅ ${imageUrls.length} imagem(ns) carregada(s) em batch`);
    }
    
    console.groupEnd();
    return existingArray;
};

// ⚡ FUNÇÃO INLINE: Formatação rápida de nome de arquivo
window.formatFileNameFast = window.mediaExtractFileName || function(url, defaultName = 'Arquivo') {
    if (!url) return defaultName;
    
    const parts = url.split('/');
    let fileName = parts[parts.length - 1] || defaultName;
    
    // Decode URI uma vez só
    try { fileName = decodeURIComponent(fileName); } catch (e) {}
    
    // Limitar tamanho
    return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
};

// ⚡ FUNÇÃO OTIMIZADA: Atualização de preview com batch DOM updates
window.updatePreviewOptimized = function() {
    const startTime = Date.now();
    
    // Coletar todas as atualizações DOM antes de aplicar
    const updates = [];
    
    // 1. Preview de mídia
    const mediaPreview = document.getElementById('uploadPreview');
    if (mediaPreview) {
        const mediaHtml = generateMediaPreviewHtml(); // Função separada para clareza
        updates.push({ element: mediaPreview, html: mediaHtml });
    }
    
    // 2. Preview de PDFs
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (pdfPreview) {
        const pdfHtml = generatePdfPreviewHtml(); // Função separada para clareza
        updates.push({ element: pdfPreview, html: pdfHtml });
    }
    
    // Aplicar todas as atualizações de uma vez (minimiza reflows)
    updates.forEach(update => {
        update.element.innerHTML = update.html;
    });
    
    console.log(`⚡ Preview atualizado em ${Date.now() - startTime}ms`);
    return true;
};

// Funções auxiliares separadas para organização
function generateMediaPreviewHtml() {
    const allFiles = [...(window.existingMediaFiles || []), ...(window.selectedMediaFiles || [])];
    
    if (allFiles.length === 0) {
        return `
            <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Nenhuma foto ou vídeo adicionada</p>
                <small style="font-size: 0.8rem;">Arraste ou clique para adicionar</small>
            </div>
        `;
    }
    
    // Gerar HTML em uma string para performance
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
    
    allFiles.forEach((file, index) => {
        const isImage = file.type?.includes('image') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const borderColor = file.isExisting ? '#27ae60' : '#3498db';
        const bgColor = file.isExisting ? '#e8f8ef' : '#e8f4fc';
        
        html += `
            <div class="media-preview-item" style="position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:${bgColor}">
                ${isImage && file.url ? 
                    `<img src="${file.url}" style="width:100%;height:100%;object-fit:cover" alt="Preview">` :
                    `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2c3e50;">
                        <i class="fas fa-video" style="font-size:2rem;color:#ecf0f1;"></i>
                    </div>`
                }
                <button onclick="removeMediaFile(${index})" style="position:absolute;top:-8px;right:-8px;background:#e74c3c;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;">×</button>
                ${file.isExisting ? '<div style="position:absolute;bottom:2px;left:2px;background:#27ae60;color:white;font-size:0.6rem;padding:1px 4px;border-radius:3px;">Existente</div>' : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function generatePdfPreviewHtml() {
    const allPdfs = [...(window.existingPdfFiles || []), ...(window.selectedPdfFiles || [])];
    
    if (allPdfs.length === 0) {
        return `
            <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
            </div>
        `;
    }
    
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
    
    allPdfs.forEach((pdf, index) => {
        const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
        const bgColor = pdf.isExisting ? '#e8f8ef' : '#e8f4fc';
        const borderColor = pdf.isExisting ? '#27ae60' : '#3498db';
        
        html += `
            <div class="pdf-preview-container" style="position:relative">
                <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:0.5rem;width:90px;height:90px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;">
                    <i class="fas fa-file-pdf" style="font-size:1.2rem;color:${borderColor};margin-bottom:0.3rem;"></i>
                    <p style="font-size:0.7rem;margin:0;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">${shortName}</p>
                    <small style="color:#7f8c8d;font-size:0.6rem;">${pdf.size || 'PDF'}</small>
                </div>
                <button class="delete-pdf-btn" onclick="${pdf.isExisting ? `removeExistingPdf(${index - window.selectedPdfFiles.length})` : `removeNewPdf(${index})`}" title="Excluir PDF" style="position:absolute;top:-5px;right:-5px;background:${pdf.isExisting ? '#e74c3c' : '#3498db'};color:white;border:none;border-radius:50%;width:26px;height:26px;font-size:16px;cursor:pointer;z-index:20;">×</button>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// ========== FUNÇÃO QUE FALTAVA ==========
window.handleNewMediaFiles = function(files) {
    console.group('➕ handleNewMediaFiles CHAMADA');
    console.log(`📁 ${files.length} arquivo(s) recebido(s):`, Array.from(files).map(f => f.name));
    
    // Inicializar se não estiver inicializado
    if (!window.MEDIA_CONFIG) {
        console.log('⚠️  Config não inicializada. Inicializando para VENDAS...');
        window.initMediaSystem('vendas');
    }
    
    const config = window.MEDIA_CONFIG;
    const filesArray = Array.from(files);
    let addedCount = 0;
    
    // Validar cada arquivo
    for (const file of filesArray) {
        // Validação de tipo
        const isImage = config.allowedImageTypes.includes(file.type);
        const isVideo = config.allowedVideoTypes.includes(file.type);
        
        if (!isImage && !isVideo) {
            alert(`❌ "${file.name}" não é um tipo suportado!\n\nUse: Imagens (JPG, PNG, WEBP) ou Vídeos (MP4).`);
            console.error(`Tipo não suportado: ${file.type}`);
            continue;
        }
        
        // Validação de tamanho
        if (file.size > config.maxSize) {
            alert(`❌ "${file.name}" é muito grande!\n\nTamanho: ${window.mediaFormatFileSize ? window.mediaFormatFileSize(file.size) : file.size + ' bytes'}\nMáximo: ${window.mediaFormatFileSize ? window.mediaFormatFileSize(config.maxSize) : config.maxSize + ' bytes'}`);
            console.error(`Arquivo muito grande: ${file.size} > ${config.maxSize}`);
            continue;
        }
        
        // Adicionar à lista de arquivos selecionados
        window.selectedMediaFiles.push({
            file: file,
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            preview: URL.createObjectURL(file), // URL temporária para preview
            isNew: true,
            isImage: isImage,
            isVideo: isVideo
        });
        
        addedCount++;
        console.log(`✅ "${file.name}" adicionado à lista (${file.size} bytes)`);
    }
    
    console.log(`📊 Resultado: ${addedCount}/${filesArray.length} arquivo(s) adicionado(s) com sucesso.`);
    console.groupEnd();
    
    // Atualizar o preview visual (chamar função do media-ui.js)
    if (typeof window.updateMediaPreview === 'function') {
        console.log('🔄 Chamando updateMediaPreview()...');
        window.updateMediaPreview();
    } else {
        console.error('❌ updateMediaPreview() não encontrado! Verifique se media-ui.js carregou.');
    }
    
    // Limpar o input de arquivo para permitir nova seleção
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
        console.log('🧹 Input de arquivo limpo.');
    }
    
    return addedCount;
};

// ========== FUNÇÃO DE UPLOAD (para ser usada depois) ==========
window.uploadMediaToSupabase = async function(files, propertyId) {
    console.log('📤 uploadMediaToSupabase chamada (função futura)');
    console.log('ℹ️  Esta função será implementada na próxima etapa.');
    return [];
};

// ========== FUNÇÃO PARA REMOVER ARQUIVO (chamada pelos botões X) ==========
window.removeMediaFile = function(index) {
    console.group(`🗑️ removeMediaFile chamada para índice: ${index}`);
    
    // Verificar se é um arquivo selecionado (novo) ou existente
    if (window.selectedMediaFiles && index < window.selectedMediaFiles.length) {
        // É um arquivo NOVO (ainda não salvo no Supabase)
        const removed = window.selectedMediaFiles.splice(index, 1)[0];
        console.log(`✅ Arquivo NOVO removido: ${removed.name}`);
        
        // Liberar a URL do objeto para evitar vazamento de memória
        if (removed.preview && removed.preview.startsWith('blob:')) {
            URL.revokeObjectURL(removed.preview);
        }
    } else if (window.existingMediaFiles) {
        // É um arquivo EXISTENTE (ajustar índice)
        const existingIndex = index - (window.selectedMediaFiles ? window.selectedMediaFiles.length : 0);
        if (existingIndex >= 0 && existingIndex < window.existingMediaFiles.length) {
            // Marcar para exclusão ao invés de remover
            window.existingMediaFiles[existingIndex].markedForDeletion = true;
            window.existingMediaFiles[existingIndex].isVisible = false; // Opcional: para UI
            const removed = window.existingMediaFiles[existingIndex];
            
            console.log(`✅ Arquivo EXISTENTE marcado para exclusão: ${removed.name || removed.url}`);
            console.log(`📌 URL: ${removed.url}`);
            console.log(`📌 markedForDeletion: ${removed.markedForDeletion}`);
        }
    }
    
    console.groupEnd();
    
    // Atualizar o preview
    if (typeof window.updateMediaPreview === 'function') {
        window.updateMediaPreview();
    }
};

// ========== FUNÇÃO DE LIMPEZA OTIMIZADA ==========
window.clearMediaSystem = function() {
    console.log('🧹 Executando clearMediaSystem...');
    
    // 1. Limpar arrays (passagem por referência - mais rápido)
    if (window.selectedMediaFiles) window.selectedMediaFiles.length = 0;
    if (window.existingMediaFiles) window.existingMediaFiles.length = 0;
    window.isUploadingMedia = false;
    
    // 2. Limpar DOM diretamente (sem dependência de outras funções)
    const preview = document.getElementById('uploadPreview');
    if (preview) {
        preview.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Nenhuma foto ou vídeo adicionada</p>
                <small style="font-size: 0.8rem;">Arraste ou clique para adicionar</small>
            </div>
        `;
    }
    
    // 3. Resetar input de arquivo
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    console.log('✅ Sistema de mídia completamente limpo');
    return true;
};

window.clearMediaSystemComplete = function() {
    console.group('🧹 LIMPEZA COMPLETA DO SISTEMA DE MÍDIA');
    
    // 1. Limpar arrays de mídia (FOTOS/VIDEOS)
    window.selectedMediaFiles = [];
    window.existingMediaFiles = [];
    window.isUploadingMedia = false;
    
    // 2. Limpar DOM das fotos/vídeos
    const uploadPreview = document.getElementById('uploadPreview');
    if (uploadPreview) {
        uploadPreview.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Nenhuma foto ou vídeo adicionada</p>
                <small style="font-size: 0.8rem;">Arraste ou clique para adicionar</small>
            </div>
        `;
    }
    
    // 3. Limpar input de arquivo de mídia
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    // 4. Limpar arrays de PDFs
    if (window.selectedPdfFiles) window.selectedPdfFiles = [];
    if (window.existingPdfFiles) window.existingPdfFiles = [];
    
    // 5. Limpar DOM dos PDFs
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (pdfPreview) {
        pdfPreview.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
            </div>
        `;
    }
    
    // 6. Limpar input de arquivo de PDFs
    const pdfFileInput = document.getElementById('pdfFileInput');
    if (pdfFileInput) pdfFileInput.value = '';
    
    console.log('✅ Sistema completamente limpo (mídia + PDFs)');
    console.groupEnd();
    return true;
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
// Inicializa para VENDAS por padrão (compatibilidade)
window.initMediaSystem('vendas');

// NO FINAL DO ARQUIVO, ATUALIZE O LOG:
console.log('✅ Módulo de mídia completamente carregado.');
console.log('🔧 Funções disponíveis: initMediaSystem(), handleNewMediaFiles(), removeMediaFile(), clearMediaSystem()');
console.log('📌 Próximo: Testar seleção de arquivos -> preview deve aparecer.');

// ⚡ NO FINAL DO media-core.js, ADICIONE:
// ========== INICIALIZAÇÃO DOS MÓDULOS DEPENDENTES ==========
setTimeout(() => {
    console.group('🔗 INICIALIZANDO DEPENDÊNCIAS DO MÓDULO DE MÍDIA');
    
    // Verificar se os módulos utilitários carregaram
    if (typeof window.mediaFormatFileSize !== 'function') {
        console.warn('⚠️ media-utils.js não carregou completamente');
        // Fallback básico
        window.mediaFormatFileSize = function(bytes) {
            return bytes ? Math.round(bytes / 1024) + ' KB' : '0 KB';
        };
    }
    
    if (typeof window.MediaLogger !== 'object') {
        console.warn('⚠️ media-logger.js não carregou completamente');
        // Fallback básico
        window.MediaLogger = {
            info: (m, msg) => console.log(`[${m}] ${msg}`),
            error: (m, msg) => console.error(`[${m}] ${msg}`)
        };
    }
    
    // Registrar inicialização no logger
    //if (window.MediaLogger && window.MediaLogger.system) {
    //    window.MediaLogger.system.init(window.currentMediaSystem || 'vendas');
    //}
    if (typeof window.MediaLogger !== 'undefined' && window.MediaLogger.system) {
        window.MediaLogger.system.init(window.currentMediaSystem || 'vendas');
    } else {
        console.log('ℹ️ MediaLogger não disponível - usando console padrão');
    }
    
// ========== FALLBACK PARA MEDIA LOGGER (quando não carregado do suporte) ==========
setTimeout(() => {
    // Verificar se MediaLogger foi carregado do repositório de suporte
    if (typeof window.MediaLogger === 'undefined') {
        console.log('⚠️ MediaLogger não carregado - criando fallback básico');
        
        // Fallback mínimo para não quebrar outros módulos
        window.MediaLogger = {
            info: (module, message) => console.log(`[${module}] ${message}`),
            error: (module, message) => console.error(`[${module}] ${message}`),
            upload: {
                start: (count) => console.log(`📤 Upload iniciado: ${count} arquivos`),
                success: (fileName) => console.log(`✅ ${fileName} enviado`)
            },
            system: {
                init: (systemName) => console.log(`🔧 Sistema de mídia: ${systemName}`)
            }
        };
        
        console.log('✅ Fallback do MediaLogger criado');
    }
}, 500);
    
    console.log('✅ Dependências verificadas e prontas');
    console.groupEnd();
}, 1500);
