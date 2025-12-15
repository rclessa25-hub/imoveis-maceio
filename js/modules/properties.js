// js/modules/properties.js - SISTEMA COMPLETO CORRIGIDO
console.log('🚀 properties.js carregado - Versão Corrigida');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;

// ========== FUNÇÃO 1: Carregamento Hierárquico ATUALIZADA ==========
window.initializeProperties = async function() {
    console.log('🔄 Inicializando sistema de propriedades (COM SUPABASE CORRIGIDO)...');
    
    try {
        // ✅ 1. PRIMEIRO: Tentar Supabase com supabaseFetch
        console.log('🌐 Tentando conexão com Supabase via proxy CORS...');
        
        if (window.SUPABASE_URL && window.SUPABASE_KEY) {
            const result = await window.supabaseFetch('/properties?select=*&order=id.desc');
            
            if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
                // Converter formato Supabase para local
                const formattedData = result.data.map(item => ({
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
                    images: item.images || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    pdfs: item.pdfs || '',
                    created_at: item.created_at || new Date().toISOString()
                }));
                
                window.properties = formattedData;
                window.savePropertiesToStorage();
                
                console.log(`✅ ${formattedData.length} imóveis carregados do Supabase`);
                
                // Renderizar imediatamente
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos'), 100);
                }
                return; // SAI DA FUNÇÃO - SUPABASE BEM SUCEDIDO
            } else {
                console.log('⚠️ Supabase falhou ou não tem dados:', result.error);
            }
        }
        
        // ✅ 2. SEGUNDO: localStorage (fallback)
        console.log('📁 Usando fallback: localStorage...');
        const stored = localStorage.getItem('weberlessa_properties');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                window.properties = parsed;
                console.log(`📁 ${parsed.length} imóveis carregados do localStorage`);
                
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos'), 100);
                }
                return;
            }
        }
        
        // ✅ 3. TERCEIRO: Dados iniciais (último fallback)
        console.log('📦 Usando fallback: dados iniciais...');
        window.properties = getInitialProperties();
        window.savePropertiesToStorage();
        
        if (typeof window.renderProperties === 'function') {
            setTimeout(() => window.renderProperties('todos'), 100);
        }
        
        console.log(`✅ ${window.properties.length} imóveis de exemplo carregados`);
        
    } catch (error) {
        console.error('❌ Erro crítico ao carregar propriedades:', error);
        // Garantir que temos pelo menos dados básicos
        window.properties = getInitialProperties();
        if (typeof window.renderProperties === 'function') {
            setTimeout(() => window.renderProperties('todos'), 100);
        }
    }
};

// ========== FUNÇÃO 2: Dados Iniciais ==========
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

