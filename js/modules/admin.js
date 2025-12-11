// js/modules/admin.js - SISTEMA ADMINISTRATIVO COMPLETO
console.log('🔧 admin.js carregado - Sistema Administrativo Completo');

// ========== CONFIGURAÇÕES DO ADMIN ==========
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle",
    storageKey: "weberlessa_properties"
};

// ========== FUNÇÕES PRINCIPAIS ==========

// 1. Função para alternar painel admin
function toggleAdminPanel() {
    console.log('🔄 toggleAdminPanel() executada');
    
    const password = prompt("🔒 Acesso Restrito\n\nDigite a senha do corretor:");
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            
            console.log(`✅ Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
            if (!isVisible) {
                // Carregar lista quando abrir
                setTimeout(() => {
                    if (typeof loadPropertyList === 'function') {
                        loadPropertyList();
                    }
                }, 100);
            }
        } else {
            console.error('❌ Painel admin não encontrado');
        }
    } else {
        alert('❌ Senha incorreta!\n\nContate o corretor para acesso.');
    }
}

// 2. Configurar botão admin
function setupAdminButton() {
    console.log('🔧 Configurando botão admin...');
    
    const adminBtn = document.querySelector(`.${ADMIN_CONFIG.buttonClass}`);
    
    if (!adminBtn) {
        console.error('❌ Botão admin não encontrado!');
        return false;
    }
    
    console.log('✅ Botão admin encontrado:', adminBtn);
    
    // Remover qualquer evento anterior
    const newBtn = adminBtn.cloneNode(true);
    adminBtn.parentNode.replaceChild(newBtn, adminBtn);
    
    // Adicionar evento de clique
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Botão admin clicado');
        toggleAdminPanel();
    });
    
    // Adicionar estilo para ser visível
    newBtn.style.cursor = 'pointer';
    newBtn.style.zIndex = '1000';
    
    console.log('✅ Botão admin configurado com sucesso');
    return true;
}

// 3. Inicializar sistema admin completo
function initializeAdminSystem() {
    console.log('🚀 Inicializando sistema admin...');
    
    // Verificar se o painel existe
    const panel = document.getElementById(ADMIN_CONFIG.panelId);
    if (!panel) {
        console.error('❌ Painel admin não encontrado no DOM');
        return false;
    }
    
    // Esconder painel inicialmente
    panel.style.display = 'none';
    console.log('✅ Painel admin inicializado (oculto)');
    
    // Configurar botão
    const buttonReady = setupAdminButton();
    
    if (buttonReady) {
        console.log('✅ Sistema admin completamente inicializado');
        return true;
    } else {
        console.error('❌ Falha ao configurar sistema admin');
        return false;
    }
}

// ========== EXPORTAÇÃO PARA WINDOW ==========
// Exportar funções principais
window.toggleAdminPanel = toggleAdminPanel;
window.setupAdminButton = setupAdminButton;
window.initializeAdminSystem = initializeAdminSystem;

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
// Aguardar DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - inicializando admin...');
        setTimeout(initializeAdminSystem, 500);
    });
} else {
    console.log('🏠 DOM já carregado - inicializando admin agora...');
    setTimeout(initializeAdminSystem, 300);
}

console.log('✅ admin.js pronto com 3 funções principais');
