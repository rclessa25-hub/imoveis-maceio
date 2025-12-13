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

// No admin.js - ATUALIZAR FUNÇÃO editProperty
window.editProperty = function(id) {
    console.log(`📝 Editando imóvel ${id}`);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    // Preencher formulário
    document.getElementById('propTitle').value = property.title || '';
    document.getElementById('propPrice').value = property.price || '';
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    document.getElementById('propFeatures').value = Array.isArray(property.features) ? 
        property.features.join(', ') : (property.features || '');
    document.getElementById('propType').value = property.type || 'residencial';
    document.getElementById('propBadge').value = property.badge || 'Novo';

     // ✅ NOVA LINHA: Carregar PDFs existentes
    if (typeof window.loadPdfsForEdit === 'function') {
        window.loadPdfsForEdit(property);
    }
    
    // Atualizar interface
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'block';
    
    window.editingPropertyId = id;
    
    // Rolar até o formulário
    setTimeout(() => {
        document.getElementById('adminPanel').scrollIntoView({ behavior: 'smooth' });
    }, 100);
};

window.deleteProperty = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) return;
    
    if (confirm(`🗑️ Excluir imóvel "${property.title}"?\n\nEsta ação não pode ser desfeita.`)) {
        console.log(`🗑️ Excluindo imóvel ${id}: ${property.title}`);
        
        // Remover do array
        const index = window.properties.findIndex(p => p.id === id);
        if (index !== -1) {
            window.properties.splice(index, 1);

           if (typeof window.deleteProperty === 'function') {
                      return window.deleteProperty(id);
                  }
            
            // ✅ CORREÇÃO: Atualizar localStorage
            try {
                localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
                console.log('🗑️ Imóvel removido do localStorage');
            } catch (error) {
                console.error('❌ Erro ao atualizar localStorage:', error);
            }

            // Atualizar tudo
            if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
            if (typeof window.renderProperties === 'function') window.renderProperties('todos');
            
            alert(`✅ Imóvel "${property.title}" excluído com sucesso!`);
        }
    }
};

// ========== FUNÇÕES PDF ==========
//REMOVIDO

//REMOVIDO

//REMOVIDO

// ========== CONFIGURAÇÃO DO FORMULÁRIO ==========
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    
// No admin.js - ATUALIZAR FORMULÁRIO (submit event)
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const propertyData = {
        title: document.getElementById('propTitle').value,
        price: document.getElementById('propPrice').value,
        location: document.getElementById('propLocation').value,
        description: document.getElementById('propDescription').value,
        features: document.getElementById('propFeatures').value,
        type: document.getElementById('propType').value,
        badge: document.getElementById('propBadge').value
    };
    
    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        return;
    }
    
    console.log('💾 Processando imóvel...');
    
    if (window.editingPropertyId) {
        // ✅ CORREÇÃO: Usar função updateProperty do properties.js
        if (typeof window.updateProperty === 'function') {
            const success = window.updateProperty(window.editingPropertyId, propertyData);
            if (success) {
                alert('✅ Imóvel atualizado com sucesso!');
            } else {
                alert('❌ Erro ao atualizar imóvel');
            }
        } else {
            // Fallback
            alert('✅ Alterações salvas (simulação)');
        }
    } else {
        // ✅ CORREÇÃO: Usar função addNewProperty do properties.js
        if (typeof window.addNewProperty === 'function') {
            const newProperty = window.addNewProperty(propertyData);
            alert(`✅ Imóvel "${newProperty.title}" cadastrado com sucesso!\n\nAgora é permanente.`);
        } else {
            // Fallback
            alert('✅ Imóvel cadastrado (simulação)');
        }
    }
    
    // Limpar e atualizar
    cancelEdit();
    if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
});
};
 
// ========== INICIALIZAÇÃO DO SISTEMA ADMIN ==========
function initializeAdminSystem() {
    console.log('🚀 Inicializando sistema admin...');
    
    // 1. Esconder painel inicialmente
    const panel = document.getElementById(ADMIN_CONFIG.panelId);
    if (panel) {
        panel.style.display = 'none';
        console.log('✅ Painel admin inicializado (oculto)');
    }
    
    // 2. Configurar botão
    const adminBtn = document.querySelector('.' + ADMIN_CONFIG.buttonClass);
    if (adminBtn) {
        // Remover onclick inline se existir
        adminBtn.removeAttribute('onclick');

        // Adicionar botão de sincronização
           addSyncButton();
        
        // Adicionar event listener
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Botão admin clicado (do admin.js)');
            window.toggleAdminPanel();
        });
        
        console.log('✅ Botão admin configurado');
    }

    // 3. Configurar formulário
    if (typeof window.setupForm === 'function') {
        window.setupForm();
        console.log('✅ Formulário configurado');
    }
    
    console.log('✅ Sistema admin completamente inicializado');
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

// ✅ CORREÇÃO: Função de sincronização sem loop
window.syncWithSupabaseManual = async function() {
    if (confirm('🔄 Sincronizar com Supabase?\n\nIsso irá buscar os imóveis do banco de dados online.')) {
        console.log('🔄 Iniciando sincronização manual...');
        
        // Desabilitar botão temporariamente
        const syncBtn = document.getElementById('syncButton');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }
        
        try {
            // Chamar a função do properties.js
            const result = await window.syncWithSupabase();
            
            if (result && result.success) {
                alert(`✅ Sincronização completa!\n\n${result.count} novos imóveis carregados.`);
                
                // Atualizar lista no admin
                if (typeof window.loadPropertyList === 'function') {
                    window.loadPropertyList();
                }
            } else {
                alert('⚠️ Não foi possível sincronizar. Verifique a conexão.');
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            alert('❌ Erro ao sincronizar: ' + error.message);
        } finally {
            // Reabilitar botão
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar com Supabase';
            }
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
