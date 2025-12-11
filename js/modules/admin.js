// js/modules/admin.js - SISTEMA ADMIN FUNCIONAL
console.log('🔧 admin.js carregado - Sistema Administrativo');
// No início do admin.js, após o console.log inicial
console.log('🔑 VERIFICAÇÃO DE SEGURANÇA ADMIN:');
console.log('- ADMIN_PASSWORD:', window.ADMIN_PASSWORD);
console.log('- SUPABASE_URL:', window.SUPABASE_URL ? '✅ Definido' : '❌ Não definido');
console.log('- Local atual:', window.location.href);

// Verificar se estamos no GitHub Pages (pode ter restrições)
if (window.location.hostname.includes('github.io')) {
    console.log('🌐 Executando no GitHub Pages');
}

// Função auxiliar para debug
window.debugAdmin = function() {
    console.log('🔍 DEBUG ADMIN:');
    console.log('- toggleAdminPanel é função?', typeof window.toggleAdminPanel);
    console.log('- ADMIN_PASSWORD:', window.ADMIN_PASSWORD);
    
    // Testar prompt manualmente
    const testPassword = 'wl654';
    console.log('🧪 Teste de senha:', testPassword === window.ADMIN_PASSWORD);
    
    return typeof window.toggleAdminPanel === 'function';
};

// ========== VARIÁVEIS GLOBAIS DO ADMIN ==========
window.editingPropertyId = null;
window.selectedFiles = [];
window.selectedPdfFiles = [];

// ========== FUNÇÃO PRINCIPAL toggleAdminPanel ==========
window.toggleAdminPanel = function() {
    console.log('🔄 toggleAdminPanel() chamada');
    
    // VERIFICAÇÃO EXTRA DE SEGURANÇA
    if (!window.ADMIN_PASSWORD) {
        console.error('❌ ADMIN_PASSWORD não definida!');
        alert('⚠️ Sistema não configurado corretamente. Recarregue a página.');
        return;
    }
    
    console.log('🔑 ADMIN_PASSWORD disponível:', window.ADMIN_PASSWORD);
    
    // Usar um prompt mais simples
    const password = prompt(`Acesso ao Painel do Corretor\n\nDigite a senha de administrador:`);
    
    if (password === window.ADMIN_PASSWORD) {
        console.log('✅ Senha CORRETA!');
        
        const panel = document.getElementById('adminPanel');
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            console.log(`✅ Painel admin ${isVisible ? 'oculto' : 'exibido'}`);
            
            if (!isVisible) {
                // Carregar lista de imóveis
                setTimeout(() => {
                    if (typeof window.loadPropertyList === 'function') {
                        window.loadPropertyList();
                    }
                    
                    // Configurar formulário
                    if (typeof window.setupForm === 'function') {
                        window.setupForm();
                    }
                }, 100);
            }
        }
    } else {
        console.error('❌ Senha INCORRETA! Digitada:', password, 'Esperada:', window.ADMIN_PASSWORD);
        alert('❌ Senha incorreta!\n\nSenha correta: ' + window.ADMIN_PASSWORD);
    }
};

// ========== CONFIGURAÇÃO BÁSICA DO FORMULÁRIO ==========
window.setupForm = function() {
    console.log('📝 Configurando formulário...');
    const form = document.getElementById('propertyForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('✅ Funcionalidade de adicionar imóvel em desenvolvimento.');
        });
        console.log('✅ Formulário configurado');
    }
};

console.log('✅ Sistema admin carregado');

// ========== FUNÇÃO CANCELAR EDIÇÃO ==========
window.cancelEdit = function() {
    console.log('❌ Cancelando edição...');
    window.editingPropertyId = null;
    
    // Limpar formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset();
        console.log('✅ Formulário limpo');
    }
    
    // Resetar título do formulário
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.textContent = 'Adicionar Novo Imóvel';
    }
    
    // Resetar botão submit
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
    }
    
    // Ocultar botão cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    // Limpar arrays de arquivos
    window.selectedFiles = [];
    window.selectedPdfFiles = [];
    
    // Limpar previews
    const preview = document.getElementById('uploadPreview');
    if (preview) {
        preview.innerHTML = '<p style="color: #666; text-align: center;">Nenhum arquivo selecionado</p>';
    }
    
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (pdfPreview) {
        pdfPreview.innerHTML = '<p style="color: #666; text-align: center;">Nenhum PDF selecionado</p>';
    }
    
    console.log('✅ Edição cancelada completamente');
};

// ========== FUNÇÃO loadPropertyList ==========
window.loadPropertyList = function() {
    console.log('📋 Carregando lista de imóveis...');
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container || !window.properties) {
        console.error('❌ Container ou propriedades não encontrados');
        return;
    }
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = window.properties.length;
    }
    
    if (window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum imóvel cadastrado.</p>';
        return;
    }
    
    window.properties.forEach(property => {
        const features = Array.isArray(property.features) ? 
            property.features : 
            (property.features ? property.features.split(',') : []);
        
        const item = document.createElement('div');
        item.className = 'property-item';
        item.innerHTML = `
            <div style="flex: 1;">
                <strong style="color: var(--primary);">${property.title}</strong><br>
                <small>${property.price} - ${property.location}</small>
                <div style="margin-top: 0.5rem;">
                    ${features.map(f => 
                        `<span style="background: var(--accent); color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.8rem; margin-right: 0.3rem; display: inline-block; margin-bottom: 0.3rem;">${f.trim()}</span>`
                    ).join('')}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProperty(${property.id})" style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
    
    console.log(`✅ ${window.properties.length} imóveis listados`);
};

// ========== FUNÇÕES BÁSICAS DE ADMIN ==========
window.editProperty = function(id) {
    console.log(`📝 Editando imóvel ID: ${id}`);
    alert(`🔧 Edição do imóvel ${id} - Funcionalidade em desenvolvimento`);
};

window.deleteProperty = function(id) {
    console.log(`🗑️ Excluindo imóvel ID: ${id}`);
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
        alert(`✅ Imóvel ${id} excluído (simulação)`);
        // Aqui você conectaria com properties.js depois
    }
};

// ========== CONFIGURAÇÃO DO FORMULÁRIO ==========
window.setupForm = function() {
    console.log('📝 Configurando formulário...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('❌ Formulário não encontrado');
        return;
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('📤 Formulário submetido');
        
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
        
        console.log('📊 Dados do formulário:', propertyData);
        alert('✅ Imóvel salvo com sucesso! (simulação)');
        
        // Limpar formulário
        cancelEdit();
        
        // Atualizar lista
        if (typeof loadPropertyList === 'function') {
            loadPropertyList();
        }
    });
    
    console.log('✅ Formulário configurado');
};

// ========== INICIALIZAÇÃO DO MÓDULO ==========
console.log('✅ Sistema admin básico carregado com funções essenciais');
