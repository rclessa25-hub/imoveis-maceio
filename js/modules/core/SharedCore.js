// js/modules/core/SharedCore.js - COM CONSTANTES SUPABASE FIXAS
console.log('🔧 SharedCore.js carregado - COM CONSTANTES FIXAS PARA SUPABASE');

// ========== CONSTANTES SUPABASE FIXAS (IMPORTANTE!) ==========
const SUPABASE_CONSTANTS = {
    URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
    ADMIN_PASSWORD: "wl654",
    PDF_PASSWORD: "doc123"
};

// ========== GARANTIR QUE AS CONSTANTES EXISTAM GLOBALMENTE ==========
Object.entries(SUPABASE_CONSTANTS).forEach(([key, value]) => {
    if (typeof window[key] === 'undefined' || window[key] === 'undefined') {
        window[key] = value;
        console.log(`✅ ${key} definida:`, key.includes('KEY') ? '✅ Disponível' : value.substring(0, 50) + '...');
    } else {
        // ✅ NOVO: Verificar se as constantes globais são diferentes das fixas
        if (key === 'URL' && window[key] !== value) {
            console.warn(`⚠️ SUPABASE_URL diferente! Fixa: ${value.substring(0, 50)}... | Global: ${window[key]?.substring(0, 50)}...`);
        }
    }
});

// ========== VERIFICAÇÃO DE CONSTANTES ==========
setTimeout(() => {
    console.log('🔍 VERIFICAÇÃO DE CONSTANTES SUPABASE:');
    console.log('- SUPABASE_URL:', window.SUPABASE_URL ? '✅ ' + window.SUPABASE_URL.substring(0, 50) + '...' : '❌ undefined');
    console.log('- SUPABASE_KEY:', window.SUPABASE_KEY ? '✅ Disponível' : '❌ Indisponível');
    console.log('- ADMIN_PASSWORD:', window.ADMIN_PASSWORD ? '✅ Definida' : '❌ Indefinida');
    console.log('- PDF_PASSWORD:', window.PDF_PASSWORD ? '✅ Definida' : '❌ Indefinida');
    
    // Correção de emergência se ainda estiver undefined
    if (!window.SUPABASE_URL || window.SUPABASE_URL.includes('undefined')) {
        console.error('🚨 CORREÇÃO DE EMERGÊNCIA: SUPABASE_URL está undefined!');
        window.SUPABASE_URL = SUPABASE_CONSTANTS.URL;
        window.SUPABASE_KEY = SUPABASE_CONSTANTS.KEY;
        console.log('✅ Constantes corrigidas:', window.SUPABASE_URL.substring(0, 50) + '...');
    }
}, 1000);

// ========== VERIFICAÇÃO DE SEGURANÇA ==========
setTimeout(() => {
    console.log('🔍 VERIFICAÇÃO DE CONSTANTES SUPABASE (APÓS TODOS OS MÓDULOS):');
    console.log('- SUPABASE_URL definida?', 
        window.SUPABASE_URL && window.SUPABASE_URL.includes('supabase.co') ? '✅ SIM' : '❌ NÃO');
    console.log('- SUPABASE_KEY definida?', 
        window.SUPABASE_KEY && window.SUPABASE_KEY.length > 50 ? '✅ SIM' : '❌ NÃO');
    console.log('- É do media-unified.js?', 
        window.SUPABASE_URL && window.SUPABASE_URL === 'https://syztbxvpdaplpetmixmt.supabase.co' ? '✅ SIM' : '❌ NÃO');
}, 2000);

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
            const SUPABASE_URL = SUPABASE_CONSTANTS.URL;
            const SUPABASE_KEY = SUPABASE_CONSTANTS.KEY;
            
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

    // Função de validação de Supabase
    const validateSupabaseConnection = async () => {
        try {
            const SUPABASE_URL = SUPABASE_CONSTANTS.URL;
            const SUPABASE_KEY = SUPABASE_CONSTANTS.KEY;
            
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
        
        const SUPABASE_URL = SUPABASE_CONSTANTS.URL;
        const SUPABASE_KEY = SUPABASE_CONSTANTS.KEY;
        
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
        copyToClipboard,
        
        // Novas funções
        validateSupabaseConnection,
        generateUniqueId,
        sanitizeText,
        delay,
        
        // Teste de upload
        testFileUpload,
        
        // Constantes (exportadas para compatibilidade)
        SUPABASE_CONSTANTS
    };
})();

// Exportar para escopo global
window.SharedCore = SharedCore;

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
        
        // Formatação de preço
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
    
    // Adicionar função de diagnóstico
    window.diagnoseSupabase = function() {
        console.group('🔍 DIAGNÓSTICO SUPABASE');
        console.log('1. Constantes:');
        console.log('- SUPABASE_URL:', window.SUPABASE_URL);
        console.log('- SUPABASE_KEY:', window.SUPABASE_KEY ? '✅ Disponível' : '❌ Indisponível');
        console.log('- É supabase.co?', window.SUPABASE_URL?.includes('supabase.co') ? '✅ Sim' : '❌ Não');
        
        console.log('2. Testando conexão...');
        SharedCore.validateSupabaseConnection().then(result => {
            console.log('- Conexão:', result.online);
        });
        
        console.log('3. Testando upload... (execute SharedCore.testFileUpload())');
        console.groupEnd();
    };
}

// Executar após SharedCore estar pronto
setTimeout(initializeGlobalCompatibility, 100);

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
    
    console.log(allAvailable ? '🎪 SHAREDCORE VALIDADO' : '⚠️ VERIFICAÇÃO REQUERIDA');
    console.groupEnd();
}, 2000);

console.log(`✅ SharedCore.js pronto - Constantes Supabase fixas garantidas`);
