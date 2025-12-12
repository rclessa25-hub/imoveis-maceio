// js/modules/properties.js - SISTEMA COMPLETO COM SUPABASE
console.log('🚀 properties.js carregado - Sistema Completo com Supabase');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;
window.selectedFiles = [];
window.selectedPdfFiles = [];

// ========== CARREGAMENTO HIERÁRQUICO ==========
(async function autoInitialize() {
    console.log('🔄 Inicialização hierárquica do sistema...');
    
    // 1. PRIMEIRO: Tentar carregar do Supabase
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        console.log('🌐 Tentando carregar do Supabase...');
        
        try {
            // Usar CORS proxy para GitHub Pages
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const supabaseUrl = `${window.SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`;
            
            const response = await fetch(proxyUrl + supabaseUrl, {
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    window.properties = data;
                    
                    // Garantir que todos os campos existam
                    window.properties = window.properties.map(property => ({
                        id: property.id,
                        title: property.title || 'Sem título',
                        price: property.price || 'R$ 0,00',
                        location: property.location || 'Local não informado',
                        description: property.description || '',
                        features: property.features || '',
                        type: property.type || 'residencial',
                        has_video: property.has_video || false,
                        badge: property.badge || 'Novo',
                        rural: property.rural || false,
                        images: property.images || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                        pdfs: property.pdfs || '',
                        created_at: property.created_at || new Date().toISOString()
                    }));
                    
                    console.log(`✅ ${window.properties.length} imóveis carregados do Supabase`);
                    
                    // Salvar backup no localStorage
                    savePropertiesToStorage();
                    
                    // Renderizar imediatamente
                    renderIfReady();
                    return;
                }
            }
            
            console.log('⚠️ Supabase não retornou dados válidos');
            
        } catch (error) {
            console.log('⚠️ Erro ao acessar Supabase:', error.message);
            console.log('📡 Continuando com fallback...');
        }
    }
    
    // 2. SEGUNDO: Tentar localStorage
    try {
        const stored = localStorage.getItem('weberlessa_properties');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                window.properties = parsed;
                console.log(`📁 ${window.properties.length} imóveis carregados do localStorage`);
                renderIfReady();
                return;
            }
        }
    } catch (error) {
        console.log('⚠️ Erro no localStorage:', error);
    }
    
    // 3. TERCEIRO: Usar dados de exemplo
    window.properties = getInitialProperties();
    console.log(`🎯 ${window.properties.length} imóveis de exemplo carregados`);
    
    // Salvar no localStorage para próxima vez
    savePropertiesToStorage();
    
    renderIfReady();
    
})();

// Função auxiliar para renderizar quando pronto
function renderIfReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            if (typeof window.renderProperties === 'function' && window.properties.length > 0) {
                window.renderProperties('todos');
                console.log('🎨 Imóveis renderizados automaticamente do Supabase');
            }
        }, 500);
    }
}

// ========== FUNÇÃO 1: getInitialProperties() ==========
function getInitialProperties() {
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
}

// Exportar para window
window.getInitialProperties = getInitialProperties;

// ========== FUNÇÃO 9: syncWithSupabase() ==========
window.syncWithSupabase = async function() {
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.log('⚠️ Credenciais Supabase não configuradas');
        return false;
    }
    
    console.log('🔄 Sincronizando com Supabase...');
    
    try {
        // 1. Buscar dados atuais do Supabase
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const response = await fetch(proxyUrl + `${window.SUPABASE_URL}/rest/v1/properties?select=*`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            }
        });
        
        if (response.ok) {
            const supabaseData = await response.json();
            
            if (Array.isArray(supabaseData) && supabaseData.length > 0) {
                // Combinar dados: manter locais, adicionar novos do Supabase
                const localIds = window.properties.map(p => p.id);
                const newFromSupabase = supabaseData.filter(item => !localIds.includes(item.id));
                
                if (newFromSupabase.length > 0) {
                    window.properties = [...window.properties, ...newFromSupabase];
                    savePropertiesToStorage();
                    console.log(`✅ ${newFromSupabase.length} novos imóveis sincronizados do Supabase`);
                    
                    // Renderizar novamente
                    if (typeof window.renderProperties === 'function') {
                        window.renderProperties('todos');
                    }
                    
                    return true;
                } else {
                    console.log('✅ Já sincronizado com Supabase');
                }
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        return false;
    }
};

