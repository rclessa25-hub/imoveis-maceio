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

const DEBUG = false;

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
                btn.style.display = show ? 'inline-block' : 'none';
                btn.disabled = !show;
                btn.style.opacity = show ? '1' : '0';
                btn.style.pointerEvents = show ? 'auto' : 'none';
            }
        },
        
        resetFormFields: function() {
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
            
            const hasVideoCheckbox = document.getElementById('propHasVideo');
            if (hasVideoCheckbox) hasVideoCheckbox.checked = false;
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
    
    window.editingPropertyId = null;
    autoSaveTimeout = null;
    pendingAutoSave = false;
    
    Helpers.updateUI.resetFormFields();
    
    if (window.MediaSystem) {
        if (typeof window.MediaSystem.resetState === 'function') {
            window.MediaSystem.resetState();
        } else if (window.MediaSystem.state) {
            window.MediaSystem.state = { files: [], pdfs: [], deleted: [] };
        }
        
        ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
        
        if (window.MediaSystem.updateUI) {
            window.MediaSystem.updateUI();
        }
    }
    
    if (window.adminPdfHandler) {
        window.adminPdfHandler.clear();
    }
    
    Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
    Helpers.updateUI.submitButton(false);
    Helpers.updateUI.cancelButton(false);
    
    setTimeout(() => {
        const form = document.getElementById('propertyForm');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
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
        
        if (!id) {
            console.error('❌ ID do imóvel não fornecido!');
            console.groupEnd();
            return '';
        }
        
        try {
            let pdfUrls = '';
            
            if (window.MediaSystem?.processAndSavePdfs) {
                pdfUrls = await window.MediaSystem.processAndSavePdfs(id, title);
            }
            else if (window.PdfSystem?.processAndSavePdfs) {
                pdfUrls = await window.PdfSystem.processAndSavePdfs(id, title);
            }
            
            if (pdfUrls?.trim()) {
                const validId = this.validateIdForSupabase(id);
                
                if (validId) {
                    const persistSuccess = await this.persistPdfsToSupabase(validId, pdfUrls);
                    if (persistSuccess) {
                        if (window.MediaSystem?.state?.pdfs) {
                            window.MediaSystem.state.pdfs.forEach(pdf => {
                                if (pdfUrls.includes(pdf.url)) {
                                    pdf.uploaded = true;
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
        console.log('[adminPdfHandler] Persistindo PDFs no Supabase');
        
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
        if (!propertyId) return null;
        
        if (typeof propertyId === 'number' && !isNaN(propertyId) && propertyId > 0) {
            return propertyId;
        }
        
        if (typeof propertyId === 'string') {
            const cleanId = propertyId.replace('test_id_', '').replace('temp_', '').replace(/[^0-9]/g, '');
            const numericId = parseInt(cleanId);
            
            if (!isNaN(numericId) && numericId > 0) {
                return numericId;
            }
        }
        
        const directConvert = parseInt(propertyId);
        if (!isNaN(directConvert) && directConvert > 0) {
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

    window.resetAdminFormCompletely(false);

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
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.style.opacity = '1';
        cancelBtn.style.pointerEvents = 'auto';
    }
    
    Helpers.updateUI.cancelButton(true);
    window.editingPropertyId = property.id;

    if (window.MediaSystem) MediaSystem.loadExisting(property);
    if (window.adminPdfHandler) window.adminPdfHandler.load(property);

    setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);

    return true;
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO
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
            
            if (window.editingPropertyId) {
                console.log(`✏️ Salvando edição do imóvel ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                if (window.adminPdfHandler) {
                    try {
                        const hasNewPdfs = window.MediaSystem?.state?.pdfs?.some(pdf => !pdf.uploaded);
                        
                        if (hasNewPdfs) {
                            const pdfsString = await window.adminPdfHandler.process(
                                window.editingPropertyId, 
                                propertyData.title
                            );
                            if (pdfsString?.trim()) {
                                updateData.pdfs = pdfsString;
                            }
                        } else {
                            const existingPdfs = window.MediaSystem?.state?.pdfs?.filter(pdf => pdf.uploaded) || [];
                            if (existingPdfs.length > 0) {
                                const pdfUrls = existingPdfs.map(pdf => pdf.url).join(',');
                                updateData.pdfs = pdfUrls;
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
                        Helpers.showNotification('✅ Imóvel atualizado com sucesso!');
                        
                        setTimeout(() => {
                            window.resetAdminFormCompletely(true);
                        }, 800);
                    }
                }
                
            } else {
                console.log('➕ Criando novo imóvel');
                
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    if (newProperty) {
                        window.addToLocalProperties(newProperty);
                        Helpers.showNotification('✅ Imóvel criado com sucesso!');
                        
                        setTimeout(() => {
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
   SETUP ADMIN UI - OTIMIZADA
   ========================================================== */
window.setupAdminUI = function() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        document.querySelector('.admin-toggle').addEventListener('click', (e) => {
            e.preventDefault();
            window.toggleAdminPanel();
        });
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.onclick = null;
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (confirm('Cancelar edição? Os dados não salvos serão perdidos.')) {
                window.resetAdminFormCompletely(true);
            }
        });
    }
    
    if (typeof window.setupForm === 'function') {
        setTimeout(window.setupForm, 100);
    }
};

/* ==========================================================
   FUNÇÕES RESTANTES
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

setTimeout(() => {
    Helpers.setupUpload('pdfFileInput', 'pdfUploadArea', 
        files => window.MediaSystem?.addPdfs?.(files), 'pdf_addition');
    
    Helpers.setupUpload('fileInput', 'uploadArea', 
        files => {
            window.MediaSystem?.addFiles?.(files);
            setTimeout(() => window.forceMediaPreviewUpdate?.(), 300);
        }, 'media_addition');
}, 1000);

window.triggerAutoSave = function(reason = 'media_deletion') {
    if (!window.editingPropertyId) return;
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(async () => {
        if (!pendingAutoSave) return;
        
        try {
            const fields = ['propTitle','propPrice','propLocation','propDescription'];
            const propertyData = fields.reduce((acc, id) => {
                const el = document.getElementById(id);
                acc[id.replace('prop', '').toLowerCase()] = el?.value?.trim() || '';
                return acc;
            }, {});
            
        } catch (error) {
            console.error('Auto-salvamento falhou:', error);
        } finally {
            pendingAutoSave = false;
        }
    }, 2000);
    
    pendingAutoSave = true;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}
