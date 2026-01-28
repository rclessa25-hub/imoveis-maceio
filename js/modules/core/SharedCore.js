// js/modules/core/SharedCore.js - COM FUNÇÕES UNIFICADAS DE FEATURES E VIDEO
console.log('🔧 SharedCore.js carregado - COM FUNÇÕES UNIFICADAS DE FEATURES E VIDEO');

// ========== CONSTANTES SUPABASE FIXAS (IMPORTANTE!) ==========
// Verificar se já foi declarado por outro módulo (media-unified.js)
if (typeof SUPABASE_CONSTANTS === 'undefined') {
    const SUPABASE_CONSTANTS = {
        URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
    
    // Exportar para escopo global se não existir
    window.SUPABASE_CONSTANTS = SUPABASE_CONSTANTS;
    console.log('✅ SUPABASE_CONSTANTS definido por SharedCore');
} else {
    console.log('✅ SUPABASE_CONSTANTS já definido por outro módulo');
}

// ========== GARANTIR QUE AS CONSTANTES EXISTAM GLOBALMENTE ==========
Object.entries(window.SUPABASE_CONSTANTS).forEach(([key, value]) => {
    if (typeof window[key] === 'undefined' || window[key] === 'undefined') {
        window[key] = value;
        console.log(`✅ ${key} definida:`, key.includes('KEY') ? '✅ Disponível' : value.substring(0, 50) + '...');
    }
});

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
        
        // Se já é string formatada, retorna como está
        if (typeof price === 'string' && price.includes('R$')) {
            return price;
        }
        
        // Converter para número
        const numericPrice = parseFloat(price.toString().replace(/[^0-9,-]/g, '').replace(',', '.'));
        
        if (isNaN(numericPrice)) return 'R$ 0,00';
        
        // Formatar com separadores brasileiros
        return numericPrice.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // ========== FUNÇÕES UNIFICADAS DE FEATURES E VIDEO ==========
    const formatFeaturesForDisplay = function(features) {
        console.log('🔍 SharedCore.formatFeaturesForDisplay:', { input: features, type: typeof features });
        
        if (!features) return '';
        
        try {
            // Se for array, transformar em string separada por vírgula
            if (Array.isArray(features)) {
                return features.filter(f => f && f.trim()).join(', ');
            }
            
            // Se for string JSON (com colchetes), extrair array
            if (typeof features === 'string' && features.trim().startsWith('[') && features.trim().endsWith(']')) {
                try {
                    const parsed = JSON.parse(features);
                    if (Array.isArray(parsed)) {
                        return parsed.filter(f => f && f.trim()).join(', ');
                    }
                } catch (e) {
                    console.warn('⚠️ SharedCore: Erro ao parsear JSON de features:', e);
                    // Se falhar o parse, tentar limpar
                    return features.replace(/[\[\]"]/g, '').replace(/\s*,\s*/g, ', ');
                }
            }
            
            // Se já for string com colchetes, remover
            let cleaned = features.toString();
            cleaned = cleaned.replace(/[\[\]"]/g, ''); // Remover colchetes e aspas
            cleaned = cleaned.replace(/\s*,\s*/g, ', '); // Normalizar espaços
            
            return cleaned;
        } catch (error) {
            console.error('❌ SharedCore: Erro ao formatar features:', error);
            return '';
        }
    };
    
    const parseFeaturesForStorage = function(value) {
        console.log('🔍 SharedCore.parseFeaturesForStorage:', { input: value });
        
        if (!value) return '[]';
        
        try {
            // Se já é array, converter para JSON
            if (Array.isArray(value)) {
                return JSON.stringify(value.filter(f => f && f.trim()));
            }
            
            // Se é string JSON, manter
            if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
                try {
                    JSON.parse(value); // Validar
                    return value;
                } catch (e) {
                    // Se inválido, processar como string normal
                }
            }
            
            // Se é string normal, converter para array
            const featuresArray = value.split(',')
                .map(f => f.trim())
                .filter(f => f && f !== '');
            
            return JSON.stringify(featuresArray);
        } catch (error) {
            console.error('❌ SharedCore: Erro ao parsear features:', error);
            return '[]';
        }
    };
    
    const ensureBooleanVideo = function(videoValue) {
        console.log('🔍 SharedCore.ensureBooleanVideo:', { input: videoValue, type: typeof videoValue });
        
        if (videoValue === undefined || videoValue === null) {
            return false;
        }
        
        // Se já é booleano
        if (typeof videoValue === 'boolean') {
            return videoValue;
        }
        
        // Se é string 'true' ou 'false'
        if (typeof videoValue === 'string') {
            const lower = videoValue.toLowerCase().trim();
            if (lower === 'true' || lower === '1' || lower === 'sim' || lower === 'yes') {
                return true;
            }
            if (lower === 'false' || lower === '0' || lower === 'não' || lower === 'no') {
                return false;
            }
        }
        
        // Se é número
        if (typeof videoValue === 'number') {
            return videoValue === 1;
        }
        
        // Converter para booleano
        return Boolean(videoValue);
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

    // ========== SISTEMA DE FORMATAÇÃO UNIFICADO DE PREÇO ==========
    const PriceFormatter = {
        /**
         * Formata número com separadores de milhar garantidos
         * @param {number} number - Número a formatar
         * @returns {string} Número formatado com pontos
         */
        formatNumberWithSeparators: function(number) {
            if (isNaN(number) || !number) return '0';
            
            // Garantir que é inteiro
            const intNumber = Math.floor(Number(number));
            
            // Usar toLocaleString com configuração explícita
            let formatted = intNumber.toLocaleString('pt-BR', {
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            
            // Verificar se tem separadores
            if (formatted.includes('.')) {
                return formatted;
            }
            
            // Fallback manual para navegadores que não respeitam useGrouping
            const numStr = intNumber.toString();
            const parts = [];
            
            // Processar de 3 em 3 dígitos do final para o início
            for (let i = numStr.length; i > 0; i -= 3) {
                const start = Math.max(0, i - 3);
                parts.unshift(numStr.substring(start, i));
            }
            
            return parts.join('.');
        },

        /**
         * Formata valor para "R$ X.XXX"
         * @param {string|number} value - Valor a formatar
         * @returns {string} Preço formatado
         */
        formatForInput: function(value) {
            if (!value && value !== 0) return '';
            
            // Se já formatado com R$, limpar e reformatar
            if (typeof value === 'string' && value.includes('R$')) {
                const numbersOnly = value.replace(/\D/g, '');
                if (numbersOnly === '') return value;
                
                const numericValue = parseInt(numbersOnly);
                if (isNaN(numericValue)) return value;
                
                return 'R$ ' + this.formatNumberWithSeparators(numericValue);
            }
            
            // Extrair números
            const numbersOnly = value.toString().replace(/\D/g, '');
            if (numbersOnly === '') return '';
            
            const numericValue = parseInt(numbersOnly);
            if (isNaN(numericValue)) return '';
            
            return 'R$ ' + this.formatNumberWithSeparators(numericValue);
        },
        
        /**
         * Extrai apenas números do preço formatado
         * @param {string} formattedPrice - Preço formatado (ex: "R$ 450.000")
         * @returns {string} Apenas números
         */
        extractNumbers: function(formattedPrice) {
            if (!formattedPrice) return '';
            return formattedPrice.toString().replace(/\D/g, '');
        },
        
        /**
         * Formata para exibição (com decimais quando aplicável)
         * @param {string|number} value - Valor a formatar
         * @returns {string} Preço pronto para exibição
         */
        formatForDisplay: function(value) {
            if (!value && value !== 0) return 'R$ 0,00';
            
            // Se já formatado para exibição, retorna
            if (typeof value === 'string' && value.includes('R$') && value.includes(',')) {
                return value;
            }
            
            // Extrair números
            const numbersOnly = value.toString().replace(/\D/g, '');
            const numericValue = parseInt(numbersOnly) || 0;
            
            // Formatar com decimais
            return numericValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        /**
         * Formata preço para exibição em cards (compatibilidade com properties.js)
         * @param {string|number} value - Valor a formatar
         * @param {boolean} forceFormat - Forçar formatação mesmo se já formatado
         * @returns {string} Preço pronto para exibição em cards
         */
        formatForCard: function(value, forceFormat = false) {
            if (!value && value !== 0) return 'R$ 0,00';
            
            // Se já formatado e não forçando, retornar como está
            if (!forceFormat && typeof value === 'string' && value.includes('R$')) {
                return value;
            }
            
            // Extrair números e formatar
            const numbersOnly = value.toString().replace(/[^0-9,-]/g, '').replace(',', '.');
            const numericValue = parseFloat(numbersOnly) || 0;
            
            // Formatar com decimais
            return numericValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        /**
         * Formata preço para input (compatibilidade com admin.js)
         * @param {string|number} value - Valor a formatar
         * @returns {string} Preço formatado para campo de input
         */
        formatForAdmin: function(value) {
            return this.formatForInput(value);
        },
        
        /**
         * Configura formatação automática em um campo de input
         * @param {HTMLInputElement} inputElement - Elemento input a configurar
         */
        setupAutoFormat: function(inputElement) {
            if (!inputElement || inputElement.tagName !== 'INPUT') return;
            
            // Formatar valor inicial se existir
            if (inputElement.value && !inputElement.value.startsWith('R$')) {
                inputElement.value = this.formatForInput(inputElement.value);
            }
            
            // Evento de input (digitação)
            inputElement.addEventListener('input', (e) => {
                // Permitir ações de exclusão sem formatação
                if (e.inputType === 'deleteContentBackward' || 
                    e.inputType === 'deleteContentForward' ||
                    e.inputType === 'deleteByCut') {
                    return;
                }
                
                // Salvar posição do cursor
                const cursorPos = e.target.selectionStart;
                const originalValue = e.target.value;
                
                // Formatar
                e.target.value = this.formatForInput(e.target.value);
                
                // Ajustar cursor
                const diff = e.target.value.length - originalValue.length;
                e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
            });
            
            // Formatar ao perder foco (garantir)
            inputElement.addEventListener('blur', (e) => {
                if (e.target.value && !e.target.value.startsWith('R$')) {
                    e.target.value = this.formatForInput(e.target.value);
                }
            });
        }
    };

    // ========== UTILITÁRIO DE CARREGAMENTO DE IMAGENS ==========
    const ImageLoader = {
        waitForCriticalImages: async function(selectors = ['.hero img', '.property-image img'], maxWait = 3000) {
            const images = [];
            selectors.forEach(selector => {
                images.push(...document.querySelectorAll(selector));
            });
            
            const limitedImages = images.slice(0, 8);
            if (limitedImages.length === 0) return 0;
            
            return new Promise((resolve) => {
                let loaded = 0;
                limitedImages.forEach(img => {
                    if (img.complete || img.tagName === 'I') {
                        loaded++;
                    } else {
                        img.onload = img.onerror = () => {
                            loaded++;
                            if (loaded >= limitedImages.length) resolve(loaded);
                        };
                    }
                });
                
                if (loaded >= limitedImages.length) {
                    resolve(loaded);
                } else {
                    setTimeout(() => resolve(loaded), maxWait);
                }
            });
        }
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
    const logModule = (moduleName, message, level = 'info', data = null) => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${moduleName.toUpperCase()}]`;
        
        const levels = {
            info: () => console.log(`${prefix} ℹ️ ${message}`, data || ''),
            warn: () => console.warn(`${prefix} ⚠️ ${message}`, data || ''),
            error: () => console.error(`${prefix} ❌ ${message}`, data || ''),
            success: () => console.log(`${prefix} ✅ ${message}`, data || ''),
            debug: () => console.debug(`${prefix} 🔍 ${message}`, data || '')
        };
        
        (levels[level] || levels.info)();
    };

    // ========== SUPABASE ESSENCIAL (COM CONSTANTES FIXAS) ==========
    const supabaseFetch = async (endpoint, options = {}) => {
        try {
            // ✅ USAR CONSTANTES FIXAS, NÃO window.SUPABASE_URL
            const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
            
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = `${SUPABASE_URL}/rest/v1${endpoint}`;
            const finalUrl = proxyUrl + encodeURIComponent(targetUrl);
            
            console.log(`📡 Supabase fetch: ${endpoint}`);
            
            const response = await fetch(finalUrl, {
                method: options.method || 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
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

    // Função de validação de Supabase
    const validateSupabaseConnection = async () => {
        try {
            const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            return {
                connected: response.ok,
                status: response.status,
                online: response.ok ? '✅ CONECTADO' : '❌ OFFLINE'
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                online: '❌ ERRO DE CONEXÃO'
            };
        }
    };

    // Função de geração de ID único
    const generateUniqueId = (prefix = 'id') => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    };

    // Função de sanitização de texto
    const sanitizeText = (text, maxLength = null) => {
        if (!text) return '';
        
        // Remover HTML tags e trim
        let sanitized = text.toString()
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Truncar se necessário
        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength - 3) + '...';
        }
        
        return sanitized;
    };

    // Função de delay (para testes e animações)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // ========== FUNÇÃO DE CÓPIA PARA CLIPBOARD ==========
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('❌ Erro ao copiar:', err);
            return false;
        }
    };

    // ========== FUNÇÃO PARA TESTAR UPLOAD DE ARQUIVOS ==========
    const testFileUpload = async () => {
        console.group('🧪 TESTE DE UPLOAD DE ARQUIVOS');
        
        const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
        const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
        
        console.log('🔧 Configuração:', {
            SUPABASE_URL: SUPABASE_URL.substring(0, 50) + '...',
            SUPABASE_KEY: SUPABASE_KEY ? '✅ Disponível' : '❌ Indisponível'
        });
        
        // Criar arquivo de teste
        const testBlob = new Blob(['test content'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
        
        const bucket = 'properties';
        const fileName = `test_${Date.now()}.txt`;
        const filePath = `${bucket}/${fileName}`;
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;
        
        console.log('📤 Tentando upload para:', uploadUrl.substring(0, 80) + '...');
        
        try {
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'text/plain'
                },
                body: testFile
            });
            
            console.log('📡 Resposta:', response.status, response.statusText);
            
            if (response.ok) {
                const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                console.log('✅ UPLOAD BEM-SUCEDIDO!');
                console.log('🔗 URL pública:', publicUrl);
                return { success: true, url: publicUrl };
            } else {
                const errorText = await response.text();
                console.error('❌ Upload falhou:', errorText);
                return { success: false, error: errorText };
            }
        } catch (error) {
            console.error('❌ Erro de conexão:', error);
            return { success: false, error: error.message };
        } finally {
            console.groupEnd();
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
        
        // Funções unificadas de features e video
        formatFeaturesForDisplay,
        parseFeaturesForStorage,
        ensureBooleanVideo,
        
        // Sistema de formatação de preço UNIFICADO
        PriceFormatter,
        
        // Sistema de carregamento de imagens
        ImageLoader,
        
        // Funções de compatibilidade (para código legado)
        formatPriceForInput: PriceFormatter.formatForInput.bind(PriceFormatter),
        getPriceNumbersOnly: PriceFormatter.extractNumbers.bind(PriceFormatter),
        setupPriceAutoFormat: function() {
            const priceField = document.getElementById('propPrice');
            if (priceField) PriceFormatter.setupAutoFormat(priceField);
        },
        
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
        copyToClipboard,
        
        // Novas funções
        validateSupabaseConnection,
        generateUniqueId,
        sanitizeText,
        delay,
        
        // Teste de upload
        testFileUpload,
        
        // Constantes (exportadas para compatibilidade)
        SUPABASE_CONSTANTS: window.SUPABASE_CONSTANTS
    };
})();

// Exportar para escopo global
window.SharedCore = SharedCore;

// ========== COMPATIBILIDADE GLOBAL ==========
(function setupGlobalCompatibility() {
    console.log('🔗 Configurando compatibilidade global de formatação...');
    
    // Expor funções de formatação globalmente (para código legado)
    if (typeof window.formatPrice === 'undefined') {
        window.formatPrice = function(value) {
            return SharedCore.PriceFormatter.formatForCard(value);
        };
    }
    
    if (typeof window.formatPriceForInput === 'undefined') {
        window.formatPriceForInput = function(value) {
            return SharedCore.PriceFormatter.formatForInput(value);
        };
    }
    
    // Expor funções de features globalmente para compatibilidade
    if (typeof window.formatFeaturesForDisplay === 'undefined') {
        window.formatFeaturesForDisplay = function(features) {
            return SharedCore.formatFeaturesForDisplay(features);
        };
    }
    
    if (typeof window.parseFeaturesForStorage === 'undefined') {
        window.parseFeaturesForStorage = function(value) {
            return SharedCore.parseFeaturesForStorage(value);
        };
    }
    
    if (typeof window.ensureBooleanVideo === 'undefined') {
        window.ensureBooleanVideo = function(videoValue) {
            return SharedCore.ensureBooleanVideo(videoValue);
        };
    }
    
    console.log('✅ Compatibilidade de formatação de preço e features configurada');
})();

// ========== INICIALIZAÇÃO E COMPATIBILIDADE ==========
function initializeGlobalCompatibility() {
    console.log('🔗 Inicializando compatibilidade global...');
    
    // Mapeamento de funções para expor globalmente
    const globalExports = {
        // Performance
        debounce: SharedCore.debounce,
        throttle: SharedCore.throttle,
        runLowPriority: SharedCore.runLowPriority,
        
        // Validações
        isMobileDevice: SharedCore.isMobileDevice,
        isValidEmail: SharedCore.isValidEmail,
        isValidPhone: SharedCore.isValidPhone,
        
        // Strings
        formatPrice: SharedCore.formatPrice,
        truncateText: SharedCore.truncateText,
        stringSimilarity: SharedCore.stringSimilarity,
        
        // Funções unificadas de features e video
        formatFeaturesForDisplay: SharedCore.formatFeaturesForDisplay,
        parseFeaturesForStorage: SharedCore.parseFeaturesForStorage,
        ensureBooleanVideo: SharedCore.ensureBooleanVideo,
        
        // Formatação de preço (compatibilidade com código legado)
        formatPriceForInput: SharedCore.formatPriceForInput,
        getPriceNumbersOnly: SharedCore.getPriceNumbersOnly,
        setupPriceAutoFormat: SharedCore.setupPriceAutoFormat,
        
        // DOM
        elementExists: SharedCore.elementExists,
        
        // Logging
        logModule: SharedCore.logModule,
        
        // Supabase
        supabaseFetch: SharedCore.supabaseFetch,
        
        // Utilitários
        copyToClipboard: SharedCore.copyToClipboard,
        
        // Teste de upload
        testFileUpload: SharedCore.testFileUpload
    };
    
    // Exportar para window (somente se não existirem já)
    Object.entries(globalExports).forEach(([name, func]) => {
        if (typeof window[name] === 'undefined' && typeof func === 'function') {
            window[name] = func;
        }
    });
    
    console.log(`✅ ${Object.keys(globalExports).length} funções disponíveis globalmente`);
}

// ========== INICIALIZAÇÃO AUTOMÁTICA DA FORMATAÇÃO DE PREÇO ==========
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar compatibilidade global
    initializeGlobalCompatibility();
    
    // Configurar formatação automática do campo de preço
    setTimeout(() => {
        const priceField = document.getElementById('propPrice');
        if (priceField && window.SharedCore?.PriceFormatter) {
            window.SharedCore.PriceFormatter.setupAutoFormat(priceField);
            console.log('✅ Formatação automática de preço configurada no DOMContentLoaded');
        }
    }, 800);
});

// ========== AUTO-VALIDAÇÃO ==========
setTimeout(() => {
    console.group('🧪 VALIDAÇÃO DO SHAREDCORE');
    
    const essentialFunctions = [
        'debounce', 'throttle', 'formatPrice', 'supabaseFetch',
        'elementExists', 'isMobileDevice', 'copyToClipboard',
        'logModule', 'runLowPriority', 'validateProperty'
    ];
    
    let allAvailable = true;
    essentialFunctions.forEach(func => {
        const available = typeof window[func] === 'function';
        console.log(`${available ? '✅' : '❌'} ${func} disponível`);
        if (!available) allAvailable = false;
    });
    
    // Verificar constantes
    const essentialConstants = ['SUPABASE_URL', 'SUPABASE_KEY', 'ADMIN_PASSWORD', 'PDF_PASSWORD'];
    essentialConstants.forEach(constant => {
        const exists = window[constant] !== undefined;
        console.log(`${exists ? '✅' : '❌'} ${constant} definida`);
        if (!exists) allAvailable = false;
    });
    
    // Verificar novas funções de formatação
    const newFormatFunctions = ['formatPriceForCard', 'formatPriceForAdmin'];
    newFormatFunctions.forEach(func => {
        const available = window.SharedCore?.PriceFormatter?.[func] !== undefined;
        console.log(`${available ? '✅' : '❌'} PriceFormatter.${func} disponível`);
        if (!available) allAvailable = false;
    });
    
    // Verificar novas funções unificadas
    const unifiedFunctions = ['formatFeaturesForDisplay', 'parseFeaturesForStorage', 'ensureBooleanVideo'];
    unifiedFunctions.forEach(func => {
        const available = window.SharedCore?.[func] !== undefined;
        console.log(`${available ? '✅' : '❌'} ${func} disponível no SharedCore`);
        if (!available) allAvailable = false;
    });
    
    console.log(allAvailable ? '🎪 SHAREDCORE VALIDADO COM FUNÇÕES UNIFICADAS' : '⚠️ VERIFICAÇÃO REQUERIDA');
    console.groupEnd();
}, 2000);

// ========== GARANTIR QUE SUPABASE_CONSTANTS SEJA ÚNICA ==========
(function ensureUniqueSupabaseConstants() {
    if (window.SUPABASE_CONSTANTS && window.SUPABASE_CONSTANTS.URL) {
        console.log('✅ SUPABASE_CONSTANTS já existe, usando referência existente');
        return;
    }
    
    window.SUPABASE_CONSTANTS = {
        URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
    
    console.log('✅ SUPABASE_CONSTANTS definido globalmente');
})();

// ========== TESTE DAS FUNÇÕES UNIFICADAS ==========
setTimeout(() => {
    if (window.location.search.includes('debug=true')) {
        console.group('🧪 TESTE DAS FUNÇÕES UNIFICADAS DE FEATURES E VIDEO');
        
        // Teste 1: formatFeaturesForDisplay
        const testFeaturesJSON = '["2 Quartos", "Garagem", "Piscina"]';
        const testFeaturesString = '2 Quartos, Garagem, Piscina';
        const testFeaturesArray = ['2 Quartos', 'Garagem', 'Piscina'];
        
        const result1 = SharedCore.formatFeaturesForDisplay(testFeaturesJSON);
        const result2 = SharedCore.formatFeaturesForDisplay(testFeaturesString);
        const result3 = SharedCore.formatFeaturesForDisplay(testFeaturesArray);
        
        console.log('✅ formatFeaturesForDisplay:', {
            'JSON → String': result1 === '2 Quartos, Garagem, Piscina' ? 'OK' : 'FALHOU',
            'String → String': result2 === '2 Quartos, Garagem, Piscina' ? 'OK' : 'FALHOU',
            'Array → String': result3 === '2 Quartos, Garagem, Piscina' ? 'OK' : 'FALHOU'
        });
        
        // Teste 2: parseFeaturesForStorage
        const parsed1 = SharedCore.parseFeaturesForStorage('2 Quartos, Garagem, Piscina');
        const parsed2 = SharedCore.parseFeaturesForStorage(testFeaturesArray);
        const parsed3 = SharedCore.parseFeaturesForStorage(testFeaturesJSON);
        
        console.log('✅ parseFeaturesForStorage:', {
            'String → JSON': parsed1.includes('2 Quartos') ? 'OK' : 'FALHOU',
            'Array → JSON': parsed2.includes('2 Quartos') ? 'OK' : 'FALHOU',
            'JSON → JSON': parsed3 === testFeaturesJSON ? 'OK' : 'FALHOU'
        });
        
        // Teste 3: ensureBooleanVideo
        const videoTests = [
            { input: true, expected: true },
            { input: false, expected: false },
            { input: 'true', expected: true },
            { input: 'false', expected: false },
            { input: 'sim', expected: true },
            { input: 'não', expected: false },
            { input: 1, expected: true },
            { input: 0, expected: false },
            { input: '1', expected: true },
            { input: '0', expected: false }
        ];
        
        let videoPassed = 0;
        videoTests.forEach((test, index) => {
            const result = SharedCore.ensureBooleanVideo(test.input);
            if (result === test.expected) {
                videoPassed++;
            } else {
                console.warn(`⚠️ Teste ${index + 1} falhou: ${test.input} → ${result} (esperado: ${test.expected})`);
            }
        });
        
        console.log(`✅ ensureBooleanVideo: ${videoPassed}/${videoTests.length} testes passados`);
        
        // Teste 4: Compatibilidade global
        console.log('✅ Funções disponíveis globalmente:', {
            window_formatFeaturesForDisplay: typeof window.formatFeaturesForDisplay,
            window_parseFeaturesForStorage: typeof window.parseFeaturesForStorage,
            window_ensureBooleanVideo: typeof window.ensureBooleanVideo,
            SharedCore_formatFeaturesForDisplay: typeof SharedCore.formatFeaturesForDisplay,
            SharedCore_parseFeaturesForStorage: typeof SharedCore.parseFeaturesForStorage,
            SharedCore_ensureBooleanVideo: typeof SharedCore.ensureBooleanVideo
        });
        
        console.groupEnd();
    }
}, 3000);

console.log(`✅ SharedCore.js pronto - Sistema de formatação unificado (features + video + preço)`);
