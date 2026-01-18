// js/modules/admin.js - SISTEMA ADMIN CORRETO E FUNCIONAL
console.log('🔧 admin.js carregado - Sistema Administrativo');

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
    console.log('📄 handleNewPdfFiles chamada - Delegando APENAS para MediaSystem');
    
    if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
        return MediaSystem.addPdfs(files);
    }
    
    console.warn('⚠️ MediaSystem não disponível para PDFs');
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
    console.log(`📄 processAndSavePdfs REDIRECIONADO para MediaSystem: ${propertyId}`);
    
    // DELEGAR 100% PARA MEDIASYSTEM
    if (window.MediaSystem && typeof window.MediaSystem.processAndSavePdfs === 'function') {
        try {
            const result = await window.MediaSystem.processAndSavePdfs(propertyId, propertyTitle);
            console.log(`✅ MediaSystem processou PDFs: ${result ? 'Sucesso' : 'Vazio'}`);
            return result || '';
        } catch (error) {
            console.error('❌ Erro no MediaSystem:', error);
        }
    }
    
    // Fallback
    console.warn('⚠️ Usando fallback vazio');
    return '';
};

window.clearAllPdfs = function() {
    console.log('🧹 admin.js: clearAllPdfs chamado');
    
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
    
    console.log('✅ PDFs limpos em todos os sistemas');
};

window.loadExistingPdfsForEdit = function(property) {
    console.log('📄 admin.js: loadExistingPdfsForEdit chamado');
    
    // PRIORIDADE 1: PdfSystem
    if (window.PdfSystem && typeof window.PdfSystem.loadExistingPdfsForEdit === 'function') {
        return window.PdfSystem.loadExistingPdfsForEdit(property);
    }
    
    // PRIORIDADE 2: MediaSystem
    if (window.MediaSystem && typeof window.MediaSystem.loadExistingPdfsForEdit === 'function') {
        return window.MediaSystem.loadExistingPdfsForEdit(property);
    }
    
    console.warn('⚠️  Nenhum sistema PDF disponível para carregar existentes');
};

