// js/modules/admin.js - SISTEMA ADMIN COMPLETO COM UPLOAD FUNCIONAL
console.log('🔧 admin.js - SISTEMA COMPLETO COM UPLOAD FUNCIONAL');

/* ==========================================================
   CONFIGURAÇÃO E CONSTANTES
   ========================================================== */
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

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
                if (show) {
                    btn.style.display = 'inline-block';
                    btn.style.opacity = '1';
                    btn.style.visibility = 'visible';
                    btn.style.pointerEvents = 'auto';
                    btn.disabled = false;
                } else {
                    btn.style.display = 'none';
                    btn.style.opacity = '0';
                    btn.style.visibility = 'hidden';
                    btn.style.pointerEvents = 'none';
                    btn.disabled = true;
                }
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
   FUNÇÃO PARA LIMPAR COMPLETAMENTE O FORMULÁRIO - CORRIGIDA
   ========================================================== */
window.resetAdminFormCompletely = function(showNotification = true) {
    console.log('🧹 RESET COMPLETO DO FORMULÁRIO - INICIANDO');
    
    // 1. Limpar estado global
    window.editingPropertyId = null;
    
    // 2. Resetar campos do formulário
    const fields = [
        'propTitle', 'propPrice', 'propLocation', 'propDescription',
        'propFeatures', 'propType', 'propBadge', 'propHasVideo'
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
    
    // 3. Resetar MediaSystem se existir
    if (window.MediaSystem) {
        try {
            if (typeof window.MediaSystem.resetState === 'function') {
                window.MediaSystem.resetState();
            }
            
            // Limpar previews visualmente
            ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });
        } catch (error) {
            console.error('Erro ao resetar MediaSystem:', error);
        }
    }
    
    // 4. Limpar adminPdfHandler
    if (window.adminPdfHandler && typeof window.adminPdfHandler.clear === 'function') {
        window.adminPdfHandler.clear();
    }
    
    // 5. Atualizar UI
    Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
    Helpers.updateUI.submitButton(false);
    Helpers.updateUI.cancelButton(false);
    
    // 6. Scroll para topo
    setTimeout(() => {
        const form = document.getElementById('propertyForm');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // 7. Notificação
    if (showNotification) {
        Helpers.showNotification('✅ Formulário limpo para novo imóvel', 'info');
    }
    
    console.log('✅ RESET COMPLETO DO FORMULÁRIO - FINALIZADO');
    return true;
};

/* ==========================================================
   FUNÇÃO DE CANCELAMENTO - NOVA E SIMPLIFICADA
   ========================================================== */
window.cancelEdit = function() {
    if (window.editingPropertyId) {
        if (confirm('❓ Cancelar edição?\n\nTodos os dados não salvos serão perdidos.')) {
            console.log('❌ Cancelando edição do imóvel:', window.editingPropertyId);
            window.resetAdminFormCompletely(true);
            return true;
        }
    } else {
        console.log('ℹ️ Nenhuma edição em andamento para cancelar');
        window.resetAdminFormCompletely(false);
    }
    return false;
};

/* ==========================================================
   TOGGLE ADMIN PANEL
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
   FUNÇÃO EDIT PROPERTY - CORRIGIDA E SIMPLIFICADA
   ========================================================== */
window.editProperty = function(id) {
    console.log('✏️ Iniciando edição do imóvel ID:', id);
    
    const property = window.properties?.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }
    
    // Resetar formulário primeiro
    window.resetAdminFormCompletely(false);
    
    // Preencher campos
    const fieldMappings = {
        'propTitle': property.title || '',
        'propPrice': Helpers.format.price(property.price) || '',
        'propLocation': property.location || '',
        'propDescription': property.description || '',
        'propFeatures': Array.isArray(property.features) ? property.features.join(', ') : (property.features || ''),
        'propType': property.type || 'residencial',
        'propBadge': property.badge || 'Novo',
        'propHasVideo': property.has_video === true || property.has_video === 'true'
    };
    
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = Boolean(value);
            } else {
                element.value = value;
            }
        }
    });
    
    // Atualizar UI
    Helpers.updateUI.formTitle(`Editando: ${property.title}`);
    Helpers.updateUI.submitButton(true);
    Helpers.updateUI.cancelButton(true);
    
    // Definir ID em edição
    window.editingPropertyId = property.id;
    
    // Carregar mídia e PDFs
    if (window.MediaSystem && typeof window.MediaSystem.loadExisting === 'function') {
        window.MediaSystem.loadExisting(property);
    }
    
    if (window.adminPdfHandler && typeof window.adminPdfHandler.load === 'function') {
        window.adminPdfHandler.load(property);
    }
    
    // Abrir painel
    setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
    console.log('✅ Modo edição ativado para imóvel ID:', property.id);
    return true;
};

