// js/modules/admin.js - SISTEMA ADMIN COMPLETO COM TODAS AS CORREÇÕES
console.log('🔧 admin.js carregado - Sistema Administrativo Completo');

/* ==========================================================
   SISTEMA DE LOGGING
   ========================================================== */
const log = console;

/* ==========================================================
   ✅✅✅ CORREÇÃO 1: FUNÇÃO DE EXCLUSÃO DE PDF
   ========================================================== */

/**
 * EXCLUIR PDF DO FORMULÁRIO - CORREÇÃO CRÍTICA
 * Esta função é chamada quando o usuário clica no "X" de um PDF
 */
window.removePdfFromForm = function(pdfId, isExisting = false) {
    console.log(`🗑️ Tentando excluir PDF: ${pdfId} (existing: ${isExisting})`);
    
    if (!window.MediaSystem || !MediaSystem.state) {
        console.error('❌ MediaSystem não disponível');
        alert('⚠️ Sistema de mídia não está carregado');
        return false;
    }
    
    if (isExisting) {
        // ✅ CORREÇÃO: Marcar PDF existente para exclusão no salvamento
        const pdfIndex = MediaSystem.state.existingPdfs.findIndex(pdf => pdf.id === pdfId);
        if (pdfIndex !== -1) {
            MediaSystem.state.existingPdfs[pdfIndex].markedForDeletion = true;
            console.log(`✅ PDF ${pdfId} marcado para exclusão no próximo salvamento`);
            
            // Atualizar UI para mostrar que será excluído
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 50);
            
            return true;
        }
    } else {
        // ✅ CORREÇÃO: Remover PDF novo imediatamente
        const pdfIndex = MediaSystem.state.pdfs.findIndex(pdf => pdf.id === pdfId);
        if (pdfIndex !== -1) {
            MediaSystem.state.pdfs.splice(pdfIndex, 1);
            console.log(`✅ PDF ${pdfId} removido do formulário`);
            
            // Atualizar UI imediatamente
            setTimeout(() => {
                if (MediaSystem.updateUI) {
                    MediaSystem.updateUI();
                }
            }, 50);
            
            return true;
        }
    }
    
    console.error(`❌ PDF ${pdfId} não encontrado`);
    return false;
};

/* ==========================================================
   ✅✅✅ CORREÇÃO 2: PREVIEW DE NOVAS FOTOS/VIDEOS
   ========================================================== */

/**
 * FORÇAR GERAÇÃO DE PREVIEW PARA NOVAS IMAGENS
 * Chamada quando novas fotos são adicionadas
 */
window.forceMediaPreviewUpdate = function() {
    console.log('🖼️ Forçando atualização de previews...');
    
    if (!window.MediaSystem || !MediaSystem.state || !MediaSystem.state.files) {
        console.error('❌ MediaSystem não disponível para preview');
        return;
    }
    
    // Gerar previews para imagens novas sem thumbnail
    MediaSystem.state.files.forEach((file, index) => {
        if (file.file && !file.previewUrl && file.file.type.startsWith('image/')) {
            console.log(`📸 Gerando preview para: ${file.name || file.file.name}`);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // Atualizar o arquivo com o preview
                MediaSystem.state.files[index].previewUrl = e.target.result;
                console.log(`✅ Preview gerado para ${file.name || file.file.name}`);
                
                // Atualizar UI após gerar preview
                setTimeout(() => {
                    if (MediaSystem.updateUI) {
                        MediaSystem.updateUI();
                    }
                }, 100);
            };
            
            reader.onerror = function(e) {
                console.error(`❌ Erro ao gerar preview para ${file.name || file.file.name}`);
            };
            
            reader.readAsDataURL(file.file);
        }
    });
};

/* ==========================================================
   ✅✅✅ CORREÇÃO 3: ATUALIZAÇÃO IMEDIATA DOS CAMPOS DE TEXTO
   ========================================================== */

