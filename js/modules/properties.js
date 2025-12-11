// js/modules/properties.js - SISTEMA PRINCIPAL DE IMÓVEIS (VERSÃO CORRIGIDA)
console.log('🚀 properties.js carregado - SISTEMA PRINCIPAL');
console.log('🚀 properties.js carregado - MODO OFFLINE');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = window.properties || [];
window.editingPropertyId = null;
window.selectedFiles = [];
window.selectedPdfFiles = [];

// FORÇAR DADOS INICIAIS IMEDIATAMENTE
console.log('🔄 Forçando inicialização de dados...');
window.properties = window.getInitialProperties ? window.getInitialProperties() : [];
console.log(`✅ ${window.properties.length} imóveis carregados localmente`);

// ========== VERIFICAÇÃO DE CARREGAMENTO ==========
console.log('🔍 VERIFICAÇÃO DE CARREGAMENTO:');
console.log('- window.properties definido?', !!window.properties);
console.log('- É array?', Array.isArray(window.properties));
console.log('- SUPABASE_URL:', window.SUPABASE_URL);

// Forçar inicialização se não foi chamada
setTimeout(() => {
    if (!window.properties || window.properties.length === 0) {
        console.log('⚠️ properties vazio - verificando se precisa inicializar...');
        
        // Verificar se o DOM já carregou
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            console.log('🔄 DOM já carregado - chamando initializeProperties...');
            if (typeof window.initializeProperties === 'function') {
                window.initializeProperties().then(() => {
                    console.log('✅ Properties inicializados via timeout');
                });
            }
        }
    }
}, 1000);

// ========== FUNÇÃO 1: getInitialProperties() ==========
window.getInitialProperties = function() {
    return [
        {
            id: 1,
            title: "Casa 2Qtos - Forene",
            price: "R$ 180.000",
            location: "Residência Conj. Portal do Renascer, Forene",
            description: "Casa a 100m do CEASA; - Medindo 6,60m frente X 19m lado; - 125,40m² de área total; -Somente um único dono; - 02 Quartos, Sala; - Cozinha; - 02 Banheiros; - Varanda; - 02 Vagas de garagem; - Água de Poço Artesiano;",
            features: ["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas de carro"],
            type: "residencial",
            has_video: true,
            badge: "Destaque",
            rural: false,
            images: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: "Apartamento 4Qtos (178m²) - Ponta Verde",
            price: "R$ 1.500.000",
            location: "Rua Saleiro Pitão, Ponta Verde - Maceió/AL",
            description: "Apartamento amplo, super claro e arejado, imóvel diferenciado com 178m² de área privativa, oferecendo conforto, espaço e alto padrão de acabamento. 4 Qtos, sendo 03 suítes, sala ampla com varanda, cozinha, dependência de empregada, área de serviço, 02 vagas de garagem no subsolo.",
            features: ["4Qtos s/ 3 suítes", "Sala ampla com varanda", "Cozinha", "Área de serviço", "DCE", "02 vagas de garagem"],
            type: "residencial",
            has_video: false,
            badge: "Luxo",
            rural: false,
            images: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        }
    ];
};

