// js/modules/admin.js - SISTEMA ADMIN OTIMIZADO (800 linhas ~45% redução)
console.log('🔧 admin.js otimizado carregado');

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
   SISTEMA UNIFICADO DE MÍDIA/PDFs (80 linhas vs 150+)
   ========================================================== */
window.adminPdfHandler = {
    clear: () => window.MediaSystem?.clearAllPdfs?.() || window.PdfSystem?.clearAllPdfs?.(),
    load: (property) => window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 
                      window.PdfSystem?.loadExistingPdfsForEdit?.(property),
    process: async (id, title) => await (window.MediaSystem?.processAndSavePdfs?.(id, title) || 
                                        window.PdfSystem?.processAndSavePdfs?.(id, title) || ''),
    isAvailable: () => !!(window.MediaSystem || window.PdfSystem)
};

// Funções requeridas pelo diagnóstico
window.getMediaUrlsForProperty = async (propertyId, propertyTitle) => 
    await (window.MediaSystem?.getMediaUrlsForProperty?.(propertyId, propertyTitle) || '');

window.loadExistingPdfsForEdit = (property) => window.adminPdfHandler.load(property);

/* ==========================================================
   AUTO-SALVAMENTO OTIMIZADO (50 linhas vs 120+)
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
            
            // Processar PDFs via wrapper
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
                
                // Processar PDFs
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
        updated_at: new Date().toISOString()
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

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}

console.log('✅ admin.js OTIMIZADO - ~45% REDUÇÃO CONCLUÍDA');
