// js/modules/properties.js - SISTEMA COMPLETO CORRIGIDO

// Configuração SharedCore
const SC = window.SharedCore;

// Verificar se está disponível
if (!SC) {
    console.error('❌ SharedCore não disponível no properties.js!');
    // Criar fallback local
    window.SharedCore = window.SharedCore || {
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        supabaseFetch: window.supabaseFetch,
        logModule: (module, msg) => console.log(`[${module}] ${msg}`),
        formatPrice: window.formatPrice,
        runLowPriority: function(task) {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(task, { timeout: 1000 });
            } else {
                setTimeout(task, 100);
            }
        },
        stringSimilarity: function(str1, str2) {
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
    };
}

SC.logModule('properties', 'Sistema Core de Propriedades');
SC.logModule('properties', 'carregado - Versão Corrigida');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;

window.initializeProperties = async function () {
    SC.logModule('properties', 'Inicializando sistema de propriedades (USANDO CLIENTE OFICIAL)...');

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
                SC.logModule('properties', 'Propriedades carregadas do cache inteligente');

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
        // 1️⃣ SUPABASE – CLIENTE OFICIAL (PRIORIDADE) [ATUALIZADO]
        // ==========================================================
        const loadSupabaseProperties = async () => {
            SC.logModule('properties', 'Tentando conexão com Supabase via cliente oficial...');

            if (!window.supabaseLoadProperties) return;

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

                    if (window.SmartCache && window.PerformanceCache) {
                        SmartCache.setWithAutoInvalidation(
                            'properties_data',
                            formattedData,
                            'data',
                            60000
                        );
                    }

                    SC.logModule('properties', `${formattedData.length} imóveis carregados (Supabase oficial)`);

                    if (typeof window.renderProperties === 'function') {
                        setTimeout(() => window.renderProperties('todos'), 100);
                    }

                    if (operationId && window.OperationMonitor) {
                        window.OperationMonitor.endOperationSuccess(operationId, {
                            source: 'supabase-client',
                            count: formattedData.length
                        });
                    }
                }
            } catch (error) {
                SC.logModule('properties', `Erro no cliente oficial: ${error}`, 'error');
            }
        };

        // Inicialização inteligente: requestIdleCallback ou fallback
        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadSupabaseProperties);
        } else {
            setTimeout(loadSupabaseProperties, 300);
        }

        // ==========================================================
        // 2️⃣ SUPABASE FETCH (FALLBACK)
        // ==========================================================
        SC.logModule('properties', 'Tentando com supabaseFetch (fallback)...');

        if (SC.supabaseFetch) {
            try {
                const result = await SC.supabaseFetch('/properties?select=*&order=id.desc');

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

                    SC.logModule('properties', `${formattedData.length} imóveis carregados (fallback fetch)`);

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
                SC.logModule('properties', `Erro no supabaseFetch: ${error}`, 'error');
            }
        }

        // ==========================================================
        // 3️⃣ LOCALSTORAGE (FALLBACK)
        // ==========================================================
        SC.logModule('properties', 'Usando fallback: localStorage...');
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
                SC.logModule('properties', `Erro ao parsear localStorage: ${e}`, 'error');
            }
        }

        // ==========================================================
        // 4️⃣ DADOS INICIAIS (ÚLTIMO FALLBACK)
        // ==========================================================
        SC.logModule('properties', 'Usando fallback: dados iniciais...');
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
        SC.logModule('properties', `Erro crítico ao carregar propriedades: ${error}`, 'error');

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
        SC.logModule('properties', `Imóveis salvos no localStorage: ${window.properties.length}`);
        return true;
    } catch (error) {
        SC.logModule('properties', `Erro ao salvar no localStorage: ${error}`, 'error');
        return false;
    }
};