// ========== FUNÇÃO 2: initializeProperties() ==========
window.initializeProperties = async function() {
    console.log('🏠 Inicializando sistema de imóveis...');
    
    // DEBUG: Mostrar estado atual
    console.log('🔍 Estado antes de carregar:');
    console.log('- SUPABASE_URL:', window.SUPABASE_URL ? '✅ Definido' : '❌ Não definido');
    console.log('- properties array:', Array.isArray(window.properties));
    console.log('- properties length:', window.properties.length);
    
    // Se já tem imóveis, apenas retornar
    if (window.properties && window.properties.length > 0) {
        console.log(`✅ ${window.properties.length} imóveis já carregados`);
        return window.properties;
    }
    
    // 1. Tentar carregar do Supabase
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            console.log('📡 Tentando carregar do Supabase...');
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${data.length} imóveis carregados do Supabase`);
                window.properties = Array.isArray(data) ? data : [];
                
                // Salvar backup no localStorage
                localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
                
            } else {
                console.log('⚠️ Supabase não disponível, tentando localStorage...');
                throw new Error('Supabase falhou');
            }
            
        } catch (error) {
            console.log('⚠️ Erro no Supabase:', error.message);
            // Continuar para fallback
        }
    }
    
    // 2. Se não carregou do Supabase, tentar localStorage
    if (window.properties.length === 0) {
        const localData = localStorage.getItem('weberlessa_properties');
        if (localData) {
            try {
                window.properties = JSON.parse(localData);
                console.log(`📁 ${window.properties.length} imóveis carregados do localStorage`);
            } catch (error) {
                console.log('⚠️ Erro no localStorage:', error);
                window.properties = window.getInitialProperties();
            }
        } else {
            // 3. Usar dados de exemplo
            window.properties = window.getInitialProperties();
            console.log(`🎯 ${window.properties.length} imóveis de exemplo carregados`);
            
            // Salvar no localStorage
            localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        }
    }
    
    console.log(`📊 Total final: ${window.properties.length} imóveis carregados`);
    return window.properties;
};

// ========== FUNÇÃO 3: renderProperties() ==========
window.renderProperties = function(filter = 'todos') {
    console.log('🎨 renderProperties() chamada com filtro:', filter);
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container não encontrado!');
        return;
    }
    
    container.innerHTML = '';
    
    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: #666;">Nenhum imóvel disponível.</p>';
        console.log('⚠️ Nenhum imóvel para renderizar');
        return;
    }
    
    // Filtrar imóveis
    let filteredProperties = window.properties;
    if (filter !== 'todos') {
        filteredProperties = window.properties.filter(p => {
            if (filter === 'Residencial') return p.type === 'residencial';
            if (filter === 'Comercial') return p.type === 'comercial';
            if (filter === 'Rural') return p.type === 'rural';
            if (filter === 'Minha Casa Minha Vida') return p.badge === 'MCMV';
            return true;
        });
    }
    
    if (filteredProperties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum imóvel encontrado para este filtro.</p>';
        return;
    }
    
    console.log(`🎨 Renderizando ${filteredProperties.length} imóveis...`);
    
    // Verificar se gallery.js está disponível
    const useGallery = typeof window.createPropertyGallery === 'function';
    console.log('🖼️ Usando galeria?', useGallery);
    
    filteredProperties.forEach(property => {
        const features = Array.isArray(property.features) ? property.features : 
                        (property.features ? property.features.split(',') : []);
        
        // Gerar HTML da imagem/galeria
        let propertyImageHTML = '';
        
        if (useGallery) {
            propertyImageHTML = window.createPropertyGallery(property);
        } else {
            // Fallback simples
            const imageUrl = property.images ? 
                property.images.split(',')[0] : 
                'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
            
            propertyImageHTML = `
                <div class="property-image" style="position: relative; height: 250px;">
                    <img src="${imageUrl}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="${property.title}"
                         onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                    ${property.badge ? `<div class="property-badge">${property.badge}</div>` : ''}
                </div>
            `;
        }
        
        const card = `
            <div class="property-card">
                ${propertyImageHTML}
                <div class="property-content">
                    <div class="property-price">${property.price || 'R$ 0,00'}</div>
                    <h3 class="property-title">${property.title || 'Sem título'}</h3>
                    <div class="property-location">
                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Localização não informada'}
                    </div>
                    <p>${property.description || 'Descrição não disponível.'}</p>
                    <div class="property-features">
                        ${features.map(f => `<span class="feature-tag">${f.trim()}</span>`).join('')}
                    </div>
                    <button class="contact-btn" onclick="contactAgent(${property.id})">
                        <i class="fab fa-whatsapp"></i> Entrar em Contato
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML += card;
    });
    
    console.log('✅ Imóveis renderizados com sucesso');
};

// ========== FUNÇÃO 4: setupFilters() ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        console.error('❌ Botões de filtro não encontrados!');
        return;
    }
    
    // ATUALIZAÇÃO: FORÇAR "Todos" como ativo inicial
    const defaultActive = document.querySelector('.filter-btn.active') || 
                         document.querySelector('.filter-btn');
    
    if (defaultActive) {
        defaultActive.classList.add('active');
        console.log('✅ Botão padrão ativado:', defaultActive.textContent);
        
        // Se for "Todos", renderizar imediatamente
        if (defaultActive.textContent.trim() === 'Todos') {
            setTimeout(() => {
                console.log('🎯 Renderizando imóveis com filtro "todos" inicial...');
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos');
                }
            }, 100);
        }
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar active ao clicado
            this.classList.add('active');
            
            // Obter filtro
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            console.log(`🎯 Filtrando por: ${filter}`);
            
            // Renderizar com filtro
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filter);
            } else {
                console.error('❌ renderProperties() não disponível');
            }
        });
    });
    
    console.log('✅ Filtros configurados');
};