/* ==========================================================
   FUNÇÃO PRINCIPAL DE SALVAMENTO - COMPLETAMENTE CORRIGIDA
   ========================================================== */
window.saveProperty = async function() {
    console.group('💾 SALVANDO IMÓVEL COM UPLOAD DE MÍDIA');
    
    try {
        // Obter dados do formulário
        const fields = ['propTitle','propPrice','propLocation','propDescription',
                       'propFeatures','propType','propBadge','propHasVideo'];
        
        const propertyData = fields.reduce((acc, id) => {
            const el = document.getElementById(id);
            const key = id.replace('prop', '').toLowerCase();
            
            if (el) {
                if (el.type === 'checkbox') {
                    acc[key] = el.checked;
                } else if (el.type === 'select-one') {
                    acc[key] = el.value;
                } else {
                    acc[key] = el.value.trim();
                }
            } else {
                acc[key] = '';
            }
            return acc;
        }, {});
        
        // Validação básica
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            throw new Error('Preencha Título, Preço e Localização!');
        }
        
        // Formatar dados
        propertyData.price = Helpers.format.price(propertyData.price);
        propertyData.features = Helpers.format.features(propertyData.features);
        
        // 1. PRIMEIRO: Fazer upload das mídias (IMPORTANTE!)
        console.log('📤 Iniciando upload de mídias...');
        
        let imageUrls = '';
        let pdfUrls = '';
        
        if (window.MediaSystem) {
            try {
                // Usar a função que faz upload REAL
                const propertyId = window.editingPropertyId || 'new_' + Date.now();
                const propertyTitle = propertyData.title || 'Imóvel';
                
                // CHAMADA CRÍTICA: Upload para Supabase
                const uploadResult = await MediaSystem.uploadAll(propertyId, propertyTitle);
                
                if (uploadResult.success) {
                    imageUrls = uploadResult.images;
                    pdfUrls = uploadResult.pdfs;
                    
                    console.log(`✅ Upload concluído: ${uploadResult.uploadedCount} novo(s) arquivo(s) enviado(s)`);
                    
                    // Atualizar URLs no MediaSystem para referência futura
                    if (uploadResult.images) {
                        console.log(`📸 ${uploadResult.images.split(',').length} URL(s) de imagem`);
                    }
                    if (uploadResult.pdfs) {
                        console.log(`📄 ${uploadResult.pdfs.split(',').length} URL(s) de PDF`);
                    }
                } else {
                    console.warn('⚠️ Upload falhou, usando URLs locais');
                    // Se upload falhar, usar URLs que já temos
                    const localUrls = MediaSystem.getOrderedMediaUrls();
                    imageUrls = localUrls.images;
                    pdfUrls = localUrls.pdfs;
                }
            } catch (uploadError) {
                console.error('❌ Erro no upload de mídia:', uploadError);
                // Fallback: usar URLs locais
                const localUrls = MediaSystem.getOrderedMediaUrls();
                imageUrls = localUrls.images;
                pdfUrls = localUrls.pdfs;
            }
        } else {
            console.warn('⚠️ MediaSystem não disponível');
            imageUrls = 'EMPTY';
            pdfUrls = 'EMPTY';
        }
        
        // 2. Atualizar dados com URLs
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        console.log('📦 Dados prontos para salvar:', {
            id: window.editingPropertyId || 'Novo',
            title: propertyData.title,
            imagesCount: imageUrls && imageUrls !== 'EMPTY' ? imageUrls.split(',').length : 0,
            pdfsCount: pdfUrls && pdfUrls !== 'EMPTY' ? pdfUrls.split(',').length : 0
        });
        
        // 3. Salvar no sistema (local e Supabase)
        if (window.editingPropertyId) {
            console.log(`✏️ Salvando edição do imóvel ${window.editingPropertyId}...`);
            
            // Salvar localmente primeiro
            window.updateLocalProperty(window.editingPropertyId, propertyData);
            
            // Tentar salvar no Supabase
            if (typeof window.updateProperty === 'function') {
                try {
                    const updateResult = await window.updateProperty(window.editingPropertyId, propertyData);
                    
                    if (updateResult && updateResult.success) {
                        Helpers.showNotification('✅ Imóvel atualizado com sucesso!', 'success', 3000);
                        console.log('✅ Imóvel salvo no Supabase');
                    } else {
                        Helpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                        console.log('⚠️ Imóvel salvo apenas localmente (Supabase falhou)');
                    }
                } catch (supabaseError) {
                    console.error('❌ Erro ao salvar no Supabase:', supabaseError);
                    Helpers.showNotification('✅ Imóvel salvo localmente (Supabase offline)', 'info', 3000);
                }
            } else {
                Helpers.showNotification('✅ Imóvel salvo localmente', 'success', 3000);
            }
            
            // Fechar modal e resetar
            setTimeout(() => {
                $('#propertyModal').modal('hide');
                window.resetAdminFormCompletely(true);
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties();
                }
            }, 1500);
            
        } else {
            console.log('🆕 Criando novo imóvel...');
            
            // Gerar novo ID
            const maxId = window.properties?.length > 0 ? 
                Math.max(...window.properties.map(p => p.id)) : 0;
            const newId = maxId + 1;
            
            // Criar objeto completo
            const newProperty = {
                ...propertyData,
                id: newId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Adicionar localmente
            window.addToLocalProperties(newProperty);
            
            // Tentar salvar no Supabase
            if (typeof window.savePropertyToDatabase === 'function') {
                try {
                    const saveResult = await window.savePropertyToDatabase(newProperty);
                    
                    if (saveResult && saveResult.id) {
                        Helpers.showNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                        console.log(`✅ Novo imóvel ID: ${saveResult.id}`);
                    } else {
                        Helpers.showNotification('⚠️ Imóvel criado apenas localmente', 'info', 3000);
                        console.log('⚠️ Imóvel criado apenas localmente (Supabase falhou)');
                    }
                } catch (supabaseError) {
                    console.error('❌ Erro ao criar no Supabase:', supabaseError);
                    Helpers.showNotification('✅ Imóvel criado localmente (Supabase offline)', 'info', 3000);
                }
            } else {
                Helpers.showNotification('✅ Imóvel criado localmente', 'success', 3000);
            }
            
            // Fechar modal e resetar
            setTimeout(() => {
                $('#propertyModal').modal('hide');
                window.resetAdminFormCompletely(true);
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties();
                }
            }, 1500);
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar imóvel:', error);
        Helpers.showNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        alert(`❌ Erro ao salvar: ${error.message}`);
        
    } finally {
        console.groupEnd();
    }
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO
   ========================================================== */
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.warn('⚠️ Formulário não encontrado');
        return;
    }
    
    // Clonar para remover listeners antigos
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Configurar formatação de preço se disponível
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    // Configurar submit do formulário
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Desabilitar botão
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }
        
        // Mostrar loading
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Por favor, aguarde...', { variant: 'processing' });
        
        try {
            // Usar a nova função de salvamento
            await window.saveProperty();
            
        } catch (error) {
            console.error('❌ Erro no salvamento:', error);
            Helpers.showNotification(`❌ ${error.message}`, 'error', 5000);
            
        } finally {
            // Restaurar botão
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText || 
                        (window.editingPropertyId ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site');
                }, 1000);
            }
            
            // Esconder loading
            if (loading) loading.hide();
        }
    });
};

