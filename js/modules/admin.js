// js/modules/admin.js - SISTEMA ADMIN COM UPLOAD FUNCIONAL
console.log('🔧 admin.js carregado - Sistema Administrativo com Upload Funcional');

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
 * Método mais simples e confiável
 */
window.setupUploadInputs = function() {
    console.log('🎯 Configurando inputs de upload DIRETAMENTE...');
    
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
            console.log('🎯 Área de upload CLICADA');
            e.preventDefault();
            e.stopPropagation();
            freshInput.click();
        });
        
        // Listener DIRETO no input
        freshInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files.length > 0) {
                console.log(`📁 ${e.target.files.length} arquivo(s) selecionado(s)`);
                
                // Verificar se MediaSystem está pronto
                if (window.MediaSystem && typeof window.MediaSystem.addFiles === 'function') {
                    const added = window.MediaSystem.addFiles(e.target.files);
                    console.log(`✅ ${added} arquivo(s) adicionado(s) ao MediaSystem`);
                    
                    // Atualizar UI IMEDIATAMENTE
                    setTimeout(() => {
                        if (window.MediaSystem.updateUI) {
                            window.MediaSystem.updateUI();
                        }
                    }, 50);
                } else {
                    console.error('❌ MediaSystem não disponível');
                    alert('⚠️ Sistema de mídia não está carregado. Recarregue a página.');
                }
                
                // Limpar input
                e.target.value = '';
            }
        });
        
        console.log('✅ Input de fotos/vídeos configurado');
    }
    
    // 2. INPUT DE PDFs
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    
    if (pdfFileInput && pdfUploadArea) {
        console.log('📄 Configurando input de PDFs...');
        
        // Garantir que o input está visível e clicável
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
        
        // Remover TODOS os listeners antigos
        const newPdfInput = pdfFileInput.cloneNode(true);
        pdfFileInput.parentNode.replaceChild(newPdfInput, pdfFileInput);
        
        const newPdfArea = pdfUploadArea.cloneNode(true);
        pdfUploadArea.parentNode.replaceChild(newPdfArea, pdfUploadArea);
        
        // Obter elementos FRESCOS
        const freshPdfInput = document.getElementById('pdfFileInput');
        const freshPdfArea = document.getElementById('pdfUploadArea');
        
        // Listener SIMPLES e DIRETO na área
        freshPdfArea.addEventListener('click', function(e) {
            console.log('🎯 Área de PDF CLICADA');
            e.preventDefault();
            e.stopPropagation();
            freshPdfInput.click();
        });
        
        // Listener DIRETO no input
        freshPdfInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files.length > 0) {
                console.log(`📄 ${e.target.files.length} PDF(s) selecionado(s)`);
                
                if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                    const added = window.MediaSystem.addPdfs(e.target.files);
                    console.log(`✅ ${added} PDF(s) adicionado(s) ao MediaSystem`);
                    
                    // Atualizar UI IMEDIATAMENTE
                    setTimeout(() => {
                        if (window.MediaSystem.updateUI) {
                            window.MediaSystem.updateUI();
                        }
                    }, 50);
                }
                
                // Limpar input
                e.target.value = '';
            }
        });
        
        console.log('✅ Input de PDFs configurado');
    }
    
    window._mediaState.initialized = true;
    console.log('🎉 Sistema de upload configurado com sucesso');
    return true;
};

/**
 * FORÇAR REINICIALIZAÇÃO DOS UPLOADS
 * Chamar sempre que houver problemas
 */
window.fixUploadSystem = function() {
    console.log('🔧 FORÇANDO correção do sistema de upload...');
    window._mediaState.initialized = false;
    
    // Remover elementos problemáticos
    const inputs = ['fileInput', 'pdfFileInput'];
    const areas = ['uploadArea', 'pdfUploadArea'];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
        }
    });
    
    areas.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
        }
    });
    
    // Reconfigurar após pequeno delay
    setTimeout(() => {
        window.setupUploadInputs();
    }, 100);
    
    return true;
};

