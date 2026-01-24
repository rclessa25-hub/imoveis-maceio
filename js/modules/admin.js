// js/modules/admin.js - CORREÇÃO DE EXCLUSÃO DE PDF E PREVIEW DE IMAGENS
console.log('🔧 admin.js carregado - Correção de exclusão e preview');

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
   ✅✅✅ FUNÇÃO DE EXCLUSÃO DE PDF CORRIGIDA
   ========================================================== */

/**
 * EXCLUIR PDF DO FORMULÁRIO (CORREÇÃO CRÍTICA)
 */
window.removePdfFromForm = function(pdfId, isExisting = false) {
    console.log(`🗑️ Tentando excluir PDF: ${pdfId} (existing: ${isExisting})`);
    
    if (!window.MediaSystem) {
        console.error('❌ MediaSystem não disponível');
        alert('⚠️ Sistema de mídia não está carregado');
        return false;
    }
    
    if (isExisting) {
        // ✅ CORREÇÃO: Marcar PDF existente para exclusão
        console.log('📋 Marcando PDF existente para exclusão');
        
        // Encontrar o PDF no array de existingPdfs
        const pdfIndex = MediaSystem.state.existingPdfs.findIndex(pdf => pdf.id === pdfId);
        if (pdfIndex !== -1) {
            // Marcar como para exclusão
            MediaSystem.state.existingPdfs[pdfIndex].markedForDeletion = true;
            console.log(`✅ PDF ${pdfId} marcado para exclusão`);
            
            // Atualizar UI imediatamente
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 50);
            
            return true;
        } else {
            console.error(`❌ PDF ${pdfId} não encontrado em existingPdfs`);
            return false;
        }
    } else {
        // ✅ CORREÇÃO: Remover PDF novo do array
        console.log('📋 Removendo PDF novo do formulário');
        
        const pdfIndex = MediaSystem.state.pdfs.findIndex(pdf => pdf.id === pdfId);
        if (pdfIndex !== -1) {
            // Remover do array
            MediaSystem.state.pdfs.splice(pdfIndex, 1);
            console.log(`✅ PDF ${pdfId} removido do array de novos PDFs`);
            
            // Atualizar UI
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 50);
            
            return true;
        } else {
            console.error(`❌ PDF ${pdfId} não encontrado em pdfs`);
            return false;
        }
    }
};

/* ==========================================================
   ✅✅✅ SISTEMA DE PREVIEW PARA NOVAS FOTOS/VIDEOS
   ========================================================== */

/**
 * GERAR PREVIEW PARA NOVAS FOTOS/VIDEOS
 */
window.generateImagePreview = function(file, callback) {
    console.log('🖼️ Gerando preview para:', file.name);
    
    if (!file.type.startsWith('image/')) {
        console.log('📹 É um vídeo, usando ícone padrão');
        // Para vídeos, usar ícone
        callback('video-icon');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log('✅ Preview gerado com sucesso');
        callback(e.target.result);
    };
    
    reader.onerror = function(e) {
        console.error('❌ Erro ao gerar preview:', e);
        callback('error-icon');
    };
    
    try {
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('❌ Erro ao ler arquivo:', error);
        callback('error-icon');
    }
};

/**
 * FORÇAR ATUALIZAÇÃO DE PREVIEWS NO MediaSystem
 */
window.forceMediaPreviewUpdate = function() {
    console.log('🔧 Forçando atualização de previews...');
    
    if (!window.MediaSystem || !MediaSystem.state) {
        console.error('❌ MediaSystem não disponível');
        return;
    }
    
    // Verificar arquivos novos sem preview
    MediaSystem.state.files.forEach((file, index) => {
        if (file.file && !file.previewUrl && file.file.type.startsWith('image/')) {
            console.log(`📸 Gerando preview para ${file.name || file.file.name}`);
            
            window.generateImagePreview(file.file, (previewData) => {
                if (previewData !== 'error-icon' && previewData !== 'video-icon') {
                    MediaSystem.state.files[index].previewUrl = previewData;
                    
                    // Atualizar UI após gerar preview
                    setTimeout(() => {
                        if (MediaSystem.updateUI) {
                            MediaSystem.updateUI();
                        }
                    }, 100);
                }
            });
        }
    });
};

/* ==========================================================
   SISTEMA DE UPLOAD COM PREVIEW
   ========================================================== */