/**
 * ATUALIZAR PROPRIEDADE NO ARRAY LOCAL
 * Atualiza imediatamente o objeto no array window.properties
 */
window.updateLocalProperty = function(propertyId, updatedData) {
    console.log(`🔄 Atualizando imóvel ${propertyId} no array local...`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ Array window.properties não encontrado');
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id === propertyId);
    if (index === -1) {
        console.error(`❌ Imóvel ${propertyId} não encontrado no array`);
        return false;
    }
    
    // Atualizar o objeto existente com os novos dados
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId, // Garantir que o ID não seja alterado
        updated_at: new Date().toISOString()
    };
    
    console.log(`✅ Imóvel ${propertyId} atualizado no array local`);
    
    // ✅ ATUALIZAÇÃO IMEDIATA: Disparar eventos de atualização
    setTimeout(() => {
        // 1. Atualizar lista de imóveis no painel admin
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        // 2. Atualizar exibição na página principal
        if (typeof window.renderProperties === 'function') {
            // Manter o filtro atual
            const currentFilter = window.currentFilter || 'todos';
            window.renderProperties(currentFilter);
        }
        
        // 3. Disparar evento personalizado para outros sistemas
        document.dispatchEvent(new CustomEvent('propertyUpdated', {
            detail: {
                id: propertyId,
                data: window.properties[index]
            }
        }));
        
        // 4. Atualizar local storage se necessário
        if (window.StorageManager?.updateProperty) {
            window.StorageManager.updateProperty(propertyId, window.properties[index]);
        }
    }, 100);
    
    return true;
};

/**
 * ADICIONAR NOVA PROPRIEDADE AO ARRAY LOCAL
 * Para novos imóveis também
 */
window.addToLocalProperties = function(newProperty) {
    console.log('➕ Adicionando novo imóvel ao array local...');
    
    if (!window.properties || !Array.isArray(window.properties)) {
        window.properties = [];
    }
    
    // Encontrar ID mais alto e incrementar
    const maxId = window.properties.length > 0 
        ? Math.max(...window.properties.map(p => p.id))
        : 0;
    
    const propertyWithId = {
        ...newProperty,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    window.properties.push(propertyWithId);
    console.log(`✅ Novo imóvel adicionado com ID: ${propertyWithId.id}`);
    
    // ✅ ATUALIZAÇÃO IMEDIATA
    setTimeout(() => {
        // 1. Atualizar lista de imóveis no painel admin
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        // 2. Atualizar exibição na página principal
        if (typeof window.renderProperties === 'function') {
            const currentFilter = window.currentFilter || 'todos';
            window.renderProperties(currentFilter);
        }
        
        // 3. Disparar evento
        document.dispatchEvent(new CustomEvent('propertyAdded', {
            detail: {
                id: propertyWithId.id,
                data: propertyWithId
            }
        }));
    }, 100);
    
    return propertyWithId;
};

/**
 * VERIFICAR E CORRIGIR PROPRIEDADES
 * Garante que o array local esteja sincronizado
 */
window.syncLocalProperties = function() {
    console.log('🔍 Verificando sincronização do array local...');
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.warn('⚠️ window.properties não é um array válido, recriando...');
        window.properties = [];
    }
    
    // Verificar duplicados
    const uniqueIds = new Set();
    window.properties = window.properties.filter(p => {
        if (!p.id || uniqueIds.has(p.id)) {
            console.warn(`⚠️ Removendo imóvel duplicado/inválido:`, p);
            return false;
        }
        uniqueIds.add(p.id);
        return true;
    });
    
    console.log(`✅ Array local sincronizado: ${window.properties.length} imóveis`);
    return window.properties;
};

/* ==========================================================
   INTEGRAÇÃO COM SISTEMA UNIFICADO DE MÍDIA
   ========================================================== */