// ========== FUNÇÃO 3: Salvar no Storage ==========
window.savePropertiesToStorage = function() {
    try {
        localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        console.log('💾 Imóveis salvos no localStorage:', window.properties.length);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
};

// ========== FUNÇÃO 4: Renderizar Propriedades ==========
window.renderProperties = function(filter = 'todos') {
    console.log('🎨 renderProperties() com filtro:', filter);
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container não encontrado!');
        return;
    }
    
    // Limpar container
    container.innerHTML = '';

    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: #666;">Nenhum imóvel disponível.</p>';
        return;
    }
    
    // Filtrar propriedades
    let filteredProperties = [...window.properties];
    
    if (filter !== 'todos') {
        filteredProperties = window.properties.filter(p => {
            if (filter === 'Residencial') return p.type === 'residencial';
            if (filter === 'Comercial') return p.type === 'comercial';
            if (filter === 'Rural') return p.type === 'rural' || p.rural === true;
            if (filter === 'Minha Casa Minha Vida') return p.badge === 'MCMV';
            return true;
        });
    }
    
    if (filteredProperties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum imóvel para este filtro.</p>';
        return;
    }
    
    console.log(`🎨 Renderizando ${filteredProperties.length} imóveis...`);
    
    // Renderizar cada imóvel
    filteredProperties.forEach(property => {
        const features = Array.isArray(property.features) ? property.features : 
                        (property.features ? property.features.split(',') : []);
        
        // Gerar HTML da imagem (com ou sem galeria)
        let propertyImageHTML = '';
        
        if (typeof window.createPropertyGallery === 'function') {
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

// ========== FUNÇÃO 5: Configurar Filtros ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        console.error('❌ Botões de filtro não encontrados!');
        return;
    }
    
    // Ativar "Todos" automaticamente
    const todosBtn = Array.from(filterButtons).find(btn => 
        btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
    );
    
    if (todosBtn && !todosBtn.classList.contains('active')) {
        todosBtn.classList.add('active');
    }
    
    // Configurar eventos
    filterButtons.forEach(button => {
        // Remover event listeners antigos
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
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

// ========== FUNÇÃO 6: Contactar Agente ==========
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

// ========== FUNÇÃO 7: Adicionar Novo Imóvel (COM SUPABASE) ==========
window.addNewProperty = async function(propertyData) {
  console.log('➕ ADICIONANDO NOVO IMÓVEL COM SUPABASE OFICIAL:', propertyData);
  
  if (!propertyData.title || !propertyData.price || !propertyData.location) {
    alert('❌ Preencha Título, Preço e Localização!');
    return null;
  }
  
  try {
    // ✅ 1. PRIMEIRO: Salvar no Supabase com cliente oficial
    // ✅ 1. PRIMEIRO: Salvar no Supabase com cliente oficial
    let supabaseResult = null;
    let supabaseSuccess = false;
    let supabaseId = null;
    
    // VERIFICAÇÃO CRÍTICA: O cliente está disponível?
    console.log('🔍 Verificando disponibilidade do supabaseSaveProperty...');
    console.log('supabaseSaveProperty existe?', typeof window.supabaseSaveProperty);
    console.log('supabaseClient existe?', typeof window.supabaseClient);
    console.log('supabase global existe?', typeof supabase);
    
    if (window.supabaseSaveProperty) {
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
                rural: propertyData.type === 'rural',
                images: propertyData.images || "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
                pdfs: propertyData.pdfs || '',
                created_at: new Date().toISOString()
            };
            
            console.log('📤 ENVIANDO PARA SUPABASE via supabaseSaveProperty:', supabaseData);
            
            // Usar o cliente oficial
            supabaseResult = await window.supabaseSaveProperty(supabaseData);
            
            console.log('📊 RESULTADO DO SUPABASE:', supabaseResult);
            
            if (supabaseResult && supabaseResult.success) {
                supabaseSuccess = true;
                supabaseId = supabaseResult.data?.id || supabaseResult.id;
                console.log(`✅ ✅ ✅ IMÓVEL SALVO NO SUPABASE COM ID: ${supabaseId}`);
                
                // LOG DE SUCESSO DETALHADO
                console.log('🎉 DADOS COMPLETOS RETORNADOS:', supabaseResult.data);
            } else {
                console.error('❌ ❌ ❌ FALHA NO SUPABASE:', supabaseResult?.error || 'Erro desconhecido');
                
                // Tentar fallback com fetch direto
                console.log('🔄 Tentando fallback com fetch direto...');
                const fallbackResult = await saveWithFetchDirect(supabaseData);
                if (fallbackResult.success) {
                    supabaseSuccess = true;
                    supabaseId = fallbackResult.id;
                    console.log(`✅ Imóvel salvo via fallback: ${supabaseId}`);
                }
            }
        } catch (supabaseError) {
            console.error('❌ ERRO AO CONECTAR COM SUPABASE:', supabaseError);
            console.error('Stack trace:', supabaseError.stack);
        }
    } else {
        console.error('⚠️ window.supabaseSaveProperty NÃO DISPONÍVEL!');
        console.log('Verificando supabaseClient global:', window.supabaseClient);
        console.log('Verificando supabase global:', supabase);
    }
    
    // ✅ 2. Criar objeto do imóvel
    const newId = supabaseSuccess ? supabaseResult.data.id : 
                 (window.properties.length > 0 ? Math.max(...window.properties.map(p => p.id)) + 1 : 1);
    
    const newProperty = {
      id: newId,
      title: propertyData.title,
      price: propertyData.price,
      location: propertyData.location,
      description: propertyData.description || '',
      features: typeof propertyData.features === 'string' ? propertyData.features : 
               Array.isArray(propertyData.features) ? propertyData.features.join(', ') : '',
      type: propertyData.type || 'residencial',
      has_video: propertyData.has_video || false,
      badge: propertyData.badge || 'Novo',
      rural: propertyData.type === 'rural',
      images: propertyData.images || "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
      pdfs: propertyData.pdfs || '',
      created_at: new Date().toISOString(),
      savedToSupabase: supabaseSuccess
    };
    
    // ✅ 3. Adicionar localmente (sempre)
    window.properties.unshift(newProperty);
    window.savePropertiesToStorage();
    
    // ✅ 4. Renderizar
    if (typeof window.renderProperties === 'function') {
      window.renderProperties('todos');
    }
    
    // ✅ 5. Atualizar lista admin
    if (typeof window.loadPropertyList === 'function') {
      setTimeout(() => window.loadPropertyList(), 300);
    }
    
    // ✅ 6. Feedback inteligente
    if (supabaseSuccess) {
      alert(`✅ Imóvel "${newProperty.title}" cadastrado PERMANENTEMENTE no sistema!\n\nID: ${newId}\n\nO imóvel agora persistirá após recarregar a página.`);
      console.log(`🎯 Imóvel salvo ONLINE + localmente`);
    } else {
      alert(`⚠️ Imóvel "${newProperty.title}" cadastrado apenas LOCALMENTE.\n\nSerá sincronizado quando a conexão com o servidor for restabelecida.`);
      console.log(`🎯 Imóvel salvo apenas localmente (falha Supabase)`);
    }
    
    console.log(`✅ Imóvel "${newProperty.title}" processado`);
    return newProperty;
    
  } catch (error) {
    console.error('❌ Erro crítico ao adicionar imóvel:', error);
    alert('❌ Erro ao cadastrar imóvel!');
    return null;
  }
};

// ========== FUNÇÃO 8: Atualizar Imóvel (COM SUPABASE) ==========
// ========== FUNÇÃO 8: ATUALIZAR IMÓVEL (VERSÃO ROBUSTA) ==========
window.updateProperty = async function(id, propertyData) {
    console.log(`✏️ ATUALIZANDO IMÓVEL ${id}:`, propertyData);
    
    // ✅ VALIDAÇÃO CRÍTICA: Verificar se properties existe
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ CRÍTICO: window.properties não é um array válido!');
        console.log('window.properties atual:', window.properties);
        alert('❌ ERRO: Sistema de imóveis não carregado. Recarregue a página.');
        return false;
    }
    
    // ✅ Buscar imóvel com múltiplas estratégias
    let index = -1;
    let property = null;
    
    // Estratégia 1: Buscar por ID exato
    index = window.properties.findIndex(p => p.id === id);
    
    // Estratégia 2: Se não encontrou, buscar por conversão de string
    if (index === -1) {
        console.log(`⚠️ ID ${id} não encontrado, tentando conversão...`);
        index = window.properties.findIndex(p => 
            p.id == id || // Comparação flexível
            String(p.id) === String(id) ||
            (p.tempId && p.tempId === id)
        );
    }
    
    // Estratégia 3: Último recurso - mostrar todos IDs disponíveis
    if (index === -1) {
        console.error('❌ Imóvel não encontrado! IDs disponíveis:', 
            window.properties.map(p => ({id: p.id, title: p.title})));
        alert(`❌ Imóvel não encontrado!\n\nIDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`);
        return false;
    }
    
    property = window.properties[index];
    console.log(`✅ Imóvel encontrado: "${property.title}" (índice: ${index})`);
    
    try {
        // ✅ 1. PRIMEIRO: Atualizar no Supabase (se possível)
        let supabaseSuccess = false;
        
        if (window.SUPABASE_URL && window.SUPABASE_KEY) {
            try {
                // Preparar dados atualizados
                const updateData = {
                    title: propertyData.title || property.title,
                    price: propertyData.price || property.price,
                    location: propertyData.location || property.location,
                    description: propertyData.description || property.description || '',
                    features: propertyData.features || property.features || '',
                    type: propertyData.type || property.type || 'residencial',
                    has_video: propertyData.has_video || property.has_video || false,
                    badge: propertyData.badge || property.badge || 'Novo',
                    rural: propertyData.type === 'rural' || property.rural || false,
                    images: propertyData.images || property.images || '',
                    pdfs: propertyData.pdfs || property.pdfs || ''
                };
                
                console.log('📤 Atualizando no Supabase:', updateData);
                
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
                
                console.log('📊 Status da atualização:', response.status);
                
                if (response.ok) {
                    supabaseSuccess = true;
                    console.log(`✅ Imóvel ${id} atualizado no Supabase`);
                } else {
                    const errorText = await response.text();
                    console.error('❌ Erro ao atualizar no Supabase:', errorText);
                }
            } catch (error) {
                console.error('❌ Erro de conexão com Supabase:', error);
            }
        }
        
        // ✅ 2. Atualizar localmente (SEMPRE, mesmo se Supabase falhar)
        console.log('💾 Atualizando localmente...');
        
        // Criar cópia atualizada
        const updatedProperty = {
            ...property,
            ...propertyData,
            id: id // Garantir que o ID não mude
        };
        
        // Substituir no array
        window.properties[index] = updatedProperty;
        
        // ✅ 3. Salvar no localStorage
        const saveResult = window.savePropertiesToStorage();
        console.log('💾 Salvamento local:', saveResult ? 'SUCESSO' : 'FALHA');
        
        // ✅ 4. Renderizar
        if (typeof window.renderProperties === 'function') {
            console.log('🎨 Renderizando imóveis atualizados...');
            window.renderProperties('todos');
        }
        
        // ✅ 5. Atualizar lista do admin
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => {
                window.loadPropertyList();
                console.log('📋 Lista do admin atualizada');
            }, 300);
        }
        
        // ✅ 6. Feedback inteligente
        if (supabaseSuccess) {
            alert(`✅ Imóvel "${propertyData.title || property.title}" atualizado PERMANENTEMENTE!\n\nAlterações salvas no servidor.`);
            console.log(`🎯 Imóvel ${id} atualizado ONLINE + localmente`);
        } else {
            alert(`⚠️ Imóvel "${propertyData.title || property.title}" atualizado apenas LOCALMENTE.\n\nAlterações serão sincronizadas quando possível.`);
            console.log(`🎯 Imóvel ${id} atualizado apenas localmente`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao atualizar imóvel:', error);
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\nDetalhes: ${error.message}`);
        return false;
    }
};

// ========== FUNÇÃO 9: Excluir Imóvel ==========
// ========== FUNÇÃO 9: EXCLUIR IMÓVEL (COM SUPABASE) ==========
window.deleteProperty = async function(id) {
    console.log(`🗑️ Iniciando exclusão COMPLETA do imóvel ${id}...`);
    
    // 1. Encontrar imóvel
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }
    
    // 2. Confirmação DUPLA (segurança)
    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"\n\nEsta ação NÃO pode ser desfeita.`)) {
        console.log('❌ Exclusão cancelada pelo usuário');
        return false;
    }
    
    if (!confirm(`❌ CONFIRMAÇÃO FINAL:\n\nClique em OK APENAS se tiver absoluta certeza.\nO imóvel "${property.title}" será PERMANENTEMENTE excluído.`)) {
        console.log('❌ Exclusão cancelada na confirmação final');
        return false;
    }
    
    console.log(`🗑️ Excluindo imóvel ${id}: "${property.title}"`);
    
    let supabaseSuccess = false;
    let supabaseError = null;
    
    // ✅ 3. PRIMEIRO: Tentar excluir do Supabase
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        console.log(`🌐 Tentando excluir imóvel ${id} do Supabase...`);
        
        try {
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
                supabaseError = errorText;
                console.error(`❌ Erro ao excluir do Supabase:`, errorText);
            }
            
        } catch (error) {
            supabaseError = error.message;
            console.error(`❌ Erro de conexão ao excluir do Supabase:`, error);
        }
    } else {
        console.log('⚠️ Credenciais Supabase não disponíveis');
    }
    
    // ✅ 4. Excluir localmente (sempre, independente do Supabase)
    const originalLength = window.properties.length;
    window.properties = window.properties.filter(p => p.id !== id);
    const newLength = window.properties.length;
    
    if (originalLength === newLength) {
        console.log('⚠️ Imóvel não encontrado localmente após tentativa de exclusão');
    } else {
        console.log(`💾 Imóvel ${id} excluído localmente`);
    }
    
    // ✅ 5. Salvar no localStorage
    window.savePropertiesToStorage();
    
    // ✅ 6. Atualizar interface
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
    
    // ✅ 7. Atualizar lista do admin
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
            console.log('📋 Lista do admin atualizada após exclusão');
        }, 300);
    }
    
    // ✅ 8. Feedback ao usuário baseado no resultado
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\nFoi removido do servidor e não voltará a aparecer.`);
        console.log(`🎯 Imóvel ${id} excluído completamente (online + local)`);
        
        // ✅ 9. Tentar excluir PDFs relacionados (opcional)
        if (property.pdfs && property.pdfs !== '' && property.pdfs !== 'EMPTY') {
            console.log('🗑️ Imóvel tinha PDFs - marcando para limpeza');
            // Aqui poderia adicionar lógica para excluir PDFs do storage
        }
        
    } else {
        const errorMessage = supabaseError ? 
            `\n\nErro no servidor: ${supabaseError.substring(0, 100)}...` : 
            '\n\nMotivo: Conexão com servidor falhou.';
            
        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.${errorMessage}\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
        console.log(`🎯 Imóvel ${id} excluído apenas localmente (Supabase falhou)`);
    }
    
    return supabaseSuccess;
};

// ========== FUNÇÃO 10: Carregar Lista para Admin ==========
window.loadPropertyList = function() {
    if (!window.properties || typeof window.properties.forEach !== 'function') {
        console.error('❌ window.properties não é um array válido');
        return;
    }
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = window.properties.length;
    }
    
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
    
    console.log(`✅ ${window.properties.length} imóveis listados no admin`);
};

// ========== FUNÇÃO 11: Sincronização com Supabase (NOVA) ==========
window.syncWithSupabase = async function() {
    console.log('🔄 Iniciando sincronização com Supabase...');
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.error('❌ Credenciais Supabase não configuradas');
        return { success: false, error: 'Credenciais não configuradas' };
    }
    
    try {
        // Testar conexão primeiro
        console.log('🔍 Testando conexão com Supabase...');
        const testResponse = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            }
        });
        
        if (!testResponse.ok) {
            console.error('❌ Supabase não acessível:', testResponse.status);
            return { 
                success: false, 
                error: `Erro HTTP ${testResponse.status}: ${testResponse.statusText}` 
            };
        }
        
        console.log('✅ Conexão Supabase OK. Buscando dados...');
        
        // Buscar todos os imóveis do Supabase
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=*&order=id.desc`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const supabaseData = await response.json();
            
            if (Array.isArray(supabaseData) && supabaseData.length > 0) {
                console.log(`📥 ${supabaseData.length} imóveis recebidos do Supabase`);
                
                // Converter dados do Supabase para formato local
                const formattedData = supabaseData.map(item => ({
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
                    images: item.images || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    pdfs: item.pdfs || '',
                    created_at: item.created_at || new Date().toISOString()
                }));
                
                // Mesclar com dados existentes (evitar duplicatas)
                const existingIds = window.properties.map(p => p.id);
                const newProperties = formattedData.filter(item => !existingIds.includes(item.id));
                
                if (newProperties.length > 0) {
                    // Adicionar novos imóveis ao início
                    window.properties = [...newProperties, ...window.properties];
                    
                    // Salvar localmente
                    window.savePropertiesToStorage();
                    
                    // Renderizar
                    if (typeof window.renderProperties === 'function') {
                        window.renderProperties('todos');
                    }
                    
                    console.log(`✅ ${newProperties.length} novos imóveis sincronizados`);
                    return { 
                        success: true, 
                        count: newProperties.length,
                        message: `${newProperties.length} novos imóveis carregados` 
                    };
                } else {
                    console.log('✅ Já sincronizado - sem novos imóveis');
                    return { 
                        success: true, 
                        count: 0,
                        message: 'Já está sincronizado com o servidor' 
                    };
                }
            } else {
                console.log('ℹ️ Nenhum imóvel no Supabase');
                return { success: true, count: 0, message: 'Nenhum imóvel no servidor' };
            }
        } else {
            const errorText = await response.text();
            console.error('❌ Erro ao buscar dados:', response.status, errorText);
            return { 
                success: false, 
                error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` 
            };
        }
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        return { 
            success: false, 
            error: error.message,
            isCorsError: error.message.includes('Failed to fetch') || error.message.includes('CORS')
        };
    }
};

// ========== FUNÇÃO 12: Teste Simples de Conexão ==========
window.testSupabaseConnectionSimple = async function() {
    console.log('🌐 Teste simples de conexão Supabase...');
    
    try {
        // Usar endpoint mais simples
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            },
            mode: 'cors' // Explicitamente pedir modo CORS
        });
        
        console.log('📊 Status do teste:', response.status, response.statusText);
        
        if (response.ok) {
            console.log('✅ CONEXÃO SUPABASE FUNCIONANDO!');
            return { connected: true, status: response.status };
        } else {
            console.log('❌ Supabase respondeu com erro:', response.status);
            return { connected: false, status: response.status };
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        
        // Verificar se é CORS
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            console.log('⚠️ PROVÁVEL ERRO CORS - Verifique configurações do Supabase');
            console.log('🔗 URL do projeto:', window.SUPABASE_URL);
            console.log('🌍 Seu domínio:', window.location.origin);
        }
        
        return { connected: false, error: error.message };
    }
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js carregado com 10 funções principais');

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - inicializando properties...');
        
        // Carregar propriedades
        setTimeout(() => {
            if (typeof window.initializeProperties === 'function') {
                window.initializeProperties();
            }
            
            // Configurar filtros
            setTimeout(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                }
            }, 500);
            
        }, 300);
    });
} else {
    console.log('🏠 DOM já carregado - inicializando agora...');
    setTimeout(() => {
        if (typeof window.initializeProperties === 'function') {
            window.initializeProperties();
        }
        setTimeout(() => {
            if (typeof window.setupFilters === 'function') {
                window.setupFilters();
            }
        }, 500);
    }, 300);
}

// Exportar funções necessárias
window.getInitialProperties = getInitialProperties;

// ========== RECUPERAÇÃO DE EMERGÊNCIA ==========
(function emergencyPropertiesRecovery() {
    console.log('🚨 VERIFICAÇÃO DE EMERGÊNCIA: window.properties...');
    
    // Verificar a cada 2 segundos se properties está vazio
    const checkInterval = setInterval(() => {
        if (!window.properties || window.properties.length === 0) {
            console.log('🚨 DETECTADO: window.properties está vazio!');
            console.log('🔄 Executando recuperação automática...');
            
            // Parar o intervalo
            clearInterval(checkInterval);
            
            // Forçar carregamento de dados
            forceLoadProperties();
        } else {
            console.log(`✅ Verificação OK: ${window.properties.length} imóveis carregados`);
            clearInterval(checkInterval);
        }
    }, 2000);
})();

function forceLoadProperties() {
    console.log('⚡ FORÇANDO CARREGAMENTO DE IMÓVEIS...');
    
    // Estratégia 1: localStorage
    const stored = localStorage.getItem('weberlessa_properties');
    if (stored) {
        try {
            window.properties = JSON.parse(stored);
            console.log(`✅ Recuperado do localStorage: ${window.properties.length} imóveis`);
            
            // Atualizar interface
            if (typeof window.renderProperties === 'function') {
                window.renderProperties('todos');
            }
            
            if (typeof window.loadPropertyList === 'function') {
                setTimeout(() => window.loadPropertyList(), 300);
            }
            
            return;
        } catch (e) {
            console.error('❌ Erro ao parsear localStorage:', e);
        }
    }
    
    // Estratégia 2: Dados iniciais
    console.log('📦 Carregando dados iniciais...');
    window.properties = getInitialProperties();
    window.savePropertiesToStorage();
    
    console.log(`✅ Dados iniciais carregados: ${window.properties.length} imóveis`);
    
    // Atualizar interface
    if (typeof window.renderProperties === 'function') {
        setTimeout(() => window.renderProperties('todos'), 500);
    }
    
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => window.loadPropertyList(), 700);
    }
}

// Executar imediatamente também
setTimeout(forceLoadProperties, 1000);

// ========== FUNÇÃO DE DEBUG: VERIFICAR CARREGAMENTO ==========
window.debugPropertiesLoad = function() {
    console.log('🔍 DEBUG: Verificando carregamento de propriedades...');
    
    const checks = {
        'window.properties existe': !!window.properties,
        'É array': Array.isArray(window.properties),
        'Quantidade': window.properties ? window.properties.length : 0,
        'localStorage tem dados': !!localStorage.getItem('weberlessa_properties'),
        'SUPABASE_URL configurado': !!window.SUPABASE_URL,
        'SUPABASE_KEY configurado': !!window.SUPABASE_KEY
    };
    
    console.table(checks);
    
    // Forçar recarregamento se estiver vazio
    if (!window.properties || window.properties.length === 0) {
        console.log('🔄 Forçando recarregamento...');
        
        // Tentar localStorage primeiro
        const stored = localStorage.getItem('weberlessa_properties');
        if (stored) {
            try {
                window.properties = JSON.parse(stored);
                console.log(`✅ Carregado do localStorage: ${window.properties.length} imóveis`);
                
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos');
                }
                return;
            } catch (e) {
                console.error('❌ Erro ao parsear localStorage:', e);
            }
        }
        
        // Usar dados iniciais
        window.properties = getInitialProperties();
        window.savePropertiesToStorage();
        console.log(`✅ Usando dados iniciais: ${window.properties.length} imóveis`);
        
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }
    }
    
    return checks;
};