window.setupUploadInputs = function() {
    console.log('🎯 Configurando inputs de upload com preview...');
    
    // 1. INPUT DE FOTOS/VIDEOS COM PREVIEW
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput && uploadArea) {
        console.log('📸 Configurando input de fotos/vídeos...');
        
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
        
        const newInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newInput, fileInput);
        
        const newArea = uploadArea.cloneNode(true);
        uploadArea.parentNode.replaceChild(newArea, uploadArea);
        
        const freshInput = document.getElementById('fileInput');
        const freshArea = document.getElementById('uploadArea');
        
        freshArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            freshInput.click();
        });
        
        freshInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files.length > 0) {
                console.log(`📁 ${e.target.files.length} arquivo(s) selecionado(s)`);
                
                if (window.MediaSystem && typeof window.MediaSystem.addFiles === 'function') {
                    // ✅ CORREÇÃO: Processar arquivos e gerar previews
                    const filesArray = Array.from(e.target.files);
                    
                    // Primeiro adicionar ao MediaSystem
                    const added = window.MediaSystem.addFiles(e.target.files);
                    console.log(`✅ ${added} arquivo(s) adicionado(s) ao MediaSystem`);
                    
                    // ✅ CORREÇÃO: Gerar previews para imagens
                    filesArray.forEach((file, index) => {
                        if (file.type.startsWith('image/')) {
                            console.log(`🖼️ Gerando preview para: ${file.name}`);
                            
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                // Encontrar o arquivo no MediaSystem e adicionar preview
                                const mediaFile = MediaSystem.state.files.find(f => 
                                    f.name === file.name || 
                                    (f.file && f.file.name === file.name)
                                );
                                
                                if (mediaFile) {
                                    mediaFile.previewUrl = e.target.result;
                                    console.log(`✅ Preview gerado para ${file.name}`);
                                    
                                    // Atualizar UI após cada preview
                                    setTimeout(() => {
                                        if (MediaSystem.updateUI) {
                                            MediaSystem.updateUI();
                                        }
                                    }, 50);
                                }
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                    
                    // Atualizar UI após adicionar todos
                    setTimeout(() => {
                        if (MediaSystem.updateUI) {
                            MediaSystem.updateUI();
                        }
                        
                        // Forçar nova verificação de previews
                        setTimeout(() => {
                            window.forceMediaPreviewUpdate();
                        }, 200);
                    }, 100);
                }
                
                e.target.value = '';
            }
        });
        
        console.log('✅ Input de fotos/vídeos configurado com preview');
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
                        if (MediaSystem.updateUI) {
                            MediaSystem.updateUI();
                        }
                    }, 50);
                }
                
                e.target.value = '';
            }
        });
        
        console.log('✅ Input de PDFs configurado');
    }
    
    console.log('🎉 Sistema de upload configurado com preview');
    return true;
};

/* ==========================================================
   FUNÇÃO cleanAdminForm
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log(`🧹 cleanAdminForm(${mode})`);
    
    window.editingPropertyId = null;
    
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset();
        document.getElementById('propType').value = 'residencial';
        document.getElementById('propBadge').value = 'Novo';
        document.getElementById('propHasVideo').checked = false;
    }
    
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
        }
        
        setTimeout(() => {
            if (MediaSystem.updateUI) {
                MediaSystem.updateUI();
            }
        }, 50);
    }
    
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
    console.log('➕ Adicionando', files.length, 'arquivo(s) de mídia');
    
    if (!window.MediaSystem || typeof MediaSystem.addFiles !== 'function') {
        return 0;
    }
    
    const result = MediaSystem.addFiles(files);
    
    // ✅ CORREÇÃO: Gerar previews para novas imagens
    if (result > 0 && files.length > 0) {
        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                console.log(`🖼️ Processando preview para: ${file.name}`);
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Encontrar o arquivo correspondente no MediaSystem
                    const mediaIndex = MediaSystem.state.files.findIndex(f => 
                        (f.file && f.file.name === file.name) || 
                        f.name === file.name
                    );
                    
                    if (mediaIndex !== -1) {
                        MediaSystem.state.files[mediaIndex].previewUrl = e.target.result;
                        console.log(`✅ Preview adicionado para ${file.name}`);
                        
                        // Atualizar UI após cada preview
                        setTimeout(() => {
                            if (MediaSystem.updateUI) {
                                MediaSystem.updateUI();
                            }
                        }, 50 * (index + 1));
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    setTimeout(() => {
        if (MediaSystem.updateUI) {
            MediaSystem.updateUI();
        }
    }, 100);
    
    return result;
};

window.handleNewPdfFiles = function(files) {
    console.log('➕ Adicionando', files.length, 'PDF(s)');
    
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

// ========== WRAPPER DE PDFs COM EXCLUSÃO CORRIGIDA ==========
window.adminPdfHandler = {
    clear: function() {
        return window.MediaSystem?.clearAllPdfs?.() || 0;
    },
    
    load: function(property) {
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 0;
    },
    
    process: async function(id, title) {
        console.log(`🔍 adminPdfHandler.process(${id}) - Iniciando processamento`);
        
        if (!window.MediaSystem || typeof MediaSystem.processAndSavePdfs !== 'function') {
            console.error('❌ MediaSystem.processAndSavePdfs não disponível');
            return '';
        }
        
        try {
            // ✅ CORREÇÃO: Garantir que PDFs marcados para exclusão sejam processados
            const result = await MediaSystem.processAndSavePdfs(id, title);
            console.log(`✅ PDFs processados: ${result}`);
            return result;
        } catch (error) {
            console.error('❌ Erro ao processar PDFs:', error);
            return '';
        }
    },
    
    // ✅ NOVA FUNÇÃO: Verificar exclusões pendentes
    getPdfsToDelete: function() {
        if (!window.MediaSystem || !MediaSystem.state) {
            return [];
        }
        
        // Retornar PDFs existentes marcados para exclusão
        return MediaSystem.state.existingPdfs
            .filter(pdf => pdf.markedForDeletion)
            .map(pdf => pdf.id);
    }
};

// Funções de compatibilidade
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    console.log(`📄 processAndSavePdfs(${propertyId}) - Chamando wrapper`);
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

/* ==========================================================
   ✅✅✅ FUNÇÃO DE EXCLUSÃO DE MÍDIA (FOTOS/VIDEOS)
   ========================================================== */
