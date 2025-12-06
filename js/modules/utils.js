// js/modules/utils.js - VERSÃO CORRIGIDA PARA VARIÁVEIS GLOBAIS

console.log('🔧 Módulo utils.js carregado');

// ========== CONSTANTES GLOBAIS ==========
// ATENÇÃO: Usar window. para tornar as variáveis globais
window.SUPABASE_URL = 'https://syztbxvpdaplpetmixmt.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo';
window.ADMIN_PASSWORD = "wl654";
window.PDF_PASSWORD = "doc123";

console.log('✅ Constantes globais definidas:', {
    SUPABASE_URL: window.SUPABASE_URL ? '✅' : '❌',
    SUPABASE_KEY: window.SUPABASE_KEY ? '✅' : '❌',
    ADMIN_PASSWORD: window.ADMIN_PASSWORD ? '✅' : '❌',
    PDF_PASSWORD: window.PDF_PASSWORD ? '✅' : '❌'
});

// ========== FUNÇÕES UTILITÁRIAS ==========

// Detectar dispositivo móvel
window.isMobileDevice = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Testar conexão com Supabase
window.testSupabaseConnection = async function() {
    try {
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('❌ Erro na conexão Supabase:', error);
        return false;
    }
};

// Testar acesso às imagens
window.testImageAccess = async function() {
    console.log('🔍 Testando acesso às imagens...');
    
    const testImages = [
        'https://syztbxvpdaplpetmixmt.supabase.co/storage/v1/object/public/properties/1764341618532_thumbnail3.jpeg',
        'https://syztbxvpdaplpetmixmt.supabase.co/storage/v1/object/public/properties/1764341628860_thumbnail2.jpeg',
        'https://syztbxvpdaplpetmixmt.supabase.co/storage/v1/object/public/properties/1764341634876_thumbnail1.jpeg'
    ];
    
    for (const imgUrl of testImages) {
        try {
            const response = await fetch(imgUrl);
            if (response.ok) {
                console.log(`✅ Imagem acessível: ${imgUrl}`);
            } else {
                console.log(`❌ Imagem não acessível: ${imgUrl} - Status: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Erro ao acessar imagem: ${imgUrl} - ${error.message}`);
        }
    }
};

// Log formatado para módulos
window.logModule = function(moduleName, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${moduleName}] ${message}`);
};

// Verificar se elemento existe
window.elementExists = function(id) {
    const element = document.getElementById(id);
    return element !== null;
};

// Formatar preço
window.formatPrice = function(price) {
    if (!price) return 'R$ 0,00';
    return price.toString().replace('.', ',');
};

// Validar email
window.isValidEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validar telefone
window.isValidPhone = function(phone) {
    const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    return re.test(phone);
};

// Copiar para clipboard
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('❌ Erro ao copiar:', err);
        return false;
    }
};

// Debounce function (para eventos frequentes)
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

// Throttle function (para scroll/resize)
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

console.log('✅ Módulo utils.js completamente carregado');
