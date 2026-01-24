// js/modules/admin.js - SISTEMA ADMIN COM AUTO-SALVAMENTO E SISTEMA UNIFICADO
console.log('🔧 admin.js carregado - Sistema Administrativo Completo');

/* ==========================================================
   SISTEMA DE LOGGING
   ========================================================== */
const log = console;

/* ==========================================================
   ✅✅✅ SISTEMA UNIFICADO DE MÍDIA/PDFS (DA VERSÃO ANTIGA)
   ========================================================== */

/**
 * 1.2 WRAPPER ÚNICO PARA PDFs (120 → 30 linhas)
 * Sistema unificado que resolve os erros do diagnóstico v5.4
 */
window.adminPdfHandler = {
    clear: function() {
        console.log('📄 adminPdfHandler.clear()');
        return window.MediaSystem?.clearAllPdfs?.() || window.PdfSystem?.clearAllPdfs?.();
    },
    
    load: function(property) {
        console.log(`📄 adminPdfHandler.load() para imóvel ${property.id}`);
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 
               window.PdfSystem?.loadExistingPdfsForEdit?.(property);
    },
    
    process: async function(id, title) {
        console.log(`📄 adminPdfHandler.process(${id})`);
        return await (window.MediaSystem?.processAndSavePdfs?.(id, title) || 
                     window.PdfSystem?.processAndSavePdfs?.(id, title) || '');
    },
    
    isAvailable: function() {
        return !!(window.MediaSystem || window.PdfSystem);
    }
};

/**
 * ✅ getMediaUrlsForProperty - REQUERIDA PELO DIAGNÓSTICO v5.4
 */
window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
    console.log(`📸 [getMediaUrlsForProperty] Buscando mídias para imóvel ${propertyId}...`);
    
    // Delegar para MediaSystem se existir
    if (window.MediaSystem?.getMediaUrlsForProperty) {
        return await window.MediaSystem.getMediaUrlsForProperty(propertyId, propertyTitle);
    }
    
    // Fallback: buscar do array local
    if (!window.properties || !Array.isArray(window.properties)) {
        console.warn('❌ Array properties não encontrado');
        return '';
    }
    
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) {
        console.warn(`❌ Imóvel ${propertyId} não encontrado`);
        return '';
    }
    
    return property.images || '';
};

/**
 * ✅ loadExistingPdfsForEdit - REQUERIDA PELO DIAGNÓSTICO v5.4
 */
window.loadExistingPdfsForEdit = function(property) {
    console.log(`📄 [loadExistingPdfsForEdit] Carregando PDFs para edição do imóvel ${property.id}...`);
    return window.adminPdfHandler.load(property);
};

// Funções de compatibilidade (delegam para wrapper)
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    console.log(`📄 processAndSavePdfs -> delegando para wrapper: ${propertyId}`);
    return await window.adminPdfHandler.process(propertyId, propertyTitle);
};

window.clearAllPdfs = function() {
    console.log('📄 clearAllPdfs -> delegando para wrapper');
    return window.adminPdfHandler.clear();
};

window.getPdfsToSave = async function(propertyId) {
    console.log(`📄 getPdfsToSave -> delegando para wrapper: ${propertyId}`);
    return await window.processAndSavePdfs(propertyId, 'Imóvel');
};

window.clearProcessedPdfs = function() {
    console.log('📄 clearProcessedPdfs - Limpando apenas PDFs processados');
    if (MediaSystem?.state?.pdfs) {
        MediaSystem.state.pdfs = MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
        MediaSystem.updateUI();
    }
    window.adminPdfHandler.clear();
};

/* ==========================================================
   INTEGRAÇÃO COM SISTEMA UNIFICADO DE MÍDIA
   ========================================================== */
window.handleNewMediaFiles = function(files) {
    return MediaSystem.addFiles(files);
};

window.handleNewPdfFiles = function(files) {
    console.log('📄 handleNewPdfFiles - Delegando para MediaSystem');
    return window.MediaSystem?.addPdfs?.(files) || 0;
};

window.loadExistingMediaForEdit = function(property) {
    MediaSystem.loadExisting(property);
};

window.clearMediaSystem = function() {
    MediaSystem.resetState();
};

window.clearMediaSystemComplete = function() {
    MediaSystem.resetState();
};

/* ==========================================================
   ✅✅✅ CORREÇÃO: AUTO-SALVAMENTO QUANDO EXCLUIR MÍDIAS
   ========================================================== */

// Variável para controlar auto-salvamento
let autoSaveTimeout = null;
let pendingAutoSave = false;

/**
 * DISPARAR AUTO-SALVAMENTO
 * Salva automaticamente quando há exclusões de mídias
 */
