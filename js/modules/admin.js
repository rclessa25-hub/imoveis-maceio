// js/modules/admin.js - SISTEMA ADMIN COM SUPABASE FIX
console.log('🔧 admin.js carregado - Sistema Administrativo com Supabase Fix');

/* ==========================================================
   CONFIGURAÇÃO E CONSTANTES
   ========================================================== */
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

const DEBUG = true; // Ativar para ver logs detalhados
const log = DEBUG ? console.log : () => {};

// Estado global
window.editingPropertyId = null;
let autoSaveTimeout = null;
let pendingAutoSave = false;

/* ==========================================================
   ✅✅✅ SISTEMA DE PDF COM SUPABASE FIX
   ========================================================== */

/**
 * ADMIN PDF HANDLER - COM GRAVAÇÃO NO SUPABASE
 */
window.adminPdfHandler = {
    clear: function() {
        log('📄 adminPdfHandler.clear()');
        return window.MediaSystem?.clearAllPdfs?.() || window.PdfSystem?.clearAllPdfs?.();
    },
    
    load: function(property) {
        log(`📄 adminPdfHandler.load() para imóvel ${property.id}`);
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 
               window.PdfSystem?.loadExistingPdfsForEdit?.(property);
    },
    
    /**
     * ✅✅✅ FUNÇÃO CORRIGIDA: processAndSavePdfs
     * Agora garante upload para o Supabase antes de retornar URLs
     */
    process: async function(propertyId, propertyTitle) {
        log(`📄 [SUPABASE] adminPdfHandler.process(${propertyId}) iniciado`);
        
        try {
            let finalPdfUrls = '';
            let existingPdfs = [];
            
            // 1. PRIMEIRO: Obter PDFs existentes do imóvel atual
            if (window.properties) {
                const property = window.properties.find(p => p.id === propertyId);
                if (property && property.pdfs && property.pdfs !== 'EMPTY') {
                    existingPdfs = property.pdfs.split(',').filter(url => url.trim() !== '');
                    log(`📄 PDFs existentes no imóvel: ${existingPdfs.length}`);
                }
            }
            
            // 2. SEGUNDO: Processar via MediaSystem (que faz upload para Supabase)
            if (window.MediaSystem?.processAndSavePdfs) {
                log(`📄 [SUPABASE] Chamando MediaSystem.processAndSavePdfs...`);
                
                const mediaSystemResult = await window.MediaSystem.processAndSavePdfs(propertyId, propertyTitle);
                log(`📄 [SUPABASE] MediaSystem retornou:`, mediaSystemResult);
                
                if (mediaSystemResult && mediaSystemResult.trim() !== '' && mediaSystemResult !== 'EMPTY') {
                    finalPdfUrls = mediaSystemResult;
                    log(`📄 [SUPABASE] PDFs do MediaSystem: ${finalPdfUrls.split(',').length} arquivo(s)`);
                }
            }
            
            // 3. TERCEIRO: Se MediaSystem falhar, tentar upload direto para Supabase
            if (!finalPdfUrls || finalPdfUrls.trim() === '') {
                log(`📄 [SUPABASE] MediaSystem não retornou URLs, tentando upload direto...`);
                
                // Verificar se há PDFs no MediaSystem state
                if (window.MediaSystem?.state?.pdfs) {
                    const newPdfs = window.MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded && pdf.file);
                    const existingButNotDeleted = window.MediaSystem.state.existingPdfs?.filter(pdf => !pdf.markedForDeletion) || [];
                    
                    log(`📄 PDFs novos para upload: ${newPdfs.length}`);
                    log(`📄 PDFs existentes mantidos: ${existingButNotDeleted.length}`);
                    
                    if (newPdfs.length > 0) {
                        // Fazer upload dos novos PDFs
                        const uploadedUrls = await this._uploadPdfsToSupabase(newPdfs, propertyId, propertyTitle);
                        
                        // Combinar com PDFs existentes mantidos
                        const allUrls = [
                            ...uploadedUrls,
                            ...existingButNotDeleted.map(pdf => pdf.url).filter(url => url),
                            ...existingPdfs // Manter PDFs já no banco
                        ];
                        
                        // Remover duplicados
                        finalPdfUrls = [...new Set(allUrls.filter(url => url && url.trim() !== ''))].join(',');
                        log(`📄 [SUPABASE] URLs após upload direto: ${finalPdfUrls}`);
                    }
                }
            }
            
            // 4. QUARTO: Se ainda não tiver URLs, usar PDFs existentes
            if ((!finalPdfUrls || finalPdfUrls.trim() === '') && existingPdfs.length > 0) {
                finalPdfUrls = existingPdfs.join(',');
                log(`📄 [SUPABASE] Usando PDFs existentes do banco: ${finalPdfUrls}`);
            }
            
            // 5. QUINTO: Se tudo falhar, retornar EMPTY
            if (!finalPdfUrls || finalPdfUrls.trim() === '') {
                log(`📄 [SUPABASE] Nenhum PDF encontrado, retornando EMPTY`);
                return 'EMPTY';
            }
            
            log(`📄 [SUPABASE] FINAL - URLs para salvar: ${finalPdfUrls}`);
            return finalPdfUrls;
            
        } catch (error) {
            console.error(`❌ [SUPABASE] Erro em processAndSavePdfs:`, error);
            return 'EMPTY';
        }
    },
    
    /**
     * ✅✅✅ FUNÇÃO NOVA: Upload direto para Supabase
     */
    _uploadPdfsToSupabase: async function(pdfs, propertyId, propertyTitle) {
        log(`📄 [SUPABASE] Iniciando upload de ${pdfs.length} PDF(s) para Supabase...`);
        
        const uploadedUrls = [];
        
        for (const pdf of pdfs) {
            try {
                if (!pdf.file) {
                    log(`⚠️ PDF sem arquivo: ${pdf.name}`);
                    continue;
                }
                
                log(`📄 Uploading: ${pdf.name || pdf.file.name}`);
                
                // 1. Criar nome único para o arquivo
                const timestamp = Date.now();
                const safeTitle = propertyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const fileName = `property_${propertyId}_${safeTitle}_${timestamp}_${pdf.name || pdf.file.name}`;
                
                // 2. Upload para Supabase Storage
                if (window.supabase && window.supabase.storage) {
                    const { data, error } = await window.supabase.storage
                        .from('properties')
                        .upload(`pdfs/${fileName}`, pdf.file, {
                            cacheControl: '3600',
                            upsert: true
                        });
                    
                    if (error) {
                        console.error(`❌ Erro no upload do PDF:`, error);
                        continue;
                    }
                    
                    // 3. Obter URL pública
                    const { data: urlData } = window.supabase.storage
                        .from('properties')
                        .getPublicUrl(`pdfs/${fileName}`);
                    
                    if (urlData?.publicUrl) {
                        uploadedUrls.push(urlData.publicUrl);
                        log(`✅ PDF enviado para Supabase: ${urlData.publicUrl}`);
                        
                        // Marcar como uploaded no state
                        pdf.uploaded = true;
                        pdf.url = urlData.publicUrl;
                    }
                } else {
                    log(`⚠️ Supabase não disponível para upload`);
                }
                
            } catch (uploadError) {
                console.error(`❌ Erro no upload do PDF ${pdf.name}:`, uploadError);
            }
        }
        
        log(`📄 [SUPABASE] Upload concluído: ${uploadedUrls.length} PDF(s) enviados`);
        return uploadedUrls;
    },
    
    isAvailable: function() {
        return !!(window.MediaSystem || window.PdfSystem);
    }
};

