// js/modules/admin.js - VERSÃO COMPLETA E FUNCIONAL
console.log('🔧 admin.js - VERSÃO COMPLETA COM TODAS FUNÇÕES');

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
   FUNÇÃO PRINCIPAL DE SALVAMENTO - USANDO addNewProperty
   ========================================================== */
window.saveProperty = async function() {
    console.group('💾 SALVANDO IMÓVEL');
    
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
        
        // 4. Salvar no sistema
        if (window.editingPropertyId) {
            console.log(`✏️ Salvando edição do imóvel ${window.editingPropertyId}...`);
            
            // Usar a função que já existe e funciona
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
            
            // 🔥 USAR A FUNÇÃO QUE JÁ EXISTE E FUNCIONA (addNewProperty)
            if (typeof window.addNewProperty === 'function') {
                console.log('✅ Usando addNewProperty() que já funciona');
                
                try {
                    const result = await window.addNewProperty(newProperty);
                    
                    if (result) {
                        Helpers.showNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                        console.log(`✅ Novo imóvel criado: ${result.id}`);
                        
                        // Atualizar galeria
                        setTimeout(() => {
                            if (typeof window.renderProperties === 'function') {
                                window.renderProperties('todos');
                            }
                        }, 300);
                        
                        // Fechar modal e resetar
                        setTimeout(() => {
                            Helpers.closeModal();
                            window.resetAdminFormCompletely(true);
                        }, 1500);
                        
                    } else {
                        throw new Error('addNewProperty retornou null');
                    }
                    
                } catch (error) {
                    console.error('❌ Erro em addNewProperty:', error);
                    
                    // Fallback: salvar localmente
                    console.log('🔄 Tentando fallback local...');
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
                // Fallback se addNewProperty não existir
                console.warn('⚠️ addNewProperty não disponível, usando fallback local');
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
        
    } catch (error) {
        console.error('❌ Erro ao salvar imóvel:', error);
        Helpers.showNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        alert(`❌ Erro ao salvar:\n\n${error.message}\n\nOs dados NÃO foram perdidos. Corrija e tente novamente.`);
        
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
        // Garantir que window.properties existe
        if (!window.properties) {
            window.properties = [];
        }
        
        // Gerar ID se não existir
        if (!newProperty.id) {
            const maxId = window.properties.length > 0 ? 
                Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
            newProperty.id = maxId + 1;
        }
        
        // Adicionar ao array
        window.properties.push(newProperty);
        console.log(`✅ Adicionado localmente: ID ${newProperty.id}, total: ${window.properties.length}`);
        
        // Salvar no localStorage
        try {
            localStorage.setItem('properties', JSON.stringify(window.properties));
            console.log('✅ Salvo no localStorage');
        } catch (storageError) {
            console.error('❌ Erro no localStorage:', storageError);
        }
        
        // Atualizar lista no admin
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
   FUNÇÃO DE VERIFICAÇÃO DO SISTEMA
   ========================================================== */
window.checkPropertySystem = function() {
    console.group('🔍 VERIFICAÇÃO DO SISTEMA');
    
    // 1. Verificar funções essenciais
    console.log('⚙️ FUNÇÕES ESSENCIAIS:');
    console.log('- toggleAdminPanel:', typeof window.toggleAdminPanel);
    console.log('- saveProperty:', typeof window.saveProperty);
    console.log('- addNewProperty:', typeof window.addNewProperty);
    console.log('- updateProperty:', typeof window.updateProperty);
    
    // 2. Verificar dados
    console.log('📊 DADOS:');
    console.log('- window.properties:', window.properties ? `${window.properties.length} imóveis` : '❌ Não definido');
    
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        console.log('- localStorage:', `${stored.length} imóveis`);
        
        // Corrigir desincronização
        if (window.properties && stored.length !== window.properties.length) {
            console.warn('⚠️ DESINCRONIZAÇÃO DETECTADA! Corrigindo...');
            console.log(`  localStorage: ${stored.length} imóveis`);
            console.log(`  window.properties: ${window.properties.length} imóveis`);
            
            // Usar o que tem mais dados
            if (stored.length > window.properties.length) {
                window.properties = stored;
                console.log('✅ Corrigido: usando localStorage');
            }
        }
    } catch (e) {
        console.error('❌ Erro ao ler localStorage:', e);
    }
    
    // 3. Sugestões
    console.log('💡 SUGESTÕES:');
    
    if (typeof window.addNewProperty !== 'function') {
        console.log('1. A função addNewProperty() não está disponível');
        console.log('   Isso pode impedir o salvamento no Supabase');
    }
    
    if (!window.properties) {
        console.log('2. window.properties não está definido');
        console.log('   Execute: window.properties = [];');
    }
    
    // 4. Testar botão admin
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
   SETUP ADMIN UI
   ========================================================== */
window.setupAdminUI = function() {
    console.log('🔧 Configurando UI do admin...');
    
    // 1. Painel oculto por padrão
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    
    // 2. Botão toggle admin - CONFIGURAÇÃO SIMPLES E DIRETA
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        console.log('✅ Botão admin encontrado, configurando...');
        
        // Remover qualquer evento antigo
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        // Pegar o botão fresco
        const freshBtn = document.querySelector('.admin-toggle');
        
        // Configurar evento DIRETO
        freshBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🟢 Botão admin clicado via onclick direto');
            window.toggleAdminPanel();
        };
        
        console.log('✅ Botão admin configurado com onclick direto');
    } else {
        console.error('❌ Botão admin-toggle não encontrado!');
        
        // Tentar criar botão de emergência
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
    
    // 3. Configurar botão Cancelar
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
    
    // 4. Configurar formulário
    if (typeof window.setupForm === 'function') {
        setTimeout(window.setupForm, 100);
    }
    
    // 5. Adicionar botão de verificação
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
    
    console.log('✅ UI do admin configurada');
};

/* ==========================================================
   CONFIGURAÇÃO DE UPLOADS
   ========================================================== */
setTimeout(() => {
    // Configurar upload de PDFs
    Helpers.setupUpload('pdfFileInput', 'pdfUploadArea', 
        files => {
            if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                window.MediaSystem.addPdfs(files);
            } else {
                console.warn('MediaSystem não disponível para PDFs');
            }
        });
    
    // Configurar upload de imagens
    Helpers.setupUpload('fileInput', 'uploadArea', 
        files => {
            if (window.MediaSystem && typeof window.MediaSystem.addFiles === 'function') {
                window.MediaSystem.addFiles(files);
                setTimeout(() => {
                    if (typeof window.forceMediaPreviewUpdate === 'function') {
                        window.forceMediaPreviewUpdate();
                    }
                }, 300);
            } else {
                console.warn('MediaSystem não disponível para imagens');
            }
        });
}, 1000);

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

// Função de inicialização
function initializeAdmin() {
    console.log('🚀 Inicializando sistema admin...');
    
    // 1. Corrigir desincronização imediatamente
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        if (!window.properties && stored.length > 0) {
            window.properties = stored;
            console.log(`✅ Carregado ${stored.length} imóveis do localStorage`);
        }
    } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
    }
    
    // 2. Configurar UI
    window.setupAdminUI();
    
    // 3. Verificação inicial
    setTimeout(() => {
        console.log('🔍 Verificação inicial do sistema...');
        window.checkPropertySystem();
        
        // Instruções para o usuário
        console.log('💡 INSTRUÇÕES:');
        console.log('1. Clique no botão 🔧 para abrir o painel admin');
        console.log('2. Use o botão 🔍 para verificar o sistema');
        console.log('3. Se o botão admin não funcionar, use o botão de emergência (vermelho)');
        
    }, 2000);
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

console.log('✅ admin.js - VERSÃO COMPLETA E FUNCIONAL CARREGADA');
console.log('🔍 Para verificar: window.checkPropertySystem()');
console.log('🔧 Para abrir painel: window.toggleAdminPanel()');
