// js/modules/properties.js - VERSÃO FINAL CORRIGIDA COM INDICADOR DE VÍDEO REBAIXADO
console.log('🏠 properties.js - VERSÃO FINAL - INDICADOR DE VÍDEO REBAIXADO');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;
window.currentFilter = 'todos';

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
    
    if (!window.SUPABASE_URL) window.SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
    if (!window.SUPABASE_KEY) window.SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
    
    return !!window.SUPABASE_URL && !!window.SUPABASE_KEY;
};

// ========== FUNÇÕES DE FORMATAÇÃO ==========
window.formatFeaturesForDisplay = function(features) {
    if (!features) return '';
    
    try {
        if (Array.isArray(features)) {
            return features.filter(f => f && f.trim()).join(', ');
        }
        
        if (typeof features === 'string' && features.trim().startsWith('[') && features.trim().endsWith(']')) {
            try {
                const parsed = JSON.parse(features);
                if (Array.isArray(parsed)) {
                    return parsed.filter(f => f && f.trim()).join(', ');
                }
            } catch (e) {
                return features.replace(/[\[\]"]/g, '').replace(/\s*,\s*/g, ', ');
            }
        }
        
        let cleaned = features.toString();
        cleaned = cleaned.replace(/[\[\]"]/g, '');
        cleaned = cleaned.replace(/\s*,\s*/g, ', ');
        
        return cleaned;
    } catch (error) {
        console.error('❌ Erro ao formatar features:', error);
        return '';
    }
};

window.parseFeaturesForStorage = function(value) {
    if (!value) return '[]';
    
    try {
        if (Array.isArray(value)) {
            return JSON.stringify(value.filter(f => f && f.trim()));
        }
        
        if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
            try {
                JSON.parse(value);
                return value;
            } catch (e) {}
        }
        
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
    if (videoValue === undefined || videoValue === null) {
        return false;
    }
    
    if (typeof videoValue === 'boolean') {
        return videoValue;
    }
    
    if (typeof videoValue === 'string') {
        const lower = videoValue.toLowerCase().trim();
        if (lower === 'true' || lower === '1' || lower === 'sim' || lower === 'yes') {
            return true;
        }
        if (lower === 'false' || lower === '0' || lower === 'não' || lower === 'no') {
            return false;
        }
    }
    
    if (typeof videoValue === 'number') {
        return videoValue === 1;
    }
    
    return Boolean(videoValue);
};

// ========== TEMPLATE ENGINE COM INDICADOR DE VÍDEO REBAIXADO ==========
class PropertyTemplateEngine {
    constructor() {
        this.cache = new Map();
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    generate(property) {
        const cacheKey = `prop_${property.id}_${property.images?.length || 0}_${property.has_video}`;
        if (this.cache.has(cacheKey)) {
            this.cache.delete(cacheKey);
        }

        const displayFeatures = window.formatFeaturesForDisplay(property.features);
        
        const formatPrice = (price) => {
            if (!price) return 'R$ 0,00';
            if (typeof price === 'string' && price.includes('R$')) return price;
            return `R$ ${price.toString().replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
        };

        const html = `
            <div class="property-card" data-property-id="${property.id}" data-property-title="${property.title}">
                ${this.generateImageSection(property)}
                <div class="property-content">
                    <div class="property-price" data-price-field>${formatPrice(property.price)}</div>
                    <h3 class="property-title" data-title-field>${property.title || 'Sem título'}</h3>
                    <div class="property-location" data-location-field>
                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Local não informado'}
                    </div>
                    <p data-description-field>${property.description || 'Descrição não disponível.'}</p>
                    ${displayFeatures ? `
                        <div class="property-features" data-features-field>
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
        const hasVideo = window.ensureBooleanVideo(property.has_video);
        
        // CORREÇÃO: REMOVIDO top DO INLINE - AGORA CONTROLADO PELO CSS
        const videoIndicatorHTML = hasVideo ? `
            <div class="video-indicator">
                <i class="fas fa-video"></i>
                <span>TEM VÍDEO</span>
            </div>
        ` : '';
        
        const imageCountHTML = hasGallery ? `
            <div class="image-count">
                <i class="fas fa-images"></i>
                <span>${imageCount}</span>
            </div>
        ` : '';
        
        const pdfButtonHTML = hasPdfs ? `
            <button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem.showModal(${property.id})">
                <i class="fas fa-file-pdf"></i>
            </button>
        ` : '';
        
        const badgeHTML = property.badge ? `
            <div class="property-badge ${property.rural ? 'rural-badge' : ''}">
                ${property.badge}
            </div>
        ` : '';

        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}">
                <img src="${firstImageUrl}" 
                     alt="${property.title}"
                     onerror="this.src='${this.imageFallback}'">
                ${badgeHTML}
                ${imageCountHTML}
                ${videoIndicatorHTML}
                ${pdfButtonHTML}
            </div>
        `;
    }
    
    updateCardContent(propertyId, propertyData) {
        console.log(`🔍 Atualizando conteúdo do card ${propertyId}`);
        
        const card = document.querySelector(`.property-card[data-property-id="${propertyId}"]`);
        if (!card) {
            console.warn(`⚠️ Card ${propertyId} não encontrado para atualização parcial`);
            return false;
        }
        
        try {
            if (propertyData.price !== undefined) {
                const priceElement = card.querySelector('[data-price-field]');
                if (priceElement) {
                    const formattedPrice = propertyData.price.includes('R$') 
                        ? propertyData.price 
                        : `R$ ${propertyData.price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
                    priceElement.textContent = formattedPrice;
                }
            }
            
            if (propertyData.title !== undefined) {
                const titleElement = card.querySelector('[data-title-field]');
                if (titleElement) {
                    titleElement.textContent = propertyData.title;
                }
                card.setAttribute('data-property-title', propertyData.title);
            }
            
            if (propertyData.location !== undefined) {
                const locationElement = card.querySelector('[data-location-field]');
                if (locationElement) {
                    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${propertyData.location}`;
                }
            }
            
            if (propertyData.description !== undefined) {
                const descriptionElement = card.querySelector('[data-description-field]');
                if (descriptionElement) {
                    descriptionElement.textContent = propertyData.description;
                }
            }
            
            if (propertyData.features !== undefined) {
                const featuresElement = card.querySelector('[data-features-field]');
                const displayFeatures = window.formatFeaturesForDisplay(propertyData.features);
                
                if (featuresElement) {
                    if (displayFeatures) {
                        featuresElement.innerHTML = displayFeatures.split(',').map(f => `
                            <span class="feature-tag ${propertyData.rural ? 'rural-tag' : ''}">${f.trim()}</span>
                        `).join('');
                    } else {
                        featuresElement.innerHTML = '';
                    }
                }
            }
            
            // ATUALIZAÇÃO DO INDICADOR DE VÍDEO (SEM INLINE STYLES)
            if (propertyData.has_video !== undefined) {
                const videoIndicator = card.querySelector('.video-indicator');
                const hasVideo = window.ensureBooleanVideo(propertyData.has_video);
                const imageSection = card.querySelector('.property-image');
                
                if (hasVideo && !videoIndicator && imageSection) {
                    const oldIndicator = imageSection.querySelector('.video-indicator');
                    if (oldIndicator) oldIndicator.remove();
                    
                    // ADICIONAR SEM INLINE STYLES - CONTROLADO PELO CSS
                    imageSection.innerHTML += `
                        <div class="video-indicator">
                            <i class="fas fa-video"></i>
                            <span>TEM VÍDEO</span>
                        </div>
                    `;
                    
                    console.log(`✅ Indicador de vídeo adicionado (posição controlada pelo CSS)`);
                    
                } else if (!hasVideo && videoIndicator) {
                    videoIndicator.remove();
                    console.log(`✅ Indicador de vídeo removido`);
                }
            }
            
            card.style.animation = 'highlightUpdate 1s ease';
            setTimeout(() => {
                card.style.animation = '';
            }, 1000);
            
            console.log(`✅ Conteúdo do card ${propertyId} atualizado`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao atualizar card ${propertyId}:`, error);
            return false;
        }
    }
}

window.propertyTemplates = new PropertyTemplateEngine();

/* ==========================================================
   FUNÇÃO DE ATUALIZAÇÃO DO CARD
   ========================================================== */
window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.log('🔄 Atualizando card do imóvel:', propertyId);
    
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado para atualizar card:', propertyId);
        return false;
    }
    
    const propertyToRender = updatedData ? { ...property, ...updatedData } : property;
    
    if (updatedData && window.propertyTemplates.updateCardContent) {
        const partialSuccess = window.propertyTemplates.updateCardContent(propertyId, propertyToRender);
        if (partialSuccess) {
            console.log(`✅ Atualização parcial bem-sucedida para ${propertyId}`);
            
            const index = window.properties.findIndex(p => p.id === propertyId);
            if (index !== -1) {
                window.properties[index] = { ...window.properties[index], ...updatedData };
            }
            
            return true;
        }
    }
    
    console.log(`🔄 Realizando substituição completa do card ${propertyId}`);
    
    const allCards = document.querySelectorAll('.property-card');
    let cardToUpdate = null;
    
    allCards.forEach(card => {
        const cardId = card.getAttribute('data-property-id');
        if (cardId && cardId == propertyId) {
            cardToUpdate = card;
        }
    });
    
    if (cardToUpdate) {
        const newCardHTML = window.propertyTemplates.generate(propertyToRender);
        cardToUpdate.outerHTML = newCardHTML;
        
        console.log('✅ Card completamente substituído');
        
        const index = window.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
            window.properties[index] = propertyToRender;
        }
        
        setTimeout(() => {
            const updatedCard = document.querySelector(`[data-property-id="${propertyId}"]`);
            if (updatedCard) {
                updatedCard.style.animation = 'highlightUpdate 1s ease';
                setTimeout(() => {
                    updatedCard.style.animation = '';
                }, 1000);
            }
        }, 50);
        
        return true;
    } else {
        console.warn('⚠️ Card não encontrado, renderizando todos os imóveis');
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos');
        }
        return false;
    }
};

/* ==========================================================
   FUNÇÕES PRINCIPAIS
   ========================================================== */
async function waitForAllPropertyImages() {
    const propertyImages = document.querySelectorAll('.property-image img, .property-gallery-image');
    
    if (propertyImages.length === 0) {
        return 0;
    }
    
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = propertyImages.length;
        
        propertyImages.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
                loadedCount++;
            } else {
                img.onload = () => {
                    loadedCount++;
                    checkCompletion();
                };
                
                img.onerror = () => {
                    loadedCount++;
                    checkCompletion();
                };
            }
        });
        
        const safetyTimeout = setTimeout(() => {
            resolve(loadedCount);
        }, 10000);
        
        function checkCompletion() {
            if (loadedCount >= totalImages) {
                clearTimeout(safetyTimeout);
                resolve(loadedCount);
            }
        }
        
        if (loadedCount >= totalImages) {
            clearTimeout(safetyTimeout);
            resolve(loadedCount);
        }
    });
}

window.loadPropertiesData = async function () {
    const loading = window.LoadingManager?.show?.(
        'Carregando imóveis...', 
        'Buscando as melhores oportunidades em Maceió',
        { variant: 'processing' }
    );
    
    try {
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
            } catch (e) {}
        }

        window.properties = propertiesData || getInitialProperties();
        
        window.properties = window.properties.map(prop => ({
            ...prop,
            has_video: window.ensureBooleanVideo(prop.has_video),
            features: window.parseFeaturesForStorage(prop.features)
        }));
        
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
        } else {
            loading?.setVariant?.('success');
            loading?.updateMessage?.(`${finalMessage} (${imagesLoaded} imagens carregadas)`);
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

window.renderProperties = function(filter = 'todos', forceClearCache = false) {
    console.log(`🎨 Renderizando propriedades (filtro: ${filter})`);
    
    if (forceClearCache && window.propertyTemplates && window.propertyTemplates.cache) {
        window.propertyTemplates.cache.clear();
    }
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container de propriedades não encontrado');
        return;
    }

    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>';
        return;
    }

    const filtered = this.filterProperties(window.properties, filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível para este filtro.</p>';
        return;
    }

    container.innerHTML = filtered.map(prop => 
        window.propertyTemplates.generate(prop)
    ).join('');

    console.log(`✅ ${filtered.length} imóveis renderizados (filtro: ${filter})`);
    
    const countElement = document.getElementById('propertyCount');
    if (countElement) {
        countElement.textContent = `${filtered.length} imóveis`;
    }
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

window.updateLocalStorage = function() {
    return window.savePropertiesToStorage();
};

window.setupFilters = function() {
    console.log('🎛️ Configurando filtros via FilterManager...');
    
    if (window.FilterManager && typeof window.FilterManager.init === 'function') {
        window.FilterManager.init((filterValue) => {
            window.currentFilter = filterValue;
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
            
            window.currentFilter = filter;
            if (window.renderProperties) window.renderProperties(filter);
        });
    });
    
    const todosBtn = Array.from(filterButtons).find(btn => 
        btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
    );
    if (todosBtn) todosBtn.classList.add('active');
};

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

window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL');
    console.log('📋 Dados recebidos:', propertyData);

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
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

        if (propertyData.features) {
            propertyData.features = window.parseFeaturesForStorage(propertyData.features);
            console.log('✅ Features processadas:', propertyData.features);
        } else {
            propertyData.features = '[]';
        }

        propertyData.has_video = window.ensureBooleanVideo(propertyData.has_video);
        console.log('✅ Vídeo processado:', propertyData.has_video);

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

        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();

        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }

        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }

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

        setTimeout(() => {
            if (typeof MediaSystem !== 'undefined') {
                MediaSystem.resetState();
            }
        }, 300);

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

window.validateIdForSupabase = function(propertyId) {
    console.log('[properties.js] Validando ID para Supabase:', {
        original: propertyId,
        type: typeof propertyId
    });
    
    if (!propertyId) {
        console.error('❌ ID não fornecido');
        return null;
    }
    
    if (typeof propertyId === 'number' && !isNaN(propertyId) && propertyId > 0) {
        console.log(`✅ ID já é numérico válido: ${propertyId}`);
        return propertyId;
    }
    
    if (typeof propertyId === 'string') {
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
    
    const directConvert = parseInt(propertyId);
    if (!isNaN(directConvert) && directConvert > 0) {
        console.log(`✅ ID convertido diretamente: ${directConvert}`);
        return directConvert;
    }
    
    console.error('❌ Não foi possível converter ID para formato Supabase:', propertyId);
    return null;
};

window.updateProperty = async function(id, propertyData) {
    console.group('📤 updateProperty CHAMADO');
    console.log('📋 Dados recebidos:', {
        id: id,
        tipoId: typeof id,
        title: propertyData.title,
        price: propertyData.price,
        location: propertyData.location,
        has_video: propertyData.has_video,
        has_video_type: typeof propertyData.has_video,
        features: propertyData.features,
        features_type: typeof propertyData.features,
        timestamp: new Date().toISOString()
    });

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

    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado! IDs disponíveis:', window.properties.map(p => p.id));
        alert(`❌ Imóvel não encontrado!\n\nIDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`);
        console.groupEnd();
        return { success: false, localOnly: true, error: 'Imóvel não encontrado' };
    }

    try {
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

        const processedData = {
            ...propertyData,
            has_video: window.ensureBooleanVideo(propertyData.has_video)
        };

        console.log('✅ Dados processados:', {
            title: processedData.title,
            price: processedData.price,
            location: processedData.location,
            has_video_original: propertyData.has_video,
            has_video_processado: processedData.has_video,
            features_original: propertyData.features ? propertyData.features.substring(0, 50) + '...' : 'vazio'
        });

        const updateData = {
            title: processedData.title || window.properties[index].title,
            price: processedData.price || window.properties[index].price,
            location: processedData.location || window.properties[index].location,
            description: processedData.description || window.properties[index].description || '',
            features: processedData.features || window.properties[index].features || '[]',
            type: processedData.type || window.properties[index].type || 'residencial',
            has_video: processedData.has_video,
            badge: processedData.badge || window.properties[index].badge || 'Novo',
            rural: processedData.type === 'rural' || window.properties[index].rural || false,
            images: processedData.images || window.properties[index].images || '',
            pdfs: processedData.pdfs || window.properties[index].pdfs || ''
        };

        console.log('📦 updateData final para salvar:', {
            title: updateData.title,
            price: updateData.price,
            location: updateData.location,
            has_video: updateData.has_video,
            features: updateData.features,
            temImages: !!updateData.images,
            imageCount: updateData.images ? updateData.images.split(',').filter(p => p.trim()).length : 0
        });

        const localSuccess = window.updateLocalProperty(id, updateData);
        
        if (!localSuccess) {
            throw new Error('Falha ao atualizar localmente');
        }

        let supabaseSuccess = false;
        let supabaseError = null;
        let supabaseResponse = null;
        
        const hasSupabase = window.ensureSupabaseCredentials();
        
        if (hasSupabase) {
            try {
                const validId = this.validateIdForSupabase?.(id) || id;
                
                console.log('🌐 Iniciando persistência no Supabase...', {
                    idOriginal: id,
                    idValidado: validId,
                    title: updateData.title,
                    price: updateData.price,
                    has_video: updateData.has_video
                });
                
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
                        title: supabaseResponse[0]?.title,
                        price: supabaseResponse[0]?.price,
                        has_video: supabaseResponse[0]?.has_video,
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
                }
            } catch (error) {
                supabaseError = error.message;
                console.error('❌ Erro de conexão com Supabase:', error);
            }
        } else {
            console.warn('⚠️ Credenciais Supabase não configuradas');
        }

        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
            console.log('🗑️ Cache invalidado após atualizar imóvel');
        }

        const imagesCount = updateData.images ? updateData.images.split(',').filter(p => p.trim()).length : 0;
        
        if (supabaseSuccess) {
            let msg = `✅ Imóvel "${updateData.title}" atualizado PERMANENTEMENTE!\n`;
            msg += `💰 Preço: ${updateData.price}\n`;
            msg += `📍 Local: ${updateData.location}\n`;
            if (imagesCount > 0) msg += `📸 ${imagesCount} imagem(ns)\n`;
            if (updateData.has_video) msg += `🎬 Agora tem vídeo\n`;
            alert(msg);
            console.log('🎯 updateProperty concluído com SUCESSO NO SUPABASE');
            return { success: true, localOnly: false, data: supabaseResponse };
        } else {
            let msg = `⚠️ Imóvel "${updateData.title}" atualizado apenas LOCALMENTE.\n`;
            msg += `💰 Preço: ${updateData.price}\n`;
            msg += `📍 Local: ${updateData.location}\n\n`;
            msg += `📱 As alterações foram salvas no seu navegador.\n`;
            msg += `🌐 Para salvar no servidor, verifique a conexão com internet.`;
            
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

window.updateLocalProperty = function(propertyId, updatedData) {
    console.group(`💾 updateLocalProperty COM ATUALIZAÇÃO IMEDIATA: ${propertyId}`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ window.properties não é um array válido');
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id == propertyId || p.id === propertyId);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado localmente');
        return false;
    }
    
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = window.ensureBooleanVideo(updatedData.has_video);
        console.log(`✅ VÍDEO salvo localmente para ${propertyId}: ${updatedData.has_video}`);
    }
    
    if (updatedData.features !== undefined) {
        updatedData.features = window.parseFeaturesForStorage(updatedData.features);
        console.log(`✅ FEATURES salvas localmente para ${propertyId}`);
    }
    
    const existingProperty = window.properties[index];
    
    window.properties[index] = {
        ...existingProperty,
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log(`💾 Imóvel ${propertyId} salvo PERMANENTEMENTE no localStorage`);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        console.groupEnd();
        return false;
    }
    
    console.log(`✅ Imóvel ${propertyId} atualizado localmente:`, {
        título: updatedData.title || existingProperty.title,
        preço: updatedData.price || existingProperty.price,
        localização: updatedData.location || existingProperty.location,
        videoAntes: existingProperty.has_video,
        videoDepois: updatedData.has_video,
        imagensAntes: existingProperty.images ? existingProperty.images.split(',').length : 0,
        imagensDepois: updatedData.images ? updatedData.images.split(',').length : 0
    });
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        if (typeof window.updatePropertyCard === 'function') {
            console.log(`🎬 Atualizando card ${propertyId} na galeria principal com dados atualizados...`);
            window.updatePropertyCard(propertyId, updatedData);
        } else {
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(window.currentFilter || 'todos', true);
            }
        }
    }, 150);
    
    console.groupEnd();
    return true;
};

window.addToLocalProperties = function(newProperty) {
    console.group('➕ addToLocalProperties');
    
    if (!window.properties) window.properties = [];
    
    let propertyWithId = newProperty;
    if (!propertyWithId.id) {
        const maxId = window.properties.length > 0 ? 
            Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
        propertyWithId.id = maxId + 1;
    }
    
    if (!propertyWithId.created_at) {
        propertyWithId.created_at = new Date().toISOString();
    }
    if (!propertyWithId.updated_at) {
        propertyWithId.updated_at = new Date().toISOString();
    }
    
    propertyWithId.has_video = window.ensureBooleanVideo(propertyWithId.has_video);
    propertyWithId.features = window.parseFeaturesForStorage(propertyWithId.features);
    
    window.properties.push(propertyWithId);
    
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
        preço: propertyWithId.price,
        localização: propertyWithId.location,
        video: propertyWithId.has_video,
        features: propertyWithId.features
    });
    
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

    const originalLength = window.properties.length;
    window.properties = window.properties.filter(p => p.id !== id);
    
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log(`💾 Imóvel ${id} removido PERMANENTEMENTE do localStorage`);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
    }

    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos', true);
    }

    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
            console.log('📋 Lista do admin atualizada após exclusão');
        }, 300);
    }

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

// ========== FUNÇÕES DE TESTE ==========
window.testFullUpdate = function() {
    console.group('🧪 TESTE DE ATUALIZAÇÃO COMPLETA DA GALERIA');
    
    if (!window.properties || window.properties.length === 0) {
        alert('❌ Nenhum imóvel disponível para teste');
        return;
    }
    
    const testProperty = window.properties[0];
    const hasVideoBefore = testProperty.has_video;
    const titleBefore = testProperty.title;
    const priceBefore = testProperty.price;
    const locationBefore = testProperty.location;
    
    console.log('📊 Estado antes:', {
        id: testProperty.id,
        title: titleBefore,
        price: priceBefore,
        location: locationBefore,
        has_video: hasVideoBefore
    });
    
    testProperty.has_video = !hasVideoBefore;
    testProperty.title = `${titleBefore} [TESTE ATUALIZADO]`;
    testProperty.price = `R$ ${Math.floor(Math.random() * 1000000).toLocaleString()}`;
    testProperty.location = `${locationBefore} [LOCAL ATUALIZADO]`;
    
    const index = window.properties.findIndex(p => p.id === testProperty.id);
    if (index !== -1) {
        window.properties[index] = testProperty;
        
        window.savePropertiesToStorage();
        
        if (typeof window.updatePropertyCard === 'function') {
            window.updatePropertyCard(testProperty.id, {
                title: testProperty.title,
                price: testProperty.price,
                location: testProperty.location,
                has_video: testProperty.has_video
            });
        }
        
        console.log('📊 Estado depois:', {
            title: testProperty.title,
            price: testProperty.price,
            location: testProperty.location,
            has_video: testProperty.has_video,
            atualizado: true
        });
        
        alert(`🧪 TESTE DE ATUALIZAÇÃO COMPLETA:\n\n` +
              `Imóvel: ${testProperty.title}\n` +
              `Preço: ${testProperty.price}\n` +
              `Local: ${testProperty.location}\n` +
              `Vídeo: ${testProperty.has_video ? 'SIM' : 'NÃO'}\n\n` +
              `Todos os campos devem atualizar IMEDIATAMENTE na galeria.`);
        
        setTimeout(() => {
            if (window.properties[index]) {
                window.properties[index].title = titleBefore;
                window.properties[index].price = priceBefore;
                window.properties[index].location = locationBefore;
                window.properties[index].has_video = hasVideoBefore;
                
                window.savePropertiesToStorage();
                
                if (typeof window.updatePropertyCard === 'function') {
                    window.updatePropertyCard(testProperty.id, {
                        title: titleBefore,
                        price: priceBefore,
                        location: locationBefore,
                        has_video: hasVideoBefore
                    });
                }
                console.log('✅ Estado original restaurado');
            }
        }, 10000);
    }
    
    console.groupEnd();
};

window.forceFullGalleryUpdate = function() {
    console.log('🔄 Forçando atualização completa da galeria...');
    if (typeof window.renderProperties === 'function') {
        window.renderProperties(window.currentFilter || 'todos', true);
        alert('✅ Galeria atualizada com cache limpo! Todos os campos devem estar atualizados.');
    } else {
        alert('❌ Função renderProperties não disponível');
    }
};

window.testIndicatorPosition = function() {
    console.group('🧪 TESTE DA POSIÇÃO DO INDICADOR DE VÍDEO');
    
    if (!window.properties || window.properties.length === 0) {
        alert('❌ Nenhum imóvel disponível para teste');
        return;
    }
    
    const testProperty = window.properties[0];
    
    if (!testProperty.has_video) {
        alert('⚠️ Este imóvel não tem vídeo habilitado.\n\nAtive o vídeo primeiro para testar a posição.');
        return;
    }
    
    const card = document.querySelector(`[data-property-id="${testProperty.id}"]`);
    if (!card) {
        alert('❌ Card não encontrado na página');
        return;
    }
    
    const videoIndicator = card.querySelector('.video-indicator');
    const imageCount = card.querySelector('.image-count');
    
    console.log('🔍 Elementos encontrados:', {
        temVideoIndicator: !!videoIndicator,
        temImageCount: !!imageCount,
        posicaoVideoIndicator: videoIndicator ? window.getComputedStyle(videoIndicator).top : 'não encontrado',
        posicaoImageCount: imageCount ? window.getComputedStyle(imageCount).top : 'não encontrado'
    });
    
    if (videoIndicator) {
        videoIndicator.style.border = '2px solid #FFD700';
        videoIndicator.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.8)';
        
        setTimeout(() => {
            if (videoIndicator) {
                videoIndicator.style.border = '';
                videoIndicator.style.boxShadow = '';
            }
        }, 3000);
    }
    
    alert(`🧪 TESTE DA POSIÇÃO DO INDICADOR:\n\n` +
          `1. Indicador de vídeo encontrado: ${videoIndicator ? 'SIM' : 'NÃO'}\n` +
          `2. Contador de imagens encontrado: ${imageCount ? 'SIM' : 'NÃO'}\n` +
          `3. Posição do indicador: ${videoIndicator ? window.getComputedStyle(videoIndicator).top : 'N/A'}\n\n` +
          `✅ O indicador deve estar abaixo do contador de imagens.`);
    
    console.groupEnd();
};

// ========== ADICIONAR ESTILOS CSS ==========
const videoUpdateStyles = `
    @keyframes highlightUpdate {
        0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); }
        50% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
        100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
    }
    
    @keyframes pulseVideo {
        0% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.8; transform: scale(1); }
    }
    
    .property-card.updating {
        animation: highlightUpdate 1s ease;
    }
    
    [data-title-field], [data-price-field], [data-location-field], 
    [data-description-field], [data-features-field] {
        transition: all 0.3s ease;
    }
    
    .property-card.updated {
        animation: highlightUpdate 1s ease;
    }
    
    .video-indicator {
        animation: pulseVideo 2s infinite !important;
        transition: all 0.3s ease !important;
    }
    
    .image-count {
        z-index: 10 !important;
        font-weight: bold !important;
    }
`;

if (!document.querySelector('#video-update-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'video-update-styles';
    styleEl.textContent = videoUpdateStyles;
    document.head.appendChild(styleEl);
}

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js VERSÃO FINAL COMPLETA COM INDICADOR DE VÍDEO REBAIXADO');

function runLowPriority(task) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(task, { timeout: 1000 });
    } else {
        setTimeout(task, 100);
    }
}

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

window.getInitialProperties = getInitialProperties;

console.log('🎯 PROBLEMA DO INDICADOR DE VÍDEO RESOLVIDO!');
console.log('✅ Removidos todos os estilos inline do properties.js');
console.log('✅ Indicador de vídeo agora controlado apenas pelo CSS externo (gallery.css)');
console.log('💡 Execute window.testIndicatorPosition() para verificar a posição');
console.log('💡 O indicador estará rebaixado para não sobrepor o contador de imagens');
