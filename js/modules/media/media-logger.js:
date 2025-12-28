// js/modules/media/media-logger.js
console.log('📋 media-logger.js carregado - Sistema de logs especializado');

/**
 * 🎯 SISTEMA DE LOGGING ESPECIALIZADO PARA MÍDIA
 * - Logs categorizados por funcionalidade
 * - Controle de nível de verbosidade
 * - Formatação consistente
 */

// ========== CONFIGURAÇÃO ==========
window.MEDIA_LOGGER_CONFIG = {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    showTimestamps: true,
    colors: true,
    showEmoji: true
};

// ========== NÍVEIS DE LOG ==========
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

// ========== CATEGORIAS DE LOG ==========

// 1. UPLOAD E PROCESSAMENTO
window.mediaLogUpload = {
    start: (count) => console.log(`🚀 Iniciando upload de ${count} arquivo(s)...`),
    fileSelected: (fileName) => console.log(`📄 Arquivo selecionado: ${fileName}`),
    validating: (fileName) => console.log(`🔍 Validando: ${fileName}`),
    validationPassed: (fileName) => console.log(`✅ Validação OK: ${fileName}`),
    validationFailed: (fileName, reason) => console.warn(`❌ Validação falhou: ${fileName} - ${reason}`),
    processing: (index, total) => console.log(`🔄 Processando ${index + 1}/${total}...`),
    success: (fileName, size) => console.log(`✅ Upload bem-sucedido: ${fileName} (${size})`),
    error: (fileName, error) => console.error(`💥 Erro no upload: ${fileName} - ${error}`),
    complete: (successCount, total) => console.log(`🎉 Upload completo: ${successCount}/${total} sucesso(s)`)
};

// 2. PREVIEW E INTERFACE
window.mediaLogPreview = {
    updating: () => console.log('🎨 Atualizando preview...'),
    itemsCount: (existing, newFiles) => console.log(`📊 Preview: ${existing} existente(s), ${newFiles} novo(s)`),
    rendering: (count) => console.log(`🖼️ Renderizando ${count} item(ns)...`),
    empty: () => console.log('📭 Preview vazio'),
    itemAdded: (fileName) => console.log(`➕ Item adicionado ao preview: ${fileName}`),
    itemRemoved: (fileName) => console.log(`➖ Item removido do preview: ${fileName}`)
};

// 3. SISTEMA E ESTADO
window.mediaLogSystem = {
    init: (systemName) => console.log(`🔧 Inicializando sistema de mídia: ${systemName}`),
    config: (config) => console.log('⚙️ Configuração:', config),
    state: (state) => console.log('📊 Estado do sistema:', state),
    cleanup: () => console.log('🧹 Limpando sistema de mídia...'),
    reset: () => console.log('🔄 Resetando sistema...')
};

// 4. SUPABASE INTEGRATION
window.mediaLogSupabase = {
    connecting: (bucket) => console.log(`🌐 Conectando ao bucket: ${bucket}`),
    uploadStart: (fileName) => console.log(`📤 Iniciando upload para Supabase: ${fileName}`),
    uploadProgress: (fileName, progress) => console.log(`📈 Upload progresso: ${fileName} - ${progress}%`),
    uploadSuccess: (fileName, url) => console.log(`✅ Upload Supabase OK: ${fileName} → ${url.substring(0, 60)}...`),
    uploadError: (fileName, error) => console.error(`❌ Upload Supabase falhou: ${fileName} - ${error}`),
    deleteStart: (fileName) => console.log(`🗑️ Excluindo do Supabase: ${fileName}`),
    deleteSuccess: (fileName) => console.log(`✅ Exclusão Supabase OK: ${fileName}`),
    deleteError: (fileName, error) => console.error(`❌ Exclusão Supabase falhou: ${fileName} - ${error}`)
};

// 5. PERFORMANCE
window.mediaLogPerformance = {
    start: (operation) => {
        console.log(`⏱️ Iniciando: ${operation}`);
        return Date.now();
    },
    end: (operation, startTime) => {
        const duration = Date.now() - startTime;
        console.log(`⏱️ Concluído: ${operation} (${duration}ms)`);
        return duration;
    },
    benchmark: (operation, duration, threshold = 100) => {
        if (duration > threshold) {
            console.warn(`⚠️ ${operation} lento: ${duration}ms (>${threshold}ms threshold)`);
        } else {
            console.log(`⚡ ${operation} rápido: ${duration}ms`);
        }
    }
};