// Funções de compatibilidade
window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
    log(`📸 getMediaUrlsForProperty para ${propertyId}`);
    
    // Primeiro tentar MediaSystem
    if (window.MediaSystem?.getMediaUrlsForProperty) {
        return await window.MediaSystem.getMediaUrlsForProperty(propertyId, propertyTitle);
    }
    
    // Fallback: buscar do array local
    if (window.properties) {
        const property = window.properties.find(p => p.id === propertyId);
        return property?.images || '';
    }
    
    return '';
};

window.loadExistingPdfsForEdit = function(property) {
    log(`📄 loadExistingPdfsForEdit para imóvel ${property.id}`);
    return window.adminPdfHandler.load(property);
};

window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    log(`📄 processAndSavePdfs -> delegando para adminPdfHandler: ${propertyId}`);
    return await window.adminPdfHandler.process(propertyId, propertyTitle);
};

window.clearAllPdfs = function() {
    log('📄 clearAllPdfs -> delegando para adminPdfHandler');
    return window.adminPdfHandler.clear();
};

window.getPdfsToSave = async function(propertyId) {
    log(`📄 getPdfsToSave -> delegando: ${propertyId}`);
    return await window.processAndSavePdfs(propertyId, 'Imóvel');
};

window.clearProcessedPdfs = function() {
    log('📄 clearProcessedPdfs - Limpando PDFs processados');
    
    if (window.MediaSystem?.state?.pdfs) {
        const before = window.MediaSystem.state.pdfs.length;
        window.MediaSystem.state.pdfs = window.MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
        const after = window.MediaSystem.state.pdfs.length;
        log(`📄 Removidos ${before - after} PDF(s) processados`);
        
        if (window.MediaSystem.updateUI) {
            setTimeout(() => window.MediaSystem.updateUI(), 100);
        }
    }
    
    return window.clearAllPdfs();
};

