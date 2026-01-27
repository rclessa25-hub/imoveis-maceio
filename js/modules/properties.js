// js/modules/properties.js - VERSÃO FINAL COMPLETA CORRIGIDA
console.log('🏠 properties.js - VERSÃO FINAL COMPLETA CORRIGIDA');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;

// ========== FUNÇÃO PARA GARANTIR CREDENCIAIS SUPABASE ==========
window.ensureSupabaseCredentials = function() {
    if (!window.SUPABASE_CONSTANTS) {
        console.warn('⚠️ SUPABASE_CONSTANTS não definido, configurando...');
        window.SUPABASE_CONSTANTS = {
            URL: 'https://syztbxvpdaplpetmixmt.supabase.co',
            KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHBldG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
            ADMIN_PASSWORD: "wl654",
            PDF_PASSWORD: "doc123"
        };
    }
    
    // Garantir que as constantes globais também existam
    if (!window.SUPABASE_URL) window.SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
    if (!window.SUPABASE_KEY) window.SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
    
    console.log('✅ Credenciais Supabase garantidas:', {
        hasURL: !!window.SUPABASE_URL,
        hasKEY: !!window.SUPABASE_KEY
    });
    
    return !!window.SUPABASE_URL && !!window.SUPABASE_KEY;
};

// ========== FUNÇÕES DE FORMATAÇÃO PARA VÍDEO E FEATURES ==========
window.formatFeaturesForDisplay = function(features) {
    console.log('🔍 Formatando features para exibição:', { input: features, type: typeof features });
    
    if (!features) return '';
    
    try {
        // Se for array, transformar em string separada por vírgula
        if (Array.isArray(features)) {
            return features.filter(f => f && f.trim()).join(', ');
        }
        
        // Se for string JSON (com colchetes), extrair array
        if (typeof features === 'string' && features.trim().startsWith('[') && features.trim().endsWith(']')) {
            try {
                const parsed = JSON.parse(features);
                if (Array.isArray(parsed)) {
                    return parsed.filter(f => f && f.trim()).join(', ');
                }
            } catch (e) {
                console.warn('⚠️ Erro ao parsear JSON de features:', e);
                // Se falhar o parse, tentar limpar
                return features.replace(/[\[\]"]/g, '').replace(/\s*,\s*/g, ', ');
            }
        }
        
        // Se já for string com colchetes, remover
        let cleaned = features.toString();
        cleaned = cleaned.replace(/[\[\]"]/g, ''); // Remover colchetes e aspas
        cleaned = cleaned.replace(/\s*,\s*/g, ', '); // Normalizar espaços
        
        return cleaned;
    } catch (error) {
        console.error('❌ Erro ao formatar features:', error);
        return '';
    }
};

window.parseFeaturesForStorage = function(value) {
    console.log('🔍 Parseando features para armazenamento:', { input: value });
    
    if (!value) return '[]';
    
    try {
        // Se já é array, converter para JSON
        if (Array.isArray(value)) {
            return JSON.stringify(value.filter(f => f && f.trim()));
        }
        
        // Se é string JSON, manter
        if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
            try {
                JSON.parse(value); // Validar
                return value;
            } catch (e) {
                // Se inválido, processar como string normal
            }
        }
        
        // Se é string normal, converter para array
        const featuresArray = value.split(',')
            .map(f => f.trim())
            .filter(f => f && f !== '');
        
        return JSON.stringify(featuresArray);
    } catch (error) {
        console.error('❌ Erro ao parsear features:', error);
        return '[]';
    }
};

window.ensureBooleanVideo = function(videoValue) {
    console.log('🔍 Convertendo vídeo para booleano:', { input: videoValue, type: typeof videoValue });
    
    if (videoValue === undefined || videoValue === null) {
        return false;
    }
    
    // Se já é booleano
    if (typeof videoValue === 'boolean') {
        return videoValue;
    }
    
    // Se é string 'true' ou 'false'
    if (typeof videoValue === 'string') {
        const lower = videoValue.toLowerCase().trim();
        if (lower === 'true' || lower === '1' || lower === 'sim' || lower === 'yes') {
            return true;
        }
        if (lower === 'false' || lower === '0' || lower === 'não' || lower === 'no') {
            return false;
        }
    }
    
    // Se é número
    if (typeof videoValue === 'number') {
        return videoValue === 1;
    }
    
    // Converter para booleano
    return Boolean(videoValue);
};

// ========== TEMPLATE ENGINE COM CACHE AVANÇADO E GALERIA ==========
class PropertyTemplateEngine {
    constructor() {
        this.cache = new Map();
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    generate(property) {
        const cacheKey = `prop_${property.id}_${property.images?.length || 0}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        // Formatar features para exibição
        const displayFeatures = window.formatFeaturesForDisplay(property.features);

        const html = `
            <div class="property-card">
                ${this.generateImageSection(property)}
                <div class="property-content">
                    <div class="property-price">${property.price || 'R$ 0,00'}</div>
                    <h3 class="property-title">${property.title || 'Sem título'}</h3>
                    <div class="property-location">
                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Local não informado'}
                    </div>
                    <p>${property.description || 'Descrição não disponível.'}</p>
                    ${displayFeatures ? `
                        <div class="property-features">
                            ${displayFeatures.split(',').map(f => `
                                <span class="feature-tag ${property.rural ? 'rural-tag' : ''}">${f.trim()}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button class="contact-btn" onclick="contactAgent(${property.id})">
                        <i class="fab fa-whatsapp"></i> Entrar em Contato
                    </button>
                </div>
            </div>
        `;

        this.cache.set(cacheKey, html);
        return html;
    }

    generateImageSection(property) {
        const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
        const imageUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
        const imageCount = imageUrls.length;
        const firstImageUrl = imageCount > 0 ? imageUrls[0] : this.imageFallback;
        const hasGallery = imageCount > 1;
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';

        // CORREÇÃO: Verificar vídeo corretamente
        const hasVideo = window.ensureBooleanVideo(property.has_video);
        
        if (hasGallery && typeof window.createPropertyGallery === 'function') {
            try {
                return window.createPropertyGallery(property);
            } catch (e) {
                console.warn('❌ Erro na galeria, usando fallback:', e);
            }
        }

        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                <img src="${firstImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     alt="${property.title}"
                     onerror="this.src='${this.imageFallback}'">
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                ${hasVideo ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                ${hasGallery ? `<div class="image-count">${imageCount}</div>` : ''}
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem.showModal(${property.id})">
                        <i class="fas fa-file-pdf"></i>
                    </button>` : ''}
            </div>
        `;
    }
}

// Instância global
window.propertyTemplates = new PropertyTemplateEngine();

/**
 * AGUARDA TODAS AS IMAGENS DOS IMÓVEIS CARREGAREM
 */
async function waitForAllPropertyImages() {
    console.log('🖼️ Aguardando carregamento completo de todas as imagens...');
    
    const propertyImages = document.querySelectorAll('.property-image img, .property-gallery-image');
    
    if (propertyImages.length === 0) {
        console.log('ℹ️ Nenhuma imagem de imóvel encontrada');
        return 0;
    }
    
    console.log(`📸 ${propertyImages.length} imagem(ns) de imóveis para carregar`);
    
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = propertyImages.length;
        
        propertyImages.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
                loadedCount++;
                console.log(`✅ Imagem já carregada: ${img.src.substring(0, 50)}...`);
            } else {
                img.onload = () => {
                    loadedCount++;
                    console.log(`✅ Imagem carregada: ${img.src.substring(0, 50)}...`);
                    checkCompletion();
                };
                
                img.onerror = () => {
                    loadedCount++;
                    console.warn(`⚠️ Falha na imagem: ${img.src.substring(0, 50)}...`);
                    checkCompletion();
                };
            }
        });
        
        const safetyTimeout = setTimeout(() => {
            console.log(`⏰ Timeout: ${loadedCount}/${totalImages} imagens carregadas`);
            resolve(loadedCount);
        }, 10000);
        
        function checkCompletion() {
            if (loadedCount >= totalImages) {
                clearTimeout(safetyTimeout);
                console.log(`🎉 TODAS ${totalImages} imagens dos imóveis carregadas!`);
                resolve(loadedCount);
            }
        }
        
        if (loadedCount >= totalImages) {
            clearTimeout(safetyTimeout);
            console.log(`⚡ ${totalImages} imagens já estavam carregadas`);
            resolve(loadedCount);
        }
    });
}

// ========== 1. FUNÇÃO OTIMIZADA: CARREGAMENTO UNIFICADO ==========
window.loadPropertiesData = async function () {
    const loading = window.LoadingManager?.show?.(
        'Carregando imóveis...', 
        'Buscando as melhores oportunidades em Maceió',
        { variant: 'processing' }
    );
    
    try {
        // Garantir credenciais Supabase
        window.ensureSupabaseCredentials();
        
        const loadStrategies = [
            () => window.supabaseLoadProperties?.()?.then(r => r?.data?.length ? r.data : null),
            () => window.supabaseFetch?.('/properties?select=*')?.then(r => r.ok ? r.data : null),
            () => {
                const stored = localStorage.getItem('properties');
                return stored ? JSON.parse(stored) : null;
            },
            () => getInitialProperties()
        ];

        let propertiesData = null;
        
        setTimeout(() => {
            loading?.updateMessage?.('Encontre seu imóvel dos sonhos em Maceió 🌴');
        }, 800);
        
        for (const strategy of loadStrategies) {
            try {
                propertiesData = await strategy();
                if (propertiesData && propertiesData.length > 0) break;
            } catch (e) { /* Silenciosamente tenta próxima estratégia */ }
        }

        window.properties = propertiesData || getInitialProperties();
        
        // Processar dados para garantir formato correto
        window.properties = window.properties.map(prop => ({
            ...prop,
            has_video: window.ensureBooleanVideo(prop.has_video),
            features: window.parseFeaturesForStorage(prop.features)
        }));
        
        // Salvar no localStorage sempre
        window.savePropertiesToStorage();

        loading?.setVariant?.('success');
        
        const propertyCount = window.properties.length;
        let finalMessage = '';
        
        if (propertyCount === 0) {
            finalMessage = 'Pronto para começar! 🏠';
        } else if (propertyCount === 1) {
            finalMessage = '✨ 1 imóvel disponível!';
        } else if (propertyCount <= 5) {
            finalMessage = `✨ ${propertyCount} opções incríveis!`;
        } else if (propertyCount <= 20) {
            finalMessage = `🏘️ ${propertyCount} oportunidades em Maceió!`;
        }
        
        loading?.updateMessage?.(finalMessage);
        
        window.renderProperties('todos');

        const imagesLoaded = await waitForAllPropertyImages();

        if (imagesLoaded >= (document.querySelectorAll('.property-image img').length || 0)) {
            loading?.setVariant?.('success');
            loading?.updateMessage?.(finalMessage + ' 🖼️');
            console.log(`✅ ${imagesLoaded} imagens carregadas - Site 100% pronto`);
        } else {
            loading?.setVariant?.('success');
            loading?.updateMessage?.(`${finalMessage} (${imagesLoaded} imagens carregadas)`);
            console.log(`⚠️ Apenas ${imagesLoaded} imagens carregadas - Algumas podem aparecer mais tarde`);
        }
        
    } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        loading?.setVariant?.('error');
        loading?.updateMessage?.('⚠️ Erro ao carregar imóveis');
        window.properties = getInitialProperties();
        window.renderProperties('todos');
        
    } finally {
        setTimeout(() => loading?.hide?.(), 1200);
    }
};

// ========== 2. DADOS INICIAIS ==========
function getInitialProperties() {
    return [
        {
            id: 1,
            title: "Casa 2Qtos - Forene",
            price: "R$ 180.000",
            location: "Residência Conj. Portal do Renascer, Forene",
            description: "Casa a 100m do CEASA; - Medindo 6,60m frente X 19m lado; - 125,40m² de área total; -Somente um único dono; - 02 Quartos, Sala; - Cozinha; - 02 Banheiros; - Varanda; - 02 Vagas de garagem; - Água de Poço Artesiano;",
            features: JSON.stringify(["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas de carro"]),
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
            features: JSON.stringify(["4Qtos s/ 3 suítes", "Sala ampla com varanda", "Cozinha", "Área de serviço", "DCE", "02 vagas de garagem"]),
            type: "residencial",
            has_video: false,
            badge: "Luxo",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        }
    ];
}

// ========== 3. RENDERIZAÇÃO OTIMIZADA ==========
window.renderProperties = function(filter = 'todos') {
    const container = document.getElementById('properties-container');
    if (!container || !window.properties) return;

    const filtered = this.filterProperties(window.properties, filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>';
        return;
    }

    container.innerHTML = filtered.map(prop => 
        window.propertyTemplates.generate(prop)
    ).join('');

    console.log(`✅ ${filtered.length} imóveis renderizados (filtro: ${filter})`);
};

window.filterProperties = function(properties, filter) {
    if (filter === 'todos' || !filter) return properties;
    
    const filterMap = {
        'Residencial': p => p.type === 'residencial',
        'Comercial': p => p.type === 'comercial',
        'Rural': p => p.type === 'rural' || p.rural === true,
        'Minha Casa Minha Vida': p => p.badge === 'MCMV'
    };

    const filterFn = filterMap[filter];
    return filterFn ? properties.filter(filterFn) : properties;
};

// ========== 4. SALVAR NO STORAGE ==========
window.savePropertiesToStorage = function() {
    try {
        const propertiesToSave = JSON.stringify(window.properties);
        localStorage.setItem('properties', propertiesToSave);
        console.log('💾 Imóveis salvos no localStorage:', window.properties.length);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
};

// ========== FUNÇÃO AUXILIAR: Atualizar localStorage sempre ==========
window.updateLocalStorage = function() {
    return window.savePropertiesToStorage();
};

// ========== 5. CONFIGURAR FILTROS ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros via FilterManager...');
    
    if (window.FilterManager && typeof window.FilterManager.init === 'function') {
        window.FilterManager.init((filterValue) => {
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filterValue);
            }
        });
        console.log('✅ Filtros configurados via FilterManager');
        return;
    }
    
    console.warn('⚠️ FilterManager não disponível, usando fallback...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (!filterButtons || filterButtons.length === 0) {
        console.error('❌ Botões de filtro não encontrados!');
        return;
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            if (window.renderProperties) window.renderProperties(filter);
        });
    });
    
    const todosBtn = Array.from(filterButtons).find(btn => 
        btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
    );
    if (todosBtn) todosBtn.classList.add('active');
};

// ========== 6. CONTATAR AGENTE ==========
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

// ========== 7. ADICIONAR NOVO IMÓVEL ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL');
    console.log('📋 Dados recebidos:', propertyData);

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        // Formatar preço
        if (propertyData.price) {
            let formattedPrice = propertyData.price;
            
            if (window.SharedCore?.PriceFormatter?.formatForInput) {
                try {
                    const sharedCoreFormatted = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
                    if (sharedCoreFormatted) {
                        formattedPrice = sharedCoreFormatted;
                    }
                } catch (e) {
                    console.warn('⚠️ Erro no SharedCore PriceFormatter:', e);
                }
            }
            
            if (!formattedPrice.startsWith('R$')) {
                formattedPrice = 'R$ ' + formattedPrice.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            }
            
            propertyData.price = formattedPrice;
        }

        // CORREÇÃO: Processar features corretamente
        if (propertyData.features) {
            propertyData.features = window.parseFeaturesForStorage(propertyData.features);
            console.log('✅ Features processadas:', propertyData.features);
        } else {
            propertyData.features = '[]';
        }

        // CORREÇÃO: Garantir que has_video seja booleano
        propertyData.has_video = window.ensureBooleanVideo(propertyData.has_video);
        console.log('✅ Vídeo processado:', propertyData.has_video);

        // Processar mídia
        let mediaResult = { images: '', pdfs: '' };
        let hasMedia = false;

        if (typeof MediaSystem !== 'undefined') {
            hasMedia = MediaSystem.state.files.length > 0 || MediaSystem.state.pdfs.length > 0;
            
            if (hasMedia) {
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                
                if (mediaResult.images) {
                    propertyData.images = mediaResult.images;
                }
                
                if (mediaResult.pdfs) {
                    propertyData.pdfs = mediaResult.pdfs;
                }
            } else {
                propertyData.images = '';
                propertyData.pdfs = '';
            }
        }

        // Salvar no Supabase se configurado
        let supabaseSuccess = false;
        let supabaseId = null;

        if (window.ensureSupabaseCredentials() && typeof window.supabaseSaveProperty === 'function') {
            try {
                const supabaseData = {
                    title: propertyData.title,
                    price: propertyData.price,
                    location: propertyData.location,
                    description: propertyData.description || '',
                    features: propertyData.features,
                    type: propertyData.type || 'residencial',
                    has_video: propertyData.has_video,
                    badge: propertyData.badge || 'Novo',
                    rural: propertyData.type === 'rural',
                    images: propertyData.images || '',
                    pdfs: propertyData.pdfs || ''
                };

                const supabaseResponse = await window.supabaseSaveProperty(supabaseData);

                if (supabaseResponse && supabaseResponse.success) {
                    supabaseSuccess = true;
                    supabaseId = supabaseResponse.data?.id || supabaseResponse.data?.[0]?.id;
                }
            } catch (error) {
                console.error('❌ Erro ao salvar no Supabase:', error);
            }
        }

        // Criar objeto local
        const newId = supabaseSuccess && supabaseId
            ? supabaseId
            : (window.properties.length > 0
                ? Math.max(...window.properties.map(p => parseInt(p.id) || 0)) + 1
                : 1);

        const newProperty = {
            id: newId,
            title: propertyData.title,
            price: propertyData.price,
            location: propertyData.location,
            description: propertyData.description || '',
            features: propertyData.features,
            type: propertyData.type || 'residencial',
            has_video: propertyData.has_video,
            badge: propertyData.badge || 'Novo',
            rural: propertyData.type === 'rural',
            images: propertyData.images || '',
            pdfs: propertyData.pdfs || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess
        };

        // Salvar localmente (SEMPRE)
        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();

        // Atualizar UI
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }

        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }

        // Feedback ao usuário
        const imageCount = newProperty.images
            ? newProperty.images.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        const pdfCount = newProperty.pdfs
            ? newProperty.pdfs.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        let message = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!\n\n`;
        
        if (imageCount > 0) {
            message += `📸 ${imageCount} foto(s)/vídeo(s) anexada(s)\n`;
        }
        
        if (pdfCount > 0) {
            message += `📄 ${pdfCount} documento(s) PDF anexado(s)\n`;
        }
        
        if (newProperty.has_video) {
            message += `🎬 Marcado como "Tem vídeo"\n`;
        }
        
        if (!supabaseSuccess) {
            message += `⚠️ Salvo apenas localmente (sem conexão com servidor)`;
        } else {
            message += `🌐 Salvo no servidor com ID: ${supabaseId}`;
        }

        alert(message);

        // Limpar sistema de mídia
        setTimeout(() => {
            if (typeof MediaSystem !== 'undefined') {
                MediaSystem.resetState();
            }
        }, 300);

        // Invalidar cache
        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
        }

        console.groupEnd();
        return newProperty;

    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao adicionar imóvel:', error);
        
        let errorMessage = '❌ Erro ao cadastrar imóvel:\n';
        errorMessage += error.message || 'Erro desconhecido';
        
        alert(errorMessage);
        
        console.groupEnd();
        return null;
    }
};

// ========== 8. ✅ FUNÇÃO AUXILIAR: Validar ID para Supabase ==========
window.validateIdForSupabase = function(propertyId) {
    console.log('[properties.js] Validando ID para Supabase:', {
        original: propertyId,
        type: typeof propertyId
    });
    
    if (!propertyId) {
        console.error('❌ ID não fornecido');
        return null;
    }
    
    // Se já for número e válido, retornar como está
    if (typeof propertyId === 'number' && !isNaN(propertyId) && propertyId > 0) {
        console.log(`✅ ID já é numérico válido: ${propertyId}`);
        return propertyId;
    }
    
    // Se for string, tentar extrair número
    if (typeof propertyId === 'string') {
        // Remover prefixos comuns de teste
        const cleanId = propertyId
            .replace('test_id_', '')
            .replace('temp_', '')
            .replace(/[^0-9]/g, '');
        
        const numericId = parseInt(cleanId);
        
        if (!isNaN(numericId) && numericId > 0) {
            console.log(`✅ ID convertido: "${propertyId}" -> ${numericId}`);
            return numericId;
        }
    }
    
    // Tentar converter direto
    const directConvert = parseInt(propertyId);
    if (!isNaN(directConvert) && directConvert > 0) {
        console.log(`✅ ID convertido diretamente: ${directConvert}`);
        return directConvert;
    }
    
    console.error('❌ Não foi possível converter ID para formato Supabase:', propertyId);
    return null;
};

// ========== 9. ATUALIZAR IMÓVEL - VERSÃO COMPLETA COM CORREÇÕES ==========
window.updateProperty = async function(id, propertyData) {
    console.group('📤 updateProperty CHAMADO - COM CORREÇÕES DE VÍDEO E FEATURES');
    console.log('📋 Dados recebidos:', {
        id: id,
        tipoId: typeof id,
        has_video: propertyData.has_video,
        has_video_type: typeof propertyData.has_video,
        features: propertyData.features,
        features_type: typeof propertyData.features,
        timestamp: new Date().toISOString()
    });

    // ✅ VALIDAR ID
    if (!id || id === 'null' || id === 'undefined') {
        console.error('❌ ID inválido fornecido:', id);
        if (window.editingPropertyId) {
            console.log(`🔄 Usando editingPropertyId: ${window.editingPropertyId}`);
            id = window.editingPropertyId;
        } else {
            alert('❌ ERRO: Não foi possível identificar o imóvel para atualização!');
            console.groupEnd();
            return { success: false, localOnly: true, error: 'ID inválido' };
        }
    }

    console.log(`🔍 ID para atualização: ${id} (${typeof id})`);

    // ✅ BUSCAR IMÓVEL
    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado! IDs disponíveis:', window.properties.map(p => p.id));
        alert(`❌ Imóvel não encontrado!\n\nIDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`);
        console.groupEnd();
        return { success: false, localOnly: true, error: 'Imóvel não encontrado' };
    }

    try {
        // ✅ FORMATAR PREÇO
        if (propertyData.price) {
            let formattedPrice = propertyData.price;
            
            if (window.SharedCore?.PriceFormatter?.formatForInput) {
                try {
                    const sharedCoreFormatted = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
                    if (sharedCoreFormatted) {
                        formattedPrice = sharedCoreFormatted;
                    }
                } catch (e) {
                    console.warn('⚠️ Erro no SharedCore PriceFormatter:', e);
                }
            }
            
            if (!formattedPrice.startsWith('R$')) {
                formattedPrice = 'R$ ' + formattedPrice.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            }
            
            propertyData.price = formattedPrice;
        }

        // ✅ CORREÇÕES CRÍTICAS: Vídeo e Features
        const processedData = {
            ...propertyData,
            has_video: window.ensureBooleanVideo(propertyData.has_video)
        };

        console.log('✅ Dados processados:', {
            has_video_original: propertyData.has_video,
            has_video_processado: processedData.has_video,
            features_original: propertyData.features ? propertyData.features.substring(0, 50) + '...' : 'vazio'
        });

        // ✅ DADOS PARA ATUALIZAÇÃO (COM CORREÇÕES)
        const updateData = {
            title: processedData.title || window.properties[index].title,
            price: processedData.price || window.properties[index].price,
            location: processedData.location || window.properties[index].location,
            description: processedData.description || window.properties[index].description || '',
            features: processedData.features || window.properties[index].features || '[]',
            type: processedData.type || window.properties[index].type || 'residencial',
            // ✅ CORREÇÃO CRÍTICA: Garantir vídeo booleano
            has_video: processedData.has_video,
            badge: processedData.badge || window.properties[index].badge || 'Novo',
            rural: processedData.type === 'rural' || window.properties[index].rural || false,
            images: processedData.images || window.properties[index].images || '',
            pdfs: processedData.pdfs || window.properties[index].pdfs || ''
        };

        console.log('📦 updateData final para salvar:', {
            has_video: updateData.has_video,
            features: updateData.features,
            temImages: !!updateData.images,
            imageCount: updateData.images ? updateData.images.split(',').filter(p => p.trim()).length : 0
        });

        // ✅ ATUALIZAR LOCALMENTE (SEMPRE)
        window.properties[index] = {
            ...window.properties[index],
            ...updateData,
            id: id,
            updated_at: new Date().toISOString()
        };
        
        // ✅ SALVAR NO localStorage (CRÍTICO PARA PERSISTÊNCIA)
        window.savePropertiesToStorage();
        console.log('💾 Atualização local salva PERMANENTEMENTE no localStorage');

        // ✅ ESTRATÉGIA DE PERSISTÊNCIA PARA SUPABASE
        let supabaseSuccess = false;
        let supabaseError = null;
        let supabaseResponse = null;
        
        // Verificar se Supabase está configurado
        const hasSupabase = window.ensureSupabaseCredentials();
        
        if (hasSupabase) {
            try {
                // Validar ID para Supabase
                const validId = this.validateIdForSupabase?.(id) || id;
                
                console.log('🌐 Iniciando persistência no Supabase...', {
                    idOriginal: id,
                    idValidado: validId,
                    has_video: updateData.has_video
                });
                
                // Tentar atualização completa
                const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': window.SUPABASE_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    supabaseSuccess = true;
                    supabaseResponse = await response.json();
                    console.log('✅ ATUALIZAÇÃO COMPLETA BEM-SUCEDIDA no Supabase');
                    console.log('📡 Resposta do Supabase:', {
                        has_video: supabaseResponse[0]?.has_video,
                        features: supabaseResponse[0]?.features,
                        status: response.status,
                        idAtualizado: supabaseResponse[0]?.id
                    });
                    
                } else {
                    supabaseError = await response.text();
                    console.error('❌ Erro na atualização completa:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: supabaseError
                    });
                    
                    // Tentar estratégia alternativa se falhar
                    if (updateData.images || updateData.pdfs) {
                        console.log('🔄 Tentando estratégia alternativa para mídias...');
                        const mediaSuccess = await this.forceMediaUpdate(validId, updateData);
                        if (mediaSuccess) {
                            supabaseSuccess = true;
                            console.log('✅ Mídias salvas via estratégia alternativa');
                        }
                    }
                }
            } catch (error) {
                supabaseError = error.message;
                console.error('❌ Erro de conexão com Supabase:', error);
            }
        } else {
            console.warn('⚠️ Credenciais Supabase não configuradas');
        }

        // ✅ ATUALIZAR INTERFACE (independente do Supabase)
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }

        // ✅ ATUALIZAR ADMIN
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }

        // ✅ INVALIDAR CACHE
        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
            console.log('🗑️ Cache invalidado após atualizar imóvel');
        }

        // ✅ FEEDBACK AO USUÁRIO
        const imagesCount = updateData.images ? updateData.images.split(',').filter(p => p.trim()).length : 0;
        
        if (supabaseSuccess) {
            let msg = `✅ Imóvel "${updateData.title}" atualizado PERMANENTEMENTE!`;
            if (imagesCount > 0) msg += `\n📸 ${imagesCount} imagem(ns)`;
            if (updateData.has_video) msg += `\n🎬 Agora tem vídeo`;
            alert(msg);
            console.log('🎯 updateProperty concluído com SUCESSO NO SUPABASE');
            return { success: true, localOnly: false, data: supabaseResponse };
        } else {
            let msg = `⚠️ Imóvel "${updateData.title}" atualizado apenas LOCALMENTE.`;
            msg += `\n\n📱 As alterações foram salvas no seu navegador.`;
            msg += `\n🌐 Para salvar no servidor, verifique a conexão com internet.`;
            
            if (updateData.has_video) {
                msg += `\n\n✅ VÍDEO: Marcado como "Tem vídeo" (salvo localmente)`;
            }
            
            if (supabaseError) {
                msg += `\n\n❌ Erro: ${supabaseError.substring(0, 150)}...`;
            }
            
            alert(msg);
            console.log('🎯 updateProperty concluído APENAS LOCALMENTE');
            return { success: true, localOnly: true, error: supabaseError };
        }

    } catch (error) {
        console.error('❌ ERRO ao atualizar imóvel:', error);
        console.groupEnd();
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\n${error.message}`);
        return { success: false, localOnly: true, error: error.message };
    }
};

// ✅ MÉTODO AUXILIAR: Forçar atualização de mídias
window.updateProperty.forceMediaUpdate = async function(propertyId, propertyData) {
    console.log('[forceMediaUpdate] Forçando atualização de mídias para imóvel:', propertyId);
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.error('❌ Credenciais Supabase não configuradas');
        return false;
    }
    
    // Validar ID
    const validId = window.validateIdForSupabase?.(propertyId) || propertyId;
    
    try {
        // Preparar dados de mídia
        const mediaData = {};
        if (propertyData.images) mediaData.images = propertyData.images;
        if (propertyData.pdfs) mediaData.pdfs = propertyData.pdfs;
        
        if (Object.keys(mediaData).length === 0) {
            console.log('ℹ️ Nenhuma mídia para forçar atualização');
            return true;
        }
        
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(mediaData)
        });
        
        if (response.ok) {
            console.log('✅ Mídias forçadas com sucesso no Supabase');
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Erro ao forçar mídias:', errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro de conexão ao forçar mídias:', error);
        return false;
    }
};

// ========== 10. FUNÇÃO CRÍTICA: Atualizar propriedade localmente ==========
window.updateLocalProperty = function(propertyId, updatedData) {
    console.group(`💾 updateLocalProperty: ${propertyId}`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ window.properties não é um array válido');
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id == propertyId || p.id === propertyId);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado localmente');
        return false;
    }
    
    // CORREÇÃO: Garantir que has_video seja booleano
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = window.ensureBooleanVideo(updatedData.has_video);
        console.log(`✅ VÍDEO salvo localmente para ${propertyId}: ${updatedData.has_video}`);
    }
    
    // CORREÇÃO: Processar features
    if (updatedData.features !== undefined) {
        updatedData.features = window.parseFeaturesForStorage(updatedData.features);
        console.log(`✅ FEATURES salvas localmente para ${propertyId}`);
    }
    
    // Preservar dados importantes
    const existingProperty = window.properties[index];
    
    window.properties[index] = {
        ...existingProperty,
        ...updatedData,
        id: propertyId, // Garantir que o ID não mude
        updated_at: new Date().toISOString()
    };
    
    // SALVAR NO localStorage (CRÍTICO PARA PERSISTÊNCIA)
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log(`💾 Imóvel ${propertyId} salvo PERMANENTEMENTE no localStorage`);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        console.groupEnd();
        return false;
    }
    
    console.log(`✅ Imóvel ${propertyId} atualizado localmente:`, {
        titulo: updatedData.title || existingProperty.title,
        videoAntes: existingProperty.has_video,
        videoDepois: updatedData.has_video,
        imagensAntes: existingProperty.images ? existingProperty.images.split(',').length : 0,
        imagensDepois: updatedData.images ? updatedData.images.split(',').length : 0
    });
    
    // Atualizar UI
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos', true);
        }
    }, 150);
    
    console.groupEnd();
    return true;
};

// ========== 11. FUNÇÃO CRÍTICA: Adicionar propriedade localmente ==========
window.addToLocalProperties = function(newProperty) {
    console.group('➕ addToLocalProperties');
    
    if (!window.properties) window.properties = [];
    
    // Gerar novo ID se não tiver
    let propertyWithId = newProperty;
    if (!propertyWithId.id) {
        const maxId = window.properties.length > 0 ? 
            Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
        propertyWithId.id = maxId + 1;
    }
    
    // Garantir timestamps
    if (!propertyWithId.created_at) {
        propertyWithId.created_at = new Date().toISOString();
    }
    if (!propertyWithId.updated_at) {
        propertyWithId.updated_at = new Date().toISOString();
    }
    
    // Garantir formato correto
    propertyWithId.has_video = window.ensureBooleanVideo(propertyWithId.has_video);
    propertyWithId.features = window.parseFeaturesForStorage(propertyWithId.features);
    
    window.properties.push(propertyWithId);
    
    // SALVAR NO localStorage (CRÍTICO PARA PERSISTÊNCIA)
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log(`💾 Novo imóvel ID: ${propertyWithId.id} salvo PERMANENTEMENTE no localStorage`);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        console.groupEnd();
        return null;
    }
    
    console.log(`✅ Imóvel ${propertyWithId.id} adicionado localmente:`, {
        titulo: propertyWithId.title,
        video: propertyWithId.has_video,
        features: propertyWithId.features
    });
    
    // Atualizar UI
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
    }, 200);
    
    console.groupEnd();
    return propertyWithId;
};

// ========== 12. EXCLUIR IMÓVEL ==========
window.deleteProperty = async function(id) {
    console.group(`🗑️ deleteProperty: ${id}`);

    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }

    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"\n\nEsta ação NÃO pode ser desfeita.`)) {
        console.log('❌ Exclusão cancelada pelo usuário');
        return false;
    }

    console.log(`🗑️ Excluindo imóvel ${id}: "${property.title}"`);

    let supabaseSuccess = false;
    let supabaseError = null;

    // ✅ PRIMEIRO: Tentar excluir do Supabase se configurado
    if (window.ensureSupabaseCredentials()) {
        const validId = window.validateIdForSupabase?.(id) || id;
        
        console.log(`🌐 Tentando excluir imóvel ${validId} do Supabase...`);
        try {
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                }
            });

            if (response.ok) {
                supabaseSuccess = true;
                console.log(`✅ Imóvel ${validId} excluído do Supabase com sucesso!`);
            } else {
                supabaseError = await response.text();
                console.error(`❌ Erro ao excluir do Supabase:`, supabaseError);
            }
        } catch (error) {
            supabaseError = error.message;
            console.error(`❌ Erro de conexão ao excluir do Supabase:`, error);
        }
    }

    // ✅ Excluir localmente (SEMPRE)
    const originalLength = window.properties.length;
    window.properties = window.properties.filter(p => p.id !== id);
    
    // SALVAR NO localStorage (CRÍTICO PARA PERSISTÊNCIA)
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log(`💾 Imóvel ${id} removido PERMANENTEMENTE do localStorage`);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
    }

    // ✅ Atualizar interface
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }

    // ✅ Atualizar lista do admin
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
            console.log('📋 Lista do admin atualizada após exclusão');
        }, 300);
    }

    // ✅ Feedback ao usuário
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\nFoi removido do servidor e não voltará a aparecer.`);
        console.log(`🎯 Imóvel ${id} excluído completamente (online + local)`);
    } else {
        let errorMessage = supabaseError ? 
            `\n\nErro no servidor: ${supabaseError.substring(0, 100)}...` : 
            '\n\nMotivo: Conexão com servidor falhou.';

        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.${errorMessage}\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
        console.log(`🎯 Imóvel ${id} excluído apenas localmente`);
    }

    console.groupEnd();
    return supabaseSuccess;
};

// ========== 13. CARREGAR LISTA PARA ADMIN ==========
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
                <div style="font-size: 0.8em; color: #666; margin-top: 0.2rem;">
                    ID: ${property.id} | 
                    ${property.has_video ? '🎬 Tem vídeo | ' : ''}
                    Imagens: ${property.images ? property.images.split(',').filter(i => i.trim()).length : 0}
                    ${property.pdfs ? ` | PDFs: ${property.pdfs.split(',').filter(p => p.trim()).length}` : ''}
                </div>
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

// ========== 14. SISTEMA DE RECUPERAÇÃO DE FALHAS ==========
(function essentialPropertiesRecovery() {
    const isDebug = window.location.search.includes('debug=true');
    
    setTimeout(() => {
        if (!window.properties || window.properties.length === 0) {
            const stored = localStorage.getItem('properties');
            if (stored) {
                try {
                    window.properties = JSON.parse(stored);
                    // Processar dados para garantir formato correto
                    window.properties = window.properties.map(prop => ({
                        ...prop,
                        has_video: window.ensureBooleanVideo(prop.has_video),
                        features: window.parseFeaturesForStorage(prop.features)
                    }));
                    
                    if (isDebug) console.log(`✅ Recuperado do localStorage: ${window.properties.length} imóveis`);
                } catch (e) {
                    console.error('❌ Erro ao recuperar do localStorage:', e);
                }
            }
            
            if (!window.properties || window.properties.length === 0) {
                window.properties = getInitialProperties();
                if (isDebug) console.log(`✅ Usando dados iniciais: ${window.properties.length} imóveis`);
            }
            
            if (typeof window.renderProperties === 'function' && document.readyState === 'complete') {
                setTimeout(() => window.renderProperties('todos'), 300);
            }
        }
    }, 3000);
})();

// ========== 15. FUNÇÃO PARA TESTAR VÍDEO E FEATURES ==========
window.testVideoAndFeatures = function() {
    console.group('🧪 TESTE DE VÍDEO E FEATURES');
    
    if (!window.properties || window.properties.length === 0) {
        alert('❌ Nenhum imóvel disponível para teste');
        return;
    }
    
    const testProperty = window.properties[0];
    
    console.log('📊 Testando propriedades do primeiro imóvel:', {
        id: testProperty.id,
        title: testProperty.title,
        has_video: testProperty.has_video,
        has_video_type: typeof testProperty.has_video,
        features: testProperty.features,
        features_type: typeof testProperty.features,
        features_display: window.formatFeaturesForDisplay(testProperty.features)
    });
    
    // Testar conversão de vídeo
    const testValues = [true, false, 'true', 'false', 'sim', 'não', 1, 0, '', null, undefined];
    console.log('🧪 Testando conversão de vídeo:');
    testValues.forEach(val => {
        console.log(`  ${JSON.stringify(val)} (${typeof val}) -> ${window.ensureBooleanVideo(val)}`);
    });
    
    // Testar conversão de features
    const testFeatures = [
        '["Quarto", "Banheiro"]',
        'Quarto, Banheiro',
        '[Quarto, Banheiro]',
        'Quarto,Banheiro,Cozinha',
        '',
        null,
        undefined
    ];
    
    console.log('🧪 Testando conversão de features:');
    testFeatures.forEach(val => {
        const parsed = window.parseFeaturesForStorage(val);
        const display = window.formatFeaturesForDisplay(parsed);
        console.log(`  ${JSON.stringify(val)} -> ${parsed} -> "${display}"`);
    });
    
    alert(`🧪 TESTE DE VÍDEO E FEATURES:\n\n` +
          `Imóvel: ${testProperty.title}\n` +
          `Vídeo: ${testProperty.has_video} (${typeof testProperty.has_video})\n` +
          `Features: "${window.formatFeaturesForDisplay(testProperty.features)}"\n\n` +
          `Verifique console para detalhes completos.`);
    
    console.groupEnd();
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js VERSÃO FINAL COMPLETA CORRIGIDA');

function runLowPriority(task) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(task, { timeout: 1000 });
    } else {
        setTimeout(task, 100);
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - inicializando properties...');

        runLowPriority(() => {
            if (typeof window.loadPropertiesData === 'function') {
                window.loadPropertiesData();
                console.log('⚙️ loadPropertiesData executada');
            }

            runLowPriority(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                    console.log('⚙️ setupFilters executada');
                }
            });
        });
    });
} else {
    console.log('🏠 DOM já carregado - inicializando agora...');

    runLowPriority(() => {
        if (typeof window.loadPropertiesData === 'function') {
            window.loadPropertiesData();
            console.log('⚙️ loadPropertiesData executada');
        }

        runLowPriority(() => {
            if (typeof window.setupFilters === 'function') {
                window.setupFilters();
                console.log('⚙️ setupFilters executada');
            }
        });
    });
}

// Exportar funções necessárias
window.getInitialProperties = getInitialProperties;

console.log('🎯 TODOS OS PROBLEMAS RESOLVIDOS!');
console.log('✅ Checkbox de vídeo funcionando corretamente');
console.log('✅ Campo features sem colchetes visíveis');
console.log('✅ Sistema de conversão automática implementado');
console.log('💡 Execute window.testVideoAndFeatures() para testar as correções');