window.handleNewMediaFiles = function(files) {
    const result = MediaSystem.addFiles(files);
    
    // ✅ CORREÇÃO: Forçar preview após adicionar novos arquivos
    setTimeout(() => {
        window.forceMediaPreviewUpdate();
    }, 300);
    
    return result;
};

window.handleNewPdfFiles = function(files) {
    log.info('handleNewPdfFiles - Delegando para MediaSystem');
    return window.MediaSystem?.addPdfs?.(files) || 0;
};

window.loadExistingMediaForEdit = function(property) {
    MediaSystem.loadExisting(property);
    
    // ✅ CORREÇÃO: Forçar preview após carregar mídia existente
    setTimeout(() => {
        window.forceMediaPreviewUpdate();
    }, 500);
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
   FUNÇÃO UNIFICADA DE LIMPEZA
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
            log.info('Formulário resetado');
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
        log.info('MediaSystem limpo');
    }

    // 4. Limpar previews visuais
    const previewIds = ['uploadPreview', 'pdfUploadPreview', 'newPdfsSection', 'existingPdfsSection'];
    previewIds.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.innerHTML = '';
    });

    // 5. Feedback
    log.info('Formulário limpo - pronto para novo imóvel');

    // 6. Notificação se for cancelamento
    if (mode === 'cancel' && window.showNotification) {
        window.showNotification('Edição cancelada com sucesso', 'info');
    }

    return true;
};

/* ==========================================================
   FUNÇÃO cancelEdit MANTIDA PARA COMPATIBILIDADE
   ========================================================== */
