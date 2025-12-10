// js/modules/admin.js - SISTEMA ADMIN MÍNIMO FUNCIONAL
console.log('🔧 admin.js carregado - Sistema Administrativo');

// ========== FUNÇÃO BÁSICA toggleAdminPanel ==========
window.toggleAdminPanel = function() {
    console.log('🔄 toggleAdminPanel() chamada');
    
    // Verificar senha de administrador
    const password = prompt("Digite a senha de acesso ao painel:");
    if (password === window.ADMIN_PASSWORD) {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            console.log(`✅ Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
            // Carregar lista de imóveis quando abrir
            if (!isVisible && typeof window.loadPropertyList === 'function') {
                window.loadPropertyList();
            }
        }
    } else {
        alert("❌ Senha incorreta!");
    }
};

// ========== FUNÇÃO DE FALLBACK ==========
// Garantir que a função exista mesmo se outras partes falharem
if (typeof window.toggleAdminPanel !== 'function') {
    console.warn('⚠️ Definindo fallback para toggleAdminPanel');
    window.toggleAdminPanel = function() {
        alert('🔧 Sistema admin em manutenção. Tente novamente em instantes.');
    };
}

console.log('✅ Sistema admin básico carregado');
