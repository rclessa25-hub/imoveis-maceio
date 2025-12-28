// js/modules/media/media-utils.js
console.log('🔧 media-utils.js carregado - Funções auxiliares otimizadas');

/**
 * ⚡ FUNÇÕES UTILITÁRIAS OTIMIZADAS PARA MÍDIA
 * - Pequenas funções candidatas a inlining
 * - Processamento rápido de arquivos
 * - Formatação otimizada
 */

// ========== FUNÇÕES DE FORMATTAÇÃO (INLINE CANDIDATES) ==========

// 1. Formatar tamanho de arquivo (chamada frequente)
window.mediaFormatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// 2. Extrair nome do arquivo da URL
window.mediaExtractFileName = function(url, defaultName = 'Arquivo') {
    if (!url || typeof url !== 'string') return defaultName;
    
    // Tenta extrair da URL
    const parts = url.split('/');
    let fileName = parts[parts.length - 1] || defaultName;
    
    // Decodificar URI se necessário
    try {
        if (fileName.includes('%')) {
            fileName = decodeURIComponent(fileName);
        }
    } catch (e) {
        // Ignora erro de decode
    }
    
    // Limitar tamanho para display
    return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
};

// 3. Validar tipo de arquivo (otimizada)
window.mediaValidateFileType = function(file, allowedTypes) {
    const fileType = file.type.toLowerCase();
    
    // Verificação rápida para tipos comuns
    if (fileType.startsWith('image/')) {
        return allowedTypes.includes(fileType) || 
               allowedTypes.some(type => type.startsWith('image/'));
    }
    
    if (fileType.startsWith('video/')) {
        return allowedTypes.includes(fileType) ||
               allowedTypes.some(type => type.startsWith('video/'));
    }
    
    return allowedTypes.includes(fileType);
};

// 4. Gerar ID único para arquivo
window.mediaGenerateFileId = function(prefix = 'file') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 5. Criar URL de preview otimizada
window.mediaCreatePreviewUrl = function(file) {
    if (!file) return null;
    
    try {
        return URL.createObjectURL(file);
    } catch (error) {
        console.error('Erro ao criar preview URL:', error);
        return null;
    }
};

// 6. Liberar URL de preview (evitar memory leaks)
window.mediaRevokePreviewUrl = function(url) {
    if (url && url.startsWith('blob:')) {
        try {
            URL.revokeObjectURL(url);
        } catch (error) {
            console.warn('Erro ao liberar preview URL:', error);
        }
    }
};

// 7. Sanitizar nome de arquivo para upload
window.mediaSanitizeFileName = function(fileName) {
    return fileName
        .normalize('NFD') // Normalizar acentos
        .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Substituir caracteres inválidos
        .replace(/_+/g, '_') // Remover underscores duplicados
        .replace(/^_+|_+$/g, '') // Remover underscores no início/fim
        .toLowerCase()
        .substring(0, 100); // Limitar tamanho
};

// 8. Processamento em batch de arquivos
window.mediaProcessBatch = function(files, batchSize = 5, processCallback) {
    const results = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = batch.map((file, index) => 
            processCallback(file, i + index, files.length)
        );
        results.push(...batchResults.filter(r => r !== null));
    }
    
    return results;
};

// ========== CONSTANTES DE CONFIGURAÇÃO ==========
window.MEDIA_CONSTANTS = {
    MAX_FILES: 10,
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
    THUMBNAIL_SIZE: { width: 100, height: 100 },
    BATCH_SIZE: 5
};

// ========== FUNÇÕES DE VALIDAÇÃO OTIMIZADAS ==========

// Validação rápida de tamanho
window.mediaValidateFileSize = function(file, maxSize = window.MEDIA_CONSTANTS.MAX_SIZE) {
    return file.size <= maxSize;
};

// Validação combinada (tipo + tamanho)
window.mediaValidateFile = function(file, config = window.MEDIA_CONFIG) {
    if (!file) return { valid: false, error: 'Arquivo inválido' };
    
    // Validação de tipo
    const isImage = window.MEDIA_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = window.MEDIA_CONSTANTS.ALLOWED_VIDEO_TYPES.includes(file.type);
    
    if (!isImage && !isVideo) {
        return { 
            valid: false, 
            error: `Tipo de arquivo não suportado: ${file.type || 'desconhecido'}` 
        };
    }
    
    // Validação de tamanho
    if (!window.mediaValidateFileSize(file)) {
        return { 
            valid: false, 
            error: `Arquivo muito grande: ${window.mediaFormatFileSize(file.size)} > ${window.mediaFormatFileSize(config?.maxSize || window.MEDIA_CONSTANTS.MAX_SIZE)}` 
        };
    }
    
    return { valid: true, type: isImage ? 'image' : 'video' };
};

// ========== INICIALIZAÇÃO ==========
console.log('✅ media-utils.js carregado com 12 funções utilitárias');
console.log('📊 Funções disponíveis:', Object.keys(window).filter(k => k.startsWith('media')));