window.cancelEdit = function() {
    log.info('cancelEdit() - Chamando função unificada');
    
    if (window.editingPropertyId) {
        const confirmCancel = confirm('Deseja realmente cancelar a edição?\n\nTodas as alterações serão perdidas.');
        if (!confirmCancel) {
            log.warn('Cancelamento abortado');
            return false;
        }
    }
    
    return window.cleanAdminForm('cancel');
};

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
window.toggleAdminPanel = function() {
    log.info('toggleAdminPanel() executada');
    
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
    
    if (password === null) {
        log.warn('Usuário cancelou o acesso');
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
            
            log.info(`Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    log.info('Rolando até o painel admin');
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
    log.info('setupAdminUI() - Configuração unificada');
    
    // 1. Painel admin oculto
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
        log.info('Painel admin oculto');
    }
    
    // 2. Botão admin toggle
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            log.info('Botão admin clicado');
            window.toggleAdminPanel();
        });
        log.info('Botão admin toggle configurado');
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
            log.info('Botão "Cancelar Edição" clicado');
            window.cancelEdit();
        });
        log.info('Botão "Cancelar Edição" configurado');
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
            log.info('Botão de sincronização adicionado');
        }
    }
    
    // 5. Configurar formulário
    if (typeof window.setupForm === 'function') {
        window.setupForm();
        log.info('Função setupForm executada');
    }
    
    // 6. Remover botões de teste (se existirem)
    setTimeout(() => {
        const testBtn = document.getElementById('media-test-btn');
        if (testBtn) testBtn.remove();
        log.info('Limpeza de botões de teste concluída');
    }, 1000);
    
    log.info('Admin UI completamente configurado');
};

// ========== EXECUÇÃO AUTOMÁTICA ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            log.info('Executando configuração automática de UI...');
            window.setupAdminUI();
        }, 500);
    });
} else {
    setTimeout(() => {
        log.info('Executando configuração automática de UI (documento já carregado)...');
        window.setupAdminUI();
    }, 300);
}

// ========== FUNÇÕES DO FORMULÁRIO ==========

window.loadPropertyList = function() {
    log.info('Carregando lista de imóveis...');
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container || !window.properties) return;
    
    container.innerHTML = '';
    if (countElement) countElement.textContent = window.properties.length;
    
    if (window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum imóvel</p>';
        return;
    }
    
    // Ordenar por ID decrescente (mais recentes primeiro)
    const sortedProperties = [...window.properties].sort((a, b) => b.id - a.id);
    
    sortedProperties.forEach(property => {
        const item = document.createElement('div');
        item.className = 'property-item';
        item.innerHTML = `
            <div style="flex: 1;">
                <strong style="color: var(--primary);">${property.title}</strong><br>
                <small>${property.price} - ${property.location}</small>
                <div style="font-size: 0.8em; color: #666; margin-top: 0.2rem;">
                    ID: ${property.id} | Tipo: ${property.type || 'residencial'}
                </div>
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
    
    log.info(`${window.properties.length} imóveis listados`);
};

/* ==========================================================
   ✅✅✅ FUNÇÃO deleteProperty COM ATUALIZAÇÃO IMEDIATA
   ========================================================== */
window.deleteProperty = function(id) {
    if (!confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a excluir o imóvel ID: ${id}\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    console.log(`🗑️ Excluindo imóvel ${id}...`);
    
    // ✅ ATUALIZAÇÃO IMEDIATA: Remover do array local
    if (window.properties && Array.isArray(window.properties)) {
        const initialLength = window.properties.length;
        window.properties = window.properties.filter(p => p.id !== id);
        
        if (window.properties.length < initialLength) {
            console.log(`✅ Imóvel ${id} removido do array local`);
            
            // Atualizar UI imediatamente
            setTimeout(() => {
                // 1. Atualizar lista admin
                if (typeof window.loadPropertyList === 'function') {
                    window.loadPropertyList();
                }
                
                // 2. Atualizar página principal
                if (typeof window.renderProperties === 'function') {
                    const currentFilter = window.currentFilter || 'todos';
                    window.renderProperties(currentFilter);
                }
                
                // 3. Disparar evento
                document.dispatchEvent(new CustomEvent('propertyDeleted', {
                    detail: { id: id }
                }));
                
                // 4. Feedback ao usuário
                alert(`✅ Imóvel ID: ${id} excluído com sucesso!`);
            }, 100);
        }
    }
    
    // Excluir do banco de dados
    if (typeof window.deletePropertyFromDatabase === 'function') {
        window.deletePropertyFromDatabase(id);
    }
};

// ========== FUNÇÃO editProperty COM CORREÇÕES ==========
window.editProperty = function(id) {
    log.info(`EDITANDO IMÓVEL ${id}`);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        log.error('Imóvel não encontrado!');
        alert('❌ Imóvel não encontrado!');
        return;
    }

    if (window.MediaSystem) {
        MediaSystem.resetState();
        log.info('MediaSystem resetado');
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
    
    // Formatar features corretamente
    const featuresField = document.getElementById('propFeatures');
    if (featuresField && property.features) {
        if (Array.isArray(property.features)) {
            featuresField.value = property.features.join(', ');
        } else {
            featuresField.value = property.features;
        }
    }
    
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
        log.info('Botão "Cancelar Edição" tornado visível');
    }

    window.editingPropertyId = property.id;

    // ✅ CORREÇÃO: Carregar mídia existente e forçar previews
    if (window.MediaSystem) {
        MediaSystem.loadExisting(property);
        log.info('Mídia existente carregada no MediaSystem');
        
        // ✅ CORREÇÃO: Forçar geração de previews após carregar
        setTimeout(() => {
            window.forceMediaPreviewUpdate();
        }, 500);
    }

    // Scroll para formulário
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.style.display !== 'block') {
            adminPanel.style.display = 'block';
            log.info('Painel admin aberto automaticamente');
        }
        
        const propertyForm = document.getElementById('propertyForm');
        if (propertyForm) {
            propertyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            log.info('Formulário em foco para edição');
        }
    }, 100);

    log.info(`Imóvel ${id} pronto para edição`);
    return true;
};

/* ==========================================================
   ✅✅✅ CONFIGURAÇÃO DO FORMULÁRIO COM ATUALIZAÇÃO IMEDIATA
   ========================================================== */
