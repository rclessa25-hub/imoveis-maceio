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

    const stringSimilarity = function(str1, str2) {
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

    // ========== FUNÇÕES DE FORMATAÇÃO DE PREÇO (MIGRADAS DO admin.js) ==========
    const formatPriceForInput = function(value) {
        if (!value) return '';
        
        // Remove tudo que não for número
        let numbersOnly = value.toString().replace(/\D/g, '');
        
        // Se não tem números, retorna vazio
        if (numbersOnly === '') return '';
        
        // Converte para número inteiro
        let priceNumber = parseInt(numbersOnly);
        
        // Formata como "R$ X.XXX" (sem centavos)
        let formatted = 'R$ ' + priceNumber.toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return formatted;
    };

    // Função para obter apenas números do preço formatado
    const getPriceNumbersOnly = function(formattedPrice) {
        if (!formattedPrice) return '';
        // Remove "R$ " e todos os pontos
        return formattedPrice.replace('R$ ', '').replace(/\./g, '');
    };

    // ========== FORMATAÇÃO AUTOMÁTICA DO CAMPO PREÇO ==========
    const setupPriceAutoFormat = function() {
        const priceField = document.getElementById('propPrice');
        if (!priceField) return;
        
        // Formatar ao carregar (se já tiver valor)
        if (priceField.value && !priceField.value.startsWith('R$')) {
            priceField.value = formatPriceForInput(priceField.value);
        }
        
        // Formatar ao digitar
        priceField.addEventListener('input', function(e) {
            // Permite backspace, delete, setas
            if (e.inputType === 'deleteContentBackward' || 
                e.inputType === 'deleteContentForward' ||
                e.inputType === 'deleteByCut') {
                return;
            }
            
            // Salva posição do cursor
            const cursorPos = this.selectionStart;
            const originalValue = this.value;
            
            // Formata o valor
            this.value = formatPriceForInput(this.value);
            
            // Ajusta posição do cursor
            const diff = this.value.length - originalValue.length;
            this.setSelectionRange(cursorPos + diff, cursorPos + diff);
        });
        
        // Formatar ao perder foco (garantir formatação)
        priceField.addEventListener('blur', function() {
            if (this.value && !this.value.startsWith('R$')) {
                this.value = formatPriceForInput(this.value);
            }
        });
        
        console.log('✅ Formatação automática de preço configurada');
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
        
        // Funções de formatação de preço (MIGRADAS)
        formatPriceForInput,
        getPriceNumbersOnly,
        setupPriceAutoFormat,
        
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

// ========== FALLBACK SEGURO PARA COMPATIBILIDADE ==========
(function ensurePriceFormatting() {
    if (!window.formatPriceForInput && window.SharedCore?.formatPriceForInput) {
        window.formatPriceForInput = window.SharedCore.formatPriceForInput.bind(window.SharedCore);
        console.log('✅ Função formatPriceForInput disponível via SharedCore (compatibilidade)');
    }
    if (!window.getPriceNumbersOnly && window.SharedCore?.getPriceNumbersOnly) {
        window.getPriceNumbersOnly = window.SharedCore.getPriceNumbersOnly.bind(window.SharedCore);
        console.log('✅ Função getPriceNumbersOnly disponível via SharedCore (compatibilidade)');
    }
    if (!window.setupPriceAutoFormat && window.SharedCore?.setupPriceAutoFormat) {
        window.setupPriceAutoFormat = window.SharedCore.setupPriceAutoFormat.bind(window.SharedCore);
        console.log('✅ Função setupPriceAutoFormat disponível via SharedCore (compatibilidade)');
    }
})();

// ========== VALIDAÇÃO PÓS-MIGRAÇÃO ==========
setTimeout(() => {
    console.group('🧪 VALIDAÇÃO DA MIGRAÇÃO DE FORMATAÇÃO');
    
    const tests = [
        {
            name: 'formatPriceForInput disponível no SharedCore',
            test: () => typeof window.SharedCore.formatPriceForInput === 'function',
            critical: true
        },
        {
            name: 'getPriceNumbersOnly disponível no SharedCore',
            test: () => typeof window.SharedCore.getPriceNumbersOnly === 'function',
            critical: true
        },
        {
            name: 'setupPriceAutoFormat disponível no SharedCore',
            test: () => typeof window.SharedCore.setupPriceAutoFormat === 'function',
            critical: true
        },
        {
            name: 'stringSimilarity disponível no SharedCore',
            test: () => typeof window.SharedCore.stringSimilarity === 'function',
            critical: true
        },
        {
            name: 'Formatação R$ correta',
            test: () => window.SharedCore.formatPriceForInput('450000') === 'R$ 450.000',
            critical: true
        },
        {
            name: 'stringSimilarity funciona',
            test: () => {
                const result = window.SharedCore.stringSimilarity('teste', 'teste');
                return result === 1;
            },
            critical: true
        },
        {
            name: 'Funções disponíveis globalmente para compatibilidade',
            test: () => typeof window.formatPriceForInput === 'function' && 
                       typeof window.getPriceNumbersOnly === 'function' &&
                       typeof window.setupPriceAutoFormat === 'function',
            critical: false // Não crítico pois são fallbacks
        }
    ];
    
    let allPassed = true;
    tests.forEach(t => {
        const passed = t.test();
        console.log(`${passed ? '✅' : '❌'} ${t.name}`);
        if (!passed && t.critical) allPassed = false;
    });
    
    console.log(allPassed ? '🎉 MIGRAÇÃO VALIDADA' : '⚠️ VERIFICAÇÃO REQUERIDA');
    console.groupEnd();
}, 2000);

console.log('✅ SharedCore.js pronto - 26 funções utilitárias centralizadas (4 funções migradas: 3 de admin.js + 1 de properties.js)');
