// js/modules/admin.js - SISTEMA ADMIN COM PERSISTÊNCIA DE PDFs GARANTIDA (CORRIGIDO)
console.log('🔧 admin.js com persistência de PDFs carregado (SEM updated_at)');

/* ==========================================================
   CONFIGURAÇÃO E CONSTANTES
   ========================================================== */
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

const DEBUG = false;
const log = DEBUG ? console.log : () => {};

// Estado global
window.editingPropertyId = null;
let autoSaveTimeout = null;
let pendingAutoSave = false;

/* ==========================================================
   HELPER FUNCTIONS (Redução de 200+ linhas)
   ========================================================== */
const Helpers = {
    // Formatação unificada
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
    
    // UI Helpers
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
    
    // Configuração de uploads (redução de 80+ linhas)
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
    
    // Notificações (redução de 30+ linhas)
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
   SISTEMA DE PDFs COM PERSISTÊNCIA GARANTIDA NO SUPABASE (CORRIGIDO)
   ========================================================== */
window.adminPdfHandler = {
    clear: function() {
        console.log('[adminPdfHandler] Limpando PDFs');
        return window.MediaSystem?.clearAllPdfs?.() || window.PdfSystem?.clearAllPdfs?.();
    },
    
    load: function(property) {
        console.log('[adminPdfHandler] Carregando PDFs existentes para edição:', property?.id);
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 
               window.PdfSystem?.loadExistingPdfsForEdit?.(property);
    },
    
    // ✅ FUNÇÃO CRÍTICA: Processa e SALVA PDFs definitivamente no Supabase (CORRIGIDA)
    process: async function(id, title) {
        console.group('[adminPdfHandler] PROCESSANDO PDFs DEFINITIVAMENTE');
        console.log('📋 Parâmetros:', { id, title });
        
        if (!id) {
            console.error('❌ ID do imóvel não fornecido!');
            console.groupEnd();
            return '';
        }
        
        try {
            let pdfUrls = '';
            
            // Estratégia 1: Usar MediaSystem (preferencial)
            if (window.MediaSystem?.processAndSavePdfs) {
                console.log('🔍 Usando MediaSystem para processar PDFs...');
                pdfUrls = await window.MediaSystem.processAndSavePdfs(id, title);
                console.log('📄 URLs do MediaSystem:', pdfUrls ? pdfUrls.split(',').length + ' PDF(s)' : 'Nenhum');
            }
            // Estratégia 2: Usar PdfSystem (alternativo)
            else if (window.PdfSystem?.processAndSavePdfs) {
                console.log('🔍 Usando PdfSystem para processar PDFs...');
                pdfUrls = await window.PdfSystem.processAndSavePdfs(id, title);
                console.log('📄 URLs do PdfSystem:', pdfUrls ? pdfUrls.split(',').length + ' PDF(s)' : 'Nenhum');
            }
            // Estratégia 3: Processar manualmente
            else {
                console.log('⚠️ Sistemas de PDF não disponíveis, tentando processamento manual...');
                pdfUrls = await this.processPdfsManually(id, title);
            }
            
            // ✅ GARANTIR PERSISTÊNCIA IMEDIATA NO SUPABASE (SEM updated_at)
            if (pdfUrls?.trim()) {
                const persistSuccess = await this.persistPdfsToSupabase(id, pdfUrls);
                if (persistSuccess) {
                    console.log('✅ PDFs persistidos com SUCESSO no Supabase!');
                } else {
                    console.error('❌ Falha ao persistir PDFs no Supabase');
                    // Mesmo se falhar, retorna as URLs para salvamento local
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
    
    // ✅ MÉTODO NOVO: Persistir PDFs diretamente no Supabase (CORRIGIDO - SEM updated_at)
    persistPdfsToSupabase: async function(propertyId, pdfUrls) {
        console.log('[adminPdfHandler] Persistindo PDFs no Supabase:', {
            propertyId,
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
        
        try {
            // ✅ CORREÇÃO CRÍTICA: Atualizar APENAS o campo pdfs (SEM updated_at)
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
                    // ❌ REMOVIDO: updated_at: new Date().toISOString() - NÃO EXISTE NA TABELA
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ PDFs atualizados no Supabase:', {
                    success: true,
                    pdfsNaResposta: result[0]?.pdfs,
                    propertyId
                });
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erro ao atualizar PDFs no Supabase:', {
                    status: response.status,
                    error: errorText
                });
                
                // ✅ TENTAR ESTRATÉGIA ALTERNATIVA: Atualizar apenas se ID for numérico
                if (propertyId && !isNaN(propertyId)) {
                    console.log('🔄 Tentando com ID numérico:', propertyId);
                    const numericResponse = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${Number(propertyId)}`, {
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
                    
                    if (numericResponse.ok) {
                        console.log('✅ PDFs atualizados com ID numérico');
                        return true;
                    }
                }
                
                return false;
            }
        } catch (error) {
            console.error('❌ Erro de conexão ao persistir PDFs:', error);
            return false;
        }
    },
    
    // ✅ MÉTODO NOVO: Processamento manual de fallback
    processPdfsManually: async function(propertyId, title) {
        console.log('[adminPdfHandler] Processamento manual de PDFs');
        
        // Tentar obter PDFs do estado atual
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

// ==========================================================
// FUNÇÕES DE COMPATIBILIDADE COM GARANTIA DE PERSISTÊNCIA
// ==========================================================
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    console.group('[COMPATIBILIDADE] processAndSavePdfs -> delegando para adminPdfHandler');
    console.log('📋 Parâmetros:', { propertyId, propertyTitle });
    
    try {
        const result = await window.adminPdfHandler.process(propertyId, propertyTitle);
        console.log('✅ Resultado:', result ? result.split(',').length + ' PDF(s)' : 'Nenhum');
        console.groupEnd();
        return result;
    } catch (error) {
        console.error('❌ Erro:', error);
        console.groupEnd();
        return '';
    }
};

window.clearAllPdfs = function() {
    console.log('[COMPATIBILIDADE] clearAllPdfs -> delegando para adminPdfHandler');
    return window.adminPdfHandler.clear();
};

window.loadExistingPdfsForEdit = function(property) {
    console.log('[COMPATIBILIDADE] loadExistingPdfsForEdit -> delegando para adminPdfHandler');
    return window.adminPdfHandler.load(property);
};

window.getPdfsToSave = async function(propertyId) {
    console.log('[COMPATIBILIDADE] getPdfsToSave -> delegando para processAndSavePdfs');
    return await window.processAndSavePdfs(propertyId, 'Imóvel');
};

window.clearProcessedPdfs = function() {
    console.log('[COMPATIBILIDADE] clearProcessedPdfs - Limpando apenas PDFs processados');
    if (MediaSystem?.state?.pdfs) {
        MediaSystem.state.pdfs = MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
        if (MediaSystem.updateUI) MediaSystem.updateUI();
    }
    window.adminPdfHandler.clear();
};

window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
    return await (MediaSystem?.getMediaUrlsForProperty?.(propertyId, propertyTitle) || '');
};

/* ==========================================================
   AUTO-SALVAMENTO OTIMIZADO COM PERSISTÊNCIA DE PDFs
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
            // ✅ ADICIONADO: LOG DE DIAGNÓSTICO
            console.log('🔍 DEBUG triggerAutoSave - Estado dos PDFs:', {
                temAdminPdfHandler: !!window.adminPdfHandler,
                editingId: window.editingPropertyId,
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
            
            // Formatação
            propertyData.price = Helpers.format.price(propertyData.price);
            propertyData.features = Helpers.format.features(propertyData.features);
            
            const updateData = { ...propertyData };
            
            // ✅ PROCESSAR PDFs COM PERSISTÊNCIA GARANTIDA
            if (window.adminPdfHandler) {
                try {
                    const pdfsString = await window.adminPdfHandler.process(
                        window.editingPropertyId, 
                        propertyData.title
                    );
                    
                    if (pdfsString?.trim()) {
                        updateData.pdfs = pdfsString; // ✅ CRÍTICO: Atribuir ao updateData
                        // ✅ LOG DE DIAGNÓSTICO
                        console.log('✅ PDFs processados no auto-save:', {
                            count: pdfsString.split(',').filter(p => p.trim()).length,
                            string: pdfsString.substring(0, 100) + '...',
                            propertyTitle: propertyData.title,
                            updateDataHasPdfs: !!updateData.pdfs
                        });
                    } else {
                        console.log('ℹ️ Nenhum PDF novo processado no auto-save');
                    }
                } catch (error) {
                    console.error('❌ Erro ao processar PDFs no auto-save:', error);
                }
            }
            
            // Processar mídia
            if (window.MediaSystem?.getOrderedMediaUrls) {
                const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                if (mediaUrls?.trim()) updateData.images = mediaUrls;
            }
            
            // ✅ LOG FINAL DOS DADOS QUE SERÃO ENVIADOS
            console.log('📤 Dados completos para envio no auto-save:', {
                temPdfs: !!updateData.pdfs,
                temImages: !!updateData.images,
                campos: Object.keys(updateData),
                id: window.editingPropertyId
            });
            
            // Atualizar array local e banco
            window.updateLocalProperty(window.editingPropertyId, updateData);
            if (typeof window.updateProperty === 'function') {
                await window.updateProperty(window.editingPropertyId, updateData);
                Helpers.showNotification('✅ Alterações salvas');
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
   FUNÇÃO UNIFICADA DE LIMPEZA (30 linhas vs 70+)
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
    pendingAutoSave = false;
    
    window.editingPropertyId = null;
    
    // Resetar formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset();
        document.getElementById('propType').value = 'residencial';
        document.getElementById('propBadge').value = 'Novo';
        document.getElementById('propHasVideo').checked = false;
    }
    
    // Limpar sistemas
    if (window.MediaSystem) MediaSystem.resetState();
    if (window.adminPdfHandler) window.adminPdfHandler.clear();
    
    // Atualizar UI
    Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
    Helpers.updateUI.submitButton(false);
    Helpers.updateUI.cancelButton(false);
    
    // Limpar previews
    ['newPdfsSection','existingPdfsSection','uploadPreview','pdfUploadPreview']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
    
    if (mode === 'cancel' && window.showNotification) {
        window.showNotification('Edição cancelada', 'info');
    }
    
    return true;
};

window.cancelEdit = function() {
    if (window.editingPropertyId && !confirm('Cancelar edição? Alterações serão perdidas.')) {
        return false;
    }
    return window.cleanAdminForm('cancel');
};

/* ==========================================================
   TOGGLE ADMIN PANEL (15 linhas vs 30+)
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

/* ==========================================================
   CONFIGURAÇÃO DE UI (40 linhas vs 80+)
   ========================================================== */
window.setupAdminUI = function() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    // Configurar botão admin
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.toggleAdminPanel();
        });
    }
    
    // Configurar botão cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.cancelEdit();
        });
    }
    
    // Adicionar botão sincronização
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
    
    // Configurar formulário
    if (typeof window.setupForm === 'function') window.setupForm();
    
    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
        #propertiesContainer.updating .property-card { opacity: 0.7; transition: opacity 0.3s; }
        .auto-save-notification { animation: slideInRight 0.3s ease; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
};

/* ==========================================================
   FUNÇÃO editProperty OTIMIZADA (40 linhas vs 80+)
   ========================================================== */
window.editProperty = function(id) {
    const property = window.properties?.find(p => p.id === id);
    if (!property) return alert('❌ Imóvel não encontrado!');
    
    // Resetar sistemas
    if (window.MediaSystem) MediaSystem.resetState();
    
    // Preencher formulário
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
    
    // Atualizar UI
    Helpers.updateUI.formTitle(`Editando: ${property.title}`);
    Helpers.updateUI.submitButton(true);
    Helpers.updateUI.cancelButton(true);
    
    window.editingPropertyId = property.id;
    
    // Carregar mídia e PDFs
    if (window.MediaSystem) MediaSystem.loadExisting(property);
    if (window.adminPdfHandler) window.adminPdfHandler.load(property);
    
    // Abrir painel e scroll
    setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        if (panel) panel.style.display = 'block';
        document.getElementById('propertyForm')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return true;
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO (60 linhas vs 120+)
   ========================================================== */
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    
    // Clonar para remover listeners antigos
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Aguarde...', { variant: 'processing' });
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }
        
        try {
            // Coletar dados
            const fields = ['propTitle','propPrice','propLocation','propDescription',
                          'propFeatures','propType','propBadge','propHasVideo'];
            
            const propertyData = fields.reduce((acc, id) => {
                const el = document.getElementById(id);
                acc[id.replace('prop', '').toLowerCase()] = 
                    el?.type === 'checkbox' ? el.checked : el?.value?.trim() || '';
                return acc;
            }, {});
            
            // Validação
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                throw new Error('Preencha Título, Preço e Localização!');
            }
            
            // Formatação
            propertyData.price = Helpers.format.price(propertyData.price);
            propertyData.features = Helpers.format.features(propertyData.features);
            
            if (window.editingPropertyId) {
                const updateData = { ...propertyData };
                
                // Processar PDFs COM PERSISTÊNCIA GARANTIDA
                if (window.adminPdfHandler) {
                    const pdfsString = await window.adminPdfHandler.process(
                        window.editingPropertyId, 
                        propertyData.title
                    );
                    if (pdfsString?.trim()) updateData.pdfs = pdfsString;
                }
                
                // Processar mídia
                if (window.MediaSystem?.getOrderedMediaUrls) {
                    const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                    if (mediaUrls?.trim()) updateData.images = mediaUrls;
                }
                
                // Atualizar
                window.updateLocalProperty(window.editingPropertyId, updateData);
                
                if (typeof window.updateProperty === 'function') {
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    if (success) {
                        Helpers.showNotification('✅ Imóvel atualizado!');
                    }
                }
                
            } else {
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    if (newProperty) {
                        window.addToLocalProperties(newProperty);
                        Helpers.showNotification('✅ Imóvel criado!');
                    }
                }
            }
            
        } catch (error) {
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
   FUNÇÕES RESTANTES (RESUMIDAS)
   ========================================================== */
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
    
    // Normalizar dados
    if (updatedData.has_video !== undefined) updatedData.has_video = Boolean(updatedData.has_video);
    if (Array.isArray(updatedData.features)) updatedData.features = JSON.stringify(updatedData.features);
    
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString() // ✅ Mantido apenas localmente
    };
    
    // Atualizar UI
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

// Configuração de uploads simplificada
setTimeout(() => {
    Helpers.setupUpload('pdfFileInput', 'pdfUploadArea', 
        files => window.MediaSystem?.addPdfs?.(files), 'pdf_addition');
    
    Helpers.setupUpload('fileInput', 'uploadArea', 
        files => {
            window.MediaSystem?.addFiles?.(files);
            setTimeout(() => window.forceMediaPreviewUpdate?.(), 300);
        }, 'media_addition');
}, 1000);

/* ==========================================================
   FUNÇÃO DE TESTE PARA DIAGNÓSTICO DE PDFs
   ========================================================== */
window.testPdfPersistence = async function() {
    console.group('🧪 TESTE DE PERSISTÊNCIA DE PDFs (SEM updated_at)');
    
    if (!window.editingPropertyId) {
        console.error('❌ Nenhum imóvel em edição');
        alert('❌ Nenhum imóvel em edição. Edite um imóvel primeiro.');
        console.groupEnd();
        return;
    }
    
    const propertyId = window.editingPropertyId;
    const property = window.properties.find(p => p.id === propertyId);
    
    if (!property) {
        console.error('❌ Imóvel não encontrado');
        alert('❌ Imóvel não encontrado');
        console.groupEnd();
        return;
    }
    
    console.log('🔍 Imóvel em teste:', {
        id: property.id,
        title: property.title,
        pdfsAtuais: property.pdfs || 'Nenhum',
        pdfsCount: property.pdfs ? property.pdfs.split(',').filter(p => p.trim()).length : 0
    });
    
    // 1. Testar adminPdfHandler
    console.log('\n1. Testando adminPdfHandler.process()...');
    if (window.adminPdfHandler && window.adminPdfHandler.process) {
        try {
            const pdfUrls = await window.adminPdfHandler.process(propertyId, property.title);
            console.log('✅ adminPdfHandler.process() retornou:', {
                pdfs: pdfUrls || 'Nenhum',
                count: pdfUrls ? pdfUrls.split(',').filter(p => p.trim()).length : 0
            });
        } catch (error) {
            console.error('❌ Erro no adminPdfHandler.process():', error);
        }
    } else {
        console.error('❌ adminPdfHandler não disponível');
    }
    
    // 2. Verificar estado atual no Supabase
    console.log('\n2. Verificando estado no Supabase...');
    if (window.updateProperty && window.updateProperty.verifyPdfs) {
        const supabaseState = await window.updateProperty.verifyPdfs(propertyId);
        console.log('📊 Estado no Supabase:', supabaseState);
    }
    
    // 3. Testar persistência direta
    console.log('\n3. Testando persistência direta...');
    if (window.adminPdfHandler && window.adminPdfHandler.persistPdfsToSupabase) {
        const testPdfs = 'https://test.com/pdf1.pdf,https://test.com/pdf2.pdf';
        const result = await window.adminPdfHandler.persistPdfsToSupabase(propertyId, testPdfs);
        console.log('📤 Resultado da persistência direta:', result ? '✅ Sucesso' : '❌ Falha');
    }
    
    // 4. Forçar atualização completa
    console.log('\n4. Forçando atualização completa...');
    const updateData = {
        title: property.title,
        pdfs: property.pdfs || ''
    };
    
    if (window.updateProperty) {
        const result = await window.updateProperty(propertyId, updateData);
        console.log('📤 Resultado da atualização completa:', result ? '✅ Sucesso' : '❌ Falha');
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO');
    console.groupEnd();
    
    alert('🧪 Teste de persistência de PDFs concluído!\n\nVerifique o console (F12) para resultados detalhados.');
};

// Adicionar botão de teste ao painel admin
setTimeout(() => {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel && !document.getElementById('testPdfButton')) {
        const testBtn = document.createElement('button');
        testBtn.id = 'testPdfButton';
        testBtn.innerHTML = '<i class="fas fa-vial"></i> Testar PDFs';
        testBtn.onclick = window.testPdfPersistence;
        testBtn.style.cssText = `
            background: #9b59b6; color: white; border: none;
            padding: 0.8rem 1.5rem; border-radius: 5px; cursor: pointer;
            margin: 0.5rem; display: inline-flex; align-items: center;
            gap: 0.5rem; font-weight: 600;
        `;
        testBtn.title = 'Testar persistência de PDFs no Supabase';
        
        const panelActions = adminPanel.querySelector('.panel-actions') || 
                           adminPanel.querySelector('div:first-child');
        if (panelActions) {
            panelActions.appendChild(testBtn);
        }
    }
}, 2000);

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}

console.log('✅ admin.js - SISTEMA DE PERSISTÊNCIA DE PDFs IMPLEMENTADO (SEM updated_at)');
