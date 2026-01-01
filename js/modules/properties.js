// js/modules/properties.js - SISTEMA COMPLETO CORRIGIDO
console.log('🚀 properties.js carregado - Versão Corrigida');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;

window.initializeProperties = async function () {
    console.log('🔄 Inicializando sistema de propriedades (USANDO CLIENTE OFICIAL)...');

    // ==========================================================
    // 📊 MONITORAMENTO DA OPERAÇÃO PRINCIPAL (OPCIONAL)
    // ==========================================================
    const operationId = window.OperationMonitor
        ? window.OperationMonitor.startOperation('initializeProperties')
        : null;

    try {
        // ==========================================================
        // ⚡ CACHE INTELIGENTE (SMARTCACHE + PERFORMANCECACHE)
        // ==========================================================
        if (window.SmartCache && window.PerformanceCache) {
            const cached = PerformanceCache.get('properties_data', 'data');

            if (cached && Array.isArray(cached) && cached.length > 0) {
                window.properties = cached;
                console.log('⚡ Propriedades carregadas do cache inteligente');

                if (typeof window.renderProperties === 'function') {
                    const renderOpId = window.OperationMonitor
                        ? window.OperationMonitor.startOperation('renderProperties_cache')
                        : null;

                    setTimeout(() => {
                        window.renderProperties('todos');

                        if (renderOpId && window.OperationMonitor) {
                            window.OperationMonitor.endOperationSuccess(renderOpId, {
                                source: 'cache'
                            });
                        }
                    }, 50);
                }

                if (operationId && window.OperationMonitor) {
                    window.OperationMonitor.endOperationSuccess(operationId, {
                        source: 'cache',
                        count: cached.length
                    });
                }
                return; // ⛔ evita fetch e fallbacks
            }
        }

        // ==========================================================
        // 1️⃣ SUPABASE – CLIENTE OFICIAL (PRIORIDADE)
        // ==========================================================
        console.log('🌐 Tentando conexão com Supabase via cliente oficial...');

        if (window.supabaseLoadProperties) {
            try {
                const supabaseResult = await window.supabaseLoadProperties();

                if (
                    supabaseResult?.data &&
                    Array.isArray(supabaseResult.data) &&
                    supabaseResult.data.length > 0
                ) {
                    const formattedData = supabaseResult.data.map(item => ({
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
                        images: item.images || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
                        pdfs: item.pdfs || '',
                        created_at: item.created_at || new Date().toISOString()
                    }));

                    window.properties = formattedData;
                    window.savePropertiesToStorage();

                    // 💾 Cache inteligente com auto-invalidação
                    if (window.SmartCache && window.PerformanceCache) {
                        SmartCache.setWithAutoInvalidation(
                            'properties_data',
                            formattedData,
                            'data',
                            60000
                        );
                    }

                    console.log(`✅ ${formattedData.length} imóveis carregados (Supabase oficial)`);

                    if (typeof window.renderProperties === 'function') {
                        setTimeout(() => window.renderProperties('todos'), 100);
                    }

                    if (operationId && window.OperationMonitor) {
                        window.OperationMonitor.endOperationSuccess(operationId, {
                            source: 'supabase-client',
                            count: formattedData.length
                        });
                    }
                    return;
                }
            } catch (supabaseError) {
                console.error('❌ Erro no cliente oficial:', supabaseError);
            }
        }

        // ==========================================================
        // 2️⃣ SUPABASE FETCH (FALLBACK)
        // ==========================================================
        console.log('🔄 Tentando com supabaseFetch (fallback)...');

        if (window.supabaseFetch) {
            try {
                const result = await window.supabaseFetch('/properties?select=*&order=id.desc');

                if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
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
                        images: item.images || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
                        pdfs: item.pdfs || '',
                        created_at: item.created_at || new Date().toISOString()
                    }));

                    window.properties = formattedData;
                    window.savePropertiesToStorage();

                    if (window.SmartCache && window.PerformanceCache) {
                        SmartCache.setWithAutoInvalidation(
                            'properties_data',
                            formattedData,
                            'data',
                            60000
                        );
                    }

                    console.log(`✅ ${formattedData.length} imóveis carregados (fallback fetch)`);

                    if (typeof window.renderProperties === 'function') {
                        setTimeout(() => window.renderProperties('todos'), 100);
                    }

                    if (operationId && window.OperationMonitor) {
                        window.OperationMonitor.endOperationSuccess(operationId, {
                            source: 'supabase-fetch',
                            count: formattedData.length
                        });
                    }
                    return;
                }
            } catch (error) {
                console.error('❌ Erro no supabaseFetch:', error);
            }
        }

        // ==========================================================
        // 3️⃣ LOCALSTORAGE (FALLBACK)
        // ==========================================================
        console.log('📁 Usando fallback: localStorage...');
        const stored = localStorage.getItem('weberlessa_properties');

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    window.properties = parsed;

                    if (window.SmartCache && window.PerformanceCache) {
                        SmartCache.setWithAutoInvalidation(
                            'properties_data',
                            parsed,
                            'data',
                            30000
                        );
                    }

                    if (typeof window.renderProperties === 'function') {
                        setTimeout(() => window.renderProperties('todos'), 100);
                    }

                    if (operationId && window.OperationMonitor) {
                        window.OperationMonitor.endOperationSuccess(operationId, {
                            source: 'localStorage',
                            count: parsed.length
                        });
                    }
                    return;
                }
            } catch (e) {
                console.error('❌ Erro ao parsear localStorage:', e);
            }
        }

        // ==========================================================
        // 4️⃣ DADOS INICIAIS (ÚLTIMO FALLBACK)
        // ==========================================================
        console.log('📦 Usando fallback: dados iniciais...');
        window.properties = getInitialProperties();
        window.savePropertiesToStorage();

        if (window.SmartCache && window.PerformanceCache) {
            SmartCache.setWithAutoInvalidation(
                'properties_data',
                window.properties,
                'data',
                30000
            );
        }

        if (typeof window.renderProperties === 'function') {
            setTimeout(() => window.renderProperties('todos'), 100);
        }

        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationSuccess(operationId, {
                source: 'initial-data',
                count: window.properties.length
            });
        }

    } catch (error) {
        console.error('❌ Erro crítico ao carregar propriedades:', error);

        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationError(operationId, error);
        }

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
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
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
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
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
// ========== FUNÇÃO 7: Adicionar Novo Imóvel (COM SUPABASE) ==========
window.addNewProperty = async function(propertyData) {
    console.log('➕ ADICIONANDO NOVO IMÓVEL COM SUPABASE + PDFs CORRIGIDO:', propertyData);

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        return null;
    }

    const operationId = window.OperationMonitor ? 
        window.OperationMonitor.startOperation('addNewProperty', { title: propertyData.title }) : null;

    try {
        // ✅ 1. Salvar PDFs no Supabase Storage (SE HOUVER)
        let pdfsString = '';

        if (window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
            console.log(`📤 Processando ${window.selectedPdfFiles.length} PDF(s) primeiro...`);
            const tempId = `temp_${Date.now()}`;

            if (typeof window.processAndSavePdfs === 'function') {
                pdfsString = await window.processAndSavePdfs(tempId, propertyData.title);
                console.log(`✅ PDFs processados: ${pdfsString ? 'SIM' : 'NÃO'}`);

                if (pdfsString) {
                    propertyData.pdfs = pdfsString;
                    console.log('📎 PDFs adicionados aos dados do imóvel');
                }
            }
        }

        // ✅ 2. Salvar imóvel no Supabase Database
        let supabaseResult = null;
        let supabaseSuccess = false;
        let supabaseId = null;

        if (window.supabaseSaveProperty) {
            try {
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
                    pdfs: pdfsString || '',
                    created_at: new Date().toISOString()
                };

                console.log('📤 ENVIANDO IMÓVEL + PDFs para Supabase:', supabaseData);

                supabaseResult = await window.supabaseSaveProperty(supabaseData);

                if (supabaseResult && supabaseResult.success) {
                    supabaseSuccess = true;
                    supabaseId = supabaseResult.data?.id;
                    console.log(`✅ ✅ ✅ IMÓVEL SALVO NO SUPABASE COM ID: ${supabaseId}`);
                }
            } catch (error) {
                console.error('❌ Erro ao salvar imóvel:', error);
            }
        }

        // ✅ 3. Criar objeto local do imóvel
        const newId = supabaseSuccess ? supabaseId : 
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
            images: propertyData.images || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            pdfs: pdfsString || '',
            created_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess
        };

        // ✅ 4. Adicionar localmente
        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();

        // ✅ 5. Se tem PDFs e salvou no Supabase, atualizar URLs
        if (pdfsString && supabaseSuccess && supabaseId) {
            console.log(`🔄 Atualizando URLs dos PDFs com ID real ${supabaseId}...`);

            if (typeof window.linkPendingPdfsToProperty === 'function') {
                const tempId = `temp_${Date.now() - 1000}`;
                window.linkPendingPdfsToProperty(tempId, supabaseId);
            }

            setTimeout(async () => {
                try {
                    const updatedPdfs = await window.processAndSavePdfs(supabaseId, propertyData.title);
                    if (updatedPdfs && updatedPdfs !== pdfsString) {
                        newProperty.pdfs = updatedPdfs;
                        window.savePropertiesToStorage();

                        if (window.supabaseUpdateProperty) {
                            await window.supabaseUpdateProperty(supabaseId, { pdfs: updatedPdfs });
                            console.log(`✅ PDFs atualizados no Supabase para ID ${supabaseId}`);
                        }
                    }
                } catch (error) {
                    console.error('❌ Erro ao atualizar PDFs:', error);
                }
            }, 2000);
        }

        // ✅ 6. Renderizar
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }

        // ✅ 7. Atualizar admin
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }

        // ✅ 8. Feedback
        if (supabaseSuccess) {
            if (pdfsString) {
                alert(`✅ Imóvel "${newProperty.title}" cadastrado com ${window.selectedPdfFiles.length} PDF(s)!\n\nID: ${newId}\n\nPDFs disponíveis após atualização.`);
            } else {
                alert(`✅ Imóvel "${newProperty.title}" cadastrado PERMANENTEMENTE!\n\nID: ${newId}`);
            }
        } else {
            alert(`⚠️ Imóvel "${newProperty.title}" cadastrado apenas LOCALMENTE.`);
        }

        // ✅ 9. Limpar PDFs selecionados
        setTimeout(() => {
            if (typeof window.clearAllPdfs === 'function') {
                window.clearAllPdfs();
            }
        }, 100);

        // ✅ 10. INVALIDAR CACHE INTELIGENTE
        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
            console.log('🗑️ Cache invalidado após adicionar novo imóvel');
        }

        // ✅ 11. Finalizar monitoramento
        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationSuccess(operationId, { 
                id: newProperty.id,
                title: newProperty.title
            });
        }

        return newProperty;

    } catch (error) {
        console.error('❌ Erro crítico ao adicionar imóvel:', error);
        alert('❌ Erro ao cadastrar imóvel: ' + error.message);

        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationError(operationId, error);
        }

        return null;
    }
};

