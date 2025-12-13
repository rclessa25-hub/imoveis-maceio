// js/modules/properties.js - SISTEMA COMPLETO COM SUPABASE
console.log('🚀 properties.js carregado - Sistema Completo com Supabase');

// ========== TESTE DE CONEXÃO SUPABASE ==========
window.testSupabaseConnection = async function() {
    console.log('🔍 Testando conexão com Supabase...');
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.log('❌ Credenciais Supabase não configuradas');
        return false;
    }
    
    try {
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            }
        });
        
        const isConnected = response.ok;
        console.log('🌐 Supabase conectado?', isConnected);
        
        if (isConnected) {
            console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        } else {
            console.log('❌ Não foi possível conectar ao Supabase');
        }
        
        return isConnected;
        
    } catch (error) {
        console.log('❌ Erro na conexão Supabase:', error.message);
        return false;
    }
};

// Testar conexão ao carregar
setTimeout(() => {
    window.testSupabaseConnection();
}, 2000);

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;
window.selectedFiles = [];
window.selectedPdfFiles = [];

// ========== CARREGAMENTO HIERÁRQUICO (ATUALIZADO) ==========
(async function autoInitialize() {
    console.log('🔄 Inicialização hierárquica do sistema...');
    
    // 0. Testar conexão
    const isConnected = await window.testSupabaseConnection();
    
    if (isConnected) {
        console.log('🌐 Conexão Supabase OK - usando dados online');
        
        // 1. PRIMEIRO: Tentar Supabase
        try {
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    window.properties = data;
                    console.log(`✅ ${data.length} imóveis carregados DIRETAMENTE do Supabase`);
                    
                    // Salvar backup local
                    window.savePropertiesToStorage();
                    
                    // Renderizar
                    renderIfReady();
                    return;
                }
            }
        } catch (error) {
            console.log('⚠️ Erro ao carregar do Supabase:', error.message);
        }
    }
    
    // 2. SEGUNDO: LocalStorage (fallback)
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
    
    // 3. TERCEIRO: Dados de exemplo
    window.properties = getInitialProperties();
    console.log(`🎯 ${window.properties.length} imóveis de exemplo carregados`);
    window.savePropertiesToStorage();
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
// ========== FUNÇÃO 9: syncWithSupabase() CORRIGIDA ==========
// ========== FUNÇÃO DE SINCRONIZAÇÃO SIMPLIFICADA ==========
window.syncWithSupabase = async function() {
    console.log('🔄 Tentando sincronização direta com Supabase...');
    
    try {
        // Tentar fetch direto (simples e direto)
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=*`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const supabaseData = await response.json();
            
            if (Array.isArray(supabaseData) && supabaseData.length > 0) {
                // Adicionar apenas novos imóveis
                const existingIds = window.properties.map(p => p.id);
                const newProperties = supabaseData.filter(item => 
                    !existingIds.includes(item.id)
                );
                
                if (newProperties.length > 0) {
                    // Formatar e adicionar
                    const formatted = newProperties.map(item => ({
                        id: item.id,
                        title: item.title || 'Sem título',
                        price: item.price || 'R$ 0,00',
                        location: item.location || 'Local não informado',
                        description: item.description || '',
                        features: item.features || '',
                        type: item.type || 'residencial',
                        has_video: item.has_video || false,
                        badge: item.badge || 'Novo',
                        rural: item.rural || false,
                        images: item.images || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                        pdfs: item.pdfs || '',
                        created_at: item.created_at || new Date().toISOString()
                    }));
                    
                    window.properties = [...window.properties, ...formatted];
                    savePropertiesToStorage();
                    
                    console.log(`✅ ${formatted.length} novos imóveis sincronizados`);
                    
                    // Renderizar
                    if (typeof window.renderProperties === 'function') {
                        window.renderProperties('todos');
                    }
                    
                    return { success: true, count: formatted.length };
                } else {
                    console.log('✅ Já sincronizado - sem novos imóveis');
                    return { success: true, count: 0 };
                }
            }
        }
        
        console.log('⚠️ Supabase não respondeu com dados válidos');
        return { success: false, error: 'Dados inválidos' };
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        return { success: false, error: error.message };
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

// ========== FUNÇÃO 3: ATUALIZAR IMÓVEL NO SUPABASE (CORRIGIDA) ==========
window.updatePropertyInSupabase = async function(id, propertyData) {
    console.log(`🌐 Atualizando imóvel ${id} no Supabase (SEM updated_at):`, propertyData);
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.log('❌ Credenciais Supabase não configuradas');
        return false;
    }
    
    try {
        // PREPARAR DADOS - APENAS CAMPOS QUE EXISTEM NA TABELA
        const updateData = {
            title: propertyData.title || '',
            price: propertyData.price || '',
            location: propertyData.location || '',
            description: propertyData.description || '',
            features: typeof propertyData.features === 'string' ? propertyData.features : 
                     Array.isArray(propertyData.features) ? propertyData.features.join(', ') : '',
            type: propertyData.type || 'residencial',
            has_video: propertyData.has_video || false,
            badge: propertyData.badge || 'Novo',
            rural: propertyData.rural || false,
            images: propertyData.images || '',
            pdfs: propertyData.pdfs || ''
            // REMOVIDO: updated_at - coluna não existe na tabela
        };
        
        console.log('📤 Dados para atualização (CAMPOS VÁLIDOS):', updateData);
        
        // Enviar atualização para Supabase
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('📊 Resposta do Supabase - Status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Imóvel ${id} ATUALIZADO no Supabase com sucesso!`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`❌ Erro ao atualizar imóvel ${id} no Supabase:`, errorText);
            
            // Tentar sem alguns campos opcionais se falhar
            console.log('🔄 Tentando atualização simplificada...');
            
            // Remover campos que podem causar problemas
            delete updateData.pdfs;
            delete updateData.images;
            
            const simpleResponse = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                },
                body: JSON.stringify(updateData)
            });
            
            if (simpleResponse.ok) {
                console.log(`✅ Imóvel ${id} atualizado com campos simplificados`);
                return true;
            }
            
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Erro de conexão ao atualizar imóvel ${id}:`, error);
        return false;
    }
};

// ========== FUNÇÃO 4: renderProperties() ==========
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

// ========== FUNÇÃO 5: setupFilters() CORRIGIDA ==========
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

// ========== FUNÇÃO 6: contactAgent() ==========
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

// ========== FUNÇÃO 7: addNewProperty() ==========
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
    
    // ✅ CORREÇÃO: PRIMEIRO salvar no Supabase
    savePropertyToSupabase(newProperty).then(supabaseSuccess => {
        if (supabaseSuccess) {
            console.log('✅ Imóvel salvo no Supabase com sucesso!');
            
            // Depois adicionar localmente
            window.properties.push(newProperty);
            window.savePropertiesToStorage();
            
            // Renderizar
            if (typeof window.renderProperties === 'function') {
                window.renderProperties('todos');
            }
            
            alert(`✅ Imóvel "${newProperty.title}" cadastrado PERMANENTEMENTE no sistema!`);
            
        } else {
            console.log('⚠️ Salvando apenas localmente (Supabase falhou)');
            
            // Fallback: salvar localmente
            window.properties.push(newProperty);
            window.savePropertiesToStorage();
            
            if (typeof window.renderProperties === 'function') {
                window.renderProperties('todos');
            }
            
            alert(`⚠️ Imóvel "${newProperty.title}" salvo apenas LOCALMENTE (sem conexão com servidor).`);
        }
    });
    
    return newProperty;
};

// ========== FUNÇÃO 8: SALVAR IMÓVEL NO SUPABASE ==========
window.savePropertyToSupabase = async function(propertyData) {
    console.log('🌐 Salvando imóvel no Supabase:', propertyData);
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.log('❌ Credenciais Supabase não configuradas');
        return false;
    }
    
    try {
        // Preparar dados para Supabase
        const supabaseData = {
            title: propertyData.title,
            price: propertyData.price,
            location: propertyData.location,
            description: propertyData.description || '',
            features: typeof propertyData.features === 'string' ? propertyData.features : 
                     Array.isArray(propertyData.features) ? propertyData.features.join(', ') : '',
            type: propertyData.type || 'residencial',
            has_video: propertyData.has_video || false,
            badge: propertyData.badge || 'Novo',
            rural: propertyData.rural || false,
            images: propertyData.images || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            pdfs: propertyData.pdfs || '',
            created_at: new Date().toISOString()
        };
        
        console.log('📤 Dados para Supabase:', supabaseData);
        
        // Enviar para Supabase
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(supabaseData)
        });
        
        console.log('📊 Resposta do Supabase - Status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Imóvel salvo no Supabase com sucesso!', result);
            
            // Atualizar ID com o ID gerado pelo Supabase
            if (result && result[0] && result[0].id) {
                propertyData.id = result[0].id;
                console.log('🆔 ID atribuído pelo Supabase:', propertyData.id);
            }
            
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Erro ao salvar no Supabase:', errorText);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro de conexão com Supabase:', error);
        return false;
    }
};

// ========== FUNÇÃO 9: updateProperty() CORRIGIDA ==========
window.updateProperty = async function(id, propertyData) {
    console.log(`✏️ ATUALIZANDO IMÓVEL ${id} (SEM updated_at)...`);
    
    const index = window.properties.findIndex(p => p.id === id);
    if (index === -1) {
        console.log('❌ Imóvel não encontrado localmente');
        alert('❌ Erro: Imóvel não encontrado!');
        return false;
    }
    
    const originalProperty = window.properties[index];
    
    // ✅ 1. PRIMEIRO: Atualizar no Supabase
    let supabaseSuccess = false;
    
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        // Combinar dados originais com novos (SEM updated_at)
        const combinedData = {
            ...originalProperty,
            ...propertyData
            // REMOVIDO: updated_at
        };
        
        supabaseSuccess = await window.updatePropertyInSupabase(id, combinedData);
    }
    
    // ✅ 2. ATUALIZAR LOCALMENTE
    window.properties[index] = {
        ...originalProperty,
        ...propertyData,
        id: originalProperty.id,
        images: propertyData.images || originalProperty.images || '',
        pdfs: propertyData.pdfs || originalProperty.pdfs || '',
        created_at: originalProperty.created_at || new Date().toISOString()
        // REMOVIDO: updated_at
    };
    
    // ✅ 3. SALVAR LOCALMENTE
    window.savePropertiesToStorage();
    
    // ✅ 4. ATUALIZAR INTERFACE
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
    
    // ✅ 5. ATUALIZAR LISTA DO ADMIN
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => window.loadPropertyList(), 300);
    }
    
    // ✅ 6. FEEDBACK
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${propertyData.title || originalProperty.title}" atualizado PERMANENTEMENTE!`);
        console.log(`🎯 Imóvel ${id} atualizado ONLINE + localmente`);
    } else {
        alert(`⚠️ Imóvel atualizado apenas LOCALMENTE (erro no servidor).`);
        console.log(`🎯 Imóvel ${id} atualizado apenas localmente`);
    }
    
    return true;
};

