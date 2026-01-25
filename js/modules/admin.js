// js/modules/admin.js - SISTEMA ADMIN COM CORREÇÃO DE PERSISTÊNCIA DE PDFs
console.log('🔧 admin.js com correção de persistência de PDFs carregado');

/* ==========================================================
   CONFIGURAÇÃO E CONSTANTES
   ========================================================== */
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

const DEBUG = true; // Ativado para debug
const log = DEBUG ? console.log : () => {};

// Estado global
window.editingPropertyId = null;
let autoSaveTimeout = null;
let pendingAutoSave = false;

/* ==========================================================
   HELPER FUNCTIONS
   ========================================================== */
const Helpers = {
    format: {
        price: (value) => window.SharedCore?.PriceFormatter?.formatForInput?.(value) || value,
        features: (value) => {
            if (!value) return '[]';
            try {
                if (Array.isArray(value)) return JSON.stringify(value);
                if (value.startsWith('[')) return value;
                const arr = value.split(',').map(f => f.trim()).filter(f => f);
                return JSON.stringify(arr);
            } catch { return '[]'; }
        }
    },
    
    updateUI: {
        formTitle: (text) => {
            const el = document.getElementById('formTitle');
            if (el) el.textContent = text;
        },
        submitButton: (isEditing = false) => {
            const btn = document.querySelector('#propertyForm button[type="submit"]');
            if (!btn) return;
            btn.innerHTML = isEditing ? 
                '<i class="fas fa-save"></i> Salvar Alterações' : 
                '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
            btn.style.background = isEditing ? 'var(--accent)' : 'var(--success)';
            btn.disabled = false;
        },
        cancelButton: (show = true) => {
            const btn = document.getElementById('cancelEditBtn');
            if (btn) {
                btn.style.display = show ? 'block' : 'none';
                btn.disabled = !show;
            }
        }
    },
    
    setupUpload: (inputId, areaId, callback, autoSaveType = null) => {
        const input = document.getElementById(inputId);
        const area = document.getElementById(areaId);
        if (!input || !area) return false;
        
        const cleanInput = input.cloneNode(true);
        const cleanArea = area.cloneNode(true);
        input.parentNode.replaceChild(cleanInput, input);
        area.parentNode.replaceChild(cleanArea, area);
        
        const freshInput = document.getElementById(inputId);
        const freshArea = document.getElementById(areaId);
        
        freshArea.addEventListener('click', (e) => {
            e.preventDefault();
            freshInput.click();
        });
        
        freshInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                callback(e.target.files);
                e.target.value = '';
                if (autoSaveType) window.triggerAutoSave(autoSaveType);
            }
        });
        
        return true;
    },
    
    showNotification: (message, type = 'success', duration = 3000) => {
        const existing = document.querySelectorAll('.auto-save-notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `auto-save-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${type === 'error' ? '#e74c3c' : 'var(--success)'};
            color: white; padding: 12px 18px; border-radius: 8px;
            z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex; align-items: center; gap: 10px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), duration);
    }
};

/* ==========================================================
   SISTEMA DE PDFs COM CORREÇÃO DE PERSISTÊNCIA
   ========================================================== */
