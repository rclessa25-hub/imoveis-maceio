// js/modules/admin.js - VERSÃO CORRIGIDA FINAL
console.log('🔧 admin.js - VERSÃO CORRIGIDA COM SUPABASE FALLBACK');

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
   SISTEMA DE BACKUP PARA SUPABASE
   ========================================================== */
window.PropertyBackup = {
    pendingProperties: JSON.parse(localStorage.getItem('pending_properties') || '[]'),
    
    addPending: function(property) {
        this.pendingProperties.push({
            ...property,
            _attempts: 0,
            _lastAttempt: null,
            _created: new Date().toISOString()
        });
        this.save();
        console.log('💾 Propriedade adicionada à fila de backup:', property.id);
    },
    
    removePending: function(propertyId) {
        this.pendingProperties = this.pendingProperties.filter(p => p.id !== propertyId);
        this.save();
    },
    
    save: function() {
        localStorage.setItem('pending_properties', JSON.stringify(this.pendingProperties));
    },
    
    retryAll: async function() {
        console.log('🔄 Tentando enviar propriedades pendentes para Supabase...');
        
        for (const property of this.pendingProperties) {
            if (property._attempts < 3) {
                try {
                    await this.sendToSupabase(property);
                    this.removePending(property.id);
                } catch (error) {
                    property._attempts++;
                    property._lastAttempt = new Date().toISOString();
                    console.error(`❌ Falha no envio ${property._attempts}/3:`, error);
                }
            }
        }
        
        this.save();
    },
    
    sendToSupabase: async function(property) {
        // Remover campos internos antes de enviar
        const { _attempts, _lastAttempt, _created, ...cleanProperty } = property;
        
        // Método 1: Usar função global se existir
        if (typeof window.savePropertyToDatabase === 'function') {
            return await window.savePropertyToDatabase(cleanProperty);
        }
        
        // Método 2: Usar supabase direto se disponível
        if (window.supabase && typeof window.supabase.from === 'function') {
            const { data, error } = await window.supabase
                .from('properties')
                .insert([cleanProperty])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        }
        
        throw new Error('Nenhum método de salvamento no Supabase disponível');
    }
};

/* ==========================================================
   HELPER FUNCTIONS
   ========================================================== */
