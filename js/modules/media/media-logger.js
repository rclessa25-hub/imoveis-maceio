// ARQUIVO REMOVIDO - Migrado para repositório de suporte
// Ver: https://github.com/rclessa25-hub/weberlessa-support/tree/main/debug
console.log('📁 media-logger.js removido - migrado para repositório de suporte');

// Este arquivo mantido apenas para compatibilidade
// O código real está em: https://rclessa25-hub.github.io/weberlessa-support/debug/media-logger.js

// Fallback mínimo para não quebrar dependências
if (typeof window.MediaLogger === 'undefined') {
    window.MediaLogger = {
        info: (m, msg) => console.log(`[${m}] ${msg}`),
        error: (m, msg) => console.error(`[${m}] ${msg}`),
        upload: {
            start: (count) => console.log(`📤 Upload: ${count} arquivos`),
            file: (index, total, name, size) => console.log(`📤 ${index}/${total}: ${name} (${size})`),
            success: (name, url) => console.log(`✅ ${name} enviado`),
            error: (name, error) => console.error(`❌ ${name}:`, error)
        },
        system: {
            init: (systemName) => console.log(`🔧 Sistema: ${systemName}`)
        }
    };
}
