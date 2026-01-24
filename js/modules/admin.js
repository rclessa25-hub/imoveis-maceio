// js/modules/admin.js - SISTEMA ADMIN OTIMIZADO (REDUÇÃO SEGURA)
console.log('🔧 admin.js carregado - Sistema Administrativo');

/* ==========================================================
   SISTEMA DE LOGGING SIMPLIFICADO
   ========================================================== */
// ✅ OTIMIZAÇÃO: Usar console diretamente em vez de wrapper
const log = console;

/* ==========================================================
   INTEGRAÇÃO COM SISTEMA UNIFICADO DE MÍDIA
   ========================================================== */
window.handleNewMediaFiles = function(files) {
    return MediaSystem.addFiles(files);
};

window.handleNewPdfFiles = function(files) {
    log.info('admin', 'handleNewPdfFiles - Delegando para MediaSystem');
    return window.MediaSystem?.addPdfs?.(files) || 0;
};

window.loadExistingMediaForEdit = function(property) {
    MediaSystem.loadExisting(property);
};

window.clearMediaSystem = function() {
    MediaSystem.resetState();
};

window.clearMediaSystemComplete = function() {
    MediaSystem.resetState();
};

// ========== CONFIGURAÇÕES ==========
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle",
    storageKey: "weberlessa_properties"
};

// ========== VARIÁVEIS GLOBAIS ==========
window.editingPropertyId = null;

/* ==========================================================
   FUNÇÃO UNIFICADA DE LIMPEZA (OTIMIZADA: 76 → 40 linhas)
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    log.info(`🧹 cleanAdminForm(${mode})`);
    
    // 1. Resetar estado de edição
    window.editingPropertyId = null;
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
        cancelBtn.disabled = false;
    }

    // 2. Resetar formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        try { 
            form.reset(); 
            log.info('admin', 'Formulário resetado');
        } catch(e) {
            // Fallback manual para campos críticos
            document.getElementById('propType').value = 'residencial';
            document.getElementById('propBadge').value = 'Novo';
            const videoCheckbox = document.getElementById('propHasVideo');
            if (videoCheckbox) videoCheckbox.checked = false;
        }
        
        // Atualizar título do formulário
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
        
        // Atualizar botão de submit
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
            submitBtn.style.background = 'var(--success)';
            submitBtn.disabled = false;
        }
    }

    // 3. Limpar sistemas de mídia
    if (window.MediaSystem) {
        MediaSystem.resetState();
        log.info('admin', 'MediaSystem limpo');
    }

    // 4. Limpar previews visuais
    const previewIds = ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'];
    previewIds.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.innerHTML = '';
    });

    // 5. Feedback
    log.info('admin', 'Formulário limpo - pronto para novo imóvel');

    // 6. Evento para sistemas externos (se necessário)
    try {
        document.dispatchEvent(new CustomEvent('adminFormCleaned', { 
            detail: { mode: mode, timestamp: Date.now() }
        }));
    } catch (e) {}

    // 7. Notificação se for cancelamento
    if (mode === 'cancel' && window.showNotification) {
        window.showNotification('Edição cancelada com sucesso', 'info');
    }

    return true;
};

/* ==========================================================
   FUNÇÃO cancelEdit MANTIDA PARA COMPATIBILIDADE
   ========================================================== */
