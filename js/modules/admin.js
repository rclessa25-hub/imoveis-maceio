// js/modules/admin.js - SISTEMA ADMIN COMPLETO E CORRIGIDO
console.log('🔧 admin.js - SISTEMA CORRIGIDO carregado');

/* ==========================================================
   CONFIGURAÇÃO E CONSTANTES
   ========================================================== */
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

const DEBUG = true;
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
        },
        
        // ✅ NOVO: Resetar todos os campos do formulário
        resetFormFields: function() {
            console.log('🧹 Resetando todos os campos do formulário');
            
            const fields = [
                'propTitle', 'propPrice', 'propLocation', 'propDescription',
                'propFeatures', 'propType', 'propBadge'
            ];
            
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'select-one') {
                        el.value = el.id === 'propType' ? 'residencial' : 'Novo';
                    } else if (el.type === 'checkbox') {
                        el.checked = false;
                    } else {
                        el.value = '';
                    }
                }
            });
            
            // Checkbox específico
            const hasVideoCheckbox = document.getElementById('propHasVideo');
            if (hasVideoCheckbox) hasVideoCheckbox.checked = false;
            
            console.log('✅ Campos do formulário resetados');
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
   FUNÇÃO PARA LIMPAR COMPLETAMENTE O FORMULÁRIO
   ========================================================== */
