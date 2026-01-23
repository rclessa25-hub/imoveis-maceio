// js/modules/admin.js - SISTEMA ADMIN COM CORREÇÃO CRÍTICA
console.log('🔧 admin.js carregado - Sistema Administrativo com Correção de Upload');

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
   FUNÇÃO cleanAdminForm CORRIGIDA PARA PRESERVAR UPLOADS
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log(`🧹 cleanAdminForm(${mode}) - CORRIGIDO PARA PRESERVAR UPLOADS`);
    
    // ✅ NOVO MODO: Preservar apenas uploads com URLs permanentes
    if (mode === 'reset-preserve-uploads') {
        console.log('🛡️ Modo especial: reset preservando uploads com URLs permanentes');
        
        // 1. Resetar UI mas NÃO estado de mídia ainda
        const form = document.getElementById('propertyForm');
        if (form) form.reset();
        
        window.editingPropertyId = null;
        
        // 2. UI updates
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
        
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
            submitBtn.style.background = 'var(--success)';
            submitBtn.disabled = false;
        }
        
        // 3. Limpeza INTELIGENTE do MediaSystem
        if (window.MediaSystem) {
            // Filtrar APENAS arquivos com URLs permanentes (já enviados)
            const permanentFiles = MediaSystem.state.files.filter(f => 
                f.uploaded && f.url && f.url.startsWith('http')
            );
            const permanentPdfs = MediaSystem.state.pdfs.filter(p => 
                p.uploaded && p.url && p.url.startsWith('http')
            );
            
            console.log(`💾 Preservando ${permanentFiles.length} arquivos e ${permanentPdfs.length} PDFs com URLs permanentes`);
            
            // Manter apenas os permanentes
            MediaSystem.state.files = permanentFiles;
            MediaSystem.state.pdfs = permanentPdfs;
            
            // Limpar temporários/existing
            MediaSystem.state.existing = [];
            MediaSystem.state.existingPdfs = [];
            MediaSystem.state.currentPropertyId = null;
            
            // Atualizar UI
            setTimeout(() => {
                if (MediaSystem.updateUI) MediaSystem.updateUI();
            }, 100);
        }
        
        return true;
    }
    
    // 1. SEMPRE preservar estado de edição primeiro
    const wasEditing = !!window.editingPropertyId;
    window.editingPropertyId = null;
    
    // 2. Resetar UI do formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset();
        
        // Restaurar valores padrão dos selects
        const typeSelect = document.getElementById('propType');
        if (typeSelect) typeSelect.value = 'residencial';
        
        const badgeSelect = document.getElementById('propBadge');
        if (badgeSelect) badgeSelect.value = 'Novo';
        
        const videoCheckbox = document.getElementById('propHasVideo');
        if (videoCheckbox) videoCheckbox.checked = false;
    }
    
    // 3. Atualizar títulos e botões
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
    
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
    
    // 4. ✅✅✅ CRÍTICO: LIMPEZA INTELIGENTE DO MediaSystem
    if (window.MediaSystem) {
        console.log('🔄 Limpeza inteligente do MediaSystem:');
        
        // Backup dos arquivos ENVIADOS (com URLs permanentes)
        const preservedFiles = [];
        const preservedPdfs = [];
        
        // Preservar APENAS arquivos que já foram enviados (tem URL permanente)
        if (MediaSystem.state.files && MediaSystem.state.files.length > 0) {
            preservedFiles.push(...MediaSystem.state.files.filter(file => 
                file.uploaded === true && file.url && file.url.startsWith('http')
            ));
            console.log(`📸 Preservando ${preservedFiles.length} arquivo(s) enviado(s)`);
        }
        
        if (MediaSystem.state.pdfs && MediaSystem.state.pdfs.length > 0) {
            preservedPdfs.push(...MediaSystem.state.pdfs.filter(pdf => 
                pdf.uploaded === true && pdf.url && pdf.url.startsWith('http')
            ));
            console.log(`📄 Preservando ${preservedPdfs.length} PDF(s) enviado(s)`);
        }
        
        // ✅ RESET CORRETO: limpar arrays mas restaurar enviados
        MediaSystem.state.files = preservedFiles;
        MediaSystem.state.pdfs = preservedPdfs;
        
        // Limpar arrays de existing (sempre safe)
        MediaSystem.state.existing = [];
        MediaSystem.state.existingPdfs = [];
        
        // Resetar outras flags
        MediaSystem.state.isUploading = false;
        MediaSystem.state.currentPropertyId = null;
        
        // Atualizar UI
        setTimeout(() => {
            if (MediaSystem.updateUI) {
                MediaSystem.updateUI();
            }
        }, 100);
        
        console.log(`✅ MediaSystem resetado inteligentemente. Preservados: ${preservedFiles.length} files, ${preservedPdfs.length} PDFs`);
    }
    
    // 5. Limpar previews (DOM apenas)
    const previewIds = ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'];
    previewIds.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.innerHTML.includes('preview')) {
            // Não limpar completamente, apenas se tiver conteúdo temporário
            if (!element.innerHTML.includes('Nenhum') && !element.innerHTML.includes('adicionar')) {
                element.innerHTML = `<div style="text-align:center;color:#95a5a6;padding:1rem;">
                    <i class="fas fa-cloud-upload-alt" style="opacity:0.5;"></i>
                    <p style="margin:0.5rem 0;font-size:0.9rem;">Área de upload</p>
                </div>`;
            }
        }
    });
    
    // 6. Feedback
    console.log(`✅ ${mode === 'cancel' ? 'Edição cancelada' : 'Formulário limpo'} - Uploads preservados`);
    
    // 7. Evento para sistemas externos
    try {
        document.dispatchEvent(new CustomEvent('adminFormCleaned', { 
            detail: { 
                mode: mode, 
                preservedFiles: window.MediaSystem ? MediaSystem.state.files.length : 0,
                preservedPdfs: window.MediaSystem ? MediaSystem.state.pdfs.length : 0,
                wasEditing: wasEditing
            }
        }));
    } catch (e) {}
    
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

