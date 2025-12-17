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
            alert(`❌ "${file.name}" é muito grande!\n\nTamanho: ${formatFileSize(file.size)}\nMáximo: ${formatFileSize(config.maxSize)}`);
            console.error(`Arquivo muito grande: ${formatFileSize(file.size)} > ${formatFileSize(config.maxSize)}`);
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
        console.log(`✅ "${file.name}" adicionado à lista (${formatFileSize(file.size)})`);
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

// ========== FUNÇÕES AUXILIARES ==========

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========== FUNÇÃO DE UPLOAD (para ser usada depois) ==========
window.uploadMediaToSupabase = async function(files, propertyId) {
    console.log('📤 uploadMediaToSupabase chamada (função futura)');
    console.log('ℹ️  Esta função será implementada na próxima etapa.');
    return [];
};

// ========== FUNÇÃO PARA REMOVER ARQUIVO (chamada pelos botões X) ==========
window.removeMediaFile = function(index) {
    console.log(`🗑️  removeMediaFile chamada para índice: ${index}`);
    
    // Verificar se é um arquivo selecionado (novo) ou existente
    if (index < window.selectedMediaFiles.length) {
        // É um arquivo novo
        const removed = window.selectedMediaFiles.splice(index, 1)[0];
        console.log(`✅ Arquivo novo removido: ${removed.name}`);
        
        // Liberar a URL do objeto para evitar vazamento de memória
        if (removed.preview && removed.preview.startsWith('blob:')) {
            URL.revokeObjectURL(removed.preview);
        }
    } else {
        // É um arquivo existente (ajustar índice)
        const existingIndex = index - window.selectedMediaFiles.length;
        if (existingIndex >= 0 && existingIndex < window.existingMediaFiles.length) {
            const removed = window.existingMediaFiles.splice(existingIndex, 1)[0];
            console.log(`✅ Arquivo existente removido: ${removed.name || removed.url}`);
        }
    }
    
    // Atualizar o preview
    if (typeof window.updateMediaPreview === 'function') {
        window.updateMediaPreview();
    }
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
// Inicializa para VENDAS por padrão (compatibilidade)
window.initMediaSystem('vendas');

console.log('✅ Módulo de mídia completamente carregado.');
console.log('🔧 Funções disponíveis: handleNewMediaFiles(), removeMediaFile(), uploadMediaToSupabase()');
console.log('📌 Próximo: Testar seleção de arquivos -> preview deve aparecer.');
