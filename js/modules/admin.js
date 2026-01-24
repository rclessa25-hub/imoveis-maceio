// js/modules/admin.js - CORREÇÃO DO ERRO DE LOADINGMANAGER
console.log('🔧 admin.js carregado - Correção do LoadingManager');

// ========== CONFIGURAÇÕES ==========
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle",
    storageKey: "weberlessa_properties"
};

// ========== VARIÁVEIS GLOBAIS ==========
window.editingPropertyId = null;
window._mediaState = {
    initialized: false,
    lastCleanTime: 0
};

/* ==========================================================
   ✅✅✅ SISTEMA DE UPLOAD SIMPLIFICADO E FUNCIONAL
   ========================================================== */

/**
 * CONFIGURAÇÃO DIRETA DOS INPUTS DE UPLOAD
 */
window.setupUploadInputs = function() {
    console.log('🎯 Configurando inputs de upload...');
    
    // 1. INPUT DE FOTOS/VIDEOS
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput && uploadArea) {
        console.log('📸 Configurando input de fotos/vídeos...');
        
        // Garantir que o input está visível e clicável
        fileInput.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            opacity: 0;
            cursor: pointer;
            z-index: 1000;
            display: block !important;
            visibility: visible !important;
        `;
        
        // Remover TODOS os listeners antigos
        const newInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newInput, fileInput);
        
        const newArea = uploadArea.cloneNode(true);
        uploadArea.parentNode.replaceChild(newArea, uploadArea);
        
        // Obter elementos FRESCOS
        const freshInput = document.getElementById('fileInput');
        const freshArea = document.getElementById('uploadArea');
        
        // Listener SIMPLES e DIRETO na área
        freshArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            freshInput.click();
        });
        
        // Listener DIRETO no input
        freshInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files.length > 0) {
                console.log(`📁 ${e.target.files.length} arquivo(s) selecionado(s)`);
                
                if (window.MediaSystem && typeof window.MediaSystem.addFiles === 'function') {
                    const added = window.MediaSystem.addFiles(e.target.files);
                    console.log(`✅ ${added} arquivo(s) adicionado(s) ao MediaSystem`);
                    
                    setTimeout(() => {
                        if (window.MediaSystem.updateUI) {
                            window.MediaSystem.updateUI();
                        }
                    }, 50);
                }
                
                e.target.value = '';
            }
        });
    }
    
    // 2. INPUT DE PDFs
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    
    if (pdfFileInput && pdfUploadArea) {
        console.log('📄 Configurando input de PDFs...');
        
        pdfFileInput.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            opacity: 0;
            cursor: pointer;
            z-index: 1000;
            display: block !important;
            visibility: visible !important;
        `;
        
        const newPdfInput = pdfFileInput.cloneNode(true);
        pdfFileInput.parentNode.replaceChild(newPdfInput, pdfFileInput);
        
        const newPdfArea = pdfUploadArea.cloneNode(true);
        pdfUploadArea.parentNode.replaceChild(newPdfArea, pdfUploadArea);
        
        const freshPdfInput = document.getElementById('pdfFileInput');
        const freshPdfArea = document.getElementById('pdfUploadArea');
        
        freshPdfArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            freshPdfInput.click();
        });
        
        freshPdfInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files.length > 0) {
                console.log(`📄 ${e.target.files.length} PDF(s) selecionado(s)`);
                
                if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                    const added = window.MediaSystem.addPdfs(e.target.files);
                    console.log(`✅ ${added} PDF(s) adicionado(s) ao MediaSystem`);
                    
                    setTimeout(() => {
                        if (window.MediaSystem.updateUI) {
                            window.MediaSystem.updateUI();
                        }
                    }, 50);
                }
                
                e.target.value = '';
            }
        });
    }
    
    window._mediaState.initialized = true;
    console.log('🎉 Sistema de upload configurado');
    return true;
};

/* ==========================================================
   FUNÇÃO cleanAdminForm
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log(`🧹 cleanAdminForm(${mode})`);
    
    window._mediaState.lastCleanTime = Date.now();
    window.editingPropertyId = null;
    
    // Limpar formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset();
        document.getElementById('propType').value = 'residencial';
        document.getElementById('propBadge').value = 'Novo';
        document.getElementById('propHasVideo').checked = false;
    }
    
    // Resetar UI
    document.getElementById('formTitle').textContent = 'Adicionar Novo Imóvel';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
        cancelBtn.disabled = false;
    }
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
        submitBtn.style.background = 'var(--success)';
        submitBtn.disabled = false;
    }
    
    // Limpar MediaSystem
    if (window.MediaSystem) {
        console.log('🔄 Limpando MediaSystem...');
        
        if (typeof MediaSystem.resetState === 'function') {
            MediaSystem.resetState();
        } else if (MediaSystem.state) {
            MediaSystem.state.files = [];
            MediaSystem.state.pdfs = [];
            MediaSystem.state.existing = [];
            MediaSystem.state.existingPdfs = [];
            MediaSystem.state.currentPropertyId = null;
            MediaSystem.state.isUploading = false;
        }
        
        setTimeout(() => {
            if (MediaSystem.updateUI) {
                MediaSystem.updateUI();
            }
        }, 50);
    }
    
    // Limpar previews
    const previewContainers = ['uploadPreview', 'pdfUploadPreview'];
    previewContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; opacity: 0.5; margin-bottom: 1rem;"></i>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem;">Nenhum arquivo selecionado</p>
                </div>
            `;
        }
    });
    
    // Reconfigurar uploads
    setTimeout(() => {
        window.setupUploadInputs();
    }, 100);
    
    if (mode === 'cancel' && window.showNotification) {
        window.showNotification('Edição cancelada', 'info');
    }
    
    return true;
};

/* ==========================================================
   FUNÇÃO cancelEdit
   ========================================================== */
