// js/modules/admin.js - SISTEMA ADMIN CORRETO E FUNCIONAL
console.log('🔧 admin.js carregado - Sistema Administrativo');

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
    console.log(`📝 EDITANDO IMÓVEL ${id} (com sistema de mídia integrado)`);

    // ⭐ NOVO: Limpar estado anterior PRIMEIRO
    if (typeof window.clearMediaSystem === 'function') {
        window.clearMediaSystem();
        console.log('🧹 Estado anterior de mídia limpo antes de carregar novo');
    }
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    // 1. PREENCHER CAMPOS DO FORMULÁRIO
    document.getElementById('propTitle').value = property.title || '';
    document.getElementById('propPrice').value = property.price || '';
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    document.getElementById('propFeatures').value = Array.isArray(property.features) ? 
        property.features.join(', ') : (property.features || '');
    document.getElementById('propType').value = property.type || 'residencial';
    document.getElementById('propBadge').value = property.badge || 'Novo';
    document.getElementById('propHasVideo').checked = property.has_video || false;
    
    // 2. ATUALIZAR INTERFACE DO FORMULÁRIO
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'block';
    
    // 3. DEFINIR ID DE EDIÇÃO (CRÍTICO)
    window.editingPropertyId = property.id;
    console.log(`🆔 editingPropertyId definido como: ${window.editingPropertyId}`);
    
    // 4. CARREGAR MÍDIA EXISTENTE (FOTOS/VIDEOS) - NOVO SISTEMA
    console.log(`🖼️ Carregando mídia existente para edição...`);
    
    // Resetar arrays do sistema de mídia
    if (!window.selectedMediaFiles) window.selectedMediaFiles = [];
    if (!window.existingMediaFiles) window.existingMediaFiles = [];
    
    // Processar imagens existentes do imóvel
    if (property.images && property.images !== 'EMPTY' && property.images.trim() !== '') {
        try {
            const imageUrls = property.images.split(',')
                .map(url => url.trim())
                .filter(url => {
                    return url !== '' && 
                           url !== 'EMPTY' && 
                           url !== 'undefined' && 
                           url !== 'null' &&
                           (url.startsWith('http') || url.includes('supabase.co'));
                });
            
            imageUrls.forEach((url, index) => {
                try {
                    let fileName = 'Imagem';
                    
                    if (url.includes('/')) {
                        const parts = url.split('/');
                        fileName = parts[parts.length - 1] || `Imagem ${index + 1}`;
                        
                        try {
                            fileName = decodeURIComponent(fileName);
                        } catch (e) {}
                        
                        if (fileName.length > 40) {
                            fileName = fileName.substring(0, 37) + '...';
                        }
                    } else {
                        fileName = `Imagem ${index + 1}`;
                    }
                    
                    // Determinar se é imagem ou vídeo pela extensão/URL
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName) || 
                                    url.includes('/storage/v1/object/public/properties/');
                    const isVideo = /\.(mp4|mov|avi)$/i.test(fileName) || 
                                    url.includes('/storage/v1/object/public/videos/');
                    
                    const mediaType = isImage ? 'image' : (isVideo ? 'video' : 'file');
                    
                   // Adicionar à lista de mídia existente
                if (window.existingMediaFiles) {
                    window.existingMediaFiles.push({
                        url: url,
                        id: `existing_media_${Date.now()}_${index}`,
                        name: fileName,
                        type: mediaType,
                        size: 'Arquivada',
                        date: 'Existente',
                        isExisting: true,
                        originalUrl: url,
                        markedForDeletion: false // Nova propriedade para controle
                    });
                    
                    console.log(`✅ Mídia existente carregada: ${fileName} (${mediaType})`);
                } else {
                    console.error('❌ window.existingMediaFiles é undefined!');
                    window.existingMediaFiles = [{
                        url: url,
                        id: `existing_media_${Date.now()}_${index}`,
                        name: fileName,
                        type: mediaType,
                        size: 'Arquivada',
                        date: 'Existente',
                        isExisting: true,
                        originalUrl: url,
                        markedForDeletion: false
                    }];
                } catch (error) {
                    console.error(`❌ Erro ao processar URL ${url}:`, error);
                }
            });
          
        } catch (error) {
            console.error('❌ Erro ao processar imagens do imóvel:', error);
        }
    } else {
        console.log('ℹ️ Nenhuma mídia existente para este imóvel.');
    }
    
    // 5. CARREGAR PDFs EXISTENTES (sistema antigo - mantido para compatibilidade)
    if (typeof window.loadExistingPdfsForEdit === 'function') {
        console.log(`📄 Carregando PDFs existentes...`);
        window.loadExistingPdfsForEdit(property);
    }
    
    // 6. ATUALIZAR PREVIEW VISUAL
    if (typeof window.updateMediaPreview === 'function') {
        setTimeout(() => {
            window.updateMediaPreview();
            console.log(`🎨 Preview de mídia atualizado: ${window.existingMediaFiles.length} item(s) existente(s)`);
        }, 300);
    }
    
    // 7. ROLAR ATÉ O PAINEL ADMIN
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('📜 Rolado até o painel admin');
        }
    }, 100);
    
    console.log(`✅ Imóvel ${id} pronto para edição. Mídia: ${window.existingMediaFiles.length} item(s)`);
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
                console.log('🧹 Executando limpeza pós-salvamento...');
                
                // Cancelar edição (limpa formulário, reseta variáveis)
                if (typeof window.cancelEdit === 'function') {
                    window.cancelEdit();
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
window.debugMediaSystem = function() {
    console.group('🔍 DIAGNÓSTICO DO SISTEMA DE MÍDIA');
    
    // 1. Verificar elementos existem
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    console.log('📌 Elementos encontrados:', {
        'uploadArea': !!uploadArea,
        'fileInput': !!fileInput
    });
    
    // 2. Verificar event listeners
    if (uploadArea) {
        console.log('🎯 uploadArea event listeners:');
        console.log('- onclick:', uploadArea.onclick ? 'SIM' : 'NÃO');
        console.log('- ondragover:', uploadArea.ondragover ? 'SIM' : 'NÃO');
        console.log('- ondrop:', uploadArea.ondrop ? 'SIM' : 'NÃO');
    }
    
    // 3. Verificar funções disponíveis
    console.log('🔧 Funções globais:', {
        'handleNewMediaFiles': typeof window.handleNewMediaFiles,
        'clearMediaSystem': typeof window.clearMediaSystem,
        'selectedMediaFiles': window.selectedMediaFiles ? window.selectedMediaFiles.length : 'N/A'
    });
    
    console.groupEnd();
};

// ========== FORÇAR INICIALIZAÇÃO DO SISTEMA DE MÍDIA ==========
window.forceMediaSystemInit = function() {
    console.log('🚀 Forçando inicialização do sistema de mídia...');
    
    // 1. Garantir que o módulo está carregado
    if (typeof window.initMediaUI !== 'function') {
        console.error('❌ media-ui.js não carregado!');
        return false;
    }
    
    // 2. Inicializar UI
    const uiSuccess = window.initMediaUI();
    console.log('✅ UI inicializada:', uiSuccess);
    
    // 3. Verificar conexão com core
    if (typeof window.handleNewMediaFiles !== 'function') {
        console.error('❌ media-core.js não conectado!');
        console.log('⚠️ Verificando se media-core.js carregou...');
        
        // Tentar inicializar o sistema core
        if (typeof window.initMediaSystem === 'function') {
            window.initMediaSystem('vendas');
            console.log('🔧 Sistema core reinicializado');
        }
    }
    
    // 4. Testar funcionalidade
    setTimeout(() => {
        console.log('🧪 Testando sistema de mídia...');
        window.debugMediaSystem();
    }, 1000);
    
    return true;
};

// ========== FUNÇÕES PDF BÁSICAS ==========
window.showPdfModal = function(propertyId) {
    console.log(`📄 Abrindo PDFs do imóvel ${propertyId}`);
    alert('📄 Sistema de PDFs em desenvolvimento');
};

window.accessPdfDocuments = function() {
    const password = document.getElementById('pdfPassword')?.value;
    if (password === "doc123") {
        alert('✅ Documentos PDF acessados com sucesso!');
        closePdfModal();
    } else {
        alert('❌ Senha incorreta para documentos PDF!');
    }
};

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
            
            // Forçar remoção de 'active' de todos
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn !== clickedFilter) {
                    btn.classList.remove('active');
                    btn.style.backgroundColor = '';
                }
            });
            
            // Forçar adição de 'active' ao clicado
            clickedFilter.classList.add('active');
            clickedFilter.style.backgroundColor = '#667eea';
            clickedFilter.style.color = 'white';
            
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