// ========== FUNÇÃO 8: limpar PDFs no cancelamento (Auxilia addNewProperty) ==========
// Função para limpar PDFs no cancelamento
window.clearPdfsOnCancel = function() {
    window.selectedPdfFiles = [];
    window.existingPdfFiles = [];
    if (typeof window.updatePdfPreview === 'function') {
        window.updatePdfPreview();
    }
    console.log('🧹 PDFs limpos no cancelamento');
};

// Função para verificar se há PDFs pendentes
window.hasPendingPdfs = function() {
    return window.selectedPdfFiles && window.selectedPdfFiles.length > 0;
};

// ========== DEBUG AVANÇADO: CHECKBOX "TEM VÍDEO" ==========
window.debugHasVideoIssue = function(propertyId) {
    console.group('🔍 DEBUG AVANÇADO: CHECKBOX TEM VÍDEO');
    
    const property = window.properties.find(p => p.id == propertyId);
    const checkbox = document.getElementById('propHasVideo');
    
    console.log('📊 ESTADO ATUAL:');
    console.log('- Checkbox marcado:', checkbox?.checked);
    console.log('- Valor na propriedade original:', property?.has_video);
    console.log('- Tipo na propriedade:', typeof property?.has_video);
    
    // Forçar atualização do estado
    if (property) {
        property.has_video = checkbox?.checked || false;
        console.log('🔄 Estado forçado para:', property.has_video);
        window.savePropertiesToStorage();
    }
    
    console.groupEnd();
};

