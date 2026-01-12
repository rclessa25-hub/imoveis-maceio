// js/modules/utils.js - VERSÃO LEVE (remover funções movidas)
console.log('⚡ utils.js carregado - Versão Leve Pós-SharedCore');

// ========== CONSTANTES ESSENCIAIS APENAS ==========
window.SUPABASE_URL = 'https://syztbxvpdaplpetmixmt.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo';
window.ADMIN_PASSWORD = "wl654";
window.PDF_PASSWORD = "doc123";

// ========== FUNÇÕES RESTANTES (não movidas para SharedCore) ==========

// Apenas funções muito específicas do site atual
window.validatePropertyData = function(propertyData) {
    // Validação específica de imóveis (não genérica)
    const errors = [];
    if (!propertyData.title?.trim()) errors.push('Título é obrigatório');
    if (!propertyData.price?.trim()) errors.push('Preço é obrigatório');
    if (!propertyData.location?.trim()) errors.push('Localização é obrigatória');
    return errors;
};

// FALLBACKS MÍNIMOS (mantidos por compatibilidade)
(function() {
    // Apenas cria fallbacks se os módulos de suporte não carregarem
    setTimeout(() => {
        const isProduction = window.location.hostname.includes('github.io') && 
                           !window.location.search.includes('debug=true');
        
        if (isProduction) {
            // Fallback mínimo para validateGalleryModule
            if (typeof window.validateGalleryModule === 'undefined') {
                window.validateGalleryModule = function() {
                    return typeof window.openGallery === 'function';
                };
            }
            
            // Fallback mínimo para ValidationSystem
            if (typeof window.ValidationSystem === 'undefined') {
                window.ValidationSystem = {
                    quickSystemCheck: function() {
                        return {
                            properties: !!window.properties,
                            propertiesCount: window.properties ? window.properties.length : 0,
                            timestamp: new Date().toISOString()
                        };
                    }
                };
            }
        }
    }, 5000);
})();

console.log('✅ utils.js otimizado - apenas constantes e funções específicas mantidas');