// ========== RECARREGAMENTO DE EMERGÊNCIA ==========
window.reloadMediaModules = function() {
    console.log('🔄 RECARREGANDO MÓDULOS DE MÍDIA...');
    
    // 1. Remover módulos antigos
    delete window.handleNewMediaFiles;
    delete window.updateMediaPreview;
    delete window.initMediaUI;
    
    // 2. Recarregar scripts dinamicamente
    const scriptsToReload = [
        'js/modules/media/media-core.js',
        'js/modules/media/media-ui.js',
        'js/modules/media/media-integration.js'
    ];
    
    scriptsToReload.forEach(url => {
        // Remover script antigo se existir
        const oldScript = document.querySelector(`script[src="${url}"]`);
        if (oldScript) oldScript.remove();
        
        // Adicionar novo
        const newScript = document.createElement('script');
        newScript.src = url + '?reload=' + Date.now(); // Cache bust
        newScript.defer = true;
        document.body.appendChild(newScript);
        console.log(`📦 Recarregado: ${url}`);
    });
    
    // 3. Reinicializar após 2 segundos
    setTimeout(() => {
        console.log('🔧 Reinicializando sistema...');
        
        if (typeof window.initMediaSystem === 'function') {
            window.initMediaSystem('vendas');
        }
        
        if (typeof window.initMediaUI === 'function') {
            window.initMediaUI();
        }
        
        if (typeof window.setupMediaIntegration === 'function') {
            window.setupMediaIntegration();
        }
        
        alert('🔄 Módulos de mídia recarregados!\n\nTente novamente.');
    }, 2000);
};

