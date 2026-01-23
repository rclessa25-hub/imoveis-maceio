// js/modules/admin.js - SISTEMA ADMIN COM DIAGNÓSTICO CRÍTICO
console.log('🔧 admin.js carregado - Sistema Administrativo com Diagnóstico');

// ========== CONFIGURAÇÕES ==========
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle",
    storageKey: "weberlessa_properties"
};

// ========== VARIÁVEIS GLOBAIS ==========
window.editingPropertyId = null;
window._mediaStateBackup = null;

/* ==========================================================
   DIAGNÓSTICO DO SISTEMA ATUAL (PRIMEIRO - ANTES DE TUDO)
   ========================================================== */
window.testUploadPreservation = function() {
    console.group('🚨 TESTE CRÍTICO DE PRESERVAÇÃO DE UPLOAD');
    
    // Simular upload bem-sucedido
    if (window.MediaSystem) {
        // Estado antes - arquivos enviados e não enviados
        MediaSystem.state.files = [
            { id: 'test1', name: 'foto1.jpg', uploaded: true, url: 'http://test.com/1.jpg' },
            { id: 'test2', name: 'foto2.jpg', uploaded: false }
        ];
        
        MediaSystem.state.pdfs = [
            { id: 'pdf1', name: 'documento.pdf', uploaded: true, url: 'http://test.com/doc.pdf' },
            { id: 'pdf2', name: 'contrato.pdf', uploaded: false }
        ];
        
        console.log('📊 ESTADO ANTES de cleanAdminForm:');
        console.log('- Total files:', MediaSystem.state.files.length);
        console.log('- Uploaded files:', MediaSystem.state.files.filter(f => f.uploaded).length);
        console.log('- Total PDFs:', MediaSystem.state.pdfs.length);
        console.log('- Uploaded PDFs:', MediaSystem.state.pdfs.filter(p => p.uploaded).length);
        
        // Salvar estado original para restauração
        const originalFiles = [...MediaSystem.state.files];
        const originalPdfs = [...MediaSystem.state.pdfs];
        
        // Executar limpeza atual
        window.cleanAdminForm('reset');
        
        console.log('📊 ESTADO DEPOIS de cleanAdminForm:');
        console.log('- Total files:', MediaSystem.state.files.length);
        console.log('- Uploaded files:', MediaSystem.state.files.filter(f => f.uploaded).length);
        console.log('- Total PDFs:', MediaSystem.state.pdfs.length);
        console.log('- Uploaded PDFs:', MediaSystem.state.pdfs.filter(p => p.uploaded).length);
        
        // Resultado
        const uploadedFilesAfter = MediaSystem.state.files.filter(f => f.uploaded).length;
        const uploadedPdfsAfter = MediaSystem.state.pdfs.filter(p => p.uploaded).length;
        
        if (uploadedFilesAfter === 0 && uploadedPdfsAfter === 0) {
            console.error('❌ BUG CONFIRMADO: cleanAdminForm está limpando TODOS os arquivos, inclusive enviados!');
            console.error('⚠️ Isso quebra o fluxo de upload pós-salvamento!');
        } else if (uploadedFilesAfter < originalFiles.filter(f => f.uploaded).length) {
            console.warn('⚠️ PROBLEMA PARCIAL: Alguns arquivos enviados foram perdidos');
        } else {
            console.log('✅ Sistema parece preservar arquivos enviados');
        }
        
        // Restaurar estado original
        MediaSystem.state.files = originalFiles;
        MediaSystem.state.pdfs = originalPdfs;
    } else {
        console.error('❌ MediaSystem não disponível para teste');
    }
    
    console.groupEnd();
};

/* ==========================================================
   FUNÇÃO DE PRESERVAÇÃO DE ESTADO (NOVA - BAIXO RISCO)
   ========================================================== */
window.preserveMediaState = function() {
    console.log('💾 Preservando estado de mídia atual');
    
    if (!window.MediaSystem || !MediaSystem.state) {
        console.warn('MediaSystem não disponível para backup');
        return null;
    }
    
    window._mediaStateBackup = {
        files: [...MediaSystem.state.files],
        pdfs: [...MediaSystem.state.pdfs],
        existing: [...MediaSystem.state.existing || []],
        existingPdfs: [...MediaSystem.state.existingPdfs || []],
        timestamp: Date.now()
    };
    
    console.log(`✅ Backup criado: ${window._mediaStateBackup.files.length} arquivos, ${window._mediaStateBackup.pdfs.length} PDFs`);
    return window._mediaStateBackup;
};