/* ==========================================================
   FUNÇÃO cleanAdminForm COMPLETAMENTE REESCRITA
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log(`🧹 cleanAdminForm(${mode}) - REESCRITA COMPLETA`);
    
    // ✅ REGISTRAR QUANDO FOI LIMPO
    window._mediaState.lastCleanTime = Date.now();
    
    // 1. SEMPRE LIMPAR estado de edição
    const wasEditing = !!window.editingPropertyId;
    window.editingPropertyId = null;
    
    // 2. LIMPAR FORMULÁRIO COMPLETAMENTE
    const form = document.getElementById('propertyForm');
    if (form) {
        console.log('📝 Resetando formulário...');
        form.reset();
        
        // Valores padrão
        document.getElementById('propType').value = 'residencial';
        document.getElementById('propBadge').value = 'Novo';
        document.getElementById('propHasVideo').checked = false;
    }
    
    // 3. RESETAR UI
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
    
    // 4. ✅✅✅ CRÍTICO: LIMPAR MediaSystem COMPLETAMENTE
    if (window.MediaSystem) {
        console.log('🔄 LIMPANDO MediaSystem COMPLETAMENTE...');
        
        // Método 1: Usar resetState se disponível
        if (typeof MediaSystem.resetState === 'function') {
            MediaSystem.resetState();
            console.log('✅ MediaSystem.resetState() executado');
        }
        
        // Método 2: Limpar manualmente se necessário
        else if (MediaSystem.state) {
            MediaSystem.state.files = [];
            MediaSystem.state.pdfs = [];
            MediaSystem.state.existing = [];
            MediaSystem.state.existingPdfs = [];
            MediaSystem.state.currentPropertyId = null;
            MediaSystem.state.isUploading = false;
            console.log('✅ Estado do MediaSystem limpo manualmente');
        }
        
        // Método 3: Chamar funções de limpeza específicas
        if (typeof MediaSystem.clearAll === 'function') {
            MediaSystem.clearAll();
        }
        if (typeof MediaSystem.clearAllPdfs === 'function') {
            MediaSystem.clearAllPdfs();
        }
        
        // ✅ CORREÇÃO: Atualizar UI para mostrar que está vazio
        setTimeout(() => {
            if (MediaSystem.updateUI) {
                MediaSystem.updateUI();
                console.log('✅ UI do MediaSystem atualizada (vazia)');
            }
        }, 50);
    }
    
    // 5. LIMPAR PREVIEWS VISUAIS
    const previewContainers = ['uploadPreview', 'pdfUploadPreview'];
    previewContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; opacity: 0.5; margin-bottom: 1rem;"></i>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem;">Nenhum arquivo selecionado</p>
                    <small style="font-size: 0.8rem; opacity: 0.7;">Clique na área acima para adicionar</small>
                </div>
            `;
        }
    });
    
    // 6. ✅✅✅ RECONFIGURAR UPLOADS APÓS LIMPEZA
    setTimeout(() => {
        console.log('🔄 Reconfigurando sistema de upload após limpeza...');
        window.setupUploadInputs();
    }, 100);
    
    console.log(`✅ Formulário limpo ${mode === 'cancel' ? '(cancelamento)' : ''}`);
    
    // Feedback visual
    if (mode === 'cancel' && window.showNotification) {
        window.showNotification('Edição cancelada', 'info');
    }
    
    return true;
};

/* ==========================================================
   FUNÇÃO cancelEdit SIMPLIFICADA
   ========================================================== */