// ========== FUNÇÃO 4: Renderizar Propriedades (Atualizada com cache de DOM) ==========
window.renderProperties = function(filter = 'todos') {
    SC.logModule('properties', `renderProperties() com filtro: ${filter}`);

    const operationId = window.OperationMonitor ? 
        window.OperationMonitor.startOperation('renderProperties', { filter }) : null;

    try {
        const container = document.getElementById('properties-container');
        if (!container) {
            SC.logModule('properties', 'Container não encontrado!', 'error');
            if (operationId && window.OperationMonitor) {
                window.OperationMonitor.endOperationError(operationId, new Error('Container não encontrado'));
            }
            return;
        }

        // Verificar cache de DOM
        const cacheKey = `properties_container_${filter}`;
        let cachedHTML = null;
        if (window.PerformanceCache && PerformanceCache.get(cacheKey, 'dom')) {
            cachedHTML = PerformanceCache.get(cacheKey, 'dom');
            SC.logModule('properties', 'Usando HTML cacheado do DOM');
        }

        if (cachedHTML) {
            container.innerHTML = cachedHTML;
        } else {
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

            SC.logModule('properties', `Renderizando ${filteredProperties.length} imóveis...`);

            // Renderizar cada imóvel
            filteredProperties.forEach(property => {
                const features = Array.isArray(property.features) ? property.features : 
                                (property.features ? property.features.split(',') : []);

                // ==========================================================
                // 📸 CORREÇÃO CRÍTICA: UNIFICAÇÃO DA FUNÇÃO createPropertyGallery
                // ==========================================================
                // Gerar HTML da imagem
                let propertyImageHTML = '';
                if (typeof window.createPropertyGallery === 'function') {
                    propertyImageHTML = window.createPropertyGallery(property);
                } else {
                    // FALLBACK com botão PDF
                    const imageUrl = property.images ? 
                        property.images.split(',')[0] : 
                        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
                    
                    const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';
                    
                    propertyImageHTML = `
                        <div class="property-image" style="position: relative; height: 250px;">
                            <img src="${imageUrl}" 
                                 style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                                 alt="${property.title}"
                                 onclick="openGallery(${property.id})"
                                 onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                            ${property.badge ? `<div class="property-badge">${property.badge}</div>` : ''}
                            ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                            
                            <!-- BOTÃO PDF NO FALLBACK -->
                            ${hasPdfs ? 
                                `<button class="pdf-access"
                                     onclick="handlePdfButtonClick(event, ${property.id})"
                                     title="Documentos do imóvel (senha: doc123)">
                                    <i class="fas fa-file-pdf"></i>
                                </button>` : ''}
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

            // Cachear HTML gerado
            if (window.PerformanceCache && container.innerHTML) {
                PerformanceCache.set(cacheKey, container.innerHTML, 'dom', 30000); // 30 segundos
                SC.logModule('properties', `HTML cacheado para filtro: ${filter}`);
            }
        }

        if (operationId && window.OperationMonitor) {
            const propertyCount = window.properties ? window.properties.length : 0;
            window.OperationMonitor.endOperationSuccess(operationId, { 
                filter,
                rendered: propertyCount,
                cached: !!cachedHTML
            });
        }

        SC.logModule('properties', 'Imóveis renderizados com sucesso');

    } catch (error) {
        SC.logModule('properties', `Erro ao renderizar propriedades: ${error}`, 'error');
        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationError(operationId, error);
        }
    }
};

// ========== FUNÇÃO 5: Configurar Filtros ==========
window.setupFilters = function() {
    SC.logModule('properties', '🔧 Configurando filtros - VERSÃO CORRIGIDA');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        SC.logModule('properties', 'Botões de filtro não encontrados!', 'error');
        return;
    }
    
    // 1. REMOVER TODOS OS EVENT LISTENERS ANTIGOS (importante)
    filterButtons.forEach(button => {
        // Clonar o botão para remover listeners antigos
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // 2. PEGAR OS NOVOS BOTÕES (após clonagem)
    const freshButtons = document.querySelectorAll('.filter-btn');
    
    // 3. CONFIGURAR NOVOS EVENT LISTENERS CORRETAMENTE
    freshButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            SC.logModule('properties', `🎯 Filtro clicado: "${this.textContent.trim()}"`);
            
            // PASSO CRÍTICO: REMOVER 'active' e ESTILOS INLINE de TODOS
            freshButtons.forEach(btn => {
                // 1. Remover classe
                btn.classList.remove('active');
                
                // 2. REMOVER QUALQUER ESTILO INLINE que possa estar causando o bug
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.style.fontWeight = '';
                btn.style.boxShadow = '';
                
                // 3. Resetar qualquer atributo de estilo
                btn.removeAttribute('style'); // REMOVE TODOS os estilos inline
            });
            
            // PASSO CRÍTICO: ADICIONAR 'active' APENAS ao clicado (SEM estilo inline)
            this.classList.add('active');
            // NÃO adicionar style inline - deixar o CSS cuidar disso
            
            // Obter filtro
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            SC.logModule('properties', `🚀 Aplicando filtro: ${filter}`);
            
            // Executar filtro
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filter);
            }
            
            // DEBUG: Verificar estado
            setTimeout(() => {
                const activeCount = document.querySelectorAll('.filter-btn.active').length;
                SC.logModule('properties', `✅ Filtro aplicado. Ativos: ${activeCount}`);
                
                if (activeCount !== 1) {
                    SC.logModule('properties', `⚠️ ALERTA: ${activeCount} botões ativos (deveria ser 1)`, 'warn');
                }
            }, 50);
        });
    });
    
    // 4. ATIVAR "Todos" por padrão se nenhum estiver ativo
    setTimeout(() => {
        const activeButtons = document.querySelectorAll('.filter-btn.active');
        if (activeButtons.length === 0) {
            const todosBtn = Array.from(freshButtons).find(btn => 
                btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
            );
            if (todosBtn) {
                todosBtn.classList.add('active');
                SC.logModule('properties', '"Todos" ativado por padrão');
            }
        }
    }, 100);
    
    SC.logModule('properties', `✅ ${freshButtons.length} filtros configurados corretamente`);
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

// ========== FUNÇÃO 7: Adicionar Novo Imóvel (COM SISTEMA UNIFICADO DE MÍDIA) ==========
window.addNewProperty = async function(propertyData) {
    SC.logModule('properties', `ADICIONANDO NOVO IMÓVEL COM SISTEMA UNIFICADO: ${JSON.stringify(propertyData).substring(0, 100)}...`);

    // ✅ Validação básica
    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        return null;
    }

    const operationId = window.OperationMonitor
        ? window.OperationMonitor.startOperation('addNewProperty', { title: propertyData.title })
        : null;

    try {
        // =========================================================
        // 1. PROCESSAR MÍDIA (IMAGENS + PDFs) VIA SISTEMA UNIFICADO
        // =========================================================
        let mediaResult = { images: '', pdfs: '' };

        if (typeof MediaSystem !== 'undefined' &&
            (MediaSystem.state.files.length > 0 || MediaSystem.state.pdfs.length > 0)) {

            SC.logModule('properties', 'Processando mídia com MediaSystem...');
            const tempId = `temp_${Date.now()}`;

            mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);

            if (mediaResult.images) propertyData.images = mediaResult.images;
            if (mediaResult.pdfs) propertyData.pdfs = mediaResult.pdfs;
        } else {
            SC.logModule('properties', 'Nenhuma mídia selecionada para este imóvel');
        }

        // =========================================================
        // 2. SALVAR NO SUPABASE (SE DISPONÍVEL)
        // =========================================================
        let supabaseSuccess = false;
        let supabaseId = null;

        if (typeof window.supabaseSaveProperty === 'function') {
            try {
                const supabaseData = {
                    title: propertyData.title,
                    price: propertyData.price,
                    location: propertyData.location,
                    description: propertyData.description || '',
                    features: typeof propertyData.features === 'string'
                        ? propertyData.features
                        : Array.isArray(propertyData.features)
                            ? propertyData.features.join(', ')
                            : '',
                    type: propertyData.type || 'residencial',
                    has_video: propertyData.has_video || false,
                    badge: propertyData.badge || 'Novo',
                    rural: propertyData.type === 'rural',
                    images: propertyData.images || '',
                    pdfs: propertyData.pdfs || '',
                    created_at: new Date().toISOString()
                };

                SC.logModule('properties', `Enviando imóvel ao Supabase: ${JSON.stringify(supabaseData).substring(0, 100)}...`);
                const result = await window.supabaseSaveProperty(supabaseData);

                if (result && result.success) {
                    supabaseSuccess = true;
                    supabaseId = result.data?.id;
                    SC.logModule('properties', `Imóvel salvo no Supabase com ID ${supabaseId}`);
                }
            } catch (error) {
                SC.logModule('properties', `Erro ao salvar no Supabase: ${error}`, 'error');
            }
        }

        // =========================================================
        // 3. CRIAR OBJETO LOCAL
        // =========================================================
        const newId = supabaseSuccess && supabaseId
            ? supabaseId
            : (window.properties.length > 0
                ? Math.max(...window.properties.map(p => p.id)) + 1
                : 1);

        const newProperty = {
            id: newId,
            title: propertyData.title,
            price: propertyData.price,
            location: propertyData.location,
            description: propertyData.description || '',
            features: typeof propertyData.features === 'string'
                ? propertyData.features
                : Array.isArray(propertyData.features)
                    ? propertyData.features.join(', ')
                    : '',
            type: propertyData.type || 'residencial',
            has_video: propertyData.has_video || false,
            badge: propertyData.badge || 'Novo',
            rural: propertyData.type === 'rural',
            images: propertyData.images || '',
            pdfs: propertyData.pdfs || '',
            created_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess
        };

        // =========================================================
        // 4. SALVAR LOCALMENTE
        // =========================================================
        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();

        // =========================================================
        // 5. ATUALIZAR UI
        // =========================================================
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }

        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }

        // =========================================================
        // 6. FEEDBACK AO USUÁRIO
        // =========================================================
        const imageCount = newProperty.images
            ? newProperty.images.split(',').filter(u => u.trim()).length
            : 0;

        const pdfCount = newProperty.pdfs
            ? newProperty.pdfs.split(',').filter(u => u.trim()).length
            : 0;

        let message = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`;
        if (imageCount > 0) message += `\n📸 ${imageCount} mídia(s)`;
        if (pdfCount > 0) message += `\n📄 ${pdfCount} PDF(s)`;
        if (!supabaseSuccess) message += `\n⚠️ Salvo apenas localmente`;

        alert(message);

        // =========================================================
        // 7. LIMPEZA DO SISTEMA DE MÍDIA
        // =========================================================
        setTimeout(() => {
            if (typeof MediaSystem !== 'undefined') {
                MediaSystem.resetState();
                SC.logModule('properties', 'MediaSystem resetado após criação');
            }
        }, 300);

        // =========================================================
        // 8. INVALIDAR CACHE
        // =========================================================
        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
            SC.logModule('properties', 'Cache invalidado');
        }

        // =========================================================
        // 9. FINALIZAR MONITORAMENTO
        // =========================================================
        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationSuccess(operationId, {
                id: newProperty.id,
                title: newProperty.title
            });
        }

        return newProperty;

    } catch (error) {
        SC.logModule('properties', `Erro crítico ao adicionar imóvel: ${error}`, 'error');
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
    SC.logModule('properties', 'PDFs limpos no cancelamento');
};

// Função para verificar se há PDFs pendentes
window.hasPendingPdfs = function() {
    return window.selectedPdfFiles && window.selectedPdfFiles.length > 0;
};

// ========== DEBUG AVANÇADO: CHECKBOX "TEM VÍDEO" ==========
window.debugHasVideoIssue = function(propertyId) {
    SC.logModule('properties', 'DEBUG AVANÇADO: CHECKBOX TEM VÍDEO', 'info');
    
    const property = window.properties.find(p => p.id == propertyId);
    const checkbox = document.getElementById('propHasVideo');
    
    SC.logModule('properties', 'ESTADO ATUAL:');
    SC.logModule('properties', `- Checkbox marcado: ${checkbox?.checked}`);
    SC.logModule('properties', `- Valor na propriedade original: ${property?.has_video}`);
    SC.logModule('properties', `- Tipo na propriedade: ${typeof property?.has_video}`);
    
    // Forçar atualização do estado
    if (property) {
        property.has_video = checkbox?.checked || false;
        SC.logModule('properties', `Estado forçado para: ${property.has_video}`);
        window.savePropertiesToStorage();
    }
};

// ========== FUNÇÃO 8: ATUALIZAR IMÓVEL (VERSÃO ROBUSTA COM SUPABASE E CACHE INTELIGENTE) ==========
window.updateProperty = async function(id, propertyData) {
    SC.logModule('properties', `ATUALIZANDO IMÓVEL ${id}: ${JSON.stringify(propertyData).substring(0, 100)}...`);

    // ✅ VALIDAÇÃO DO ID
    if (!id || id === 'null' || id === 'undefined') {
        SC.logModule('properties', `ID inválido fornecido: ${id}`, 'error');
        if (window.editingPropertyId) {
            SC.logModule('properties', `Usando editingPropertyId: ${window.editingPropertyId}`);
            id = window.editingPropertyId;
        } else {
            alert('❌ ERRO: Não foi possível identificar o imóvel para atualização!');
            return false;
        }
    }

    SC.logModule('properties', `ID para atualização: ${id}`);

    // ✅ BUSCAR IMÓVEL
    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        SC.logModule('properties', `Imóvel não encontrado! IDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`, 'error');
        alert(`❌ Imóvel não encontrado!\n\nIDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`);
        return false;
    }

    const property = window.properties[index];
    SC.logModule('properties', `Imóvel encontrado: "${property.title}"`);

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

        SC.logModule('properties', `Dados para Supabase: ${JSON.stringify(updateData).substring(0, 100)}...`);

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

                SC.logModule('properties', `Status do Supabase: ${response.status}`);

                if (response.ok) {
                    supabaseSuccess = true;
                    SC.logModule('properties', `Imóvel ${id} atualizado no Supabase`);
                } else {
                    const errorText = await response.text();
                    SC.logModule('properties', `Erro no Supabase: ${errorText.substring(0, 200)}`, 'error');
                }
            } catch (error) {
                SC.logModule('properties', `Erro de conexão com Supabase: ${error}`, 'error');
            }
        }

        // ✅ 3. ATUALIZAR LOCALMENTE
        window.properties[index] = {
            ...property,
            ...updateData,
            id: id
        };
        window.savePropertiesToStorage();
        SC.logModule('properties', 'Atualização local salva');

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
            SC.logModule('properties', 'Cache invalidado após atualizar imóvel');
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
        SC.logModule('properties', `ERRO ao atualizar imóvel: ${error}`, 'error');
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\n${error.message}`);

        if (operationId && window.OperationMonitor) {
            window.OperationMonitor.endOperationError(operationId, error);
        }

        return false;
    }
};

// ========== FUNÇÃO 10: EXCLUIR IMÓVEL (COM SUPABASE E CACHE INTELIGENTE) ==========
window.deleteProperty = async function(id) {
    SC.logModule('properties', `Iniciando exclusão COMPLETA do imóvel ${id}...`);

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
        SC.logModule('properties', 'Exclusão cancelada pelo usuário');
        return false;
    }

    if (!confirm(`❌ CONFIRMAÇÃO FINAL:\n\nClique em OK APENAS se tiver absoluta certeza.\nO imóvel "${property.title}" será PERMANENTEMENTE excluído.`)) {
        SC.logModule('properties', 'Exclusão cancelada na confirmação final');
        return false;
    }

    SC.logModule('properties', `Excluindo imóvel ${id}: "${property.title}"`);

    let supabaseSuccess = false;
    let supabaseError = null;

    // ✅ 3. PRIMEIRO: Tentar excluir do Supabase
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        SC.logModule('properties', `Tentando excluir imóvel ${id} do Supabase...`);
        try {
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                }
            });

            SC.logModule('properties', `Status da exclusão no Supabase: ${response.status}`);

            if (response.ok) {
                supabaseSuccess = true;
                SC.logModule('properties', `Imóvel ${id} excluído do Supabase com sucesso!`);
            } else {
                const errorText = await response.text();
                supabaseError = errorText;
                SC.logModule('properties', `Erro ao excluir do Supabase: ${errorText.substring(0, 200)}`, 'error');
            }
        } catch (error) {
            supabaseError = error.message;
            SC.logModule('properties', `Erro de conexão ao excluir do Supabase: ${error}`, 'error');
        }
    } else {
        SC.logModule('properties', 'Credenciais Supabase não disponíveis');
    }

    // ✅ 4. Excluir localmente (sempre)
    const originalLength = window.properties.length;
    window.properties = window.properties.filter(p => p.id !== id);
    const newLength = window.properties.length;
    if (originalLength !== newLength) {
        SC.logModule('properties', `Imóvel ${id} excluído localmente`);
    } else {
        SC.logModule('properties', 'Imóvel não encontrado localmente após tentativa de exclusão');
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
            SC.logModule('properties', 'Lista do admin atualizada após exclusão');
        }, 300);
    }

    // ✅ 8. INVALIDAR CACHE INTELIGENTE
    if (window.SmartCache) {
        SmartCache.invalidatePropertiesCache();
        SC.logModule('properties', 'Cache invalidado após excluir imóvel');
    }

    // ✅ 9. Feedback ao usuário
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\nFoi removido do servidor e não voltará a aparecer.`);
        SC.logModule('properties', `Imóvel ${id} excluído completamente (online + local)`);

        // ✅ 10. Excluir PDFs relacionados (opcional)
        if (property.pdfs && property.pdfs !== '' && property.pdfs !== 'EMPTY') {
            SC.logModule('properties', `Excluindo ${property.pdfs.split(',').length} PDF(s) do storage...`);
            if (typeof window.deletePdfFromSupabaseStorage === 'function') {
                const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
                pdfUrls.forEach(url => {
                    window.deletePdfFromSupabaseStorage(url).then(success => {
                        SC.logModule('properties', success ? `PDF excluído: ${url.substring(0, 50)}...` : `Falha ao excluir: ${url.substring(0, 50)}...`);
                    });
                });
            }
        }
    } else {
        const errorMessage = supabaseError ? 
            `\n\nErro no servidor: ${supabaseError.substring(0, 100)}...` : 
            '\n\nMotivo: Conexão com servidor falhou.';

        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.${errorMessage}\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
        SC.logModule('properties', `Imóvel ${id} excluído apenas localmente (Supabase falhou)`);
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
        SC.logModule('properties', 'window.properties não é um array válido', 'error');
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
    
    SC.logModule('properties', `${window.properties.length} imóveis listados no admin`);
};

