// js/modules/core/SharedCore.js - MÓDULO CENTRALIZADO DE UTILITÁRIOS
console.log('🔧 SharedCore.js carregado - Utilitários Compartilhados');

const SharedCore = (function() {
    // ========== PERFORMANCE ESSENCIAIS ==========
    const debounce = (func, wait) => {
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

    const throttle = (func, limit) => {
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

    // ========== VALIDAÇÕES ==========
    const isMobileDevice = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent);
    };

    const isValidEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const isValidPhone = (phone) => {
        const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        return re.test(phone);
    };

    // ========== MANIPULAÇÃO DE STRINGS ==========
    const formatPrice = (price) => {
        if (!price && price !== 0) return 'R$ 0,00';
        
        // Remover qualquer formatação existente
        let cleanPrice = String(price)
            .replace('R$', '')
            .replace('.', '')
            .replace(',', '.')
            .trim();
        
        // Converter para número
        const numericPrice = parseFloat(cleanPrice);
        
        if (isNaN(numericPrice)) return 'R$ 0,00';
        
        // Formatar para moeda brasileira
        return numericPrice.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const stringSimilarity = (str1, str2) => {
        if (!str1 || !str2) return 0;
        
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();
        
        if (str1 === str2) return 1;
        if (str1.length < 2 || str2.length < 2) return 0;
        
        let match = 0;
        for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
            if (str1[i] === str2[i]) match++;
        }
        
        return match / Math.max(str1.length, str2.length);
    };

    // ========== DOM UTILITIES ==========
    const elementExists = (id) => {
        return document.getElementById(id) !== null;
    };

    const createElement = (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on')) {
                element[key.toLowerCase()] = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    };

    // ========== LOGGING SISTEMÁTICO ==========
    const logModule = (moduleName, message, level = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${moduleName}]`;
        
        const levels = {
            info: () => console.log(`${prefix} ${message}`),
            warn: () => console.warn(`⚠️ ${prefix} ${message}`),
            error: () => console.error(`❌ ${prefix} ${message}`),
            success: () => console.log(`✅ ${prefix} ${message}`)
        };
        
        (levels[level] || levels.info)();
    };

    // ========== SUPABASE ESSENCIAL (wrapper unificado) ==========
    const supabaseFetch = async (endpoint, options = {}) => {
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

    // ========== FUNÇÕES DE PERFORMANCE ==========
    const runLowPriority = (task) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(task, { timeout: 1000 });
        } else {
            setTimeout(task, 100);
        }
    };

    // ========== VALIDAÇÃO DE DADOS ==========
    const validateProperty = (propertyData) => {
        const errors = [];
        
        if (!propertyData?.title?.trim()) errors.push('Título é obrigatório');
        if (!propertyData?.price?.trim()) errors.push('Preço é obrigatório');
        if (!propertyData?.location?.trim()) errors.push('Localização é obrigatória');
        
        return {
            isValid: errors.length === 0,
            errors,
            hasErrors: errors.length > 0
        };
    };

    // ========== MANIPULAÇÃO DE ARRAYS ==========
    const arrayUtils = {
        // Mover funções que manipulam arrays aqui
        findDuplicates: (array, key) => {
            const seen = new Set();
            const duplicates = [];
            
            array.forEach(item => {
                const value = key ? item[key] : item;
                if (seen.has(value)) {
                    duplicates.push(item);
                } else {
                    seen.add(value);
                }
            });
            
            return duplicates;
        },
        
        sortByKey: (array, key, ascending = true) => {
            return [...array].sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                
                if (aVal < bVal) return ascending ? -1 : 1;
                if (aVal > bVal) return ascending ? 1 : -1;
                return 0;
            });
        }
    };

    // ========== API PÚBLICA ==========
    return {
        // Performance
        debounce,
        throttle,
        runLowPriority,
        
        // Validações
        isMobileDevice,
        isValidEmail,
        isValidPhone,
        validateProperty,
        
        // Strings
        formatPrice,
        truncateText,
        stringSimilarity,
        
        // DOM
        elementExists,
        createElement,
        
        // Logging
        logModule,
        
        // Supabase
        supabaseFetch,
        
        // Array Utils
        arrayUtils,
        
        // Utilitários diversos
        copyToClipboard: async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('❌ Erro ao copiar:', err);
                return false;
            }
        }
    };
})();

// Exportar para escopo global
window.SharedCore = SharedCore;
console.log('✅ SharedCore.js pronto - 23 funções utilitárias centralizadas');

// ========== WRAPPERS DE COMPATIBILIDADE ==========
(function createCompatibilityWrappers() {
    console.group('🔧 CRIANDO WRAPPERS DE COMPATIBILIDADE (CORRIGIDO)');
    
    // Lista de funções que DEVEM estar apenas no SharedCore
    const functionsToWrap = [
        'stringSimilarity', 
        'runLowPriority',
        'debounce',
        'throttle',
        'formatPrice',
        'isMobileDevice',
        'elementExists',
        'logModule',
        'supabaseFetch'
    ];
    
    functionsToWrap.forEach(funcName => {
        // Verificar se a função existe no SharedCore
        if (window.SharedCore && typeof window.SharedCore[funcName] === 'function') {
            
            // Se já existe no window e é diferente do SharedCore
            if (window[funcName] && window[funcName] !== window.SharedCore[funcName]) {
                console.log(`🔧 Criando wrapper para ${funcName}...`);
                
                // Guardar referência original para fallback
                const originalFunc = window[funcName];
                const sharedFunc = window.SharedCore[funcName];
                
                // Criar wrapper transparente
                window[funcName] = function(...args) {
                    // Executar via SharedCore
                    return sharedFunc.apply(this, args);
                };
                
                // Copiar propriedades se existirem
                Object.keys(originalFunc).forEach(key => {
                    if (!window[funcName][key]) {
                        window[funcName][key] = originalFunc[key];
                    }
                });
                
                console.log(`✅ Wrapper criado para ${funcName}`);
            }
        }
    });
    
    console.groupEnd();
})();
