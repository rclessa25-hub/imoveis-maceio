// ARQUIVO MIGRADO PARA media-unified.js
console.log('📁 media-integration.js migrado para media-unified.js');

// Fallback silencioso
if (typeof window.setupMediaIntegration === 'undefined') {
    window.setupMediaIntegration = function() {
        console.log('🔗 setupMediaIntegration (fallback) - integração automática no MediaSystem');
        return true;
    };
}
