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
    
    // Em js/modules/media/media-integration.js - MODIFICAR A FUNÇÃO processAndSaveMedia
    
    window.processAndSaveMedia = async function(propertyId, propertyTitle) {
        console.group('🖼️ PROCESSANDO MÍDIA PARA IMÓVEL');
        console.log(`ID: ${propertyId}, Título: ${propertyTitle}`);
        
        // 1. IDENTIFICAR ARQUIVOS PARA EXCLUSÃO
        const filesToDelete = [];
        
        if (window.existingMediaFiles && window.existingMediaFiles.length > 0) {
            filesToDelete.push(...window.existingMediaFiles
                .filter(item => item.markedForDeletion && item.url)
                .map(item => item.url));
            
            console.log(`🗑️ ${filesToDelete.length} arquivo(s) marcado(s) para exclusão`);
        }
        
        // 2. EXCLUIR DO SUPABASE STORAGE (se houver)
        if (filesToDelete.length > 0) {
            console.log('🚮 Excluindo arquivos do Supabase Storage...');
            
            for (const fileUrl of filesToDelete) {
                try {
                    const deleted = await window.deleteMediaFromSupabaseStorage(fileUrl);
                    if (deleted) {
                        console.log(`✅ Excluído do storage: ${fileUrl.substring(0, 80)}...`);
                    } else {
                        console.log(`⚠️ Não foi possível excluir: ${fileUrl.substring(0, 80)}...`);
                    }
                } catch (error) {
                    console.error(`❌ Erro ao excluir ${fileUrl}:`, error);
                }
            }
        }
        
        // 3. FILTRAR APENAS OS ARQUIVOS EXISTENTES NÃO MARCADOS PARA EXCLUSÃO
        let keptExistingUrls = [];
        
        if (window.existingMediaFiles && window.existingMediaFiles.length > 0) {
            keptExistingUrls = window.existingMediaFiles
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url)
                .filter(url => url && url.trim() !== '');
            
            console.log(`💾 ${keptExistingUrls.length} arquivo(s) existente(s) mantido(s)`);
        }
        
        // 4. PROCESSAR NOVOS ARQUIVOS (se houver)
        let newUrls = [];
        
        if (window.selectedMediaFiles && window.selectedMediaFiles.length > 0) {
            console.log(`📤 Fazendo upload de ${window.selectedMediaFiles.length} novo(s) arquivo(s)...`);
            
            const filesToUpload = window.selectedMediaFiles
                .filter(item => item.file)
                .map(item => item.file);
            
            if (filesToUpload.length > 0) {
                newUrls = await window.uploadMediaToSupabase(filesToUpload, propertyId);
                console.log(`✅ ${newUrls.length} novo(s) arquivo(s) enviado(s)`);
            }
        }
        
        // 5. COMBINAR TODAS AS URLs
        const allImageUrls = [...keptExistingUrls, ...newUrls];
        const imagesString = allImageUrls.length > 0 ? allImageUrls.join(',') : '';
        
        console.log(`📊 Resultado final: ${allImageUrls.length} URL(s) no total`);
        console.log(`📝 String para banco: ${imagesString.substring(0, 100)}${imagesString.length > 100 ? '...' : ''}`);
        
        // 6. LIMPAR ARQUIVOS EXCLUÍDOS DO ARRAY (após processamento)
        if (window.existingMediaFiles) {
            const before = window.existingMediaFiles.length;
            window.existingMediaFiles = window.existingMediaFiles.filter(item => !item.markedForDeletion);
            const after = window.existingMediaFiles.length;
            console.log(`🧹 Arrays limpos: ${before} → ${after} itens`);
        }
        
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
// ========== IMPLEMENTAÇÃO REAL DO UPLOAD ==========
window.uploadMediaToSupabase = async function(files, propertyId) {
    console.group('🚀 UPLOAD REAL PARA SUPABASE');
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.error('❌ Credenciais do Supabase não configuradas!');
        alert('Erro: Credenciais do Supabase não configuradas');
        return [];
    }
    
    const uploadedUrls = [];
    const config = window.MEDIA_CONFIG || { supabaseBucket: 'properties' };
    
    console.log(`📦 Configuração: Bucket=${config.supabaseBucket}, Sistema=${window.currentMediaSystem}`);
    window.MediaLogger.upload.start(files.length);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Enviando ${i+1}/${files.length}: ${file.name}`);
        window.MediaLogger.upload.file(i+1, files.length, file.name, window.mediaFormatFileSize(file.size));
        
        try {
            // ⚡ Gerar nome único otimizado
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 10);
            const fileExt = file.name.split('.').pop().toLowerCase();
            const safeName = file.name
                .replace(/[^a-zA-Z0-9.-]/g, '_')
                .substring(0, 50);
            const fileName = `${config.supabaseBucket}_${propertyId}_${timestamp}_${random}_${safeName}`;
            const filePath = `${config.supabaseBucket}/${fileName}`;
            
            // URL de upload
            const uploadUrl = `${window.SUPABASE_URL}/storage/v1/object/${filePath}`;
            
            console.log(`🔗 Upload para: ${uploadUrl.substring(0, 80)}...`);
            
            // ⚡ Fazer upload usando FormData (compatibilidade melhor)
            const formData = new FormData();
            formData.append('file', file);
            
            // Usar fetch com FormData
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'apikey': window.SUPABASE_KEY
                    // ⚡ NÃO definir Content-Type - FormData define automaticamente
                },
                body: file // ⚡ Enviar o arquivo diretamente
            });
            
            if (response.ok) {
                // URL pública para acesso
                const publicUrl = `${window.SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                uploadedUrls.push(publicUrl);
                
                console.log(`✅ Upload bem-sucedido: ${publicUrl}`);
                window.MediaLogger.upload.success(file.name, publicUrl);
                
                // ⚡ Atualizar preview com URL real
                const fileIndex = window.selectedMediaFiles.findIndex(f => 
                    f.file && f.file.name === file.name
                );
                if (fileIndex !== -1 && window.selectedMediaFiles[fileIndex]) {
                    window.selectedMediaFiles[fileIndex].url = publicUrl;
                    window.selectedMediaFiles[fileIndex].uploaded = true;
                    
                    // ⚡ Atualizar preview visualmente
                    setTimeout(() => {
                        if (typeof window.updateMediaPreview === 'function') {
                            window.updateMediaPreview();
                        }
                    }, 100);
                }
            } else {
                const errorText = await response.text();
                console.error(`❌ Falha no upload (${response.status}):`, errorText);
                window.MediaLogger.upload.error(file.name, new Error(`HTTP ${response.status}: ${errorText}`));
                
                // ⚡ Fallback: Usar URL temporária
                const tempUrl = URL.createObjectURL(file);
                uploadedUrls.push(tempUrl);
                console.log(`⚠️ Usando URL temporária para: ${file.name}`);
            }
        } catch (error) {
            console.error(`💥 Erro no upload de ${file.name}:`, error);
            window.MediaLogger.upload.error(file.name, error);
            
            // ⚡ Fallback: URL temporária
            const tempUrl = URL.createObjectURL(file);
            uploadedUrls.push(tempUrl);
        }
    }
    
    console.log(`🎉 Upload concluído: ${uploadedUrls.length}/${files.length} sucesso(s)`);
    window.MediaLogger.info('UPLOAD', `Concluído: ${uploadedUrls.length}/${files.length} arquivos`);
    console.groupEnd();
    
    return uploadedUrls;
};

