// js/modules/admin.js - VERSÃO CORRIGIDA E COMPLETA

// ========== SOLUÇÃO DEFINITIVA - USAR SHAREDCORE SEM REDECLARAR ==========
// NÃO use 'const SC = window.SharedCore' diretamente no escopo global!
// Em vez disso, use esta estrutura:

(function() {
    'use strict';
    
    // ========== VERIFICAÇÃO DE SHAREDCORE ==========
    try {
        if (typeof window.SharedCore === 'undefined') {
            throw new Error('SharedCore não disponível');
        }
        
        // ✅ CORRETO: SC só existe dentro deste escopo de função
        const SC = window.SharedCore;
        SC.logModule('admin', 'carregado - Sistema Administrativo');
        
        /* ==========================================================
           INTEGRAÇÃO COM SISTEMA UNIFICADO DE MÍDIA (ETAPA 12)
           ========================================================== */

        /**
         * Sobrescreve as funções globais antigas para apontar
         * exclusivamente para o MediaSystem (media-unified.js)
         * Mantém compatibilidade sem refatoração agressiva
         */

        // ========== INTEGRAÇÃO COM SISTEMA UNIFICADO DE MÍDIA ==========

        // Sobrescrever funções antigas para usar o sistema unificado
        window.handleNewMediaFiles = function(files) {
            return MediaSystem.addFiles(files);
        };

        // ========== GARANTIR QUE A FUNÇÃO handleNewPdfFiles USA APENAS MEDIASYSTEM ==========
        window.handleNewPdfFiles = function(files) {
            SC.logModule('admin', 'handleNewPdfFiles chamada - Delegando APENAS para MediaSystem');
            
            if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                return MediaSystem.addPdfs(files);
            }
            
            SC.logModule('admin', 'MediaSystem não disponível para PDFs', 'warn');
            return 0;
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

        // ========== BLOQUEAR QUALQUER OUTRO PROCESSAMENTO DE PDF NO admin.js ==========
        // Sobrescrever funções antigas para evitar processamento duplicado
        window.processAndSavePdfs = async function(propertyId, propertyTitle) {
            SC.logModule('admin', `processAndSavePdfs REDIRECIONADO para MediaSystem: ${propertyId}`);
            
            // DELEGAR 100% PARA MEDIASYSTEM
            if (window.MediaSystem && typeof window.MediaSystem.processAndSavePdfs === 'function') {
                try {
                    const result = await window.MediaSystem.processAndSavePdfs(propertyId, propertyTitle);
                    SC.logModule('admin', `MediaSystem processou PDFs: ${result ? 'Sucesso' : 'Vazio'}`);
                    return result || '';
                } catch (error) {
                    SC.logModule('admin', `Erro no MediaSystem: ${error}`, 'error');
                }
            }
            
            // Fallback
            SC.logModule('admin', 'Usando fallback vazio', 'warn');
            return '';
        };

        window.clearAllPdfs = function() {
            SC.logModule('admin', 'admin.js: clearAllPdfs chamado');
            
            // Limpar ambos os sistemas para garantir
            if (window.PdfSystem && typeof window.PdfSystem.clearAllPdfs === 'function') {
                window.PdfSystem.clearAllPdfs();
            }
            
            if (window.MediaSystem && typeof window.MediaSystem.clearAllPdfs === 'function') {
                window.MediaSystem.clearAllPdfs();
            }
            
            // Limpeza manual de fallback
            if (window.selectedPdfFiles) window.selectedPdfFiles = [];
            if (window.existingPdfFiles) window.existingPdfFiles = [];
            
            SC.logModule('admin', 'PDFs limpos em todos os sistemas');
        };

        window.loadExistingPdfsForEdit = function(property) {
            SC.logModule('admin', 'admin.js: loadExistingPdfsForEdit chamado');
            
            // PRIORIDADE 1: PdfSystem
            if (window.PdfSystem && typeof window.PdfSystem.loadExistingPdfsForEdit === 'function') {
                return window.PdfSystem.loadExistingPdfsForEdit(property);
            }
            
            // PRIORIDADE 2: MediaSystem
            if (window.MediaSystem && typeof window.MediaSystem.loadExistingPdfsForEdit === 'function') {
                return window.MediaSystem.loadExistingPdfsForEdit(property);
            }
            
            SC.logModule('admin', 'Nenhum sistema PDF disponível para carregar existentes', 'warn');
        };

        window.getPdfsToSave = async function(propertyId) {
            SC.logModule('admin', `admin.js: getPdfsToSave chamado para ${propertyId}`);
            
            // Redirecionar para processAndSavePdfs (mesma lógica)
            return await window.processAndSavePdfs(propertyId, 'Imóvel');
        };

        window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
            if (MediaSystem && MediaSystem.getMediaUrlsForProperty) {
                return await MediaSystem.getMediaUrlsForProperty(propertyId, propertyTitle);
            }
            return '';
        };

        window.clearProcessedPdfs = function() {
            // Esta função limpa apenas PDFs processados
            if (MediaSystem && MediaSystem.state && MediaSystem.state.pdfs) {
                MediaSystem.state.pdfs = MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
                MediaSystem.updateUI();
            }
        };

        // ========== CONFIGURAÇÕES ==========
        const ADMIN_CONFIG = {
            password: "wl654",
            pdfPassword: "doc123",
            panelId: "adminPanel",
            buttonClass: "admin-toggle",
            storageKey: "weberlessa_properties"
        };

        /* ==========================================================
           INTEGRAÇÃO COM SISTEMA UNIFICADO DE MÍDIA
           ========================================================== */

        // Verificar se LoadingManager está disponível, senão carregar fallback
        if (typeof LoadingManager === 'undefined') {
            SC.logModule('admin', 'LoadingManager não encontrado. Criando fallback básico...', 'warn');
            
            // Fallback mínimo compatível com a API
            window.LoadingManager = {
                show: function(title, message) {
                    SC.logModule('admin', `[FALLBACK] Loading: ${title}`);
                    return {
                        updateTitle: () => {},
                        updateMessage: () => {},
                        updateProgress: () => {},
                        completeStep: () => {},
                        hide: () => SC.logModule('admin', '[FALLBACK] Loading oculto')
                    };
                },
                hide: function() {
                    SC.logModule('admin', '[FALLBACK] LoadingManager.hide() chamado');
                }
            };
        }

        // ========== VARIÁVEIS GLOBAIS ==========
        window.editingPropertyId = null;

        // ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
        window.toggleAdminPanel = function() {
            SC.logModule('admin', 'toggleAdminPanel() executada');
            
            const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
            
            if (password === null) {
                SC.logModule('admin', 'Usuário cancelou o acesso');
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
                    
                    SC.logModule('admin', `Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
                    
                    if (!isVisible) {
                        setTimeout(() => {
                            panel.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                            SC.logModule('admin', 'Rolando até o painel admin');
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

        // ========== FUNÇÕES DO FORMULÁRIO ==========
        window.cancelEdit = function() {
            SC.logModule('admin', 'Cancelando edição...');
            SC.logModule('admin', 'LIMPEZA COMPLETA DO FORMULÁRIO', 'info');
            
            // 1. Resetar ID de edição
            window.editingPropertyId = null;

            // 2. LIMPAR SISTEMA DE MÍDIA (fotos/vídeos)
            if (typeof MediaSystem !== 'undefined') {
                SC.logModule('admin', 'Limpando sistema de mídia...');
                MediaSystem.resetState();
            } else {
                SC.logModule('admin', 'MediaSystem não disponível, limpando manualmente...', 'warn');
                if (typeof window.clearMediaSystemComplete === 'function') {
                    window.clearMediaSystemComplete();
                }
            }
            
            // 3. LIMPAR SISTEMA DE PDFs
            SC.logModule('admin', 'Limpando PDFs...');
            if (typeof window.clearAllPdfs === 'function') {
                window.clearAllPdfs();
            } else {
                // Fallback manual
                if (window.selectedPdfFiles) window.selectedPdfFiles = [];
                if (window.existingPdfFiles) window.existingPdfFiles = [];
            }
            
            // 4. LIMPAR TODOS OS CAMPOS DE TEXTO DO FORMULÁRIO
            SC.logModule('admin', 'Limpando campos de texto...');
            const form = document.getElementById('propertyForm');
            if (form) {
                // Método 1: Reset padrão
                form.reset();
                
                // Método 2: Garantir campos específicos vazios
                const textFields = [
                    'propTitle', 'propPrice', 'propLocation', 
                    'propDescription', 'propFeatures'
                ];
                
                textFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.value = '';
                        SC.logModule('admin', `✅ ${fieldId}: limpo`);
                    }
                });
                
                // Resetar selects e checkbox
                const typeSelect = document.getElementById('propType');
                const badgeSelect = document.getElementById('propBadge');
                const videoCheckbox = document.getElementById('propHasVideo');
                
                if (typeSelect) typeSelect.value = 'residencial';
                if (badgeSelect) badgeSelect.value = 'Novo';
                if (videoCheckbox) videoCheckbox.checked = false;
                
                SC.logModule('admin', 'Campos resetados:', 'info');
                SC.logModule('admin', `- type: ${typeSelect ? typeSelect.value : 'n/a'}`);
                SC.logModule('admin', `- badge: ${badgeSelect ? badgeSelect.value : 'n/a'}`);
                SC.logModule('admin', `- hasVideo: ${videoCheckbox ? videoCheckbox.checked : 'n/a'}`);
            }
            
            // 5. LIMPAR PREVIEWS VISUAIS (redundante, mas garante)
            SC.logModule('admin', 'Resetando previews visuais...');
            setTimeout(() => {
                const mediaPreview = document.getElementById('uploadPreview');
                const pdfPreview = document.getElementById('pdfUploadPreview');
                
                if (mediaPreview) {
                    mediaPreview.innerHTML = `
                        <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                            <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <p style="margin: 0;">Nenhuma foto ou vídeo adicionada</p>
                            <small style="font-size: 0.8rem;">Arraste ou clique para adicionar</small>
                        </div>
                    `;
                }
                
                if (pdfPreview) {
                    pdfPreview.innerHTML = `
                        <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                            <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
                        </div>
                    `;
                }
                
                SC.logModule('admin', 'Previews resetados');
            }, 100);
            
            // 6. ATUALIZAR UI DO FORMULÁRIO
            SC.logModule('admin', 'Atualizando interface...');
            const cancelBtn = document.getElementById('cancelEditBtn');
            if (cancelBtn) cancelBtn.style.display = 'none';
            
            const formTitle = document.getElementById('formTitle');
            if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
            
            const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                submitBtn.style.background = 'var(--primary)';
            }
            
            // 7. LIMPAR VARIÁVEIS GLOBAIS
            SC.logModule('admin', 'Limpando variáveis globais...');
            if (typeof window.selectedMediaFiles !== 'undefined') {
                window.selectedMediaFiles = [];
            }
            if (typeof window.existingMediaFiles !== 'undefined') {
                window.existingMediaFiles = [];
            }
            
            // 8. VERIFICAÇÃO FINAL
            setTimeout(() => {
                const formState = window.isAdminFormEmpty ? window.isAdminFormEmpty() : null;
                if (formState && !formState.isEmpty && formState.isEditing === false) {
                    SC.logModule('admin', 'Formulário ainda não está vazio após limpeza!', 'warn');
                    // Forçar limpeza novamente
                    form.reset();
                }
            }, 300);
            
            SC.logModule('admin', 'Edição cancelada e formulário COMPLETAMENTE limpo');
            return true;
        };

        // ADICIONAR TAMBÉM UMA FUNÇÃO DE FORÇAR LIMPEZA
        window.forceFormCleanup = function() {
            SC.logModule('admin', 'FORÇANDO limpeza completa do formulário...');
            
            // Limpar manualmente cada campo
            const fieldsToClear = [
                { id: 'propTitle', type: 'text', defaultValue: '' },
                { id: 'propPrice', type: 'text', defaultValue: '' },
                { id: 'propLocation', type: 'text', defaultValue: '' },
                { id: 'propDescription', type: 'textarea', defaultValue: '' },
                { id: 'propFeatures', type: 'text', defaultValue: '' },
                { id: 'propType', type: 'select', defaultValue: 'residencial' },
                { id: 'propBadge', type: 'select', defaultValue: 'Novo' }
            ];
            
            fieldsToClear.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = field.defaultValue;
                    SC.logModule('admin', `✅ ${field.id} = "${field.defaultValue}"`);
                    
                    // Disparar evento change para qualquer listener
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            
            // Checkbox específico
            const videoCheckbox = document.getElementById('propHasVideo');
            if (videoCheckbox) {
                videoCheckbox.checked = false;
                videoCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                SC.logModule('admin', '✅ propHasVideo = false');
            }
            
            SC.logModule('admin', 'Limpeza forçada completa');
            return true;
        };

        window.loadPropertyList = function() {
            SC.logModule('admin', 'Carregando lista de imóveis...');
            
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
            
            SC.logModule('admin', `${window.properties.length} imóveis listados`);
        };

        // ========== FUNÇÃO editProperty ATUALIZADA COM SUPORTE A MÍDIA E SCROLL ==========
        window.editProperty = function(id) {
            SC.logModule('admin', `EDITANDO IMÓVEL ${id} (MediaSystem unificado ativo)`);

            // Buscar imóvel
            const property = window.properties.find(p => p.id === id);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }

            // ==============================
            // 1️⃣ RESET COMPLETO DA MÍDIA
            // ==============================
            if (window.MediaSystem) {
                MediaSystem.resetState();
            } else {
                SC.logModule('admin', 'MediaSystem não disponível', 'warn');
            }

            // ==============================
            // 2️⃣ PREENCHER FORMULÁRIO
            // ==============================
            document.getElementById('propTitle').value = property.title || '';
            document.getElementById('propPrice').value = property.price || '';
            document.getElementById('propLocation').value = property.location || '';
            document.getElementById('propDescription').value = property.description || '';

            document.getElementById('propFeatures').value = Array.isArray(property.features)
                ? property.features.join(', ')
                : (property.features || '');

            document.getElementById('propType').value = property.type || 'residencial';
            document.getElementById('propBadge').value = property.badge || 'Novo';

            document.getElementById('propHasVideo').checked =
                property.has_video === true ||
                property.has_video === 'true' ||
                (typeof property.has_video === 'string' && property.has_video.toLowerCase() === 'true') ||
                false;

            const formTitle = document.getElementById('formTitle');
            if (formTitle) {
                formTitle.textContent = `Editando: ${property.title}`;
            }

            const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
                submitBtn.style.background = 'var(--accent)'; // Cor diferente para edição
            }

            const cancelBtn = document.getElementById('cancelEditBtn');
            if (cancelBtn) {
                cancelBtn.style.display = 'block';
            }

            // Marcar modo edição
            window.editingPropertyId = property.id;

            // ==============================
            // 3️⃣ CARREGAR MÍDIA EXISTENTE
            // ==============================
            if (window.MediaSystem) {
                MediaSystem.loadExisting(property);
                SC.logModule('admin', 'Mídia existente carregada no MediaSystem');
            }

            // ==============================
            // ⭐⭐ 4️⃣ ROLAR ATÉ O FORMULÁRIO AUTOMATICAMENTE ⭐⭐
            // ==============================
            setTimeout(() => {
                const adminPanel = document.getElementById('adminPanel');
                const propertyForm = document.getElementById('propertyForm');
                
                // Primeiro garantir que o painel admin está visível
                if (adminPanel && adminPanel.style.display !== 'block') {
                    adminPanel.style.display = 'block';
                    SC.logModule('admin', '✅ Painel admin aberto automaticamente');
                }
                
                // Agrar rolar suavemente até o formulário
                if (propertyForm) {
                    SC.logModule('admin', 'Rolando até o formulário de edição...');
                    
                    // Método 1: Usar scrollIntoView com comportamento suave
                    propertyForm.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start', // Alinha ao topo
                        inline: 'nearest'
                    });
                    
                    // Método 2: Destacar visualmente o formulário
                    propertyForm.style.transition = 'all 0.3s ease';
                    propertyForm.style.boxShadow = '0 0 0 3px var(--accent)';
                    
                    // Remover destaque após 2 segundos
                    setTimeout(() => {
                        propertyForm.style.boxShadow = '';
                    }, 2000);
                    
                    SC.logModule('admin', 'Formulário em foco para edição');
                    
                } else {
                    SC.logModule('admin', 'Formulário não encontrado para scroll', 'warn');
                    // Fallback: rolar até o painel admin
                    if (adminPanel) {
                        adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                
                // Focar no primeiro campo (título) para facilitar edição
                setTimeout(() => {
                    const titleField = document.getElementById('propTitle');
                    if (titleField) {
                        titleField.focus();
                        titleField.select(); // Selecionar texto para fácil edição
                        SC.logModule('admin', 'Foco no campo título');
                    }
                }, 600);
                
            }, 100); // Pequeno delay para garantir que o DOM foi atualizado

            SC.logModule('admin', `Imóvel ${id} pronto para edição`);
            return true;
        };

        // ========== Função de Limpeza do Formulário ==========

        window.resetAdminFormToInitialState = function() {
            SC.logModule('admin', 'Resetando formulário admin para estado inicial');
            
            try {
                // 1. Resetar campos do formulário
                document.getElementById('propertyForm').reset();
                
                // 2. Limpar sistema de mídia (fotos/vídeos)
                if (typeof window.clearMediaSystemComplete === 'function') {
                    window.clearMediaSystemComplete();
                } else if (typeof window.clearMediaSystem === 'function') {
                    window.clearMediaSystem();
                }
                
                // 3. Limpar sistema de PDFs
                if (typeof window.clearAllPdfs === 'function') {
                    window.clearAllPdfs();
                } else {
                    // Fallback manual para PDFs
                    if (window.selectedPdfFiles) window.selectedPdfFiles = [];
                    if (window.existingPdfFiles) window.existingPdfFiles = [];
                    
                    const pdfPreview = document.getElementById('pdfUploadPreview');
                    if (pdfPreview) {
                        pdfPreview.innerHTML = `
                            <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                                <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
                            </div>
                        `;
                    }
                }
                
                // 4. Resetar variáveis de edição
                window.editingPropertyId = null;
                
                // 5. Atualizar interface
                const formTitle = document.getElementById('formTitle');
                if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
                
                const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
                if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                
                const cancelBtn = document.getElementById('cancelEditBtn');
                if (cancelBtn) cancelBtn.style.display = 'none';
                
                SC.logModule('admin', 'Formulário resetado completamente para estado inicial');
                return true;
                
            } catch (error) {
                SC.logModule('admin', `Erro ao resetar formulário: ${error}`, 'error');
                return false;
            }
        };

        // ========== CONFIGURAÇÃO DO FORMULÁRIO ATUALIZADA COM SISTEMA DE LOADING ==========
        window.setupForm = function() {
            SC.logModule('admin', 'Configurando formulário admin com sistema de mídia integrado...');
            
            const form = document.getElementById('propertyForm');
            if (!form) {
                SC.logModule('admin', 'Formulário propertyForm não encontrado!', 'error');
                return;
            }
            
            // REMOVER event listeners antigos para evitar duplicação
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            const freshForm = document.getElementById('propertyForm');
            
            // Configurar botão de submit
            const submitBtn = freshForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalHtml = submitBtn.innerHTML;
                submitBtn.addEventListener('click', function() {
                    // Não desabilitar aqui, será desabilitado no listener de submit
                });
            }
            
            freshForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                SC.logModule('admin', 'SUBMISSÃO DO FORMULÁRIO ADMIN', 'info');
                
                // 1. INICIAR LOADING
                const loading = window.LoadingManager.show(
                    'Salvando Imóvel...', 
                    'Por favor, aguarde enquanto processamos todos os dados.',
                    [ // Etapas opcionais - mantém compatibilidade
                        'Validando dados do formulário...',
                        'Processando fotos e vídeos...',
                        'Enviando documentos PDF...',
                        'Salvando no banco de dados...'
                    ]
                );
                
                // Desabilitar botão de submit
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
                }
                
                try {
                    // 2. COLETAR DADOS DO FORMULÁRIO
                    loading.updateMessage('Validando dados do formulário...');
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
                    
                    SC.logModule('admin', `Dados coletados: ${JSON.stringify(propertyData).substring(0, 100)}...`);
                    loading.completeStep(); // Etapa 1 completa
                    
                    // 3. VALIDAÇÃO BÁSICA
                    if (!propertyData.title || !propertyData.price || !propertyData.location) {
                        loading.updateTitle('❌ Validação Falhou');
                        loading.updateMessage('Preencha Título, Preço e Localização!');
                        setTimeout(() => {
                            loading.hide();
                            alert('❌ Preencha Título, Preço e Localização!');
                            
                            // Reabilitar botão
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = window.editingPropertyId ? 
                                    '<i class="fas fa-save"></i> Salvar Alterações' : 
                                    '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                            }
                        }, 1500);
                        SC.logModule('admin', 'Validação falhou: campos obrigatórios vazios', 'error');
                        return;
                    }
                    
                    loading.updateMessage('Validação aprovada, processando...');
                    SC.logModule('admin', 'Validação básica OK');
                    
                    // 4. PROCESSAMENTO PRINCIPAL
                    if (window.editingPropertyId) {
                        // ========== EDIÇÃO DE IMÓVEL EXISTENTE ==========
                        SC.logModule('admin', `EDITANDO imóvel ID: ${window.editingPropertyId}`);
                        loading.updateTitle('Atualizando Imóvel...');
                        
                        // 4.1 Preparar objeto de atualização
                        const updateData = { ...propertyData };
                        
                        // 4.2 PROCESSAR PDFs
                        loading.updateMessage('Processando documentos PDF...');
                        loading.completeStep(); // Etapa 2 completa
                        
                        if (typeof window.processAndSavePdfs === 'function') {
                            SC.logModule('admin', `Delegando processamento de PDFs para MediaSystem...`);
                            const pdfsString = await window.processAndSavePdfs(window.editingPropertyId, propertyData.title);
                            
                            if (pdfsString && pdfsString.trim() !== '') {
                                updateData.pdfs = pdfsString;
                                SC.logModule('admin', `PDFs processados pelo MediaSystem: ${pdfsString.substring(0, 60)}...`);
                            } else {
                                updateData.pdfs = '';
                                SC.logModule('admin', 'Nenhum PDF para o imóvel (MediaSystem retornou vazio)');
                            }
                        } else {
                            SC.logModule('admin', 'Função processAndSavePdfs não disponível', 'warn');
                            updateData.pdfs = '';
                        }
                        
                        // 4.3 PROCESSAR MÍDIA (FOTOS/VIDEOS)
                        loading.updateMessage('Processando fotos e vídeos...');
                        loading.completeStep(); // Etapa 3 completa
                        
                        try {
                            if (typeof window.getMediaUrlsForProperty === 'function') {
                                SC.logModule('admin', `Chamando getMediaUrlsForProperty para ID ${window.editingPropertyId}...`);
                                
                                // Usar função com ordenação se disponível
                                let mediaUrls;
                                if (window.MediaSystem && typeof window.MediaSystem.getOrderedMediaUrls === 'function') {
                                    const ordered = window.MediaSystem.getOrderedMediaUrls();
                                    mediaUrls = ordered.images;
                                    SC.logModule('admin', 'Usando ordem visual personalizada');
                                } else {
                                    mediaUrls = await window.getMediaUrlsForProperty(window.editingPropertyId, propertyData.title);
                                }
                                
                                if (mediaUrls !== undefined && mediaUrls !== null) {
                                    if (mediaUrls.trim() !== '') {
                                        updateData.images = mediaUrls;
                                        const urlCount = mediaUrls.split(',').filter(url => url.trim() !== '').length;
                                        SC.logModule('admin', `Mídia processada: ${urlCount} URL(s)`);
                                        SC.logModule('admin', `Amostra: ${mediaUrls.substring(0, 80)}...`);
                                    } else {
                                        // String vazia - sem mídia
                                        updateData.images = '';
                                        SC.logModule('admin', 'Nenhuma mídia para salvar');
                                    }
                                } else {
                                    SC.logModule('admin', 'getMediaUrlsForProperty retornou undefined/null', 'warn');
                                    updateData.images = '';
                                }
                            } else {
                                SC.logModule('admin', 'Função getMediaUrlsForProperty não disponível!', 'error');
                                updateData.images = '';
                            }
                        } catch (mediaError) {
                            SC.logModule('admin', `ERRO CRÍTICO ao processar mídia: ${mediaError}`, 'error');
                            SC.logModule('admin', 'Usando fallback: mantendo imagens existentes');
                            // Tenta manter as imagens existentes do imóvel atual
                            const currentProperty = window.properties.find(p => p.id == window.editingPropertyId);
                            updateData.images = currentProperty ? currentProperty.images : '';
                        }
                        
                        // 4.4 SALVAR NO BANCO
                        loading.updateMessage('Salvando alterações no banco de dados...');
                        loading.completeStep(); // Etapa 4 completa
                        
                        if (typeof window.updateProperty === 'function') {
                            SC.logModule('admin', 'Enviando atualização para o sistema de propriedades...');
                            const success = await window.updateProperty(window.editingPropertyId, updateData);
                            
                            if (success) {
                                SC.logModule('admin', 'Imóvel atualizado com sucesso no banco de dados!');
                                
                                // Feedback final
                                loading.updateTitle('✅ Concluído!');
                                loading.updateMessage('Imóvel atualizado com sucesso!');
                                
                                // Mostrar resumo para o usuário
                                setTimeout(() => {
                                    const imageCount = updateData.images ? updateData.images.split(',').filter(url => url.trim() !== '').length : 0;
                                    const pdfCount = updateData.pdfs ? updateData.pdfs.split(',').filter(url => url.trim() !== '').length : 0;
                                    
                                    let successMessage = `✅ Imóvel "${updateData.title}" atualizado!`;
                                    if (imageCount > 0) successMessage += `\n📸 ${imageCount} foto(s)/vídeo(s) salvo(s)`;
                                    if (pdfCount > 0) successMessage += `\n📄 ${pdfCount} documento(s) PDF salvo(s)`;
                                    
                                    alert(successMessage);
                                }, 800);
                                
                            } else {
                                loading.updateTitle('❌ Erro');
                                loading.updateMessage('Falha na atualização');
                                setTimeout(() => {
                                    loading.hide();
                                    alert('❌ Não foi possível atualizar o imóvel. Verifique o console.');
                                }, 1500);
                            }
                        } else {
                            SC.logModule('admin', 'Função updateProperty não disponível!', 'error');
                            alert('❌ Erro: sistema de propriedades não disponível');
                        }
                        
                    } else {
                        // ========== CRIAÇÃO DE NOVO IMÓVEL ==========
                        SC.logModule('admin', 'CRIANDO novo imóvel...');
                        loading.updateTitle('Criando Novo Imóvel...');
                        
                        // 4.5 PROCESSAR MÍDIA PARA NOVO IMÓVEL
                        loading.updateMessage('Processando fotos e vídeos...');
                        loading.completeStep(); // Etapa 2 completa
                        
                        let mediaUrls = '';
                        if (window.selectedMediaFiles && window.selectedMediaFiles.length > 0) {
                            SC.logModule('admin', `Processando ${window.selectedMediaFiles.length} arquivo(s) de mídia para novo imóvel...`);
                            
                            try {
                                if (typeof window.getMediaUrlsForProperty === 'function') {
                                    // Para novo imóvel, usar ID temporário
                                    const tempId = `new_${Date.now()}`;
                                    mediaUrls = await window.getMediaUrlsForProperty(tempId, propertyData.title);
                                    
                                    if (mediaUrls && mediaUrls.trim() !== '') {
                                        propertyData.images = mediaUrls;
                                        SC.logModule('admin', `Mídia processada para novo imóvel: ${mediaUrls.substring(0, 80)}...`);
                                    }
                                }
                            } catch (mediaError) {
                                SC.logModule('admin', `Erro ao processar mídia para novo imóvel: ${mediaError}`, 'error');
                            }
                        }
                        
                        // 4.6 PROCESSAR PDFs PARA NOVO IMÓVEL
                        loading.updateMessage('Processando documentos PDF...');
                        loading.completeStep(); // Etapa 3 completa
                        
                        if (window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
                            SC.logModule('admin', `Processando ${window.selectedPdfFiles.length} PDF(s) para novo imóvel...`);
                            // A lógica de PDFs para novo imóvel já está em addNewProperty
                        }
                        
                        // 4.7 CRIAR NO BANCO
                        loading.updateMessage('Salvando no banco de dados...');
                        loading.completeStep(); // Etapa 4 completa
                        
                        if (typeof window.addNewProperty === 'function') {
                            SC.logModule('admin', `Chamando addNewProperty com dados: ${JSON.stringify({
                                title: propertyData.title,
                                hasMedia: !!(propertyData.images),
                                hasPdfs: !!(window.selectedPdfFiles && window.selectedPdfFiles.length > 0)
                            })}`);
                            
                            const newProperty = await window.addNewProperty(propertyData);
                            
                            if (newProperty) {
                                SC.logModule('admin', `Novo imóvel criado com ID: ${newProperty.id}`);

                                // Feedback final
                                loading.updateTitle('✅ Concluído!');
                                loading.updateMessage('Imóvel cadastrado com sucesso!');
                                
                                // Mostrar resumo
                                setTimeout(() => {
                                    let successMessage = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`;
                                    if (newProperty.images && newProperty.images !== 'EMPTY') {
                                        const imageCount = newProperty.images.split(',').filter(url => url.trim() !== '').length;
                                        successMessage += `\n📸 ${imageCount} foto(s)/vídeos incluída(s)`;
                                    }
                                    if (newProperty.pdfs && newProperty.pdfs !== 'EMPTY') {
                                        const pdfCount = newProperty.pdfs.split(',').filter(url => url.trim() !== '').length;
                                        successMessage += `\n📄 ${pdfCount} documento(s) PDF incluído(s)`;
                                    }
                                    
                                    alert(successMessage);
                                }, 800);
                                
                            } else {
                                loading.updateTitle('❌ Erro');
                                loading.updateMessage('Falha na criação');
                                setTimeout(() => {
                                    loading.hide();
                                    alert('❌ Não foi possível criar o imóvel. Verifique o console.');
                                }, 1500);
                            }
                        } else {
                            SC.logModule('admin', 'Função addNewProperty não disponível!', 'error');
                            alert('❌ Erro: sistema de criação não disponível');
                        }
                    }
                    
                } catch (error) {
                    // 5. TRATAMENTO DE ERROS
                    SC.logModule('admin', `ERRO CRÍTICO no processamento do formulário: ${error}`, 'error');
                    
                    loading.updateTitle('❌ Erro no Processamento');
                    loading.updateMessage(error.message || 'Erro desconhecido');
                    
                    setTimeout(() => {
                        loading.hide();
                        
                        let errorMessage = `❌ Erro ao processar: ${error.message || 'Erro desconhecido'}`;
                        
                        // Mensagens mais amigáveis para erros comuns
                        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                            errorMessage = '❌ Erro de conexão. Verifique sua internet e tente novamente.';
                        } else if (error.message.includes('Supabase') || error.message.includes('storage')) {
                            errorMessage = '❌ Erro no servidor de armazenamento. Tente novamente em alguns instantes.';
                        }
                        
                        alert(errorMessage + '\n\nVerifique o console para detalhes técnicos.');
                        
                        // Reabilitar botão
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = window.editingPropertyId ? 
                                '<i class="fas fa-save"></i> Salvar Alterações' : 
                                '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                        }
                        
                    }, 1500);
                    
                } finally {
                    // 6. LIMPEZA E RESET APÓS SALVAMENTO (SUCESSO OU ERRO)
                    setTimeout(() => {
                        SC.logModule('admin', 'Executando limpeza automática pós-salvamento...');
                        
                        // Esconder loading
                        loading.hide();
                        
                        // ✅ CHAVE: Resetar formulário para estado inicial
                        if (typeof window.resetAdminFormToInitialState === 'function') {
                            setTimeout(() => {
                                window.resetAdminFormToInitialState();
                            }, 500);
                        } else {
                            // Fallback: chamar cancelEdit() que já existe
                            if (typeof window.cancelEdit === 'function') {
                                setTimeout(() => {
                                    window.cancelEdit();
                                }, 500);
                                }
                            }
                            
                            // Reabilitar botão de submit
                            if (submitBtn) {
                                setTimeout(() => {
                                    submitBtn.disabled = false;
                                    submitBtn.innerHTML = window.editingPropertyId ? 
                                        '<i class="fas fa-save"></i> Salvar Alterações' : 
                                        '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
                                }, 500);
                            }
                            
                            // Atualizar lista de imóveis no admin
                            if (typeof window.loadPropertyList === 'function') {
                                setTimeout(() => {
                                    window.loadPropertyList();
                                    SC.logModule('admin', 'Lista de imóveis atualizada');
                                }, 700);
                            }
                            
                            // Forçar recarregamento da galeria principal
                            if (typeof window.renderProperties === 'function') {
                                setTimeout(() => {
                                    window.renderProperties('todos');
                                    SC.logModule('admin', 'Galeria principal atualizada');
                                }, 1000);
                            }
                            
                            // Feedback visual para usuário
                            SC.logModule('admin', 'Formulário limpo e pronto para novo imóvel');
                            
                        }, 1000);
                    }
                });
                
                SC.logModule('admin', 'Formulário admin configurado com sistema de loading visual');
            };

            // ========== SINCRONIZAÇÃO MANUAL ==========
            window.syncWithSupabaseManual = async function() {
                if (confirm('🔄 Sincronizar com Supabase?\n\nIsso irá buscar os imóveis do banco de dados online.')) {
                    SC.logModule('admin', 'Iniciando sincronização manual...');
                    
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
                                
                                if (typeof window.loadPropertyList === 'function') {
                                    window.loadPropertyList();
                                }
                            } else {
                                alert('⚠️ Não foi possível sincronizar. Verifique a conexão.');
                            }
                        } else {
                            alert('❌ Função de sincronização não disponível!');
                        }
                    } catch (error) {
                        SC.logModule('admin', `Erro na sincronização: ${error}`, 'error');
                        alert('❌ Erro ao sincronizar: ' + error.message);
                    } finally {
                        if (syncBtn) {
                            syncBtn.disabled = false;
                            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar com Supabase';
                        }
                    }
                }
            };

            // ========== BOTÃO SINCRONIZAÇÃO ==========
            function addSyncButton() {
                const adminPanel = document.getElementById('adminPanel');
                if (!adminPanel) return;
                
                if (document.getElementById('syncButton')) {
                    return;
                }
                
                const syncButton = document.createElement('button');
                syncButton.id = 'syncButton';
                syncButton.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar com Supabase';
                syncButton.style.cssText = `
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
                
                syncButton.onclick = window.syncWithSupabaseManual;
                
                const panelTitle = adminPanel.querySelector('h3');
                if (panelTitle) {
                    panelTitle.parentNode.insertBefore(syncButton, panelTitle.nextSibling);
                }
                
                SC.logModule('admin', 'Botão de sincronização adicionado');
            }

            // ========== CORREÇÃO DEFINITIVA DOS FILTROS ==========
            window.fixFilterVisuals = function() {
                SC.logModule('admin', 'CORREÇÃO DEFINITIVA DOS FILTROS VISUAIS');
                
                const filterButtons = document.querySelectorAll('.filter-btn');
                if (!filterButtons || filterButtons.length === 0) {
                    SC.logModule('admin', 'Nenhum botão de filtro encontrado', 'warn');
                    return;
                }
                
                SC.logModule('admin', `Encontrados ${filterButtons.length} botões de filtro`);
                
                // Para CADA botão, remover e recriar completamente
                filterButtons.forEach((button, index) => {
                    SC.logModule('admin', `${index + 1}. Processando: "${button.textContent.trim()}"`);
                    
                    // Clonar botão (remove event listeners antigos)
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    
                    // Configurar NOVO event listener DIRETO
                    newButton.addEventListener('click', function handleFilterClick(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        SC.logModule('admin', `Filtro clicado: "${this.textContent.trim()}"`);
                        
                        // ✅ CRÍTICO: Remover 'active' de TODOS os botões
                        const allButtons = document.querySelectorAll('.filter-btn');
                        allButtons.forEach(btn => {
                            btn.classList.remove('active');
                            // Remover também style inline se existir
                            btn.style.backgroundColor = '';
                            btn.style.color = '';
                            btn.style.borderColor = '';
                        });
                        
                        // ✅ Adicionar 'active' apenas ao clicado
                        this.classList.add('active');
                        
                        // Aplicar estilos visuais
                        this.style.backgroundColor = 'var(--primary)';
                        this.style.color = 'white';
                        this.style.borderColor = 'var(--primary)';
                        
                        SC.logModule('admin', `✅ "active" removido de ${allButtons.length - 1} botões`);
                        SC.logModule('admin', `✅ "active" adicionado a: "${this.textContent.trim()}"`);
                        
                        // Executar filtro
                        const filterText = this.textContent.trim();
                        const filter = filterText === 'Todos' ? 'todos' : filterText;
                        
                        if (typeof window.renderProperties === 'function') {
                            SC.logModule('admin', `🚀 Executando filtro: ${filter}`);
                            window.renderProperties(filter);
                        }
                    });
                });
                
                SC.logModule('admin', `${filterButtons.length} botões de filtro CORRIGIDOS`);
                
                // ✅ ATIVAR "Todos" por padrão se nenhum estiver ativo
                setTimeout(() => {
                    const activeButtons = document.querySelectorAll('.filter-btn.active');
                    if (activeButtons.length === 0) {
                        const todosBtn = Array.from(filterButtons).find(btn => 
                            btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
                        );
                        if (todosBtn) {
                            todosBtn.classList.add('active');
                            todosBtn.style.backgroundColor = 'var(--primary)';
                            todosBtn.style.color = 'white';
                            SC.logModule('admin', '"Todos" ativado por padrão');
                        }
                    }
                }, 500);
            };

            // ========== CONFIGURAÇÃO CORRIGIDA DO UPLOAD DE PDF ==========
            SC.logModule('admin', 'Configurando upload de PDFs: DELEGANDO para MediaSystem');

            // ========== VERIFICAR E AGUARDAR MEDIASYSTEM ANTES DE CONFIGURAR ==========
            setTimeout(() => {
                const pdfFileInput = document.getElementById('pdfFileInput');
                const pdfUploadArea = document.getElementById('pdfUploadArea');
                
                if (pdfFileInput && pdfUploadArea) {
                    SC.logModule('admin', 'Elementos de PDF encontrados - Configurando...');
                    
                    // 1. REMOVER QUALQUER LISTENER ANTIGO (clonando elementos)
                    const cleanPdfInput = pdfFileInput.cloneNode(true);
                    const cleanPdfArea = pdfUploadArea.cloneNode(true);
                    
                    pdfFileInput.parentNode.replaceChild(cleanPdfInput, pdfFileInput);
                    pdfUploadArea.parentNode.replaceChild(cleanPdfArea, pdfUploadArea);
                    
                    SC.logModule('admin', 'Elementos resetados - Prontos para MediaSystem');
                    
                    // 2. AGORA APENAS CONFIGURAR O BÁSICO - O MediaSystem fará o resto
                    const freshUploadArea = document.getElementById('pdfUploadArea');
                    const freshFileInput = document.getElementById('pdfFileInput');
                    
                    // 3. CONFIGURAR APENAS O CLICK BÁSICO (sem processamento)
                    freshUploadArea.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        SC.logModule('admin', 'Área de PDF clicada - Abrindo seletor...');
                        freshFileInput.click();
                    });
                    
                    // 4. DELEGAR 100% PARA MEDIASYSTEM QUANDO ARQUIVO FOR SELECIONADO
                    freshFileInput.addEventListener('change', function(e) {
                        if (e.target.files.length > 0) {
                            SC.logModule('admin', `${e.target.files.length} arquivo(s) selecionado(s)`);
                            
                            // CHAMAR DIRETAMENTE O MEDIASYSTEM
                            if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                                SC.logModule('admin', 'Delegando para MediaSystem.addPdfs()');
                                window.MediaSystem.addPdfs(e.target.files);
                            } else {
                                SC.logModule('admin', 'MediaSystem não disponível!', 'error');
                                alert('⚠️ Sistema de upload não está pronto. Recarregue a página.');
                            }
                            
                            // Limpar input para permitir mesmo arquivo novamente
                            e.target.value = '';
                        }
                    });
                    
                    // 5. CONFIGURAR DRAG & DROP PARA A ÁREA DE PDF
                    freshUploadArea.addEventListener('dragover', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.style.borderColor = '#3498db';
                        this.style.background = '#e8f4fc';
                        SC.logModule('admin', 'Drag over área PDF');
                    });
                    
                    freshUploadArea.addEventListener('dragleave', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.style.borderColor = '#ddd';
                        this.style.background = '#fafafa';
                    });
                    
                    freshUploadArea.addEventListener('drop', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        this.style.borderColor = '#ddd';
                        this.style.background = '#fafafa';
                        
                        if (e.dataTransfer.files.length > 0) {
                            SC.logModule('admin', `${e.dataTransfer.files.length} arquivo(s) solto(s)`);
                            
                            // CHAMAR DIRETAMENTE O MEDIASYSTEM
                            if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                                window.MediaSystem.addPdfs(e.dataTransfer.files);
                            }
                        }
                    });
                    
                    SC.logModule('admin', 'Upload de PDFs configurado - MediaSystem responsável pelo processamento');
                    
                } else {
                    SC.logModule('admin', 'Elementos de PDF não encontrados no DOM', 'warn');
                }
            }, 1000); // Aguardar 1s para garantir que MediaSystem carregou

            // ========== GARANTIR QUE MEDIASYSTEM ESTÁ PRONTO ==========
            function waitForMediaSystem(maxAttempts = 10, interval = 500) {
                return new Promise((resolve, reject) => {
                    let attempts = 0;
                    
                    const checkInterval = setInterval(() => {
                        attempts++;
                        
                        if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                            clearInterval(checkInterval);
                            SC.logModule('admin', `MediaSystem pronto após ${attempts} tentativas`);
                            resolve(true);
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            SC.logModule('admin', `MediaSystem não carregou após ${maxAttempts * interval}ms`, 'error');
                            resolve(false);
                        } else {
                            SC.logModule('admin', `Aguardando MediaSystem... tentativa ${attempts}`);
                        }
                    }, interval);
                });
            }

            // ========== FUNÇÃO DE FALLBACK SE MEDIASYSTEM FALHAR ==========
            function setupPdfFallback() {
                SC.logModule('admin', 'Configurando fallback para PDFs...');
                
                const pdfUploadArea = document.getElementById('pdfUploadArea');
                const pdfFileInput = document.getElementById('pdfFileInput');
                
                if (!pdfUploadArea || !pdfFileInput) {
                    SC.logModule('admin', 'Elementos de PDF não encontrados para fallback', 'error');
                    return;
                }
                
                // Configuração básica de fallback
                pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
                
                pdfFileInput.addEventListener('change', async function(e) {
                    if (e.target.files.length > 0) {
                        SC.logModule('admin', `Fallback: Processando ${e.target.files.length} PDF(s)`);
                        
                        // Tentar MediaSystem primeiro
                        if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                            window.MediaSystem.addPdfs(e.target.files);
                        } 
                        // Fallback manual extremo
                        else {
                            alert('⚠️ Sistema de upload em manutenção. Tente novamente em alguns segundos.');
                        }
                    }
                });
            }

            // ========== EXECUTAR VERIFICAÇÃO DE MEDIASYSTEM ==========
            document.addEventListener('DOMContentLoaded', function() {
                SC.logModule('admin', 'Verificando sistema de mídia...');
                
                waitForMediaSystem().then(isReady => {
                    if (!isReady) {
                        SC.logModule('admin', 'Configurando fallback para PDFs', 'warn');
                        setupPdfFallback();
                    }
                });
            });

            // ========== INICIALIZAÇÃO DO SISTEMA ==========
            function initializeAdminSystem() {
                SC.logModule('admin', 'Inicializando sistema admin...');
                
                // 1. Esconder painel
                const panel = document.getElementById('adminPanel');
                if (panel) {
                    panel.style.display = 'none';
                    SC.logModule('admin', 'Painel admin oculto');
                }
                
                // 2. Configurar botão admin
                const adminBtn = document.querySelector('.admin-toggle');
                if (adminBtn) {
                    adminBtn.removeAttribute('onclick');
                    adminBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        SC.logModule('admin', 'Botão admin clicado');
                        window.toggleAdminPanel();
                    });
                    SC.logModule('admin', 'Botão admin configurado');
                }
                
                // 3. Configurar formulário
                if (typeof window.setupForm === 'function') {
                    window.setupForm();
                    SC.logModule('admin', 'Formulário configurado');
                }
                
                // 4. Adicionar botão sincronização
                addSyncButton();
                
                // 5. CORREÇÃO GARANTIDA DOS FILTROS (VERSÃO FINAL)
                SC.logModule('admin', 'Iniciando correção garantida dos filtros...');

                // A configuração do upload de PDF já foi tratada acima
                SC.logModule('admin', 'Upload de PDF delegado 100% para MediaSystem');

                // Tentativa 1: Imediata (800ms)
                setTimeout(() => {
                    if (typeof window.fixFilterVisuals === 'function') {
                        SC.logModule('admin', 'Tentativa 1: Aplicando correção de filtros...');
                        window.fixFilterVisuals();
                    } else {
                        SC.logModule('admin', 'window.fixFilterVisuals não encontrada!', 'error');
                    }
                }, 800);

                // Tentativa 2: Após 2 segundos (backup)
                setTimeout(() => {
                    SC.logModule('admin', 'Verificando se filtros funcionam...');
                    
                    // Testar se algum filtro tem listener
                    const testBtn = document.querySelector('.filter-btn');
                    if (testBtn && !testBtn.onclick) {
                        SC.logModule('admin', 'Filtros sem listeners - reaplicando...', 'warn');
                        if (typeof window.fixFilterVisuals === 'function') {
                            window.fixFilterVisuals();
                        }
                    }
                }, 2000);

                // 6. VERIFICAR SISTEMA DE LOADING
                SC.logModule('admin', 'Verificando sistema de loading...');
                if (typeof LoadingManager !== 'undefined') {
                    SC.logModule('admin', 'LoadingManager disponível');
                } else {
                    SC.logModule('admin', 'LoadingManager não carregado', 'warn');
                }
               
                SC.logModule('admin', 'Sistema admin inicializado');
            }

            // ========== EXECUÇÃO AUTOMÁTICA ==========
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(initializeAdminSystem, 500);
                });
            } else {
                setTimeout(initializeAdminSystem, 300);
            }

            // ========== FUNÇÕES PDF BÁSICAS ==========
            window.showPdfModal = function(propertyId) {
                SC.logModule('admin', `showPdfModal chamado para ID: ${propertyId}`);
                
                // Usar o PdfSystem unificado se disponível (PRIORIDADE 1)
                if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
                    window.PdfSystem.showModal(propertyId);
                    return;
                }
                
                // Fallback robusto que GARANTE campo de senha
                if (typeof window.openPdfModalDirectFallback === 'function') {
                    window.openPdfModalDirectFallback(propertyId);
                } else {
                    // Último recurso: modal manual básico
                    alert('Sistema de documentos temporariamente indisponível. Tente novamente em alguns instantes.');
                }
            };

            // ========== FUNÇÃO DE FALLBACK (ATUALIZADA E MELHORADA) ==========
            function openPdfModalDirectFallback(propertyId) {
                SC.logModule('admin', `Fallback PDF modal para ID: ${propertyId} - Versão Corrigida`);
                
                // 1. Buscar imóvel
                const property = window.properties?.find(p => p.id == propertyId);
                if (!property) {
                    alert('❌ Imóvel não encontrado!');
                    return;
                }
                
                // 2. Verificar se tem PDFs
                if (!property.pdfs || property.pdfs === 'EMPTY' || property.pdfs.trim() === '') {
                    alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
                    return;
                }
                
                // 3. Armazenar ID para uso posterior
                window.currentPropertyId = propertyId;
                
                // ✅ 4. GARANTIR QUE O MODAL EXISTE COM TODOS OS ELEMENTOS
                const modal = window.ensurePdfModalExists(true); // true = forçar verificação completa
                
                // ✅ 5. Configurar título com segurança
                const titleElement = document.getElementById('pdfModalTitle');
                if (titleElement) {
                    titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
                    titleElement.dataset.propertyId = propertyId;
                }
                
                // ✅ 6. GARANTIR QUE O CAMPO DE SENHA EXISTE E É VISÍVEL (CORREÇÃO CRÍTICA)
                let passwordInput = document.getElementById('pdfPassword');
                
                // Se não existe ou está oculto por form pai
                if (!passwordInput || (passwordInput.parentElement && 
                    window.getComputedStyle(passwordInput.parentElement).display === 'none')) {
                    
                    SC.logModule('admin', 'Campo de senha não encontrado ou oculto. Recriando...', 'warn');
                    
                    // Remover input antigo se existir
                    if (passwordInput && passwordInput.parentElement) {
                        passwordInput.parentElement.removeChild(passwordInput);
                    }
                    
                    // Criar novo campo VISÍVEL
                    passwordInput = document.createElement('input');
                    passwordInput.type = 'password';
                    passwordInput.id = 'pdfPassword';
                    passwordInput.className = 'pdf-password-input';
                    passwordInput.placeholder = 'Digite a senha para acessar';
                    passwordInput.autocomplete = 'off';
                    passwordInput.style.cssText = `
                        width: 100%;
                        padding: 0.8rem;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        margin: 1rem 0;
                        font-size: 1rem;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        position: static !important;
                    `;
                    
                    // Inserir no local correto (após o preview, antes dos botões)
                    const previewDiv = document.getElementById('pdfPreview');
                    const buttonContainer = modal.querySelector('div[style*="display: flex; gap: 1rem;"]');
                    
                    if (previewDiv && buttonContainer && previewDiv.parentNode === buttonContainer.parentNode) {
                        previewDiv.parentNode.insertBefore(passwordInput, buttonContainer);
                        SC.logModule('admin', 'Campo de senha inserido na posição correta');
                    } else {
                        // Fallback: inserir antes dos botões
                        const modalContent = document.querySelector('.pdf-modal-content');
                        if (modalContent) {
                            const buttons = modalContent.querySelectorAll('button');
                            if (buttons.length > 0) {
                                buttons[0].parentNode.insertBefore(passwordInput, buttons[0]);
                                SC.logModule('admin', 'Campo de senha inserido antes dos botões');
                            }
                        }
                    }
                } else {
                    // ✅ Tornar visível se existir mas estiver oculto
                    passwordInput.style.display = 'block';
                    passwordInput.style.visibility = 'visible';
                    passwordInput.style.opacity = '1';
                    passwordInput.style.position = 'static';
                    
                    // Remover qualquer display: none do pai
                    if (passwordInput.parentElement && passwordInput.parentElement.style.display === 'none') {
                        passwordInput.parentElement.style.display = 'block';
                    }
                }
                
                // ✅ 7. Resetar campo de senha
                passwordInput.value = '';
                
                // ✅ 8. Conectar evento de Enter para facilitar
                passwordInput.onkeydown = function(e) {
                    if (e.key === 'Enter') {
                        window.accessPdfDocuments();
                    }
                };
                
                // ✅ 9. Exibir modal
                modal.style.display = 'flex';
                
                // ✅ 10. Focar no campo de senha após breve delay
                setTimeout(() => {
                    if (passwordInput) {
                        passwordInput.focus();
                        passwordInput.select();
                        SC.logModule('admin', 'Modal PDF aberto com campo de senha visível e focado');
                        
                        // DEBUG: Verificar visibilidade
                        const style = window.getComputedStyle(passwordInput);
                        SC.logModule('admin', 'DEBUG Campo senha:', 'info');
                        SC.logModule('admin', `- display: ${style.display}`);
                        SC.logModule('admin', `- visibility: ${style.visibility}`);
                        SC.logModule('admin', `- opacity: ${style.opacity}`);
                        SC.logModule('admin', `- parentDisplay: ${passwordInput.parentElement ? 
                            window.getComputedStyle(passwordInput.parentElement).display : 'no parent'}`);
                    }
                }, 200);
            }

            // ✅ FUNÇÃO AUXILIAR PARA TESTE RÁPIDO
            window.testPdfModalFallback = function(testId = 101) {
                SC.logModule('admin', 'TESTE: Abrindo modal PDF via fallback...');
                openPdfModalDirectFallback(testId);
            };

            // ✅ VERIFICAÇÃO AUTOMÁTICA DO CAMPO DE SENHA
            function checkPdfPasswordField() {
                const passwordInput = document.getElementById('pdfPassword');
                if (!passwordInput) {
                    SC.logModule('admin', 'Campo de senha PDF não encontrado no DOM', 'warn');
                    return false;
                }
                
                const style = window.getComputedStyle(passwordInput);
                const isVisible = style.display !== 'none' && 
                                 style.visibility !== 'hidden' && 
                                 style.opacity !== '0';
                
                SC.logModule('admin', `Status campo senha: ${isVisible ? 'VISÍVEL ✅' : 'OCULTO ❌'}`, 'info');
                SC.logModule('admin', `- display: ${style.display}`, 'info');
                SC.logModule('admin', `- visibility: ${style.visibility}`, 'info');
                SC.logModule('admin', `- opacity: ${style.opacity}`, 'info');
                SC.logModule('admin', `- hasParent: ${!!passwordInput.parentElement}`, 'info');
                SC.logModule('admin', `- parentDisplay: ${passwordInput.parentElement ? 
                    window.getComputedStyle(passwordInput.parentElement).display : 'no parent'}`, 'info');
                
                return isVisible;
            }

            // Executar verificação após carregamento
            setTimeout(() => {
                SC.logModule('admin', 'Verificando integridade do campo de senha PDF...');
                checkPdfPasswordField();
            }, 3000);

            // ✅ ADICIONAR ESTA FUNÇÃO PARA TESTAR (opcional):
            window.testPdfModalDirect = function(propertyId) {
                SC.logModule('admin', 'TESTE DIRETO DO MODAL PDF');
                openPdfModalDirectFallback(propertyId || 101); // Testar com ID 101 ou fornecido
            };

            // ========== VERIFICAÇÃO DO SISTEMA PDF UNIFICADO ==========
            setTimeout(() => {
                SC.logModule('admin', 'VERIFICAÇÃO SISTEMA PDF UNIFICADO (pdf-unified.js):');
                
                // 1. VERIFICAR SE O ARQUIVO pdf-unified.js FOI CARREGADO
                const hasPdfUnified = Array.from(document.scripts).some(script => 
                    script.src && script.src.includes('pdf-unified.js')
                );
                
                SC.logModule('admin', `pdf-unified.js no HTML: ${hasPdfUnified ? '✅ Carregado' : '❌ Não encontrado'}`);
                
                // 2. VERIFICAR SE PdfSystem FOI CRIADO
                if (window.PdfSystem) {
                    SC.logModule('admin', '✅ PdfSystem disponível');
                    
                    // Verificar métodos CRÍTICOS
                    const criticalMethods = ['showModal', 'processAndSavePdfs', 'clearAllPdfs'];
                    SC.logModule('admin', 'Métodos críticos disponíveis:');
                    criticalMethods.forEach(method => {
                        SC.logModule('admin', `- ${method}: ${typeof window.PdfSystem[method] === 'function' ? '✅' : '❌'}`);
                    });
                } else {
                    SC.logModule('admin', '⚠️  PdfSystem NÃO disponível', 'warn');
                    SC.logModule('admin', 'Possíveis causas:');
                    SC.logModule('admin', '   1. pdf-unified.js não foi carregado corretamente');
                    SC.logModule('admin', '   2. Há erro de sintaxe em pdf-unified.js');
                    SC.logModule('admin', '   3. O arquivo não exporta window.PdfSystem');
                }
                
                // 3. VERIFICAR FUNÇÕES GLOBAIS QUE O admin.js USA
                SC.logModule('admin', 'Funções globais para admin.js:');
                const adminFunctions = [
                    'showPdfModal',
                    'accessPdfDocuments', 
                    'processAndSavePdfs',
                    'clearAllPdfs',
                    'loadExistingPdfsForEdit',
                    'getPdfsToSave',
                    'clearProcessedPdfs'
                ];
                
                adminFunctions.forEach(func => {
                    SC.logModule('admin', `- ${func}: ${typeof window[func] === 'function' ? '✅' : '❌'}`);
                });
                
                // 4. CONCLUSÃO
                const systemReady = window.PdfSystem && typeof window.PdfSystem.showModal === 'function';
                SC.logModule('admin', systemReady ? '🎉 Sistema PDF unificado PRONTO!' : '⚠️  Sistema PDF precisa de ajustes');
                
            }, 2000);

            // ========== FUNÇÃO accessPdfDocuments CORRIGIDA COM VISUALIZAÇÃO DE PDFs ==========
            window.accessPdfDocuments = function() {
                SC.logModule('admin', 'accessPdfDocuments chamada - VERSÃO CORRIGIDA COM VISUALIZAÇÃO');
                
                // 1. Obter elementos CRÍTICOS
                const passwordInput = document.getElementById('pdfPassword');
                const modalTitle = document.getElementById('pdfModalTitle');
                
                if (!passwordInput) {
                    SC.logModule('admin', 'Campo de senha PDF não encontrado!', 'error');
                    alert('Erro: sistema de documentos não está disponível. Recarregue a página.');
                    return;
                }
                
                // 2. Obter senha digitada
                const password = passwordInput.value.trim();
                
                if (!password) {
                    alert('Digite a senha para acessar os documentos!');
                    passwordInput.focus();
                    return;
                }
                
                // 3. Validar senha (senha fixa "doc123")
                if (password !== "doc123") {
                    alert('❌ Senha incorreta!\n\nA senha correta é: doc123\n(Solicite ao corretor se não souber)');
                    passwordInput.value = '';
                    passwordInput.focus();
                    return;
                }
                
                SC.logModule('admin', '✅ Senha válida! Buscando documentos...');
                
                // 4. Obter ID do imóvel
                let propertyId = null;
                
                // Tentar obter de múltiplas fontes
                if (window.currentPropertyId) {
                    propertyId = window.currentPropertyId;
                } else if (modalTitle && modalTitle.dataset.propertyId) {
                    propertyId = modalTitle.dataset.propertyId;
                } else {
                    // Tentar extrair do título
                    const titleText = modalTitle ? modalTitle.textContent : '';
                    const match = titleText.match(/ID[:\s]*(\d+)/i);
                    if (match) propertyId = match[1];
                }
                
                if (!propertyId) {
                    SC.logModule('admin', 'Não foi possível identificar o imóvel', 'error');
                    alert('⚠️ Não foi possível identificar o imóvel. Clique novamente no botão PDF.');
                    return;
                }
                
                // 5. Buscar imóvel
                const property = window.properties.find(p => p.id == propertyId);
                if (!property) {
                    alert('❌ Imóvel não encontrado!');
                    window.closePdfModal();
                    return;
                }
                
                // 6. Verificar se tem PDFs
                if (!property.pdfs || property.pdfs === 'EMPTY' || property.pdfs.trim() === '') {
                    alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
                    window.closePdfModal();
                    return;
                }
                
                // 7. Processar URLs dos PDFs
                const pdfUrls = property.pdfs.split(',')
                    .map(url => url.trim())
                    .filter(url => url && url !== 'EMPTY' && url !== '');
                
                if (pdfUrls.length === 0) {
                    alert('ℹ️ Nenhum documento PDF disponível.');
                    window.closePdfModal();
                    return;
                }
                
                SC.logModule('admin', `${pdfUrls.length} documento(s) encontrado(s) para imóvel ${propertyId}`);
                
                // 8. Fechar modal de senha
                window.closePdfModal();
                
                // 9. Mostrar lista de documentos COM OPÇÃO DE VISUALIZAÇÃO
                showPdfDocumentList(propertyId, property.title, pdfUrls);
            };

            // Função para mostrar a lista de documentos (ADICIONAR SE NÃO EXISTIR)
            function showPdfDocumentList(propertyId, propertyTitle, pdfUrls) {
                SC.logModule('admin', 'Mostrando lista de documentos PDF...');
                
                // Criar modal de seleção
                let selectionModal = document.getElementById('pdfDocumentListModal');
                
                if (!selectionModal) {
                    selectionModal = document.createElement('div');
                    selectionModal.id = 'pdfDocumentListModal';
                    selectionModal.className = 'pdf-modal';
                    selectionModal.style.cssText = `
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.95);
                        z-index: 10001;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    `;
                    
                    document.body.appendChild(selectionModal);
                }
                
                // Gerar lista de documentos com botões de ação
                const pdfListHtml = pdfUrls.map((url, index) => {
                    const fileName = url.split('/').pop() || `Documento ${index + 1}.pdf`;
                    const displayName = fileName.length > 40 ? 
                        fileName.substring(0, 37) + '...' : fileName;
                    
                    return `
                        <div class="pdf-document-item" style="
                            background: white;
                            border-radius: 10px;
                            padding: 1.2rem;
                            margin-bottom: 1rem;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            border-left: 5px solid var(--primary);
                        ">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-file-pdf" style="color: #e74c3c; font-size: 1.8rem;"></i>
                                    <div>
                                        <strong style="display: block; color: #2c3e50; font-size: 1.1rem;">
                                            ${displayName}
                                        </strong>
                                        <small style="color: #7f8c8d;">
                                            PDF • ${(index + 1)}/${pdfUrls.length} • Clique para visualizar
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="window.open('${url}', '_blank')" 
                                        style="
                                            background: var(--primary);
                                            color: white;
                                            border: none;
                                            padding: 0.7rem 1.5rem;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-weight: 600;
                                            display: flex;
                                            align-items: center;
                                            gap: 8px;
                                            transition: all 0.3s ease;
                                        "
                                        onmouseover="this.style.background='#154060'"
                                        onmouseout="this.style.background='var(--primary)'">
                                    <i class="fas fa-eye"></i> Visualizar
                                </button>
                                <button onclick="downloadPdfFile('${url}', '${fileName}')" 
                                        style="
                                            background: #27ae60;
                                            color: white;
                                            border: none;
                                            padding: 0.7rem 1.5rem;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-weight: 600;
                                            display: flex;
                                            align-items: center;
                                            gap: 8px;
                                            transition: all 0.3s ease;
                                        "
                                        onmouseover="this.style.background='#219653'"
                                        onmouseout="this.style.background='#27ae60'">
                                    <i class="fas fa-download"></i> Baixar
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                selectionModal.innerHTML = `
                    <div style="
                        background: white;
                        border-radius: 12px;
                        padding: 2rem;
                        max-width: 800px;
                        width: 95%;
                        max-height: 85vh;
                        overflow-y: auto;
                        position: relative;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    ">
                        <button onclick="closePdfDocumentList()" 
                                style="
                                    position: absolute;
                                    top: 15px;
                                    right: 15px;
                                    background: #e74c3c;
                                    color: white;
                                    border: none;
                                    border-radius: 50%;
                                    width: 35px;
                                    height: 35px;
                                    cursor: pointer;
                                    font-size: 1.2rem;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                            ×
                        </button>
                        
                        <h3 style="color: var(--primary); margin: 0 0 1.5rem 0; font-size: 1.5rem;">
                            <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                        </h3>
                        
                        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                            <p style="margin: 0; color: #2c3e50; font-weight: 600;">
                                <i class="fas fa-home"></i> ${propertyTitle}
                            </p>
                            <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">
                                <i class="fas fa-info-circle"></i> ${pdfUrls.length} documento(s) disponível(is)
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 2rem;">
                            ${pdfListHtml}
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid #eee;">
                            <small style="color: #95a5a6;">
                                <i class="fas fa-info-circle"></i> Os documentos abrem em nova aba para visualização
                            </small>
                            <button onclick="downloadAllPdfs(${JSON.stringify(pdfUrls)})" 
                                    style="
                                        background: var(--accent);
                                        color: white;
                                        border: none;
                                        padding: 0.8rem 1.8rem;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-weight: 600;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    ">
                                <i class="fas fa-download"></i> Baixar Todos
                            </button>
                        </div>
                    </div>
                `;
                
                selectionModal.style.display = 'flex';
                SC.logModule('admin', 'Lista de documentos PDF exibida');
            }

            // Função para fechar a lista de documentos
            window.closePdfDocumentList = function() {
                const modal = document.getElementById('pdfDocumentListModal');
                if (modal) {
                    modal.style.display = 'none';
                    modal.remove();
                    SC.logModule('admin', 'Lista de documentos fechada');
                }
            };

            // Função para download individual
            window.downloadPdfFile = function(url, fileName) {
                try {
                    const tempAnchor = document.createElement('a');
                    tempAnchor.href = url;
                    tempAnchor.download = fileName;
                    tempAnchor.style.display = 'none';
                    document.body.appendChild(tempAnchor);
                    tempAnchor.click();
                    document.body.removeChild(tempAnchor);
                    
                    SC.logModule('admin', `✅ Download iniciado: ${fileName}`);
                    return true;
                } catch (error) {
                    SC.logModule('admin', `❌ Erro ao baixar: ${error}`, 'error');
                    alert('Erro ao baixar o arquivo. Tente clicar em "Visualizar" e salvar manualmente.');
                    return false;
                }
            };

            // Manter a função downloadAllPdfs existente
            window.downloadAllPdfs = async function(urls) {
                SC.logModule('admin', `Iniciando download de ${urls.length} PDF(s)...`);
                
                let successCount = 0;
                
                for (const [index, url] of urls.entries()) {
                    try {
                        const fileName = url.split('/').pop() || `documento_${index + 1}.pdf`;
                        await new Promise(resolve => {
                            setTimeout(() => {
                                window.downloadPdfFile(url, fileName);
                                successCount++;
                                resolve();
                            }, index * 300); // Pequeno delay entre downloads
                        });
                    } catch (error) {
                        SC.logModule('admin', `Erro ao baixar ${url}: ${error}`, 'error');
                    }
                }
                
                if (successCount > 0) {
                    alert(`✅ ${successCount} documento(s) enviado(s) para download!\n\nVerifique a barra de downloads do seu navegador.`);
                }
            };

            // ✅ FUNÇÃO AUXILIAR PARA RECRIAR CAMPO DE SENHA SE NECESSÁRIO
            function recreatePdfPasswordField() {
                SC.logModule('admin', 'Recriando campo de senha PDF...');
                
                const modal = document.getElementById('pdfModal');
                if (!modal) return;
                
                // Verificar se já existe o input
                let passwordInput = document.getElementById('pdfPassword');
                if (!passwordInput) {
                    // Criar novo input
                    passwordInput = document.createElement('input');
                    passwordInput.type = 'password';
                    passwordInput.id = 'pdfPassword';
                    passwordInput.className = 'pdf-password-input';
                    passwordInput.placeholder = 'Digite a senha para acessar';
                    passwordInput.style.cssText = `
                        width: 100%;
                        padding: 0.8rem;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        margin: 1rem 0;
                        font-size: 1rem;
                    `;
                    
                    // Inserir no local correto
                    const previewDiv = document.getElementById('pdfPreview');
                    if (previewDiv && previewDiv.parentNode) {
                        previewDiv.parentNode.insertBefore(passwordInput, previewDiv.nextSibling);
                        SC.logModule('admin', 'Campo de senha recriado');
                    }
                }
            }

            // ✅ 8. FUNÇÃO PARA FECHAR MODAL DE SELEÇÃO
            window.closePdfSelectionModal = function() {
                const modal = document.getElementById('pdfSelectionModal');
                if (modal) {
                    modal.style.display = 'none';
                    modal.remove(); // Remove completamente do DOM
                    SC.logModule('admin', 'Modal de seleção de PDFs fechado');
                }
            };

            // ✅ FUNÇÃO DE TESTE DIRETO (adicionar após accessPdfDocuments)
            window.testPdfAccessDirect = function(propertyId) {
                SC.logModule('admin', 'TESTE DIRETO DE ACESSO A PDFs');
                
                if (!propertyId) {
                    propertyId = window.currentPropertyId || 101; // Usar ID 101 como teste
                }
                
                const property = window.properties.find(p => p.id == propertyId);
                if (!property) {
                    alert('Imóvel de teste não encontrado');
                    return;
                }
                
                SC.logModule('admin', `Imóvel ${propertyId}: "${property.title}"`);
                SC.logModule('admin', `PDFs: ${property.pdfs || 'Nenhum'}`);
                
                // Abrir PDFs diretamente (pular validação de senha)
                if (property.pdfs && property.pdfs !== 'EMPTY') {
                    const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
                    pdfUrls.forEach(url => {
                        SC.logModule('admin', `Abrindo: ${url.substring(0, 80)}...`);
                        window.open(url, '_blank');
                    });
                    alert(`✅ ${pdfUrls.length} PDF(s) aberto(s) diretamente!`);
                } else {
                    alert('ℹ️ Imóvel de teste não tem PDFs');
                }
            };

            // ✅ FUNÇÃO PARA CRIAR MODAL PDF SE NÃO EXISTIR
            window.ensurePdfModalExists = function(forceComplete = false) {
                let modal = document.getElementById('pdfModal');
                
                if (!modal || forceComplete) {
                    SC.logModule('admin', 'Criando/Atualizando modal PDF completo...');
                    
                    // Remover modal existente se incompleto
                    if (modal && forceComplete) {
                        modal.remove();
                        modal = null;
                    }
                    
                    if (!modal) {
                        modal = document.createElement('div');
                        modal.id = 'pdfModal';
                        modal.className = 'pdf-modal';
                        modal.style.cssText = `
                            display: none;
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0,0,0,0.9);
                            z-index: 10000;
                            align-items: center;
                            justify-content: center;
                        `;
                        
                        // ✅ HTML COMPLETO com TODOS os elementos necessários
                        modal.innerHTML = `
                            <div class="pdf-modal-content" style="background: white; border-radius: 10px; padding: 2rem; max-width: 400px; width: 90%; text-align: center;">
                                <h3 id="pdfModalTitle" style="color: var(--primary); margin: 0 0 1rem 0;">
                                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                                </h3>
                                <div id="pdfPreview" class="pdf-preview" style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 5px;">
                                    <p>Documentos técnicos e legais disponíveis</p>
                                </div>
                                <!-- ✅ CAMPO DE SENHA SEMPRE PRESENTE -->
                                <input type="password" id="pdfPassword" class="pdf-password-input" 
                                       placeholder="Digite a senha para acessar" 
                                       style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 5px; margin: 1rem 0; display: block;">
                                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                    <button onclick="accessPdfDocuments()" 
                                            style="background: var(--primary); color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 5px; cursor: pointer; flex: 1;">
                                        <i class="fas fa-lock-open"></i> Acessar
                                    </button>
                                    <button onclick="closePdfModal()" 
                                            style="background: #95a5a6; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 5px; cursor: pointer;">
                                        <i class="fas fa-times"></i> Fechar
                                    </button>
                                </div>
                                <p style="font-size: 0.8rem; color: #666; margin-top: 1rem;">
                                    <i class="fas fa-info-circle"></i> Solicite a senha ao corretor
                                </p>
                            </div>
                        `;
                        
                        document.body.appendChild(modal);
                        SC.logModule('admin', 'Modal PDF completo criado');
                    }
                }
                
                return modal;
            };

            // Verificação automática na inicialização
            setTimeout(() => {
                if (!document.getElementById('pdfModal')) {
                    SC.logModule('admin', 'Modal PDF não encontrado. Criando automaticamente...', 'warn');
                    window.ensurePdfModalExists();
                }
            }, 1000);

            window.closePdfModal = function() {
                const modal = document.getElementById('pdfModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            };

            // ========== BOTÃO DE EMERGÊNCIA ==========
            setTimeout(() => {
                if (!document.getElementById('emergency-admin-btn')) {
                    const emergencyBtn = document.createElement('button');
                    emergencyBtn.id = 'emergency-admin-btn';
                    emergencyBtn.innerHTML = '🔧 ADMIN';
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
                        z-index: 9999;
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
                    SC.logModule('admin', 'Botão de emergência criado');
                }
            }, 3000);

            // ========== BOTÃO DE TESTE DE MÍDIA ==========
            setTimeout(() => {
                if (!document.getElementById('media-test-btn')) {
                    const testBtn = document.createElement('button');
                    testBtn.id = 'media-test-btn';
                    testBtn.innerHTML = '🖼️ TEST UPLOAD';
                    testBtn.style.cssText = `
                        position: fixed;
                        top: 100px;
                        right: 10px;
                        background: #9b59b6;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        cursor: pointer;
                        z-index: 9999;
                        font-weight: bold;
                        font-size: 0.8rem;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    `;
                    
                    testBtn.onclick = function() {
                        SC.logModule('admin', 'TESTE COMPLETO DO SISTEMA DE MÍDIA', 'info');
                        
                        // 1. Testar conexão básica
                        SC.logModule('admin', '1️⃣ Testando conexão entre módulos...');
                        SC.logModule('admin', `- handleNewMediaFiles: ${typeof window.handleNewMediaFiles}`);
                        SC.logModule('admin', `- updateMediaPreview: ${typeof window.updateMediaPreview}`);
                        
                        // 2. Testar com arquivo simulado
                        if (typeof window.handleNewMediaFiles === 'function') {
                            SC.logModule('admin', '2️⃣ Simulando upload de arquivo...');
                            
                            // Criar arquivo de teste em memória
                            const blob = new Blob(['dummy image data'], { type: 'image/jpeg' });
                            const testFile = new File([blob], 'test_foto.jpg', { 
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            
                            // Chamar função diretamente
                            const fileList = {
                                0: testFile,
                                length: 1,
                                item: (index) => index === 0 ? testFile : null
                            };
                            
                            window.handleNewMediaFiles(fileList);
                            SC.logModule('admin', 'Arquivo de teste enviado para processamento');
                        } else {
                            SC.logModule('admin', 'handleNewMediaFiles não disponível!', 'error');
                        }
                        
                        // 3. Verificar preview
                        setTimeout(() => {
                            SC.logModule('admin', '3️⃣ Verificando preview...');
                            const preview = document.getElementById('uploadPreview');
                            if (preview) {
                                SC.logModule('admin', '✅ Preview container encontrado');
                                SC.logModule('admin', `📸 Conteúdo: ${preview.innerHTML.length} caracteres`);
                                
                                if (preview.innerHTML.includes('test_foto')) {
                                    SC.logModule('admin', '🎉 ARQUIVO DE TESTE APARECE NO PREVIEW!');
                                    alert('✅ SISTEMA FUNCIONANDO!\n\nArquivo de teste apareceu no preview.');
                               } else {
                                    SC.logModule('admin', '⚠️ Preview não mostra arquivo de teste', 'warn');
                                    SC.logModule('admin', `🔍 HTML do preview: ${preview.innerHTML.substring(0, 200)}`);
                                }
                            } else {
                                SC.logModule('admin', '❌ Preview container NÃO encontrado!', 'error');
                            }
                        }, 500);
                    };
                    
                    document.body.appendChild(testBtn);
                    SC.logModule('admin', 'Botão de teste de mídia criado');
                }
            }, 2000);

            // ========== SOLUÇÃO FINAL - OBSERVADOR DE FILTROS ==========
            (function startFilterObserver() {
                SC.logModule('admin', 'Iniciando observador de filtros...');
                
                // Observar quando os filtros forem clicados
                document.addEventListener('click', function(e) {
                    const clickedFilter = e.target.closest('.filter-btn');
                    if (clickedFilter) {
                        SC.logModule('admin', `Filtro clicado via observer: ${clickedFilter.textContent.trim()}`);
                        
                        // Forçar remoção de 'active' de todos (SEM ESTILO INLINE)
                        document.querySelectorAll('.filter-btn').forEach(btn => {
                            if (btn !== clickedFilter) {
                                btn.classList.remove('active');
                            }
                        });
                        
                        // Forçar adição de 'active' ao clicado (SEM ESTILO INLINE)
                        clickedFilter.classList.add('active');
                        
                        // Executar filtro
                        const filter = clickedFilter.textContent.trim() === 'Todos' ? 'todos' : clickedFilter.textContent.trim();
                        if (window.renderProperties) {
                            window.renderProperties(filter);
                        }
                    }
                });
                
                SC.logModule('admin', 'Observador de filtros ativo');
            })();

            // Limpar PDFs processados após salvamento
            window.clearProcessedPdfs = function() {
                SC.logModule('admin', 'Limpando PDFs processados...');
                
                // Manter apenas PDFs NÃO processados
                window.selectedPdfFiles = window.selectedPdfFiles.filter(pdf => !pdf.processed);
                
                SC.logModule('admin', `Após limpeza: ${window.selectedPdfFiles.length} PDF(s) não processados`);
                
                // Atualizar preview
                if (typeof window.updatePdfPreview === 'function') {
                    window.updatePdfPreview();
                }
            };

            // ========== VERIFICAÇÃO DE FORMULÁRIO VAZIO (MANTER - É ESSENCIAL) ==========
            window.isAdminFormEmpty = function() {
                const checks = {
                    titulo: !document.getElementById('propTitle').value.trim(),
                    preco: !document.getElementById('propPrice').value.trim(),
                    localizacao: !document.getElementById('propLocation').value.trim(),
                    descricao: !document.getElementById('propDescription').value.trim(),
                    temMidia: !window.selectedMediaFiles || window.selectedMediaFiles.length === 0,
                    temPdfs: !window.selectedPdfFiles || window.selectedPdfFiles.length === 0
                };
                
                const isEditing = window.editingPropertyId !== null;
                const isTrulyEmpty = checks.titulo && checks.preco && checks.localizacao && 
                                    checks.temMidia && checks.temPdfs && !isEditing;
                
                return {
                    isEmpty: isTrulyEmpty,
                    isEditing: isEditing,
                    checks: checks
                };
            };

            // ========== ADICIONAR VERIFICAÇÃO AO CARREGAR O FORMULÁRIO ==========
            document.addEventListener('DOMContentLoaded', function() {
                // Verificar se o formulário está sujo ao carregar
                setTimeout(() => {
                    const hasTitle = document.getElementById('propTitle')?.value.trim();
                    const hasPrice = document.getElementById('propPrice')?.value.trim();
                    const hasLocation = document.getElementById('propLocation')?.value.trim();
                    
                    if ((hasTitle || hasPrice || hasLocation) && !window.editingPropertyId) {
                        SC.logModule('admin', 'Formulário carregado com dados! Limpando automaticamente...', 'warn');
                        window.forceFormCleanup();
                    }
                }, 500);
            });

            // Verificação automática ao carregar formulário
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    const formState = window.isAdminFormEmpty();
                    SC.logModule('admin', `Estado inicial do formulário: ${JSON.stringify(formState)}`);
                    
                    // Se não está vazio, limpar
                    if (!formState.isEmpty && !formState.isEditing) {
                        SC.logModule('admin', 'Formulário não estava vazio inicialmente. Limpando...', 'warn');
                        window.resetAdminFormToInitialState();
                    }
                }, 1500);
            });

            // CORREÇÃO DEFINITIVA: Ocultar botão de teste de upload
            function hideMediaTestButtonPermanently() {
                SC.logModule('admin', 'Ocultando botão de teste de mídia definitivamente...');
                
                // Método 1: Remover completamente o elemento
                const testBtn = document.getElementById('media-test-btn');
                if (testBtn) {
                    testBtn.remove();
                    SC.logModule('admin', 'Botão de teste REMOVIDO completamente');
                    return;
                }
                
                // Método 2: Se não encontrado, criar observer para quando aparecer
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.id === 'media-test-btn' || 
                                (node.querySelector && node.querySelector('#media-test-btn'))) {
                                const btn = document.getElementById('media-test-btn');
                                if (btn) {
                                    btn.remove();
                                    SC.logModule('admin', 'Botão de teste detectado e removido via observer');
                                    observer.disconnect();
                                }
                            }
                        });
                    });
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
                
                // Método 3: Verificar periodicamente por 10 segundos
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    const btn = document.getElementById('media-test-btn');
                    if (btn) {
                        btn.style.display = 'none';
                        btn.style.visibility = 'hidden';
                        btn.style.opacity = '0';
                        btn.style.position = 'absolute';
                        btn.style.left = '-9999px';
                        SC.logModule('admin', 'Botão de teste ocultado via fallback');
                        clearInterval(checkInterval);
                    }
                    if (attempts > 20) { // 10 segundos (20 * 500ms)
                        clearInterval(checkInterval);
                        SC.logModule('admin', 'Botão de teste não encontrado após 10s', 'warn');
                    }
                }, 500);
            }

            // Executar imediatamente e após DOM carregado
            setTimeout(hideMediaTestButtonPermanently, 100);
            document.addEventListener('DOMContentLoaded', hideMediaTestButtonPermanently);

            // Em js/modules/admin.js - ADICIONAR NO FINAL DO ARQUIVO (antes do último console.log)
            // Ocultar botão de teste de mídia
            setTimeout(() => {
                const testBtn = document.getElementById('media-test-btn');
                if (testBtn) {
                    testBtn.style.display = 'none';
                    SC.logModule('admin', 'Botão de teste de mídia ocultado');
                }
                
                // Ocultar botão de emergência (opcional - mantém funcionalidade mas esconde)
                const emergencyBtn = document.getElementById('emergency-admin-btn');
                if (emergencyBtn) {
                    emergencyBtn.style.display = 'none';
                    SC.logModule('admin', 'Botão de emergência ocultado');
                }
            }, 3000);

            // NO FINAL DO admin.js - ADICIONAR verificação de integridade
            setTimeout(() => {
                SC.logModule('admin', 'VERIFICAÇÃO DE INTEGRIDADE DO SISTEMA PDF');
                
                // Verificar se elementos críticos existem
                const criticalElements = [
                    { id: 'pdfModal', desc: 'Modal principal' },
                    { id: 'pdfPassword', desc: 'Campo de senha' },
                    { id: 'pdfModalTitle', desc: 'Título do modal' }
                ];
                
                let allExist = true;
                criticalElements.forEach(el => {
                    const exists = document.getElementById(el.id);
                    SC.logModule('admin', `${exists ? '✅' : '❌'} ${el.desc}: ${exists ? 'OK' : 'FALTANDO'}`);
                    if (!exists) allExist = false;
                });
                
                if (!allExist) {
                    SC.logModule('admin', 'Elementos PDF faltando. Recriando sistema...', 'warn');
                    window.ensurePdfModalExists(true);
                }
                
                // Teste funcional (apenas em debug)
                if (window.location.search.includes('debug=true')) {
                    SC.logModule('admin', 'Teste funcional do sistema PDF disponível');
                    SC.logModule('admin', '💡 Use: testPdfAccessDirect(101) para testar com imóvel ID 101');
                }
            }, 3000);

            SC.logModule('admin', 'pronto e funcional');

            // 🔧 PATCH TEMPORÁRIO: Corrigir checkbox "Tem vídeo" na edição
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    const videoCheckbox = document.getElementById('propHasVideo');
                    if (videoCheckbox) {
                        // Garantir que o evento change funcione
                        videoCheckbox.addEventListener('change', function() {
                            SC.logModule('admin', `Checkbox "Tem vídeo" alterado: ${this.checked}`);
                        });
                    }
                }, 1000);
            });

            // ========== ADICIONAR ESTILOS CSS PARA O LOADING ==========
            document.addEventListener('DOMContentLoaded', function() {
                // Estilos já foram adicionados no createOverlay, mas adicionamos extras aqui
                const extraStyles = document.createElement('style');
                extraStyles.textContent = `
                    /* Melhorar botão de submit durante processamento */
                    #propertyForm button[type="submit"]:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                        position: relative;
                    }
                    
                    #propertyForm button[type="submit"]:disabled::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                        animation: shimmer 1.5s infinite;
                    }
                    
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    
                    /* Feedback visual durante upload */
                    .uploading-file {
                        opacity: 0.7;
                        position: relative;
                    }
                    
                    .uploading-file::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.2), transparent);
                        animation: file-uploading 2s infinite;
                        z-index: 1;
                    }
                    
                    @keyframes file-uploading {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    
                    /* Animações para o loading */
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .loading-enter {
                        animation: fadeIn 0.3s ease forwards;
                    }
                    
                    /* Estilo para botões durante processamento */
                    .processing {
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .processing::after {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: linear-gradient(
                            to right,
                            rgba(255, 255, 255, 0) 0%,
                            rgba(255, 255, 255, 0.3) 50%,
                            rgba(255, 255, 255, 0) 100%
                        );
                        transform: rotate(30deg);
                        animation: processing-shimmer 2s infinite;
                    }
                    
                    @keyframes processing-shimmer {
                        0% { transform: translateX(-100%) rotate(30deg); }
                        100% { transform: translateX(100%) rotate(30deg); }
                    }
                `;
                document.head.appendChild(extraStyles);
                
                SC.logModule('admin', 'Estilos de loading visual aplicados');
            });

            SC.logModule('admin', 'Sistema de loading visual adicionado ao admin.js');

            // ========== ADICIONAR INTEGRAÇÃO COMPLETA COM PDFSYSTEM ==========
            // ✅ VERIFICAÇÃO DE INICIALIZAÇÃO DO PdfSystem
            setTimeout(() => {
                SC.logModule('admin', '🔍 Verificando integração com PdfSystem...');
                
                if (window.PdfSystem && typeof window.PdfSystem.init === 'function') {
                    try {
                        // window.PdfSystem.init('vendas'); // COMENTADO: Removida auto-execução
                        SC.logModule('admin', '✅ PdfSystem disponível (inicialização comentada)');
                    } catch (error) {
                        SC.logModule('admin', `⚠️ PdfSystem já inicializado ou erro: ${error.message}`);
                    }
                }
                
                // Garantir que showPdfModal está disponível globalmente
                if (!window.showPdfModal && window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
                    window.showPdfModal = function(propertyId) {
                        return window.PdfSystem.showModal(propertyId);
                    };
                    SC.logModule('admin', '✅ showPdfModal configurado via PdfSystem');
                }
                
                // Verificar se a função handlePdfButtonClick existe para galeria
                if (!window.handlePdfButtonClick && typeof window.showPdfModal === 'function') {
                    window.handlePdfButtonClick = function(event, propertyId) {
                        if (event) {
                            event.stopPropagation();
                            event.preventDefault();
                        }
                        window.showPdfModal(propertyId);
                    };
                    SC.logModule('admin', '✅ handlePdfButtonClick configurado para galeria');
                }
            }, 1500);

            // ✅ EXPORT DE FUNÇÕES ESSENCIAIS PARA GALLERY.JS
            // Garantir que as funções que a galeria precisa estão disponíveis
            if (typeof window.ensurePdfModalExists !== 'function') {
                window.ensurePdfModalExists = function(forceComplete = false) {
                    // Criar modal básico se não existir
                    let modal = document.getElementById('pdfModal');
                    if (!modal) {
                        modal = document.createElement('div');
                        modal.id = 'pdfModal';
                        modal.className = 'pdf-modal';
                        modal.style.cssText = `
                            display: none;
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0,0,0,0.9);
                            z-index: 10000;
                            align-items: center;
                            justify-content: center;
                        `;
                        
                        modal.innerHTML = `
                            <div class="pdf-modal-content" style="background: white; border-radius: 10px; padding: 2rem; max-width: 400px; width: 90%; text-align: center;">
                                <h3 id="pdfModalTitle" style="color: var(--primary); margin: 0 0 1rem 0;">
                                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                                </h3>
                                <input type="password" id="pdfPassword" placeholder="Digite a senha para acessar" 
                                       style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 5px; margin: 1rem 0;">
                                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                    <button onclick="accessPdfDocuments()" 
                                            style="background: var(--primary); color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 5px; cursor: pointer; flex: 1;">
                                        <i class="fas fa-lock-open"></i> Acessar
                                    </button>
                                    <button onclick="closePdfModal()" 
                                            style="background: #95a5a6; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 5px; cursor: pointer;">
                                        <i class="fas fa-times"></i> Fechar
                                    </button>
                                </div>
                            </div>
                        `;
                        
                        document.body.appendChild(modal);
                    }
                    return modal;
                };
            }

            // ✅ FUNÇÃO DE FALLBACK ULTIMATE SE NENHUM SISTEMA PDF FUNCIONAR
            if (!window.showPdfModal) {
                window.showPdfModal = function(propertyId) {
                    SC.logModule('admin', '📄 showPdfModal (FALLBACK ULTIMATE) chamado');
                    
                    // Buscar imóvel
                    const property = window.properties?.find(p => p.id == propertyId);
                    if (!property) {
                        alert('❌ Imóvel não encontrado!');
                        return;
                    }
                    
                    if (!property.pdfs || property.pdfs === 'EMPTY') {
                        alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
                        return;
                    }
                    
                    const password = prompt("🔒 Documentos do Imóvel\n\nDigite a senha para acessar os documentos:");
                    if (password === "doc123") {
                        const pdfUrls = property.pdfs.split(',')
                            .map(url => url.trim())
                            .filter(url => url && url !== 'EMPTY');
                        
                        if (pdfUrls.length > 0) {
                            window.open(pdfUrls[0], '_blank');
                        }
                    } else if (password !== null) {
                        alert('❌ Senha incorreta! A senha é: doc123');
                    }
                };
                SC.logModule('admin', '✅ showPdfModal (fallback ultimate) criado');
            }

            // ✅ TESTE DE INTEGRAÇÃO APÓS 3 SEGUNDOS
            setTimeout(() => {
                SC.logModule('admin', '🧪 TESTE DE INTEGRAÇÃO DO SISTEMA COMPLETO');
                SC.logModule('admin', `- MediaSystem: ${window.MediaSystem ? '✅ Disponível' : '❌ Ausente'}`);
                SC.logModule('admin', `- PdfSystem: ${window.PdfSystem ? '✅ Disponível' : '❌ Ausente'}`);
                SC.logModule('admin', `- showPdfModal: ${typeof window.showPdfModal === 'function' ? '✅ Funcional' : '❌ Falha'}`);
                
                // Se tiver um imóvel para testar
                if (window.properties && window.properties.length > 0) {
                    const testProperty = window.properties[0];
                    SC.logModule('admin', `📊 Imóvel de teste disponível: ID ${testProperty.id} - "${testProperty.title}"`);
                    SC.logModule('admin', `📄 PDFs: ${testProperty.pdfs && testProperty.pdfs !== 'EMPTY' ? '✅ Disponível' : '❌ Sem PDFs'}`);
                    
                    // Teste de funcionalidade
                    if (testProperty.pdfs && testProperty.pdfs !== 'EMPTY' && 
                        typeof window.showPdfModal === 'function') {
                        SC.logModule('admin', '🧪 Sistema PDF pronto para uso na galeria!');
                    }
                }
            }, 3000);

            SC.logModule('admin', '✅ Sistema admin completamente integrado com MediaSystem e PdfSystem');
            
        } catch (error) {
            console.error('❌ ERRO NO admin.js:', error.message);
            console.error('💡 Verifique a ordem de carregamento dos scripts');
        }
        
    })(); // ← FECHAMENTO DA FUNÇÃO AUTOEXECUTÁVEL