window.adminPdfHandler = {
    clear: function() {
        console.log('[adminPdfHandler] Limpando PDFs');
        return window.MediaSystem?.clearAllPdfs?.() || window.PdfSystem?.clearAllPdfs?.();
    },
    
    clearNonUploaded: function() {
        console.log('[adminPdfHandler] Limpando apenas PDFs NÃO enviados');
        
        if (window.MediaSystem?.state?.pdfs) {
            const uploadedPdfs = window.MediaSystem.state.pdfs.filter(pdf => pdf.uploaded);
            window.MediaSystem.state.pdfs = uploadedPdfs;
            
            console.log(`💾 Mantidos ${uploadedPdfs.length} PDF(s) já enviado(s)`);
            
            if (window.MediaSystem.updateUI) {
                window.MediaSystem.updateUI();
            }
        }
        
        return true;
    },
    
    hasPersistedPdfs: function() {
        if (!window.editingPropertyId) return false;
        
        if (window.MediaSystem?.state?.pdfs) {
            const uploadedPdfs = window.MediaSystem.state.pdfs.filter(pdf => pdf.uploaded);
            return uploadedPdfs.length > 0;
        }
        
        return false;
    },
    
    resetStateSoft: function(preserveUploadedPdfs = true) {
        console.log('[adminPdfHandler] Reset suave do estado');
        
        if (window.MediaSystem && window.MediaSystem.resetStateSoft) {
            return window.MediaSystem.resetStateSoft(preserveUploadedPdfs);
        }
        
        return false;
    },
    
    load: function(property) {
        console.log('[adminPdfHandler] Carregando PDFs existentes para edição:', property?.id);
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 
               window.PdfSystem?.loadExistingPdfsForEdit?.(property);
    },
    
    process: async function(id, title) {
        console.group('[adminPdfHandler] PROCESSANDO PDFs DEFINITIVAMENTE');
        console.log('📋 Parâmetros:', { 
            id, 
            tipoId: typeof id,
            title 
        });
        
        if (!id) {
            console.error('❌ ID do imóvel não fornecido!');
            console.groupEnd();
            return '';
        }
        
        try {
            let pdfUrls = '';
            
            if (window.MediaSystem?.processAndSavePdfs) {
                console.log('🔍 Usando MediaSystem para processar PDFs...');
                pdfUrls = await window.MediaSystem.processAndSavePdfs(id, title);
                console.log('📄 URLs do MediaSystem:', pdfUrls ? pdfUrls.split(',').length + ' PDF(s)' : 'Nenhum');
            }
            else if (window.PdfSystem?.processAndSavePdfs) {
                console.log('🔍 Usando PdfSystem para processar PDFs...');
                pdfUrls = await window.PdfSystem.processAndSavePdfs(id, title);
                console.log('📄 URLs do PdfSystem:', pdfUrls ? pdfUrls.split(',').length + ' PDF(s)' : 'Nenhum');
            }
            else {
                console.log('⚠️ Sistemas de PDF não disponíveis, tentando processamento manual...');
                pdfUrls = await this.processPdfsManually(id, title);
            }
            
            if (pdfUrls?.trim()) {
                const validId = this.validateIdForSupabase(id);
                
                if (validId) {
                    const persistSuccess = await this.persistPdfsToSupabase(validId, pdfUrls);
                    if (persistSuccess) {
                        console.log('✅ PDFs persistidos com SUCESSO no Supabase!');
                        
                        // 🔄 CRÍTICO: Marcar PDFs como já enviados no estado local
                        if (window.MediaSystem?.state?.pdfs) {
                            window.MediaSystem.state.pdfs.forEach(pdf => {
                                if (pdfUrls.includes(pdf.url)) {
                                    pdf.uploaded = true;
                                    console.log(`🏷️ Marcado PDF como enviado: ${pdf.name}`);
                                }
                            });
                        }
                    } else {
                        console.error('❌ Falha ao persistir PDFs no Supabase');
                    }
                } else {
                    console.warn('⚠️ ID inválido para Supabase, salvando apenas localmente');
                }
            } else {
                console.log('ℹ️ Nenhum PDF para processar');
            }
            
            console.groupEnd();
            return pdfUrls || '';
            
        } catch (error) {
            console.error('❌ ERRO CRÍTICO em adminPdfHandler.process:', error);
            console.groupEnd();
            return '';
        }
    },
    
    persistPdfsToSupabase: async function(propertyId, pdfUrls) {
        console.log('[adminPdfHandler] Persistindo PDFs no Supabase:', {
            propertyId,
            propertyIdType: typeof propertyId,
            pdfCount: pdfUrls.split(',').filter(p => p.trim()).length
        });
        
        if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
            console.error('❌ Credenciais Supabase não configuradas');
            return false;
        }
        
        if (!propertyId || !pdfUrls?.trim()) {
            console.error('❌ Dados inválidos para persistência');
            return false;
        }
        
        if (typeof propertyId !== 'number' || isNaN(propertyId)) {
            console.error('❌ ID deve ser numérico para Supabase:', propertyId);
            return false;
        }
        
        try {
            console.log(`🌐 Enviando para Supabase com ID: ${propertyId} (${typeof propertyId})`);
            
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ 
                    pdfs: pdfUrls
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ PDFs atualizados no Supabase:', {
                    success: true,
                    pdfsNaResposta: result[0]?.pdfs,
                    propertyId: propertyId,
                    rowsAfetadas: result.length
                });
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erro ao atualizar PDFs no Supabase:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText,
                    idUsado: propertyId
                });
                
                const checkResponse = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}&select=id`, {
                    headers: {
                        'apikey': window.SUPABASE_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`
                    }
                });
                
                if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    console.log('📊 Verificação de existência:', {
                        existe: checkData.length > 0,
                        dados: checkData
                    });
                    
                    if (checkData.length === 0) {
                        console.warn(`⚠️ Imóvel ID ${propertyId} não existe no Supabase`);
                    }
                }
                
                return false;
            }
        } catch (error) {
            console.error('❌ Erro de conexão ao persistir PDFs:', error);
            return false;
        }
    },
    
    validateIdForSupabase: function(propertyId) {
        console.log('[adminPdfHandler] Validando ID para Supabase:', {
            original: propertyId,
            type: typeof propertyId
        });
        
        if (!propertyId) {
            console.error('❌ ID não fornecido');
            return null;
        }
        
        if (typeof propertyId === 'number' && !isNaN(propertyId) && propertyId > 0) {
            console.log(`✅ ID já é numérico válido: ${propertyId}`);
            return propertyId;
        }
        
        if (typeof propertyId === 'string') {
            const cleanId = propertyId
                .replace('test_id_', '')
                .replace('temp_', '')
                .replace(/[^0-9]/g, '');
            
            const numericId = parseInt(cleanId);
            
            if (!isNaN(numericId) && numericId > 0) {
                console.log(`✅ ID convertido: "${propertyId}" -> ${numericId}`);
                return numericId;
            }
        }
        
        const directConvert = parseInt(propertyId);
        if (!isNaN(directConvert) && directConvert > 0) {
            console.log(`✅ ID convertido diretamente: ${directConvert}`);
            return directConvert;
        }
        
        console.error('❌ Não foi possível converter ID para formato Supabase:', propertyId);
        return null;
    },
    
    processPdfsManually: async function(propertyId, title) {
        console.log('[adminPdfHandler] Processamento manual de PDFs');
        
        if (window.MediaSystem?.state?.pdfs) {
            const pdfs = MediaSystem.state.pdfs || [];
            const uploadedPdfs = pdfs.filter(pdf => pdf.url && pdf.uploaded);
            
            if (uploadedPdfs.length > 0) {
                const urls = uploadedPdfs.map(pdf => pdf.url).join(',');
                console.log(`📄 ${uploadedPdfs.length} PDF(s) encontrado(s) no estado`);
                return urls;
            }
        }
        
        return '';
    },
    
    isAvailable: function() {
        const available = !!(window.MediaSystem || window.PdfSystem);
        console.log('[adminPdfHandler] Disponível?', available);
        return available;
    }
};

