// js/modules/admin.js - SISTEMA ADMIN COMPLETO E FUNCIONAL
console.log('🔧 admin.js carregado - Sistema Administrativo Completo');

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
window.selectedFiles = [];
window.selectedPdfFiles = [];

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
window.toggleAdminPanel = function() {
    console.log('🔄 toggleAdminPanel() executada do admin.js');
    
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha de administrador:");
    
    // ✅ CORREÇÃO: Verificar se usuário cancelou (null) ou deixou vazio
    if (password === null) {
        console.log('❌ Usuário cancelou o acesso');
        return; // Sai silenciosamente
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
                // Rolar suavemente até o painel
                setTimeout(() => {
                    panel.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                    console.log('📜 Rolando até o painel admin');
                }, 300);
                
                // Carregar lista quando abrir
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

    // ✅ NOVA LINHA: Limpar PDFs
    if (typeof window.clearPdfsOnCancel === 'function') {
        window.clearPdfsOnCancel();
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

// ========== FUNÇÃO editProperty CORRIGIDA ==========
window.editProperty = function(id) {
    console.log(`📝 EDITANDO IMÓVEL (procurando ID: ${id})`);
    console.log('📋 Todos os IDs disponíveis:', window.properties.map(p => p.id));
    
    // ✅ CORREÇÃO: Procurar pelo ID exato primeiro
    let property = window.properties.find(p => p.id === id);
    
    // ✅ CORREÇÃO 2: Se não encontrar, procurar por ID temporário
    // ✅ CORREÇÃO 2: Se não encontrar, procurar por qualquer referência
    if (!property) {
        console.log(`⚠️ ID ${id} não encontrado, procurando por referência...`);
        
        // Tentar encontrar de várias formas
        property = window.properties.find(p => {
            return p.id === id || 
                   (p.isTemporary && p.originalTempId === id) ||
                   String(p.id) === String(id) ||
                   (p.isTemporary && p.id && String(p.id).includes(String(id))) ||
                   (p.originalTempId && p.originalTempId === String(id));
        });
        
        if (property) {
            console.log(`🔍 Encontrado via referência: "${property.title}"`);
        }
    }
    
    if (!property) {
        alert('❌ Imóvel não encontrado!\n\nRecarregue a página e tente novamente.');
        console.error('❌ Imóvel não encontrado com ID:', id);
        console.log('📋 Propriedades disponíveis:', window.properties);
        return;
    }
    
    console.log(`✅ Imóvel encontrado: "${property.title}" (ID: ${property.id})`);
    
    // Preencher formulário normalmente...
    document.getElementById('propTitle').value = property.title || '';
    document.getElementById('propPrice').value = property.price || '';
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    document.getElementById('propFeatures').value = Array.isArray(property.features) ? 
        property.features.join(', ') : (property.features || '');
    document.getElementById('propType').value = property.type || 'residencial';
    document.getElementById('propBadge').value = property.badge || 'Novo';
    
    // Atualizar interface
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'block';
    
    // ✅ CORREÇÃO IMPORTANTE: Usar o ID CORRETO
    // Se for temporário, usar o ID temporário para edição
    if (property.isTemporary) {
        console.log(`⚠️ Editando imóvel TEMPORÁRIO: ${property.id}`);
        window.editingPropertyId = property.id; // Usar ID temporário
    } else {
        window.editingPropertyId = property.id; // Usar ID real
    }
    
    console.log(`🎯 ID configurado para edição: ${window.editingPropertyId}`);
    
    // ✅ Carregar PDFs existentes
    if (typeof window.loadExistingPdfsForEdit === 'function') {
        window.loadExistingPdfsForEdit(property);
    } else {
        console.log('⚠️ Função loadExistingPdfsForEdit não disponível');
    }
    
    // Rolar até o formulário
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
};

// ========== FUNÇÕES PDF ==========
//REMOVIDO

//REMOVIDO

//REMOVIDO

// ========== CONFIGURAÇÃO DO FORMULÁRIO ==========
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    
// ========== ATUALIZAR FORMULÁRIO (submit event com PDFs)
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('📝 Processando formulário com PDFs...');
    
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
        return;
    }
    
    console.log('💾 Processando imóvel com possível PDF...');
    
    try {
        if (window.editingPropertyId) {
            // ✅ EDIÇÃO: Incluir PDFs se houver
            let finalPropertyData = { ...propertyData };
            
            // Se houver PDFs para processar
            if (typeof window.addPdfHookToUpdateProperty === 'function') {
                const pdfsString = await window.addPdfHookToUpdateProperty(window.editingPropertyId, propertyData);
                if (pdfsString) {
                    finalPropertyData.pdfs = pdfsString;
                    console.log('📄 PDFs incluídos na atualização');
                }
            }
            
            // Atualizar imóvel
            if (typeof window.updateProperty === 'function') {
                const success = await window.updateProperty(window.editingPropertyId, finalPropertyData);
                if (success) {
                    alert('✅ Imóvel atualizado com sucesso!');
                }
            }
            
        } else {
            // ✅ NOVO IMÓVEL: Criar primeiro, depois processar PDFs
            if (typeof window.addNewProperty === 'function') {
                // 1. Criar imóvel no Supabase (sem PDFs ainda)
                const newProperty = await window.addNewProperty(propertyData);
                
                // 2. Se criou com sucesso E tem PDFs, processá-los
                if (newProperty && newProperty.id && 
                    typeof window.addPdfHookToNewProperty === 'function' &&
                    window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
                    
                    console.log(`📎 Processando ${window.selectedPdfFiles.length} PDF(s) para novo imóvel ${newProperty.id}`);
                    
                    // Processar PDFs em segundo plano
                    setTimeout(async () => {
                        await window.addPdfHookToNewProperty(newProperty.id, propertyData);
                        console.log('✅ PDFs processados em segundo plano');
                    }, 1000);
                }
            }
        }
        
        // Limpar e atualizar
        cancelEdit();
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        
    } catch (error) {
        console.error('❌ Erro no formulário:', error);
        alert('❌ Erro ao processar formulário: ' + error.message);
    }
});