window.removeMediaFromForm = function(mediaId, isExisting = false) {
    console.log(`🗑️ Tentando excluir mídia: ${mediaId} (existing: ${isExisting})`);
    
    if (!window.MediaSystem) {
        console.error('❌ MediaSystem não disponível');
        return false;
    }
    
    if (isExisting) {
        // Marcar mídia existente para exclusão
        const mediaIndex = MediaSystem.state.existing.findIndex(media => media.id === mediaId);
        if (mediaIndex !== -1) {
            MediaSystem.state.existing[mediaIndex].markedForDeletion = true;
            console.log(`✅ Mídia ${mediaId} marcada para exclusão`);
            
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 50);
            
            return true;
        }
    } else {
        // Remover mídia nova
        const mediaIndex = MediaSystem.state.files.findIndex(media => media.id === mediaId);
        if (mediaIndex !== -1) {
            MediaSystem.state.files.splice(mediaIndex, 1);
            console.log(`✅ Mídia ${mediaId} removida do formulário`);
            
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 50);
            
            return true;
        }
    }
    
    console.error(`❌ Mídia ${mediaId} não encontrada`);
    return false;
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
                
                // ✅ CORREÇÃO: Forçar geração de previews após carregar
                setTimeout(() => {
                    window.forceMediaPreviewUpdate();
                }, 300);
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

// ========== CONFIGURAÇÃO DO FORMULÁRIO ==========
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
        
        let loading = null;
        if (window.LoadingManager && typeof window.LoadingManager.show === 'function') {
            loading = window.LoadingManager.show(
                'Salvando Imóvel...', 
                'Por favor, aguarde...', 
                { variant: 'processing' }
            );
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
            
            if (window.editingPropertyId) {
                console.log(`✏️ Editando imóvel ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // ✅ CORREÇÃO: Processar PDFs com exclusão
                if (window.adminPdfHandler) {
                    console.log('📄 Processando PDFs (com exclusão)...');
                    const pdfsString = await window.adminPdfHandler.process(window.editingPropertyId, propertyData.title);
                    if (pdfsString && pdfsString.trim() !== '') {
                        updateData.pdfs = pdfsString;
                        console.log('✅ PDFs processados com sucesso');
                    } else {
                        console.log('ℹ️ Nenhum PDF para processar');
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

// ========== TESTE DE EXCLUSÃO E PREVIEW ==========
setTimeout(() => {
    if (window.location.search.includes('debug=true')) {
        console.group('🧪 TESTE DE EXCLUSÃO E PREVIEW');
        
        console.log('🔧 Funções disponíveis:');
        console.log('- removePdfFromForm:', typeof window.removePdfFromForm);
        console.log('- removeMediaFromForm:', typeof window.removeMediaFromForm);
        console.log('- forceMediaPreviewUpdate:', typeof window.forceMediaPreviewUpdate);
        
        console.log(`
🎯 TESTES MANUAIS:

1. Excluir PDF existente:
   - Edite um imóvel com PDFs
   - Clique no "X" de um PDF
   - No console execute:
     window.MediaSystem.state.existingPdfs
     Verifique se algum tem "markedForDeletion: true"
   
2. Excluir PDF novo:
   - Adicione um novo PDF
   - Clique no "X"
   - Verifique se some do preview
   
3. Preview de novas imagens:
   - Adicione uma nova foto
   - Deve mostrar thumbnail imediatamente
   - Se não mostrar, execute:
     window.forceMediaPreviewUpdate()
        `);
        
        console.groupEnd();
    }
}, 3000);

console.log('✅ admin.js - CORREÇÃO DE EXCLUSÃO E PREVIEW APLICADA');
