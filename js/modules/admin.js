// js/modules/admin.js - VERSÃO CORRIGIDA COM DIAGNÓSTICO
console.log('🔧 admin.js - VERSÃO CORRIGIDA COM SISTEMA DE DIAGNÓSTICO');

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
   SISTEMA DE DIAGNÓSTICO
   ========================================================== */
window.PropertyDiagnostic = {
    logs: [],
    
    log: function(step, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            step: step,
            data: data,
            stack: new Error().stack.split('\n').slice(2, 6).join('\n')
        };
        
        this.logs.push(logEntry);
        console.log(`🔍 [${step}]`, data);
        
        // Exibir no DOM para fácil visualização (apenas em debug)
        if (window.location.search.includes('debug=property')) {
            this.updateDiagnosticUI(step, data);
        }
    },
    
    updateDiagnosticUI: function(step, data) {
        let diagnosticDiv = document.getElementById('property-diagnostic');
        if (!diagnosticDiv) {
            diagnosticDiv = document.createElement('div');
            diagnosticDiv.id = 'property-diagnostic';
            diagnosticDiv.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                width: 400px;
                max-height: 300px;
                background: rgba(0,0,0,0.9);
                color: #0f0;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                overflow-y: auto;
                z-index: 99999;
                border: 2px solid #0f0;
                border-radius: 5px;
            `;
            document.body.appendChild(diagnosticDiv);
        }
        
        const entry = document.createElement('div');
        entry.innerHTML = `<strong>${new Date().toLocaleTimeString()}: ${step}</strong><br>${JSON.stringify(data, null, 2)}`;
        diagnosticDiv.appendChild(entry);
        diagnosticDiv.scrollTop = diagnosticDiv.scrollHeight;
    },
    
    getDiagnosticReport: function() {
        return {
            totalLogs: this.logs.length,
            lastOperation: this.logs.slice(-5),
            windowProperties: window.properties ? window.properties.length : 0,
            localStorageProperties: JSON.parse(localStorage.getItem('properties') || '[]').length,
            supabaseConfig: !!window.SUPABASE_CONSTANTS,
            editingMode: !!window.editingPropertyId
        };
    }
};

/* ==========================================================
   HELPER FUNCTIONS - CORRIGIDAS COM DIAGNÓSTICO
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
            PropertyDiagnostic.log('format.features', { input: value, type: typeof value });
            
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
                        console.warn('⚠️ Erro ao parsear JSON de features:', e);
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
        PropertyDiagnostic.log('parseFeatures', { input: value });
        
        if (!value) return '[]';
        
        try {
            if (Array.isArray(value)) {
                return JSON.stringify(value.filter(f => f && f.trim()));
            }
            
            if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
                try {
                    JSON.parse(value);
                    return value;
                } catch (e) {
                    // Se inválido, processar como string normal
                }
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
        PropertyDiagnostic.log('getFormData', 'Iniciando captura de dados');
        
        const formData = {};
        
        // 1. Capturar campo de vídeo
        const videoCheckbox = document.getElementById('propHasVideo');
        if (videoCheckbox) {
            formData.has_video = videoCheckbox.checked;
            PropertyDiagnostic.log('getFormData.checkbox', { checked: videoCheckbox.checked });
        } else {
            formData.has_video = false;
        }
        
        // 2. Capturar outros campos
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
        
        PropertyDiagnostic.log('getFormData.result', formData);
        return formData;
    }
};

/* ==========================================================
   FUNÇÃO PRINCIPAL DE SALVAMENTO - CORRIGIDA
   ========================================================== */
window.saveProperty = async function() {
    PropertyDiagnostic.log('saveProperty.start', {
        editing: !!window.editingPropertyId,
        timestamp: new Date().toISOString()
    });
    
    try {
        // 1. Obter dados do formulário
        const propertyData = Helpers.getFormData();
        
        PropertyDiagnostic.log('saveProperty.formData', {
            title: propertyData.title,
            price: propertyData.price,
            location: propertyData.location,
            has_video: propertyData.has_video
        });
        
        // Validação básica
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            throw new Error('Preencha Título, Preço e Localização!');
        }
        
        // Formatar dados
        propertyData.price = Helpers.format.price(propertyData.price);
        
        // Converter features para JSON
        if (propertyData.features) {
            propertyData.features = Helpers.parseFeatures(propertyData.features);
        } else {
            propertyData.features = '[]';
        }
        
        // Garantir que has_video seja booleano
        propertyData.has_video = Boolean(propertyData.has_video);
        
        PropertyDiagnostic.log('saveProperty.formatted', {
            formattedPrice: propertyData.price,
            formattedFeatures: propertyData.features,
            formattedVideo: propertyData.has_video
        });
        
        // 2. Processar mídias
        let imageUrls = '';
        let pdfUrls = '';
        
        if (window.MediaSystem) {
            PropertyDiagnostic.log('saveProperty.media.start', 'Processando mídias');
            
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
                        PropertyDiagnostic.log('saveProperty.media.success', {
                            uploadedCount: uploadResult.uploadedCount,
                            images: imageUrls ? imageUrls.split(',').length : 0,
                            pdfs: pdfUrls ? pdfUrls.split(',').length : 0
                        });
                    } else {
                        PropertyDiagnostic.log('saveProperty.media.fallback', 'Usando salvamento local');
                        const localResult = MediaSystem.saveAndKeepLocal(
                            window.editingPropertyId || 'temp_' + Date.now(),
                            propertyData.title || 'Imóvel'
                        );
                        imageUrls = localResult.images;
                        pdfUrls = localResult.pdfs;
                    }
                } catch (uploadError) {
                    PropertyDiagnostic.log('saveProperty.media.error', uploadError.message);
                    const localResult = MediaSystem.saveAndKeepLocal(
                        window.editingPropertyId || 'temp_' + Date.now(),
                        propertyData.title || 'Imóvel'
                    );
                    imageUrls = localResult.images;
                    pdfUrls = localResult.pdfs;
                }
            } else {
                PropertyDiagnostic.log('saveProperty.media.noSupabase', 'Supabase não configurado');
                const localResult = MediaSystem.saveAndKeepLocal(
                    window.editingPropertyId || 'temp_' + Date.now(),
                    propertyData.title || 'Imóvel'
                );
                imageUrls = localResult.images;
                pdfUrls = localResult.pdfs;
            }
        } else {
            PropertyDiagnostic.log('saveProperty.media.unavailable', 'MediaSystem não disponível');
            imageUrls = 'EMPTY';
            pdfUrls = 'EMPTY';
        }
        
        // 3. Atualizar dados com URLs
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        // 4. Determinar ID e tipo de operação
        let operation = 'create';
        
        if (window.editingPropertyId) {
            propertyData.id = window.editingPropertyId;
            operation = 'update';
        } else {
            // Para novo imóvel - usar lógica da V.Antiga que funciona
            operation = 'create';
            
            // Buscar o maior ID existente (local + remoto se possível)
            const localProps = window.properties || [];
            const localMaxId = localProps.length > 0 ? 
                Math.max(...localProps.map(p => parseInt(p.id) || 0)) : 0;
            
            // Tentar buscar do Supabase se disponível
            let supabaseMaxId = 0;
            if (window.SUPABASE_CONSTANTS && window.supabase) {
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
                    PropertyDiagnostic.log('saveProperty.idCheck.error', e.message);
                }
            }
            
            // Usar o maior ID entre local e remoto
            propertyData.id = Math.max(localMaxId, supabaseMaxId) + 1;
            
            PropertyDiagnostic.log('saveProperty.newId', {
                localMaxId,
                supabaseMaxId,
                finalId: propertyData.id,
                localPropsCount: localProps.length
            });
        }
        
        PropertyDiagnostic.log('saveProperty.finalData', {
            id: propertyData.id,
            operation: operation,
            title: propertyData.title,
            hasImages: propertyData.images !== 'EMPTY',
            hasPdfs: propertyData.pdfs !== 'EMPTY'
        });
        
        // 5. Executar operação baseada no tipo
        if (operation === 'update') {
            PropertyDiagnostic.log('saveProperty.update.start', `Atualizando imóvel ${propertyData.id}`);
            
            // Atualizar localmente
            const localSuccess = window.updateLocalProperty(window.editingPropertyId, propertyData);
            
            if (!localSuccess) {
                throw new Error('Falha ao salvar localmente');
            }
            
            // Tentar salvar no Supabase
            const hasSupabase = window.SUPABASE_CONSTANTS && 
                              window.SUPABASE_CONSTANTS.URL && 
                              window.SUPABASE_CONSTANTS.KEY;
            
            if (hasSupabase && typeof window.updateProperty === 'function') {
                try {
                    PropertyDiagnostic.log('saveProperty.update.supabase', 'Enviando para Supabase');
                    const updateResult = await window.updateProperty(window.editingPropertyId, propertyData);
                    
                    if (updateResult && updateResult.success) {
                        Helpers.showNotification('✅ Imóvel atualizado com sucesso!', 'success', 3000);
                        PropertyDiagnostic.log('saveProperty.update.supabaseSuccess', updateResult);
                    } else {
                        Helpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                        PropertyDiagnostic.log('saveProperty.update.supabasePartial', 'Supabase falhou');
                    }
                } catch (supabaseError) {
                    PropertyDiagnostic.log('saveProperty.update.supabaseError', supabaseError.message);
                    Helpers.showNotification('✅ Imóvel salvo localmente (Supabase offline)', 'info', 3000);
                }
            } else {
                Helpers.showNotification('✅ Imóvel salvo localmente', 'success', 3000);
                PropertyDiagnostic.log('saveProperty.update.localOnly', 'Supabase não disponível');
            }
            
            // Atualizar galeria
            setTimeout(() => {
                PropertyDiagnostic.log('saveProperty.update.gallery', 'Atualizando galeria');
                if (typeof window.updatePropertyCard === 'function') {
                    window.updatePropertyCard(window.editingPropertyId);
                } else if (typeof window.renderProperties === 'function') {
                    window.renderProperties(window.currentFilter || 'todos');
                }
            }, 300);
            
            // Fechar modal e resetar APÓS confirmação
            setTimeout(() => {
                Helpers.closeModal();
                window.resetAdminFormCompletely(true);
            }, 2000);
            
        } else {
            // OPERAÇÃO DE CRIAÇÃO - USANDO LÓGICA DA V.ANTIGA QUE FUNCIONA
            PropertyDiagnostic.log('saveProperty.create.start', `Criando novo imóvel ID: ${propertyData.id}`);
            
            // Criar objeto completo
            const newProperty = {
                ...propertyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            PropertyDiagnostic.log('saveProperty.create.object', {
                id: newProperty.id,
                title: newProperty.title,
                timestamp: newProperty.created_at
            });
            
            // 🔥 FUNÇÃO CRÍTICA: ADICIONAR AO SISTEMA (Versão Corrigida)
            const addResult = await window.addNewPropertyCorrected(newProperty);
            
            if (addResult.success) {
                PropertyDiagnostic.log('saveProperty.create.success', {
                    id: addResult.id,
                    method: addResult.method,
                    message: 'Imóvel criado com sucesso'
                });
                
                Helpers.showNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                
                // Atualizar galeria IMEDIATAMENTE
                setTimeout(() => {
                    PropertyDiagnostic.log('saveProperty.create.gallery', 'Atualizando galeria principal');
                    if (typeof window.renderProperties === 'function') {
                        window.renderProperties('todos');
                    }
                }, 500);
                
                // Fechar modal e resetar APÓS confirmação
                setTimeout(() => {
                    Helpers.closeModal();
                    window.resetAdminFormCompletely(true);
                    PropertyDiagnostic.log('saveProperty.create.cleanup', 'Formulário limpo');
                }, 2000);
                
            } else {
                PropertyDiagnostic.log('saveProperty.create.error', addResult.error);
                throw new Error(`Falha ao criar imóvel: ${addResult.error}`);
            }
        }
        
    } catch (error) {
        PropertyDiagnostic.log('saveProperty.error', {
            message: error.message,
            stack: error.stack
        });
        
        console.error('❌ Erro ao salvar imóvel:', error);
        Helpers.showNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        
        // Não resetar formulário em caso de erro - manter dados para correção
        alert(`❌ Erro ao salvar:\n\n${error.message}\n\nOs dados NÃO foram perdidos. Corrija e tente novamente.`);
    } finally {
        PropertyDiagnostic.log('saveProperty.complete', PropertyDiagnostic.getDiagnosticReport());
    }
};

/* ==========================================================
   FUNÇÃO CORRIGIDA PARA ADICIONAR NOVO IMÓVEL
   ========================================================== */
window.addNewPropertyCorrected = async function(newProperty) {
    PropertyDiagnostic.log('addNewPropertyCorrected.start', {
        propertyId: newProperty.id,
        title: newProperty.title,
        windowPropertiesInitial: window.properties ? window.properties.length : 0
    });
    
    try {
        // 1. Garantir que window.properties existe
        if (!window.properties) {
            window.properties = [];
            PropertyDiagnostic.log('addNewPropertyCorrected.init', 'Inicializado window.properties');
        }
        
        // 2. Verificar se ID já existe
        const existingIndex = window.properties.findIndex(p => p.id == newProperty.id);
        if (existingIndex !== -1) {
            PropertyDiagnostic.log('addNewPropertyCorrected.idConflict', {
                existingId: newProperty.id,
                existingTitle: window.properties[existingIndex].title
            });
            
            // Ajustar ID para evitar conflito
            const maxId = Math.max(...window.properties.map(p => parseInt(p.id) || 0));
            newProperty.id = maxId + 1;
            PropertyDiagnostic.log('addNewPropertyCorrected.idAdjusted', { newId: newProperty.id });
        }
        
        // 3. Adicionar ao array global
        window.properties.push(newProperty);
        
        PropertyDiagnostic.log('addNewPropertyCorrected.arrayAdded', {
            newLength: window.properties.length,
            addedProperty: { id: newProperty.id, title: newProperty.title }
        });
        
        // 4. Salvar no localStorage
        try {
            localStorage.setItem('properties', JSON.stringify(window.properties));
            PropertyDiagnostic.log('addNewPropertyCorrected.localStorage', {
                success: true,
                storedCount: window.properties.length
            });
        } catch (storageError) {
            PropertyDiagnostic.log('addNewPropertyCorrected.localStorageError', storageError.message);
            // Continuar mesmo se localStorage falhar
        }
        
        // 5. Tentar salvar no Supabase (se disponível)
        let supabaseResult = null;
        const hasSupabase = window.SUPABASE_CONSTANTS && 
                          window.SUPABASE_CONSTANTS.URL && 
                          window.SUPABASE_CONSTANTS.KEY;
        
        if (hasSupabase) {
            PropertyDiagnostic.log('addNewPropertyCorrected.supabaseCheck', 'Supabase configurado');
            
            // Verificar qual função usar
            if (typeof window.savePropertyToDatabase === 'function') {
                try {
                    PropertyDiagnostic.log('addNewPropertyCorrected.supabaseSave', 'Chamando savePropertyToDatabase');
                    supabaseResult = await window.savePropertyToDatabase(newProperty);
                    
                    PropertyDiagnostic.log('addNewPropertyCorrected.supabaseResult', {
                        success: !!supabaseResult,
                        result: supabaseResult
                    });
                    
                    if (supabaseResult && supabaseResult.id) {
                        // Atualizar ID local com ID do Supabase se necessário
                        if (supabaseResult.id !== newProperty.id) {
                            const localIndex = window.properties.findIndex(p => p.id == newProperty.id);
                            if (localIndex !== -1) {
                                window.properties[localIndex].id = supabaseResult.id;
                                localStorage.setItem('properties', JSON.stringify(window.properties));
                                PropertyDiagnostic.log('addNewPropertyCorrected.idUpdated', {
                                    oldId: newProperty.id,
                                    newId: supabaseResult.id
                                });
                            }
                        }
                    }
                } catch (supabaseError) {
                    PropertyDiagnostic.log('addNewPropertyCorrected.supabaseError', {
                        error: supabaseError.message,
                        function: 'savePropertyToDatabase'
                    });
                }
            } else if (window.supabase && typeof window.supabase.from === 'function') {
                // Tentar método direto
                try {
                    PropertyDiagnostic.log('addNewPropertyCorrected.supabaseDirect', 'Usando supabase direto');
                    
                    const { data, error } = await window.supabase
                        .from('properties')
                        .insert([newProperty])
                        .select();
                    
                    if (error) {
                        throw new Error(error.message);
                    }
                    
                    supabaseResult = data ? data[0] : null;
                    PropertyDiagnostic.log('addNewPropertyCorrected.supabaseDirectResult', {
                        success: !!supabaseResult,
                        result: supabaseResult
                    });
                    
                } catch (directError) {
                    PropertyDiagnostic.log('addNewPropertyCorrected.supabaseDirectError', directError.message);
                }
            } else {
                PropertyDiagnostic.log('addNewPropertyCorrected.noSupabaseFunction', 'Nenhuma função de salvamento disponível');
            }
        } else {
            PropertyDiagnostic.log('addNewPropertyCorrected.noSupabaseConfig', 'Supabase não configurado');
        }
        
        // 6. Atualizar lista no painel admin
        setTimeout(() => {
            if (typeof window.loadPropertyList === 'function') {
                window.loadPropertyList();
                PropertyDiagnostic.log('addNewPropertyCorrected.loadList', 'Lista de imóveis atualizada');
            }
        }, 300);
        
        // 7. Retornar resultado
        return {
            success: true,
            id: supabaseResult ? (supabaseResult.id || newProperty.id) : newProperty.id,
            method: supabaseResult ? 'supabase' : 'local',
            supabaseResult: supabaseResult,
            localProperties: window.properties.length
        };
        
    } catch (error) {
        PropertyDiagnostic.log('addNewPropertyCorrected.error', {
            message: error.message,
            stack: error.stack
        });
        
        return {
            success: false,
            error: error.message,
            localProperties: window.properties ? window.properties.length : 0
        };
    }
};

/* ==========================================================
   FUNÇÕES AUXILIARES CORRIGIDAS
   ========================================================== */
window.updateLocalProperty = function(propertyId, updatedData) {
    PropertyDiagnostic.log('updateLocalProperty.start', {
        propertyId: propertyId,
        hasData: !!updatedData,
        currentProperties: window.properties ? window.properties.length : 0
    });
    
    if (!window.properties) {
        PropertyDiagnostic.log('updateLocalProperty.error', 'window.properties não definido');
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id === propertyId);
    if (index === -1) {
        PropertyDiagnostic.log('updateLocalProperty.notFound', `ID ${propertyId} não encontrado`);
        return false;
    }
    
    // Garantir que has_video seja booleano
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = Boolean(updatedData.has_video);
    }
    
    // Manter features como string JSON
    if (Array.isArray(updatedData.features)) {
        updatedData.features = JSON.stringify(updatedData.features);
    }
    
    // Atualizar propriedade
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    PropertyDiagnostic.log('updateLocalProperty.updated', {
        index: index,
        title: window.properties[index].title,
        has_video: window.properties[index].has_video
    });
    
    // Salvar no localStorage
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        PropertyDiagnostic.log('updateLocalProperty.localStorage', 'Salvo com sucesso');
    } catch (error) {
        PropertyDiagnostic.log('updateLocalProperty.localStorageError', error.message);
    }
    
    // Atualizar UI
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        if (typeof window.updatePropertyCard === 'function') {
            window.updatePropertyCard(propertyId);
        }
    }, 100);
    
    return true;
};

/* ==========================================================
   FUNÇÃO PARA VERIFICAR ESTADO DO SISTEMA
   ========================================================== */
window.checkPropertySystem = function() {
    console.group('🔍 VERIFICAÇÃO DO SISTEMA DE PROPRIEDADES');
    
    // 1. Verificar window.properties
    console.log('📊 window.properties:', {
        existe: !!window.properties,
        tipo: typeof window.properties,
        quantidade: window.properties ? window.properties.length : 0,
        sample: window.properties ? window.properties.slice(0, 2) : []
    });
    
    // 2. Verificar localStorage
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        console.log('💾 localStorage:', {
            quantidade: stored.length,
            ids: stored.map(p => p.id).slice(0, 10),
            ultimo: stored.length > 0 ? stored[stored.length - 1] : null
        });
        
        // Comparar
        if (window.properties && stored.length !== window.properties.length) {
            console.warn('⚠️ DESINCRONIZAÇÃO: localStorage vs window.properties');
            console.log(`   localStorage: ${stored.length} imóveis`);
            console.log(`   window.properties: ${window.properties.length} imóveis`);
        }
    } catch (e) {
        console.error('❌ Erro ao ler localStorage:', e);
    }
    
    // 3. Verificar Supabase
    console.log('☁️ Supabase:', {
        configurado: !!(window.SUPABASE_CONSTANTS && window.SUPABASE_CONSTANTS.URL),
        cliente: !!window.supabase,
        funcao_save: typeof window.savePropertyToDatabase === 'function',
        funcao_update: typeof window.updateProperty === 'function'
    });
    
    // 4. Verificar MediaSystem
    console.log('🖼️ MediaSystem:', {
        existe: !!window.MediaSystem,
        metodos: window.MediaSystem ? Object.keys(window.MediaSystem).filter(k => typeof window.MediaSystem[k] === 'function') : []
    });
    
    // 5. Verificar funções críticas
    console.log('⚙️ Funções críticas:', {
        saveProperty: typeof window.saveProperty === 'function',
        addNewPropertyCorrected: typeof window.addNewPropertyCorrected === 'function',
        updateLocalProperty: typeof window.updateLocalProperty === 'function',
        renderProperties: typeof window.renderProperties === 'function',
        loadPropertyList: typeof window.loadPropertyList === 'function'
    });
    
    // 6. Diagnostic report
    console.log('📈 Relatório de diagnóstico:', PropertyDiagnostic.getDiagnosticReport());
    
    // 7. Sugestões
    console.log('💡 SUGESTÕES:');
    
    if (!window.properties || window.properties.length === 0) {
        console.log('   ⚠️ window.properties está vazio ou não definido');
        console.log('   💡 Execute: window.properties = [];');
    }
    
    if (typeof window.savePropertyToDatabase !== 'function') {
        console.log('   ⚠️ savePropertyToDatabase não está disponível');
        console.log('   💡 Verifique se supabase-functions.js foi carregado');
    }
    
    console.groupEnd();
    
    // Criar botão de teste rápido
    if (!document.getElementById('quick-test-btn')) {
        const btn = document.createElement('button');
        btn.id = 'quick-test-btn';
        btn.textContent = '🧪 Testar Sistema';
        btn.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: #9b59b6;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 99999;
        `;
        btn.onclick = function() {
            window.testPropertyCreation();
        };
        document.body.appendChild(btn);
    }
    
    return PropertyDiagnostic.getDiagnosticReport();
};