// ========== FUNÇÃO 12: Sincronização com Supabase (NOVA) ==========
window.syncWithSupabase = async function() {
    SC.logModule('properties', 'Iniciando sincronização com Supabase...');
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        SC.logModule('properties', 'Credenciais Supabase não configuradas', 'error');
        return { success: false, error: 'Credenciais não configuradas' };
    }
    
    try {
        // Testar conexão primeiro
        SC.logModule('properties', 'Testando conexão com Supabase...');
        const testResponse = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            }
        });
        
        if (!testResponse.ok) {
            SC.logModule('properties', `Supabase não acessível: ${testResponse.status}`, 'error');
            return { 
                success: false, 
                error: `Erro HTTP ${testResponse.status}: ${testResponse.statusText}` 
            };
        }
        
        SC.logModule('properties', 'Conexão Supabase OK. Buscando dados...');
        
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
                SC.logModule('properties', `${supabaseData.length} imóveis recebidos do Supabase`);
                
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
                    
                    SC.logModule('properties', `${newProperties.length} novos imóveis sincronizados`);
                    return { 
                        success: true, 
                        count: newProperties.length,
                        message: `${newProperties.length} novos imóveis carregados` 
                    };
                } else {
                    SC.logModule('properties', 'Já sincronizado - sem novos imóveis');
                    return { 
                        success: true, 
                        count: 0,
                        message: 'Já está sincronizado com o servidor' 
                    };
                }
            } else {
                SC.logModule('properties', 'Nenhum imóvel no Supabase');
                return { success: true, count: 0, message: 'Nenhum imóvel no servidor' };
            }
        } else {
            const errorText = await response.text();
            SC.logModule('properties', `Erro ao buscar dados: ${response.status} ${errorText.substring(0, 200)}`, 'error');
            return { 
                success: false, 
                error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` 
            };
        }
        
    } catch (error) {
        SC.logModule('properties', `Erro na sincronização: ${error}`, 'error');
        return { 
            success: false, 
            error: error.message,
            isCorsError: error.message.includes('Failed to fetch') || error.message.includes('CORS')
        };
    }
};

// ========== FUNÇÃO 13: Teste Simples de Conexão ==========
window.testSupabaseConnectionSimple = async function() {
    SC.logModule('properties', 'Teste simples de conexão Supabase...');
    
    try {
        // Usar endpoint mais simples
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            },
            mode: 'cors' // Explicitamente pedir modo CORS
        });
        
        SC.logModule('properties', `Status do teste: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            SC.logModule('properties', 'CONEXÃO SUPABASE FUNCIONANDO!');
            return { connected: true, status: response.status };
        } else {
            SC.logModule('properties', `Supabase respondeu com erro: ${response.status}`);
            return { connected: false, status: response.status };
        }
    } catch (error) {
        SC.logModule('properties', `Erro de conexão: ${error.message}`);
        
        // Verificar se é CORS
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            SC.logModule('properties', 'PROVÁVEL ERRO CORS - Verifique configurações do Supabase');
            SC.logModule('properties', `URL do projeto: ${window.SUPABASE_URL}`);
            SC.logModule('properties', `Seu domínio: ${window.location.origin}`);
        }
        
        return { connected: false, error: error.message };
    }
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
SC.logModule('properties', 'carregado com 10 funções principais');

