// js/modules/media/media-core.js - VERSÃO COMPARTILHÁVEL
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
            // ... outras configs específicas de vendas
        },
        aluguel: {
            supabaseBucket: 'rentals', // Bucket diferente no mesmo Supabase
            maxFiles: 10,
            // ... configs específicas de aluguel
        }
    };

    const config = SYSTEM_CONFIG[systemName] || SYSTEM_CONFIG.vendas;
    window.MEDIA_CONFIG = config;
    window.currentMediaSystem = systemName;

    // VARIÁVEIS DE ESTADO (isoladas por contexto de uso)
    window.selectedMediaFiles = [];
    window.existingMediaFiles = [];
    window.isUploadingMedia = false;

    console.log(`✅ Módulo de mídia pronto para ${systemName}. Bucket: ${config.supabaseBucket}`);
};

// Função de upload AGNÓSTICA (usa a config carregada)
window.uploadMediaToSupabase = async function(files, propertyId) {
    if (!window.MEDIA_CONFIG) {
        console.error('❌ Módulo de mídia não inicializado. Chame initMediaSystem() primeiro.');
        return [];
    }
    console.log(`📤 Upload para bucket: ${window.MEDIA_CONFIG.supabaseBucket}`);
    // Lógica de upload aqui (será preenchida na Etapa 3)
    return [];
};

// Inicializa padrão para VENDAS (compatibilidade com sistema atual)
window.initMediaSystem('vendas');
console.log('✅ Módulo de mídia carregado em modo VENDAS (padrão).');