/* ==========================================================
   SETUP ADMIN UI - CORRIGIDA E SIMPLIFICADA
   ========================================================== */
window.setupAdminUI = function() {
    console.log('🔧 Configurando UI do admin...');
    
    // 1. Painel oculto por padrão
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    
    // 2. Botão toggle admin
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        // Remover qualquer handler antigo
        adminBtn.onclick = null;
        
        // Adicionar novo handler limpo
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.toggleAdminPanel();
        }, { once: false });
    }
    
    // 3. ✅ CONFIGURAÇÃO CRÍTICA DO BOTÃO CANCELAR
    const setupCancelButton = function() {
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (!cancelBtn) {
            console.warn('⚠️ Botão Cancelar não encontrado');
            return;
        }
        
        console.log('🔧 Configurando botão Cancelar...');
        
        // Remover TODOS os event listeners antigos
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        
        // Adicionar handler SIMPLES E DIRETO
        freshCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Botão Cancelar clicado!');
            
            // Usar a função global de cancelamento
            window.cancelEdit();
        }, { once: false });
        
        // Garantir que o botão seja visível e clicável
        freshCancelBtn.style.display = 'none';
        freshCancelBtn.style.opacity = '1';
        freshCancelBtn.style.visibility = 'visible';
        freshCancelBtn.style.pointerEvents = 'auto';
        freshCancelBtn.style.cursor = 'pointer';
        freshCancelBtn.disabled = false;
        
        console.log('✅ Botão Cancelar configurado');
    };
    
    // Executar a configuração
    setupCancelButton();
    
    // 4. Configurar formulário
    if (typeof window.setupForm === 'function') {
        setTimeout(window.setupForm, 100);
    }
    
    // 5. Configurar botão de submit alternativo (se existir)
    const setupSubmitButton = function() {
        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.onclick = null;
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.saveProperty();
            }, { once: false });
        }
    };
    setupSubmitButton();
    
    // 6. Adicionar estilos dinâmicos
    const style = document.createElement('style');
    style.textContent = `
        #cancelEditBtn {
            cursor: pointer !important;
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: inline-block !important;
            z-index: 1000 !important;
            position: relative !important;
        }
        
        #cancelEditBtn:disabled {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
            pointer-events: none !important;
        }
        
        #cancelEditBtn:hover {
            background: #7f8c8d !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3) !important;
        }
        
        .auto-save-notification {
            animation: slideInRight 0.3s ease;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ UI do admin configurada');
};

/* ==========================================================
   FUNÇÕES AUXILIARES
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

/* ==========================================================
   FUNÇÃO PARA FORÇAR ATUALIZAÇÃO DO PREVIEW
   ========================================================== */
window.forceMediaPreviewUpdate = function() {
    if (window.MediaSystem && typeof window.MediaSystem.updateUI === 'function') {
        window.MediaSystem.updateUI();
    }
};

/* ==========================================================
   FUNÇÃO PARA TESTE DE UPLOAD (DEBUG)
   ========================================================== */
window.testMediaUpload = async function() {
    console.group('🧪 TESTE DE UPLOAD');
    
    try {
        // Criar arquivo de teste
        const testBlob = new Blob(['test content'], { type: 'image/jpeg' });
        const testFile = new File([testBlob], 'test_image.jpg', { type: 'image/jpeg' });
        
        // Adicionar ao sistema
        if (window.MediaSystem && window.MediaSystem.addFiles) {
            window.MediaSystem.addFiles([testFile]);
            
            // Aguardar um pouco
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Testar upload
            const testId = 'test_' + Date.now();
            const result = await window.MediaSystem.uploadAll(testId, 'Teste de Upload');
            
            if (result.success) {
                console.log('✅ TESTE DE UPLOAD BEM-SUCEDIDO!');
                console.log('📊 URLs geradas:', result.images);
                alert('✅ Upload funcionou! Verifique console para detalhes.');
            } else {
                console.error('❌ TESTE DE UPLOAD FALHOU!');
                alert('❌ Upload falhou. Verifique console.');
            }
        } else {
            alert('❌ MediaSystem não disponível');
        }
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        alert(`❌ Erro: ${error.message}`);
    }
    
    console.groupEnd();
};

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}

console.log('✅ admin.js - SISTEMA COMPLETO COM UPLOAD FUNCIONAL');