/* ==========================================================
   ✅✅✅ AUTO-SALVAMENTO COM GRAVAÇÃO NO SUPABASE
   ========================================================== */

window.triggerAutoSave = function(reason = 'media_deletion') {
    log(`⚡ Auto-salvamento (${reason}) para imóvel ${window.editingPropertyId || 'N/A'}`);
    
    if (!window.editingPropertyId) {
        log('⚠️ Não está editando, ignorando auto-salvamento');
        return;
    }
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(async () => {
        if (!pendingAutoSave) return;
        
        log('🔄 Executando auto-salvamento...');
        
        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        const originalText = submitBtn?.innerHTML;
        
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
                propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
            }
            
            if (propertyData.features) {
                const featuresArray = propertyData.features.split(',')
                    .map(f => f.trim())
                    .filter(f => f !== '');
                propertyData.features = JSON.stringify(featuresArray);
            }
            
            const updateData = { ...propertyData };
            
            // ✅✅✅ PROCESSAR PDFs COM SUPABASE
            log(`📄 [AUTO-SAVE] Processando PDFs para Supabase...`);
            if (window.processAndSavePdfs) {
                try {
                    const pdfsString = await window.processAndSavePdfs(
                        window.editingPropertyId, 
                        propertyData.title
                    );
                    
                    if (pdfsString && pdfsString.trim() !== '' && pdfsString !== 'EMPTY') {
                        updateData.pdfs = pdfsString;
                        log(`✅ [AUTO-SAVE] PDFs processados: ${pdfsString.split(',').length} arquivo(s)`);
                    } else if (pdfsString === '' || pdfsString === 'EMPTY') {
                        updateData.pdfs = 'EMPTY';
                        log(`✅ [AUTO-SAVE] Nenhum PDF - marcado como EMPTY`);
                    }
                } catch (pdfError) {
                    console.error('❌ [AUTO-SAVE] Erro ao processar PDFs:', pdfError);
                }
            }
            
            // Processar mídia
            if (window.MediaSystem) {
                try {
                    let mediaUrls = '';
                    if (window.MediaSystem.getOrderedMediaUrls) {
                        const ordered = window.MediaSystem.getOrderedMediaUrls();
                        mediaUrls = ordered.images;
                    }
                    
                    if (mediaUrls && mediaUrls.trim() !== '') {
                        updateData.images = mediaUrls;
                        log(`✅ [AUTO-SAVE] Mídia processada: ${mediaUrls.split(',').length} arquivo(s)`);
                    }
                } catch (mediaError) {
                    console.error('❌ [AUTO-SAVE] Erro ao processar mídia:', mediaError);
                }
            }
            
            // Atualizar array local
            if (window.updateLocalProperty) {
                window.updateLocalProperty(window.editingPropertyId, updateData);
            }
            
            // ✅✅✅ SALVAR NO SUPABASE
            log(`💾 [AUTO-SAVE] Salvando no Supabase...`);
            if (typeof window.updateProperty === 'function') {
                const success = await window.updateProperty(window.editingPropertyId, updateData);
                
                if (success) {
                    log(`✅ [AUTO-SAVE] Dados salvos no Supabase com sucesso!`);
                    this._showAutoSaveNotification('✅ Alterações salvas no servidor');
                    
                    // Forçar sincronização após salvar
                    setTimeout(() => {
                        if (typeof window.syncWithSupabase === 'function') {
                            window.syncWithSupabase().then(result => {
                                if (result?.success) {
                                    log(`✅ [AUTO-SAVE] Sincronização pós-salvamento concluída`);
                                }
                            });
                        }
                    }, 1000);
                    
                } else {
                    console.error('❌ [AUTO-SAVE] Falha ao salvar no Supabase');
                    this._showAutoSaveNotification('⚠️ Erro ao salvar no servidor', 'error');
                }
            }
            
        } catch (error) {
            console.error('❌ [AUTO-SAVE] Erro no auto-salvamento:', error);
            this._showAutoSaveNotification('❌ Erro ao salvar', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            pendingAutoSave = false;
        }
    }, 1500);
    
    pendingAutoSave = true;
};