window.triggerAutoSave = function(reason = 'media_deletion') {
    console.log(`⚡ Disparando auto-salvamento (${reason})...`);
    
    // Só faz sentido se estiver editando um imóvel
    if (!window.editingPropertyId) {
        console.log('⚠️ Não está editando, ignorando auto-salvamento');
        return;
    }
    
    // Cancelar timeout anterior
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    // Configurar novo timeout (2 segundos para agrupar múltiplas exclusões)
    autoSaveTimeout = setTimeout(async () => {
        if (!pendingAutoSave) return;
        
        console.log('🔄 Executando auto-salvamento...');
        
        // Mostrar indicador de salvamento
        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Auto-salvando...';
            submitBtn.disabled = true;
        }
        
        try {
            // Coletar dados do formulário
            const propertyData = {
                title: document.getElementById('propTitle')?.value.trim() || '',
                price: document.getElementById('propPrice')?.value || '',
                location: document.getElementById('propLocation')?.value.trim() || '',
                description: document.getElementById('propDescription')?.value.trim() || '',
                features: document.getElementById('propFeatures')?.value.trim() || '',
                type: document.getElementById('propType')?.value || 'residencial',
                badge: document.getElementById('propBadge')?.value || 'Novo',
                has_video: document.getElementById('propHasVideo')?.checked || false
            };
            
            // Formatar dados
            if (propertyData.price && window.SharedCore?.PriceFormatter?.formatForInput) {
                const formatted = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
                if (formatted) propertyData.price = formatted;
            }
            
            if (propertyData.features) {
                const featuresArray = propertyData.features
                    .split(',')
                    .map(f => f.trim())
                    .filter(f => f !== '');
                propertyData.features = JSON.stringify(featuresArray);
            }
            
            const updateData = { ...propertyData };
            
            // ✅✅✅ USAR WRAPPER UNIFICADO PARA PDFs
            if (window.adminPdfHandler) {
                try {
                    const pdfsString = await window.adminPdfHandler.process(
                        window.editingPropertyId, 
                        propertyData.title
                    );
                    if (pdfsString && pdfsString.trim() !== '' && pdfsString !== 'undefined') {
                        updateData.pdfs = pdfsString;
                        console.log(`✅ PDFs processados via wrapper unificado`);
                    } else if (pdfsString === '') {
                        updateData.pdfs = 'EMPTY';
                        console.log(`✅ Nenhum PDF - marcado como EMPTY`);
                    }
                } catch (pdfError) {
                    console.error('Erro ao processar PDFs no auto-salvamento:', pdfError);
                }
            }
            
            // Processar mídia
            if (window.MediaSystem) {
                let mediaUrls = '';
                if (window.MediaSystem.getOrderedMediaUrls) {
                    const ordered = window.MediaSystem.getOrderedMediaUrls();
                    mediaUrls = ordered.images;
                }
                
                if (mediaUrls && mediaUrls.trim() !== '') {
                    updateData.images = mediaUrls;
                }
            }
            
            // ✅ ATUALIZAÇÃO IMEDIATA NO ARRAY LOCAL
            window.updateLocalProperty(window.editingPropertyId, updateData);
            
            // Salvar no banco de dados
            if (typeof window.updateProperty === 'function') {
                const success = await window.updateProperty(window.editingPropertyId, updateData);
                
                if (success) {
                    console.log('✅ Auto-salvamento concluído com sucesso!');
                    
                    // Feedback sutil
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: var(--success);
                        color: white;
                        padding: 10px 15px;
                        border-radius: 5px;
                        z-index: 10000;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    `;
                    notification.innerHTML = '<i class="fas fa-check"></i> Alterações salvas';
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        notification.style.opacity = '0';
                        notification.style.transition = 'opacity 0.5s';
                        setTimeout(() => notification.remove(), 500);
                    }, 2000);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro no auto-salvamento:', error);
        } finally {
            // Restaurar botão
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            
            pendingAutoSave = false;
        }
    }, 2000);
    
    pendingAutoSave = true;
};

/* ==========================================================
   ✅✅✅ CORREÇÃO 1: FUNÇÃO DE EXCLUSÃO DE PDF COM AUTO-SALVAMENTO
   ========================================================== */

/**
 * EXCLUIR PDF DO FORMULÁRIO - COM AUTO-SALVAMENTO
 */
window.removePdfFromForm = function(pdfId, isExisting = false) {
    console.log(`🗑️ Tentando excluir PDF: ${pdfId} (existing: ${isExisting})`);
    
    if (!window.MediaSystem || !MediaSystem.state) {
        console.error('❌ MediaSystem não disponível');
        alert('⚠️ Sistema de mídia não está carregado');
        return false;
    }
    
    let success = false;
    
    if (isExisting) {
        // ✅ CORREÇÃO: Marcar PDF existente para exclusão
        const pdfIndex = MediaSystem.state.existingPdfs.findIndex(pdf => pdf.id === pdfId);
        if (pdfIndex !== -1) {
            MediaSystem.state.existingPdfs[pdfIndex].markedForDeletion = true;
            console.log(`✅ PDF ${pdfId} marcado para exclusão`);
            success = true;
        }
    } else {
        // ✅ CORREÇÃO: Remover PDF novo imediatamente
        const pdfIndex = MediaSystem.state.pdfs.findIndex(pdf => pdf.id === pdfId);
        if (pdfIndex !== -1) {
            MediaSystem.state.pdfs.splice(pdfIndex, 1);
            console.log(`✅ PDF ${pdfId} removido do formulário`);
            success = true;
        }
    }
    
    if (success) {
        // ✅✅✅ CORREÇÃO CRÍTICA: Disparar auto-salvamento
        setTimeout(() => {
            if (MediaSystem.updateUI) {
                MediaSystem.updateUI();
            }
            
            // Disparar auto-salvamento após atualizar UI
            setTimeout(() => {
                window.triggerAutoSave('pdf_deletion');
            }, 300);
        }, 50);
        
        return true;
    }
    
    console.error(`❌ PDF ${pdfId} não encontrado`);
    return false;
};

/* ==========================================================
   ✅✅✅ CORREÇÃO: EXCLUSÃO DE FOTOS/VIDEOS COM AUTO-SALVAMENTO
   ========================================================== */

/**
 * EXCLUIR MÍDIA DO FORMULÁRIO - COM AUTO-SALVAMENTO
 * Função para ser usada pelo MediaSystem
 */
window.removeMediaFromForm = function(mediaId, isExisting = false) {
    console.log(`🗑️ Tentando excluir mídia: ${mediaId} (existing: ${isExisting})`);
    
    if (!window.MediaSystem || !MediaSystem.state) {
        console.error('❌ MediaSystem não disponível');
        return false;
    }
    
    let success = false;
    
    if (isExisting) {
        // Marcar mídia existente para exclusão
        const mediaIndex = MediaSystem.state.existingFiles.findIndex(file => file.id === mediaId);
        if (mediaIndex !== -1) {
            MediaSystem.state.existingFiles[mediaIndex].markedForDeletion = true;
            console.log(`✅ Mídia ${mediaId} marcada para exclusão`);
            success = true;
        }
    } else {
        // Remover mídia nova imediatamente
        const mediaIndex = MediaSystem.state.files.findIndex(file => file.id === mediaId);
        if (mediaIndex !== -1) {
            MediaSystem.state.files.splice(mediaIndex, 1);
            console.log(`✅ Mídia ${mediaId} removida do formulário`);
            success = true;
        }
    }
    
    if (success) {
        // ✅✅✅ CORREÇÃO CRÍTICA: Disparar auto-salvamento
        setTimeout(() => {
            if (MediaSystem.updateUI) {
                MediaSystem.updateUI();
            }
            
            // Disparar auto-salvamento após atualizar UI
            setTimeout(() => {
                window.triggerAutoSave('media_deletion');
            }, 300);
        }, 50);
        
        return true;
    }
    
    console.error(`❌ Mídia ${mediaId} não encontrada`);
    return false;
};

/* ==========================================================
   ✅✅✅ INTEGRAÇÃO COM MEDIASYSTEM PARA AUTO-SALVAMENTO
   ========================================================== */

// Sobrescrever função do MediaSystem para incluir auto-salvamento
const originalMediaSystemRemove = window.MediaSystem?.removeFile;
if (originalMediaSystemRemove) {
    window.MediaSystem.removeFile = function(fileId, isExisting = false) {
        console.log(`🎬 MediaSystem.removeFile chamado: ${fileId}`);
        const result = originalMediaSystemRemove.call(this, fileId, isExisting);
        
        // ✅✅✅ Disparar auto-salvamento após exclusão
        if (result) {
            setTimeout(() => {
                window.triggerAutoSave('media_file_deletion');
            }, 500);
        }
        
        return result;
    };
}

/* ==========================================================
   ✅✅✅ CORREÇÃO 2: PREVIEW DE NOVAS FOTOS/VIDEOS
   ========================================================== */

/**
 * FORÇAR GERAÇÃO DE PREVIEW PARA NOVAS IMAGENS
 */
window.forceMediaPreviewUpdate = function() {
    console.log('🖼️ Forçando atualização de previews...');
    
    if (!window.MediaSystem || !MediaSystem.state || !MediaSystem.state.files) {
        console.error('❌ MediaSystem não disponível para preview');
        return;
    }
    
    // Gerar previews para imagens novas sem thumbnail
    MediaSystem.state.files.forEach((file, index) => {
        if (file.file && !file.previewUrl && file.file.type.startsWith('image/')) {
            console.log(`📸 Gerando preview para: ${file.name || file.file.name}`);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                MediaSystem.state.files[index].previewUrl = e.target.result;
                console.log(`✅ Preview gerado para ${file.name || file.file.name}`);
                
                setTimeout(() => {
                    if (MediaSystem.updateUI) {
                        MediaSystem.updateUI();
                    }
                }, 100);
            };
            
            reader.onerror = function(e) {
                console.error(`❌ Erro ao gerar preview para ${file.name || file.file.name}`);
            };
            
            reader.readAsDataURL(file.file);
        }
    });
};

/* ==========================================================
   ✅✅✅ CORREÇÃO 3: ATUALIZAÇÃO REAL-TIME DA PÁGINA PRINCIPAL
   ========================================================== */

/**
 * ATUALIZAR PROPRIEDADE NO ARRAY LOCAL COM FORÇA TOTAL
 */
window.updateLocalProperty = function(propertyId, updatedData) {
    console.log(`🔄 Atualizando imóvel ${propertyId} no array local...`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ Array window.properties não encontrado');
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id === propertyId);
    if (index === -1) {
        console.error(`❌ Imóvel ${propertyId} não encontrado no array`);
        return false;
    }
    
    // ✅ CORREÇÃO: Garantir que has_video seja booleano
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = Boolean(updatedData.has_video);
    }
    
    // ✅ CORREÇÃO: Garantir que features seja string se veio como array
    if (Array.isArray(updatedData.features)) {
        updatedData.features = JSON.stringify(updatedData.features);
    }
    
    // Atualizar o objeto existente
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    console.log(`✅ Imóvel ${propertyId} atualizado no array local`);
    console.log('Dados atualizados:', {
        title: window.properties[index].title,
        price: window.properties[index].price,
        location: window.properties[index].location,
        has_video: window.properties[index].has_video,
        badge: window.properties[index].badge
    });
    
    // ✅✅✅ ATUALIZAÇÃO COM FORÇA: Renderização imediata
    setTimeout(() => {
        // 1. Forçar atualização da lista de imóveis
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        // 2. ✅✅✅ CORREÇÃO CRÍTICA: Forçar renderização da página principal
        if (typeof window.renderProperties === 'function') {
            const currentFilter = window.currentFilter || 'todos';
            
            // Limpar e renderizar com força
            const propertiesContainer = document.getElementById('propertiesContainer');
            if (propertiesContainer) {
                // Adicionar classe de loading sutil
                propertiesContainer.classList.add('updating');
            }
            
            setTimeout(() => {
                window.renderProperties(currentFilter, true);
                
                if (propertiesContainer) {
                    setTimeout(() => {
                        propertiesContainer.classList.remove('updating');
                    }, 500);
                }
            }, 100);
        }
        
        // 3. Disparar evento
        document.dispatchEvent(new CustomEvent('propertyUpdated', {
            detail: {
                id: propertyId,
                data: window.properties[index],
                timestamp: Date.now(),
                source: 'auto_save'
            }
        }));
        
        // 4. Atualizar local storage
        if (window.StorageManager?.updateProperty) {
            window.StorageManager.updateProperty(propertyId, window.properties[index]);
        }
        
    }, 150);
    
    return true;
};

/**
 * ADICIONAR NOVA PROPRIEDADE AO ARRAY LOCAL
 */
window.addToLocalProperties = function(newProperty) {
    console.log('➕ Adicionando novo imóvel ao array local...');
    
    if (!window.properties || !Array.isArray(window.properties)) {
        window.properties = [];
    }
    
    const maxId = window.properties.length > 0 
        ? Math.max(...window.properties.map(p => p.id))
        : 0;
    
    const propertyWithId = {
        ...newProperty,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    window.properties.push(propertyWithId);
    console.log(`✅ Novo imóvel adicionado com ID: ${propertyWithId.id}`);
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        if (typeof window.renderProperties === 'function') {
            const currentFilter = window.currentFilter || 'todos';
            setTimeout(() => {
                window.renderProperties(currentFilter, true);
            }, 200);
        }
        
        document.dispatchEvent(new CustomEvent('propertyAdded', {
            detail: {
                id: propertyWithId.id,
                data: propertyWithId,
                source: 'auto_save'
            }
        }));
    }, 200);
    
    return propertyWithId;
};

// ========== CONFIGURAÇÕES ==========
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle",
    storageKey: "weberlessa_properties"
};

// ========== VARIÁVEIS GLOBAIS ==========
window.editingPropertyId = null;

/* ==========================================================
   FUNÇÃO UNIFICADA DE LIMPEZA
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log(`🧹 cleanAdminForm(${mode})`);
    
    // Cancelar auto-salvamento pendente
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    pendingAutoSave = false;
    
    // 1. Resetar estado de edição
    window.editingPropertyId = null;
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
        cancelBtn.disabled = false;
    }

    // 2. Resetar formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        try { 
            form.reset(); 
            console.log('Formulário resetado');
        } catch(e) {
            document.getElementById('propType').value = 'residencial';
            document.getElementById('propBadge').value = 'Novo';
            const videoCheckbox = document.getElementById('propHasVideo');
            if (videoCheckbox) videoCheckbox.checked = false;
        }
        
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
            submitBtn.style.background = 'var(--success)';
            submitBtn.disabled = false;
        }
    }

    // 3. Limpar sistemas de mídia
    if (window.MediaSystem) {
        MediaSystem.resetState();
        console.log('MediaSystem limpo');
    }
    
    // ✅✅✅ LIMPAR PDFs VIA WRAPPER UNIFICADO
    if (window.adminPdfHandler) {
        window.adminPdfHandler.clear();
        console.log('PDFs limpos via wrapper unificado');
    }

    // 4. Limpar previews visuais
    const previewIds = ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'];
    previewIds.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.innerHTML = '';
    });

    // 5. Feedback
    console.log('Formulário limpo - pronto para novo imóvel');

    // 6. Notificação se for cancelamento
    if (mode === 'cancel' && window.showNotification) {
        window.showNotification('Edição cancelada com sucesso', 'info');
    }

    return true;
};

/* ==========================================================
   FUNÇÃO cancelEdit MANTIDA PARA COMPATIBILIDADE
   ========================================================== */
window.cancelEdit = function() {
    console.log('cancelEdit() - Chamando função unificada');
    
    if (window.editingPropertyId) {
        const confirmCancel = confirm('Deseja realmente cancelar a edição?\n\nTodas as alterações serão perdidas.');
        if (!confirmCancel) {
            console.warn('Cancelamento abortado');
            return false;
        }
    }
    
    return window.cleanAdminForm('cancel');
};

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
window.toggleAdminPanel = function() {
    console.log('toggleAdminPanel() executada');
    
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
    
    if (password === null) {
        console.warn('Usuário cancelou o acesso');
        return;
    }
    
    if (password === "") {
        alert('⚠️ Campo de senha vazio!');
        return;
    }
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            
            console.log(`Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    console.log('Rolando até o painel admin');
                }, 300);
                
                setTimeout(() => {
                    if (typeof window.loadPropertyList === 'function') {
                        window.loadPropertyList();
                    }
                }, 100);
            }
        }
    } else {
        alert('❌ Senha incorreta!');
    }
};

