// ARQUIVO MIGRADO PARA media-unified.js
console.log('📁 media-ui.js migrado para media-unified.js');

// Fallback silencioso
if (typeof window.updateMediaPreview === 'undefined') {
    window.updateMediaPreview = function() {
        console.log('🎨 updateMediaPreview (fallback) - use MediaSystem.updateUI()');
        return window.MediaSystem ? window.MediaSystem.updateUI() : null;
    };
}
