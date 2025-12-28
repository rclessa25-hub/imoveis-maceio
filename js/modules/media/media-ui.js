// js/modules/media/media-ui.js - Interface de Usuário Compartilhada
console.log('🎨 media-ui.js carregado - Sistema de UI para Mídia');

/**
 * MÓDULO DE INTERFACE DO USUÁRIO
 * Responsabilidade: Drag & drop, preview visual, exclusão de itens da lista.
 * Dependências: Nenhuma diretamente. Aguarda integração com media-core.js.
 */

// ========== VARIÁVEIS DO MÓDULO UI ==========
let mediaUploadArea = null;
let mediaFileInput = null;
let mediaPreviewContainer = null;

// ========== INICIALIZAÇÃO DA UI ==========
window.initMediaUI = function() {
    console.log('🔧 Inicializando UI do módulo de mídia...');
    
    // 1. Localizar elementos no DOM (usando IDs do sistema atual)
    mediaUploadArea = document.getElementById('uploadArea');
    mediaFileInput = document.getElementById('fileInput');
    mediaPreviewContainer = document.getElementById('uploadPreview');
    
    if (!mediaUploadArea || !mediaFileInput) {
        console.warn('⚠️  Elementos de upload não encontrados. UI não inicializada.');
        return false;
    }
    
    console.log('✅ Elementos de UI encontrados:', {
        uploadArea: !!mediaUploadArea,
        fileInput: !!mediaFileInput,
        previewContainer: !!mediaPreviewContainer
    });
    
    // 2. Configurar Event Listeners (substitui os antigos do admin.js)
    setupEventListeners();
    
    // 3. Atualizar preview inicial (se houver arquivos previamente selecionados)
    updateMediaPreview();
    
    console.log('✅ UI de mídia completamente inicializada e pronta.');
    return true;
};

// ========== CONFIGURAÇÃO DE EVENTOS (VERSÃO CORRIGIDA) ==========
function setupEventListeners() {
    console.log('🔧 Configurando event listeners do módulo de mídia...');
    
    // 1. DESATIVAR COMPLETAMENTE OS EVENT LISTENERS ANTIGOS do admin.js
    // Para fazer isso, vamos REMOVER os elementos antigos e criar novos
    const originalUploadArea = document.getElementById('uploadArea');
    const originalFileInput = document.getElementById('fileInput');
    
    if (!originalUploadArea || !originalFileInput) {
        console.error('❌ Elementos de upload não encontrados para correção');
        return;
    }
    
    // 2. CRIAR NOVOS ELEMENTOS (clones sem event listeners)
    const newUploadArea = originalUploadArea.cloneNode(true);
    const newFileInput = originalFileInput.cloneNode(true);
    
    // Substituir os elementos antigos pelos novos
    originalUploadArea.parentNode.replaceChild(newUploadArea, originalUploadArea);
    originalFileInput.parentNode.replaceChild(newFileInput, originalFileInput);
    
    // 3. ATUALIZAR NOSSAS REFERÊNCIAS para os NOVOS elementos
    mediaUploadArea = newUploadArea;
    mediaFileInput = newFileInput;
    
    console.log('✅ Elementos de UI resetados (event listeners antigos removidos)');
    
    // 4. ADICIONAR APENAS OS NOVOS EVENT LISTENERS (do nosso módulo)
    
    // Clique na área de upload
    mediaUploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 [MÓDULO MEDIA] Área de upload clicada');
        mediaFileInput.click();
    }, { once: false });
    
    // Drag & Drop
    mediaUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        mediaUploadArea.style.borderColor = '#3498db';
        mediaUploadArea.style.background = '#e8f4fc';
    });
    
    mediaUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        mediaUploadArea.style.borderColor = '#ddd';
        mediaUploadArea.style.background = '#fafafa';
    });
    
    mediaUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mediaUploadArea.style.borderColor = '#ddd';
        mediaUploadArea.style.background = '#fafafa';
        
        if (e.dataTransfer.files.length > 0) {
            console.log('📁 [MÓDULO MEDIA] Arquivos soltos:', e.dataTransfer.files.length);
            if (window.handleNewMediaFiles) {
                window.handleNewMediaFiles(e.dataTransfer.files);
            }
        }
    });
    
    // Alteração no input de arquivo
    mediaFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            console.log('📸 [MÓDULO MEDIA] Arquivos selecionados:', e.target.files.length);
            if (window.handleNewMediaFiles) {
                window.handleNewMediaFiles(e.target.files);
            }
        }
    });
    
    console.log('✅ Event listeners do módulo de mídia configurados (sem duplicação)');
}