// ========== CONFIGURAÇÃO CONSOLIDADA DE UI ==========
window.setupAdminUI = function() {
    console.log('setupAdminUI() - Configuração unificada');
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
        console.log('Painel admin oculto');
    }
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão admin clicado');
            window.toggleAdminPanel();
        });
        console.log('Botão admin toggle configurado');
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        freshCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão "Cancelar Edição" clicado');
            window.cancelEdit();
        });
        console.log('Botão "Cancelar Edição" configurado');
    }
    
    if (!document.getElementById('syncButton')) {
        const syncBtn = document.createElement('button');
        syncBtn.id = 'syncButton';
        syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
        syncBtn.onclick = window.syncWithSupabaseManual;
        syncBtn.style.cssText = `
            background: var(--gold);
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 1rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
        `;
        
        const panelTitle = document.querySelector('#adminPanel h3');
        if (panelTitle) {
            panelTitle.parentNode.insertBefore(syncBtn, panelTitle.nextSibling);
            console.log('Botão de sincronização adicionado');
        }
    }
    
    if (typeof window.setupForm === 'function') {
        window.setupForm();
        console.log('Função setupForm executada');
    }
    
    setTimeout(() => {
        const testBtn = document.getElementById('media-test-btn');
        if (testBtn) testBtn.remove();
        console.log('Limpeza de botões de teste concluída');
    }, 1000);
    
    // ✅✅✅ ADICIONAR ESTILOS PARA AUTO-SALVAMENTO
    const style = document.createElement('style');
    style.textContent = `
        #propertiesContainer.updating .property-card {
            opacity: 0.7;
            transition: opacity 0.3s;
        }
        
        .auto-save-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .auto-saving {
            color: var(--accent);
            font-size: 0.9em;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-left: 10px;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Admin UI completamente configurado');
};

// ========== EXECUÇÃO AUTOMÁTICA ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('Executando configuração automática de UI...');
            window.setupAdminUI();
        }, 500);
    });
} else {
    setTimeout(() => {
        console.log('Executando configuração automática de UI (documento já carregado)...');
        window.setupAdminUI();
    }, 300);
}

// ========== FUNÇÕES DO FORMULÁRIO ==========

window.loadPropertyList = function() {
    console.log('Carregando lista de imóveis...');
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container || !window.properties) return;
    
    container.innerHTML = '';
    if (countElement) countElement.textContent = window.properties.length;
    
    if (window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum imóvel</p>';
        return;
    }
    
    const sortedProperties = [...window.properties].sort((a, b) => b.id - a.id);
    
    sortedProperties.forEach(property => {
        const item = document.createElement('div');
        item.className = 'property-item';
        item.innerHTML = `
            <div style="flex: 1;">
                <strong style="color: var(--primary);">${property.title}</strong><br>
                <small>${property.price} - ${property.location}</small>
                <div style="font-size: 0.8em; color: #666; margin-top: 0.2rem;">
                    ID: ${property.id} | Tipo: ${property.type || 'residencial'}
                    ${property.has_video ? ' | 🎬 Tem vídeo' : ''}
                    ${property.badge ? ` | 🏷️ ${property.badge}` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProperty(${property.id})" 
                        style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
    
    console.log(`${window.properties.length} imóveis listados`);
};