/* ==========================================================
   FUNÇÃO DE TESTE DE CRIAÇÃO
   ========================================================== */
window.testPropertyCreation = async function() {
    console.group('🧪 TESTE DE CRIAÇÃO DE IMÓVEL');
    
    try {
        // Criar imóvel de teste
        const testProperty = {
            id: Date.now(), // ID único baseado em timestamp
            title: `Imóvel Teste ${new Date().getHours()}:${new Date().getMinutes()}`,
            price: 'R$ 300.000',
            location: 'Localização Teste',
            description: 'Este é um imóvel de teste gerado automaticamente',
            features: JSON.stringify(['Teste 1', 'Teste 2', 'Teste 3']),
            type: 'residencial',
            badge: 'Novo',
            has_video: false,
            images: 'EMPTY',
            pdfs: 'EMPTY',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('📝 Imóvel de teste:', testProperty);
        
        // Usar a função corrigida
        const result = await window.addNewPropertyCorrected(testProperty);
        
        console.log('📊 Resultado:', result);
        
        if (result.success) {
            alert(`✅ TESTE BEM-SUCEDIDO!\n\nID: ${result.id}\nMétodo: ${result.method}\nTotal imóveis: ${result.localProperties}`);
            
            // Verificar se aparece na lista
            setTimeout(() => {
                if (typeof window.loadPropertyList === 'function') {
                    window.loadPropertyList();
                }
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos');
                }
                window.checkPropertySystem();
            }, 1000);
            
        } else {
            alert(`❌ TESTE FALHOU!\n\nErro: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        alert(`❌ ERRO NO TESTE:\n\n${error.message}`);
    }
    
    console.groupEnd();
};

/* ==========================================================
   FUNÇÕES EXISTENTES (mantidas da versão anterior)
   ========================================================== */
window.toggleAdminPanel = function() {
    console.log('🔧 toggleAdminPanel chamada');
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

window.resetAdminFormCompletely = function(showNotification = true) {
    PropertyDiagnostic.log('resetAdminFormCompletely', 'Iniciando reset');
    
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
    
    PropertyDiagnostic.log('resetAdminFormCompletely', 'Reset completo');
    return true;
};

window.cancelEdit = function() {
    if (window.editingPropertyId) {
        if (confirm('❓ Cancelar edição?\n\nTodos os dados não salvos serão perdidos.')) {
            PropertyDiagnostic.log('cancelEdit', `Cancelando edição ${window.editingPropertyId}`);
            window.resetAdminFormCompletely(true);
            return true;
        }
    } else {
        PropertyDiagnostic.log('cancelEdit', 'Nenhuma edição em andamento');
        window.resetAdminFormCompletely(false);
    }
    return false;
};

window.editProperty = function(id) {
    PropertyDiagnostic.log('editProperty.start', `Editando imóvel ${id}`);
    
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
    
    PropertyDiagnostic.log('editProperty.success', `Imóvel ${id} em edição`);
    return true;
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
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    const videoCheckbox = document.getElementById('propHasVideo');
    if (videoCheckbox) {
        videoCheckbox.addEventListener('change', function() {
            PropertyDiagnostic.log('checkbox.video.change', { checked: this.checked });
        });
    }
    
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        PropertyDiagnostic.log('form.submit', 'Iniciando envio do formulário');
        
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

/* ==========================================================
   INICIALIZAÇÃO COM DIAGNÓSTICO
   ========================================================== */
window.setupAdminUI = function() {
    console.log('🔧 Configurando UI do admin...');
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    
    // Botão toggle admin
    const setupAdminButton = function() {
        const adminBtn = document.querySelector('.admin-toggle');
        if (!adminBtn) {
            console.warn('⚠️ Botão admin-toggle não encontrado');
            return;
        }
        
        adminBtn.onclick = null;
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        const freshBtn = document.querySelector('.admin-toggle');
        
        freshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            PropertyDiagnostic.log('adminButton.click', 'Botão admin clicado');
            
            if (typeof window.toggleAdminPanel === 'function') {
                window.toggleAdminPanel();
            } else {
                console.error('❌ toggleAdminPanel não é uma função!');
                alert('❌ Erro: Função admin não disponível. Recarregue a página.');
            }
        }, { once: false });
    };
    
    setupAdminButton();
    
    // Botão Cancelar
    const setupCancelButton = function() {
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (!cancelBtn) {
            console.warn('⚠️ Botão Cancelar não encontrado');
            return;
        }
        
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        
        freshCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.cancelEdit();
        }, { once: false });
        
        freshCancelBtn.style.display = 'none';
        freshCancelBtn.style.opacity = '1';
        freshCancelBtn.style.visibility = 'visible';
        freshCancelBtn.style.pointerEvents = 'auto';
        freshCancelBtn.style.cursor = 'pointer';
        freshCancelBtn.disabled = false;
    };
    
    setupCancelButton();
    
    if (typeof window.setupForm === 'function') {
        setTimeout(window.setupForm, 100);
    }
    
    // Adicionar botão de diagnóstico
    const addDiagnosticButton = function() {
        if (document.getElementById('diagnostic-btn')) return;
        
        const diagBtn = document.createElement('button');
        diagBtn.id = 'diagnostic-btn';
        diagBtn.innerHTML = '🔍 Diagnóstico';
        diagBtn.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 10px;
            background: #3498db;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 99999;
            font-size: 12px;
        `;
        
        diagBtn.onclick = function() {
            window.checkPropertySystem();
        };
        
        document.body.appendChild(diagBtn);
    };
    
    addDiagnosticButton();
    
    console.log('✅ UI do admin configurada com sistema de diagnóstico');
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

window.forceMediaPreviewUpdate = function() {
    if (window.MediaSystem && typeof window.MediaSystem.updateUI === 'function') {
        window.MediaSystem.updateUI();
    }
};

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.setupAdminUI();
            
            // Verificação inicial do sistema
            setTimeout(() => {
                console.log('🔍 Verificação inicial do sistema...');
                window.checkPropertySystem();
                
                // Exibir instruções
                console.log('💡 INSTRUÇÕES PARA TESTE:');
                console.log('1. Abra o painel admin (botão 🔧)');
                console.log('2. Preencha um imóvel e clique em salvar');
                console.log('3. Verifique o console (F12) para logs detalhados');
                console.log('4. Use o botão 🔍 Diagnóstico para verificar o sistema');
                console.log('5. Use o botão 🧪 Testar Sistema para teste automático');
                
            }, 2000);
        }, 500);
    });
} else {
    setTimeout(() => {
        window.setupAdminUI();
        setTimeout(() => window.checkPropertySystem(), 2000);
    }, 300);
}

console.log('✅ admin.js - VERSÃO CORRIGIDA COM DIAGNÓSTICO');
console.log('🔍 Para verificar o sistema, execute: window.checkPropertySystem()');
console.log('🧪 Para teste rápido, execute: window.testPropertyCreation()');
console.log('📊 Para ver logs detalhados, adicione ?debug=property à URL');
