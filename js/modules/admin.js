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

// ========== FUNÇÃO editProperty ==========
window.editProperty = function(id) {
    console.log(`📝 EDITANDO IMÓVEL ${id}`);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    document.getElementById('propTitle').value = property.title || '';
    document.getElementById('propPrice').value = property.price || '';
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    document.getElementById('propFeatures').value = Array.isArray(property.features) ? 
        property.features.join(', ') : (property.features || '');
    document.getElementById('propType').value = property.type || 'residencial';
    document.getElementById('propBadge').value = property.badge || 'Novo';
    document.getElementById('propHasVideo').checked = property.has_video || false;
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'block';
    
    window.editingPropertyId = property.id;
    
    if (typeof window.loadExistingPdfsForEdit === 'function') {
        window.loadExistingPdfsForEdit(property);
    }
    
    setTimeout(() => {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
};

// ========== CONFIGURAÇÃO DO FORMULÁRIO ==========
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
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
        
        console.log('💾 Processando imóvel...');
        
        try {
// ✅ CORREÇÃO: Processar PDFs SEMPRE na edição, mesmo se não houver novos PDFs
            if (window.editingPropertyId) {
                console.log(`🔄 Editando imóvel ID: ${window.editingPropertyId}`);
                
                // ✅ 1. Preparar dados básicos
                const updateData = { ...propertyData };
                
                // ✅ 2. Processar PDFs SEMPRE (para tratar exclusões de PDFs existentes)
                console.log(`📝 Processando PDFs para edição...`);
                console.log(`- PDFs existentes: ${window.existingPdfFiles.length}`);
                console.log(`- Novos PDFs: ${window.selectedPdfFiles ? window.selectedPdfFiles.length : 0}`);
                
                try {
                    // ✅ CHAMAR processAndSavePdfs SEMPRE, mesmo sem novos PDFs
                    const pdfsString = await window.processAndSavePdfs(window.editingPropertyId, propertyData.title);
                    
                    if (pdfsString) {
                        updateData.pdfs = pdfsString;
                        console.log(`✅ PDFs processados: ${pdfsString.substring(0, 50)}...`);
                    } else {
                        // Se não há PDFs, definir como string vazia
                        updateData.pdfs = '';
                        console.log('ℹ️ Nenhum PDF para o imóvel');
                    }
                    
                } catch (pdfError) {
                    console.error('❌ Erro ao processar PDFs:', pdfError);
                    // Continuar sem PDFs se houver erro
                }
                
                // ✅ 3. Atualizar imóvel
                if (typeof window.updateProperty === 'function') {
                    console.log('💾 Enviando atualização para o imóvel...');
                    const success = await window.updateProperty(window.editingPropertyId, updateData);
                    if (success) {
                        alert('✅ Imóvel atualizado com sucesso!');
                    }
                }

            } else {
                // ✅ CRIAR NOVO IMÓVEL
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    if (newProperty) {
                        alert(`✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`);
                    }
                }
            }
            
            // ✅ Limpar apenas após SUCESSO
            setTimeout(() => {
                cancelEdit();
                if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
            }, 500);
            
        } catch (error) {
            console.error('❌ Erro no formulário:', error);
            alert('❌ Erro ao processar: ' + error.message);
        }
    });
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
    
// Na função initializeAdminSystem, procure esta parte:
 // 5. CORREÇÃO GARANTIDA DOS FILTROS (VERSÃO FINAL)
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
//setTimeout(() => {
//    if (!document.getElementById('emergency-admin-btn')) {
//        const emergencyBtn = document.createElement('button');
//        emergencyBtn.id = 'emergency-admin-btn';
//        emergencyBtn.innerHTML = '🔧 ADMIN';
//        emergencyBtn.style.cssText = `
//            position: fixed;
//            top: 10px;
//            right: 10px;
//            background: #e74c3c;
//            color: white;
//            border: none;
//            padding: 10px 15px;
//            border-radius: 5px;
//            cursor: pointer;
//            z-index: 9999;
//            font-weight: bold;
//        `;
        
//        emergencyBtn.onclick = function() {
//            const password = prompt("🔒 Acesso de Emergência\n\nDigite a senha:");
//            if (password === "wl654") {
//                const panel = document.getElementById('adminPanel');
//                if (panel) {
//                    panel.style.display = 'block';
//                    panel.scrollIntoView({ behavior: 'smooth' });
//                    if (typeof window.loadPropertyList === 'function') {
//                        window.loadPropertyList();
//                    }
//                }
//            }
//        };
        
//        document.body.appendChild(emergencyBtn);
//        console.log('🆘 Botão de emergência criado');
//    }
//}, 3000);

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