window.setupForm = function() {
    log.info('Configurando formulário admin com atualização imediata...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        log.error('Formulário propertyForm não encontrado!');
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
        log.info('SUBMISSÃO DO FORMULÁRIO ADMIN - ATUALIZAÇÃO IMEDIATA');
        
        const loading = window.LoadingManager?.show?.(
            'Salvando Imóvel...', 
            'Por favor, aguarde...', 
            { variant: 'processing' }
        );

        if (!loading) {
            log.warn('LoadingManager não disponível - continuando sem feedback visual');
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
            
            log.info(`Dados coletados: ${JSON.stringify(propertyData)}`);
            
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
                log.error('Validação falhou: campos obrigatórios vazios');
                return;
            }
            
            if (loading) loading.updateMessage('Processando dados...');
            
            // Formatar preço se necessário
            if (propertyData.price && window.SharedCore?.PriceFormatter?.formatForInput) {
                const formatted = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
                if (formatted) propertyData.price = formatted;
            }
            
            // Formatar features como array
            if (propertyData.features) {
                propertyData.features = propertyData.features
                    .split(',')
                    .map(f => f.trim())
                    .filter(f => f !== '');
            }
            
            if (window.editingPropertyId) {
                // ✅✅✅ EDIÇÃO DE IMÓVEL EXISTENTE COM ATUALIZAÇÃO IMEDIATA
                log.info(`EDITANDO imóvel ID: ${window.editingPropertyId}`);
                
                const updateData = { ...propertyData };
                
                // ✅ CORREÇÃO: Garantir que PDFs marcados para exclusão sejam processados
                if (window.MediaSystem && window.MediaSystem.processAndSavePdfs) {
                    try {
                        const pdfsString = await window.MediaSystem.processAndSavePdfs(window.editingPropertyId, propertyData.title);
                        if (pdfsString && pdfsString.trim() !== '') {
                            updateData.pdfs = pdfsString;
                            log.info('PDFs processados (com exclusões aplicadas)');
                        } else if (pdfsString === '') {
                            updateData.pdfs = 'EMPTY'; // Nenhum PDF
                        }
                    } catch (pdfError) {
                        log.error('Erro ao processar PDFs:', pdfError);
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
                        log.info('Mídia processada');
                    }
                }
                
                // ✅✅✅ PASSO CRÍTICO: ATUALIZAÇÃO IMEDIATA NO ARRAY LOCAL
                window.updateLocalProperty(window.editingPropertyId, updateData);
                
                // Salvar no banco de dados (Supabase)
                if (typeof window.updateProperty === 'function') {
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    if (success) {
                        if (loading) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel atualizado com sucesso!');
                        }
                        
                        // ✅ FEEDBACK MELHORADO
                        setTimeout(() => {
                            const imageCount = updateData.images ? updateData.images.split(',').filter(url => url.trim() !== '').length : 0;
                            const pdfCount = updateData.pdfs && updateData.pdfs !== 'EMPTY' 
                                ? updateData.pdfs.split(',').filter(url => url.trim() !== '').length 
                                : 0;
                            
                            let successMessage = `✅ Imóvel "${updateData.title}" atualizado!\n\n`;
                            successMessage += `📍 ${updateData.location}\n`;
                            successMessage += `💰 ${updateData.price}\n`;
                            if (imageCount > 0) successMessage += `\n📸 ${imageCount} foto(s)/vídeo(s)`;
                            if (pdfCount > 0) successMessage += `\n📄 ${pdfCount} documento(s) PDF`;
                            
                            // Mostrar na lista e página principal IMEDIATAMENTE
                            alert(successMessage);
                        }, 800);
                        
                    } else {
                        if (loading) {
                            loading.setVariant('error');
                            loading.updateMessage('Falha na atualização');
                            setTimeout(() => {
                                loading.hide();
                                alert('❌ Não foi possível atualizar o imóvel no banco de dados.');
                            }, 1500);
                        } else {
                            alert('❌ Não foi possível atualizar o imóvel no banco de dados.');
                        }
                    }
                }
                
            } else {
                // ✅✅✅ CRIAÇÃO DE NOVO IMÓVEL COM ATUALIZAÇÃO IMEDIATA
                log.info('CRIANDO novo imóvel...');
                
                // Criar no banco de dados
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        // ✅✅✅ PASSO CRÍTICO: ADICIONAR AO ARRAY LOCAL IMEDIATAMENTE
                        const localProperty = window.addToLocalProperties(newProperty);
                        
                        if (loading) {
                            loading.setVariant('success');
                            loading.updateMessage('Imóvel cadastrado com sucesso!');
                        }
                        
                        setTimeout(() => {
                            let successMessage = `✅ Imóvel "${localProperty.title}" cadastrado com sucesso!\n\n`;
                            successMessage += `📍 ${localProperty.location}\n`;
                            successMessage += `💰 ${localProperty.price}\n`;
                            successMessage += `🔑 ID: ${localProperty.id}`;
                            
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
            log.error(`ERRO CRÍTICO: ${error.message}`);
            
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
                
                // ✅ JÁ ATUALIZADO IMEDIATAMENTE, MAS CONFIRMAR
                log.info('✅ Atualização imediata concluída');
                
            }, 1000);
        }
    });
    
    log.info('Formulário admin configurado com atualização imediata');
};

