// js/modules/reader/pdf-utils.js
console.log('🔧 pdf-utils.js carregado - Funções otimizadas');

// INLINE CANDIDATES - Funções pequenas e frequentemente chamadas
window.pdfFormatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

window.pdfValidateUrl = function(url) {
    return url && url.trim() !== '' && 
           url !== 'EMPTY' && url !== 'undefined' && url !== 'null' &&
           (url.startsWith('http') || url.includes('supabase.co'));
};

// Função para verificar se URL de PDF é válida
window.pdfVerifyUrl = async function(url) {
    return new Promise((resolve) => {
        // Verificação básica
        if (!url || !url.includes('supabase.co')) {
            resolve({ valid: false, error: 'URL inválida' });
            return;
        }
        
        // Verificar HEAD request (sem carregar arquivo completo)
        fetch(url, { method: 'HEAD' })
            .then(response => {
                const isValid = response.ok && 
                              response.headers.get('content-type')?.includes('pdf');
                resolve({ 
                    valid: isValid, 
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    url: url
                });
            })
            .catch(error => {
                resolve({ 
                    valid: false, 
                    error: error.message,
                    url: url
                });
            });
    });
};

window.pdfExtractFileName = function(url, index) {
    let fileName = 'Documento';
    if (url.includes('/')) {
        const parts = url.split('/');
        fileName = parts[parts.length - 1] || `Documento ${index + 1}`;
        try { fileName = decodeURIComponent(fileName); } catch (e) {}
        if (fileName.length > 50) fileName = fileName.substring(0, 47) + '...';
    } else {
        fileName = `Documento ${index + 1}`;
    }
    return fileName;
};