// ========== FUNÇÃO 10: deleteProperty() ATUALIZADA ==========
window.deleteProperty = async function(id) {
    console.log(`🗑️ Iniciando exclusão do imóvel ${id}...`);
    
    // Encontrar imóvel
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }
    
    // Confirmação DUPLA
    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"\n\nEsta ação NÃO pode ser desfeita.`)) {
        return false;
    }
    
    if (!confirm(`❌ CONFIRMAÇÃO FINAL:\n\nClique em OK APENAS se tiver absoluta certeza.\nO imóvel "${property.title}" será PERMANENTEMENTE excluído.`)) {
        return false;
    }
    
    console.log(`🗑️ Excluindo imóvel ${id}: "${property.title}"`);
    
    // ✅ 1. PRIMEIRO: Excluir do Supabase
    let supabaseSuccess = false;
    
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            console.log(`🌐 Tentando excluir imóvel ${id} do Supabase...`);
            
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                }
            });
            
            console.log('📊 Status da exclusão no Supabase:', response.status);
            
            if (response.ok) {
                supabaseSuccess = true;
                console.log(`✅ Imóvel ${id} excluído do Supabase com sucesso!`);
            } else {
                const errorText = await response.text();
                console.error(`❌ Erro ao excluir do Supabase:`, errorText);
            }
            
        } catch (error) {
            console.error(`❌ Erro de conexão ao excluir do Supabase:`, error);
        }
    }
    
    // ✅ 2. Excluir localmente (sempre)
    const index = window.properties.findIndex(p => p.id === id);
    if (index !== -1) {
        window.properties.splice(index, 1);
        
        // Salvar no localStorage
        window.savePropertiesToStorage();
        
        console.log(`💾 Imóvel ${id} excluído localmente`);
    }
    
    // ✅ 3. Atualizar interface
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
    
    // ✅ 4. Atualizar lista do admin
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
            console.log('📋 Lista do admin atualizada após exclusão');
        }, 300);
    }
    
    // ✅ 5. Feedback ao usuário
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!`);
        console.log(`🎯 Imóvel ${id} excluído completamente (online + local)`);
    } else {
        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
        console.log(`🎯 Imóvel ${id} excluído apenas localmente`);
    }
    
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

// ========== DEBUG: TESTAR EDIÇÃO MANUALMENTE ==========
window.debugEditProperty = function(id) {
    console.log('🔍 DEBUG: Testando edição do imóvel', id);
    
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        console.log('❌ Imóvel não encontrado');
        return;
    }
    
    console.log('📄 Imóvel atual:', property);
    
    // Simular uma edição
    const testUpdate = {
        title: property.title + ' (EDITADO)',
        price: property.price,
        location: property.location,
        description: property.description + ' [Editado em teste]',
        features: property.features,
        type: property.type,
        badge: property.badge
    };
    
    console.log('📝 Dados de teste para edição:', testUpdate);
    
    // Testar a função updateProperty
    window.updateProperty(id, testUpdate).then(success => {
        console.log('✅ Resultado do teste de edição:', success ? 'SUCESSO' : 'FALHA');
    });
};

// Testar automaticamente após carregar
setTimeout(() => {
    console.log('🔍 Sistema de propriedades completamente carregado');
    console.log(`📊 Total de imóveis: ${window.properties.length}`);
    
    // Mostrar IDs disponíveis para teste
    if (window.properties.length > 0) {
        console.log('🆔 IDs disponíveis para teste de edição:', window.properties.map(p => p.id));
    }
}, 3000);