// ========== FUNÇÃO PARA RESTAURAR BOTÃO ADMIN ==========
function restoreAdminButton() {
    console.log('🔧 Restaurando botão admin...');
    
    // 1. Procurar TODOS os botões admin
    const adminBtns = document.querySelectorAll('.admin-toggle');
    
    if (!adminBtns || adminBtns.length === 0) {
        console.error('❌ Nenhum botão admin encontrado no DOM');
        
        // Tentar criar um botão de emergência
        createAdminButtonIfMissing();
        return;
    }
    
    console.log(`✅ Encontrado(s) ${adminBtns.length} botão(es) admin`);
    
    // 2. Para CADA botão encontrado
    adminBtns.forEach((btn, index) => {
        console.log(`   ${index + 1}. Botão encontrado:`, btn);
        
        // Verificar se já tem evento
        const hasClickEvent = btn.onclick || 
                             btn.getAttribute('onclick') || 
                             btn._hasAdminListener;
        
        if (hasClickEvent) {
            console.log(`   ⚠️ Botão ${index + 1} já tem evento - limpando...`);
            
            // Remover todos os event listeners antigos
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Atualizar referência
            const currentBtn = newBtn;
            setupAdminButton(currentBtn, index);
            
        } else {
            console.log(`   ✅ Botão ${index + 1} sem evento - configurando...`);
            setupAdminButton(btn, index);
        }
    });
    
    // 3. Verificar se botão responde
    setTimeout(() => {
        console.log('🧪 Testando resposta do botão...');
        testAdminButtonResponse();
    }, 1000);
}