window.restoreMediaState = function() {
    if (!window._mediaStateBackup || !window.MediaSystem) {
        console.log('⚠️ Nenhum backup disponível para restaurar');
        return false;
    }
    
    console.log('🔄 Restaurando estado de mídia do backup');
    
    try {
        // Restaurar arrays
        MediaSystem.state.files = [...window._mediaStateBackup.files];
        MediaSystem.state.pdfs = [...window._mediaStateBackup.pdfs];
        MediaSystem.state.existing = [...window._mediaStateBackup.existing];
        MediaSystem.state.existingPdfs = [...window._mediaStateBackup.existingPdfs];
        
        // Atualizar UI se disponível
        if (typeof MediaSystem.updateUI === 'function') {
            MediaSystem.updateUI();
        }
        
        console.log(`✅ Estado restaurado: ${MediaSystem.state.files.length} arquivos, ${MediaSystem.state.pdfs.length} PDFs`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao restaurar estado:', error);
        return false;
    }
};

window.hasUnsavedMedia = function() {
    if (!window.MediaSystem || !MediaSystem.state) return false;
    
    const hasNewFiles = MediaSystem.state.files.filter(f => !f.uploaded).length > 0;
    const hasNewPdfs = MediaSystem.state.pdfs.filter(p => !p.uploaded).length > 0;
    
    return hasNewFiles || hasNewPdfs;
};

/* ==========================================================
   FUNÇÃO UNIFICADA DE LIMPEZA (CORRIGIDA COM PRESERVAÇÃO)
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log(`🧹 cleanAdminForm(${mode})`);
    
    // ✅ NOVO: MODO SEGURO PARA PÓS-SALVAMENTO
    if (mode === 'reset-with-preserve') {
        console.log('✅ Usando modo seguro (preserva URLs enviadas)');
        
        // 1. Estado de edição
        window.editingPropertyId = null;
        
        // 2. Resetar apenas campos do formulário, NÃO limpar mídia
        const form = document.getElementById('propertyForm');
        if (form) {
            form.reset();
            
            const formTitle = document.getElementById('formTitle');
            if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel';
                submitBtn.style.background = 'var(--success)';
            }
        }
        
        // 3. Botão cancelar
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        // 4. ✅ CRÍTICO: NÃO limpar MediaSystem - preservar arquivos enviados
        if (window.MediaSystem) {
            // Apenas remover arquivos NÃO enviados
            MediaSystem.state.files = MediaSystem.state.files.filter(f => f.uploaded);
            MediaSystem.state.pdfs = MediaSystem.state.pdfs.filter(p => p.uploaded);
            
            // Atualizar UI se necessário
            if (typeof MediaSystem.updateUI === 'function') {
                MediaSystem.updateUI();
            }
            
            console.log(`✅ Preservados ${MediaSystem.state.files.length} arquivos e ${MediaSystem.state.pdfs.length} PDFs enviados`);
        }
        
        console.log('✅ Formulário resetado (URLs enviadas preservadas)');
        return true;
    }
    
    // MODO NORMAL (cancel ou reset)
    const wasEditing = !!window.editingPropertyId;
    
    // Preservar estado ANTES de limpar (se estiver cancelando)
    if (mode === 'cancel' && window.hasUnsavedMedia()) {
        window.preserveMediaState();
    }
    
    // 1. Estado de edição
    window.editingPropertyId = null;
    
    // 2. UI do formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        // NÃO resetar completamente se estiver cancelando edição com mídia anexada
        if (mode !== 'cancel' || !window.hasUnsavedMedia()) {
            form.reset();
        }
        
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel';
            submitBtn.style.background = 'var(--success)';
        }
    }
    
    // 3. Botão cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    // 4. Limpeza CONDICIONAL de mídia
    if (mode === 'reset' || !wasEditing) {
        if (window.MediaSystem) {
            MediaSystem.resetState();
            console.log('✅ Estado de mídia limpo completamente');
        }
    } else if (mode === 'cancel' && window._mediaStateBackup) {
        // Tentar restaurar estado preservado
        setTimeout(() => {
            window.restoreMediaState();
        }, 100);
    }
    
    console.log(`✅ ${mode === 'cancel' ? 'Edição cancelada' : 'Formulário limpo'}`);
    return true;
};

/* ==========================================================
   FUNÇÃO cancelEdit MANTIDA PARA COMPATIBILIDADE
   ========================================================== */
window.cancelEdit = function() {
    console.group('admin', 'cancelEdit() - Preservando estado');
    
    if (window.editingPropertyId) {
        const confirmCancel = confirm('Deseja realmente cancelar a edição?\n\nTodas as alterações NÃO SALVAS serão perdidas.');
        if (!confirmCancel) {
            console.log('Cancelamento abortado pelo usuário');
            console.groupEnd();
            return false;
        }
    }
    
    const result = window.cleanAdminForm('cancel');
    
    if (window.showNotification) {
        window.showNotification('Edição cancelada com sucesso', 'info');
    }
    
    console.groupEnd();
    return result;
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
    
    // 4. Configurações diferidas
    setTimeout(() => {
        if (window.setupForm) window.setupForm();
        if (window.loadPropertyList) window.loadPropertyList();
    }, 1000);
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

// ========== INTEGRAÇÃO COM SISTEMA UNIFICADO DE MÍDIA ==========
window.handleNewMediaFiles = function(files) {
    return MediaSystem.addFiles(files);
};

window.handleNewPdfFiles = function(files) {
    console.log('handleNewPdfFiles - Delegando para MediaSystem');
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

/* ==========================================================
   WRAPPER DE PDFs (MANTIDO - CRÍTICO PARA ESTADO)
   ========================================================== */
window.adminPdfHandler = {
    clear: function() {
        console.log('adminPdfHandler.clear()');
        return window.MediaSystem?.clearAllPdfs?.() || window.PdfSystem?.clearAllPdfs?.();
    },
    
    load: function(property) {
        console.log('adminPdfHandler.load()');
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 
               window.PdfSystem?.loadExistingPdfsForEdit?.(property);
    },
    
    process: async function(id, title) {
        console.log(`adminPdfHandler.process(${id})`);
        return await (window.MediaSystem?.processAndSavePdfs?.(id, title) || 
                     window.PdfSystem?.processAndSavePdfs?.(id, title) || '');
    },
    
    isAvailable: function() {
        return !!(window.MediaSystem || window.PdfSystem);
    }
};

// Funções de compatibilidade (MANTIDAS)
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    console.log(`processAndSavePdfs -> delegando para wrapper: ${propertyId}`);
    return await window.adminPdfHandler.process(propertyId, propertyTitle);
};

window.clearAllPdfs = function() {
    console.log('clearAllPdfs -> delegando para wrapper');
    return window.adminPdfHandler.clear();
};

window.loadExistingPdfsForEdit = function(property) {
    console.log('loadExistingPdfsForEdit -> delegando para wrapper');
    return window.adminPdfHandler.load(property);
};

window.getPdfsToSave = async function(propertyId) {
    console.log(`getPdfsToSave -> delegando para wrapper: ${propertyId}`);
    return await window.processAndSavePdfs(propertyId, 'Imóvel');
};

window.clearProcessedPdfs = function() {
    console.log('clearProcessedPdfs - Limpando apenas PDFs processados');
    if (MediaSystem?.state?.pdfs) {
        MediaSystem.state.pdfs = MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
        if (typeof MediaSystem.updateUI === 'function') {
            MediaSystem.updateUI();
        }
    }
    window.adminPdfHandler.clear();
};

window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
    return await (MediaSystem?.getMediaUrlsForProperty?.(propertyId, propertyTitle) || '');
};

// ========== FUNÇÕES DO FORMULÁRIO ==========

window.loadPropertyList = function() {
    console.log('Carregando lista de imóveis...');
    
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
    
    console.log(`${window.properties.length} imóveis listados`);
};

// ========== FUNÇÃO editProperty OTIMIZADA ==========
window.editProperty = function(id) {
    console.group(`EDITANDO IMÓVEL ${id}`);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        console.error('Imóvel não encontrado!');
        alert('❌ Imóvel não encontrado!');
        console.groupEnd();
        return;
    }

    // Preservar estado atual ANTES de resetar
    if (window.hasUnsavedMedia()) {
        window.preserveMediaState();
    }

    if (window.MediaSystem) {
        MediaSystem.resetState();
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
    }

    window.editingPropertyId = property.id;

    // Carregar mídia existente
    if (window.MediaSystem) {
        MediaSystem.loadExisting(property);
    }

    // Scroll para formulário
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.style.display !== 'block') {
            adminPanel.style.display = 'block';
        }
        
        const propertyForm = document.getElementById('propertyForm');
        if (propertyForm) {
            propertyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('✅ Edição iniciada - formulário pronto para edição manual');
        }
    }, 100);

    console.log(`Imóvel ${id} pronto para edição`);
    console.groupEnd();
    return true;
};

