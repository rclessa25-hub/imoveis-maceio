// js/modules/admin.js - VERSÃO COMPACTA COM CONFIGURAÇÃO SUPABASE RESTAURADA
console.log('🔧 admin.js - VERSÃO COMPACTA');

// RESTAURAÇÃO DE CONFIGURAÇÃO SUPABASE (CRÍTICO)
if (!window.SUPABASE_CONSTANTS) {
    window.SUPABASE_CONSTANTS = {
        URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
    console.log('✅ SUPABASE_CONSTANTS restaurado em admin.js');
}

// Sistema de logs otimizado
const logAdmin = (message, data) => {
    if (!window.location.search.includes('debug=true')) return;
    console.log(`🔧 ${message}`, data || '');
};

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

/* ==========================================================
   HELPER FUNCTIONS (AGORA USANDO SHAREDCORE)
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
            if (window.SharedCore?.formatFeaturesForDisplay) {
                return window.SharedCore.formatFeaturesForDisplay(value);
            }
            return value || '';
        }
    },
    
    parseFeatures: (value) => {
        if (window.SharedCore?.parseFeaturesForStorage) {
            return window.SharedCore.parseFeaturesForStorage(value);
        }
        return value ? JSON.stringify(value.split(',').map(f => f.trim()).filter(f => f)) : '[]';
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
    
    setupUpload: (inputId, areaId, callback) => {
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
            formData.has_video = window.SharedCore?.ensureBooleanVideo?.(videoCheckbox.checked) || false;
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
   FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL
   ========================================================== */
window.toggleAdminPanel = function() {
    logAdmin('toggleAdminPanel chamada');
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
   FUNÇÃO PARA LIMPAR FORMULÁRIO
   ========================================================== */
window.resetAdminFormCompletely = function(showNotification = true) {
    logAdmin('RESET COMPLETO DO FORMULÁRIO');
    
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

/* ==========================================================
   FUNÇÃO DE CANCELAMENTO
   ========================================================== */
window.cancelEdit = function() {
    if (window.editingPropertyId) {
        if (confirm('❓ Cancelar edição?\n\nTodos os dados não salvos serão perdidos.')) {
            logAdmin(`Cancelando edição do imóvel: ${window.editingPropertyId}`);
            window.resetAdminFormCompletely(true);
            return true;
        }
    } else {
        logAdmin('Nenhuma edição em andamento para cancelar');
        window.resetAdminFormCompletely(false);
    }
    return false;
};

/* ==========================================================
   FUNÇÃO EDIT PROPERTY
   ========================================================== */
window.editProperty = function(id) {
    logAdmin(`Iniciando edição do imóvel ID: ${id}`);
    
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
        'propHasVideo': window.SharedCore?.ensureBooleanVideo?.(property.has_video) || false
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
    
    logAdmin(`Modo edição ativado para imóvel ID: ${property.id}`);
    return true;
};

/* ==========================================================
   FUNÇÃO PRINCIPAL DE SALVAMENTO - COM VERIFICAÇÃO SUPABASE
   ========================================================== */
window.saveProperty = async function() {
    console.group('💾 SALVANDO IMÓVEL - COM VERIFICAÇÃO SUPABASE');
    
    // VERIFICAÇÃO CRÍTICA: SUPABASE CONFIGURADO
    if (!window.SUPABASE_CONSTANTS?.URL || !window.SUPABASE_CONSTANTS?.KEY) {
        console.error('❌ SUPABASE_CONSTANTS não configurado!');
        alert('⚠️ Erro de configuração: Supabase não configurado.\n\nO imóvel será salvo apenas localmente.');
        
        // Continuar apenas com salvamento local
        const propertyData = Helpers.getFormData();
        const result = window.editingPropertyId 
            ? await window.updateProperty(window.editingPropertyId, propertyData)
            : await window.addNewProperty(propertyData);
            
        console.groupEnd();
        return result;
    }
    
    console.log('✅ Supabase configurado:', {
        hasURL: !!window.SUPABASE_CONSTANTS.URL,
        hasKEY: !!window.SUPABASE_CONSTANTS.KEY
    });
    
    const startTime = Date.now();
    
    try {
        const propertyData = Helpers.getFormData();
        if (!propertyData.title?.trim() || !propertyData.price || !propertyData.location?.trim()) {
            throw new Error('Preencha Título, Preço e Localização!');
        }
        
        propertyData.price = Helpers.format.price(propertyData.price);
        propertyData.features = propertyData.features ? Helpers.parseFeatures(propertyData.features) : '[]';
        
        let imageUrls = '';
        let pdfUrls = '';
        
        if (window.MediaSystem) {
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
                        logAdmin(`Upload concluído: ${uploadResult.uploadedCount} arquivo(s)`);
                    } else {
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
                const localResult = MediaSystem.saveAndKeepLocal(
                    window.editingPropertyId || 'temp_' + Date.now(),
                    propertyData.title || 'Imóvel'
                );
                imageUrls = localResult.images;
                pdfUrls = localResult.pdfs;
            }
        } else {
            imageUrls = 'EMPTY';
            pdfUrls = 'EMPTY';
        }
        
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        const isEditing = !!window.editingPropertyId;
        
        if (isEditing) {
            if (typeof window.updateProperty === 'function') {
                try {
                    const updateResult = await window.updateProperty(window.editingPropertyId, propertyData);
                    
                    if (updateResult?.success) {
                        Helpers.showNotification('✅ Imóvel atualizado com sucesso!', 'success', 3000);
                    } else {
                        Helpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                    }
                } catch (supabaseError) {
                    console.error('❌ Erro ao salvar no Supabase:', supabaseError);
                    Helpers.showNotification('✅ Imóvel salvo localmente (Supabase offline)', 'info', 3000);
                }
            } else {
                Helpers.showNotification('✅ Imóvel salvo localmente', 'success', 3000);
            }
            
            setTimeout(() => {
                if (typeof window.updatePropertyCard === 'function') {
                    window.updatePropertyCard(window.editingPropertyId);
                } else if (typeof window.renderProperties === 'function') {
                    window.renderProperties(window.currentFilter || 'todos');
                }
            }, 300);
            
            setTimeout(() => {
                Helpers.closeModal();
                window.resetAdminFormCompletely(true);
            }, 1500);
            
        } else {
            const newProperty = {
                ...propertyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            if (typeof window.addNewProperty === 'function') {
                try {
                    const result = await window.addNewProperty(newProperty);
                    
                    if (result) {
                        Helpers.showNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                        
                        setTimeout(() => {
                            if (typeof window.renderProperties === 'function') {
                                window.renderProperties('todos');
                            }
                        }, 300);
                        
                        setTimeout(() => {
                            Helpers.closeModal();
                            window.resetAdminFormCompletely(true);
                        }, 1500);
                    } else {
                        throw new Error('addNewProperty retornou null');
                    }
                    
                } catch (error) {
                    console.error('❌ Erro em addNewProperty:', error);
                    
                    const fallbackResult = await window.savePropertyLocally(newProperty);
                    
                    if (fallbackResult.success) {
                        Helpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                        alert('⚠️ Imóvel salvo apenas LOCALMENTE!\n\nAparecerá agora, mas pode sumir ao recarregar.');
                        
                        setTimeout(() => {
                            if (typeof window.renderProperties === 'function') {
                                window.renderProperties('todos');
                            }
                        }, 500);
                    } else {
                        throw new Error(`Falha completa: ${fallbackResult.error}`);
                    }
                }
            } else {
                const fallbackResult = await window.savePropertyLocally(newProperty);
                
                if (fallbackResult.success) {
                    Helpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                    alert('⚠️ Imóvel salvo apenas LOCALMENTE!\n\nAparecerá agora, mas pode sumir ao recarregar.');
                    
                    setTimeout(() => {
                        if (typeof window.renderProperties === 'function') {
                            window.renderProperties('todos');
                        }
                    }, 500);
                } else {
                    throw new Error(`Falha completa: ${fallbackResult.error}`);
                }
            }
        }
        
        return { success: true, isEditing };
        
    } catch (error) {
        Helpers.showNotification(`❌ ${error.message}`, 'error', 5000);
        throw error;
    } finally {
        console.groupEnd();
        logAdmin(`Operação concluída em ${Date.now() - startTime}ms`);
    }
};

/* ==========================================================
   FUNÇÃO DE FALLBACK LOCAL
   ========================================================== */
window.savePropertyLocally = async function(newProperty) {
    logAdmin('Salvando localmente como fallback...');
    
    try {
        if (!window.properties) {
            window.properties = [];
        }
        
        if (!newProperty.id) {
            const maxId = window.properties.length > 0 ? 
                Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
            newProperty.id = maxId + 1;
        }
        
        window.properties.push(newProperty);
        
        try {
            localStorage.setItem('properties', JSON.stringify(window.properties));
        } catch (storageError) {
            console.error('❌ Erro no localStorage:', storageError);
        }
        
        setTimeout(() => {
            if (typeof window.loadPropertyList === 'function') {
                window.loadPropertyList();
            }
        }, 300);
        
        return {
            success: true,
            id: newProperty.id,
            localProperties: window.properties.length
        };
        
    } catch (error) {
        console.error('❌ Erro no salvamento local:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/* ==========================================================
   FUNÇÃO DE VERIFICAÇÃO DO SISTEMA - ATUALIZADA
   ========================================================== */
window.checkPropertySystem = function() {
    console.group('🔍 VERIFICAÇÃO DO SISTEMA');
    
    console.log('⚙️ FUNÇÕES ESSENCIAIS:');
    console.log('- toggleAdminPanel:', typeof window.toggleAdminPanel);
    console.log('- saveProperty:', typeof window.saveProperty);
    console.log('- addNewProperty:', typeof window.addNewProperty);
    console.log('- updateProperty:', typeof window.updateProperty);
    
    console.log('📊 DADOS:');
    console.log('- window.properties:', window.properties ? `${window.properties.length} imóveis` : '❌ Não definido');
    
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        console.log('- localStorage (chave unificada):', `${stored.length} imóveis`);
        
        if (window.properties && stored.length !== window.properties.length) {
            console.warn(`⚠️ DESINCRONIZAÇÃO DETECTADA!`);
            console.warn(`   localStorage: ${stored.length} imóveis`);
            console.warn(`   window.properties: ${window.properties.length} imóveis`);
            
            const useStorageData = confirm(
                `⚠️ INCONSISTÊNCIA DETECTADA!\n\n` +
                `Storage: ${stored.length} imóveis\n` +
                `Memória: ${window.properties.length} imóveis\n\n` +
                `Usar dados do storage (recomendado)?\n\n` +
                `Cancelar = manter dados atuais em memória`
            );
            
            if (useStorageData) {
                console.log('🔄 Usando dados do localStorage');
                window.properties = stored;
                window.savePropertiesToStorage?.();
            } else {
                console.log('🔄 Salvando dados da memória no localStorage');
                window.savePropertiesToStorage?.();
            }
        }
    } catch (e) {
        console.error('❌ Erro ao ler localStorage:', e);
    }
    
    console.log('🔧 BOTÃO ADMIN:');
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        console.log('✅ Botão encontrado no DOM');
        console.log('- ID:', adminBtn.id);
        console.log('- Classe:', adminBtn.className);
        console.log('- Tem onclick:', !!adminBtn.onclick);
    } else {
        console.log('❌ Botão admin não encontrado!');
    }
    
    console.groupEnd();
};

/* ==========================================================
   FUNÇÃO AUXILIAR: Configurar uploads (CORRIGIDA)
   ========================================================== */
const setupMediaUploads = () => {
    console.log('🔧 Configurando uploads de mídia...');
    
    // VERIFICAR SE ELEMENTOS EXISTEM
    const elementsExist = ['pdfFileInput', 'pdfUploadArea', 'fileInput', 'uploadArea']
        .every(id => document.getElementById(id));
    
    if (!elementsExist) {
        console.warn('⚠️ Elementos de upload não encontrados, tentando novamente em 500ms');
        setTimeout(setupMediaUploads, 500);
        return;
    }
    
    // Configurar CADA upload INDIVIDUALMENTE (evitar duplicação)
    const uploadConfigs = [
        {
            inputId: 'pdfFileInput',
            areaId: 'pdfUploadArea',
            handler: (files) => {
                console.log('📄 PDFs selecionados:', files.length);
                if (window.MediaSystem?.addPdfs) {
                    window.MediaSystem.addPdfs(files);
                }
            }
        },
        {
            inputId: 'fileInput',
            areaId: 'uploadArea', 
            handler: (files) => {
                console.log('🖼️ Arquivos selecionados:', files.length);
                if (window.MediaSystem?.addFiles) {
                    window.MediaSystem.addFiles(files);
                    setTimeout(() => {
                        window.forceMediaPreviewUpdate?.();
                    }, 300);
                }
            }
        }
    ];
    
    uploadConfigs.forEach(({inputId, areaId, handler}) => {
        try {
            // REMOVER EVENT LISTENERS ANTIGOS (evitar duplo clique)
            const input = document.getElementById(inputId);
            const area = document.getElementById(areaId);
            
            if (input && area) {
                // Clonar elementos para remover listeners antigos
                const newInput = input.cloneNode(true);
                const newArea = area.cloneNode(true);
                
                input.parentNode.replaceChild(newInput, input);
                area.parentNode.replaceChild(newArea, area);
                
                // Configurar NOVOS listeners
                const freshInput = document.getElementById(inputId);
                const freshArea = document.getElementById(areaId);
                
                freshArea.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // IMPORTANTE: evitar propagação
                    freshInput.click();
                };
                
                freshInput.onchange = (e) => {
                    if (e.target.files.length) {
                        handler(e.target.files);
                        e.target.value = ''; // Resetar input
                    }
                };
                
                console.log(`✅ ${inputId} configurado sem duplicação`);
            }
        } catch (error) {
            console.error(`❌ Erro ao configurar ${inputId}:`, error);
        }
    });
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO (CORRIGIDA)
   ========================================================== */
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.warn('⚠️ Formulário não encontrado, tentando em 1s...');
        setTimeout(window.setupForm, 1000);
        return;
    }
    
    console.log('✅ Formulário encontrado, configurando...');
    
    // Configurar formatação automática de preço
    if (window.SharedCore?.PriceFormatter?.setupAutoFormat) {
        const priceField = document.getElementById('propPrice');
        if (priceField) window.SharedCore.PriceFormatter.setupAutoFormat(priceField);
    }
    
    const videoCheckbox = document.getElementById('propHasVideo');
    if (videoCheckbox) {
        videoCheckbox.addEventListener('change', function() {
            logAdmin(`Checkbox de vídeo alterado: ${this.checked}`);
            logAdmin(`Processado pelo SharedCore: ${window.SharedCore?.ensureBooleanVideo?.(this.checked)}`);
        });
    }
    
    // Configurar evento de submit UNIFICADO (evitar múltiplos handlers)
    const freshForm = document.getElementById('propertyForm');
    if (freshForm) {
        // Remover event listener antigo
        const newForm = freshForm.cloneNode(true);
        freshForm.parentNode.replaceChild(newForm, freshForm);
        
        // Adicionar novo listener
        document.getElementById('propertyForm').onsubmit = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
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
            
            return false;
        };
    }
    
    // Configurar uploads de mídia (com delay para garantir DOM)
    setTimeout(() => {
        setupMediaUploads();
        console.log('✅ Uploads de mídia configurados');
    }, 300);
};

/* ==========================================================
   SETUP ADMIN UI
   ========================================================== */
window.setupAdminUI = function() {
    logAdmin('Configurando UI do admin...');
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        logAdmin('Botão admin encontrado, configurando...');
        
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        const freshBtn = document.querySelector('.admin-toggle');
        freshBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.toggleAdminPanel();
        };
        
        logAdmin('Botão admin configurado com onclick direto');
    } else {
        console.error('❌ Botão admin-toggle não encontrado!');
        
        setTimeout(() => {
            if (!document.getElementById('emergency-admin-btn')) {
                const emergencyBtn = document.createElement('button');
                emergencyBtn.id = 'emergency-admin-btn';
                emergencyBtn.innerHTML = '🔧 ADMIN (EMERGÊNCIA)';
                emergencyBtn.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    z-index: 99999;
                    font-weight: bold;
                `;
                emergencyBtn.onclick = function() {
                    const password = prompt("🔒 Acesso de Emergência\n\nDigite a senha:");
                    if (password === "wl654") {
                        const panel = document.getElementById('adminPanel');
                        if (panel) {
                            panel.style.display = 'block';
                            panel.scrollIntoView({ behavior: 'smooth' });
                            if (typeof window.loadPropertyList === 'function') {
                                window.loadPropertyList();
                            }
                        }
                    }
                };
                document.body.appendChild(emergencyBtn);
                console.log('🆘 Botão de emergência criado');
            }
        }, 1000);
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        freshCancelBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.cancelEdit();
        };
        freshCancelBtn.style.display = 'none';
    }
    
    if (typeof window.setupForm === 'function') {
        setTimeout(window.setupForm, 100);
    }
    
    if (!document.getElementById('verify-btn')) {
        const verifyBtn = document.createElement('button');
        verifyBtn.id = 'verify-btn';
        verifyBtn.innerHTML = '🔍 Verificar Sistema';
        verifyBtn.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 10px;
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 99999;
            font-size: 14px;
        `;
        verifyBtn.onclick = window.checkPropertySystem;
        document.body.appendChild(verifyBtn);
    }
    
    logAdmin('UI do admin configurada');
};

/* ==========================================================
   CONFIGURAR FILTROS (VERSÃO UNIFICADA)
   ========================================================== */
window.setupFilters = window.configureFilters = window.setupFormFilters = function() {
    if (!window.FilterManager) {
        console.warn('⚠️ FilterManager não disponível');
        return false;
    }
    
    return window.FilterManager.setupWithFallback 
        ? window.FilterManager.setupWithFallback()
        : (window.FilterManager.init && window.FilterManager.init());
};

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

function initializeAdmin() {
    logAdmin('Inicializando sistema admin...');
    
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        if (!window.properties && stored.length > 0) {
            window.properties = stored;
            logAdmin(`Carregado ${stored.length} imóveis do localStorage (chave unificada)`);
        }
        
        const oldStored = localStorage.getItem('weberlessa_properties');
        if (oldStored && !stored) {
            logAdmin('Migrando dados da chave antiga para unificada...');
            localStorage.setItem('properties', oldStored);
            localStorage.removeItem('weberlessa_properties');
            window.properties = JSON.parse(oldStored);
            logAdmin('Migração concluída');
        }
    } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
    }
    
    window.setupAdminUI();
    
    setTimeout(() => {
        window.checkPropertySystem?.();
        
        logAdmin('INSTRUÇÕES:');
        logAdmin('1. Clique no botão 🔧 para abrir o painel admin');
        logAdmin('2. Use o botão 🔍 para verificar o sistema');
        logAdmin('3. Se o botão admin não funcionar, use o botão de emergência (vermelho)');
    }, 2000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

logAdmin('admin.js - VERSÃO COMPACTA COM SUPABASE RESTAURADO');
console.log('✅ Configuração Supabase restaurada:', !!window.SUPABASE_CONSTANTS);