/* ==========================================================
   AUTO-SALVAMENTO COM PRESERVAÇÃO DE ESTADO
   ========================================================== */
window.triggerAutoSave = function(reason = 'media_deletion') {
    if (!window.editingPropertyId) return;
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(async () => {
        if (!pendingAutoSave) return;
        
        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        const originalText = submitBtn?.innerHTML;
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Auto-salvando...';
            submitBtn.disabled = true;
        }
        
        try {
            console.log('🔍 DEBUG triggerAutoSave:', {
                editingId: window.editingPropertyId,
                tipoId: typeof window.editingPropertyId,
                reason: reason,
                timestamp: new Date().toISOString()
            });
            
            const fields = ['propTitle','propPrice','propLocation','propDescription',
                          'propFeatures','propType','propBadge','propHasVideo'];
            
            const propertyData = fields.reduce((acc, id) => {
                const el = document.getElementById(id);
                acc[id.replace('prop', '').toLowerCase()] = 
                    el?.type === 'checkbox' ? el.checked : el?.value?.trim() || '';
                return acc;
            }, {});
            
            propertyData.price = Helpers.format.price(propertyData.price);
            propertyData.features = Helpers.format.features(propertyData.features);
            
            const updateData = { ...propertyData };
            
            // 🔄 CRÍTICO: Processar PDFs mas manter estado
            if (window.adminPdfHandler) {
                try {
                    const pdfsString = await window.adminPdfHandler.process(
                        window.editingPropertyId, 
                        propertyData.title
                    );
                    
                    if (pdfsString?.trim()) {
                        updateData.pdfs = pdfsString;
                        console.log('✅ PDFs processados no auto-save:', {
                            count: pdfsString.split(',').filter(p => p.trim()).length,
                            propertyTitle: propertyData.title
                        });
                        
                        // 🔄 NÃO limpar o estado após auto-salvamento
                        console.log('💾 Estado preservado após auto-salvamento');
                    } else {
                        console.log('ℹ️ Nenhum PDF novo processado no auto-save');
                    }
                } catch (error) {
                    console.error('❌ Erro ao processar PDFs no auto-save:', error);
                }
            }
            
            if (window.MediaSystem?.getOrderedMediaUrls) {
                const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                if (mediaUrls?.trim()) updateData.images = mediaUrls;
            }
            
            const validId = window.adminPdfHandler?.validateIdForSupabase?.(window.editingPropertyId);
            console.log('📤 Dados para envio:', {
                id: window.editingPropertyId,
                idValidoParaSupabase: validId,
                temPdfs: !!updateData.pdfs,
                campos: Object.keys(updateData)
            });
            
            window.updateLocalProperty(window.editingPropertyId, updateData);
            if (typeof window.updateProperty === 'function') {
                const idToUse = validId || window.editingPropertyId;
                await window.updateProperty(idToUse, updateData);
                Helpers.showNotification('✅ Alterações salvas automaticamente');
            }
            
        } catch (error) {
            console.error('Auto-salvamento falhou:', error);
            Helpers.showNotification('❌ Erro ao salvar', 'error');
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

/* ==========================================================
   FUNÇÃO UNIFICADA DE LIMPEZA COM PRESERVAÇÃO DE PDFs PERSISTIDOS
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log('[cleanAdminForm] Executando limpeza do formulário - Modo:', mode);
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
    pendingAutoSave = false;
    
    // 🔄 CRÍTICO: Preservar o ID do imóvel em edição se houver PDFs já persistidos
    const shouldPreserveEditingId = (mode === 'reset' && window.editingPropertyId && 
                                     window.adminPdfHandler?.hasPersistedPdfs?.());
    
    if (mode === 'reset' && !shouldPreserveEditingId) {
        window.editingPropertyId = null;
    } else if (shouldPreserveEditingId) {
        console.log('🔄 Preservando editingPropertyId pois há PDFs persistidos:', window.editingPropertyId);
    }
    
    // Resetar formulário (mas manter valores se for apenas limpeza de UI)
    const form = document.getElementById('propertyForm');
    if (form && mode !== 'soft_reset') {
        form.reset();
        document.getElementById('propType').value = 'residencial';
        document.getElementById('propBadge').value = 'Novo';
        document.getElementById('propHasVideo').checked = false;
    }
    
    // 🔄 CRÍTICO: NÃO limpar o estado do MediaSystem completamente
    if (window.MediaSystem) {
        console.log('[cleanAdminForm] Limpando UI do MediaSystem, mas mantendo estado de PDFs enviados');
        
        const existingUploadedPdfs = window.MediaSystem.state?.pdfs?.filter(pdf => pdf.uploaded) || [];
        console.log(`💾 Preservando ${existingUploadedPdfs.length} PDF(s) já enviado(s)`);
        
        if (window.MediaSystem.resetStateSoft) {
            window.MediaSystem.resetStateSoft(existingUploadedPdfs);
        } else {
            window.MediaSystem.state.pdfs = existingUploadedPdfs;
            if (window.MediaSystem.updateUI) window.MediaSystem.updateUI();
        }
    }
    
    if (window.adminPdfHandler && mode !== 'soft_reset') {
        console.log('[cleanAdminForm] Limpando apenas PDFs NÃO enviados do adminPdfHandler');
        window.adminPdfHandler.clearNonUploaded();
    }
    
    // Atualizar UI
    if (mode === 'reset' || mode === 'soft_reset') {
        Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
        Helpers.updateUI.submitButton(false);
        Helpers.updateUI.cancelButton(false);
    }
    
    // Limpar previews (apenas visual)
    if (mode !== 'soft_reset') {
        ['uploadPreview', 'pdfUploadPreview'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
        
        const existingPdfsSection = document.getElementById('existingPdfsSection');
        if (existingPdfsSection && existingPdfsSection.innerHTML.trim()) {
            console.log('💾 Preservando seção de PDFs existentes');
        }
    }
    
    if (mode === 'cancel' && window.showNotification) {
        window.showNotification('Edição cancelada', 'info');
    }
    
    console.log(`✅ cleanAdminForm concluído (Modo: ${mode})`);
    return true;
};

window.cancelEdit = function() {
    if (window.editingPropertyId && !confirm('Cancelar edição? Alterações serão perdidas.')) {
        return false;
    }
    return window.cleanAdminForm('cancel');
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO COM PRESERVAÇÃO DE ESTADO
   ========================================================== */
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Aguarde...', { variant: 'processing' });
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }
        
        try {
            const fields = ['propTitle','propPrice','propLocation','propDescription',
                          'propFeatures','propType','propBadge','propHasVideo'];
            
            const propertyData = fields.reduce((acc, id) => {
                const el = document.getElementById(id);
                acc[id.replace('prop', '').toLowerCase()] = 
                    el?.type === 'checkbox' ? el.checked : el?.value?.trim() || '';
                return acc;
            }, {});
            
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                throw new Error('Preencha Título, Preço e Localização!');
            }
            
            propertyData.price = Helpers.format.price(propertyData.price);
            propertyData.features = Helpers.format.features(propertyData.features);
            
            // 🔄 CRÍTICO: Verificar se é edição após auto-salvamento
            const isEditAfterAutoSave = window.editingPropertyId && 
                                       window.adminPdfHandler?.hasPersistedPdfs?.();
            
            if (window.editingPropertyId) {
                const updateData = { ...propertyData };
                
                console.log('🔄 Salvamento manual após auto-salvamento:', {
                    editingId: window.editingPropertyId,
                    hasPersistedPdfs: isEditAfterAutoSave,
                    timestamp: new Date().toISOString()
                });
                
                let pdfsProcessed = false;
                if (window.adminPdfHandler) {
                    try {
                        const hasNewPdfs = window.MediaSystem?.state?.pdfs?.some(pdf => !pdf.uploaded);
                        
                        if (hasNewPdfs) {
                            console.log('📤 Processando NOVOS PDFs no salvamento manual');
                            const pdfsString = await window.adminPdfHandler.process(
                                window.editingPropertyId, 
                                propertyData.title
                            );
                            if (pdfsString?.trim()) {
                                updateData.pdfs = pdfsString;
                                pdfsProcessed = true;
                            }
                        } else if (isEditAfterAutoSave) {
                            console.log('ℹ️ Usando PDFs já persistidos pelo auto-salvamento');
                            const existingPdfs = window.MediaSystem?.state?.pdfs?.filter(pdf => pdf.uploaded) || [];
                            if (existingPdfs.length > 0) {
                                const pdfUrls = existingPdfs.map(pdf => pdf.url).join(',');
                                updateData.pdfs = pdfUrls;
                                console.log(`💾 Usando ${existingPdfs.length} PDF(s) já persistido(s)`);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Erro ao processar PDFs:', error);
                    }
                }
                
                if (window.MediaSystem?.getOrderedMediaUrls) {
                    const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                    if (mediaUrls?.trim()) updateData.images = mediaUrls;
                }
                
                window.updateLocalProperty(window.editingPropertyId, updateData);
                
                if (typeof window.updateProperty === 'function') {
                    const validId = window.adminPdfHandler?.validateIdForSupabase?.(window.editingPropertyId);
                    const idToUse = validId || window.editingPropertyId;
                    
                    const success = await window.updateProperty(idToUse, updateData);
                    if (success) {
                        Helpers.showNotification('✅ Imóvel atualizado!');
                        
                        // 🔄 CRÍTICO: Apenas limpeza SUAVE após salvamento bem-sucedido
                        setTimeout(() => {
                            window.cleanAdminForm('soft_reset');
                        }, 1000);
                    }
                }
                
            } else {
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    if (newProperty) {
                        window.addToLocalProperties(newProperty);
                        Helpers.showNotification('✅ Imóvel criado!');
                        
                        setTimeout(() => {
                            window.cleanAdminForm('reset');
                        }, 1000);
                    }
                }
            }
            
        } catch (error) {
            alert(`❌ Erro: ${error.message}`);
            console.error('Erro no salvamento:', error);
        } finally {
            if (loading) loading.hide();
            
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText || 
                        (window.editingPropertyId ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site');
                }, 500);
            }
        }
    });
};