window.getPdfsToSave = async function(propertyId) {
    console.log(`💾 admin.js: getPdfsToSave chamado para ${propertyId}`);
    
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

// ========== VARIÁVEIS GLOBAIS ==========
window.editingPropertyId = null;

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
window.toggleAdminPanel = function() {
    console.log('🔄 toggleAdminPanel() executada');
    
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
    
    if (password === null) {
        console.log('❌ Usuário cancelou o acesso');
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
            
            console.log(`✅ Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                    console.log('📜 Rolando até o painel admin');
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
// NOVO: FUNÇÃO UNIFICADA DE LIMPEZA
window.cleanAdminForm = function(mode = 'cancel') {
    console.group(`🧹 [admin.js] Limpeza de formulário (${mode})`);
    
    // 1. RESETAR CAMPOS DO FORMULÁRIO (15 linhas)
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset();
        console.log('✅ Campos do formulário resetados');
    }
    
    // 2. LIMPAR SISTEMA DE MÍDIA (5 linhas)
    if (window.MediaSystem) {
        MediaSystem.resetState();
        console.log('✅ Sistema de mídia limpo');
    }
    
    // 3. LIMPAR SISTEMA DE PDFs (5 linhas)
    if (typeof window.clearAllPdfs === 'function') {
        window.clearAllPdfs();
        console.log('✅ PDFs limpos');
    }
    
    // 4. RESETAR ESTADO DE EDIÇÃO (3 linhas)
    window.editingPropertyId = null;
    console.log('✅ Estado de edição resetado');
    
    // 5. ATUALIZAR UI (7 linhas)
    const formTitle = document.getElementById('formTitle');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    
    if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
        cancelBtn.disabled = false; // GARANTIR estado ativo para próxima vez
    }
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
        submitBtn.style.background = 'var(--primary)';
    }
    
    console.groupEnd();
    return true;
};

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

// ========== FUNÇÃO editProperty ATUALIZADA COM SUPORTE A MÍDIA, SCROLL E FORMATAÇÃO DE PREÇO ==========
window.editProperty = function(id) {
    console.log(`📝 EDITANDO IMÓVEL ${id} (MediaSystem unificado ativo)`);

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
        console.warn('⚠️ MediaSystem não disponível');
    }

    // ==============================
    // 2️⃣ PREENCHER FORMULÁRIO COM PREÇO FORMATADO
    // ==============================
    document.getElementById('propTitle').value = property.title || '';
    
    // ⭐⭐ FORMATAR PREÇO COM "R$" SEM VÍRGULA/CENTAVOS ⭐⭐
    const priceField = document.getElementById('propPrice');
    if (priceField && property.price) {
        // Se já começa com R$, usa como está
        if (property.price.startsWith('R$')) {
            priceField.value = property.price;
        } else {
            // Formata o preço usando SharedCore
            if (window.SharedCore && typeof window.SharedCore.formatPriceForInput === 'function') {
                priceField.value = window.SharedCore.formatPriceForInput(property.price) || '';
            } else {
                // Fallback local
                console.warn('⚠️ SharedCore não disponível, usando fallback local');
                priceField.value = formatPriceForInputFallback(property.price) || '';
            }
        }
    }
    
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
        cancelBtn.disabled = false; // GARANTIR que não está desabilitado
        cancelBtn.style.opacity = '1';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.pointerEvents = 'auto';
    }

    // Marcar modo edição
    window.editingPropertyId = property.id;

    // ==============================
    // 3️⃣ CARREGAR MÍDIA EXISTENTE
    // ==============================
    if (window.MediaSystem) {
        MediaSystem.loadExisting(property);
        console.log('🖼️ Mídia existente carregada no MediaSystem');
    }

    // ==============================
    // ⭐⭐ 4️⃣ ROLAR ATÉ O FORMULÁRIO COM COMPORTAMENTO CORRIGIDO ⭐⭐
    // ==============================
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        const propertyForm = document.getElementById('propertyForm');
        
        // Primeiro garantir que o painel admin está visível
        if (adminPanel && adminPanel.style.display !== 'block') {
            adminPanel.style.display = 'block';
            console.log('✅ Painel admin aberto automaticamente');
        }
        
        // Agora rolar suavemente até o formulário SEM SELECIONAR TEXTO
        if (propertyForm) {
            console.log('📜 Rolando até o formulário de edição...');
            
            // Método 1: Usar scrollIntoView com comportamento suave
            propertyForm.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start', // Alinha ao topo
                inline: 'nearest'
            });
            
            // Método 2: Destacar visualmente o formulário (sem selecionar texto)
            propertyForm.style.transition = 'all 0.3s ease';
            propertyForm.style.boxShadow = '0 0 0 3px var(--accent)';
            
            // Remover destaque após 2 segundos
            setTimeout(() => {
                propertyForm.style.boxShadow = '';
            }, 2000);
            
            console.log('✅ Formulário em foco para edição');
            
            // ⭐⭐ CRÍTICO: Focar no campo título SEM SELECIONAR o texto ⭐⭐
            setTimeout(() => {
                const titleField = document.getElementById('propTitle');
                if (titleField) {
                    // Focar no campo mas NÃO selecionar o texto
                    titleField.focus();
                    
                    // ⭐⭐ SOLUÇÃO: Posicionar cursor no FINAL do texto em vez de selecionar tudo ⭐⭐
                    // Isso previne a exclusão acidental
                    const textLength = titleField.value.length;
                    titleField.setSelectionRange(textLength, textLength);
                    
                    console.log('🎯 Foco no campo título (cursor posicionado no final)');
                }
            }, 700); // Aumentar delay para garantir que o scroll terminou
        } else {
            console.warn('⚠️ Formulário não encontrado para scroll');
            // Fallback: rolar até o painel admin
            if (adminPanel) {
                adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, 100); // Pequeno delay para garantir que o DOM foi atualizado

    console.log(`✅ Imóvel ${id} pronto para edição`);
    return true;
};

// Função de fallback local (mantida para compatibilidade)
function formatPriceForInputFallback(value) {
    if (!value) return '';
    
    // Remove tudo que não for número
    let numbersOnly = value.toString().replace(/\D/g, '');
    
    // Se não tem números, retorna vazio
    if (numbersOnly === '') return '';
    
    // Converte para número inteiro
    let priceNumber = parseInt(numbersOnly);
    
    // Formata como "R$ X.XXX" (sem centavos)
    let formatted = 'R$ ' + priceNumber.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return formatted;
}

// ========== CONFIGURAÇÃO DO FORMULÁRIO ATUALIZADA COM SISTEMA DE LOADING E FORMATAÇÃO DE PREÇO ==========
window.setupForm = function() {
    console.log('📝 Configurando formulário admin com sistema de mídia integrado...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('❌ Formulário propertyForm não encontrado!');
        return;
    }
    
    // REMOVER event listeners antigos para evitar duplicação
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const freshForm = document.getElementById('propertyForm');
    
    // ⭐⭐ CONFIGURAR FORMATAÇÃO AUTOMÁTICA DE PREÇO ⭐⭐
    // Usando função do SharedCore com fallback
    if (window.SharedCore && typeof window.SharedCore.setupPriceAutoFormat === 'function') {
        window.SharedCore.setupPriceAutoFormat();
        console.log('✅ Formatação de preço configurada via SharedCore');
    } else {
        console.warn('⚠️ SharedCore não disponível, usando fallback local');
        setupPriceAutoFormatFallback();
    }
    
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
        console.group('🚀 SUBMISSÃO DO FORMULÁRIO ADMIN');
        
        // 1. INICIAR LOADING (USANDO MÓDULO EXTERNO LoadingManager)
        if (!window.LoadingManager || typeof window.LoadingManager.show !== 'function') {
            console.error('❌ LoadingManager não disponível! Usando fallback simples...');
            alert('⚠️ Sistema temporariamente indisponível. Recarregue a página.');
            return;
        }
        
        const loading = window.LoadingManager.show(
            'Salvando Imóvel...', 
            'Por favor, aguarde enquanto processamos todos os dados.',
            { variant: 'processing' }
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
            
            console.log('📋 Dados coletados:', propertyData);
            
            // 3. VALIDAÇÃO BÁSICA
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                loading.setVariant('error');
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
                console.error('❌ Validação falhou: campos obrigatórios vazios');
                console.groupEnd();
                return;
            }
            
            loading.updateMessage('Validação aprovada, processando...');
            console.log('✅ Validação básica OK');
            
            // 4. PROCESSAMENTO PRINCIPAL
            if (window.editingPropertyId) {
                // ========== EDIÇÃO DE IMÓVEL EXISTENTE ==========
                console.log(`🔄 EDITANDO imóvel ID: ${window.editingPropertyId}`);
                loading.updateMessage('Atualizando Imóvel...');
                
                // 4.1 Preparar objeto de atualização
                const updateData = { ...propertyData };
                
                // 4.2 ⭐⭐ GARANTIR FORMATAÇÃO DO PREÇO ⭐⭐
                if (updateData.price && !updateData.price.startsWith('R$')) {
                    if (window.SharedCore && typeof window.SharedCore.formatPriceForInput === 'function') {
                        updateData.price = window.SharedCore.formatPriceForInput(updateData.price);
                    } else {
                        // Fallback local
                        updateData.price = formatPriceForInputFallback(updateData.price);
                    }
                }
                
                // 4.3 PROCESSAR PDFs
                loading.updateMessage('Processando documentos PDF...');
                
                if (typeof window.processAndSavePdfs === 'function') {
                    console.log(`📄 Delegando processamento de PDFs para MediaSystem...`);
                    const pdfsString = await window.processAndSavePdfs(window.editingPropertyId, propertyData.title);
                    
                    if (pdfsString && pdfsString.trim() !== '') {
                        updateData.pdfs = pdfsString;
                        console.log(`✅ PDFs processados pelo MediaSystem: ${pdfsString.substring(0, 60)}...`);
                    } else {
                        updateData.pdfs = '';
                        console.log('ℹ️ Nenhum PDF para o imóvel (MediaSystem retornou vazio)');
                    }
                } else {
                    console.warn('⚠️ Função processAndSavePdfs não disponível');
                    updateData.pdfs = '';
                }
                
                // 4.4 PROCESSAR MÍDIA (FOTOS/VIDEOS)
                loading.updateMessage('Processando fotos e vídeos...');
                
                try {
                    if (typeof window.getMediaUrlsForProperty === 'function') {
                        console.log(`🎯 Chamando getMediaUrlsForProperty para ID ${window.editingPropertyId}...`);
                        
                        // Usar função com ordenação se disponível
                        let mediaUrls;
                        if (window.MediaSystem && typeof window.MediaSystem.getOrderedMediaUrls === 'function') {
                            const ordered = window.MediaSystem.getOrderedMediaUrls();
                            mediaUrls = ordered.images;
                            console.log('🔄 Usando ordem visual personalizada');
                        } else {
                            mediaUrls = await window.getMediaUrlsForProperty(window.editingPropertyId, propertyData.title);
                        }
                        
                        if (mediaUrls !== undefined && mediaUrls !== null) {
                            if (mediaUrls.trim() !== '') {
                                updateData.images = mediaUrls;
                                const urlCount = mediaUrls.split(',').filter(url => url.trim() !== '').length;
                                console.log(`✅ Mídia processada: ${urlCount} URL(s)`);
                                console.log(`📝 Amostra: ${mediaUrls.substring(0, 80)}...`);
                            } else {
                                // String vazia - sem mídia
                                updateData.images = '';
                                console.log('ℹ️ Nenhuma mídia para salvar');
                            }
                        } else {
                            console.warn('⚠️  getMediaUrlsForProperty retornou undefined/null');
                            updateData.images = '';
                        }
                    } else {
                        console.error('❌ Função getMediaUrlsForProperty não disponível!');
                        updateData.images = '';
                    }
                } catch (mediaError) {
                    console.error('❌ ERRO CRÍTICO ao processar mídia:', mediaError);
                    // Tenta manter as imagens existentes do imóvel atual
                    const currentProperty = window.properties.find(p => p.id == window.editingPropertyId);
                    updateData.images = currentProperty ? currentProperty.images : '';
                }
                
                // 4.5 SALVAR NO BANCO
                loading.updateMessage('Salvando alterações no banco de dados...');
                
                if (typeof window.updateProperty === 'function') {
                    console.log('💾 Enviando atualização para o sistema de propriedades...');
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    if (success) {
                        console.log('✅ Imóvel atualizado com sucesso no banco de dados!');
                        
                        // Feedback final
                        loading.setVariant('success');
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
                        loading.setVariant('error');
                        loading.updateMessage('Falha na atualização');
                        setTimeout(() => {
                            loading.hide();
                            alert('❌ Não foi possível atualizar o imóvel. Verifique o console.');
                        }, 1500);
                    }
                } else {
                    console.error('❌ Função updateProperty não disponível!');
                    alert('❌ Erro: sistema de propriedades não disponível');
                }
                
            } else {
                // ========== CRIAÇÃO DE NOVO IMÓVEL ==========
                console.log('🆕 CRIANDO novo imóvel...');
                loading.updateMessage('Criando Novo Imóvel...');
                
                // 4.6 ⭐⭐ GARANTIR FORMATAÇÃO DO PREÇO ⭐⭐
                if (propertyData.price && !propertyData.price.startsWith('R$')) {
                    if (window.SharedCore && typeof window.SharedCore.formatPriceForInput === 'function') {
                        propertyData.price = window.SharedCore.formatPriceForInput(propertyData.price);
                    } else {
                        // Fallback local
                        propertyData.price = formatPriceForInputFallback(propertyData.price);
                    }
                }
                
                // 4.7 PROCESSAR MÍDIA PARA NOVO IMÓVEL
                loading.updateMessage('Processando fotos e vídeos...');
                
                let mediaUrls = '';
                if (window.selectedMediaFiles && window.selectedMediaFiles.length > 0) {
                    console.log(`🖼️ Processando ${window.selectedMediaFiles.length} arquivo(s) de mídia para novo imóvel...`);
                    
                    try {
                        if (typeof window.getMediaUrlsForProperty === 'function') {
                            // Para novo imóvel, usar ID temporário
                            const tempId = `new_${Date.now()}`;
                            mediaUrls = await window.getMediaUrlsForProperty(tempId, propertyData.title);
                            
                            if (mediaUrls && mediaUrls.trim() !== '') {
                                propertyData.images = mediaUrls;
                                console.log(`✅ Mídia processada para novo imóvel: ${mediaUrls.substring(0, 80)}...`);
                            }
                        }
                    } catch (mediaError) {
                        console.error('❌ Erro ao processar mídia para novo imóvel:', mediaError);
                    }
                }
                
                // 4.8 PROCESSAR PDFs PARA NOVO IMÓVEL
                loading.updateMessage('Processando documentos PDF...');
                
                if (window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
                    console.log(`📄 Processando ${window.selectedPdfFiles.length} PDF(s) para novo imóvel...`);
                    // A lógica de PDFs para novo imóvel já está em addNewProperty
                }
                
                // 4.9 CRIAR NO BANCO
                loading.updateMessage('Salvando no banco de dados...');
                
                if (typeof window.addNewProperty === 'function') {
                    console.log('💾 Chamando addNewProperty com dados:', {
                        title: propertyData.title,
                        hasMedia: !!(propertyData.images),
                        hasPdfs: !!(window.selectedPdfFiles && window.selectedPdfFiles.length > 0)
                    });
                    
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        console.log(`✅ Novo imóvel criado com ID: ${newProperty.id}`);

                        // Feedback final
                        loading.setVariant('success');
                        loading.updateMessage('Imóvel cadastrado com sucesso!');
                        
                        // Mostrar resumo
                        setTimeout(() => {
                            let successMessage = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`;
                            if (newProperty.images && newProperty.images !== 'EMPTY') {
                                const imageCount = newProperty.images.split(',').filter(url => url.trim() !== '').length;
                                successMessage += `\n📸 ${imageCount} foto(s)/vídeo(s) incluída(s)`;
                            }
                            if (newProperty.pdfs && newProperty.pdfs !== 'EMPTY') {
                                const pdfCount = newProperty.pdfs.split(',').filter(url => url.trim() !== '').length;
                                successMessage += `\n📄 ${pdfCount} documento(s) PDF incluído(s)`;
                            }
                            
                            alert(successMessage);
                        }, 800);
                        
                    } else {
                        loading.setVariant('error');
                        loading.updateMessage('Falha na criação');
                        setTimeout(() => {
                            loading.hide();
                            alert('❌ Não foi possível criar o imóvel. Verifique o console.');
                        }, 1500);
                    }
                } else {
                    console.error('❌ Função addNewProperty não disponível!');
                    alert('❌ Erro: sistema de criação não disponível');
                }
            }
            
        } catch (error) {
            // 5. TRATAMENTO DE ERROS
            console.error('❌ ERRO CRÍTICO no processamento do formulário:', error);
            
            loading.setVariant('error');
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
                console.log('🧹 Executando limpeza automática pós-salvamento...');
                
                // Esconder loading
                loading.hide();
                
                // ✅ CHAVE: Resetar formulário para estado inicial
                setTimeout(() => {
                    window.cleanAdminForm('reset');
                }, 500);
                
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
                        console.log('📋 Lista de imóveis atualizada');
                    }, 700);
                }
                
                // Forçar recarregamento da galeria principal
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => {
                        window.renderProperties('todos');
                        console.log('🔄 Galeria principal atualizada');
                    }, 1000);
                }
                
                // Feedback visual para usuário
                console.log('🎯 Formulário limpo e pronto para novo imóvel');
                
            }, 1000);
        }
        
        console.groupEnd();
    });
    
    console.log('✅ Formulário admin configurado com sistema de loading visual e formatação de preço');
};