// Função auxiliar: Configurar um botão específico
function setupAdminButton(button, index) {
    // Marcar que este botão já foi configurado
    button._hasAdminListener = true;
    
    // REMOVER todos os event listeners existentes
    const cleanButton = button.cloneNode(true);
    button.parentNode.replaceChild(cleanButton, button);
    
    // ADICIONAR novo event listener DIRETO
    cleanButton.addEventListener('click', function adminButtonHandler(e) {
        console.log(`🖱️ Botão admin ${index + 1} clicado (handler direto)`);
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Chamar a função principal
        if (typeof window.toggleAdminPanel === 'function') {
            window.toggleAdminPanel();
        } else {
            console.error('❌ toggleAdminPanel não encontrado!');
            emergencyAdminAccess();
        }
    }, true); // true = captura phase (executa primeiro)
    
    // Também adicionar onclick como fallback
    cleanButton.onclick = function(e) {
        console.log(`🖱️ Botão admin ${index + 1} (onclick fallback)`);
        e.preventDefault();
        if (window.toggleAdminPanel) window.toggleAdminPanel();
    };
    
    console.log(`   ✅ Botão ${index + 1} configurado com 2 listeners`);
}

// Criar botão se não existir
function createAdminButtonIfMissing() {
    console.log('🛠️ Criando botão admin...');
    
    const adminBtn = document.createElement('button');
    adminBtn.className = 'admin-toggle';
    adminBtn.innerHTML = '<i class="fas fa-user-cog"></i> Acesso Admin';
    adminBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    document.body.appendChild(adminBtn);
    console.log('✅ Botão admin criado');
    
    // Configurar o novo botão
    setupAdminButton(adminBtn, 0);
}

// Testar se botão responde
function testAdminButtonResponse() {
    const adminBtn = document.querySelector('.admin-toggle');
    if (!adminBtn) {
        console.error('❌ Botão não encontrado para teste');
        return;
    }
    
    console.log('🧪 Simulando clique no botão...');
    
    // Disparar evento de clique programaticamente
    try {
        adminBtn.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
        console.log('✅ Evento de clique disparado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao disparar clique:', error);
    }
    
    // Verificar se prompt aparece
    setTimeout(() => {
        console.log('🔍 Verificando se prompt de senha apareceu...');
    }, 500);
}

// ========== FUNÇÃO AUXILIAR: ADICIONAR BOTÃO SINCRONIZAÇÃO ==========
function addSyncButton() {
    console.log('➕ Adicionando botão de sincronização...');
    
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;
    
    // Remover botão antigo se existir
    const oldBtn = document.getElementById('syncButton');
    if (oldBtn) oldBtn.remove();
    
    // Criar novo botão
    const syncBtn = document.createElement('button');
    syncBtn.id = 'syncButton';
    syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar com Supabase';
    syncBtn.style.cssText = `
        background: var(--gold);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
        display: block;
        width: 100%;
        font-weight: bold;
    `;
    
    // Configurar clique
    syncBtn.onclick = function() {
        if (window.syncWithSupabaseManual) {
            window.syncWithSupabaseManual();
        } else {
            alert('Função de sincronização não disponível');
        }
    };
    
    // Adicionar após o título do painel
    const panelTitle = adminPanel.querySelector('h3');
    if (panelTitle) {
        panelTitle.parentNode.insertBefore(syncBtn, panelTitle.nextSibling);
    }
    
    console.log('✅ Botão de sincronização adicionado');
}
    