// ========== FUNÇÃO 2: savePropertiesToStorage() ==========
window.savePropertiesToStorage = function() {
    try {
        // Filtrar apenas dados necessários para evitar problemas
        const dataToSave = window.properties.map(property => ({
            id: property.id,
            title: property.title,
            price: property.price,
            location: property.location,
            description: property.description,
            features: property.features,
            type: property.type,
            has_video: property.has_video || false,
            badge: property.badge,
            rural: property.rural || false,
            images: property.images,
            pdfs: property.pdfs || '',
            created_at: property.created_at || new Date().toISOString()
        }));
        
        localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        console.log('💾 Imóveis salvos no localStorage:', window.properties.length);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
};

// ========== FUNÇÃO 3: renderProperties() ==========
window.renderProperties = function(filter = 'todos') {
    console.log('🎨 renderProperties() com filtro:', filter);
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container não encontrado!');
        return;
    }
    
    // Limpar container
    container.innerHTML = '';
    
    // Verificar se temos dados
    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: #666;">Nenhum imóvel disponível.</p>';
        console.log('⚠️ Nenhum imóvel para renderizar');
        return;
    }
    
    // Filtrar
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
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum imóvel para este filtro.</p>';
        return;
    }
    
    console.log(`🎨 Renderizando ${filteredProperties.length} imóveis...`);
    
    // Verificar se gallery.js está disponível
    const useGallery = typeof window.createPropertyGallery === 'function';
    
    // Renderizar cada imóvel
    filteredProperties.forEach(property => {
        const features = Array.isArray(property.features) ? property.features : 
                        (property.features ? property.features.split(',') : []);
        
        // Gerar HTML da imagem
        let propertyImageHTML = '';
        
        if (useGallery) {
            propertyImageHTML = window.createPropertyGallery(property);
        } else {
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
                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Local não informado'}
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

// ========== FUNÇÃO 4: setupFilters() CORRIGIDA ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        console.error('❌ Botões de filtro não encontrados!');
        return;
    }
    
    // ✅ CORREÇÃO: Ativar "Todos" automaticamente se nenhum estiver ativo
    let hasActive = false;
    filterButtons.forEach(btn => {
        if (btn.classList.contains('active')) hasActive = true;
    });
    
    if (!hasActive) {
        const todosBtn = Array.from(filterButtons).find(btn => 
            btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
        );
        
        if (todosBtn) {
            todosBtn.classList.add('active');
            console.log('✅ Botão "Todos" ativado automaticamente');
        }
    }
    
    // Configurar eventos
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
            
            // Renderizar
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filter);
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

// ========== FUNÇÃO 6: addNewProperty() ==========
window.addNewProperty = function(propertyData) {
    console.log('➕ Adicionando novo imóvel:', propertyData);
    
    // Gerar ID
    const newId = window.properties.length > 0 
        ? Math.max(...window.properties.map(p => p.id)) + 1 
        : 1;
    
    const newProperty = {
        id: newId,
        title: propertyData.title,
        price: propertyData.price,
        location: propertyData.location,
        description: propertyData.description,
        features: propertyData.features,
        type: propertyData.type,
        has_video: false,
        badge: propertyData.badge,
        rural: propertyData.type === 'rural',
        images: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
        created_at: new Date().toISOString()
    };
    
    // Adicionar
    window.properties.push(newProperty);
    
    // Salvar
    window.savePropertiesToStorage();
    
    // Atualizar
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
    
    console.log('✅ Novo imóvel adicionado:', newProperty);
    return newProperty;
};

// ========== FUNÇÃO 7: updateProperty() ==========
window.updateProperty = function(id, propertyData) {
    const index = window.properties.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    window.properties[index] = {
        ...window.properties[index],
        ...propertyData
    };
    
    window.savePropertiesToStorage();
    
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
    
    console.log('✏️ Imóvel atualizado:', id);
    return true;
};

// ========== FUNÇÃO 8: deleteProperty() ==========
window.deleteProperty = function(id) {
    // ✅ CORREÇÃO: Confirmação dupla
    if (!confirm('⚠️ TEM CERTEZA que deseja excluir este imóvel?\n\nEsta ação NÃO pode ser desfeita.')) {
        return false;
    }
    
    // Segunda confirmação
    if (!confirm('❌ CONFIRMAÇÃO FINAL:\n\nClique em OK APENAS se tiver absoluta certeza.\nO imóvel será PERMANENTEMENTE excluído.')) {
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    const propertyTitle = window.properties[index].title;
    window.properties.splice(index, 1);
    
    window.savePropertiesToStorage();
    
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
    
    alert(`✅ Imóvel "${propertyTitle}" excluído permanentemente!`);
    console.log('🗑️ Imóvel excluído:', id);
    return true;
};

// ========== INICIALIZAÇÃO FINAL ==========
console.log('✅ properties.js carregado com 8 funções principais');

// Garantir renderização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - properties.js pronto');
        
        // Renderizar após breve delay
        setTimeout(() => {
            if (typeof window.renderProperties === 'function' && window.properties.length > 0) {
                window.renderProperties('todos');
            }
            
            // Configurar filtros
            if (typeof window.setupFilters === 'function') {
                setTimeout(window.setupFilters, 500);
            }
        }, 300);
    });
} else {
    console.log('🏠 DOM já carregado - renderizando agora...');
    setTimeout(() => {
        if (typeof window.renderProperties === 'function' && window.properties.length > 0) {
            window.renderProperties('todos');
        }
    }, 300);
}