// Helper para notificações
window.triggerAutoSave._showAutoSaveNotification = function(message, type = 'success') {
    const existing = document.querySelectorAll('.auto-save-notification');
    existing.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `auto-save-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : 'var(--success)'};
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
};

/* ==========================================================
   ✅✅✅ FUNÇÃO updateLocalProperty COM SUPABASE SYNC
   ========================================================== */

window.updateLocalProperty = function(propertyId, updatedData) {
    log(`🔄 Atualizando imóvel ${propertyId} no array local...`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ Array window.properties não encontrado');
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id === propertyId);
    if (index === -1) {
        console.error(`❌ Imóvel ${propertyId} não encontrado no array`);
        return false;
    }
    
    // Normalizar dados
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = Boolean(updatedData.has_video);
    }
    
    if (Array.isArray(updatedData.features)) {
        updatedData.features = JSON.stringify(updatedData.features);
    }
    
    // ✅✅✅ GARANTIR QUE PDFs SEJAM PRESERVADOS
    if (!updatedData.pdfs || updatedData.pdfs.trim() === '') {
        // Manter PDFs existentes se não houver novos
        const existingPdfs = window.properties[index].pdfs;
        if (existingPdfs && existingPdfs !== 'EMPTY') {
            updatedData.pdfs = existingPdfs;
            log(`📄 Preservando PDFs existentes: ${existingPdfs.split(',').length} arquivo(s)`);
        } else {
            updatedData.pdfs = 'EMPTY';
        }
    }
    
    // Atualizar o objeto
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    log(`✅ Imóvel ${propertyId} atualizado no array local`);
    log('📋 Dados atualizados:', {
        title: window.properties[index].title,
        price: window.properties[index].price,
        pdfs: window.properties[index].pdfs ? 
              `${window.properties[index].pdfs.split(',').length} arquivo(s)` : 'Nenhum'
    });
    
    // Atualizar UI
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        if (typeof window.renderProperties === 'function') {
            const currentFilter = window.currentFilter || 'todos';
            window.renderProperties(currentFilter, true);
        }
        
        // Disparar evento para atualização em tempo real
        document.dispatchEvent(new CustomEvent('propertyUpdated', {
            detail: {
                id: propertyId,
                data: window.properties[index],
                source: 'auto_save'
            }
        }));
        
    }, 150);
    
    return true;
};

/* ==========================================================
   ✅✅✅ FUNÇÃO addToLocalProperties COM SUPABASE SYNC
   ========================================================== */

window.addToLocalProperties = function(newProperty) {
    log('➕ Adicionando novo imóvel ao array local...');
    
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
    log(`✅ Novo imóvel adicionado com ID: ${propertyWithId.id}`);
    
    // Sincronizar com Supabase
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
        
        // Forçar sincronização com Supabase
        setTimeout(() => {
            if (typeof window.syncWithSupabase === 'function') {
                window.syncWithSupabase().then(result => {
                    if (result?.success) {
                        log(`✅ Sincronização pós-criação concluída`);
                    }
                });
            }
        }, 500);
        
    }, 200);
    
    return propertyWithId;
};

/* ==========================================================
   ✅✅✅ SETUP DO FORMULÁRIO COM SUPABASE FIX
   ========================================================== */

window.setupForm = function() {
    log('Configurando formulário admin...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('Formulário propertyForm não encontrado!');
        return;
    }
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) {
        window.setupPriceAutoFormat();
    }
    
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        log('SUBMISSÃO DO FORMULÁRIO ADMIN');
        
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Aguarde...');
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
            
            // Validação
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                throw new Error('Preencha Título, Preço e Localização!');
            }
            
            // Formatar
            if (propertyData.price && window.SharedCore?.PriceFormatter?.formatForInput) {
                propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
            }
            
            if (propertyData.features) {
                const featuresArray = propertyData.features.split(',')
                    .map(f => f.trim())
                    .filter(f => f !== '');
                propertyData.features = JSON.stringify(featuresArray);
            }
            
            if (window.editingPropertyId) {
                log(`EDITANDO imóvel ID: ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // ✅✅✅ PROCESSAR PDFs COM SUPABASE
                log(`📄 [SUBMIT] Processando PDFs para Supabase...`);
                if (window.processAndSavePdfs) {
                    const pdfsString = await window.processAndSavePdfs(
                        window.editingPropertyId, 
                        propertyData.title
                    );
                    
                    if (pdfsString && pdfsString.trim() !== '' && pdfsString !== 'EMPTY') {
                        updateData.pdfs = pdfsString;
                        log(`✅ [SUBMIT] PDFs processados: ${pdfsString.split(',').length} arquivo(s)`);
                    } else {
                        updateData.pdfs = 'EMPTY';
                    }
                }
                
                // Processar mídia
                if (window.MediaSystem?.getOrderedMediaUrls) {
                    const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                    if (mediaUrls?.trim()) updateData.images = mediaUrls;
                }
                
                // Atualizar localmente
                window.updateLocalProperty(window.editingPropertyId, updateData);
                
                // ✅✅✅ SALVAR NO SUPABASE
                log(`💾 [SUBMIT] Salvando no Supabase...`);
                if (typeof window.updateProperty === 'function') {
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    if (success) {
                        const imageCount = updateData.images ? updateData.images.split(',').filter(url => url.trim() !== '').length : 0;
                        const pdfCount = updateData.pdfs && updateData.pdfs !== 'EMPTY' 
                            ? updateData.pdfs.split(',').filter(url => url.trim() !== '').length 
                            : 0;
                        
                        let successMessage = `✅ Imóvel atualizado no servidor!\n\n`;
                        if (pdfCount > 0) successMessage += `📄 ${pdfCount} documento(s) PDF salvo(s)\n`;
                        if (imageCount > 0) successMessage += `📸 ${imageCount} foto(s)/vídeo(s) salvo(s)`;
                        
                        alert(successMessage);
                        
                        // Forçar sincronização
                        setTimeout(() => {
                            if (typeof window.syncWithSupabase === 'function') {
                                window.syncWithSupabase();
                            }
                        }, 500);
                        
                    } else {
                        throw new Error('Falha ao atualizar no servidor');
                    }
                }
                
            } else {
                log('CRIANDO novo imóvel...');
                
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        const localProperty = window.addToLocalProperties(newProperty);
                        alert(`✅ Imóvel criado no servidor! ID: ${localProperty.id}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Erro:', error);
            alert(`❌ Erro: ${error.message}`);
        } finally {
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
        }
    });
};

/* ==========================================================
   ✅✅✅ CONFIGURAÇÃO DE UPLOADS
   ========================================================== */

setTimeout(() => {
    // Configurar upload de PDFs
    const setupUpload = (inputId, areaId, callback, autoSaveType) => {
        const input = document.getElementById(inputId);
        const area = document.getElementById(areaId);
        if (!input || !area) return;
        
        // Clonar para limpar event listeners
        const cleanInput = input.cloneNode(true);
        const cleanArea = area.cloneNode(true);
        input.parentNode.replaceChild(cleanInput, input);
        area.parentNode.replaceChild(cleanArea, area);
        
        const freshInput = document.getElementById(inputId);
        const freshArea = document.getElementById(areaId);
        
        freshArea.addEventListener('click', () => freshInput.click());
        
        freshInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                callback(e.target.files);
                e.target.value = '';
                
                // Disparar auto-salvamento após upload
                if (autoSaveType) {
                    setTimeout(() => {
                        window.triggerAutoSave(autoSaveType);
                        log(`⚡ Auto-salvamento disparado após upload de ${autoSaveType}`);
                    }, 800);
                }
            }
        });
    };
    
    setupUpload('pdfFileInput', 'pdfUploadArea', 
        files => window.MediaSystem?.addPdfs?.(files), 'pdf_addition');
    
    setupUpload('fileInput', 'uploadArea', 
        files => {
            window.MediaSystem?.addFiles?.(files);
            setTimeout(() => window.forceMediaPreviewUpdate?.(), 300);
        }, 'media_addition');
        
}, 1000);

// ========== RESTANTE DO CÓDIGO (MANTER FUNÇÕES EXISTENTES) ==========

window.cleanAdminForm = function(mode = 'reset') {
    log(`🧹 cleanAdminForm(${mode})`);
    
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    pendingAutoSave = false;
    
    window.editingPropertyId = null;
    
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset();
        document.getElementById('propType').value = 'residencial';
        document.getElementById('propBadge').value = 'Novo';
        document.getElementById('propHasVideo').checked = false;
    }
    
    if (window.MediaSystem) MediaSystem.resetState();
    if (window.clearAllPdfs) window.clearAllPdfs();
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
        submitBtn.style.background = 'var(--success)';
        submitBtn.disabled = false;
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
        cancelBtn.disabled = false;
    }
    
    ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
    
    return true;
};

window.cancelEdit = function() {
    log('cancelEdit()');
    
    if (window.editingPropertyId) {
        const confirmCancel = confirm('Cancelar edição? Alterações serão perdidas.');
        if (!confirmCancel) return false;
    }
    
    return window.cleanAdminForm('cancel');
};

window.toggleAdminPanel = function() {
    log('toggleAdminPanel()');
    
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha:");
    if (password === null) return;
    if (password === "") return alert('⚠️ Campo vazio!');
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
                }, 300);
            }
        }
    } else {
        alert('❌ Senha incorreta!');
    }
};

window.setupAdminUI = function() {
    log('setupAdminUI()');
    
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.toggleAdminPanel();
        });
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.cancelEdit();
        });
    }
    
    if (!document.getElementById('syncButton')) {
        const syncBtn = document.createElement('button');
        syncBtn.id = 'syncButton';
        syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
        syncBtn.onclick = window.syncWithSupabaseManual;
        syncBtn.style.cssText = `
            background: var(--gold); color: white; border: none;
            padding: 0.8rem 1.5rem; border-radius: 5px; cursor: pointer;
            margin-top: 1rem; display: inline-flex; align-items: center;
            gap: 0.5rem; font-weight: 600;
        `;
        
        const panelTitle = document.querySelector('#adminPanel h3');
        if (panelTitle) panelTitle.parentNode.insertBefore(syncBtn, panelTitle.nextSibling);
    }
    
    if (typeof window.setupForm === 'function') window.setupForm();
    
    const style = document.createElement('style');
    style.textContent = `
        .auto-save-notification {
            position: fixed; top: 20px; right: 20px;
            background: var(--success); color: white;
            padding: 12px 18px; border-radius: 8px;
            z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex; align-items: center; gap: 10px;
            animation: slideInRight 0.3s ease;
        }
        .auto-save-notification.error { background: #e74c3c; }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
};

window.editProperty = function(id) {
    log(`EDITANDO IMÓVEL ${id}`);
    
    const property = window.properties?.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    if (window.MediaSystem) MediaSystem.resetState();
    
    const fields = {
        propTitle: property.title || '',
        propPrice: (property.price && window.SharedCore?.PriceFormatter?.formatForInput) 
                  ? window.SharedCore.PriceFormatter.formatForInput(property.price)
                  : property.price || '',
        propLocation: property.location || '',
        propDescription: property.description || '',
        propFeatures: Array.isArray(property.features) 
                     ? property.features.join(', ')
                     : (property.features || ''),
        propType: property.type || 'residencial',
        propBadge: property.badge || 'Novo',
        propHasVideo: property.has_video === true || property.has_video === 'true' || false
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.type === 'checkbox' ? el.checked = value : el.value = value;
    });
    
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
    }
    
    window.editingPropertyId = property.id;
    
    if (window.MediaSystem) MediaSystem.loadExisting(property);
    if (window.loadExistingPdfsForEdit) window.loadExistingPdfsForEdit(property);
    
    setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        if (panel) panel.style.display = 'block';
        document.getElementById('propertyForm')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return true;
};