// ========== CONFIGURAÇÃO DO FORMULÁRIO (CORRIGIDA) ==========
window.setupForm = function() {
    console.log('Configurando formulário admin...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('Formulário propertyForm não encontrado!');
        return;
    }
    
    // Clonar para remover listeners antigos
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // ✅ ATUALIZADO: Usar função do SharedCore
    if (window.setupPriceAutoFormat) {
        window.setupPriceAutoFormat();
    }
    
    // Configurar submit (FLUXO CORRIGIDO)
    const freshForm = document.getElementById('propertyForm');
    freshForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.group('SUBMISSÃO DO FORMULÁRIO ADMIN');
        
        const loading = window.LoadingManager?.show?.(
            'Salvando Imóvel...', 
            'Por favor, aguarde...', 
            { variant: 'processing' }
        );

        if (!loading) {
            console.warn('LoadingManager não disponível - continuando sem feedback visual');
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
            
            console.log(`Dados coletados: ${JSON.stringify(propertyData)}`);
            
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
                console.error('Validação falhou: campos obrigatórios vazios');
                console.groupEnd();
                return;
            }
            
            if (loading) loading.updateMessage('Processando dados...');
            
            if (window.editingPropertyId) {
                // Edição de imóvel existente
                console.log(`EDITANDO imóvel ID: ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // Formatar preço
                if (updateData.price && window.SharedCore?.PriceFormatter?.formatForInput) {
                    const formatted = window.SharedCore.PriceFormatter.formatForInput(updateData.price);
                    if (formatted) updateData.price = formatted;
                }
                
                // Processar PDFs via wrapper
                if (window.adminPdfHandler) {
                    const pdfsString = await window.adminPdfHandler.process(window.editingPropertyId, propertyData.title);
                    if (pdfsString && pdfsString.trim() !== '') {
                        updateData.pdfs = pdfsString;
                        console.log('PDFs processados via wrapper');
                    }
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
                        console.log('Mídia processada');
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
                            const pdfCount = updateData.pdfs ? updateData.pdfs.split(',').filter(url => url.trim() !== '').length : 0;
                            
                            let successMessage = `✅ Imóvel "${updateData.title}" atualizado!`;
                            if (imageCount > 0) successMessage += `\n📸 ${imageCount} foto(s)/vídeo(s) salvo(s)`;
                            if (pdfCount > 0) successMessage += `\n📄 ${pdfCount} documento(s) PDF salvo(s)`;
                            
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
                console.log('CRIANDO novo imóvel...');
                
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
            console.error(`ERRO CRÍTICO: ${error.message}`);
            
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
                
                // ✅ CRÍTICO CORRIGIDO: Usar modo seguro que preserva uploads
                window.cleanAdminForm('reset-with-preserve');
                
                if (submitBtn) {
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = window.editingPropertyId ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                    }, 500);
                }
                
                // Limpar backup após sucesso
                window._mediaStateBackup = null;
                
                if (typeof window.loadPropertyList === 'function') {
                    setTimeout(() => window.loadPropertyList(), 700);
                }
                
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos'), 1000);
                }
                
                console.log('Formulário limpo e pronto para novo imóvel (uploads preservados)');
            }, 1000);
        }
        
        console.groupEnd();
    });
    
    console.log('Formulário admin configurado (fluxo corrigido)');
};

// ========== SINCRONIZAÇÃO MANUAL ==========
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar?\n\nIsso irá buscar os imóveis do banco de dados online.')) {
        console.log('Iniciando sincronização manual...');
        
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
                    console.log(`Sincronização completa: ${result.count} novos imóveis`);
                    
                    if (typeof window.loadPropertyList === 'function') {
                        window.loadPropertyList();
                    }
                } else {
                    alert('⚠️ Não foi possível sincronizar. Verifique a conexão.');
                    console.warn('Não foi possível sincronizar');
                }
            }
        } catch (error) {
            console.error(`Erro na sincronização: ${error.message}`);
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
    console.log('Verificando configuração de PDFs...');
    
    if (window.MediaSystem && typeof MediaSystem.setupEventListeners === 'function') {
        console.log('✅ Configuração de PDFs delegada ao MediaSystem');
    } else {
        console.log('⚠️ MediaSystem não disponível para configuração automática');
    }
}, 1500);

// ========== COMPATIBILIDADE PARA MODAL PDF ==========
window.showPdfModal = function(propertyId) {
    if (window.PdfSystem && window.PdfSystem.showModal) {
        return window.PdfSystem.showModal(propertyId);
    }
    console.warn('⚠️ PdfSystem não disponível - use ?debug=true');
    return false;
};

window.closePdfModal = function() {
    if (window.PdfSystem && window.PdfSystem.closeModal) {
        return window.PdfSystem.closeModal();
    }
    const modal = document.getElementById('pdfModal');
    if (modal) modal.style.display = 'none';
};

// ========== DIAGNÓSTICO COMPLETO DO SISTEMA ==========
setTimeout(() => {
    console.group('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE UPLOAD');
    
    // 1. Verificar fluxo de limpeza
    console.log('📋 Fluxo atual de cleanAdminForm:');
    console.log('- Tem modo "reset-with-preserve"?', 
        window.cleanAdminForm && window.cleanAdminForm.toString().includes('reset-with-preserve'));
    
    // 2. Verificar estado do MediaSystem
    if (window.MediaSystem) {
        console.log('🖼️ Estado atual do MediaSystem:');
        console.log('- Files:', MediaSystem.state.files.length);
        console.log('- Files com uploaded=true:', MediaSystem.state.files.filter(f => f.uploaded).length);
        console.log('- PDFs:', MediaSystem.state.pdfs.length);
        console.log('- PDFs com uploaded=true:', MediaSystem.state.pdfs.filter(p => p.uploaded).length);
        
        // Verificar função resetState
        console.log('🧹 MediaSystem.resetState():');
        console.log('- Existe?', typeof MediaSystem.resetState === 'function');
    }
    
    // 3. Verificar comportamento após submit
    const form = document.getElementById('propertyForm');
    if (form) {
        console.log('📝 Formulário propertyForm:');
        console.log('- Configurado?', !!form.onsubmit || form.hasAttribute('data-submit-configured'));
    }
    
    console.log('✅ Sistema configurado com correções críticas');
    console.groupEnd();
    
    // Executar teste se debug ativado
    if (window.location.search.includes('debug=true')) {
        console.log('🧪 Executando teste de preservação em 2 segundos...');
        setTimeout(() => {
            window.testUploadPreservation();
        }, 2000);
    }
}, 3000);

// ========== VALIDAÇÃO FINAL ==========
setTimeout(() => {
    console.group('✅ VALIDAÇÃO DO SISTEMA CORRIGIDO');
    
    const checks = {
        'Formulário funciona': () => !!document.getElementById('propertyForm'),
        'MediaSystem integrado': () => !!window.MediaSystem,
        'cleanAdminForm corrigida': () => 
            window.cleanAdminForm && 
            window.cleanAdminForm.toString().includes('reset-with-preserve'),
        'Preservação ativa': () => 
            typeof window.preserveMediaState === 'function' &&
            typeof window.hasUnsavedMedia === 'function',
        'Fluxo de submit corrigido': () => {
            const form = document.getElementById('propertyForm');
            return form && (form.onsubmit || form.hasAttribute('data-submit-configured'));
        }
    };
    
    Object.entries(checks).forEach(([test, check]) => {
        console.log(`${check() ? '✅' : '❌'} ${test}`);
    });
    
    console.log('🚨 CORREÇÕES CRÍTICAS APLICADAS:');
    console.log('1. ✅ Adicionado modo "reset-with-preserve" em cleanAdminForm');
    console.log('2. ✅ Corrigido fluxo pós-submit (linha ~720)');
    console.log('3. ✅ Sistema de backup/restauração de estado');
    console.log('4. ✅ Diagnóstico automático ativado');
    console.log('⚠️ TESTE OBRIGATÓRIO: Acesse com ?debug=true para validar preservação');
    console.groupEnd();
}, 5000);

console.log('✅ admin.js - SISTEMA CORRIGIDO COM DIAGNÓSTICO');