// ========== INICIALIZAÇÃO DO SISTEMA ADMIN ==========
// ========== INICIALIZAÇÃO DO SISTEMA ADMIN ==========
// ========== INICIALIZAÇÃO DO SISTEMA ADMIN ==========
function initializeAdminSystem() {
    console.log('🚀 Inicializando sistema admin (REPARAÇÃO)...');
    
    // 1. REPARAR BOTÃO ADMIN (CRÍTICO)
    console.log('🔧 Reparando botão admin...');
    const adminBtn = document.querySelector('.admin-toggle');
    
    if (adminBtn) {
        // REMOVER completamente e criar novo
        adminBtn.remove();
    }
    
    // CRIAR NOVO BOTÃO DO ZERO
    const newAdminBtn = document.createElement('button');
    newAdminBtn.className = 'admin-toggle';
    newAdminBtn.innerHTML = '<i class="fas fa-user-cog"></i>';
    newAdminBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 24px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(newAdminBtn);
    
    // CONFIGURAR CLIQUE DIRETO
    newAdminBtn.onclick = function() {
        console.log('🖱️ Botão admin clicado (REPARADO)');
        if (window.toggleAdminPanel) {
            window.toggleAdminPanel();
        } else {
            alert('❌ Função toggleAdminPanel não encontrada!');
        }
    };
    
    console.log('✅ Botão admin REPARADO');
    
    // 2. Esconder painel inicialmente
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
        console.log('✅ Painel admin oculto');
    }
    
    // 3. Configurar formulário (usando a função JÁ EXISTENTE)
    console.log('📝 Configurando formulário...');
    if (typeof window.setupForm === 'function') {
        window.setupForm();
        console.log('✅ Formulário configurado (via setupForm)');
    } else {
        console.error('❌ window.setupForm não encontrada!');
    }
    
    // 4. Adicionar botão de sincronização (usando função existente)
    console.log('🔄 Adicionando botão sincronização...');
    addSyncButton();
    
    console.log('✅ Sistema admin REPARADO com sucesso!');
}

// ========== EXECUTAR INICIALIZAÇÃO ==========
// Aguardar DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeAdminSystem, 500);
    });
} else {
    setTimeout(initializeAdminSystem, 300);
}

// ✅ CORREÇÃO: Função de sincronização com tratamento melhorado
window.syncWithSupabaseManual = async function() {
    console.log('🔄 Sincronização manual iniciada...');
    
    // Desabilitar botão temporariamente
    const syncBtn = document.getElementById('syncButton');
    const originalText = syncBtn ? syncBtn.innerHTML : '';
    
    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando conexão...';
    }
    
    try {
        // 1. Primeiro testar a conexão
        console.log('🔍 Testando conexão antes de sincronizar...');
        
        if (typeof window.testSupabaseConnectionSimple === 'function') {
            const testResult = await window.testSupabaseConnectionSimple();
            
            if (!testResult.connected) {
                alert(`❌ Não foi possível conectar ao Supabase!\n\nErro: ${testResult.error || 'Desconhecido'}\n\nVerifique:\n1. Configurações CORS no Supabase\n2. URL do projeto\n3. Chave de API`);
                
                if (syncBtn) {
                    syncBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro de Conexão';
                    setTimeout(() => {
                        syncBtn.disabled = false;
                        syncBtn.innerHTML = originalText;
                    }, 3000);
                }
                return;
            }
        }
        
        // 2. Se conexão OK, prosseguir com sincronização
        if (syncBtn) {
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }
        
        if (typeof window.syncWithSupabase === 'function') {
            const result = await window.syncWithSupabase();
            
            if (result && result.success) {
                const message = result.count > 0 
                    ? `✅ ${result.count} novos imóveis sincronizados!`
                    : '✅ Já está sincronizado com o servidor.';
                
                alert(message);
                
                // Atualizar lista no admin
                if (typeof window.loadPropertyList === 'function') {
                    window.loadPropertyList();
                }
            } else {
                alert(`⚠️ Sincronização falhou!\n\n${result?.error || 'Erro desconhecido'}`);
            }
        } else {
            alert('❌ Função de sincronização não disponível!');
            console.error('window.syncWithSupabase não é uma função');
        }
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        alert(`❌ Erro crítico: ${error.message}`);
    } finally {
        // Reabilitar botão
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = originalText;
        }
    }
};

