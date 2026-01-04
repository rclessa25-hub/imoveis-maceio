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

window.handleNewMediaFiles = function(files) {
    return MediaSystem.addFiles(files);
};

window.handleNewPdfFiles = function(files) {
    return MediaSystem.addPdfs(files);
};

window.loadExistingMediaForEdit = function(property) {
    MediaSystem.loadExisting(property);
};

window.clearMediaSystem = function() {
    MediaSystem.resetState();
};

window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
    const result = await MediaSystem.uploadAll(propertyId, propertyTitle);
    return result.images;
};

window.getPdfsForProperty = async function(propertyId, propertyTitle) {
    const result = await MediaSystem.uploadAll(propertyId, propertyTitle);
    return result.pdfs;
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
window.cancelEdit = function() {
    console.log('❌ Cancelando edição...');
    window.editingPropertyId = null;

     // Limpar PDFs
    if (typeof window.clearProcessedPdfs === 'function') {
        window.clearProcessedPdfs();
    }
    
    if (typeof window.clearPdfsOnCancel === 'function') {
        window.clearPdfsOnCancel();
    }

    // ⭐ NOVO: Limpar mídia (fotos/vídeos)
    if (typeof window.clearMediaSystem === 'function') {
        window.clearMediaSystem();
        console.log('✅ Mídia limpa no cancelamento');
    }
    
    const form = document.getElementById('propertyForm');
    if (form) form.reset();
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
    
    console.log('✅ Edição cancelada');
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

// ========== FUNÇÃO editProperty ATUALIZADA COM SUPORTE A MÍDIA ==========
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
        console.log('🖼️ Mídia existente carregada no MediaSystem');
    }

    console.log(`✅ Imóvel ${id} pronto para edição`);
};

// ========== Função de Limpeza do Formulário ==========

window.resetAdminFormToInitialState = function() {
    console.log('🔄 Resetando formulário admin para estado inicial');
    
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
        
        console.log('✅ Formulário resetado completamente para estado inicial');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao resetar formulário:', error);
        return false;
    }
};