// Função utilitária para executar tarefas em baixa prioridade (AGORA REMOVIDA - USAR SC.runLowPriority)
// function runLowPriority(task) {
//     if ('requestIdleCallback' in window) {
//         requestIdleCallback(task, { timeout: 1000 });
//     } else {
//         setTimeout(task, 100);
//     }
// }

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        SC.logModule('properties', 'DOM carregado - inicializando properties...');

        // Inicializar propriedades em baixa prioridade
        SC.runLowPriority(() => {
            if (typeof window.initializeProperties === 'function') {
                window.initializeProperties();
                SC.logModule('properties', 'initializeProperties executada');
            }

            // Configurar filtros também em baixa prioridade
            SC.runLowPriority(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                    SC.logModule('properties', 'setupFilters executada');
                }
            });
        });
    });
} else {
    SC.logModule('properties', 'DOM já carregado - inicializando agora...');

    // Inicializar direto em baixa prioridade
    SC.runLowPriority(() => {
        if (typeof window.initializeProperties === 'function') {
            window.initializeProperties();
            SC.logModule('properties', 'initializeProperties executada');
        }

        SC.runLowPriority(() => {
            if (typeof window.setupFilters === 'function') {
                window.setupFilters();
                SC.logModule('properties', 'setupFilters executada');
            }
        });
    });
}