// ========== FUNÇÃO 5: contactAgent() ==========
window.contactAgent = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    const message = `Olá! Tenho interesse no imóvel: ${property.title} - ${property.price}`;
    const whatsappURL = `https://wa.me/5582996044513?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
};

// ========== FUNÇÃO 6: loadPropertyList() ==========
window.loadPropertyList = function() {
    console.log('📋 Carregando lista de imóveis no admin...');
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) {
        console.error('❌ Container propertyList não encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = window.properties ? window.properties.length : 0;
    }
    
    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum imóvel cadastrado.</p>';
        return;
    }
    
    window.properties.forEach(property => {
        const features = Array.isArray(property.features) ? property.features : 
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
                <button onclick="editProperty(${property.id})" 
                        style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
    
    console.log(`✅ ${window.properties.length} imóveis listados no admin`);
};

// ========== FUNÇÃO 7: editProperty() ==========
window.editProperty = function(id) {
    console.log(`📝 Editando imóvel ID: ${id}`);
    
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
    document.getElementById('propHasVideo').checked = property.has_video || false;
    
    // Atualizar título do formulário
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Editar Imóvel';
    
    // Atualizar botão submit
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Imóvel';
    
    // Mostrar botão cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'block';
    
    window.editingPropertyId = id;
    
    alert("✅ Imóvel carregado para edição! Modifique os campos e clique em 'Atualizar Imóvel' para salvar.");
};

// ========== FUNÇÃO 8: deleteProperty() ==========
window.deleteProperty = function(id) {
    if (!confirm('⚠️ Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const index = window.properties.findIndex(p => p.id === id);
    if (index !== -1) {
        window.properties.splice(index, 1);
        
        // Atualizar localStorage
        localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        
        // Recarregar tudo
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.renderProperties === 'function') window.renderProperties();
        
        alert('✅ Imóvel excluído com sucesso!');
    }
};

// ========== FUNÇÃO 9: saveToLocalStorage() ==========
window.saveToLocalStorage = function(propertyData) {
    try {
        console.log('💾 Salvando imóvel...', propertyData);
        
        // Criar objeto completo
        const fullProperty = {
            id: window.editingPropertyId || (window.properties.length > 0 ? 
                Math.max(...window.properties.map(p => p.id)) + 1 : 1),
            title: propertyData.title,
            price: propertyData.price,
            location: propertyData.location,
            description: propertyData.description,
            features: propertyData.features,
            type: propertyData.type,
            has_video: propertyData.has_video,
            badge: propertyData.badge,
            rural: propertyData.rural,
            images: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        };
        
        // Adicionar ou atualizar
        if (window.editingPropertyId) {
            const index = window.properties.findIndex(p => p.id === window.editingPropertyId);
            if (index !== -1) {
                window.properties[index] = fullProperty;
            }
        } else {
            window.properties.push(fullProperty);
        }
        
        // Salvar no localStorage
        localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        
        // Atualizar interfaces
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.renderProperties === 'function') window.renderProperties();
        
        // Limpar edição
        window.editingPropertyId = null;
        
        console.log('✅ Imóvel salvo com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        return false;
    }
};

// ========== FUNÇÃO 10: setupForm() ==========
window.setupForm = function() {
    console.log('📝 Configurando formulário admin...');
    
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('❌ Formulário não encontrado!');
        return;
    }
    
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
            rural: document.getElementById('propType').value === 'rural'
        };
        
        // Validação básica
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            alert('❌ Preencha Título, Preço e Localização!');
            return;
        }
        
        // Botão loading
        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;
        
        try {
            const success = await window.saveToLocalStorage(propertyData);
            
            if (success) {
                alert('✅ Imóvel salvo com sucesso!');
                form.reset();
                
                // Resetar formulário
                const formTitle = document.getElementById('formTitle');
                if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
                
                const cancelBtn = document.getElementById('cancelEditBtn');
                if (cancelBtn) cancelBtn.style.display = 'none';
                
                if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
            } else {
                alert('❌ Erro ao salvar o imóvel!');
            }
            
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    console.log('✅ Formulário admin configurado');
};

console.log('✅ properties.js completamente carregado - 10 funções disponíveis');
