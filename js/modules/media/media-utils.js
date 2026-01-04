// ARQUIVO MIGRADO PARA media-unified.js
console.log('📁 media-utils.js migrado para media-unified.js');

// Fallbacks mínimos para funções chamadas diretamente
if (typeof window.mediaFormatFileSize === 'undefined') {
    window.mediaFormatFileSize = function(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
}