// ✅ CORREÇÃO: Atualizar o botão para usar a nova função
function addSyncButton() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;
    
    // Verificar se já existe
    if (document.getElementById('syncButton')) {
        const existingBtn = document.getElementById('syncButton');
        existingBtn.onclick = window.syncWithSupabaseManual;
        return;
    }
    
    // Criar botão
    const syncButton = document.createElement('button');
    syncButton.id = 'syncButton';
    syncButton.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
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
    
    // Adicionar após o título do painel
    const panelTitle = adminPanel.querySelector('h3');
    if (panelTitle) {
        panelTitle.parentNode.insertBefore(syncButton, panelTitle.nextSibling);
    }
    
    console.log('✅ Botão de sincronização corrigido');
}

// ========== FUNÇÕES PDF ==========
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

// ========== FUNÇÕES DE INTEGRAÇÃO COM PDF ==========

// Carregar PDFs ao editar imóvel
window.loadPdfsForEdit = function(property) {
    if (typeof window.loadExistingPdfsForEdit === 'function') {
        window.loadExistingPdfsForEdit(property);
    }
};

// Obter PDFs para salvar
window.getPdfsForSave = function() {
    if (typeof window.getPdfUrlsToSave === 'function') {
        return window.getPdfUrlsToSave();
    }
    return '';
};

// Limpar PDFs ao cancelar
window.clearPdfsOnCancel = function() {
    if (typeof window.clearAllPdfs === 'function') {
        window.clearAllPdfs();
    }
};

console.log('✅ admin.js pronto e aguardando inicialização');

// ========== FUNÇÃO PARA CORRIGIR FILTROS VISUAIS ==========
window.fixFilterVisuals = function() {
    console.log('🎨 Corrigindo indicador visual dos filtros...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        console.log('⚠️ Nenhum botão de filtro encontrado');
        return;
    }
    
    // Para CADA botão de filtro
    filterButtons.forEach(button => {
        // Remove event listeners antigos clonando o botão
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Adiciona NOVO event listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎯 Filtro clicado:', this.textContent.trim());
            
            // 1. Remove 'active' de TODOS os botões
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                console.log(`   - Removido 'active' de: ${btn.textContent.trim()}`);
            });
            
            // 2. Adiciona 'active' apenas ao clicado
            this.classList.add('active');
            console.log(`   - Adicionado 'active' em: ${this.textContent.trim()}`);
            
            // 3. Executa o filtro
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            if (typeof window.renderProperties === 'function') {
                console.log(`   - Executando filtro: ${filter}`);
                window.renderProperties(filter);
            } else {
                console.error('❌ window.renderProperties não encontrado!');
            }
        });
    });
    
    console.log(`✅ ${filterButtons.length} botões de filtro configurados`);
};

// ========== CORREÇÃO DE EMERGÊNCIA DOS FILTROS ==========
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🆘 Aplicando correção de emergência para filtros...');
        
        // Forçar reconfiguração completa dos filtros
        const forceFixFilters = function() {
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach((btn, index) => {
                btn.style.border = '2px solid red'; // Para verificação visual
                btn.onclick = function() {
                    // Remove active de todos
                    buttons.forEach(b => {
                        b.classList.remove('active');
                        b.style.backgroundColor = '';
                    });
                    
                    // Adiciona ao clicado
                    this.classList.add('active');
                    this.style.backgroundColor = 'var(--primary)';
                    
                    // Filtra
                    const filter = this.textContent.trim() === 'Todos' ? 'todos' : this.textContent.trim();
                    if (window.renderProperties) window.renderProperties(filter);
                };
            });
            console.log(`🆘 ${buttons.length} botões corrigidos via emergência`);
        };
        
        // Executar após 2 segundos
        setTimeout(forceFixFilters, 2000);
    }, 500);
});