// ========== FUNÇÃO 8: ATUALIZAR IMÓVEL (VERSÃO ROBUSTA COM SUPABASE E CACHE INTELIGENTE) ==========
window.updateProperty = async function(id, propertyData) {
    console.log(`✏️ ATUALIZANDO IMÓVEL ${id}:`, propertyData);

    // ✅ VALIDAÇÃO DO ID
    if (!id || id === 'null' || id === 'undefined') {
        console.error('❌ ID inválido fornecido:', id);
        if (window.editingPropertyId) {
            console.log(`🔄 Usando editingPropertyId: ${window.editingPropertyId}`);
            id = window.editingPropertyId;
        } else {
            alert('❌ ERRO: Não foi possível identificar o imóvel para atualização!');
            return false;
        }
    }

    console.log(`🔍 ID para atualização: ${id}`);

    // ✅ BUSCAR IMÓVEL
    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado! IDs disponíveis:', window.properties.map(p => p.id));
        alert(`❌ Imóvel não encontrado!\n\nIDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`);
        return false;
    }

    const property = window.properties[index];
    console.log(`✅ Imóvel encontrado: "${property.title}"`);

    const operationId = window.OperationMonitor ? 
        window.OperationMonitor.startOperation('updateProperty', { id, title: propertyData.title }) : null;

    try {
        // ✅ 1. DADOS PARA SUPABASE
        const updateData = {
            title: propertyData.title || property.title,
            price: propertyData.price || property.price,
            location: propertyData.location || property.location,
            description: propertyData.description || property.description || '',
            features: propertyData.features || property.features || '',
            type: propertyData.type || property.type || 'residencial',
            has_video: Boolean(propertyData.has_video) || false,
            badge: propertyData.badge || property.badge || 'Novo',
            rural: propertyData.type === 'rural' || property.rural || false,
            images: propertyData.images || property.images || '',
            pdfs: propertyData.pdfs || property.pdfs || ''
        };

        console.log('📤 Dados para Supabase:', updateData);

        // ✅ 2. ATUALIZAR NO SUPABASE
        let supabaseSuccess = false;
        if (window.SUPABASE_URL && window.SUPABASE_KEY) {
            try {
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

                console.log('📊 Status do Supabase:', response.status);

                if (response.ok) {
                    supabaseSuccess = true;
                    console.log(`✅ Imóvel ${id} atualizado no Supabase`);
                } else {
                    const errorText = await response.text();
                    console.error('❌ Erro no Supabase:', errorText);
                }
            } catch (error) {
                console.error('❌ Erro de conexão com Supabase:', error);
            }
        }

        // ✅ 3. ATUALIZAR LOCALMENTE
        window.properties[index] = {
            ...property,
            ...updateData,
            id: id
        };
        window.savePropertiesToStorage();
        console.log('✅ Atualização local salva');

        // ✅ 4. RENDERIZAR
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }

        // ✅ 5. ATUALIZAR ADMIN
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }

        // ✅ 6. INVALIDAR CACHE INTELIGENTE
        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
            console.log('🗑️ Cache invalidado após atualizar imóvel');
        }

        // ✅ 7. FEEDBACK
        if (supabaseSuccess) {
            const pdfsCount = updateData.pdfs ? updateData.pdfs.split(',').filter(p => p.trim()).length : 0;
            const pdfMsg = pdfsCount > 0 ? ` com ${pdfsCount} PDF(s)` : '';
            alert(`✅ Imóvel "${updateData.title}" atualizado PERMANENTEMENTE${pdfMsg}!`);
        } else {
            alert(`⚠️ Imóvel "${updateData.title}" atualizado apenas LOCALMENTE.\n\nAlterações serão sincronizadas quando possível.`);
        }

        // ✅ 8. Finalizar monitoramento
        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationSuccess(operationId, { id, title: propertyData.title });
        }

        return true;

    } catch (error) {
        console.error('❌ ERRO ao atualizar imóvel:', error);
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\n${error.message}`);

        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationError(operationId, error);
        }

        return false;
    }
};

// Função auxiliar para similaridade de strings (adicionar após a função updateProperty)
function stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    
    if (str1 === str2) return 1;
    if (str1.length < 2 || str2.length < 2) return 0;
    
    let match = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
        if (str1[i] === str2[i]) match++;
    }
    
    return match / Math.max(str1.length, str2.length);
}

// ========== FUNÇÃO 10: EXCLUIR IMÓVEL (COM SUPABASE E CACHE INTELIGENTE) ==========
window.deleteProperty = async function(id) {
    console.log(`🗑️ Iniciando exclusão COMPLETA do imóvel ${id}...`);

    const operationId = window.OperationMonitor ? 
        window.OperationMonitor.startOperation('deleteProperty', { id }) : null;

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

    // ✅ 4. Excluir localmente (sempre)
    const originalLength = window.properties.length;
    window.properties = window.properties.filter(p => p.id !== id);
    const newLength = window.properties.length;
    if (originalLength !== newLength) {
        console.log(`💾 Imóvel ${id} excluído localmente`);
    } else {
        console.log('⚠️ Imóvel não encontrado localmente após tentativa de exclusão');
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

    // ✅ 8. INVALIDAR CACHE INTELIGENTE
    if (window.SmartCache) {
        SmartCache.invalidatePropertiesCache();
        console.log('🗑️ Cache invalidado após excluir imóvel');
    }

    // ✅ 9. Feedback ao usuário
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\nFoi removido do servidor e não voltará a aparecer.`);
        console.log(`🎯 Imóvel ${id} excluído completamente (online + local)`);

        // ✅ 10. Excluir PDFs relacionados (opcional)
        if (property.pdfs && property.pdfs !== '' && property.pdfs !== 'EMPTY') {
            console.log(`🗑️ Excluindo ${property.pdfs.split(',').length} PDF(s) do storage...`);
            if (typeof window.deletePdfFromSupabaseStorage === 'function') {
                const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
                pdfUrls.forEach(url => {
                    window.deletePdfFromSupabaseStorage(url).then(success => {
                        console.log(success ? `✅ PDF excluído: ${url}` : `❌ Falha ao excluir: ${url}`);
                    });
                });
            }
        }
    } else {
        const errorMessage = supabaseError ? 
            `\n\nErro no servidor: ${supabaseError.substring(0, 100)}...` : 
            '\n\nMotivo: Conexão com servidor falhou.';

        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.${errorMessage}\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
        console.log(`🎯 Imóvel ${id} excluído apenas localmente (Supabase falhou)`);
    }

    // ✅ 11. Finalizar monitoramento
    if (operationId && window.OperationMonitor) {
        window.OperationMonitor.endOperationSuccess(operationId, { id, success: supabaseSuccess });
    }

    return supabaseSuccess;
};