// ========== CONFIGURAÇÃO DO FORMULÁRIO ATUALIZADA COM MÍDIA ==========
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
    
    freshForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.group('🚀 SUBMISSÃO DO FORMULÁRIO ADMIN');
        
        // 1. COLETAR DADOS DO FORMULÁRIO
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
        
        // 2. VALIDAÇÃO BÁSICA
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            alert('❌ Preencha Título, Preço e Localização!');
            console.error('❌ Validação falhou: campos obrigatórios vazios');
            console.groupEnd();
            return;
        }
        
        console.log('✅ Validação básica OK');
        
        // 3. PROCESSAMENTO PRINCIPAL
        try {
            if (window.editingPropertyId) {
                // ========== EDIÇÃO DE IMÓVEL EXISTENTE ==========
                console.log(`🔄 EDITANDO imóvel ID: ${window.editingPropertyId}`);
                
                // 3.1 Preparar objeto de atualização
                const updateData = { ...propertyData };
                
                // 3.2 PROCESSAR PDFs (sistema existente)
                console.log(`📄 Processando PDFs para edição...`);
                console.log(`- PDFs existentes: ${window.existingPdfFiles ? window.existingPdfFiles.length : 0}`);
                console.log(`- Novos PDFs: ${window.selectedPdfFiles ? window.selectedPdfFiles.length : 0}`);
                
                try {
                    if (typeof window.processAndSavePdfs === 'function') {
                        const pdfsString = await window.processAndSavePdfs(window.editingPropertyId, propertyData.title);
                        
                        if (pdfsString && pdfsString.trim() !== '') {
                            updateData.pdfs = pdfsString;
                            console.log(`✅ PDFs processados: ${pdfsString.substring(0, 60)}...`);
                        } else {
                            // Se não há PDFs, definir como string vazia
                            updateData.pdfs = '';
                            console.log('ℹ️ Nenhum PDF para o imóvel');
                        }
                    } else {
                        console.warn('⚠️  Função processAndSavePdfs não disponível');
                        updateData.pdfs = '';
                    }
                } catch (pdfError) {
                    console.error('❌ Erro ao processar PDFs:', pdfError);
                    updateData.pdfs = '';
                }
                
                // 3.3 PROCESSAR MÍDIA (FOTOS/VIDEOS) - NOVO SISTEMA INTEGRADO
                console.log(`🖼️ Processando mídia (fotos/vídeos) para edição...`);
                console.log(`📊 Estado da mídia:`);
                console.log(`- Novos arquivos: ${window.selectedMediaFiles ? window.selectedMediaFiles.length : 0}`);
                console.log(`- Existentes: ${window.existingMediaFiles ? window.existingMediaFiles.length : 0}`);
                
                try {
                    if (typeof window.getMediaUrlsForProperty === 'function') {
                        console.log(`🎯 Chamando getMediaUrlsForProperty para ID ${window.editingPropertyId}...`);
                        const mediaUrls = await window.getMediaUrlsForProperty(window.editingPropertyId, propertyData.title);
                        
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
                        console.log('🔍 Verificando window object:', {
                            hasGetMediaUrls: typeof window.getMediaUrlsForProperty,
                            mediaConfig: window.MEDIA_CONFIG,
                            currentSystem: window.currentMediaSystem
                        });
                        updateData.images = '';
                    }
                } catch (mediaError) {
                    console.error('❌ ERRO CRÍTICO ao processar mídia:', mediaError);
                    console.log('🔄 Usando fallback: mantendo imagens existentes');
                    // Tenta manter as imagens existentes do imóvel atual
                    const currentProperty = window.properties.find(p => p.id == window.editingPropertyId);
                    updateData.images = currentProperty ? currentProperty.images : '';
                }
                
                // 3.4 LOG FINAL DOS DADOS PARA SUPABASE
                console.log('📤 Dados completos para Supabase:', {
                    title: updateData.title,
                    images: updateData.images ? `${updateData.images.split(',').length} URL(s)` : 'Nenhuma',
                    pdfs: updateData.pdfs ? `${updateData.pdfs.split(',').length} PDF(s)` : 'Nenhum'
                });
                
                // 3.5 CHAMAR ATUALIZAÇÃO NO BANCO
                if (typeof window.updateProperty === 'function') {
                    console.log('💾 Enviando atualização para o sistema de propriedades...');
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    
                    if (success) {
                        console.log('✅ Imóvel atualizado com sucesso no banco de dados!');
                        
                        // Feedback visual para o usuário
                        const imageCount = updateData.images ? updateData.images.split(',').filter(url => url.trim() !== '').length : 0;
                        const pdfCount = updateData.pdfs ? updateData.pdfs.split(',').filter(url => url.trim() !== '').length : 0;
                        
                        let successMessage = `✅ Imóvel "${updateData.title}" atualizado!`;
                        if (imageCount > 0) successMessage += `\n📸 ${imageCount} foto(s)/vídeo(s) salvo(s)`;
                        if (pdfCount > 0) successMessage += `\n📄 ${pdfCount} documento(s) PDF salvo(s)`;
                        
                        alert(successMessage);
                    } else {
                        console.error('❌ Falha na atualização do imóvel');
                        alert('❌ Não foi possível atualizar o imóvel. Verifique o console.');
                    }
                } else {
                    console.error('❌ Função updateProperty não disponível!');
                    alert('❌ Erro: sistema de propriedades não disponível');
                }
                
            } else {
                // ========== CRIAÇÃO DE NOVO IMÓVEL ==========
                console.log('🆕 CRIANDO novo imóvel...');
                
                // 3.6 PROCESSAR MÍDIA PARA NOVO IMÓVEL
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
                
                // 3.7 PROCESSAR PDFs PARA NOVO IMÓVEL
                if (window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
                    console.log(`📄 Processando ${window.selectedPdfFiles.length} PDF(s) para novo imóvel...`);
                    // A lógica de PDFs para novo imóvel já está em addNewProperty
                }
                
                // 3.8 CHAMAR CRIAÇÃO NO BANCO
                if (typeof window.addNewProperty === 'function') {
                    console.log('💾 Chamando addNewProperty com dados:', {
                        title: propertyData.title,
                        hasMedia: !!(propertyData.images),
                        hasPdfs: !!(window.selectedPdfFiles && window.selectedPdfFiles.length > 0)
                    });
                    
                    const newProperty = await window.addNewProperty(propertyData);
                    
                    if (newProperty) {
                        console.log(`✅ Novo imóvel criado com ID: ${newProperty.id}`);

                        // 🧼 LIMPEZA DO SISTEMA DE MÍDIA APÓS SALVAMENTO COM SUCESSO
                        if (typeof window.clearMediaSystem === 'function') {
                            setTimeout(() => {
                                window.clearMediaSystem();
                                console.log('🔄 Sistema de mídia limpo após salvamento');
                            }, 300);
                        }
                        
                        // Feedback para o usuário
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
                    } else {
                        console.error('❌ Falha na criação do novo imóvel');
                        alert('❌ Não foi possível criar o imóvel. Verifique o console.');
                    }
                } else {
                    console.error('❌ Função addNewProperty não disponível!');
                    alert('❌ Erro: sistema de criação não disponível');
                }
            }
            
        // 4. LIMPEZA E RESET APÓS SALVAMENTO (SUCESSO OU ERRO)
        setTimeout(() => {
            console.log('🧹 Executando limpeza automática pós-salvamento...');
            
            // ✅ CHAVE: Resetar formulário para estado inicial
            if (typeof window.resetAdminFormToInitialState === 'function') {
                window.resetAdminFormToInitialState();
            } else {
                // Fallback: chamar cancelEdit() que já existe
                if (typeof window.cancelEdit === 'function') {
                    window.cancelEdit();
                }
            }
            
            // Atualizar lista de imóveis no admin
            if (typeof window.loadPropertyList === 'function') {
                window.loadPropertyList();
                console.log('📋 Lista de imóveis atualizada');
            }
            
            // Forçar recarregamento da galeria principal
            if (typeof window.renderProperties === 'function') {
                setTimeout(() => {
                    window.renderProperties('todos');
                    console.log('🔄 Galeria principal atualizada');
                }, 500);
            }
            
            // Feedback visual para usuário
            console.log('🎯 Formulário limpo e pronto para novo imóvel');
            
        }, 800);
            
        } catch (error) {
            // 5. TRATAMENTO DE ERROS GLOBAIS
            console.error('❌ ERRO CRÍTICO no processamento do formulário:', error);
            console.error('🔍 Stack trace:', error.stack);
            
            let errorMessage = `❌ Erro ao processar: ${error.message || 'Erro desconhecido'}`;
            
            // Mensagens mais amigáveis para erros comuns
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = '❌ Erro de conexão. Verifique sua internet e tente novamente.';
            } else if (error.message.includes('Supabase') || error.message.includes('storage')) {
                errorMessage = '❌ Erro no servidor de armazenamento. Tente novamente em alguns instantes.';
            }
            
            alert(errorMessage + '\n\nVerifique o console para detalhes técnicos.');
        }
        
        console.groupEnd();
    });
    
    console.log('✅ Formulário admin configurado com sistema de mídia integrado.');
};

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
    
    // 3. Configurar formulário
    if (typeof window.setupForm === 'function') {
        window.setupForm();
        console.log('✅ Formulário configurado');
    }
    
    // 4. Adicionar botão sincronização
    addSyncButton();

    // 5. FORÇAR INICIALIZAÇÃO DO SISTEMA DE MÍDIA
    setTimeout(() => {
        console.log('🖼️ Verificando sistema de mídia...');
        
        // Verificar se os elementos de upload existem
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            console.log('✅ Elementos de upload encontrados');
            
            // Forçar inicialização
            if (typeof window.forceMediaSystemInit === 'function') {
                setTimeout(() => {
                    window.forceMediaSystemInit();
                    console.log('🎯 Sistema de mídia forçado a inicializar');
                }, 1500);
            }
        } else {
            console.error('❌ Elementos de upload NÃO encontrados!');
            console.log('🔍 Procurando uploadArea:', !!uploadArea);
            console.log('🔍 Procurando fileInput:', !!fileInput);
        }
    }, 2000);
    
    // Na função initializeAdminSystem, procure esta parte:
    // 6. CORREÇÃO GARANTIDA DOS FILTROS (VERSÃO FINAL)
    console.log('🎯 Iniciando correção garantida dos filtros...');
    
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
    
    // Tentativa 3: Emergência após 3 segundos
    setTimeout(() => {
        console.log('🆘 Aplicando correção de emergência...');
//        applyEmergencyFilterFix();
    }, 3000);
    
    console.log('✅ Sistema admin inicializado');
}