// Função de fallback local para formatação automática de preço
function setupPriceAutoFormatFallback() {
    const priceField = document.getElementById('propPrice');
    if (!priceField) return;
    
    // Formatar ao carregar (se já tiver valor)
    if (priceField.value && !priceField.value.startsWith('R$')) {
        priceField.value = formatPriceForInputFallback(priceField.value);
    }
    
    // Formatar ao digitar
    priceField.addEventListener('input', function(e) {
        // Permite backspace, delete, setas
        if (e.inputType === 'deleteContentBackward' || 
            e.inputType === 'deleteContentForward' ||
            e.inputType === 'deleteByCut') {
            return;
        }
        
        // Salva posição do cursor
        const cursorPos = this.selectionStart;
        const originalValue = this.value;
        
        // Formata o valor
        this.value = formatPriceForInputFallback(this.value);
        
        // Ajusta posição do cursor
        const diff = this.value.length - originalValue.length;
        this.setSelectionRange(cursorPos + diff, cursorPos + diff);
    });
    
    // Formatar ao perder foco (garantir formatação)
    priceField.addEventListener('blur', function() {
        if (this.value && !this.value.startsWith('R$')) {
            this.value = formatPriceForInputFallback(this.value);
        }
    });
    
    console.log('✅ Formatação automática de preço configurada (fallback local)');
}