window.cancelEdit = function() {
    console.group('admin', 'cancelEdit()');
    
    if (window.editingPropertyId) {
        const confirmCancel = confirm('Deseja realmente cancelar a edição?\n\nTodas as alterações NÃO SALVAS serão perdidas.');
        if (!confirmCancel) {
            console.log('Cancelamento abortado');
            console.groupEnd();
            return false;
        }
    }
    
    window.cleanAdminForm('cancel');
    console.groupEnd();
    return true;
};

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
window.toggleAdminPanel = function() {
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
    
    if (password === null) {
        console.log('Usuário cancelou o acesso');
        return;
    }
    
    if (password === "") {
        alert('⚠️ Campo de senha vazio!');
        return;
    }
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            
            console.log(`Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
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
    
    // 1. Painel oculto por padrão
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    // 2. Botão toggle
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.onclick = (e) => {
            e.preventDefault();
            window.toggleAdminPanel();
        };
    }
    
    // 3. Botão cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            window.cancelEdit();
        };
    }
    
    // 4. ✅ CONFIGURAR UPLOADS NA INICIALIZAÇÃO
    setTimeout(() => {
        console.log('⚙️ Configurando sistema na inicialização...');
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

// ========== INTEGRAÇÃO DIRETA COM MediaSystem ==========
window.handleNewMediaFiles = function(files) {
    console.log('➕ Adicionando', files.length, 'arquivo(s) de mídia');
    
    if (!window.MediaSystem) {
        console.error('❌ MediaSystem não disponível');
        return 0;
    }
    
    if (typeof MediaSystem.addFiles !== 'function') {
        console.error('❌ MediaSystem.addFiles não é uma função');
        return 0;
    }
    
    const result = MediaSystem.addFiles(files);
    
    // Atualizar UI
    setTimeout(() => {
        if (MediaSystem.updateUI) {
            MediaSystem.updateUI();
        }
    }, 50);
    
    return result;
};

window.handleNewPdfFiles = function(files) {
    console.log('➕ Adicionando', files.length, 'PDF(s)');
    
    if (!window.MediaSystem || typeof MediaSystem.addPdfs !== 'function') {
        return 0;
    }
    
    const result = MediaSystem.addPdfs(files);
    
    // Atualizar UI
    setTimeout(() => {
        if (MediaSystem.updateUI) {
            MediaSystem.updateUI();
        }
    }, 50);
    
    return result;
};

window.loadExistingMediaForEdit = function(property) {
    if (window.MediaSystem && MediaSystem.loadExisting) {
        MediaSystem.loadExisting(property);
        
        // Atualizar UI após carregar
        setTimeout(() => {
            if (MediaSystem.updateUI) {
                MediaSystem.updateUI();
            }
        }, 100);
    }
};

// ========== WRAPPER SIMPLIFICADO DE PDFs ==========
window.adminPdfHandler = {
    clear: function() {
        return window.MediaSystem?.clearAllPdfs?.() || 0;
    },
    
    load: function(property) {
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 0;
    },
    
    process: async function(id, title) {
        return await (window.MediaSystem?.processAndSavePdfs?.(id, title) || '');
    }
};

// Funções de compatibilidade
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    return await window.adminPdfHandler.process(propertyId, propertyTitle);
};

window.clearAllPdfs = function() {
    return window.adminPdfHandler.clear();
};

window.loadExistingPdfsForEdit = function(property) {
    return window.adminPdfHandler.load(property);
};

window.getPdfsToSave = async function(propertyId) {
    return await window.processAndSavePdfs(propertyId, 'Imóvel');
};

window.clearProcessedPdfs = function() {
    if (MediaSystem?.state?.pdfs) {
        MediaSystem.state.pdfs = MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
        if (MediaSystem.updateUI) {
            MediaSystem.updateUI();
        }
    }
};

// ========== FUNÇÕES DO FORMULÁRIO ==========

window.loadPropertyList = function() {
    console.log('📋 Carregando lista de imóveis...');
    
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
    
    console.log(`✅ ${window.properties.length} imóveis listados`);
};

// ========== FUNÇÃO editProperty CORRIGIDA ==========
window.editProperty = function(id) {
    console.group(`✏️ EDITANDO IMÓVEL ${id}`);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        console.groupEnd();
        return;
    }

    // ✅ LIMPAR TUDO ANTES DE EDITAR (evita vazamento)
    window.cleanAdminForm('reset');
    
    // Preencher formulário
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

    // Atualizar UI
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

    // Carregar mídia existente (com delay para garantir DOM)
    setTimeout(() => {
        if (window.MediaSystem && MediaSystem.loadExisting) {
            MediaSystem.loadExisting(property);
            
            // Atualizar UI após carregar
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 200);
        }
    }, 150);

    // Abrir painel se estiver fechado
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

    console.log(`✅ Imóvel ${id} pronto para edição`);
    console.groupEnd();
    return true;
};

// ========== CONFIGURAÇÃO DO FORMULÁRIO (FLUXO CORRETO) ==========
window.setupForm = function() {
    console.log('⚙️ Configurando formulário...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('❌ Formulário não encontrado');
        return;
    }
    
    // Clonar para remover listeners antigos
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Formatação de preço
    if (window.setupPriceAutoFormat) {
        window.setupPriceAutoFormat();
    }
    
    // Configurar submit CORRETO
    const freshForm = document.getElementById('propertyForm');
    freshForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.group('💾 SALVANDO IMÓVEL');
        
        const loading = window.LoadingManager?.show?.(
            'Salvando Imóvel...', 
            'Por favor, aguarde...', 
            { variant: 'processing' }
        );
        
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }
        
        try {
            // Coletar dados
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
            
            // Validação
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                alert('❌ Preencha Título, Preço e Localização!');
                if (submitBtn) submitBtn.disabled = false;
                if (loading) loading.hide();
                console.groupEnd();
                return;
            }
            
            if (window.editingPropertyId) {
                // EDIÇÃO
                console.log(`✏️ Editando imóvel ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // Processar PDFs
                if (window.adminPdfHandler) {
                    const pdfsString = await window.adminPdfHandler.process(window.editingPropertyId, propertyData.title);
                    if (pdfsString && pdfsString.trim() !== '') {
                        updateData.pdfs = pdfsString;
                    }
                }
                
                // Processar mídia
                if (window.MediaSystem && window.MediaSystem.getOrderedMediaUrls) {
                    const ordered = window.MediaSystem.getOrderedMediaUrls();
                    if (ordered.images && ordered.images.trim() !== '') {
                        updateData.images = ordered.images;
                    }
                }
                
                // Salvar
                if (typeof window.updateProperty === 'function') {
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    if (success) {
                        if (loading) loading.setVariant('success').updateMessage('Imóvel atualizado!');
                        
                        setTimeout(() => {
                            alert(`✅ Imóvel "${updateData.title}" atualizado com sucesso!`);
                        }, 800);
                    } else {
                        if (loading) loading.setVariant('error').updateMessage('Falha na atualização');
                        setTimeout(() => {
                            alert('❌ Não foi possível atualizar o imóvel.');
                        }, 800);
                    }
                }
                
            } else {
                // NOVO IMÓVEL
                console.log('🆕 Criando novo imóvel...');
                
                // Criar no banco
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        if (loading) loading.setVariant('success').updateMessage('Imóvel cadastrado!');
                        
                        setTimeout(() => {
                            alert(`✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`);
                        }, 800);
                    } else {
                        if (loading) loading.setVariant('error').updateMessage('Falha na criação');
                        setTimeout(() => {
                            alert('❌ Não foi possível criar o imóvel.');
                        }, 800);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ ERRO:', error);
            alert(`❌ Erro: ${error.message}`);
            
            if (loading) loading.hide();
            if (submitBtn) submitBtn.disabled = false;
            
        } finally {
            setTimeout(() => {
                if (loading) loading.hide();
                
                // ✅✅✅ LIMPAR COMPLETAMENTE APÓS SALVAR
                window.cleanAdminForm('reset');
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                    submitBtn.style.background = 'var(--success)';
                }
                
                // Atualizar listas
                if (typeof window.loadPropertyList === 'function') {
                    setTimeout(() => window.loadPropertyList(), 500);
                }
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos'), 800);
                }
                
                console.log('✅ Processo concluído - Formulário limpo');
            }, 1000);
        }
        
        console.groupEnd();
    });
    
    console.log('✅ Formulário configurado');
};