// ========== RECUPERAÇÃO COMPLETA DO SISTEMA DE MÍDIA ==========
window.recoverMediaSystem = function() {
    console.log('🔄 INICIANDO RECUPERAÇÃO COMPLETA DO SISTEMA DE MÍDIA');
    
    // 1. Garantir que variáveis existam
    if (typeof window.selectedMediaFiles === 'undefined') {
        window.selectedMediaFiles = [];
        console.log('✅ window.selectedMediaFiles criado');
    }
    
    if (typeof window.existingMediaFiles === 'undefined') {
        window.existingMediaFiles = [];
        console.log('✅ window.existingMediaFiles criado');
    }
    
    if (typeof window.isUploadingMedia === 'undefined') {
        window.isUploadingMedia = false;
        console.log('✅ window.isUploadingMedia criado');
    }
    
    // 2. Garantir que MEDIA_CONFIG existe
    if (typeof window.MEDIA_CONFIG === 'undefined') {
        window.MEDIA_CONFIG = {
            supabaseBucket: 'properties',
            maxFiles: 10,
            maxSize: 5 * 1024 * 1024,
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            allowedVideoTypes: ['video/mp4', 'video/quicktime'],
            pathPrefix: 'property_media'
        };
        console.log('✅ window.MEDIA_CONFIG criado');
    }
    
    // 3. Criar função handleNewMediaFiles se não existir
    if (typeof window.handleNewMediaFiles !== 'function') {
        console.log('⚠️ handleNewMediaFiles não existe. Criando versão de emergência...');
        
        window.handleNewMediaFiles = function(files) {
            console.log('🆘 [EMERGÊNCIA] handleNewMediaFiles chamada com', files.length, 'arquivo(s)');
            
            if (!window.selectedMediaFiles) window.selectedMediaFiles = [];
            
            Array.from(files).forEach(file => {
                window.selectedMediaFiles.push({
                    file: file,
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    preview: URL.createObjectURL(file),
                    isNew: true,
                    isImage: file.type.includes('image'),
                    isVideo: file.type.includes('video')
                });
                console.log(`✅ "${file.name}" adicionado`);
            });
            
            // Atualizar preview
            if (typeof window.updateMediaPreview === 'function') {
                window.updateMediaPreview();
            }
            
            return files.length;
        };
        
        console.log('✅ handleNewMediaFiles criada (versão emergência)');
    }
    
    // 4. Recriar clearMediaSystem se não existir
    if (typeof window.clearMediaSystem !== 'function') {
        window.clearMediaSystem = function() {
            console.log('🧹 clearMediaSystem (emergência)');
            if (window.selectedMediaFiles) window.selectedMediaFiles.length = 0;
            if (window.existingMediaFiles) window.existingMediaFiles.length = 0;
            
            const preview = document.getElementById('uploadPreview');
            if (preview) preview.innerHTML = 'Sistema recuperado - tente novamente';
            
            return true;
        };
    }
    
    console.log('✅ Sistema de mídia recuperado');
    alert('🔄 SISTEMA DE MÍDIA RECUPERADO!\n\nTente adicionar fotos novamente.');
    
    return true;
};

// Executar recuperação após 3 segundos
setTimeout(() => {
    if (typeof window.handleNewMediaFiles !== 'function') {
        console.log('🚨 Sistema de mídia não carregou. Iniciando recuperação...');
        window.recoverMediaSystem();
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