// ========== SINCRONIZAÇÃO MANUAL ==========
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar com Supabase?\n\nIsso irá buscar os imóveis do banco de dados online.')) {
        console.log('🔄 Iniciando sincronização manual...');
        
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
            console.error('❌ Erro na sincronização:', error);
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
    
    console.log('✅ Botão de sincronização adicionado');
}

// ========== CORREÇÃO DEFINITIVA DOS FILTROS ==========
window.fixFilterVisuals = function() {
    console.log('🎨 CORREÇÃO DEFINITIVA DOS FILTROS VISUAIS');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        console.log('⚠️ Nenhum botão de filtro encontrado');
        return;
    }
    
    console.log(`🔍 Encontrados ${filterButtons.length} botões de filtro`);
    
    // Para CADA botão, remover e recriar completamente
    filterButtons.forEach((button, index) => {
        console.log(`   ${index + 1}. Processando: "${button.textContent.trim()}"`);
        
        // Clonar botão (remove event listeners antigos)
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Configurar NOVO event listener DIRETO
        newButton.addEventListener('click', function handleFilterClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🎯 Filtro clicado: "${this.textContent.trim()}"`);
            
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
            
            console.log(`   ✅ "active" removido de ${allButtons.length - 1} botões`);
            console.log(`   ✅ "active" adicionado a: "${this.textContent.trim()}"`);
            
            // Executar filtro
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            if (typeof window.renderProperties === 'function') {
                console.log(`   🚀 Executando filtro: ${filter}`);
                window.renderProperties(filter);
            }
        });
    });
    
    console.log(`✅ ${filterButtons.length} botões de filtro CORRIGIDOS`);
    
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
                console.log('✅ "Todos" ativado por padrão');
            }
        }
    }, 500);
};

// ========== CONFIGURAÇÃO CORRIGIDA DO UPLOAD DE PDF ==========
console.log('🔒 Configurando upload de PDFs: DELEGANDO para MediaSystem');

// ========== VERIFICAR E AGUARDAR MEDIASYSTEM ANTES DE CONFIGURAR ==========
setTimeout(() => {
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    
    if (pdfFileInput && pdfUploadArea) {
        console.log('🎯 Elementos de PDF encontrados - Configurando...');
        
        // 1. REMOVER QUALQUER LISTENER ANTIGO (clonando elementos)
        const cleanPdfInput = pdfFileInput.cloneNode(true);
        const cleanPdfArea = pdfUploadArea.cloneNode(true);
        
        pdfFileInput.parentNode.replaceChild(cleanPdfInput, pdfFileInput);
        pdfUploadArea.parentNode.replaceChild(cleanPdfArea, pdfUploadArea);
        
        console.log('✅ Elementos resetados - Prontos para MediaSystem');
        
        // 2. AGORA APENAS CONFIGURAR O BÁSICO - O MediaSystem fará o resto
        const freshUploadArea = document.getElementById('pdfUploadArea');
        const freshFileInput = document.getElementById('pdfFileInput');
        
        // 3. CONFIGURAR APENAS O CLICK BÁSICO (sem processamento)
        freshUploadArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Área de PDF clicada - Abrindo seletor...');
            freshFileInput.click();
        });
        
        // 4. DELEGAR 100% PARA MEDIASYSTEM QUANDO ARQUIVO FOR SELECIONADO
        freshFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                console.log(`📄 ${e.target.files.length} arquivo(s) selecionado(s)`);
                
                // CHAMAR DIRETAMENTE O MEDIASYSTEM
                if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                    console.log('🔄 Delegando para MediaSystem.addPdfs()');
                    window.MediaSystem.addPdfs(e.target.files);
                } else {
                    console.error('❌ MediaSystem não disponível!');
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
            console.log('📄 Drag over área PDF');
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
                console.log(`📄 ${e.dataTransfer.files.length} arquivo(s) solto(s)`);
                
                // CHAMAR DIRETAMENTE O MEDIASYSTEM
                if (window.MediaSystem && typeof window.MediaSystem.addPdfs === 'function') {
                    window.MediaSystem.addPdfs(e.dataTransfer.files);
                }
            }
        });
        
        console.log('✅ Upload de PDFs configurado - MediaSystem responsável pelo processamento');
        
    } else {
        console.warn('⚠️ Elementos de PDF não encontrados no DOM');
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
                console.log('✅ MediaSystem pronto após', attempts, 'tentativas');
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ MediaSystem não carregou após', maxAttempts * interval, 'ms');
                resolve(false);
            } else {
                console.log('⏳ Aguardando MediaSystem... tentativa', attempts);
            }
        }, interval);
    });
}

// ========== FUNÇÃO DE FALLBACK SE MEDIASYSTEM FALHAR ==========
function setupPdfFallback() {
    console.log('🔄 Configurando fallback para PDFs...');
    
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    
    if (!pdfUploadArea || !pdfFileInput) {
        console.error('❌ Elementos de PDF não encontrados para fallback');
        return;
    }
    
    // Configuração básica de fallback
    pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
    
    pdfFileInput.addEventListener('change', async function(e) {
        if (e.target.files.length > 0) {
            console.log('📄 Fallback: Processando', e.target.files.length, 'PDF(s)');
            
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
    console.log('🔍 Verificando sistema de mídia...');
    
    waitForMediaSystem().then(isReady => {
        if (!isReady) {
            console.warn('⚠️ Configurando fallback para PDFs');
            setupPdfFallback();
        }
    });
});

// ========== INICIALIZAÇÃO DO SISTEMA ==========
function initializeAdminSystem() {
    console.log('🚀 Inicializando sistema admin...');
    
    // 1. Esconder painel
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
        console.log('✅ Painel admin oculto');
    }
    
    // 2. Configurar botão admin
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Botão admin clicado');
            window.toggleAdminPanel();
        });
        console.log('✅ Botão admin configurado');
    }
    
    // 🔥 CRÍTICO: CONFIGURAR BOTÃO "CANCELAR EDIÇÃO"
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.removeAttribute('onclick'); // Remover atributo antigo
        cancelEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Botão "Cancelar Edição" clicado - EVENTO ATIVO');
            window.cleanAdminForm('cancel');
        });
        console.log('✅ Botão "Cancelar Edição" configurado com listener');
    }
    
    // 3. Configurar formulário
    if (typeof window.setupForm === 'function') {
        window.setupForm();
        console.log('✅ Formulário configurado');
    }
    
    // 4. Adicionar botão sincronização
    addSyncButton();
    
    // 5. CORREÇÃO GARANTIDA DOS FILTROS (VERSÃO FINAL)
    console.log('🎯 Iniciando correção garantida dos filtros...');

    // A configuração do upload de PDF já foi tratada acima
    console.log('✅ Upload de PDF delegado 100% para MediaSystem');

    // Tentativa 1: Imediata (800ms)
    setTimeout(() => {
        if (typeof window.fixFilterVisuals === 'function') {
            console.log('🔄 Tentativa 1: Aplicando correção de filtros...');
            window.fixFilterVisuals();
        } else {
            console.error('❌ window.fixFilterVisuals não encontrada!');
        }
    }, 800);

    // Tentativa 2: Após 2 segundos (backup)
    setTimeout(() => {
        console.log('🔍 Verificando se filtros funcionam...');
        
        // Testar se algum filtro tem listener
        const testBtn = document.querySelector('.filter-btn');
        if (testBtn && !testBtn.onclick) {
            console.log('⚠️ Filtros sem listeners - reaplicando...');
            if (typeof window.fixFilterVisuals === 'function') {
                window.fixFilterVisuals();
            }
        }
    }, 2000);

    // 6. VERIFICAR SISTEMA DE LOADING (AGORA É EXTERNO)
    console.log('🔍 Verificando sistema de loading (módulo externo)...');
    if (typeof LoadingManager !== 'undefined' && typeof LoadingManager.show === 'function') {
        console.log('✅ LoadingManager disponível como módulo externo');
    } else {
        console.warn('⚠️ LoadingManager não carregado - verifique ordem dos scripts');
    }
   
    console.log('✅ Sistema admin inicializado');
    
    // Teste imediato do botão
    setTimeout(() => {
        const testCancelBtn = document.getElementById('cancelEditBtn');
        if (testCancelBtn) {
            console.log('✅ Botão Cancelar disponível:', {
                display: testCancelBtn.style.display,
                disabled: testCancelBtn.disabled,
                onclick: !!testCancelBtn.onclick
            });
            
            // Forçar visibilidade se em modo edição
            if (window.editingPropertyId && testCancelBtn.style.display === 'none') {
                testCancelBtn.style.display = 'block';
                console.log('🔧 Forçando visibilidade do botão Cancelar');
            }
        }
    }, 1000);
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
    console.log(`📄 showPdfModal chamado para ID: ${propertyId}`);
    
    // Usar o PdfSystem unificado se disponível (PRIORIDADE 1)
    if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
        window.PdfSystem.showModal(propertyId);
        return;
    }
    
    // Fallback robusto que GARANTE campo de senha
    openPdfModalDirectFallback(propertyId);
};

// ========== FUNÇÃO DE FALLBACK (ATUALIZADA E MELHORADA) ==========
function openPdfModalDirectFallback(propertyId) {
    console.log(`📄 Fallback PDF modal para ID: ${propertyId} - Versão Corrigida`);
    
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
        
        console.log('⚠️ Campo de senha não encontrado ou oculto. Recriando...');
        
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
            console.log('✅ Campo de senha inserido na posição correta');
        } else {
            // Fallback: inserir antes dos botões
            const modalContent = document.querySelector('.pdf-modal-content');
            if (modalContent) {
                const buttons = modalContent.querySelectorAll('button');
                if (buttons.length > 0) {
                    buttons[0].parentNode.insertBefore(passwordInput, buttons[0]);
                    console.log('✅ Campo de senha inserido antes dos botões');
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
            console.log('✅ Modal PDF aberto com campo de senha visível e focado');
            
            // DEBUG: Verificar visibilidade
            const style = window.getComputedStyle(passwordInput);
            console.log('🔍 DEBUG Campo senha:', {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                parentDisplay: passwordInput.parentElement ? 
                    window.getComputedStyle(passwordInput.parentElement).display : 'no parent'
            });
        }
    }, 200);
}

// ✅ FUNÇÃO AUXILIAR PARA TESTE RÁPIDO
window.testPdfModalFallback = function(testId = 101) {
    console.log('🧪 TESTE: Abrindo modal PDF via fallback...');
    openPdfModalDirectFallback(testId);
};

// ✅ VERIFICAÇÃO AUTOMÁTICA DO CAMPO DE SENHA
function checkPdfPasswordField() {
    const passwordInput = document.getElementById('pdfPassword');
    if (!passwordInput) {
        console.warn('⚠️ Campo de senha PDF não encontrado no DOM');
        return false;
    }
    
    const style = window.getComputedStyle(passwordInput);
    const isVisible = style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0';
    
    console.log(`🔍 Status campo senha: ${isVisible ? 'VISÍVEL ✅' : 'OCULTO ❌'}`, {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        hasParent: !!passwordInput.parentElement,
        parentDisplay: passwordInput.parentElement ? 
            window.getComputedStyle(passwordInput.parentElement).display : 'no parent'
    });
    
    return isVisible;
}

// Executar verificação após carregamento
setTimeout(() => {
    console.log('🔍 Verificando integridade do campo de senha PDF...');
    checkPdfPasswordField();
}, 3000);

// ✅ ADICIONAR ESTA FUNÇÃO PARA TESTAR (opcional):
window.testPdfModalDirect = function(propertyId) {
    console.log('🧪 TESTE DIRETO DO MODAL PDF');
    openPdfModalDirectFallback(propertyId || 101); // Testar com ID 101 ou fornecido
};

// ========== VERIFICAÇÃO DO SISTEMA PDF UNIFICADO ==========
setTimeout(() => {
    console.log('🔍 VERIFICAÇÃO SISTEMA PDF UNIFICADO (pdf-unified.js):');
    
    // 1. VERIFICAR SE O ARQUIVO pdf-unified.js FOI CARREGADO
    const hasPdfUnified = Array.from(document.scripts).some(script => 
        script.src && script.src.includes('pdf-unified.js')
    );
    
    console.log('📦 pdf-unified.js no HTML:', hasPdfUnified ? '✅ Carregado' : '❌ Não encontrado');
    
    // 2. VERIFICAR SE PdfSystem FOI CRIADO
    if (window.PdfSystem) {
        console.log('✅ PdfSystem disponível');
        
        // Verificar métodos CRÍTICOS
        const criticalMethods = ['showModal', 'processAndSavePdfs', 'clearAllPdfs'];
        console.log('🎯 Métodos críticos disponíveis:');
        criticalMethods.forEach(method => {
            console.log(`   - ${method}:`, typeof window.PdfSystem[method] === 'function' ? '✅' : '❌');
        });
    } else {
        console.warn('⚠️  PdfSystem NÃO disponível');
        console.log('🔧 Possíveis causas:');
        console.log('   1. pdf-unified.js não foi carregado corretamente');
        console.log('   2. Há erro de sintaxe em pdf-unified.js');
        console.log('   3. O arquivo não exporta window.PdfSystem');
    }
    
    // 3. VERIFICAR FUNÇÕES GLOBAIS QUE O admin.js USA
    console.log('🌐 Funções globais para admin.js:');
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
        console.log(`   - ${func}:`, typeof window[func] === 'function' ? '✅' : '❌');
    });
    
    // 4. CONCLUSÃO
    const systemReady = window.PdfSystem && typeof window.PdfSystem.showModal === 'function';
    console.log(systemReady ? '🎉 Sistema PDF unificado PRONTO!' : '⚠️  Sistema PDF precisa de ajustes');
    
}, 2000);

// ✅ SUBSTITUIR A FUNÇÃO accessPdfDocuments POR ESTA VERSÃO SIMPLIFICADA:
window.accessPdfDocuments = function() {
    console.log('🔓 accessPdfDocuments chamada - Versão Corrigida');
    
    // 1. Obter elementos CRÍTICOS
    const passwordInput = document.getElementById('pdfPassword');
    const modalTitle = document.getElementById('pdfModalTitle');
    
    if (!passwordInput) {
        console.error('❌ Campo de senha PDF não encontrado!');
        // Recriar dinamicamente se necessário
        recreatePdfPasswordField();
        setTimeout(() => window.accessPdfDocuments(), 100);
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
    
    console.log('✅ Senha válida! Processando documentos...');
    
    // 4. Obter ID do imóvel de múltiplas fontes (robustez)
    const propertyId = 
        window.currentPropertyId || 
        (modalTitle && modalTitle.dataset.propertyId) || 
        (document.querySelector('.property-card.active') && 
         document.querySelector('.property-card.active').dataset.propertyId);
    
    if (!propertyId) {
        console.error('❌ Não foi possível identificar o imóvel');
        alert('⚠️ Não foi possível identificar o imóvel. Tente novamente.');
        return;
    }
    
    // 5. Buscar imóvel
    const property = window.properties.find(p => p.id == propertyId);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        closePdfModal();
        return;
    }
    
    // 6. Verificar se tem PDFs
    if (!property.pdfs || property.pdfs === 'EMPTY' || property.pdfs.trim() === '') {
        alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
        closePdfModal();
        return;
    }
    
    // 7. Processar URLs dos PDFs
    const pdfUrls = property.pdfs.split(',')
        .map(url => url.trim())
        .filter(url => url && url !== 'EMPTY' && url !== '');
    
    if (pdfUrls.length === 0) {
        alert('ℹ️ Nenhum documento PDF disponível.');
        closePdfModal();
        return;
    }
    
    console.log(`📄 ${pdfUrls.length} documento(s) encontrado(s) para imóvel ${propertyId}`);
    
    // 8. Fechar modal de senha e abrir modal de seleção
    closePdfModal();
    showPdfSelectionList(propertyId, property.title, pdfUrls);
};

// Função auxiliar para recriar campo de senha se necessário
function recreatePdfPasswordField() {
    console.log('🔧 Recriando campo de senha PDF...');
    
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
            console.log('✅ Campo de senha recriado');
        }
    }
}

// ✅ 5. FUNÇÃO PARA MOSTRAR LISTA DE SELEÇÃO DE PDFs
function showPdfSelectionList(propertyId, propertyTitle, pdfUrls) {
    console.log('📋 Criando lista de seleção de PDFs...');
    
    // Fechar modal de senha primeiro
    closePdfModal();
    
    // Criar modal de seleção
    let selectionModal = document.getElementById('pdfSelectionModal');
    
    if (!selectionModal) {
        selectionModal = document.createElement('div');
        selectionModal.id = 'pdfSelectionModal';
        selectionModal.className = 'pdf-modal';
        selectionModal.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10001;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        document.body.appendChild(selectionModal);
    }
    
    // Gerar HTML da lista
    const pdfListHtml = pdfUrls.map((url, index) => {
        const fileName = url.split('/').pop() || `Documento ${index + 1}`;
        const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
        const fileSize = 'PDF Document'; // Poderia extrair tamanho se disponível
        
        return `
            <div class="pdf-list-item" style="
                background: white;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                cursor: pointer;
                border-left: 4px solid var(--primary);
            ">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-file-pdf" style="color: #e74c3c; font-size: 1.5rem;"></i>
                        <div>
                            <strong style="display: block; color: #2c3e50;">${displayName}</strong>
                            <small style="color: #7f8c8d;">${fileSize} • Documento ${index + 1}/${pdfUrls.length}</small>
                        </div>
                    </div>
                </div>
                <button onclick="openPdfInNewTab('${url}')" 
                        style="
                            background: var(--primary);
                            color: white;
                            border: none;
                            padding: 0.6rem 1.2rem;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            transition: all 0.3s ease;
                        "
                        onmouseover="this.style.background='#154060'"
                        onmouseout="this.style.background='var(--primary)'">
                    <i class="fas fa-eye"></i> Visualizar
                </button>
            </div>
        `;
    }).join('');
    
    selectionModal.innerHTML = `
        <div style="
            background: white;
            border-radius: 10px;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        ">
            <button onclick="closePdfSelectionModal()" 
                    style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        cursor: pointer;
                        font-size: 1rem;
                    ">
                ×
            </button>
            
            <h3 style="color: var(--primary); margin: 0 0 1.5rem 0;">
                <i class="fas fa-file-pdf"></i> Documentos do Imóvel
            </h3>
            
            <p style="color: #666; margin-bottom: 1.5rem;">
                <strong>${propertyTitle}</strong><br>
                Selecione o documento que deseja visualizar:
            </p>
            
            <div style="margin-bottom: 1.5rem;">
                ${pdfListHtml}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <small style="color: #95a5a6;">
                    <i class="fas fa-info-circle"></i> Clique em "Visualizar" para abrir em nova aba
                </small>
                <button onclick="downloadAllPdfs([${pdfUrls.map(url => `'${url}'`).join(',')}])" 
                        style="
                            background: var(--success);
                            color: white;
                            border: none;
                            padding: 0.6rem 1.2rem;
                            border-radius: 5px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        ">
                    <i class="fas fa-download"></i> Baixar Todos
                </button>
            </div>
        </div>
    `;
    
    selectionModal.style.display = 'flex';
    console.log('✅ Lista de PDFs exibida para seleção');
}

// ✅ 6. FUNÇÃO PARA ABRIR PDF EM NOVA ABA
window.openPdfInNewTab = function(url) {
    console.log('🔗 Abrindo PDF:', url.substring(0, 80) + '...');
    window.open(url, '_blank', 'noopener,noreferrer');
};

// ✅ 7. FUNÇÃO PARA BAIXAR TODOS OS PDFs
window.downloadAllPdfs = async function(urls) {
    console.log(`📥 Iniciando download de ${urls.length} PDF(s)...`);
    
    let successCount = 0;
    
    for (const [index, url] of urls.entries()) {
        try {
            const fileName = url.split('/').pop() || `documento_${index + 1}.pdf`;
            const tempAnchor = document.createElement('a');
            tempAnchor.href = url;
            tempAnchor.download = fileName;
            tempAnchor.style.display = 'none';
            document.body.appendChild(tempAnchor);
            tempAnchor.click();
            document.body.removeChild(tempAnchor);
            
            successCount++;
            console.log(`✅ Download iniciado: ${fileName}`);
            
            // Pequena pausa entre downloads
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            console.error(`❌ Erro ao baixar ${url}:`, error);
        }
    }
    
    if (successCount > 0) {
        alert(`✅ ${successCount} documento(s) enviado(s) para download!\n\nVerifique a barra de downloads do seu navegador.`);
    }
};

// ✅ 8. FUNÇÃO PARA FECHAR MODAL DE SELEÇÃO
window.closePdfSelectionModal = function() {
    const modal = document.getElementById('pdfSelectionModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove(); // Remove completamente do DOM
        console.log('✅ Modal de seleção de PDFs fechado');
    }
};

// ✅ FUNÇÃO DE TESTE DIRETO (adicionar após accessPdfDocuments)
window.testPdfAccessDirect = function(propertyId) {
    console.log('🧪 TESTE DIRETO DE ACESSO A PDFs');
    
    if (!propertyId) {
        propertyId = window.currentPropertyId || 101; // Usar ID 101 como teste
    }
    
    const property = window.properties.find(p => p.id == propertyId);
    if (!property) {
        alert('Imóvel de teste não encontrado');
        return;
    }
    
    console.log(`📊 Imóvel ${propertyId}: "${property.title}"`);
    console.log(`📄 PDFs: ${property.pdfs || 'Nenhum'}`);
    
    // Abrir PDFs diretamente (pular validação de senha)
    if (property.pdfs && property.pdfs !== 'EMPTY') {
        const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
        pdfUrls.forEach(url => {
            console.log(`🔗 Abrindo: ${url.substring(0, 80)}...`);
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
        console.log('🔄 Criando/Atualizando modal PDF completo...');
        
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
            console.log('✅ Modal PDF completo criado');
        }
    }
    
    return modal;
};

// Verificação automática na inicialização
setTimeout(() => {
    if (!document.getElementById('pdfModal')) {
        console.log('⚠️ Modal PDF não encontrado. Criando automaticamente...');
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
        console.log('🆘 Botão de emergência criado');
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
            console.group('🧪 TESTE COMPLETO DO SISTEMA DE MÍDIA');
            
            // 1. Testar conexão básica
            console.log('1️⃣ Testando conexão entre módulos...');
            console.log('- handleNewMediaFiles:', typeof window.handleNewMediaFiles);
            console.log('- updateMediaPreview:', typeof window.updateMediaPreview);
            
            // 2. Testar com arquivo simulado
            if (typeof window.handleNewMediaFiles === 'function') {
                console.log('2️⃣ Simulando upload de arquivo...');
                
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
                console.log('✅ Arquivo de teste enviado para processamento');
            } else {
                console.error('❌ handleNewMediaFiles não disponível!');
            }
            
            // 3. Verificar preview
            setTimeout(() => {
                console.log('3️⃣ Verificando preview...');
                const preview = document.getElementById('uploadPreview');
                if (preview) {
                    console.log('✅ Preview container encontrado');
                    console.log('📸 Conteúdo:', preview.innerHTML.length, 'caracteres');
                    
                    if (preview.innerHTML.includes('test_foto')) {
                        console.log('🎉 ARQUIVO DE TESTE APARECE NO PREVIEW!');
                        alert('✅ SISTEMA FUNCIONANDO!\n\nArquivo de teste apareceu no preview.');
                   } else {
                        console.log('⚠️ Preview não mostra arquivo de teste');
                        console.log('🔍 HTML do preview:', preview.innerHTML.substring(0, 200));
                    }
                } else {
                    console.error('❌ Preview container NÃO encontrado!');
                }
            }, 500);
            
            console.groupEnd();
        };
        
        document.body.appendChild(testBtn);
        console.log('🧪 Botão de teste de mídia criado');
    }
}, 2000);

// ========== SOLUÇÃO FINAL - OBSERVADOR DE FILTROS ==========
(function startFilterObserver() {
    console.log('👁️ Iniciando observador de filtros...');
    
    // Observar quando os filtros forem clicados
    document.addEventListener('click', function(e) {
        const clickedFilter = e.target.closest('.filter-btn');
        if (clickedFilter) {
            console.log('🎯 Filtro clicado via observer:', clickedFilter.textContent.trim());
            
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
    
    console.log('✅ Observador de filtros ativo');
})();

// Limpar PDFs processados após salvamento
window.clearProcessedPdfs = function() {
    console.log('🧹 Limpando PDFs processados...');
    
    // Manter apenas PDFs NÃO processados
    window.selectedPdfFiles = window.selectedPdfFiles.filter(pdf => !pdf.processed);
    
    console.log(`📊 Após limpeza: ${window.selectedPdfFiles.length} PDF(s) não processados`);
    
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
            console.warn('⚠️ Formulário carregado com dados! Limpando automaticamente...');
            window.cleanAdminForm('force');
        }
    }, 500);
});

// Verificação automática ao carregar formulário
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const formState = window.isAdminFormEmpty();
        console.log('🔍 Estado inicial do formulário:', formState);
        
        // Se não está vazio, limpar
        if (!formState.isEmpty && !formState.isEditing) {
            console.log('⚠️ Formulário não estava vazio inicialmente. Limpando...');
            window.cleanAdminForm('reset');
        }
    }, 1500);
});

console.log('✅ admin.js pronto e funcional');

// CORREÇÃO DEFINITIVA: Ocultar botão de teste de upload
function hideMediaTestButtonPermanently() {
    console.log('🔧 Ocultando botão de teste de mídia definitivamente...');
    
    // Método 1: Remover completamente o elemento
    const testBtn = document.getElementById('media-test-btn');
    if (testBtn) {
        testBtn.remove();
        console.log('✅ Botão de teste REMOVIDO completamente');
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
                        console.log('✅ Botão de teste detectado e removido via observer');
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
            console.log('✅ Botão de teste ocultado via fallback');
            clearInterval(checkInterval);
        }
        if (attempts > 20) { // 10 segundos (20 * 500ms)
            clearInterval(checkInterval);
            console.log('⚠️  Botão de teste não encontrado após 10s');
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
        console.log('🚫 Botão de teste de mídia ocultado');
    }
    
    // Ocultar botão de emergência (opcional - mantém funcionalidade mas esconde)
    const emergencyBtn = document.getElementById('emergency-admin-btn');
    if (emergencyBtn) {
        emergencyBtn.style.display = 'none';
        console.log('🚫 Botão de emergência ocultado');
    }
}, 3000);

// NO FINAL DO admin.js - ADICIONAR verificação de integridade
setTimeout(() => {
    console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE DO SISTEMA PDF');
    
    // Verificar se elementos críticos existem
    const criticalElements = [
        { id: 'pdfModal', desc: 'Modal principal' },
        { id: 'pdfPassword', desc: 'Campo de senha' },
        { id: 'pdfModalTitle', desc: 'Título do modal' }
    ];
    
    let allExist = true;
    criticalElements.forEach(el => {
        const exists = document.getElementById(el.id);
        console.log(`${exists ? '✅' : '❌'} ${el.desc}: ${exists ? 'OK' : 'FALTANDO'}`);
        if (!exists) allExist = false;
    });
    
    if (!allExist) {
        console.log('⚠️  Elementos PDF faltando. Recriando sistema...');
        window.ensurePdfModalExists(true);
    }
    
    // Teste funcional (apenas em debug)
    if (window.location.search.includes('debug=true')) {
        console.log('🧪 Teste funcional do sistema PDF disponível');
        console.log('💡 Use: testPdfAccessDirect(101) para testar com imóvel ID 101');
    }
}, 3000);

console.log('✅ admin.js pronto e funcional');

// 🔧 PATCH TEMPORÁRIO: Corrigir checkbox "Tem vídeo" na edição
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const videoCheckbox = document.getElementById('propHasVideo');
        if (videoCheckbox) {
            // Garantir que o evento change funcione
            videoCheckbox.addEventListener('change', function() {
                console.log('✅ Checkbox "Tem vídeo" alterado:', this.checked);
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
    
    console.log('🎨 Estilos de loading visual aplicados');
});

console.log('✅ admin.js pronto e funcional - COM FORMATAÇÃO DE PREÇO IMPLEMENTADA VIA SharedCore');