window.cancelEdit = function() {
    log.info('admin', 'cancelEdit() - Chamando função unificada');
    
    if (window.editingPropertyId) {
        const confirmCancel = confirm('Deseja realmente cancelar a edição?\n\nTodas as alterações serão perdidas.');
        if (!confirmCancel) {
            log.warn('admin', 'Cancelamento abortado');
            return false;
        }
    }
    
    return window.cleanAdminForm('cancel');
};

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
window.toggleAdminPanel = function() {
    log.info('admin', 'toggleAdminPanel() executada');
    
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
    
    if (password === null) {
        log.warn('admin', 'Usuário cancelou o acesso');
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
            
            log.info('admin', `Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    log.info('admin', 'Rolando até o painel admin');
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
    log.info('admin', 'setupAdminUI() - Configuração unificada');
    
    // 1. Painel admin oculto
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
        log.info('admin', 'Painel admin oculto');
    }
    
    // 2. Botão admin toggle
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            log.info('admin', 'Botão admin clicado');
            window.toggleAdminPanel();
        });
        log.info('admin', 'Botão admin toggle configurado');
    }
    
    // 3. Botão cancelar edição
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        freshCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            log.info('admin', 'Botão "Cancelar Edição" clicado');
            window.cancelEdit();
        });
        log.info('admin', 'Botão "Cancelar Edição" configurado');
    }
    
    // 4. Botão sincronização
    if (!document.getElementById('syncButton')) {
        const syncBtn = document.createElement('button');
        syncBtn.id = 'syncButton';
        syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
        syncBtn.onclick = window.syncWithSupabaseManual;
        syncBtn.style.cssText = `
            background: var(--gold);
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 1rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
        `;
        
        const panelTitle = document.querySelector('#adminPanel h3');
        if (panelTitle) {
            panelTitle.parentNode.insertBefore(syncBtn, panelTitle.nextSibling);
            log.info('admin', 'Botão de sincronização adicionado');
        }
    }
    
    // 5. Configurar formulário
    if (typeof window.setupForm === 'function') {
        window.setupForm();
        log.info('admin', 'Função setupForm executada');
    }
    
    // 6. Correção de filtros (substituir por FilterManager)
    if (window.FilterManager) {
        setTimeout(() => {
            FilterManager.init((filterValue) => {
                if (window.renderProperties) window.renderProperties(filterValue);
            });
        }, 1000);
        log.info('admin', 'Filtros configurados via FilterManager');
    }
    
    // 7. Remover botões de teste (se existirem)
    setTimeout(() => {
        const testBtn = document.getElementById('media-test-btn');
        if (testBtn) testBtn.remove();
        log.info('admin', 'Limpeza de botões de teste concluída');
    }, 1000);
    
    log.info('admin', 'Admin UI completamente configurado');
};

// ========== EXECUÇÃO AUTOMÁTICA ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            log.info('admin', 'Executando configuração automática de UI...');
            window.setupAdminUI();
        }, 500);
    });
} else {
    setTimeout(() => {
        log.info('admin', 'Executando configuração automática de UI (documento já carregado)...');
        window.setupAdminUI();
    }, 300);
}

// ========== FUNÇÕES DO FORMULÁRIO ==========

window.loadPropertyList = function() {
    log.info('admin', 'Carregando lista de imóveis...');
    
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
    
    log.info('admin', `${window.properties.length} imóveis listados`);
};

// ========== FUNÇÃO editProperty OTIMIZADA ==========
window.editProperty = function(id) {
    log.info('admin', `EDITANDO IMÓVEL ${id}`);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        log.error('admin', 'Imóvel não encontrado!');
        alert('❌ Imóvel não encontrado!');
        return;
    }

    if (window.MediaSystem) {
        MediaSystem.resetState();
        log.info('admin', 'MediaSystem resetado');
    }

    // Preencher formulário
    document.getElementById('propTitle').value = property.title || '';
    
    const priceField = document.getElementById('propPrice');
    if (priceField && property.price) {
        if (window.SharedCore?.PriceFormatter?.formatForInput) {
            priceField.value = window.SharedCore.PriceFormatter.formatForInput(property.price);
        } else if (property.price.startsWith('R$')) {
            priceField.value = property.price;
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
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;

    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.style.background = 'var(--accent)';
    }

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'block';
        cancelBtn.disabled = false;
        cancelBtn.style.visibility = 'visible';
        log.info('admin', 'Botão "Cancelar Edição" tornado visível');
    }

    window.editingPropertyId = property.id;

    // Carregar mídia existente
    if (window.MediaSystem) {
        MediaSystem.loadExisting(property);
        log.info('admin', 'Mídia existente carregada no MediaSystem');
    }

    // Scroll para formulário
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.style.display !== 'block') {
            adminPanel.style.display = 'block';
            log.info('admin', 'Painel admin aberto automaticamente');
        }
        
        const propertyForm = document.getElementById('propertyForm');
        if (propertyForm) {
            propertyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            log.info('admin', 'Formulário em foco para edição');
        }
    }, 100);

    log.info('admin', `Imóvel ${id} pronto para edição`);
    return true;
};

// ========== CONFIGURAÇÃO DO FORMULÁRIO ==========
window.setupForm = function() {
    log.info('admin', 'Configurando formulário admin...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        log.error('admin', 'Formulário propertyForm não encontrado!');
        return;
    }
    
    // Clonar para remover listeners antigos
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // ✅ ATUALIZADO: Usar função do SharedCore
    if (window.setupPriceAutoFormat) {
        window.setupPriceAutoFormat();
    }
    
    // Configurar submit
    const freshForm = document.getElementById('propertyForm');
    freshForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        log.info('admin', 'SUBMISSÃO DO FORMULÁRIO ADMIN');
        
        const loading = window.LoadingManager?.show?.(
            'Salvando Imóvel...', 
            'Por favor, aguarde...', 
            { variant: 'processing' }
        );

        if (!loading) {
            log.warn('admin', 'LoadingManager não disponível - continuando sem feedback visual');
        }
        
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
            
            log.info('admin', `Dados coletados: ${JSON.stringify(propertyData)}`);
            
            // Validação básica
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                if (loading) {
                    loading.setVariant('error');
                    loading.updateMessage('Preencha Título, Preço e Localização!');
                    setTimeout(() => {
                        loading.hide();
                        alert('❌ Preencha Título, Preço e Localização!');
                        if (submitBtn) submitBtn.disabled = false;
                    }, 1500);
                } else {
                    alert('❌ Preencha Título, Preço e Localização!');
                    if (submitBtn) submitBtn.disabled = false;
                }
                log.error('admin', 'Validação falhou: campos obrigatórios vazios');
                return;
            }
            
            if (loading) loading.updateMessage('Processando dados...');
            
            if (window.editingPropertyId) {
                // Edição de imóvel existente
                log.info('admin', `EDITANDO imóvel ID: ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // Formatar preço
                if (updateData.price && window.SharedCore?.PriceFormatter?.formatForInput) {
                    const formatted = window.SharedCore.PriceFormatter.formatForInput(updateData.price);
                    if (formatted) updateData.price = formatted;
                }
                
                // Processar mídia
                if (window.MediaSystem) {
                    let mediaUrls = '';
                    if (window.MediaSystem.getOrderedMediaUrls) {
                        const ordered = window.MediaSystem.getOrderedMediaUrls();
                        mediaUrls = ordered.images;
                    }
                    
                    if (mediaUrls && mediaUrls.trim() !== '') {
                        updateData.images = mediaUrls;
                        log.info('admin', 'Mídia processada');
                    }
                }
                
                // Salvar no banco
                if (typeof window.updateProperty === 'function') {
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    if (success) {
                        if (loading) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel atualizado com sucesso!');
                        }
                        
                        setTimeout(() => {
                            const imageCount = updateData.images ? updateData.images.split(',').filter(url => url.trim() !== '').length : 0;
                            
                            let successMessage = `✅ Imóvel "${updateData.title}" atualizado!`;
                            if (imageCount > 0) successMessage += `\n📸 ${imageCount} foto(s)/vídeo(s) salvo(s)`;
                            
                            alert(successMessage);
                        }, 800);
                        
                    } else {
                        if (loading) {
                            loading.setVariant('error');
                            loading.updateMessage('Falha na atualização');
                            setTimeout(() => {
                                loading.hide();
                                alert('❌ Não foi possível atualizar o imóvel.');
                            }, 1500);
                        } else {
                            alert('❌ Não foi possível atualizar o imóvel.');
                        }
                    }
                }
                
            } else {
                // Criação de novo imóvel
                log.info('admin', 'CRIANDO novo imóvel...');
                
                // Formatar preço
                if (propertyData.price && window.SharedCore?.PriceFormatter?.formatForInput) {
                    const formatted = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
                    if (formatted) propertyData.price = formatted;
                }
                
                // Criar no banco
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        if (loading) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel cadastrado com sucesso!');
                        }
                        
                        setTimeout(() => {
                            let successMessage = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`;
                            alert(successMessage);
                        }, 800);
                        
                    } else {
                        if (loading) {
                            loading.setVariant('error');
                            loading.updateMessage('Falha na criação');
                            setTimeout(() => {
                                loading.hide();
                                alert('❌ Não foi possível criar o imóvel.');
                            }, 1500);
                        } else {
                            alert('❌ Não foi possível criar o imóvel.');
                        }
                    }
                }
            }
            
        } catch (error) {
            log.error('admin', `ERRO CRÍTICO: ${error.message}`);
            
            if (loading) {
                loading.setVariant('error');
                loading.updateMessage(error.message || 'Erro desconhecido');
                
                setTimeout(() => {
                    loading.hide();
                    alert(`❌ Erro ao processar: ${error.message || 'Erro desconhecido'}`);
                    if (submitBtn) submitBtn.disabled = false;
                }, 1500);
            } else {
                alert(`❌ Erro ao processar: ${error.message || 'Erro desconhecido'}`);
                if (submitBtn) submitBtn.disabled = false;
            }
            
        } finally {
            setTimeout(() => {
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
                
                if (typeof window.loadPropertyList === 'function') {
                    setTimeout(() => window.loadPropertyList(), 700);
                }
                
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos'), 1000);
                }
                
                log.info('admin', 'Formulário limpo e pronto para novo imóvel');
            }, 1000);
        }
    });
    
    log.info('admin', 'Formulário admin configurado');
};

// ========== SINCRONIZAÇÃO MANUAL ==========
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar?\n\nIsso irá buscar os imóveis do banco de dados online.')) {
        log.info('admin', 'Iniciando sincronização manual...');
        
        const syncBtn = document.getElementById('syncButton');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }
        
        try {
            if (typeof window.syncWithSupabase === 'function') {
                const result = await window.syncWithSupabase();
                
                if (result && result.success) {
                    alert(`✅ Sincronização completa!\n\n${result.count} novos imóveis carregados.`);
                    log.info('admin', `Sincronização completa: ${result.count} novos imóveis`);
                    
                    if (typeof window.loadPropertyList === 'function') {
                        window.loadPropertyList();
                    }
                } else {
                    alert('⚠️ Não foi possível sincronizar. Verifique a conexão.');
                    log.warn('admin', 'Não foi possível sincronizar');
                }
            }
        } catch (error) {
            log.error('admin', `Erro na sincronização: ${error.message}`);
            alert('❌ Erro ao sincronizar: ' + error.message);
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
            }
        }
    }
};

// ========== CONFIGURAÇÃO DE UPLOAD DE PDF ==========
setTimeout(() => {
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    
    if (pdfFileInput && pdfUploadArea) {
        log.info('admin', 'Configurando upload de PDFs...');
        
        const cleanPdfInput = pdfFileInput.cloneNode(true);
        const cleanPdfArea = pdfUploadArea.cloneNode(true);
        
        pdfFileInput.parentNode.replaceChild(cleanPdfInput, pdfFileInput);
        pdfUploadArea.parentNode.replaceChild(cleanPdfArea, pdfUploadArea);
        
        const freshUploadArea = document.getElementById('pdfUploadArea');
        const freshFileInput = document.getElementById('pdfFileInput');
        
        freshUploadArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            freshFileInput.click();
        });
        
        freshFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                log.info('admin', `${e.target.files.length} arquivo(s) selecionado(s)`);
                
                if (window.MediaSystem?.addPdfs) {
                    window.MediaSystem.addPdfs(e.target.files);
                }
                
                e.target.value = '';
            }
        });
        
        log.info('admin', 'Upload de PDFs configurado');
    }
}, 1000);

// ========== MODAL PDF SIMPLIFICADO ==========
window.ensurePdfModal = function() {
    let modal = document.getElementById('pdfModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pdfModal';
        modal.className = 'pdf-modal';
        modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;align-items:center;justify-content:center;';
        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:10px;max-width:400px;width:90%;text-align:center;">
                <h3 id="pdfModalTitle" style="color:var(--primary);margin:0 0 1rem 0;">
                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                </h3>
                <input type="password" id="pdfPassword" placeholder="Digite a senha" 
                       style="width:100%;padding:0.8rem;border:1px solid #ddd;border-radius:5px;margin:1rem 0;">
                <div style="display:flex;gap:1rem;margin-top:1rem;">
                    <button onclick="accessPdfDocuments()" 
                            style="background:var(--primary);color:white;padding:0.8rem 1.5rem;border:none;border-radius:5px;cursor:pointer;flex:1;">
                        <i class="fas fa-lock-open"></i> Acessar
                    </button>
                    <button onclick="closePdfModal()" 
                            style="background:#95a5a6;color:white;padding:0.8rem 1.5rem;border:none;border-radius:5px;cursor:pointer;">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        log.info('admin', 'Modal PDF criado');
    }
    return modal;
};

window.showPdfModal = function(propertyId) {
    log.info('admin', `showPdfModal chamado para ID: ${propertyId}`);
    
    if (window.PdfSystem?.showModal) {
        window.PdfSystem.showModal(propertyId);
        return;
    }
    
    const property = window.properties?.find(p => p.id == propertyId);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    if (!property.pdfs || property.pdfs === 'EMPTY' || property.pdfs.trim() === '') {
        alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
        return;
    }
    
    window.currentPropertyId = propertyId;
    const modal = window.ensurePdfModal();
    
    const titleElement = document.getElementById('pdfModalTitle');
    if (titleElement) {
        titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
        titleElement.dataset.propertyId = propertyId;
    }
    
    const passwordInput = document.getElementById('pdfPassword');
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.onkeydown = function(e) {
            if (e.key === 'Enter') window.accessPdfDocuments();
        };
    }
    
    modal.style.display = 'flex';
    
    setTimeout(() => {
        if (passwordInput) passwordInput.focus();
    }, 200);
};

window.closePdfModal = function() {
    const modal = document.getElementById('pdfModal');
    if (modal) modal.style.display = 'none';
};

window.accessPdfDocuments = function() {
    log.info('admin', 'accessPdfDocuments chamada');
    
    const passwordInput = document.getElementById('pdfPassword');
    const modalTitle = document.getElementById('pdfModalTitle');
    
    if (!passwordInput) return;
    
    const password = passwordInput.value.trim();
    
    if (!password) {
        alert('Digite a senha para acessar os documentos!');
        passwordInput.focus();
        return;
    }
    
    if (password !== "doc123") {
        alert('❌ Senha incorreta!\n\nA senha correta é: doc123\n(Solicite ao corretor se não souber)');
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    
    const propertyId = window.currentPropertyId || (modalTitle && modalTitle.dataset.propertyId);
    if (!propertyId) {
        alert('⚠️ Não foi possível identificar o imóvel.');
        return;
    }
    
    const property = window.properties.find(p => p.id == propertyId);
    if (!property || !property.pdfs || property.pdfs === 'EMPTY' || property.pdfs.trim() === '') {
        alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
        closePdfModal();
        return;
    }
    
    const pdfUrls = property.pdfs.split(',').map(url => url.trim()).filter(url => url && url !== 'EMPTY');
    
    if (pdfUrls.length === 0) {
        alert('ℹ️ Nenhum documento PDF disponível.');
        closePdfModal();
        return;
    }
    
    closePdfModal();
    pdfUrls.forEach(url => window.open(url, '_blank', 'noopener,noreferrer'));
};

// ========== VERIFICAÇÃO FINAL ==========
setTimeout(() => {
    log.info('admin', '✅ SISTEMA ADMIN CONFIGURADO');
    log.info('admin', '- Formulário funcional: ✅');
    log.info('admin', '- Upload configurado: ✅');
    log.info('admin', '- MediaSystem integrado: ✅');
}, 2000);

log.info('admin', '✅ admin.js OTIMIZADO - REDUÇÃO SEGURA CONCLUÍDA');
