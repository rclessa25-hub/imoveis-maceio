// js/modules/reader/pdf-logger.js
// SISTEMA ESSENCIAL DE LOGGING DE PDFs (CORE)

console.log('📄 pdf-logger.js - Sistema essencial mantido no core');

(function setupPdfLoggerFallback() {
    // Evitar sobrescrever se já estiver carregado
    if (window.PdfLogger) {
        console.log('ℹ️ PdfLogger já definido - ignorando fallback');
        return;
    }

    const isDebugMode =
        window.location.search.includes('debug=true') ||
        window.location.search.includes('test=true');

    if (isDebugMode) {
        console.log('🔧 pdf-logger.js: Modo debug ativo - aguardando logger do repositório de suporte');
        setupTemporaryFallback();
        return;
    }
    console.log('🚀 pdf-logger.js: Modo produção - logger silencioso ativo');

    window.PdfLogger = createSilentPdfLogger();

    console.log('✅ pdf-logger.js: Fallback silencioso configurado');
})();

function createSilentPdfLogger() {
    const silentFn = () => {};

    const silentGroup = new Proxy({}, {
        get: () => silentFn
    });

    return {
        upload: silentGroup,
        delete: silentGroup,
        preview: silentGroup,
        edit: silentGroup,
        viewer: silentGroup,
        debug: silentGroup,
        integration: silentGroup,
        simple: silentFn,
        error: silentFn,
        start: () => Date.now(),
        end: () => {}
    };
}

function setupTemporaryFallback() {
    if (window.PdfLogger) return;
    window.PdfLogger = createSilentPdfLogger();
}

console.log('📁 pdf-logger.js migrado para arquitetura de dois repositórios');
console.log('🔗 Logger completo disponível em: weberlessa-support/debug/pdf-logger.js');