window.resetAdminFormCompletely = function(showNotification = true) {
    console.group('🧹 RESET COMPLETO DO FORMULÁRIO');
    
    // 1. Limpar estado global
    window.editingPropertyId = null;
    autoSaveTimeout = null;
    pendingAutoSave = false;
    
    // 2. Limpar todos os campos do formulário
    Helpers.updateUI.resetFormFields();
    
    // 3. Resetar MediaSystem COMPLETAMENTE
    if (window.MediaSystem) {
        console.log('🧹 Resetando MediaSystem completamente');
        
        if (typeof window.MediaSystem.resetState === 'function') {
            window.MediaSystem.resetState();
        } else if (window.MediaSystem.state) {
            window.MediaSystem.state = { files: [], pdfs: [], deleted: [] };
        }
        
        // Limpar previews visualmente
        ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
        
        if (window.MediaSystem.updateUI) {
            window.MediaSystem.updateUI();
        }
    }
    
    // 4. Limpar adminPdfHandler
    if (window.adminPdfHandler) {
        window.adminPdfHandler.clear();
    }
    
    // 5. Atualizar UI para modo "novo imóvel"
    Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
    Helpers.updateUI.submitButton(false);
    Helpers.updateUI.cancelButton(false);
    
    // 6. Scroll para topo do formulário
    setTimeout(() => {
        const form = document.getElementById('propertyForm');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    console.log('✅ Formulário resetado completamente para novo imóvel');
    
    if (showNotification) {
        Helpers.showNotification('✅ Formulário limpo para novo imóvel', 'info');
    }
    
    console.groupEnd();
    return true;
};

/* ==========================================================
   SISTEMA DE PDFs (mantido igual)
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
    
    process: async function(id, title) {
        console.group('[adminPdfHandler] PROCESSANDO PDFs DEFINITIVAMENTE');
        console.log('📋 Parâmetros:', { id, tipoId: typeof id, title });
        
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
            
            if (pdfUrls?.trim()) {
                const validId = this.validateIdForSupabase(id);
                
                if (validId) {
                    const persistSuccess = await this.persistPdfsToSupabase(validId, pdfUrls);
                    if (persistSuccess) {
                        console.log('✅ PDFs persistidos com SUCESSO no Supabase!');
                        
                        if (window.MediaSystem?.state?.pdfs) {
                            window.MediaSystem.state.pdfs.forEach(pdf => {
                                if (pdfUrls.includes(pdf.url)) {
                                    pdf.uploaded = true;
                                    console.log(`🏷️ Marcado PDF como enviado: ${pdf.name}`);
                                }
                            });
                        }
                    }
                }
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
        
        try {
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ pdfs: pdfUrls })
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
        
        if (!propertyId) return null;
        
        if (typeof propertyId === 'number' && !isNaN(propertyId) && propertyId > 0) {
            console.log(`✅ ID já é numérico válido: ${propertyId}`);
            return propertyId;
        }
        
        if (typeof propertyId === 'string') {
            const cleanId = propertyId.replace('test_id_', '').replace('temp_', '').replace(/[^0-9]/g, '');
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
    
    isAvailable: function() {
        return !!(window.MediaSystem || window.PdfSystem);
    }
};

/* ==========================================================
   TOGGLE ADMIN PANEL - SEMPRE LIMPO
   ========================================================== */
window.toggleAdminPanel = function() {
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha:");
    if (password === null) return;
    if (password === "") return alert('⚠️ Campo vazio!');
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            
            if (!isVisible) {
                console.log('🆕 Admin aberto - Resetando formulário...');
                window.resetAdminFormCompletely(false);
            }
            
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
   FUNÇÃO EDIT PROPERTY - CORRIGIDA
   ========================================================== */
window.editProperty = function(id) {
    const property = window.properties?.find(p => p.id === id);
    if (!property) return alert('❌ Imóvel não encontrado!');
    
    // Primeiro limpar completamente
    window.resetAdminFormCompletely(false);
    
    // Agora preencher com dados do imóvel
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
    
    // Atualizar UI para modo edição
    Helpers.updateUI.formTitle(`Editando: ${property.title}`);
    Helpers.updateUI.submitButton(true);
    Helpers.updateUI.cancelButton(true);
    
    window.editingPropertyId = property.id;
    
    // Carregar mídia e PDFs
    if (window.MediaSystem) MediaSystem.loadExisting(property);
    if (window.adminPdfHandler) window.adminPdfHandler.load(property);
    
    // Abrir painel
    setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        if (panel) panel.style.display = 'block';
        document.getElementById('propertyForm')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return true;
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO - CORRIGIDA
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
        const originalBtnText = submitBtn?.innerHTML;
        
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
                // 🔄 MODO EDIÇÃO
                console.log(`✏️ Salvando edição do imóvel ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // Processar PDFs
                if (window.adminPdfHandler) {
                    try {
                        const hasNewPdfs = window.MediaSystem?.state?.pdfs?.some(pdf => !pdf.uploaded);
                        
                        if (hasNewPdfs) {
                            console.log('📤 Processando PDFs para edição');
                            const pdfsString = await window.adminPdfHandler.process(
                                window.editingPropertyId, 
                                propertyData.title
                            );
                            if (pdfsString?.trim()) {
                                updateData.pdfs = pdfsString;
                            }
                        } else {
                            // Usar PDFs já existentes
                            const existingPdfs = window.MediaSystem?.state?.pdfs?.filter(pdf => pdf.uploaded) || [];
                            if (existingPdfs.length > 0) {
                                const pdfUrls = existingPdfs.map(pdf => pdf.url).join(',');
                                updateData.pdfs = pdfUrls;
                                console.log(`💾 Usando ${existingPdfs.length} PDF(s) existente(s)`);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Erro ao processar PDFs:', error);
                    }
                }
                
                // Processar imagens
                if (window.MediaSystem?.getOrderedMediaUrls) {
                    const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                    if (mediaUrls?.trim()) updateData.images = mediaUrls;
                }
                
                // Atualizar localmente
                window.updateLocalProperty(window.editingPropertyId, updateData);
                
                // Atualizar no Supabase
                if (typeof window.updateProperty === 'function') {
                    const validId = window.adminPdfHandler?.validateIdForSupabase?.(window.editingPropertyId);
                    const idToUse = validId || window.editingPropertyId;
                    
                    const success = await window.updateProperty(idToUse, updateData);
                    if (success) {
                        Helpers.showNotification('✅ Imóvel atualizado com sucesso!');
                        
                        // ✅ CRÍTICO: APÓS SALVAR EDIÇÃO, LIMPAR PARA NOVO IMÓVEL
                        setTimeout(() => {
                            console.log('🔄 Finalizada edição - Resetando para novo imóvel');
                            window.resetAdminFormCompletely(true);
                        }, 800);
                    }
                }
                
            } else {
                // ➕ MODO NOVO IMÓVEL
                console.log('➕ Criando novo imóvel');
                
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    if (newProperty) {
                        window.addToLocalProperties(newProperty);
                        Helpers.showNotification('✅ Imóvel criado com sucesso!');
                        
                        // ✅ CRÍTICO: APÓS CRIAR NOVO, LIMPAR FORMULÁRIO
                        setTimeout(() => {
                            console.log('🔄 Imóvel criado - Resetando formulário');
                            window.resetAdminFormCompletely(true);
                        }, 800);
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
   SETUP ADMIN UI
   ========================================================== */
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
            if (confirm('Cancelar edição? Todos os dados não salvos serão perdidos.')) {
                window.resetAdminFormCompletely(true);
            }
        });
    }
    
    // Adicionar botão de limpeza manual
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && !document.getElementById('manualResetBtn')) {
            const resetBtn = document.createElement('button');
            resetBtn.id = 'manualResetBtn';
            resetBtn.innerHTML = '<i class="fas fa-broom"></i> Limpar Tudo';
            resetBtn.onclick = function(e) {
                e.preventDefault();
                if (confirm('Limpar completamente o formulário?\n\nTodos os dados não salvos serão perdidos.')) {
                    window.resetAdminFormCompletely(true);
                }
            };
            
            resetBtn.style.cssText = `
                background: #95a5a6; color: white; border: none;
                padding: 0.6rem 1rem; border-radius: 5px; cursor: pointer;
                margin: 0.5rem; font-size: 0.9rem; display: inline-flex;
                align-items: center; gap: 0.5rem;
            `;
            
            const panelActions = adminPanel.querySelector('div:first-child');
            if (panelActions) panelActions.appendChild(resetBtn);
        }
    }, 1000);
    
    if (typeof window.setupForm === 'function') window.setupForm();
    
    const style = document.createElement('style');
    style.textContent = `
        #propertiesContainer.updating .property-card { opacity: 0.7; transition: opacity 0.3s; }
        .auto-save-notification { animation: slideInRight 0.3s ease; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        #manualResetBtn:hover { background: #7f8c8d !important; }
    `;
    document.head.appendChild(style);
};

/* ==========================================================
   FUNÇÕES RESTANTES (mantidas iguais)
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

/* ==========================================================
   FUNÇÃO DE AUTO-SALVAMENTO (simplificada)
   ========================================================== */
window.triggerAutoSave = function(reason = 'media_deletion') {
    if (!window.editingPropertyId) return;
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(async () => {
        if (!pendingAutoSave) return;
        
        console.log('🔍 Auto-salvamento:', {
            editingId: window.editingPropertyId,
            reason: reason
        });
        
        try {
            // Coletar dados básicos (sem processar PDFs para não interferir)
            const fields = ['propTitle','propPrice','propLocation','propDescription'];
            const propertyData = fields.reduce((acc, id) => {
                const el = document.getElementById(id);
                acc[id.replace('prop', '').toLowerCase()] = el?.value?.trim() || '';
                return acc;
            }, {});
            
            if (propertyData.title && propertyData.price && propertyData.location) {
                console.log('✅ Dados válidos para auto-salvamento');
                // Aqui poderia salvar mudanças menores automaticamente
            }
            
        } catch (error) {
            console.error('Auto-salvamento falhou:', error);
        } finally {
            pendingAutoSave = false;
        }
    }, 2000);
    
    pendingAutoSave = true;
};

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}

console.log('✅ admin.js - SISTEMA COMPLETO E CORRIGIDO IMPLEMENTADO');