// ========== FUNÇÃO DE TESTE SIMPLIFICADA ==========
window.testMediaUpload = async function() {
    console.group('🧪 TESTE DE UPLOAD DE MÍDIA');
    
    // 1. Verificar se há arquivos selecionados
    if (!window.selectedMediaFiles || window.selectedMediaFiles.length === 0) {
        alert('⚠️ Primeiro selecione fotos/vídeos no formulário admin!');
        console.log('❌ Nenhum arquivo selecionado para teste');
        console.groupEnd();
        return false;
    }
    
    // 2. Usar ID temporário para teste
    const testId = 'test_' + Date.now();
    const filesToUpload = window.selectedMediaFiles
        .filter(item => item.file)
        .map(item => item.file);
    
    if (filesToUpload.length === 0) {
        alert('⚠️ Nenhum arquivo válido para upload!');
        console.log('❌ Nenhum arquivo File object encontrado');
        console.groupEnd();
        return false;
    }
    
    console.log(`🧪 Testando upload de ${filesToUpload.length} arquivo(s)...`);
    
    try {
        // 3. Chamar função de upload
        const uploadedUrls = await window.uploadMediaToSupabase(filesToUpload, testId);
        
        // 4. Resultado
        if (uploadedUrls.length > 0) {
            console.log(`✅ ${uploadedUrls.length} URL(s) gerada(s):`, uploadedUrls);
            
            // Mostrar URLs no console
            uploadedUrls.forEach((url, index) => {
                console.log(`${index + 1}. ${url}`);
            });
            
            // Atualizar preview com URLs reais
            window.selectedMediaFiles.forEach((item, index) => {
                if (item.file && uploadedUrls[index]) {
                    item.url = uploadedUrls[index];
                    item.uploaded = true;
                }
            });
            
            if (typeof window.updateMediaPreview === 'function') {
                window.updateMediaPreview();
            }
            
            alert(`✅ UPLOAD TESTADO COM SUCESSO!\n\n${uploadedUrls.length} arquivo(s) processado(s).\n\nVerifique o console para as URLs.`);
            return true;
        } else {
            console.error('❌ Nenhuma URL gerada');
            alert('❌ Upload falhou - nenhuma URL gerada');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro no teste de upload:', error);
        alert(`❌ ERRO: ${error.message}\n\nVerifique o console para detalhes.`);
        return false;
    } finally {
        console.groupEnd();
    }
};

// ========== deleteMediaFromSupabaseStorage ==========
// Em js/modules/media/media-integration.js - ADICIONAR APÓS A FUNÇÃO uploadMediaToSupabase
window.deleteMediaFromSupabaseStorage = async function(fileUrl) {
    console.log(`🗑️ Tentando excluir do storage: ${fileUrl.substring(0, 80)}...`);
    
    try {
        // Extrair nome do arquivo da URL
        const fileName = fileUrl.split('/').pop();
        if (!fileName) {
            console.error('❌ Não foi possível extrair nome do arquivo da URL');
            return false;
        }
        
        // Determinar o bucket baseado na URL
        let bucket = 'properties';
        if (fileUrl.includes('/rentals/')) {
            bucket = 'rentals';
        } else if (fileUrl.includes('/videos/')) {
            bucket = 'videos';
        }
        
        // URL de exclusão
        const deleteUrl = `${window.SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`;
        
        console.log(`🔗 URL de exclusão: ${deleteUrl}`);
        
        // Fazer requisição DELETE
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY
            }
        });
        
        if (response.ok) {
            console.log(`✅ Arquivo excluído com sucesso: ${fileName}`);
            return true;
        } else if (response.status === 404) {
            console.log(`ℹ️ Arquivo não encontrado no storage (já excluído?): ${fileName}`);
            return true; // Considera sucesso se não existe
        } else {
            const errorText = await response.text();
            console.error(`❌ Erro ao excluir (${response.status}): ${errorText}`);
            return false;
        }
        
    } catch (error) {
        console.error(`💥 Erro na exclusão: ${error.message}`);
        return false;
    }
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