window.cancelEdit = function() {
    if (window.editingPropertyId) {
        const confirmCancel = confirm('Deseja realmente cancelar a edição?\n\nTodas as alterações NÃO SALVAS serão perdidas.');
        if (!confirmCancel) {
            return false;
        }
    }
    
    window.cleanAdminForm('cancel');
    return true;
};

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
window.toggleAdminPanel = function() {
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
    
    if (password === null) return;
    if (password === "") {
        alert('⚠️ Campo de senha vazio!');
        return;
    }
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
                
                setTimeout(() => {
                    if (typeof window.loadPropertyList === 'function') {
                        window.loadPropertyList();
                    }
                }, 100);
            }
        }
    } else {
        alert('❌ Senha incorreta!');
    }
};

// ========== CONFIGURAÇÃO CONSOLIDADA DE UI ==========
window.setupAdminUI = function() {
    console.log('🔧 Configurando UI administrativa');
    
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.onclick = (e) => {
            e.preventDefault();
            window.toggleAdminPanel();
        };
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            window.cancelEdit();
        };
    }
    
    setTimeout(() => {
        window.setupUploadInputs();
        if (window.setupForm) window.setupForm();
        if (window.loadPropertyList) window.loadPropertyList();
    }, 800);
};

// ========== EXECUÇÃO AUTOMÁTICA ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.setupAdminUI();
        }, 500);
    });
} else {
    setTimeout(() => {
        window.setupAdminUI();
    }, 300);
}

// ========== INTEGRAÇÃO COM MediaSystem ==========
window.handleNewMediaFiles = function(files) {
    if (!window.MediaSystem || typeof MediaSystem.addFiles !== 'function') {
        return 0;
    }
    
    const result = MediaSystem.addFiles(files);
    
    setTimeout(() => {
        if (MediaSystem.updateUI) {
            MediaSystem.updateUI();
        }
    }, 50);
    
    return result;
};

window.handleNewPdfFiles = function(files) {
    if (!window.MediaSystem || typeof MediaSystem.addPdfs !== 'function') {
        return 0;
    }
    
    const result = MediaSystem.addPdfs(files);
    
    setTimeout(() => {
        if (MediaSystem.updateUI) {
            MediaSystem.updateUI();
        }
    }, 50);
    
    return result;
};

// ========== FUNÇÕES DO FORMULÁRIO ==========

