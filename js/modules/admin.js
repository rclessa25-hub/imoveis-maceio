// js/modules/admin.js - VERSÃO OTIMIZADA (CORE)
console.log('🔧 admin.js - Versão core otimizada');

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
   FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL
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

/* ==========================================================
   FUNÇÃO PARA LIMPAR FORMULÁRIO
   ========================================================== */
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
            
            ['uploadPreview', 'pdfUploadPreview'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });
        } catch (error) {
            console.error('Erro ao resetar MediaSystem:', error);
        }
    }
    
    // Atualizar UI
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
        submitBtn.style.background = '#27ae60';
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    setTimeout(() => {
        const form = document.getElementById('propertyForm');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Usar diagnóstico se disponível (opcional)
    if (showNotification && window.AdminHelpers?.showNotification) {
        window.AdminHelpers.showNotification('✅ Formulário limpo para novo imóvel', 'info');
    }
    
    return true;
};

/* ==========================================================
   FUNÇÃO DE CANCELAMENTO
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
   FUNÇÃO EDIT PROPERTY
   ========================================================== */
window.editProperty = function(id) {
    console.log('✏️ Iniciando edição do imóvel ID:', id);
    
    const property = window.properties?.find(p => p.id === id);
    if (!property) {
        if (window.AdminHelpers?.showNotification) {
            window.AdminHelpers.showNotification('❌ Imóvel não encontrado!', 'error', 3000);
        } else {
            alert('❌ Imóvel não encontrado!');
        }
        return false;
    }
    
    window.resetAdminFormCompletely(false);
    
    // Formatar preço usando SharedCore
    const formatPrice = (price) => {
        if (window.SharedCore?.PriceFormatter?.formatForAdmin) {
            return window.SharedCore.PriceFormatter.formatForAdmin(price);
        }
        return price || '';
    };
    
    // Formatar features usando SharedCore
    const formatFeatures = (features) => {
        if (window.SharedCore?.formatFeaturesForDisplay) {
            return window.SharedCore.formatFeaturesForDisplay(features);
        }
        return features || '';
    };
    
    const fieldMappings = {
        'propTitle': property.title || '',
        'propPrice': formatPrice(property.price) || '',
        'propLocation': property.location || '',
        'propDescription': property.description || '',
        'propFeatures': formatFeatures(property.features) || '',
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
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.style.background = '#3498db';
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
    }
    
    window.editingPropertyId = property.id;
    
    if (window.MediaSystem && typeof window.MediaSystem.loadExisting === 'function') {
        window.MediaSystem.loadExisting(property);
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
   FUNÇÃO PRINCIPAL DE SALVAMENTO
   ========================================================== */
window.saveProperty = async function() {
    console.group('💾 SALVANDO IMÓVEL');
    
    try {
        // Obter dados do formulário
        const propertyData = {};
        
        const videoCheckbox = document.getElementById('propHasVideo');
        if (videoCheckbox) {
            propertyData.has_video = window.SharedCore?.ensureBooleanVideo?.(videoCheckbox.checked) || false;
        } else {
            propertyData.has_video = false;
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
                    propertyData[field.key] = element.value;
                } else {
                    propertyData[field.key] = element.value.trim();
                }
            } else {
                propertyData[field.key] = '';
            }
        });
        
        console.log('📋 Dados coletados:', propertyData);
        
        // Validação básica
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            throw new Error('Preencha Título, Preço e Localização!');
        }
        
        // Formatar dados usando SharedCore
        if (window.SharedCore?.PriceFormatter?.formatForAdmin) {
            propertyData.price = window.SharedCore.PriceFormatter.formatForAdmin(propertyData.price);
        }
        
        if (propertyData.features && window.SharedCore?.parseFeaturesForStorage) {
            propertyData.features = window.SharedCore.parseFeaturesForStorage(propertyData.features);
        } else {
            propertyData.features = '[]';
        }
        
        // Processar mídias
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
        
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        // Salvar no sistema
        if (window.editingPropertyId) {
            console.log(`✏️ Salvando edição do imóvel ${window.editingPropertyId}...`);
            
            if (typeof window.updateProperty === 'function') {
                try {
                    const updateResult = await window.updateProperty(window.editingPropertyId, propertyData);
                    
                    if (updateResult && updateResult.success) {
                        if (window.AdminHelpers?.showNotification) {
                            window.AdminHelpers.showNotification('✅ Imóvel atualizado com sucesso!', 'success', 3000);
                        }
                        console.log('✅ Imóvel salvo no Supabase');
                    } else {
                        if (window.AdminHelpers?.showNotification) {
                            window.AdminHelpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                        }
                        console.log('⚠️ Imóvel salvo apenas localmente (Supabase falhou)');
                    }
                } catch (supabaseError) {
                    console.error('❌ Erro ao salvar no Supabase:', supabaseError);
                    if (window.AdminHelpers?.showNotification) {
                        window.AdminHelpers.showNotification('✅ Imóvel salvo localmente (Supabase offline)', 'info', 3000);
                    }
                }
            }
            
            // Atualizar galeria
            setTimeout(() => {
                if (typeof window.updatePropertyCard === 'function') {
                    window.updatePropertyCard(window.editingPropertyId);
                } else if (typeof window.renderProperties === 'function') {
                    window.renderProperties(window.currentFilter || 'todos');
                }
            }, 300);
            
            setTimeout(() => {
                window.resetAdminFormCompletely(true);
            }, 1500);
            
        } else {
            console.log('🆕 Criando novo imóvel...');
            
            const newProperty = {
                ...propertyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            if (typeof window.addNewProperty === 'function') {
                console.log('✅ Usando addNewProperty()');
                
                try {
                    const result = await window.addNewProperty(newProperty);
                    
                    if (result) {
                        if (window.AdminHelpers?.showNotification) {
                            window.AdminHelpers.showNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                        }
                        console.log(`✅ Novo imóvel criado: ${result.id}`);
                        
                        setTimeout(() => {
                            if (typeof window.renderProperties === 'function') {
                                window.renderProperties('todos');
                            }
                        }, 300);
                        
                        setTimeout(() => {
                            window.resetAdminFormCompletely(true);
                        }, 1500);
                        
                    } else {
                        throw new Error('addNewProperty retornou null');
                    }
                    
                } catch (error) {
                    console.error('❌ Erro em addNewProperty:', error);
                    
                    const fallbackResult = await window.savePropertyLocally(newProperty);
                    
                    if (fallbackResult.success) {
                        if (window.AdminHelpers?.showNotification) {
                            window.AdminHelpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                        }
                        
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
                console.warn('⚠️ addNewProperty não disponível, usando fallback local');
                const fallbackResult = await window.savePropertyLocally(newProperty);
                
                if (fallbackResult.success) {
                    if (window.AdminHelpers?.showNotification) {
                        window.AdminHelpers.showNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                    }
                    
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
        
    } catch (error) {
        console.error('❌ Erro ao salvar imóvel:', error);
        if (window.AdminHelpers?.showNotification) {
            window.AdminHelpers.showNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        } else {
            alert(`❌ Erro: ${error.message}`);
        }
        
    } finally {
        console.groupEnd();
    }
};

/* ==========================================================
   FUNÇÃO DE FALLBACK LOCAL
   ========================================================== */
window.savePropertyLocally = async function(newProperty) {
    console.log('💾 Salvando localmente como fallback...');
    
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
        console.log(`✅ Adicionado localmente: ID ${newProperty.id}, total: ${window.properties.length}`);
        
        try {
            localStorage.setItem('properties', JSON.stringify(window.properties));
            console.log('✅ Salvo no localStorage (chave unificada)');
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
            if (window.AdminHelpers?.showNotification) {
                window.AdminHelpers.showNotification(`❌ ${error.message}`, 'error', 5000);
            }
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
   SETUP ADMIN UI
   ========================================================== */
window.setupAdminUI = function() {
    console.log('🔧 Configurando UI do admin...');
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        console.log('✅ Botão admin encontrado, configurando...');
        
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        const freshBtn = document.querySelector('.admin-toggle');
        
        freshBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🟢 Botão admin clicado');
            window.toggleAdminPanel();
        };
        
        console.log('✅ Botão admin configurado');
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
    
    console.log('✅ UI do admin configurada');
};

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

function initializeAdmin() {
    console.log('🚀 Inicializando sistema admin...');
    
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        if (!window.properties && stored.length > 0) {
            window.properties = stored;
            console.log(`✅ Carregado ${stored.length} imóveis do localStorage`);
        }
    } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
    }
    
    window.setupAdminUI();
    
    // Configurar uploads usando helpers se disponíveis
    setTimeout(() => {
        if (window.AdminHelpers?.setupUpload) {
            window.AdminHelpers.setupUpload('pdfFileInput', 'pdfUploadArea', 
                files => {
                    if (window.MediaSystem?.addPdfs) {
                        window.MediaSystem.addPdfs(files);
                    }
                });
            
            window.AdminHelpers.setupUpload('fileInput', 'uploadArea', 
                files => {
                    if (window.MediaSystem?.addFiles) {
                        window.MediaSystem.addFiles(files);
                    }
                });
        }
    }, 1000);
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

console.log('✅ admin.js - Versão core otimizada carregada');