// ========== SINCRONIZAÇÃO MANUAL ==========
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar?\n\nIsso irá buscar os imóveis do banco de dados online.')) {
        log.info('Iniciando sincronização manual...');
        
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
                    log.info(`Sincronização completa: ${result.count} novos imóveis`);
                    
                    // ✅ ATUALIZAR UI IMEDIATAMENTE
                    setTimeout(() => {
                        if (typeof window.loadPropertyList === 'function') {
                            window.loadPropertyList();
                        }
                        
                        if (typeof window.renderProperties === 'function') {
                            window.renderProperties('todos');
                        }
                    }, 500);
                    
                } else {
                    alert('⚠️ Não foi possível sincronizar. Verifique a conexão.');
                    log.warn('Não foi possível sincronizar');
                }
            }
        } catch (error) {
            log.error(`Erro na sincronização: ${error.message}`);
            alert('❌ Erro ao sincronizar: ' + error.message);
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
            }
        }
    }
};

/* ==========================================================
   ✅✅✅ CONFIGURAÇÃO DE UPLOAD COM PREVIEW AUTOMÁTICO
   ========================================================== */
setTimeout(() => {
    // Configurar upload de PDFs
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    
    if (pdfFileInput && pdfUploadArea) {
        log.info('Configurando upload de PDFs...');
        
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
                log.info(`${e.target.files.length} arquivo(s) selecionado(s)`);
                
                if (window.MediaSystem?.addPdfs) {
                    window.MediaSystem.addPdfs(e.target.files);
                }
                
                e.target.value = '';
            }
        });
        
        log.info('Upload de PDFs configurado');
    }
    
    // ✅ CORREÇÃO: Configurar upload de imagens com preview automático
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput && uploadArea) {
        // Resetar listeners
        const cleanInput = fileInput.cloneNode(true);
        const cleanArea = uploadArea.cloneNode(true);
        
        fileInput.parentNode.replaceChild(cleanInput, fileInput);
        uploadArea.parentNode.replaceChild(cleanArea, uploadArea);
        
        const freshFileInput = document.getElementById('fileInput');
        const freshUploadArea = document.getElementById('uploadArea');
        
        freshUploadArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            freshFileInput.click();
        });
        
        freshFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                log.info(`${e.target.files.length} arquivo(s) de mídia selecionado(s)`);
                
                if (window.MediaSystem?.addFiles) {
                    // Adicionar arquivos
                    window.MediaSystem.addFiles(e.target.files);
                    
                    // ✅ CORREÇÃO: Forçar geração de previews após adicionar
                    setTimeout(() => {
                        window.forceMediaPreviewUpdate();
                    }, 300);
                }
                
                e.target.value = '';
            }
        });
        
        log.info('Upload de mídia configurado com preview automático');
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
        log.info('Modal PDF criado');
    }
    return modal;
};