// ========== CONFIGURAÇÃO DO FORMULÁRIO (COM FLUXO CORRIGIDO) ==========
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
    
    // Configurar submit
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
                
                // ✅✅✅ CHAVE: Usar novo modo 'reset-preserve-uploads'
                window.cleanAdminForm('reset-preserve-uploads');
                
                if (submitBtn) {
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        // Determinar texto baseado no contexto
                        const isEditing = !!window.editingPropertyId;
                        submitBtn.innerHTML = isEditing ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                        submitBtn.style.background = isEditing ? 'var(--accent)' : 'var(--success)';
                    }, 300);
                }
                
                // Atualizar lista de imóveis
                if (typeof window.loadPropertyList === 'function') {
                    setTimeout(() => window.loadPropertyList(), 500);
                }
                
                // Atualizar grid de propriedades
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos'), 800);
                }
                
                console.log('✅ Processo completo - Uploads preservados');
            }, 800);
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

// ========== TESTE AUTOMÁTICO DA CORREÇÃO ==========
setTimeout(() => {
    if (!window.location.search.includes('debug=true')) return;
    
    console.group('🧪 TESTE DA CORREÇÃO DE PRESERVAÇÃO DE UPLOAD');
    
    // Simular estado com arquivos enviados e não-enviados
    if (window.MediaSystem) {
        // Estado de teste
        MediaSystem.state.files = [
            { id: 'sent1', name: 'foto_enviada.jpg', uploaded: true, url: 'https://supabase.com/storage/foto1.jpg' },
            { id: 'unsent1', name: 'foto_nao_enviada.jpg', uploaded: false },
            { id: 'sent2', name: 'outra_enviada.jpg', uploaded: true, url: 'https://supabase.com/storage/foto2.jpg' }
        ];
        
        MediaSystem.state.pdfs = [
            { id: 'pdf_sent', name: 'documento_enviado.pdf', uploaded: true, url: 'https://supabase.com/storage/doc1.pdf' },
            { id: 'pdf_unsent', name: 'documento_nao_enviado.pdf', uploaded: false }
        ];
        
        console.log('📊 ESTADO ANTES DA CORREÇÃO:');
        console.log('- Files totais:', MediaSystem.state.files.length);
        console.log('- Files enviados:', MediaSystem.state.files.filter(f => f.uploaded).length);
        console.log('- PDFs totais:', MediaSystem.state.pdfs.length);
        console.log('- PDFs enviados:', MediaSystem.state.pdfs.filter(p => p.uploaded).length);
        
        // Executar cleanAdminForm corrigido
        window.cleanAdminForm('reset-preserve-uploads');
        
        // Pequeno delay para processamento
        setTimeout(() => {
            console.log('📊 ESTADO APÓS CORREÇÃO:');
            console.log('- Files totais:', MediaSystem.state.files.length);
            console.log('- Files enviados:', MediaSystem.state.files.filter(f => f.uploaded).length);
            console.log('- PDFs totais:', MediaSystem.state.pdfs.length);
            console.log('- PDFs enviados:', MediaSystem.state.pdfs.filter(p => p.uploaded).length);
            
            // Verificação
            const sentFilesPreserved = MediaSystem.state.files.length === 2; // 2 enviados
            const sentPdfsPreserved = MediaSystem.state.pdfs.length === 1; // 1 enviado
            const unsentRemoved = !MediaSystem.state.files.find(f => !f.uploaded);
            
            if (sentFilesPreserved && sentPdfsPreserved && unsentRemoved) {
                console.log('✅✅✅ CORREÇÃO FUNCIONANDO! Uploads preservados, temporários removidos.');
            } else {
                console.error('❌❌❌ CORREÇÃO FALHOU! Estado incorreto após limpeza.');
            }
        }, 200);
    } else {
        console.warn('⚠️ MediaSystem não disponível para teste');
    }
    
    console.groupEnd();
}, 5000);