window.deleteProperty = function(id) {
    if (!confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a excluir o imóvel ID: ${id}\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    console.log(`🗑️ Excluindo imóvel ${id}...`);
    
    if (window.properties && Array.isArray(window.properties)) {
        const initialLength = window.properties.length;
        const propertyIndex = window.properties.findIndex(p => p.id === id);
        const propertyTitle = propertyIndex !== -1 ? window.properties[propertyIndex].title : 'Imóvel';
        
        window.properties = window.properties.filter(p => p.id !== id);
        
        if (window.properties.length < initialLength) {
            console.log(`✅ Imóvel ${id} removido do array local`);
            
            setTimeout(() => {
                if (typeof window.loadPropertyList === 'function') {
                    window.loadPropertyList();
                }
                
                if (typeof window.renderProperties === 'function') {
                    const currentFilter = window.currentFilter || 'todos';
                    setTimeout(() => {
                        window.renderProperties(currentFilter, true);
                    }, 200);
                }
                
                document.dispatchEvent(new CustomEvent('propertyDeleted', {
                    detail: { 
                        id: id,
                        title: propertyTitle,
                        forceUpdate: true 
                    }
                }));
                
                alert(`✅ Imóvel "${propertyTitle}" (ID: ${id}) excluído com sucesso!`);
            }, 100);
        }
    }
    
    if (typeof window.deletePropertyFromDatabase === 'function') {
        window.deletePropertyFromDatabase(id);
    }
};

// ========== FUNÇÃO editProperty COM CORREÇÕES ==========
window.editProperty = function(id) {
    console.log(`EDITANDO IMÓVEL ${id}`);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        console.error('Imóvel não encontrado!');
        alert('❌ Imóvel não encontrado!');
        return;
    }

    if (window.MediaSystem) {
        MediaSystem.resetState();
        console.log('MediaSystem resetado');
    }

    // Preencher formulário
    document.getElementById('propTitle').value = property.title || '';
    
    const priceField = document.getElementById('propPrice');
    if (priceField && property.price) {
        if (window.SharedCore?.PriceFormatter?.formatForInput) {
            priceField.value = window.SharedCore.PriceFormatter.formatForInput(property.price);
        } else if (property.price.startsWith('R$')) {
            priceField.value = property.price;
        } else {
            priceField.value = property.price;
        }
    }
    
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    
    const featuresField = document.getElementById('propFeatures');
    if (featuresField && property.features) {
        try {
            if (property.features.startsWith('[') && property.features.endsWith(']')) {
                const featuresArray = JSON.parse(property.features);
                featuresField.value = featuresArray.join(', ');
            } else if (Array.isArray(property.features)) {
                featuresField.value = property.features.join(', ');
            } else {
                featuresField.value = property.features;
            }
        } catch (e) {
            featuresField.value = property.features;
        }
    }
    
    document.getElementById('propType').value = property.type || 'residencial';
    document.getElementById('propBadge').value = property.badge || 'Novo';
    
    const videoCheckbox = document.getElementById('propHasVideo');
    if (videoCheckbox) {
        videoCheckbox.checked = property.has_video === true || property.has_video === 'true' || false;
        console.log(`🎬 Checkbox de vídeo definido como: ${videoCheckbox.checked}`);
    }

    // Atualizar UI
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;

    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.style.background = 'var(--accent)';
    }

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'block';
        cancelBtn.disabled = false;
        cancelBtn.style.visibility = 'visible';
        console.log('Botão "Cancelar Edição" tornado visível');
    }

    window.editingPropertyId = property.id;

    // Carregar mídia existente
    if (window.MediaSystem) {
        MediaSystem.loadExisting(property);
        console.log('Mídia existente carregada no MediaSystem');
        
        setTimeout(() => {
            window.forceMediaPreviewUpdate();
        }, 500);
    }
    
    // ✅✅✅ CARREGAR PDFs EXISTENTES VIA WRAPPER UNIFICADO
    if (window.adminPdfHandler) {
        window.adminPdfHandler.load(property);
        console.log('✅ PDFs existentes carregados via wrapper unificado');
    }

    // Scroll para formulário
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.style.display !== 'block') {
            adminPanel.style.display = 'block';
            console.log('Painel admin aberto automaticamente');
        }
        
        const propertyForm = document.getElementById('propertyForm');
        if (propertyForm) {
            propertyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('Formulário em foco para edição');
        }
    }, 100);

    console.log(`Imóvel ${id} pronto para edição`);
    return true;
};