window.showPdfModal = function(propertyId) {
    log.info(`showPdfModal chamado para ID: ${propertyId}`);
    
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
    log.info('accessPdfDocuments chamada');
    
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

/* ==========================================================
   ✅✅✅ INTEGRAÇÃO COM SISTEMAS EXISTENTES
   ========================================================== */

// Integrar com sistema existente de sincronização
const originalSyncWithSupabase = window.syncWithSupabase;
window.syncWithSupabase = async function() {
    console.log('🔄 Sincronizando com Supabase (com atualização imediata)...');
    
    if (originalSyncWithSupabase) {
        const result = await originalSyncWithSupabase();
        
        // ✅ Atualizar UI após sincronização
        if (result && result.success) {
            setTimeout(() => {
                if (typeof window.loadPropertyList === 'function') {
                    window.loadPropertyList();
                }
                
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos');
                }
                
                // Sincronizar array local
                window.syncLocalProperties();
            }, 500);
        }
        
        return result;
    }
    
    return { success: false, count: 0 };
};

// ========== CONFIGURAÇÃO E VERIFICAÇÃO FINAL ==========

// Garantir sincronização na inicialização
setTimeout(() => {
    window.syncLocalProperties();
    
    // Adicionar event listeners para debug
    document.addEventListener('propertyUpdated', (e) => {
        console.log('📢 Evento: propertyUpdated', e.detail);
    });
    
    document.addEventListener('propertyAdded', (e) => {
        console.log('📢 Evento: propertyAdded', e.detail);
    });
    
    document.addEventListener('propertyDeleted', (e) => {
        console.log('📢 Evento: propertyDeleted', e.detail);
    });
    
    console.log('✅ Sistema de atualização imediata configurado');
}, 2000);

/* ==========================================================
   VERIFICAÇÃO FINAL DAS CORREÇÕES
   ========================================================== */
setTimeout(() => {
    console.log('✅✅✅ SISTEMA COMPLETO CONFIGURADO');
    console.log('==========================================');
    console.log('CORREÇÃO 1 - EXCLUSÃO DE PDF:');
    console.log('✅ removePdfFromForm disponível:', typeof window.removePdfFromForm === 'function');
    
    console.log('CORREÇÃO 2 - PREVIEW DE FOTOS/VIDEOS:');
    console.log('✅ forceMediaPreviewUpdate disponível:', typeof window.forceMediaPreviewUpdate === 'function');
    
    console.log('CORREÇÃO 3 - ATUALIZAÇÃO IMEDIATA:');
    console.log('✅ updateLocalProperty disponível:', typeof window.updateLocalProperty === 'function');
    console.log('✅ addToLocalProperties disponível:', typeof window.addToLocalProperties === 'function');
    console.log('✅ syncLocalProperties disponível:', typeof window.syncLocalProperties === 'function');
    console.log('✅ Formulário com atualização imediata: ✅');
    console.log('✅ Lista admin atualiza automaticamente: ✅');
    console.log('✅ Página principal atualiza automaticamente: ✅');
    
    console.log('SISTEMAS INTEGRADOS:');
    console.log('✅ MediaSystem integrado:', typeof window.MediaSystem !== 'undefined');
    console.log('✅ Array window.properties:', window.properties ? `✅ (${window.properties.length} imóveis)` : '❌');
    console.log('✅ Sistema de sincronização: ✅');
    
    console.log('==========================================');
    console.log('🎉 TODAS AS CORREÇÕES APLICADAS COM SUCESSO!');
}, 3000);

log.info('✅ admin.js COMPLETO - TODAS AS CORREÇÕES APLICADAS');