// ========== FUNÇÃO 11: Carregar Lista para Admin ==========
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

// ========== FUNÇÃO 12: Sincronização com Supabase (NOVA) ==========
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
                    images: item.images || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
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

// ========== FUNÇÃO 13: Teste Simples de Conexão ==========
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

// Função de fallback se o cliente oficial falhar
async function saveWithFetchDirect(propertyData) {
    console.log('🔄 Usando fallback fetch direto para Supabase...');
    
    try {
        const response = await fetch('https://syztbxvpdaplpetmixmt.supabase.co/rest/v1/properties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(propertyData)
        });
        
        if (response.ok) {
            const data = await response.json();
            return { success: true, id: data[0]?.id };
        } else {
            const errorText = await response.text();
            console.error('❌ Fallback fetch falhou:', errorText);
            return { success: false, error: errorText };
        }
    } catch (error) {
        console.error('❌ Erro no fallback fetch:', error);
        return { success: false, error: error.message };
    }
}

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

// ========== FUNÇÃO DE DEBUG: DIAGNOSTICO UODATE ==========
// Função de diagnóstico para debug
window.diagnoseUpdateError = function() {
    console.log('🔍 DIAGNÓSTICO DE UPDATE:');
    console.log('- window.editingPropertyId:', window.editingPropertyId);
    console.log('- window.properties length:', window.properties.length);
    console.log('- IDs disponíveis:', window.properties.map(p => p.id).join(', '));
    console.log('- Formulário visível:', document.getElementById('propertyForm') ? 'SIM' : 'NÃO');
    
    // Verificar se há PDFs pendentes
    if (window.selectedPdfFiles) {
        console.log('- PDFs selecionados:', window.selectedPdfFiles.length);
    }
    
    // Verificar título do formulário
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        console.log('- Título do formulário:', formTitle.textContent);
    }
};
