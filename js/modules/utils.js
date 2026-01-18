// js/modules/utils.js - VERSÃO MINIMALISTA DE COMPATIBILIDADE
console.log('⚡ utils.js carregado - Thin wrapper para SharedCore');

// ========== CONSTANTES ESSENCIAIS ==========
window.SUPABASE_URL = 'https://syztbxvpdaplpetmixmt.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo';
window.ADMIN_PASSWORD = "wl654";
window.PDF_PASSWORD = "doc123";

// ========== COMPATIBILIDADE COM SHAREDCORE ==========
(function setupSharedCoreCompatibility() {
    console.log('🔗 Configurando compatibilidade com SharedCore...');
    
    // Aguardar SharedCore carregar
    const waitForSharedCore = setInterval(() => {
        if (window.SharedCore) {
            clearInterval(waitForSharedCore);
            setupCompatibilityFunctions();
        }
    }, 100);
    
    function setupCompatibilityFunctions() {
        // Mapear funções antigas para SharedCore
        const functionMap = {
            debounce: 'debounce',
            throttle: 'throttle',
            isMobileDevice: 'isMobileDevice',
            logModule: 'logModule',
            elementExists: 'elementExists',
            formatPrice: 'formatPrice',
            isValidEmail: 'isValidEmail',
            isValidPhone: 'isValidPhone',
            copyToClipboard: 'copyToClipboard',
            supabaseFetch: 'supabaseFetch',
            runLowPriority: 'runLowPriority',
            validateProperty: 'validateProperty',
            truncateText: 'truncateText',
            stringSimilarity: 'stringSimilarity'
        };
        
        // Criar wrappers para cada função
        Object.entries(functionMap).forEach(([oldName, sharedCoreName]) => {
            if (typeof window[oldName] === 'undefined' && 
                typeof window.SharedCore[sharedCoreName] === 'function') {
                
                window[oldName] = window.SharedCore[sharedCoreName].bind(window.SharedCore);
                console.log(`✅ ${oldName} disponível via SharedCore`);
            }
        });
        
        // Funções específicas que não estão no SharedCore
        setupFallbackFunctions();
    }
    
    function setupFallbackFunctions() {
        // Fallback mínimo se SharedCore não tiver alguma função
        if (typeof window.supabaseFetch === 'undefined') {
            window.supabaseFetch = async function(endpoint, options = {}) {
                console.warn('⚠️ Usando fallback supabaseFetch');
                return SharedCore?.supabaseFetch?.(endpoint, options) || { 
                    ok: false, 
                    data: [], 
                    error: 'SharedCore não disponível' 
                };
            };
        }
    }
})();

// ========== INICIALIZAÇÃO DE COMPATIBILIDADE ==========
setTimeout(() => {
    console.group('🧪 VERIFICAÇÃO DE COMPATIBILIDADE UTILS.JS');
    
    const requiredFunctions = [
        'debounce',
        'throttle', 
        'isMobileDevice',
        'logModule',
        'elementExists',
        'formatPrice',
        'supabaseFetch'
    ];
    
    let allAvailable = true;
    requiredFunctions.forEach(func => {
        const available = typeof window[func] === 'function';
        console.log(`${available ? '✅' : '❌'} ${func}`);
        if (!available) allAvailable = false;
    });
    
    console.log(allAvailable ? '🎉 COMPATIBILIDADE OK' : '⚠️ FUNÇÕES FALTANDO');
    console.groupEnd();
}, 2000);

console.log('✅ utils.js otimizado - wrapper minimalista para SharedCore');