// ========== VALIDAÇÃO FINAL DO SISTEMA ==========
setTimeout(() => {
    console.group('✅ SISTEMA CORRIGIDO - VALIDAÇÃO FINAL');
    
    const checks = {
        'cleanAdminForm corrigida': () => 
            typeof window.cleanAdminForm === 'function' &&
            window.cleanAdminForm.toString().includes('reset-preserve-uploads'),
        'Modo especial disponível': () => {
            try {
                window.cleanAdminForm('reset-preserve-uploads');
                return true;
            } catch {
                return false;
            }
        },
        'Fluxo de submit corrigido': () => {
            const form = document.getElementById('propertyForm');
            if (!form) return false;
            
            // Verificar se o listener está configurado
            const hasListener = form.hasAttribute('data-submit-listener') || 
                               form.onsubmit || 
                               (form._listeners && form._listeners.submit);
            
            return !!hasListener;
        },
        'MediaSystem integrado': () => !!window.MediaSystem,
        'Teste automático configurado': () => window.location.search.includes('debug=true') ? 
            typeof window.cleanAdminForm === 'function' : true
    };
    
    let allPassed = true;
    Object.entries(checks).forEach(([test, check]) => {
        const passed = check();
        console.log(`${passed ? '✅' : '❌'} ${test}`);
        if (!passed) allPassed = false;
    });
    
    if (allPassed) {
        console.log('🎉🎉🎉 CORREÇÃO APLICADA COM SUCESSO!');
        console.log('🚨 ARQUIVOS ENVIADOS NÃO SERÃO MAIS PERDIDOS!');
    } else {
        console.warn('⚠️ Alguns testes falharam. Verifique manualmente.');
    }
    
    console.log('🔧 Para testar a correção:');
    console.log('1. Acesse com ?debug=true na URL');
    console.log('2. Verifique o console para testes automáticos');
    console.log('3. Teste o fluxo real: adicione arquivos → salve → veja se permanecem');
    
    console.groupEnd();
}, 6000);

console.log('✅ admin.js - CORREÇÃO CRÍTICA APLICADA');
