// js/modules/admin.js - SISTEMA ADMIN FUNCIONAL
console.log('🔧 admin.js carregado - Sistema Administrativo');

// ========== CONFIGURAÇÕES ==========
const ADMIN_CONFIG = {
    password: "wl654",
    pdfPassword: "doc123",
    panelId: "adminPanel",
    buttonClass: "admin-toggle",
    storageKey: "weberlessa_properties"
};

// ========== VARIÁVEIS GLOBAIS DO ADMIN ==========
window.editingPropertyId = null;
window.selectedFiles = [];
window.selectedPdfFiles = [];

// ========== FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL ==========
// ========== FUNÇÃO toggleAdminPanel() CORRIGIDA ==========
function window.toggleAdminPanel() {
    const password = prompt("Digite a senha de acesso ao painel:");
    if (password === ADMIN_PASSWORD) {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') {
                // LIMPAR FORMULÁRIO AO ABRIR PAINEL
                cancelEdit(); // Chama a função que limpa tudo
                loadPropertyList();
                
                // GARANTIR QUE O UPLOAD FUNCIONE
                setTimeout(() => {
                    setupUploadSystem();
                    setupPdfUploadSystem();
                }, 300);
            }
        }
    } else {
        alert("Senha incorreta!");
    }
}

// ========== SUBSTITUIR A FUNÇÃO toggleAdminPanel ==========
const window.originalToggleAdminPanel = toggleAdminPanel;
toggleAdminPanel = function() {
    const password = prompt("Digite a senha de acesso ao painel:");
    if (password === ADMIN_PASSWORD) {
        originalToggleAdminPanel();
        
        // Após abrir painel, configurar monitor
        setTimeout(() => {
            setupAdminMonitor();
        }, 300);
    } else {
        alert("Senha incorreta!");
    }
};

// ========== INICIALIZAR QUANDO ADMIN ABRIR ==========
// Monitorar quando o painel ficar visível
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel && adminPanel.style.display === 'block') {
                setTimeout(() => {
                    setupAdminMonitor();
                    addMonitorControls();
                }, 500);
            }
        }
    });
});

// ========== FUNÇÕES DO FORMULÁRIO ==========
// ========== FUNÇÃO CANCELAR EDIÇÃO ==========
// ========== FUNÇÃO cancelEdit() COMPLETA E CORRIGIDA ==========
function window.cancelEdit() {
    console.log('❌ Cancelando edição...');
    
    editingPropertyId = null;
    
    // 1. LIMPAR FORMULÁRIO COMPLETAMENTE
    const form = document.getElementById('propertyForm');
    if (form) {
        form.reset(); // Isso limpa inputs, textareas, selects
        
        // Limpar manualmente campos que form.reset() não limpa completamente
        document.getElementById('propTitle').value = '';
        document.getElementById('propPrice').value = '';
        document.getElementById('propLocation').value = '';
        document.getElementById('propDescription').value = ''; // CORREÇÃO CRÍTICA
        document.getElementById('propFeatures').value = '';
        document.getElementById('propType').selectedIndex = 0;
        document.getElementById('propBadge').selectedIndex = 0;
        document.getElementById('propHasVideo').checked = false;
    }
    
    // 2. ATUALIZAR TÍTULO
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.textContent = 'Adicionar Novo Imóvel';
    }
    
    // 3. ATUALIZAR BOTÃO
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
    }
    
    // 4. ESCONDER BOTÃO CANCELAR
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    // 5. LIMPAR ARQUIVOS SELECIONADOS
    selectedFiles = [];
    selectedPdfFiles = [];
    
    // 6. LIMPAR PREVIEWS DE IMAGENS
    const preview = document.getElementById('uploadPreview');
    if (preview) {
        preview.innerHTML = '<p style="color: #666; text-align: center;">Nenhum arquivo selecionado</p>';
    }
    
    // 7. LIMPAR PREVIEWS DE PDFs
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (pdfPreview) {
        pdfPreview.innerHTML = '<p style="color: #666; text-align: center;">Nenhum PDF selecionado</p>';
    }
    
    // 8. LIMPAR INPUTS DE ARQUIVO
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const pdfFileInput = document.getElementById('pdfFileInput');
    if (pdfFileInput) {
        pdfFileInput.value = '';
    }
    
    // 9. RECONFIGURAR SISTEMAS DE UPLOAD
    setTimeout(() => {
        setupUploadSystem(); // Reconfigurar click
        setupPdfUploadSystem(); // Reconfigurar PDFs
    }, 100);
    
    console.log('✅ Edição cancelada - Formulário completamente limpo');
}

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