// ========== EXECUÇÃO AUTOMÁTICA ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeAdminSystem, 500);
    });
} else {
    setTimeout(initializeAdminSystem, 300);
}

// ========== DIAGNÓSTICO DOS EVENT LISTENERS ==========
// REMOVIDO
// ========== FORÇAR INICIALIZAÇÃO DO SISTEMA DE MÍDIA ==========
// REMOVIDO
// ========== FUNÇÕES PDF BÁSICAS ==========
window.showPdfModal = function(propertyId) {
    console.log(`📄 showPdfModal chamado para ID: ${propertyId}`);
    
    // Usar a função ORIGINAL do pdf-core.js
    if (typeof window.openPdfModalDirect !== 'undefined') {
        window.openPdfModalDirect(propertyId);
    } else {
        // Fallback robusto que GARANTE campo de senha
        openPdfModalDirectFallback(propertyId);
    }
};

// ========== FUNÇÃO DE FALLBACK (ATUALIZADA) ==========
function openPdfModalDirectFallback(propertyId) {
    console.log(`📄 Fallback PDF modal para ID: ${propertyId} - Versão Corrigida`);
    
    // Armazenar ID para uso posterior
    window.currentPropertyId = propertyId;
    
    const property = window.properties.find(p => p.id == propertyId);
    if (!property || !property.pdfs || property.pdfs === 'EMPTY') {
        alert('Nenhum documento PDF disponível para este imóvel.');
        return;
    }
    
    // ✅ GARANTIR QUE O MODAL EXISTE COM TODOS OS ELEMENTOS
    const modal = window.ensurePdfModalExists(true); // true = forçar verificação completa
    
    // ✅ Configurar título com segurança
    const titleElement = document.getElementById('pdfModalTitle');
    if (titleElement) {
        titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
        titleElement.dataset.propertyId = propertyId;
    }
    
    // ✅ GARANTIR QUE O CAMPO DE SENHA EXISTE E É VISÍVEL
    let passwordInput = document.getElementById('pdfPassword');
    if (!passwordInput) {
        // Criar se não existir
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
            display: block !important; /* FORÇAR VISIBILIDADE */
        `;
        
        // Inserir após o preview
        const previewDiv = document.getElementById('pdfPreview');
        if (previewDiv) {
            previewDiv.parentNode.insertBefore(passwordInput, previewDiv.nextSibling);
        }
    } else {
        // Tornar visível se existir
        passwordInput.style.display = 'block';
        passwordInput.style.visibility = 'visible';
        passwordInput.style.opacity = '1';
    }
    
    // ✅ Resetar campo de senha
    passwordInput.value = '';
    
    // ✅ Exibir modal
    modal.style.display = 'flex';
    
    // ✅ Focar no campo de senha após breve delay
    setTimeout(() => {
        passwordInput.focus();
        console.log('✅ Modal PDF aberto com campo de senha visível');
    }, 150);
}

// ✅ ADICIONAR ESTA FUNÇÃO PARA TESTAR (opcional):
window.testPdfModalDirect = function(propertyId) {
    console.log('🧪 TESTE DIRETO DO MODAL PDF');
    openPdfModalDirectFallback(propertyId || 101); // Testar com ID 101 ou fornecido
};

// Adicionar verificação de módulos PDF
setTimeout(() => {
    console.log('🔍 VERIFICAÇÃO MÓDULOS PDF:');
    console.log('- showPropertyPdf:', typeof window.showPropertyPdf);
    console.log('- pdf-core.js carregado:', typeof window.showPropertyPdf === 'function');
    console.log('- pdf-ui.js carregado:', typeof window.loadExistingPdfsForEdit === 'function');
    
    // Se não carregou, tentar recarregar
    if (typeof window.showPropertyPdf !== 'function') {
        console.warn('⚠️ Módulos PDF não carregaram automaticamente');
        console.log('📦 Tentando carregar manualmente...');
        
        // Forçar recarregamento dos módulos PDF
        const pdfModules = [
            'js/modules/reader/pdf-core.js',
            'js/modules/reader/pdf-ui.js',
            'js/modules/reader/pdf-integration.js'
        ];
        
        pdfModules.forEach(url => {
            const script = document.createElement('script');
            script.src = url + '?reload=' + Date.now();
            script.defer = true;
            document.head.appendChild(script);
            console.log('🔄 Recarregando:', url);
        });
    }
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

// ========== FALLBACK MÍNIMO PARA SISTEMA DE MÍDIA ==========
// Se o sistema de mídia não carregar, criar fallback básico
(function setupMediaFallback() {
    // Aguardar 3 segundos para carregamento normal
    setTimeout(() => {
        if (typeof window.handleNewMediaFiles !== 'function') {
            console.warn('⚠️ Sistema de mídia não carregou automaticamente');
            
            // Fallback mínimo e silencioso
            window.handleNewMediaFiles = function(files) {
                console.log('📸 [FALLBACK] Sistema de mídia em carregamento...');
                return 0; // Não processa arquivos
            };
            
            // Apenas mostrar alerta em modo debug
            if (window.location.search.includes('debug=true')) {
                console.log('💡 Dica: Adicione ?debug=true para carregar sistema de recuperação');
            }
        }
    }, 3000);
})();

// ========== VERIFICAÇÃO DE FORMULÁRIO VAZIO (MANTER - É ESSENCIAL) ==========
window.isAdminFormEmpty = function() {
    // ... (manter código existente, é essencial para UX)
};

// Verificação automática ao carregar formulário
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const formState = window.isAdminFormEmpty();
        console.log('🔍 Estado inicial do formulário:', formState);
        
        // Se não está vazio, limpar
        if (!formState.isEmpty && !formState.isEditing) {
            console.log('⚠️ Formulário não estava vazio inicialmente. Limpando...');
            window.resetAdminFormToInitialState();
        }
    }, 1500);
});

console.log('✅ admin.js pronto com funcionalidades essenciais');

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

// Em js/modules/admin.js - ADICIONAR NO FINAL DO ARQUIVO
// Função de Detecção de Formulário Vazio
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

// Verificação automática ao carregar formulário
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const formState = window.isAdminFormEmpty();
        console.log('🔍 Estado inicial do formulário:', formState);
        
        // Se não está vazio, limpar
        if (!formState.isEmpty && !formState.isEditing) {
            console.log('⚠️ Formulário não estava vazio inicialmente. Limpando...');
            window.resetAdminFormToInitialState();
        }
    }, 1500);
});
