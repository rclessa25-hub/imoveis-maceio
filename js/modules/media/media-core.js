// ARQUIVO MIGRADO PARA media-unified.js
// Este arquivo mantido apenas para compatibilidade reversível
console.log('📁 media-core.js migrado para media-unified.js');

// Fallback silencioso
if (typeof window.initMediaSystem === 'undefined') {
    window.initMediaSystem = function() {
        console.log('🔧 initMediaSystem (fallback) - use MediaSystem.init()');
        return window.MediaSystem ? window.MediaSystem.init('vendas') : null;
    };
}
