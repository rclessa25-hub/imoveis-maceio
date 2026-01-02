// js/modules/utils.js - VERSÃO OTIMIZADA
console.log('⚡ utils.js carregado - Versão Otimizada do Core');

// ========== CONSTANTES ESSENCIAIS (12 itens) ==========
window.SUPABASE_URL = 'https://syztbxvpdaplpetmixmt.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo';
window.ADMIN_PASSWORD = "wl654";
window.PDF_PASSWORD = "doc123";

// ========== FUNÇÕES DE PERFORMANCE ESSENCIAIS (2 funções) ==========
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

window.throttle = function(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ========== FUNÇÕES UTILITÁRIAS ESSENCIAIS (10 funções) ==========
window.isMobileDevice = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

window.logModule = function(moduleName, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${moduleName}] ${message}`);
};

window.elementExists = function(id) {
    return document.getElementById(id) !== null;
};

window.formatPrice = function(price) {
    if (!price) return 'R$ 0,00';
    return price.toString().replace('.', ',');
};

window.isValidEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

window.isValidPhone = function(phone) {
    const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    return re.test(phone);
};

window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('❌ Erro ao copiar:', err);
        return false;
    }
};

// ========== SUPABASE FETCH ESSENCIAL ==========
window.supabaseFetch = async function(endpoint, options = {}) {
    try {
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = `${window.SUPABASE_URL}/rest/v1${endpoint}`;
        const finalUrl = proxyUrl + encodeURIComponent(targetUrl);
        
        const response = await fetch(finalUrl, {
            method: options.method || 'GET',
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            return { 
                ok: false, 
                data: [], 
                error: `HTTP ${response.status}: ${response.statusText}` 
            };
        }
        
        const data = await response.json();
        
        return { 
            ok: true, 
            data: data,
            count: Array.isArray(data) ? data.length : 1
        };
        
    } catch (error) {
        return { 
            ok: false, 
            data: [], 
            error: error.message
        };
    }
};

// ========== FALLBACKS MÍNIMOS (apenas em produção) ==========
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

console.log('✅ utils.js otimizado - apenas funções essenciais mantidas');