window.loadPropertyList = function() {
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    if (!container || !window.properties) return;
    
    container.innerHTML = window.properties.length === 0 ? 
        '<p style="text-align: center; color: #666;">Nenhum imóvel</p>' :
        window.properties.sort((a,b) => b.id - a.id).map(property => `
            <div class="property-item">
                <div style="flex: 1;">
                    <strong style="color: var(--primary);">${property.title}</strong><br>
                    <small>${property.price} - ${property.location}</small>
                    <div style="font-size: 0.8em; color: #666; margin-top: 0.2rem;">
                        ID: ${property.id} | Tipo: ${property.type || 'residencial'}
                        ${property.has_video ? ' | 🎬 Tem vídeo' : ''}
                        ${property.badge ? ` | 🏷️ ${property.badge}` : ''}
                        ${property.pdfs && property.pdfs !== 'EMPTY' ? 
                          ` | 📄 ${property.pdfs.split(',').length} PDF(s)` : ''}
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
            </div>
        `).join('');
    
    if (countElement) countElement.textContent = window.properties.length;
};

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}

/* ==========================================================
   ✅✅✅ VERIFICAÇÃO FINAL SUPABASE
   ========================================================== */

setTimeout(() => {
    console.log('='.repeat(60));
    console.log('✅✅✅ SISTEMA ADMIN COM SUPABASE FIX');
    console.log('='.repeat(60));
    console.log('📄 PDFs agora serão salvos permanentemente no Supabase');
    console.log('💾 Auto-salvamento com garantia de persistência');
    console.log('🔄 Sincronização automática após alterações');
    console.log('='.repeat(60));
    console.log('🔧 DEBUG: Ativado - desative em produção');
    console.log('='.repeat(60));
}, 3000);

console.log('✅ admin.js - SUPABASE FIX IMPLEMENTADO');