// ========== SINCRONIZAÇÃO MANUAL ==========
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar com banco online?')) {
        console.log('Sincronizando...');
        
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

// ========== TESTE DE UPLOAD NO CONSOLE ==========
setTimeout(() => {
    if (window.location.search.includes('debug=true')) {
        console.group('🧪 DIAGNÓSTICO DE UPLOAD');
        
        console.log('🎯 Elementos críticos:');
        ['uploadArea', 'fileInput', 'pdfUploadArea', 'pdfFileInput'].forEach(id => {
            const el = document.getElementById(id);
            console.log(`  ${el ? '✅' : '❌'} ${id}:`, {
                existe: !!el,
                display: el ? window.getComputedStyle(el).display : 'N/A',
                position: el ? window.getComputedStyle(el).position : 'N/A',
                zIndex: el ? window.getComputedStyle(el).zIndex : 'N/A',
                cursor: el ? window.getComputedStyle(el).cursor : 'N/A'
            });
        });
        
        console.log('🛠️ Comandos de teste:');
        console.log(`
1. Testar clique manual:
   document.getElementById('uploadArea').click()
   
2. Forçar reconfiguração:
   window.fixUploadSystem()
   
3. Testar adição direta:
   const file = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
   window.handleNewMediaFiles([file])
   
4. Limpar tudo:
   window.cleanAdminForm('reset')
        `);
        
        console.groupEnd();
    }
}, 2000);