// ========== FUNÇÕES UTILITÁRIAS DE LOG ==========

// Log básico com formatação
window.mediaLog = function(level, message, data = null) {
    if (!window.MEDIA_LOGGER_CONFIG.enabled) return;
    
    const currentLevel = LOG_LEVELS[window.MEDIA_LOGGER_CONFIG.level] || LOG_LEVELS.info;
    const messageLevel = LOG_LEVELS[level] || LOG_LEVELS.info;
    
    if (messageLevel < currentLevel) return;
    
    const timestamp = window.MEDIA_LOGGER_CONFIG.showTimestamps 
        ? `[${new Date().toLocaleTimeString()}] ` 
        : '';
    
    const emoji = window.MEDIA_LOGGER_CONFIG.showEmoji ? {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
    }[level] || '' : '';
    
    const formattedMessage = `${timestamp}${emoji} ${message}`;
    
    switch(level) {
        case 'debug':
            console.log(formattedMessage, data || '');
            break;
        case 'info':
            console.log(formattedMessage, data || '');
            break;
        case 'warn':
            console.warn(formattedMessage, data || '');
            break;
        case 'error':
            console.error(formattedMessage, data || '');
            break;
        default:
            console.log(formattedMessage, data || '');
    }
};

// Atalhos para níveis específicos
window.mediaDebug = (message, data) => window.mediaLog('debug', message, data);
window.mediaInfo = (message, data) => window.mediaLog('info', message, data);
window.mediaWarn = (message, data) => window.mediaLog('warn', message, data);
window.mediaError = (message, data) => window.mediaLog('error', message, data);

// Log de grupo (para operações complexas)
window.mediaLogGroup = function(groupName, operation) {
    console.group(`📦 ${groupName}`);
    try {
        const result = operation();
        console.log('✅ Concluído com sucesso');
        console.groupEnd();
        return result;
    } catch (error) {
        console.error('❌ Falha:', error);
        console.groupEnd();
        throw error;
    }
};

// ========== LOG DE INTEGRIDADE DO SISTEMA ==========
window.mediaLogSystemHealth = function() {
    console.group('🏥 SAÚDE DO SISTEMA DE MÍDIA');
    
    const checks = {
        'Variáveis globais': {
            'selectedMediaFiles': Array.isArray(window.selectedMediaFiles),
            'existingMediaFiles': Array.isArray(window.existingMediaFiles),
            'MEDIA_CONFIG': !!window.MEDIA_CONFIG,
            'MEDIA_CONSTANTS': !!window.MEDIA_CONSTANTS
        },
        'Funções disponíveis': {
            'handleNewMediaFiles': typeof window.handleNewMediaFiles === 'function',
            'updateMediaPreview': typeof window.updateMediaPreview === 'function',
            'clearMediaSystem': typeof window.clearMediaSystem === 'function'
        },
        'Elementos DOM': {
            'uploadArea': !!document.getElementById('uploadArea'),
            'uploadPreview': !!document.getElementById('uploadPreview'),
            'fileInput': !!document.getElementById('fileInput')
        }
    };
    
    Object.entries(checks).forEach(([category, items]) => {
        console.log(`\n${category}:`);
        Object.entries(items).forEach(([item, status]) => {
            console.log(`  ${item}: ${status ? '✅' : '❌'}`);
        });
    });
    
    console.groupEnd();
};

// ========== INICIALIZAÇÃO ==========
console.log('✅ media-logger.js completamente carregado');
console.log('📊 Categorias disponíveis: upload, preview, system, supabase, performance');
console.log('💡 Use: window.mediaLogUpload.success("arquivo.jpg", "1.5MB")');

// Exportar logger centralizado
window.MediaLogger = {
    upload: window.mediaLogUpload,
    preview: window.mediaLogPreview,
    system: window.mediaLogSystem,
    supabase: window.mediaLogSupabase,
    performance: window.mediaLogPerformance,
    log: window.mediaLog,
    debug: window.mediaDebug,
    info: window.mediaInfo,
    warn: window.mediaWarn,
    error: window.mediaError,
    group: window.mediaLogGroup,
    health: window.mediaLogSystemHealth
};