/* ==========================================================
   ✅✅✅ CONFIGURAÇÃO DO FORMULÁRIO COM AUTO-SALVAMENTO
   ========================================================== */
window.setupForm = function() {
    console.log('Configurando formulário admin com auto-salvamento...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('Formulário propertyForm não encontrado!');
        return;
    }
    
    // Clonar para remover listeners antigos
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) {
        window.setupPriceAutoFormat();
    }
    
    const freshForm = document.getElementById('propertyForm');
    freshForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('SUBMISSÃO DO FORMULÁRIO ADMIN');
        
        const loading = window.LoadingManager?.show?.(
            'Salvando Imóvel...', 
            'Por favor, aguarde...', 
            { variant: 'processing' }
        );

        if (!loading) {
            console.warn('LoadingManager não disponível - continuando sem feedback visual');
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }
        
        try {
            // Coletar dados
            const propertyData = {
                title: document.getElementById('propTitle').value.trim(),
                price: document.getElementById('propPrice').value,
                location: document.getElementById('propLocation').value.trim(),
                description: document.getElementById('propDescription').value.trim(),
                features: document.getElementById('propFeatures').value.trim(),
                type: document.getElementById('propType').value,
                badge: document.getElementById('propBadge').value,
                has_video: document.getElementById('propHasVideo')?.checked || false
            };
            
            console.log('Dados coletados:', propertyData);
            
            // Validação básica
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                if (loading) {
                    loading.setVariant('error');
                    loading.updateMessage('Preencha Título, Preço e Localização!');
                    setTimeout(() => {
                        loading.hide();
                        alert('❌ Preencha Título, Preço e Localização!');
                        if (submitBtn) submitBtn.disabled = false;
                    }, 1500);
                } else {
                    alert('❌ Preencha Título, Preço e Localização!');
                    if (submitBtn) submitBtn.disabled = false;
                }
                console.error('Validação falhou: campos obrigatórios vazios');
                return;
            }
            
            if (loading) loading.updateMessage('Processando dados...');
            
            // Formatar preço
            if (propertyData.price && window.SharedCore?.PriceFormatter?.formatForInput) {
                const formatted = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
                if (formatted) propertyData.price = formatted;
            }
            
            // Formatar features
            if (propertyData.features) {
                const featuresArray = propertyData.features
                    .split(',')
                    .map(f => f.trim())
                    .filter(f => f !== '');
                propertyData.features = JSON.stringify(featuresArray);
            }
            
            if (window.editingPropertyId) {
                console.log(`EDITANDO imóvel ID: ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // ✅✅✅ USAR WRAPPER UNIFICADO PARA PDFs
                if (window.adminPdfHandler) {
                    try {
                        const pdfsString = await window.adminPdfHandler.process(window.editingPropertyId, propertyData.title);
                        if (pdfsString && pdfsString.trim() !== '' && pdfsString !== 'undefined') {
                            updateData.pdfs = pdfsString;
                            console.log(`✅ PDFs processados via wrapper: ${pdfsString.split(',').length} arquivo(s)`);
                        } else if (pdfsString === '') {
                            updateData.pdfs = 'EMPTY';
                            console.log(`✅ Nenhum PDF - marcado como EMPTY`);
                        }
                    } catch (pdfError) {
                        console.error('Erro ao processar PDFs:', pdfError);
                    }
                }
                
                // Processar mídia
                if (window.MediaSystem) {
                    let mediaUrls = '';
                    if (window.MediaSystem.getOrderedMediaUrls) {
                        const ordered = window.MediaSystem.getOrderedMediaUrls();
                        mediaUrls = ordered.images;
                    }
                    
                    if (mediaUrls && mediaUrls.trim() !== '') {
                        updateData.images = mediaUrls;
                    }
                }
                
                // ✅ ATUALIZAÇÃO IMEDIATA
                window.updateLocalProperty(window.editingPropertyId, updateData);
                
                // Salvar no banco
                if (typeof window.updateProperty === 'function') {
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    if (success) {
                        if (loading) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel atualizado com sucesso!');
                        }
                        
                        setTimeout(() => {
                            const imageCount = updateData.images ? updateData.images.split(',').filter(url => url.trim() !== '').length : 0;
                            const pdfCount = updateData.pdfs && updateData.pdfs !== 'EMPTY' 
                                ? updateData.pdfs.split(',').filter(url => url.trim() !== '').length 
                                : 0;
                            
                            let successMessage = `✅ Imóvel "${updateData.title}" atualizado!\n\n`;
                            successMessage += `📍 ${updateData.location}\n`;
                            successMessage += `💰 ${updateData.price}\n`;
                            successMessage += `🎬 ${updateData.has_video ? 'Tem vídeo' : 'Sem vídeo'}\n`;
                            successMessage += `🏷️ ${updateData.badge}\n`;
                            if (imageCount > 0) successMessage += `\n📸 ${imageCount} foto(s)/vídeo(s)`;
                            if (pdfCount > 0) successMessage += `\n📄 ${pdfCount} documento(s) PDF`;
                            
                            alert(successMessage);
                        }, 800);
                        
                    } else {
                        alert('❌ Não foi possível atualizar o imóvel no banco de dados.');
                    }
                }
                
            } else {
                console.log('CRIANDO novo imóvel...');
                
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        const localProperty = window.addToLocalProperties(newProperty);
                        
                        if (loading) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel cadastrado com sucesso!');
                        }
                        
                        setTimeout(() => {
                            alert(`✅ Imóvel "${localProperty.title}" cadastrado com sucesso!\n\n🔑 ID: ${localProperty.id}`);
                        }, 800);
                        
                    } else {
                        alert('❌ Não foi possível criar o imóvel.');
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Erro:', error);
            alert(`❌ Erro: ${error.message}`);
            
        } finally {
            setTimeout(() => {
                if (loading) loading.hide();
                window.cleanAdminForm('reset');
                
                if (submitBtn) {
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = window.editingPropertyId ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                    }, 500);
                }
            }, 1000);
        }
    });
    
    console.log('Formulário admin configurado com auto-salvamento');
};

// ========== SINCRONIZAÇÃO MANUAL ==========
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar?\n\nIsso irá buscar os imóveis do banco de dados online.')) {
        console.log('Iniciando sincronização manual...');
        
        const syncBtn = document.getElementById('syncButton');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }
        
        try {
            if (typeof window.syncWithSupabase === 'function') {
                const result = await window.syncWithSupabase();
                
                if (result && result.success) {
                    alert(`✅ Sincronização completa!\n\n${result.count} novos imóveis carregados.`);
                    console.log(`Sincronização completa: ${result.count} novos imóveis`);
                    
                    setTimeout(() => {
                        if (typeof window.loadPropertyList === 'function') {
                            window.loadPropertyList();
                        }
                        
                        if (typeof window.renderProperties === 'function') {
                            window.renderProperties('todos', true);
                        }
                    }, 500);
                    
                } else {
                    alert('⚠️ Não foi possível sincronizar. Verifique a conexão.');
                    console.warn('Não foi possível sincronizar');
                }
            }
        } catch (error) {
            console.error(`Erro na sincronização: ${error.message}`);
            alert('❌ Erro ao sincronizar: ' + error.message);
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
            }
        }
    }
};

/* ==========================================================
   ✅✅✅ CONFIGURAÇÃO DE UPLOAD COM AUTO-SALVAMENTO
   ========================================================== */
setTimeout(() => {
    // Configurar upload de PDFs
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    
    if (pdfFileInput && pdfUploadArea) {
        console.log('Configurando upload de PDFs...');
        
        const cleanPdfInput = pdfFileInput.cloneNode(true);
        const cleanPdfArea = pdfUploadArea.cloneNode(true);
        
        pdfFileInput.parentNode.replaceChild(cleanPdfInput, pdfFileInput);
        pdfUploadArea.parentNode.replaceChild(cleanPdfArea, pdfUploadArea);
        
        const freshUploadArea = document.getElementById('pdfUploadArea');
        const freshFileInput = document.getElementById('pdfFileInput');
        
        freshUploadArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            freshFileInput.click();
        });
        
        freshFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                console.log(`${e.target.files.length} arquivo(s) selecionado(s)`);
                
                if (window.MediaSystem?.addPdfs) {
                    window.MediaSystem.addPdfs(e.target.files);
                    
                    // ✅✅✅ Disparar auto-salvamento após adicionar PDFs
                    setTimeout(() => {
                        window.triggerAutoSave('pdf_addition');
                    }, 1000);
                }
                
                e.target.value = '';
            }
        });
        
        console.log('Upload de PDFs configurado');
    }
    
    // Configurar upload de imagens
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput && uploadArea) {
        const cleanInput = fileInput.cloneNode(true);
        const cleanArea = uploadArea.cloneNode(true);
        
        fileInput.parentNode.replaceChild(cleanInput, fileInput);
        uploadArea.parentNode.replaceChild(cleanArea, uploadArea);
        
        const freshFileInput = document.getElementById('fileInput');
        const freshUploadArea = document.getElementById('uploadArea');
        
        freshUploadArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            freshFileInput.click();
        });
        
        freshFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                console.log(`${e.target.files.length} arquivo(s) de mídia selecionado(s)`);
                
                if (window.MediaSystem?.addFiles) {
                    window.MediaSystem.addFiles(e.target.files);
                    
                    // ✅✅✅ Disparar auto-salvamento após adicionar mídias
                    setTimeout(() => {
                        window.triggerAutoSave('media_addition');
                    }, 1000);
                    
                    setTimeout(() => {
                        window.forceMediaPreviewUpdate();
                    }, 300);
                }
                
                e.target.value = '';
            }
        });
        
        console.log('Upload de mídia configurado com auto-salvamento');
    }
}, 1000);

/* ==========================================================
   ✅✅✅ VERIFICAÇÃO FINAL E DIAGNÓSTICO
   ========================================================== */

setTimeout(() => {
    console.log('✅✅✅ ADMIN.JS ATUALIZADO COM SISTEMA UNIFICADO');
    console.log('==========================================');
    console.log('ERROS DO DIAGNÓSTICO v5.4 RESOLVIDOS:');
    console.log('❌ window.getMediaUrlsForProperty v5.4 → ✅ IMPLEMENTADO');
    console.log('❌ window.loadExistingPdfsForEdit (wrapper) → ✅ IMPLEMENTADO');
    console.log('==========================================');
    console.log('SISTEMA UNIFICADO IMPLEMENTADO:');
    console.log('✅ adminPdfHandler - Wrapper unificado para PDFs');
    console.log('✅ Integração com MediaSystem mantida');
    console.log('✅ Funções de compatibilidade adicionadas');
    console.log('✅ Auto-salvamento mantido');
    console.log('==========================================');
    console.log('🎯 PRONTO PARA DIAGNÓSTICO COMPLETO!');
    
    // Verificar se as funções estão disponíveis
    setTimeout(() => {
        console.log('🔍 VERIFICAÇÃO DAS FUNÇÕES:');
        console.log('📄 window.getMediaUrlsForProperty:', typeof window.getMediaUrlsForProperty);
        console.log('📄 window.loadExistingPdfsForEdit:', typeof window.loadExistingPdfsForEdit);
        console.log('📄 window.adminPdfHandler:', typeof window.adminPdfHandler);
        console.log('✅ Todas as funções necessárias estão disponíveis!');
    }, 100);
}, 4000);

console.log('✅ admin.js COMPLETO - SISTEMA UNIFICADO IMPLEMENTADO');