// ========== FUNÇÕES BÁSICAS DE ADMIN ==========
// ========== CORREÇÃO DA FUNÇÃO EDIT PROPERTY PARA FOTOS ==========
// ========== FUNÇÃO editProperty() COMPLETA E CORRIGIDA ==========
function editProperty(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;

    editingPropertyId = id;
    
    // Preencher formulário
    document.getElementById('propTitle').value = property.title || '';
    document.getElementById('propPrice').value = property.price || '';
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    
    const features = Array.isArray(property.features) 
        ? property.features 
        : (property.features || '');
    document.getElementById('propFeatures').value = Array.isArray(features) ? features.join(', ') : features;
    
    document.getElementById('propType').value = property.type || 'residencial';
    document.getElementById('propBadge').value = property.badge || 'Novo';
    
    document.getElementById('propHasVideo').checked = property.has_video || false;
    
    // Atualizar título do formulário
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.textContent = 'Editar Imóvel';
    }
    
    // Atualizar texto do botão
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Imóvel';
    }
    
    // Mostrar botão cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'block';
    }
    
    // CORREÇÃO: Inicializar arrays vazios mas manter referência para adições futuras
    selectedFiles = [];
    
    // CORREÇÃO: Mostrar imagens existentes se houver - COM SEPARAÇÃO ENTRE EXISTENTES E NOVAS
    const preview = document.getElementById('uploadPreview');
    if (preview) {
        preview.innerHTML = '';
        
        if (property.images && property.images.length > 0 && property.images !== 'EMPTY') {
            const existingImages = property.images.split(',').filter(img => img.trim() !== '');
            
            // CORREÇÃO: Criar uma área separada para imagens existentes
            preview.innerHTML = '<div id="existingImagesSection">';
            preview.innerHTML += '<p style="color: var(--success); margin-bottom: 1rem;">📸 Fotos atuais do imóvel (clique no X para excluir):</p>';
            
            // Container para imagens existentes
            const existingContainer = document.createElement('div');
            existingContainer.style.display = 'flex';
            existingContainer.style.gap = '10px';
            existingContainer.style.flexWrap = 'wrap';
            existingContainer.style.marginBottom = '1.5rem';
            
            existingImages.forEach((imgUrl, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-preview-container';
                imgContainer.innerHTML = `
                    <img src="${imgUrl}" 
                         style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 2px solid var(--success);"
                         onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                    <button class="delete-image-btn" onclick="deleteExistingImage(${property.id}, ${index})" 
                            title="Excluir esta foto">×</button>
                    <div style="font-size: 0.7rem; text-align: center; margin-top: 5px; max-width: 100px; word-break: break-all;">Foto ${index + 1}</div>
                `;
                existingContainer.appendChild(imgContainer);
            });
            
            preview.appendChild(existingContainer);
            preview.innerHTML += '</div>';
            
            // CORREÇÃO: Adicionar seção para novas imagens
            const newImagesSection = document.createElement('div');
            newImagesSection.id = 'newImagesSection';
            newImagesSection.innerHTML = '<p style="color: #3498db; margin: 1.5rem 0 1rem;">📸 Novas fotos a serem adicionadas:</p>';
            preview.appendChild(newImagesSection);
            
            // Armazenar URLs das imagens existentes para referência futura
            property.existingImageUrls = existingImages;
            
        } else {
            preview.innerHTML = '<p style="color: #666; text-align: center;">Nenhuma foto cadastrada</p>';
            
            // CORREÇÃO: Adicionar seção para novas imagens mesmo quando não há existentes
            const newImagesSection = document.createElement('div');
            newImagesSection.id = 'newImagesSection';
            newImagesSection.innerHTML = '<p style="color: #3498db; margin: 1.5rem 0 1rem;">📸 Novas fotos a serem adicionadas:</p>';
            preview.appendChild(newImagesSection);
        }
    }
    
    // CORREÇÃO: Mostrar PDFs existentes se houver - COM SEPARAÇÃO ENTRE EXISTENTES E NOVOS
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (pdfPreview) {
        pdfPreview.innerHTML = '';
        
        // CORREÇÃO: Verificar se há PDFs de forma segura
        const hasPdfs = property.pdfs && 
                       property.pdfs !== 'EMPTY' && 
                       property.pdfs !== 'null' && 
                       property.pdfs !== 'undefined' &&
                       property.pdfs.trim() !== '';
        
        console.log('📄 Editando imóvel - Tem PDFs?', hasPdfs, 'PDFs:', property.pdfs);
        
        if (hasPdfs) {
            const existingPdfs = property.pdfs.split(',').filter(url => url.trim() !== '');
            
            // CORREÇÃO: Criar uma área separada para PDFs existentes
            pdfPreview.innerHTML = '<div id="existingPdfsSection">';
            pdfPreview.innerHTML += '<p style="color: var(--success); margin-bottom: 1rem;">📄 Documentos atuais do imóvel (clique no X para excluir):</p>';
            
            const existingPdfContainer = document.createElement('div');
            existingPdfContainer.style.display = 'flex';
            existingPdfContainer.style.gap = '10px';
            existingPdfContainer.style.flexWrap = 'wrap';
            existingPdfContainer.style.marginBottom = '1.5rem';
            
            existingPdfs.forEach((pdfUrl, index) => {
                // Extrair nome do arquivo da URL
                const fileName = pdfUrl.split('/').pop() || `Documento ${index + 1}`;
                
                const pdfContainer = document.createElement('div');
                pdfContainer.className = 'image-preview-container';
                pdfContainer.innerHTML = `
                    <div style="background: #f0f0f0; padding: 1rem; border-radius: 5px; text-align: center; width: 100px; height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative;">
                        <i class="fas fa-file-pdf" style="font-size: 2rem; color: #e74c3c;"></i>
                        <p style="margin: 0.5rem 0 0; font-size: 0.7rem; word-break: break-all;">${fileName}</p>
                    </div>
                    <button class="delete-image-btn" onclick="deleteExistingPdf(${property.id}, ${index})" 
                            title="Excluir este documento">×</button>
                    <div style="font-size: 0.7rem; text-align: center; margin-top: 5px; max-width: 100px; word-break: break-all;">Doc ${index + 1}</div>
                `;
                existingPdfContainer.appendChild(pdfContainer);
            });
            
            pdfPreview.appendChild(existingPdfContainer);
            pdfPreview.innerHTML += '</div>';
            
            // CORREÇÃO: Adicionar seção para novos PDFs
            const newPdfsSection = document.createElement('div');
            newPdfsSection.id = 'newPdfsSection';
            newPdfsSection.innerHTML = '<p style="color: #3498db; margin: 1.5rem 0 1rem;">📄 Novos documentos a serem adicionados:</p>';
            pdfPreview.appendChild(newPdfsSection);
            
            // Armazenar URLs dos PDFs existentes para referência futura
            property.existingPdfUrls = existingPdfs;
            
        } else {
            pdfPreview.innerHTML = '<p style="color: #666; text-align: center;">Nenhum documento PDF cadastrado</p>';
            
            // CORREÇÃO: Adicionar seção para novos PDFs mesmo quando não há existentes
            const newPdfsSection = document.createElement('div');
            newPdfsSection.id = 'newPdfsSection';
            newPdfsSection.innerHTML = '<p style="color: #3498db; margin: 1.5rem 0 1rem;">📄 Novos documentos a serem adicionados:</p>';
            pdfPreview.appendChild(newPdfsSection);
        }
    }