/* ==========================================================
   FUNÇÕES RESTANTES
   ========================================================== */
window.toggleAdminPanel = function() {
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
        #propertiesContainer.updating .property-card { opacity: 0.7; transition: opacity 0.3s; }
        .auto-save-notification { animation: slideInRight 0.3s ease; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
};

window.editProperty = function(id) {
    const property = window.properties?.find(p => p.id === id);
    if (!property) return alert('❌ Imóvel não encontrado!');
    
    if (window.MediaSystem) MediaSystem.resetState();
    
    const fields = {
        propTitle: property.title || '',
        propPrice: Helpers.format.price(property.price) || '',
        propLocation: property.location || '',
        propDescription: property.description || '',
        propFeatures: Array.isArray(property.features) ? 
                     property.features.join(', ') : (property.features || ''),
        propType: property.type || 'residencial',
        propBadge: property.badge || 'Novo',
        propHasVideo: property.has_video === true || property.has_video === 'true'
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.type === 'checkbox' ? el.checked = value : el.value = value;
    });
    
    Helpers.updateUI.formTitle(`Editando: ${property.title}`);
    Helpers.updateUI.submitButton(true);
    Helpers.updateUI.cancelButton(true);
    
    window.editingPropertyId = property.id;
    
    if (window.MediaSystem) MediaSystem.loadExisting(property);
    if (window.adminPdfHandler) window.adminPdfHandler.load(property);
    
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
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="editProperty(${property.id})" class="btn-edit">Editar</button>
                    <button onclick="deleteProperty(${property.id})" class="btn-delete">Excluir</button>
                </div>
            </div>
        `).join('');
    
    if (countElement) countElement.textContent = window.properties.length;
};

window.updateLocalProperty = function(propertyId, updatedData) {
    if (!window.properties) return false;
    
    const index = window.properties.findIndex(p => p.id === propertyId);
    if (index === -1) return false;
    
    if (updatedData.has_video !== undefined) updatedData.has_video = Boolean(updatedData.has_video);
    if (Array.isArray(updatedData.features)) updatedData.features = JSON.stringify(updatedData.features);
    
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos', true);
        }
    }, 150);
    
    return true;
};

window.addToLocalProperties = function(newProperty) {
    if (!window.properties) window.properties = [];
    
    const maxId = window.properties.length > 0 ? Math.max(...window.properties.map(p => p.id)) : 0;
    const propertyWithId = {
        ...newProperty,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    window.properties.push(propertyWithId);
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
    }, 200);
    
    return propertyWithId;
};

/* ==========================================================
   BOTÃO DE VERIFICAÇÃO DE PDFs
   ========================================================== */
setTimeout(() => {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel && !document.getElementById('simplePdfTestBtn')) {
        const testBtn = document.createElement('button');
        testBtn.id = 'simplePdfTestBtn';
        testBtn.innerHTML = '<i class="fas fa-search"></i> Verificar PDFs';
        testBtn.onclick = async function() {
            if (!window.editingPropertyId) {
                alert('Edite um imóvel primeiro para testar.');
                return;
            }
            
            const result = await window.checkPdfPersistence?.(window.editingPropertyId);
            if (result) {
                const count = result.pdfs ? result.pdfs.split(',').filter(p => p.trim()).length : 0;
                alert(`📊 Estado no Supabase:\n\nTítulo: ${result.title}\nPDFs: ${count} documento(s)\n\nVerifique console para detalhes.`);
            } else {
                alert('❌ Não foi possível verificar estado no Supabase.');
            }
        };
        
        testBtn.style.cssText = `
            background: #2ecc71; color: white; border: none;
            padding: 0.6rem 1rem; border-radius: 5px; cursor: pointer;
            margin: 0.5rem; font-size: 0.9rem; display: inline-flex;
            align-items: center; gap: 0.5rem;
        `;
        
        const panelActions = adminPanel.querySelector('div:first-child');
        if (panelActions) panelActions.appendChild(testBtn);
    }
}, 3000);

// Configuração de uploads
setTimeout(() => {
    Helpers.setupUpload('pdfFileInput', 'pdfUploadArea', 
        files => window.MediaSystem?.addPdfs?.(files), 'pdf_addition');
    
    Helpers.setupUpload('fileInput', 'uploadArea', 
        files => {
            window.MediaSystem?.addFiles?.(files);
            setTimeout(() => window.forceMediaPreviewUpdate?.(), 300);
        }, 'media_addition');
}, 1000);

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}

console.log('✅ admin.js - SISTEMA COM CORREÇÃO DE PERSISTÊNCIA DE PDFs IMPLEMENTADO');