// Exportar funções necessárias
window.getInitialProperties = getInitialProperties;

// ========== RECUPERAÇÃO DE EMERGÊNCIA ==========
// properties.js - fallback minimalista (silencioso em produção)

(function essentialPropertiesCheck() {
    const isDebug =
        window.location.search.includes('debug=true') ||
        window.location.hostname.includes('localhost');

    if (isDebug) {
        SC.logModule('properties', '[DEBUG] Verificação essencial: window.properties...');
    }

    const checkInterval = setInterval(() => {
        if (!window.properties || window.properties.length === 0) {

            if (isDebug) {
                SC.logModule('properties', '[DEBUG] window.properties vazio, aguardando carregamento...', 'warn');
            }

            // Recuperação tardia com prioridade baixa
            setTimeout(() => {
                if (!window.properties || window.properties.length === 0) {
                    const stored = localStorage.getItem('weberlessa_properties');

                    if (stored) {
                        try {
                            window.properties = JSON.parse(stored);

                            if (isDebug) {
                                SC.logModule('properties', `[DEBUG] Recuperado do localStorage: ${window.properties.length} imóveis`);
                            }

                        } catch (e) {
                            if (isDebug) {
                                SC.logModule('properties', '[DEBUG] Erro ao parsear localStorage', 'error');
                            }
                        }
                    }
                }
            }, 5000);

        } else {
            if (isDebug) {
                SC.logModule('properties', `[DEBUG] Verificação OK: ${window.properties.length} imóveis carregados`);
            }
            clearInterval(checkInterval);
        }
    }, 2000);
})();

