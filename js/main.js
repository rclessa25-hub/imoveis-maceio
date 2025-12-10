// ========== INICIALIZAÇÃO CORRIGIDA ==========
// ========== ADICIONAR DEBUG NA INICIALIZAÇÃO ==========
// ========== INICIALIZAÇÃO COMPLETA E ATUALIZADA ==========
// Adicione no início do DOMContentLoaded, antes de tudo:
// ========== INICIALIZAR GALERIA NO DOMContentLoaded ==========
// Adicione este código ao final do DOMContentLoaded:
// ========== INICIALIZAÇÃO COMPLETA DO SISTEMA ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Sistema Weber Lessa Iniciado');
    
    // Aplicar diretriz constitucional
    enforceConstitutionalGuideline();
    
    // TESTE DE CONEXÃO
    console.log('🔍 Testando conexões...');
    const supabaseOk = await testSupabaseConnection();
    console.log(`🌐 Supabase: ${supabaseOk ? '✅ Conectado' : '⚠️ Usando modo local'}`);
    
    // INICIALIZAR SISTEMA DE IMÓVEIS (IMPORTANTE: fazer primeiro!)
    await initializeProperties();
    
    // Configurar formulário e sistemas de upload
    setupForm();
    setupUploadSystem();
    setupPdfUploadSystem();
    
    // VERIFICAÇÃO FINAL DOS ELEMENTOS
    console.log('🔍 Verificação final do sistema:');
    console.log('- properties-container:', document.getElementById('properties-container') ? '✅' : '❌');
    console.log('- Total de imóveis carregados:', properties.length);
    
    // TESTAR ACESSO ÀS IMAGENS
    testImageAccess();
    
    // ========== INICIALIZAR GALERIA DE FOTOS ==========
    // ========== INICIALIZAR GALERIA ==========
    console.log('🎨 Inicializando galeria de fotos MOBILE FIRST...');
    
    // Adicionar estilos da galeria
    const styleSheet = document.createElement("style");
    styleSheet.textContent = galleryStyles;
    document.head.appendChild(styleSheet);
    
    // Configurar eventos da galeria
    setupGalleryEvents();
    
    console.log('✅ Galeria de fotos MOBILE FIRST inicializada!');
    console.log('✅ Sistema Weber Lessa completamente carregado e pronto!');
    
    // TESTE FINAL: Verificar se os imóveis estão visíveis
    setTimeout(() => {
        const container = document.getElementById('properties-container');
        if (container && container.children.length > 0) {
            console.log(`🎉 ${container.children.length} imóveis visíveis na página!`);
        } else {
            console.error('❌ NENHUM IMÓVEL VISÍVEL! Verificando problemas...');
            // Tentativa de emergência: renderizar novamente
            renderProperties();
        }
    }, 500);
    
    // Inicializar otimização mobile
    if (isMobileDevice()) {
        setTimeout(optimizeGalleryForMobile, 1000);
    }
  // Inicializar otimização mobile
    if (isMobileDevice()) {
        setTimeout(optimizeGalleryForMobile, 1000);
    }
});
