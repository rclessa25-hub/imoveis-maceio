// js/modules/media/media-integration.js
console.log('🔗 media-integration.js carregado - Conectando módulo de mídia');

/**
 * MÓDULO DE INTEGRAÇÃO - Conecta o sistema de mídia ao admin e properties
 */

// ========== CONEXÃO COM O FORMULÁRIO ADMIN ==========

// Esta função substitui a lógica antiga do admin.js
window.setupMediaIntegration = function() {
    console.log('🔌 Configurando integração do módulo de mídia...');
    
    // 1. Sobrescrever a função de processamento do admin.js
    //    para usar nosso módulo de mídia
    const originalProcessFunction = window.processAndSavePdfs;
    
    window.processAndSaveMedia = async function(propertyId, propertyTitle) {
        console.group('🖼️ PROCESSANDO MÍDIA PARA IMÓVEL');
        console.log(`ID: ${propertyId}, Título: ${propertyTitle}`);
        console.log(`📊 Arquivos selecionados: ${window.selectedMediaFiles.length}`);
        
        if (window.selectedMediaFiles.length === 0) {
            console.log('ℹ️ Nenhuma mídia nova para processar.');
            console.groupEnd();
            return ''; // Retorna string vazia para o campo 'images'
        }
        
        // 2. FAZER UPLOAD REAL PARA O SUPABASE
        const filesToUpload = window.selectedMediaFiles.map(item => item.file);
        console.log(`📤 Fazendo upload de ${filesToUpload.length} arquivo(s)...`);
        
        const uploadedUrls = await window.uploadMediaToSupabase(filesToUpload, propertyId);
        
        console.log(`✅ Upload concluído: ${uploadedUrls.length} URL(s) gerada(s)`);
        
        // 3. COMBINAR COM IMAGENS EXISTENTES (se houver)
        let allImageUrls = [...uploadedUrls];
        
        // Adicionar imagens existentes (que não foram marcadas para exclusão)
        if (window.existingMediaFiles && window.existingMediaFiles.length > 0) {
            const existingUrls = window.existingMediaFiles
                .filter(item => !item.markedForDeletion)
                .map(item => item.url)
                .filter(url => url && url.trim() !== '');
            
            allImageUrls = [...existingUrls, ...allImageUrls];
            console.log(`🔄 Combinado com ${existingUrls.length} imagem(ns) existente(s)`);
        }
        
        // 4. CRIAR STRING PARA SALVAR NO BANCO (formato: url1,url2,url3)
        const imagesString = allImageUrls.join(',');
        console.log(`📝 String final para banco: ${imagesString.substring(0, 100)}...`);
        console.groupEnd();
        
        return imagesString;
    };
    
    console.log('✅ Integração configurada. Função processAndSaveMedia() disponível.');
};

// ========== CONEXÃO COM PROPERTIES.JS ==========

// Função para ser chamada pelo properties.js quando salvar um imóvel
window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
    console.log(`🎯 getMediaUrlsForProperty chamado para ID ${propertyId}`);
    
    if (typeof window.processAndSaveMedia !== 'function') {
        console.error('❌ processAndSaveMedia não disponível!');
        return '';
    }
    
    return await window.processAndSaveMedia(propertyId, propertyTitle);
};

// ========== IMPLEMENTAÇÃO REAL DO UPLOAD ==========

// ATUALIZAR a função uploadMediaToSupabase no media-core.js para fazer upload REAL
// Vamos adicionar esta implementação diretamente aqui por enquanto

window.uploadMediaToSupabase = async function(files, propertyId) {
    console.group('🚀 UPLOAD REAL PARA SUPABASE');
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.error('❌ Credenciais do Supabase não configuradas!');
        return [];
    }
    
    const uploadedUrls = [];
    const config = window.MEDIA_CONFIG || { supabaseBucket: 'properties' };
    
    console.log(`📦 Configuração: Bucket=${config.supabaseBucket}, Sistema=${window.currentMediaSystem}`);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Enviando ${i+1}/${files.length}: ${file.name}`);
        
        try {
            // Gerar nome único para o arquivo
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 10);
            const fileExt = file.name.split('.').pop();
            const fileName = `img_${propertyId}_${timestamp}_${random}.${fileExt}`;
            const filePath = `${config.supabaseBucket}/${fileName}`;
            
            // URL de upload
            const uploadUrl = `${window.SUPABASE_URL}/storage/v1/object/${filePath}`;
            
            // Fazer upload
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'apikey': window.SUPABASE_KEY,
                    'Content-Type': file.type
                },
                body: file
            });
            
            if (response.ok) {
                // URL pública para acesso
                const publicUrl = `${window.SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                uploadedUrls.push(publicUrl);
                console.log(`✅ Upload bem-sucedido: ${publicUrl}`);
            } else {
                console.error(`❌ Falha no upload: ${response.status}`);
            }
        } catch (error) {
            console.error(`💥 Erro: ${error.message}`);
        }
    }
    
    console.log(`🎉 Upload concluído: ${uploadedUrls.length}/${files.length} sucesso(s)`);
    console.groupEnd();
    return uploadedUrls;
};

// ========== INICIALIZAÇÃO ==========

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.setupMediaIntegration();
            console.log('🔗 Módulo de mídia integrado e pronto para uso.');
        }, 1000);
    });
} else {
    setTimeout(() => {
        window.setupMediaIntegration();
        console.log('🔗 Módulo de mídia integrado e pronto para uso (DOM já carregado).');
    }, 1000);
}

console.log('✅ media-integration.js carregado. Aguardando inicialização...');