// Inicialização pesada em prioridade baixa
setTimeout(() => {
    if (typeof window.initializeProperties === 'function') {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                window.initializeProperties();
            }, { timeout: 1000 });
        } else {
            setTimeout(() => {
                window.initializeProperties();
            }, 100);
        }
    }
}, 0);

function forceLoadProperties() {
    SC.logModule('properties', 'FORÇANDO CARREGAMENTO DE IMÓVEIS...');
    
    // Estratégia 1: localStorage
    const stored = localStorage.getItem('weberlessa_properties');
    if (stored) {
        try {
            window.properties = JSON.parse(stored);
            SC.logModule('properties', `Recuperado do localStorage: ${window.properties.length} imóveis`);
            
            // Atualizar interface
            if (typeof window.renderProperties === 'function') {
                window.renderProperties('todos');
            }
            
            if (typeof window.loadPropertyList === 'function') {
                setTimeout(() => window.loadPropertyList(), 300);
            }
            
            return;
        } catch (e) {
            SC.logModule('properties', `Erro ao parsear localStorage: ${e}`, 'error');
        }
    }
    
    // Estratégia 2: Dados iniciais
    SC.logModule('properties', 'Carregando dados iniciais...');
    window.properties = getInitialProperties();
    window.savePropertiesToStorage();
    
    SC.logModule('properties', `Dados iniciais carregados: ${window.properties.length} imóveis`);
    
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
    SC.logModule('properties', 'Usando fallback fetch direto para Supabase...');
    
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
            SC.logModule('properties', `Fallback fetch falhou: ${errorText.substring(0, 200)}`, 'error');
            return { success: false, error: errorText };
        }
    } catch (error) {
        SC.logModule('properties', `Erro no fallback fetch: ${error}`, 'error');
        return { success: false, error: error.message };
    }
}