// ========== FUNÇÃO 1: FORÇAR CORREÇÃO DO BOTÃO ==========
function forceAdminButtonFix() {
    console.log('🛠️ CORREÇÃO FORÇADA DO BOTÃO ADMIN');
    
    // Remover TODOS os botões existentes
    const oldButtons = document.querySelectorAll('.admin-toggle');
    oldButtons.forEach(btn => btn.remove());
    
    // Criar NOVO botão do zero
    const newAdminBtn = document.createElement('button');
    newAdminBtn.className = 'admin-toggle';
    newAdminBtn.id = 'admin-button-fixed';
    newAdminBtn.innerHTML = '<i class="fas fa-user-cog"></i>';
    
    // Estilo ABSOLUTO (não pode falhar)
    newAdminBtn.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        background: #667eea !important;
        color: white !important;
        border: none !important;
        border-radius: 50% !important;
        width: 60px !important;
        height: 60px !important;
        font-size: 24px !important;
        cursor: pointer !important;
        z-index: 99999 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    `;
    
    // Adicionar ao body
    document.body.appendChild(newAdminBtn);
    console.log('✅ NOVO botão admin criado');
    
    // ✅ EVENT LISTENER DIRETO E SIMPLES
    newAdminBtn.onclick = function(e) {
        console.log('🖱️ CLIQUE NO BOTÃO ADMIN DETECTADO!');
        e.preventDefault();
        e.stopPropagation();
        
        const password = prompt("🔒 ACESSO AO PAINEL DO CORRETOR\n\nDigite a senha de administrador:");
        
        if (password === "wl654") {
            const panel = document.getElementById('adminPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
                console.log('✅ Painel admin: ' + (panel.style.display === 'block' ? 'ABERTO' : 'FECHADO'));
                
                if (panel.style.display === 'block') {
                    panel.scrollIntoView({ behavior: 'smooth' });
                    if (window.loadPropertyList) setTimeout(() => window.loadPropertyList(), 300);
                }
            }
        } else if (password !== null) {
            alert('❌ Senha incorreta!');
        }
    };
    
    console.log('✅ Event listener configurado DIRETAMENTE no onclick');
}
    
// ========== CORREÇÃO DE EMERGÊNCIA - ACESSO AO ADMIN ==========
(function emergencyAdminFix() {
    console.log('🆘 Aplicando correção de emergência para admin...');
    
    // Esperar 3 segundos após carregar
    setTimeout(() => {
        // 1. Verificar se botão existe e funciona
        const adminBtn = document.querySelector('.admin-toggle');
        
        if (!adminBtn) {
            console.log('❌ Botão não encontrado - criando...');
            createEmergencyAdminButton();
            return;
        }
        
        // 2. Testar se o clique funciona
        console.log('🧪 Testando botão admin...');
        try {
            adminBtn.click();
            console.log('✅ Botão respondendo ao clique');
        } catch (error) {
            console.log('❌ Botão não funciona - recriando...');
            createEmergencyAdminButton();
        }
        
    }, 3000);
    
    function createEmergencyAdminButton() {
        // Criar botão de emergência
        const emergencyBtn = document.createElement('button');
        emergencyBtn.id = 'emergency-admin-btn';
        emergencyBtn.innerHTML = '🔧 ADMIN (EMERGÊNCIA)';
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
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        `;
        
        emergencyBtn.onclick = function() {
            const password = prompt("🔒 Acesso de Emergência ao Painel\n\nDigite a senha:");
            if (password === "wl654") {
                const panel = document.getElementById('adminPanel');
                if (panel) {
                    panel.style.display = 'block';
                    alert('✅ Painel admin aberto via emergência');
                    
                    // Rolar até o painel
                    panel.scrollIntoView({ behavior: 'smooth' });
                    
                    // Carregar lista
                    if (typeof window.loadPropertyList === 'function') {
                        window.loadPropertyList();
                    }
                }
            } else if (password !== null) {
                alert('❌ Senha incorreta!');
            }
        };
        
        document.body.appendChild(emergencyBtn);
        console.log('🆘 Botão de emergência criado no topo direito');
    }
})();    