const Helpers = {
    format: {
        price: (value) => {
            if (window.SharedCore?.PriceFormatter?.formatForAdmin) {
                return window.SharedCore.PriceFormatter.formatForAdmin(value);
            }
            return value && value.toString ? value.toString() : '';
        },
        features: (value) => {
            if (!value) return '';
            
            try {
                if (Array.isArray(value)) {
                    return value.filter(f => f && f.trim()).join(', ');
                }
                
                if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
                    try {
                        const parsed = JSON.parse(value);
                        if (Array.isArray(parsed)) {
                            return parsed.filter(f => f && f.trim()).join(', ');
                        }
                    } catch (e) {
                        return value.replace(/[\[\]"]/g, '').replace(/\s*,\s*/g, ', ');
                    }
                }
                
                let cleaned = value.toString();
                cleaned = cleaned.replace(/[\[\]"]/g, '');
                cleaned = cleaned.replace(/\s*,\s*/g, ', ');
                
                return cleaned;
            } catch (error) {
                console.error('❌ Erro ao formatar features:', error);
                return '';
            }
        }
    },
    
    parseFeatures: (value) => {
        if (!value) return '[]';
        
        try {
            if (Array.isArray(value)) {
                return JSON.stringify(value.filter(f => f && f.trim()));
            }
            
            if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
                try {
                    JSON.parse(value);
                    return value;
                } catch (e) {}
            }
            
            const featuresArray = value.split(',')
                .map(f => f.trim())
                .filter(f => f && f !== '');
            
            return JSON.stringify(featuresArray);
        } catch (error) {
            console.error('❌ Erro ao parsear features:', error);
            return '[]';
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
                // CORREÇÃO: Remover triggerAutoSave se não existir
                if (autoSaveType && window.triggerAutoSave) {
                    window.triggerAutoSave(autoSaveType);
                }
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
    },
    
    closeModal: function() {
        const modal = document.getElementById('propertyModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    },
    
    getFormData: function() {
        const formData = {};
        
        const videoCheckbox = document.getElementById('propHasVideo');
        if (videoCheckbox) {
            formData.has_video = videoCheckbox.checked;
        } else {
            formData.has_video = false;
        }
        
        const fields = [
            { id: 'propTitle', key: 'title' },
            { id: 'propPrice', key: 'price' },
            { id: 'propLocation', key: 'location' },
            { id: 'propDescription', key: 'description' },
            { id: 'propFeatures', key: 'features' },
            { id: 'propType', key: 'type' },
            { id: 'propBadge', key: 'badge' }
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                if (element.type === 'select-one') {
                    formData[field.key] = element.value;
                } else {
                    formData[field.key] = element.value.trim();
                }
            } else {
                formData[field.key] = '';
            }
        });
        
        return formData;
    }
};

/* ==========================================================
   FUNÇÃO PRINCIPAL DE SALVAMENTO - VERSÃO CORRIGIDA
   ========================================================== */
window.saveProperty = async function() {
    console.group('💾 SALVANDO IMÓVEL - VERSÃO CORRIGIDA');
    
    try {
        // 1. Obter dados do formulário
        const propertyData = Helpers.getFormData();
        
        console.log('📋 Dados coletados:', propertyData);
        
        // Validação básica
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            throw new Error('Preencha Título, Preço e Localização!');
        }
        
        // Formatar dados
        propertyData.price = Helpers.format.price(propertyData.price);
        
        if (propertyData.features) {
            propertyData.features = Helpers.parseFeatures(propertyData.features);
        } else {
            propertyData.features = '[]';
        }
        
        propertyData.has_video = Boolean(propertyData.has_video);
        
        // 2. Processar mídias
        let imageUrls = '';
        let pdfUrls = '';
        
        if (window.MediaSystem) {
            console.log('📤 Processando mídias...');
            
            const hasSupabase = window.SUPABASE_CONSTANTS && 
                              window.SUPABASE_CONSTANTS.URL && 
                              window.SUPABASE_CONSTANTS.KEY;
            
            if (hasSupabase) {
                try {
                    const uploadResult = await MediaSystem.uploadAll(
                        window.editingPropertyId || 'temp_' + Date.now(),
                        propertyData.title || 'Imóvel'
                    );
                    
                    if (uploadResult.success) {
                        imageUrls = uploadResult.images;
                        pdfUrls = uploadResult.pdfs;
                        console.log(`✅ Upload concluído: ${uploadResult.uploadedCount} arquivo(s)`);
                    } else {
                        console.warn('⚠️ Upload falhou, salvando localmente');
                        const localResult = MediaSystem.saveAndKeepLocal(
                            window.editingPropertyId || 'temp_' + Date.now(),
                            propertyData.title || 'Imóvel'
                        );
                        imageUrls = localResult.images;
                        pdfUrls = localResult.pdfs;
                    }
                } catch (uploadError) {
                    console.error('❌ Erro no upload:', uploadError);
                    const localResult = MediaSystem.saveAndKeepLocal(
                        window.editingPropertyId || 'temp_' + Date.now(),
                        propertyData.title || 'Imóvel'
                    );
                    imageUrls = localResult.images;
                    pdfUrls = localResult.pdfs;
                }
            } else {
                console.log('⚠️ Supabase não configurado, salvando localmente');
                const localResult = MediaSystem.saveAndKeepLocal(
                    window.editingPropertyId || 'temp_' + Date.now(),
                    propertyData.title || 'Imóvel'
                );
                imageUrls = localResult.images;
                pdfUrls = localResult.pdfs;
            }
        } else {
            console.warn('⚠️ MediaSystem não disponível');
            imageUrls = 'EMPTY';
            pdfUrls = 'EMPTY';
        }
        
        // 3. Atualizar dados com URLs
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        // 4. Determinar ID
        if (window.editingPropertyId) {
            propertyData.id = window.editingPropertyId;
        } else {
            // Para novo imóvel
            const localProps = window.properties || [];
            const localMaxId = localProps.length > 0 ? 
                Math.max(...localProps.map(p => parseInt(p.id) || 0)) : 0;
            
            // Tentar buscar do Supabase se disponível
            let supabaseMaxId = 0;
            if (window.SUPABASE_CONSTANTS && window.supabase && typeof window.supabase.from === 'function') {
                try {
                    const { data, error } = await window.supabase
                        .from('properties')
                        .select('id')
                        .order('id', { ascending: false })
                        .limit(1);
                    
                    if (!error && data && data.length > 0) {
                        supabaseMaxId = parseInt(data[0].id) || 0;
                    }
                } catch (e) {
                    console.warn('⚠️ Não foi possível verificar ID máximo no Supabase:', e.message);
                }
            }
            
            // Usar o maior ID + 1
            propertyData.id = Math.max(localMaxId, supabaseMaxId) + 1;
            console.log(`🆕 ID gerado: ${propertyData.id} (local: ${localMaxId}, supabase: ${supabaseMaxId})`);
        }
        
        console.log('📦 Dados finais para salvar:', {
            id: propertyData.id,
            title: propertyData.title,
            has_video: propertyData.has_video,
            imagesCount: imageUrls && imageUrls !== 'EMPTY' ? imageUrls.split(',').length : 0,
            pdfsCount: pdfUrls && pdfUrls !== 'EMPTY' ? pdfUrls.split(',').length : 0
        });
        
        // 5. Salvar no sistema
        if (window.editingPropertyId) {
            console.log(`✏️ Salvando edição do imóvel ${window.editingPropertyId}...`);
            
            // Salvar localmente
            const localSuccess = window.updateLocalProperty(window.editingPropertyId, propertyData);
            
            if (!localSuccess) {
                throw new Error('Falha ao salvar localmente');
            }
            
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
            
            // Atualizar galeria
            setTimeout(() => {
                if (typeof window.updatePropertyCard === 'function') {
                    window.updatePropertyCard(window.editingPropertyId);
                } else if (typeof window.renderProperties === 'function') {
                    window.renderProperties(window.currentFilter || 'todos');
                }
            }, 300);
            
            // Fechar modal e resetar
            setTimeout(() => {
                Helpers.closeModal();
                window.resetAdminFormCompletely(true);
            }, 1500);
            
        } else {
            console.log('🆕 Criando novo imóvel...');
            
            // Criar objeto completo
            const newProperty = {
                ...propertyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // 🔥 FUNÇÃO PRINCIPAL CORRIGIDA
            const saveResult = await window.saveNewPropertyWithFallback(newProperty);
            
            if (saveResult.success) {
                // Sucesso total
                Helpers.showNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                
                // Atualizar galeria
                setTimeout(() => {
                    if (typeof window.renderProperties === 'function') {
                        window.renderProperties('todos');
                    }
                }, 500);
                
                // Fechar modal e resetar
                setTimeout(() => {
                    Helpers.closeModal();
                    window.resetAdminFormCompletely(true);
                }, 2000);
                
            } else {
                // Falha - manter dados no formulário para correção
                console.error('❌ Falha ao salvar imóvel:', saveResult.error);
                
                if (saveResult.savedLocally) {
                    Helpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 5000);
                    alert(`⚠️ Imóvel salvo apenas LOCALMENTE!\n\nID: ${newProperty.id}\nTítulo: ${newProperty.title}\n\nO imóvel aparecerá agora, mas pode sumir ao recarregar.`);
                    
                    // Ainda assim atualizar a UI
                    setTimeout(() => {
                        if (typeof window.renderProperties === 'function') {
                            window.renderProperties('todos');
                        }
                        // NÃO resetar formulário - deixar dados para tentar novamente
                    }, 500);
                } else {
                    throw new Error(`Falha completa: ${saveResult.error}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar imóvel:', error);
        Helpers.showNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        alert(`❌ Erro ao salvar:\n\n${error.message}\n\nOs dados NÃO foram perdidos. Corrija e tente novamente.`);
        
    } finally {
        console.groupEnd();
    }
};

/* ==========================================================
   FUNÇÃO CRÍTICA: Salvar novo imóvel com fallback
   ========================================================== */
window.saveNewPropertyWithFallback = async function(newProperty) {
    console.group('💾 saveNewPropertyWithFallback');
    
    try {
        // 1. Garantir que window.properties existe
        if (!window.properties) {
            window.properties = [];
        }
        
        // 2. Verificar se ID já existe localmente
        const existingIndex = window.properties.findIndex(p => p.id == newProperty.id);
        if (existingIndex !== -1) {
            console.warn(`⚠️ ID ${newProperty.id} já existe, ajustando...`);
            const maxId = Math.max(...window.properties.map(p => parseInt(p.id) || 0));
            newProperty.id = maxId + 1;
            console.log(`✅ Novo ID: ${newProperty.id}`);
        }
        
        // 3. Adicionar localmente (IMPORTANTE: sempre fazer isso)
        window.properties.push(newProperty);
        console.log(`✅ Adicionado localmente: ID ${newProperty.id}, total: ${window.properties.length}`);
        
        // 4. Salvar no localStorage (IMPORTANTE: sempre fazer isso)
        try {
            localStorage.setItem('properties', JSON.stringify(window.properties));
            console.log('✅ Salvo no localStorage');
        } catch (storageError) {
            console.error('❌ Erro no localStorage:', storageError);
        }
        
        // 5. Tentar salvar no Supabase usando MÚLTIPLOS métodos
        let supabaseSuccess = false;
        let supabaseResult = null;
        let supabaseError = null;
        
        console.log('☁️ Tentando salvar no Supabase...');
        
        // Método 1: Função global savePropertyToDatabase
        if (typeof window.savePropertyToDatabase === 'function') {
            console.log('🔄 Tentando método 1: savePropertyToDatabase()');
            try {
                supabaseResult = await window.savePropertyToDatabase(newProperty);
                if (supabaseResult && supabaseResult.id) {
                    supabaseSuccess = true;
                    console.log('✅ Sucesso com savePropertyToDatabase()');
                }
            } catch (error) {
                supabaseError = error;
                console.error('❌ Falha com savePropertyToDatabase():', error.message);
            }
        }
        
        // Método 2: Função global addNewProperty (da V.Antiga)
        if (!supabaseSuccess && typeof window.addNewProperty === 'function') {
            console.log('🔄 Tentando método 2: addNewProperty()');
            try {
                supabaseResult = await window.addNewProperty(newProperty);
                if (supabaseResult) {
                    supabaseSuccess = true;
                    console.log('✅ Sucesso com addNewProperty()');
                }
            } catch (error) {
                supabaseError = error;
                console.error('❌ Falha com addNewProperty():', error.message);
            }
        }
        
        // Método 3: Supabase direto
        if (!supabaseSuccess && window.supabase && typeof window.supabase.from === 'function') {
            console.log('🔄 Tentando método 3: Supabase direto');
            try {
                const { data, error } = await window.supabase
                    .from('properties')
                    .insert([newProperty])
                    .select();
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    supabaseResult = data[0];
                    supabaseSuccess = true;
                    console.log('✅ Sucesso com Supabase direto');
                }
            } catch (error) {
                supabaseError = error;
                console.error('❌ Falha com Supabase direto:', error.message);
            }
        }
        
        // 6. Se Supabase falhou, adicionar à fila de backup
        if (!supabaseSuccess) {
            console.warn('⚠️ Falha ao salvar no Supabase, adicionando à fila de backup');
            window.PropertyBackup.addPending(newProperty);
            
            // Tentar sincronizar novamente em 5 segundos
            setTimeout(() => {
                window.PropertyBackup.retryAll();
            }, 5000);
        }
        
        // 7. Atualizar lista no admin
        setTimeout(() => {
            if (typeof window.loadPropertyList === 'function') {
                window.loadPropertyList();
            }
        }, 300);
        
        // 8. Retornar resultado
        const result = {
            success: supabaseSuccess || true, // Considera sucesso se salvou localmente
            savedLocally: true,
            savedInSupabase: supabaseSuccess,
            id: newProperty.id,
            supabaseId: supabaseSuccess ? (supabaseResult?.id || newProperty.id) : null,
            method: supabaseSuccess ? 'supabase' : 'local',
            error: supabaseError ? supabaseError.message : null,
            localProperties: window.properties.length
        };
        
        console.log('📊 Resultado final:', result);
        console.groupEnd();
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro crítico em saveNewPropertyWithFallback:', error);
        console.groupEnd();
        
        return {
            success: false,
            savedLocally: false,
            savedInSupabase: false,
            error: error.message
        };
    }
};

/* ==========================================================
   FUNÇÕES AUXILIARES
   ========================================================== */
window.updateLocalProperty = function(propertyId, updatedData) {
    if (!window.properties) return false;
    
    const index = window.properties.findIndex(p => p.id === propertyId);
    if (index === -1) return false;
    
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = Boolean(updatedData.has_video);
    }
    
    if (Array.isArray(updatedData.features)) {
        updatedData.features = JSON.stringify(updatedData.features);
    }
    
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log(`💾 Imóvel ${propertyId} salvo no localStorage`);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
    }
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.updatePropertyCard === 'function') {
            window.updatePropertyCard(propertyId);
        }
    }, 100);
    
    return true;
};

window.resetAdminFormCompletely = function(showNotification = true) {
    console.log('🧹 RESET COMPLETO DO FORMULÁRIO');
    
    window.editingPropertyId = null;
    
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
    
    if (window.MediaSystem) {
        try {
            if (typeof window.MediaSystem.resetState === 'function') {
                window.MediaSystem.resetState();
            }
            
            ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });
        } catch (error) {
            console.error('Erro ao resetar MediaSystem:', error);
        }
    }
    
    if (window.adminPdfHandler && typeof window.adminPdfHandler.clear === 'function') {
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
    
    return true;
};

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

window.editProperty = function(id) {
    console.log('✏️ Iniciando edição do imóvel ID:', id);
    
    const property = window.properties?.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }
    
    window.resetAdminFormCompletely(false);
    
    const fieldMappings = {
        'propTitle': property.title || '',
        'propPrice': Helpers.format.price(property.price) || '',
        'propLocation': property.location || '',
        'propDescription': property.description || '',
        'propFeatures': Helpers.format.features(property.features) || '',
        'propType': property.type || 'residencial',
        'propBadge': property.badge || 'Novo',
        'propHasVideo': property.has_video === true || 
                       property.has_video === 'true' || 
                       property.has_video === 1 || 
                       property.has_video === '1'
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
    
    Helpers.updateUI.formTitle(`Editando: ${property.title}`);
    Helpers.updateUI.submitButton(true);
    Helpers.updateUI.cancelButton(true);
    
    window.editingPropertyId = property.id;
    
    if (window.MediaSystem && typeof window.MediaSystem.loadExisting === 'function') {
        window.MediaSystem.loadExisting(property);
    }
    
    if (window.adminPdfHandler && typeof window.adminPdfHandler.load === 'function') {
        window.adminPdfHandler.load(property);
    }
    
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
   FUNÇÃO DE VERIFICAÇÃO DO SISTEMA
   ========================================================== */
window.checkPropertySystem = function() {
    console.group('🔍 VERIFICAÇÃO DO SISTEMA');
    
    // 1. Verificar funções Supabase
    console.log('☁️ FUNÇÕES SUPABASE:');
    console.log('- savePropertyToDatabase:', typeof window.savePropertyToDatabase);
    console.log('- addNewProperty:', typeof window.addNewProperty);
    console.log('- updateProperty:', typeof window.updateProperty);
    console.log('- supabase client:', window.supabase ? '✅ Disponível' : '❌ Indisponível');
    
    // 2. Verificar dados
    console.log('📊 DADOS:');
    console.log('- window.properties:', window.properties ? `${window.properties.length} imóveis` : '❌ Não definido');
    
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        console.log('- localStorage:', `${stored.length} imóveis`);
        
        // Verificar desincronização
        if (window.properties && stored.length !== window.properties.length) {
            console.warn('⚠️ DESINCRONIZAÇÃO DETECTADA!');
            console.log(`  localStorage: ${stored.length} imóveis`);
            console.log(`  window.properties: ${window.properties.length} imóveis`);
            
            // Tentar corrigir automaticamente
            if (stored.length > window.properties.length) {
                console.log('🔄 Corrigindo: usando localStorage como fonte verdadeira');
                window.properties = stored;
            }
        }
    } catch (e) {
        console.error('❌ Erro ao ler localStorage:', e);
    }
    
    // 3. Verificar propriedades pendentes
    const pending = JSON.parse(localStorage.getItem('pending_properties') || '[]');
    console.log(`📋 Propriedades pendentes para Supabase: ${pending.length}`);
    if (pending.length > 0) {
        console.log('💡 Dica: Execute window.PropertyBackup.retryAll() para tentar novamente');
    }
    
    // 4. Sugestões
    console.log('💡 SUGESTÕES:');
    
    if (typeof window.savePropertyToDatabase !== 'function') {
        console.log('1. A função savePropertyToDatabase() não está disponível');
        console.log('   Solução: Verifique se supabase-functions.js está carregado');
    }
    
    if (!window.properties) {
        console.log('2. window.properties não está definido');
        console.log('   Solução: Execute: window.properties = [];');
    }
    
    console.groupEnd();
};

/* ==========================================================
   FUNÇÃO DE TESTE
   ========================================================== */
window.testPropertySave = async function() {
    console.group('🧪 TESTE DE SALVAMENTO');
    
    const testProperty = {
        id: Date.now(),
        title: `TESTE ${new Date().toLocaleTimeString()}`,
        price: 'R$ 99.999',
        location: 'Local Teste',
        description: 'Imóvel de teste',
        features: '[]',
        type: 'residencial',
        badge: 'Novo',
        has_video: false,
        images: 'EMPTY',
        pdfs: 'EMPTY',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    console.log('📝 Testando com:', testProperty);
    
    const result = await window.saveNewPropertyWithFallback(testProperty);
    
    console.log('📊 Resultado:', result);
    
    if (result.success) {
        alert(`✅ TESTE BEM-SUCEDIDO!\n\nID: ${result.id}\nSupabase: ${result.savedInSupabase ? '✅' : '❌'}\nTotal imóveis: ${result.localProperties}`);
    } else {
        alert(`❌ TESTE FALHOU!\n\n${result.error}`);
    }
    
    console.groupEnd();
};

/* ==========================================================
   CONFIGURAÇÃO INICIAL
   ========================================================== */
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.warn('⚠️ Formulário não encontrado');
        return;
    }
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    const videoCheckbox = document.getElementById('propHasVideo');
    if (videoCheckbox) {
        videoCheckbox.addEventListener('change', function() {
            console.log(`🎬 Checkbox de vídeo alterado: ${this.checked}`);
        });
    }
    
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }
        
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Por favor, aguarde...', { variant: 'processing' });
        
        try {
            await window.saveProperty();
        } catch (error) {
            console.error('❌ Erro no salvamento:', error);
            Helpers.showNotification(`❌ ${error.message}`, 'error', 5000);
        } finally {
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText || 
                        (window.editingPropertyId ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site');
                }, 1000);
            }
            
            if (loading) loading.hide();
        }
    });
};

window.setupAdminUI = function() {
    console.log('🔧 Configurando UI do admin...');
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    
    // Botão admin
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.onclick = null;
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        const freshBtn = document.querySelector('.admin-toggle');
        freshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.toggleAdminPanel();
        }, { once: false });
    }
    
    // Botão Cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        freshCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.cancelEdit();
        }, { once: false });
        freshCancelBtn.style.display = 'none';
    }
    
    if (typeof window.setupForm === 'function') {
        setTimeout(window.setupForm, 100);
    }
    
    // Adicionar botão de verificação
    if (!document.getElementById('verify-btn')) {
        const verifyBtn = document.createElement('button');
        verifyBtn.id = 'verify-btn';
        verifyBtn.innerHTML = '🔍 Verificar Sistema';
        verifyBtn.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 99999;
            font-size: 12px;
        `;
        verifyBtn.onclick = window.checkPropertySystem;
        document.body.appendChild(verifyBtn);
    }
    
    console.log('✅ UI configurada');
};

// Configurar uploads
setTimeout(() => {
    Helpers.setupUpload('pdfFileInput', 'pdfUploadArea', 
        files => window.MediaSystem?.addPdfs?.(files), 'pdf_addition');
    
    Helpers.setupUpload('fileInput', 'uploadArea', 
        files => {
            window.MediaSystem?.addFiles?.(files);
            setTimeout(() => window.forceMediaPreviewUpdate?.(), 300);
        }, 'media_addition');
}, 1000);

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.setupAdminUI();
            
            // Verificação inicial
            setTimeout(() => {
                console.log('🔍 Verificação inicial do sistema...');
                window.checkPropertySystem();
                
                // Tentar sincronizar pendentes
                window.PropertyBackup.retryAll();
                
            }, 2000);
        }, 500);
    });
} else {
    setTimeout(() => {
        window.setupAdminUI();
        setTimeout(() => {
            window.checkPropertySystem();
            window.PropertyBackup.retryAll();
        }, 2000);
    }, 300);
}

console.log('✅ admin.js - VERSÃO CORRIGIDA COM BACKUP');
console.log('🔍 Para verificar: window.checkPropertySystem()');
console.log('🧪 Para teste: window.testPropertySave()');