// ========== ATUALIZAÇÃO DO PREVIEW ==========
// Em js/modules/media/media-ui.js - MODIFICAR A FUNÇÃO updateMediaPreview

window.updateMediaPreview = function() {
    if (!mediaPreviewContainer) return;
    
    console.log('🔄 Atualizando preview de mídia...');
    
    // Limpar container
    mediaPreviewContainer.innerHTML = '';
    
    // Filtrar arquivos VISÍVEIS (não marcados para exclusão visual)
    const allFiles = [
        ...(window.existingMediaFiles || []).filter(item => !item.isVisible === false),
        ...(window.selectedMediaFiles || [])
    ];
    
    if (allFiles.length === 0) {
        // Estado vazio
        mediaPreviewContainer.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Nenhuma foto ou vídeo adicionada</p>
                <small style="font-size: 0.8rem;">Arraste ou clique para adicionar</small>
            </div>
        `;
        return;
    }
    
    // Renderizar previews
    allFiles.forEach((file, index) => {
        // ✅ ADICIONAR VERIFICAÇÃO SE ESTÁ MARCADO PARA EXCLUSÃO
        const isMarkedForDeletion = file.markedForDeletion;
        const isExisting = file.isExisting;
        
        // Se está marcado para exclusão, mostrar visual diferente
        const borderColor = isMarkedForDeletion ? '#e74c3c' : 
                          (isExisting ? '#27ae60' : '#3498db');
        const bgColor = isMarkedForDeletion ? '#ffebee' : 
                       (isExisting ? '#e8f8ef' : '#e8f4fc');
        
        const isImage = file.type?.includes('image') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const isVideo = file.type?.includes('video') || file.name?.match(/\.(mp4|mov|avi)$/i);
        
        const previewItem = document.createElement('div');
        previewItem.className = 'media-preview-item';
        previewItem.style.cssText = `
            position: relative;
            width: 100px;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            display: inline-block;
            margin: 5px;
            border: 2px solid ${borderColor};
            background: ${bgColor};
            opacity: ${isMarkedForDeletion ? '0.6' : '1'};
        `;
        
        let content = '';
        if (isImage && file.url) {
            content = `<img src="${file.url}" style="width:100%; height:100%; object-fit:cover; ${isMarkedForDeletion ? 'filter: grayscale(100%);' : ''}" alt="Preview">`;
        } else if (isVideo && file.url) {
            content = `
                <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#2c3e50; ${isMarkedForDeletion ? 'opacity: 0.6;' : ''}">
                    <i class="fas fa-video" style="font-size:2rem; color:#ecf0f1;"></i>
                </div>
            `;
        } else {
            const icon = isImage ? 'fa-image' : (isVideo ? 'fa-video' : 'fa-file');
            content = `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; ${isMarkedForDeletion ? 'opacity: 0.6;' : ''}">
                    <i class="fas ${icon}" style="font-size:1.5rem; color:#7f8c8d; margin-bottom:5px;"></i>
                    <small style="font-size:0.7rem; color:#95a5a6; text-align:center; padding:0 3px;">${file.name || 'Arquivo'}</small>
                </div>
            `;
        }
        
        // Botão de exclusão
        previewItem.innerHTML = content + `
            <button onclick="removeMediaFile(${index})" 
                    style="position:absolute; top:-8px; right:-8px; background:${isMarkedForDeletion ? '#c0392b' : '#e74c3c'}; color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-size:14px;">
                ${isMarkedForDeletion ? '↺' : '×'}
            </button>
            ${isExisting ? `
                <div style="position:absolute; bottom:2px; left:2px; background:${isMarkedForDeletion ? '#e74c3c' : '#27ae60'}; color:white; font-size:0.6rem; padding:1px 4px; border-radius:3px;">
                    ${isMarkedForDeletion ? 'EXCLUIR' : 'Existente'}
                </div>
            ` : ''}
        `;
        
        mediaPreviewContainer.appendChild(previewItem);
    });
    
    console.log(`✅ Preview atualizado: ${allFiles.length} item(ns) visível(is).`);
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
// Aguarda o DOM carregar para inicializar a UI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.initMediaUI();
            console.log('🎨 Módulo de UI de mídia integrado ao DOM.');
        }, 500);
    });
} else {
    setTimeout(() => {
        window.initMediaUI();
        console.log('🎨 Módulo de UI de mídia integrado ao DOM (já carregado).');
    }, 500);
}
console.log('✅ media-ui.js carregado. UI pronta para inicialização.');