// ========== FUNÇÃO PARA DELETAR IMÓVEL ==========
function deleteProperty(id) {
    if (!confirm('Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        // Remover do array local
        const index = properties.findIndex(p => p.id === id);
        if (index !== -1) {
            properties.splice(index, 1);
            
            // Atualizar localStorage
            localStorage.setItem('weberlessa_properties', JSON.stringify(properties));
            
            // Atualizar Supabase
            fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }).then(response => {
                if (response.ok) {
                    console.log('✅ Imóvel excluído do Supabase');
                }
            }).catch(error => {
                console.log('⚠️ Erro ao excluir do Supabase, mas continuando...', error);
            });
            
            // Recarregar a lista
            loadPropertyList();
            renderProperties();
            
            alert('✅ Imóvel excluído com sucesso!');
        }
    } catch (error) {
        console.error('❌ Erro ao excluir imóvel:', error);
        alert('❌ Erro ao excluir o imóvel. Tente novamente.');
    }
}
        
// ========== FUNÇÃO AUXILIAR PARA EXCLUIR DO STORAGE ==========
async function deleteFromStorage(imageUrl) {
    try {
        // Extrair o nome do arquivo da URL
        const fileName = imageUrl.split('/').pop();
        if (!fileName || fileName === 'EMPTY') return false;

        const response = await fetch(
            `${SUPABASE_URL}/storage/v1/object/properties/${fileName}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY
                }
            }
        );

        return response.ok;
    } catch (error) {
        console.error('❌ Erro ao excluir do storage:', error);
        return false;
    }
}
    
// ========== FUNÇÕES PDF ==========
// ========== SISTEMA DE DOCUMENTOS PDF ==========
let currentPdfPropertyId = null;
// Mostrar modal de PDF
function showPdfModal(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    currentPdfPropertyId = propertyId;
    const modal = document.getElementById('pdfModal');
    const title = document.getElementById('pdfModalTitle');
    const preview = document.getElementById('pdfPreview');
    
    if (title) {
        title.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos - ${property.title}`;
    }
    
    if (preview) {
        if (property.pdfs && property.pdfs.length > 0) {
            const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
            preview.innerHTML = `
                <p><strong>${pdfUrls.length} documento(s) disponível(is):</strong></p>
                ${pdfUrls.map((url, index) => `
                    <div class="pdf-file-item">
                        <i class="fas fa-file-pdf" style="color: #e74c3c;"></i>
                        <span>Documento ${index + 1}</span>
                    </div>
                `).join('')}
            `;
        } else {
            preview.innerHTML = '<p>Nenhum documento disponível para este imóvel.</p>';
        }
    }
    
    // Resetar senha
    const passwordInput = document.getElementById('pdfPassword');
    if (passwordInput) passwordInput.value = '';
    
    modal.style.display = 'flex';
}

// Fechar modal
function closePdfModal() {
    const modal = document.getElementById('pdfModal');
    modal.style.display = 'none';
    currentPdfPropertyId = null;
}

// Acessar documentos com senha
function accessPdfDocuments() {
    const passwordInput = document.getElementById('pdfPassword');
    const password = passwordInput ? passwordInput.value : '';
    
    if (password !== PDF_PASSWORD) {
        alert('❌ Senha incorreta! Solicite a senha ao corretor.');
        return;
    }
    
    const property = properties.find(p => p.id === currentPdfPropertyId);
    if (!property || !property.pdfs) {
        alert('❌ Nenhum documento disponível para este imóvel.');
        return;
    }
    
    // Abrir todos os PDFs em novas abas
    const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
    pdfUrls.forEach(url => {
        window.open(url, '_blank');
    });
    
    closePdfModal();
    alert('✅ Documentos abertos com sucesso!');
}
        
// ========== SISTEMA DE DOCUMENTOS PDF ==========
let currentPdfPropertyId = null;
// Mostrar modal de PDF
function showPdfModal(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    currentPdfPropertyId = propertyId;
    const modal = document.getElementById('pdfModal');
    const title = document.getElementById('pdfModalTitle');
    const preview = document.getElementById('pdfPreview');
    
    if (title) {
        title.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos - ${property.title}`;
    }
    
    if (preview) {
        if (property.pdfs && property.pdfs.length > 0) {
            const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
            preview.innerHTML = `
                <p><strong>${pdfUrls.length} documento(s) disponível(is):</strong></p>
                ${pdfUrls.map((url, index) => `
                    <div class="pdf-file-item">
                        <i class="fas fa-file-pdf" style="color: #e74c3c;"></i>
                        <span>Documento ${index + 1}</span>
                    </div>
                `).join('')}
            `;
        } else {
            preview.innerHTML = '<p>Nenhum documento disponível para este imóvel.</p>';
        }
    }
    
    // Resetar senha
    const passwordInput = document.getElementById('pdfPassword');
    if (passwordInput) passwordInput.value = '';
    
    modal.style.display = 'flex';
}

// Fechar modal
function closePdfModal() {
    const modal = document.getElementById('pdfModal');
    modal.style.display = 'none';
    currentPdfPropertyId = null;
}

// Acessar documentos com senha
function accessPdfDocuments() {
    const passwordInput = document.getElementById('pdfPassword');
    const password = passwordInput ? passwordInput.value : '';
    
    if (password !== PDF_PASSWORD) {
        alert('❌ Senha incorreta! Solicite a senha ao corretor.');
        return;
    }
    
    const property = properties.find(p => p.id === currentPdfPropertyId);
    if (!property || !property.pdfs) {
        alert('❌ Nenhum documento disponível para este imóvel.');
        return;
    }
    
    // Abrir todos os PDFs em novas abas
    const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
    pdfUrls.forEach(url => {
        window.open(url, '_blank');
    });
    
    closePdfModal();
    alert('✅ Documentos abertos com sucesso!');
}

// ========== FORMULÁRIO CORRIGIDO ==========
function setupForm() {
    const form = document.getElementById('propertyForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const propertyData = {
            title: document.getElementById('propTitle').value,
            price: document.getElementById('propPrice').value,
            location: document.getElementById('propLocation').value,
            description: document.getElementById('propDescription').value,
            features: document.getElementById('propFeatures').value.split(',').map(f => f.trim()).filter(f => f !== ''),
            type: document.getElementById('propType').value,
            has_video: document.getElementById('propHasVideo').checked,
            badge: document.getElementById('propBadge').value,
            rural: document.getElementById('propType').value === 'rural',
            created_at: new Date().toISOString()
        };

        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            alert('❌ Preencha Título, Preço e Localização!');
            return;
        }

        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        try {
            const success = await saveProperty(propertyData);
            
            if (success) {
                alert("✅ Imóvel salvo com sucesso!");
            } else {
                alert("❌ Erro ao salvar o imóvel!");
            }

            this.reset();
            cancelEdit();
            selectedFiles = [];
            selectedPdfFiles = [];
            showNewImagePreview();
            showNewPdfPreview();

        } catch (error) {
            alert("❌ Erro: " + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

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

// ========== INICIALIZAÇÃO DO MÓDULO ==========
console.log('✅ Sistema admin básico carregado com funções essenciais');
console.log('✅ admin.js pronto e aguardando inicialização');

// Verificar se estamos no GitHub Pages (pode ter restrições)
if (window.location.hostname.includes('github.io')) {
    console.log('🌐 Executando no GitHub Pages');
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

/ ========== EXPORTAÇÃO PARA WINDOW ==========
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

console.log('✅ Sistema admin carregado');