// Script de verificação automática das funções críticas
setTimeout(() => {
    console.group('🔍 VERIFICAÇÃO DAS 4 FUNÇÕES CRÍTICAS');
    
    // Verificar se funções estão no SharedCore
    const criticalFunctions = ['stringSimilarity', 'runLowPriority'];
    criticalFunctions.forEach(func => {
        const inSharedCore = window.SharedCore && typeof window.SharedCore[func] === 'function';
        const inGlobal = typeof window[func] === 'function';
        
        console.log(`${func}:`);
        console.log(`  SharedCore: ${inSharedCore ? '✅' : '❌'}`);
        console.log(`  Global: ${inGlobal ? '⚠️  (DEVE ser removida)' : '✅'}`);
        
        if (inGlobal && inSharedCore) {
            console.warn(`  🔧 MIGRAR: Substituir window.${func}() por SharedCore.${func}()`);
        }
    });
    
    console.groupEnd();
}, 1000);

// FUNÇÃO DE EMERGÊNCIA: Forçar correção dos filtros
window.fixFiltersEmergency = function() {
    console.group('🚨 CORREÇÃO DE EMERGÊNCIA DOS FILTROS');
    
    // 1. Remover TODOS os estilos inline
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.removeAttribute('style');
        btn.classList.remove('active');
    });
    
    // 2. Recriar listeners do zero
    if (typeof window.setupFilters === 'function') {
        window.setupFilters();
    }
    
    // 3. Verificar CSS está carregado
    const hasFilterCSS = Array.from(document.styleSheets).some(sheet => {
        try {
            return sheet.cssRules && Array.from(sheet.cssRules).some(rule => 
                rule.selectorText && rule.selectorText.includes('.filter-btn')
            );
        } catch(e) {
            return false;
        }
    });
    
    console.log(`✅ CSS carregado: ${hasFilterCSS ? 'SIM' : 'NÃO'}`);
    console.log(`🎯 Botões encontrados: ${document.querySelectorAll('.filter-btn').length}`);
    
    // 4. Testar automaticamente
    setTimeout(() => {
        const buttons = document.querySelectorAll('.filter-btn');
        if (buttons.length > 0) {
            // Simular clique no primeiro
            buttons[0].click();
            
            setTimeout(() => {
                const activeAfterClick = document.querySelectorAll('.filter-btn.active').length;
                console.log(`✅ Após clique: ${activeAfterClick} botão(s) ativo(s)`);
                
                if (activeAfterClick === 1) {
                    console.log('🎉 CORREÇÃO BEM-SUCEDIDA!');
                    alert('✅ Filtros corrigidos com sucesso!');
                } else {
                    console.error(`❌ ERRO: ${activeAfterClick} botões ativos (deveria ser 1)`);
                    alert('⚠️ Ainda há problema com os filtros. Recarregue a página.');
                }
            }, 200);
        }
    }, 500);
    
    console.groupEnd();
};

// Executar correção automaticamente após 3 segundos
setTimeout(() => {
    // Verificar se há múltiplos botões ativos
    const activeButtons = document.querySelectorAll('.filter-btn.active');
    if (activeButtons.length > 1) {
        console.warn(`⚠️ Detectado ${activeButtons.length} botões ativos simultaneamente`);
        window.fixFiltersEmergency();
    }
}, 3000);
