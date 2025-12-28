// js/modules/media/media-utils.js
console.log('🔧 media-utils.js carregado - Funções auxiliares otimizadas');

/**
 * FUNÇÕES UTILITÁRIAS PARA MÍDIA - Otimizadas para INLINING
 */

// ⚡ FUNÇÃO INLINE: Formatar tamanho de arquivo (alta frequência de chamada)
window.mediaFormatFileSize = function(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // ⚡ OTIMIZADO: Reduzido overhead de chamadas
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ⚡ FUNÇÃO INLINE: Extrair nome do arquivo da URL (CRÍTICA para performance)
window.mediaExtractFileName = function(url, defaultName = 'Arquivo') {
    // ⚡ Passagem por referência (não cria cópia da string)
    if (!url || typeof url !== 'string') return defaultName;
    
    const parts = url.split('/');
    let fileName = parts[parts.length - 1] || defaultName;
    
    // ⚡ Único try-catch otimizado
    try { 
        fileName = decodeURIComponent(fileName); 
    } catch (e) { 
        // Mantém fileName original se falhar
    }
    
    // ⚡ Limitação otimizada (evita substring desnecessário)
    return fileName.length > 50 ? 
           fileName.substring(0, 47) + '...' : 
           fileName;
};

// ⚡ FUNÇÃO INLINE: Validar arquivo (chamada frequente no upload)
window.mediaValidateFile = function(file, config) {
    if (!file || !config) return false;
    
    // ⚡ Validações em cadeia (short-circuit evaluation)
    const isImage = config.allowedImageTypes.includes(file.type);
    const isVideo = config.allowedVideoTypes.includes(file.type);
    
    if (!isImage && !isVideo) {
        return { valid: false, error: 'Tipo não suportado' };
    }
    
    if (file.size > config.maxSize) {
        return { 
            valid: false, 
            error: `Arquivo muito grande (${mediaFormatFileSize(file.size)})` 
        };
    }
    
    return { valid: true, isImage, isVideo };
};

// ⚡ FUNÇÃO INLINE: Criar preview URL para imagem (performance crítica)
window.mediaCreatePreviewUrl = function(file) {
    if (!file) return null;
    
    // ⚡ URL.createObjectURL é síncrono e rápido
    return URL.createObjectURL(file);
};

// ⚡ FUNÇÃO INLINE: Limpar preview URLs (evita memory leaks)
window.mediaRevokePreviewUrls = function(filesArray) {
    if (!Array.isArray(filesArray)) return;
    
    // ⚡ Loop otimizado
    for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        if (file && file.preview && file.preview.startsWith('blob:')) {
            URL.revokeObjectURL(file.preview);
        }
    }
};

// ⚡ CONSTANTES OTIMIZADAS (acesso direto, sem overhead)
window.MEDIA_CONSTANTS = {
    MAX_FILES: 10,
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
    BUCKETS: {
        VENDAS: 'properties',
        ALUGUEL: 'rentals'
    }
};

console.log('✅ media-utils.js pronto com funções otimizadas para inlining');