// ========== FUNÇÃO DE EMERGÊNCIA ==========
window.emergencyUploadFix = function() {
    console.warn('🚨 ATIVAÇÃO DE MODO DE EMERGÊNCIA PARA UPLOAD');
    
    // 1. Remover todos os event listeners
    const elements = [
        'uploadArea', 'fileInput', 'pdfUploadArea', 'pdfFileInput',
        'uploadPreview', 'pdfUploadPreview'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
        }
    });
    
    // 2. Resetar MediaSystem completamente
    if (window.MediaSystem) {
        if (MediaSystem.resetState) MediaSystem.resetState();
        if (MediaSystem.state) {
            MediaSystem.state.files = [];
            MediaSystem.state.pdfs = [];
        }
    }
    
    // 3. Configurar do zero
    setTimeout(() => {
        // Estilos garantidos
        const fileInput = document.getElementById('fileInput');
        const pdfInput = document.getElementById('pdfFileInput');
        
        if (fileInput) {
            fileInput.style.cssText = `
                position: absolute !important;
                width: 100% !important;
                height: 100% !important;
                top: 0 !important;
                left: 0 !important;
                opacity: 0 !important;
                cursor: pointer !important;
                z-index: 9999 !important;
                display: block !important;
                visibility: visible !important;
            `;
        }
        
        if (pdfInput) {
            pdfInput.style.cssText = fileInput.style.cssText;
        }
        
        // Listeners diretos
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea && fileInput) {
            uploadArea.onclick = function(e) {
                e.preventDefault();
                console.log('EMERGENCY: Área clicada');
                fileInput.click();
            };
            
            fileInput.onchange = function(e) {
                if (e.target.files.length > 0 && window.MediaSystem?.addFiles) {
                    window.MediaSystem.addFiles(e.target.files);
                    setTimeout(() => {
                        if (MediaSystem.updateUI) MediaSystem.updateUI();
                    }, 50);
                }
                e.target.value = '';
            };
        }
        
        console.log('✅ MODO DE EMERGÊNCIA ATIVADO - Upload deve funcionar');
        alert('🚨 Modo de emergência ativado. Tente o upload novamente.');
    }, 100);
};

console.log('✅ admin.js - SISTEMA DE UPLOAD CORRIGIDO E SIMPLIFICADO');