window.loadPropertyList = function() {
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container || !window.properties) return;
    
    container.innerHTML = '';
    if (countElement) countElement.textContent = window.properties.length;
    
    if (window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum imóvel</p>';
        return;
    }
    
    window.properties.forEach(property => {
        const item = document.createElement('div');
        item.className = 'property-item';
        item.innerHTML = `
            <div style="flex: 1;">
                <strong style="color: var(--primary);">${property.title}</strong><br>
                <small>${property.price} - ${property.location}</small>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProperty(${property.id})" 
                        style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
};

// ========== FUNÇÃO editProperty ==========
window.editProperty = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }

    window.cleanAdminForm('reset');
    
    document.getElementById('propTitle').value = property.title || '';
    
    const priceField = document.getElementById('propPrice');
    if (priceField && property.price) {
        if (window.SharedCore?.PriceFormatter?.formatForInput) {
            priceField.value = window.SharedCore.PriceFormatter.formatForInput(property.price);
        } else {
            priceField.value = property.price;
        }
    }
    
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    document.getElementById('propFeatures').value = Array.isArray(property.features) ? property.features.join(', ') : (property.features || '');
    document.getElementById('propType').value = property.type || 'residencial';
    document.getElementById('propBadge').value = property.badge || 'Novo';
    document.getElementById('propHasVideo').checked = property.has_video === true || property.has_video === 'true' || false;

    document.getElementById('formTitle').textContent = `Editando: ${property.title}`;

    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.style.background = 'var(--accent)';
    }

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'block';
        cancelBtn.disabled = false;
    }

    window.editingPropertyId = property.id;

    setTimeout(() => {
        if (window.MediaSystem && MediaSystem.loadExisting) {
            MediaSystem.loadExisting(property);
            
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 200);
        }
    }, 150);

    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.style.display !== 'block') {
            adminPanel.style.display = 'block';
        }
        
        const propertyForm = document.getElementById('propertyForm');
        if (propertyForm) {
            propertyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);

    return true;
};

// ========== CONFIGURAÇÃO DO FORMULÁRIO (CORRIGIDA) ==========
window.setupForm = function() {
    console.log('⚙️ Configurando formulário...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('❌ Formulário não encontrado');
        return;
    }
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) {
        window.setupPriceAutoFormat();
    }
    
    const freshForm = document.getElementById('propertyForm');
    freshForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.group('💾 SALVANDO IMÓVEL');
        
        // ✅ CORREÇÃO CRÍTICA: Verificar se LoadingManager existe
        let loading = null;
        if (window.LoadingManager && typeof window.LoadingManager.show === 'function') {
            loading = window.LoadingManager.show(
                'Salvando Imóvel...', 
                'Por favor, aguarde...', 
                { variant: 'processing' }
            );
        } else {
            console.warn('⚠️ LoadingManager não disponível');
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }
        
        try {
            const propertyData = {
                title: document.getElementById('propTitle').value,
                price: document.getElementById('propPrice').value,
                location: document.getElementById('propLocation').value,
                description: document.getElementById('propDescription').value,
                features: document.getElementById('propFeatures').value,
                type: document.getElementById('propType').value,
                badge: document.getElementById('propBadge').value,
                has_video: document.getElementById('propHasVideo')?.checked || false
            };
            
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                alert('❌ Preencha Título, Preço e Localização!');
                if (submitBtn) submitBtn.disabled = false;
                if (loading && loading.hide) loading.hide();
                console.groupEnd();
                return;
            }
            
            // ✅ CORREÇÃO: Atualizar mensagem apenas se loading existir
            if (loading && loading.updateMessage) {
                loading.updateMessage('Processando dados...');
            }
            
            if (window.editingPropertyId) {
                console.log(`✏️ Editando imóvel ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                if (window.adminPdfHandler) {
                    const pdfsString = await window.adminPdfHandler.process(window.editingPropertyId, propertyData.title);
                    if (pdfsString && pdfsString.trim() !== '') {
                        updateData.pdfs = pdfsString;
                    }
                }
                
                if (window.MediaSystem && window.MediaSystem.getOrderedMediaUrls) {
                    const ordered = window.MediaSystem.getOrderedMediaUrls();
                    if (ordered.images && ordered.images.trim() !== '') {
                        updateData.images = ordered.images;
                    }
                }
                
                if (typeof window.updateProperty === 'function') {
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    // ✅ CORREÇÃO: Verificar loading antes de usar
                    if (success) {
                        if (loading && loading.setVariant && loading.updateMessage) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel atualizado com sucesso!');
                        }
                        
                        setTimeout(() => {
                            alert(`✅ Imóvel "${updateData.title}" atualizado com sucesso!`);
                        }, 800);
                    } else {
                        if (loading && loading.setVariant && loading.updateMessage) {
                            loading.setVariant('error');
                            loading.updateMessage('Falha na atualização');
                        }
                        setTimeout(() => {
                            alert('❌ Não foi possível atualizar o imóvel.');
                        }, 800);
                    }
                }
                
            } else {
                console.log('🆕 Criando novo imóvel...');
                
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        if (loading && loading.setVariant && loading.updateMessage) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel cadastrado com sucesso!');
                        }
                        
                        setTimeout(() => {
                            alert(`✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`);
                        }, 800);
                    } else {
                        if (loading && loading.setVariant && loading.updateMessage) {
                            loading.setVariant('error');
                            loading.updateMessage('Falha na criação');
                        }
                        setTimeout(() => {
                            alert('❌ Não foi possível criar o imóvel.');
                        }, 800);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ ERRO:', error);
            alert(`❌ Erro: ${error.message}`);
            
            // ✅ CORREÇÃO: Fechar loading se existir
            if (loading && loading.hide) {
                loading.hide();
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = window.editingPropertyId ? 
                    '<i class="fas fa-save"></i> Salvar Alterações' : 
                    '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
            }
            
        } finally {
            setTimeout(() => {
                // ✅ CORREÇÃO: Verificar se loading existe antes de chamar hide()
                if (loading && loading.hide) {
                    loading.hide();
                }
                
                window.cleanAdminForm('reset');
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                    submitBtn.style.background = 'var(--success)';
                }
                
                if (typeof window.loadPropertyList === 'function') {
                    setTimeout(() => window.loadPropertyList(), 500);
                }
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos'), 800);
                }
                
                console.log('✅ Processo concluído');
            }, 1000);
        }
        
        console.groupEnd();
    });
    
    console.log('✅ Formulário configurado');
};

// ========== SINCRONIZAÇÃO MANUAL ==========
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar com banco online?')) {
        const syncBtn = document.getElementById('syncButton');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }
        
        try {
            if (typeof window.syncWithSupabase === 'function') {
                const result = await window.syncWithSupabase();
                
                if (result?.success) {
                    alert(`✅ Sincronizado! ${result.count} novos imóveis.`);
                    if (window.loadPropertyList) window.loadPropertyList();
                } else {
                    alert('⚠️ Falha na sincronização.');
                }
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            alert('❌ Erro ao sincronizar.');
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
            }
        }
    }
};

console.log('✅ admin.js - CORREÇÃO DO LOADINGMANAGER APLICADA');
