// js/modules/properties.js - VERSÃO OTIMIZADA (SEM BOTÕES DE DIAGNÓSTICO)
console.log('🏠 properties.js - VERSÃO OTIMIZADA - FUNÇÕES CENTRALIZADAS NO SHAREDCORE');

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
            KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enRieHZwZGFwbHpetG1peG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0OTAsImV4cCI6MjA3OTc2MjQ5MH0.SISlMoO1kLWbIgx9pze8Dv1O-kfQ_TAFDX6yPUxfJxo',
            ADMIN_PASSWORD: "wl654",
            PDF_PASSWORD: "doc123"
        };
    }
    
    if (!window.SUPABASE_URL) window.SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
    if (!window.SUPABASE_KEY) window.SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
    
    return !!window.SUPABASE_URL && !!window.SUPABASE_KEY;
};

// ========== TEMPLATE ENGINE COM CACHE AVANÇADO ==========
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

        const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(property.features) || '';
        
        const formatPrice = (price) => {
            if (window.SharedCore?.PriceFormatter?.formatForCard) {
                return window.SharedCore.PriceFormatter.formatForCard(price);
            }
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
        const hasVideo = window.SharedCore?.ensureBooleanVideo?.(property.has_video) || false;
        
        if (hasGallery && typeof window.createPropertyGallery === 'function') {
            try {
                return window.createPropertyGallery(property);
            } catch (e) {
                console.warn('❌ Erro na galeria, usando fallback:', e);
            }
        }

        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" 
                 style="position: relative; height: 250px;">
                <img src="${firstImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     alt="${property.title}"
                     onerror="this.src='${this.imageFallback}'">
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                
                ${hasVideo ? `
                    <div class="video-indicator pulsing" style="
                        position: absolute;
                        top: 85px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.8);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        z-index: 9;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                        border: 1px solid rgba(255,255,255,0.3);
                        backdrop-filter: blur(5px);
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">
                        <i class="fas fa-video" style="color: #FFD700; font-size: 14px;"></i>
                        <span>TEM VÍDEO</span>
                    </div>
                ` : ''}
                
                ${hasGallery ? `
                    <div class="image-count" style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.9);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 13px;
                        font-weight: bold;
                        z-index: 10;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                    ">
                        <i class="fas fa-images" style="margin-right: 5px;"></i>${imageCount}
                    </div>
                ` : ''}
                
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem.showModal(${property.id})" style="
                        position: absolute;
                        bottom: 2px;
                        right: 35px;
                        background: rgba(255, 255, 255, 0.95);
                        border: none;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.75rem;
                        color: #1a5276;
                        transition: all 0.3s ease;
                        z-index: 15;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                        border: 1px solid rgba(0,0,0,0.15);
                    ">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    updateCardContent(propertyId, propertyData) {
        console.log(`🔍 Atualizando conteúdo do card ${propertyId}`, propertyData);
        
        const card = document.querySelector(`.property-card[data-property-id="${propertyId}"]`);
        if (!card) {
            console.warn(`⚠️ Card ${propertyId} não encontrado para atualização parcial`);
            return false;
        }
        
        try {
            // Atualizar preço se fornecido
            if (propertyData.price !== undefined) {
                const priceElement = card.querySelector('[data-price-field]');
                if (priceElement) {
                    const formattedPrice = window.SharedCore?.PriceFormatter?.formatForCard 
                        ? window.SharedCore.PriceFormatter.formatForCard(propertyData.price)
                        : (propertyData.price.includes('R$') 
                            ? propertyData.price 
                            : `R$ ${propertyData.price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`);
                    priceElement.textContent = formattedPrice;
                }
            }
            
            // Atualizar título se fornecido
            if (propertyData.title !== undefined) {
                const titleElement = card.querySelector('[data-title-field]');
                if (titleElement) {
                    titleElement.textContent = propertyData.title;
                }
                card.setAttribute('data-property-title', propertyData.title);
            }
            
            // Atualizar localização se fornecido
            if (propertyData.location !== undefined) {
                const locationElement = card.querySelector('[data-location-field]');
                if (locationElement) {
                    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${propertyData.location}`;
                }
            }
            
            // Atualizar descrição se fornecido
            if (propertyData.description !== undefined) {
                const descriptionElement = card.querySelector('[data-description-field]');
                if (descriptionElement) {
                    descriptionElement.textContent = propertyData.description;
                }
            }
            
            // Atualizar features se fornecido
            if (propertyData.features !== undefined) {
                const featuresElement = card.querySelector('[data-features-field]');
                const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(propertyData.features) || '';
                
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
            
            // Atualizar indicador de vídeo
            if (propertyData.has_video !== undefined) {
                const videoIndicator = card.querySelector('.video-indicator');
                const hasVideo = window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) || false;
                
                if (hasVideo && !videoIndicator) {
                    const imageSection = card.querySelector('.property-image');
                    if (imageSection) {
                        const imageCount = imageSection.querySelector('.image-count');
                        const topPosition = imageCount ? '35px' : '10px';
                        
                        imageSection.innerHTML += `
                            <div class="video-indicator pulsing" style="
                                position: absolute;
                                top: ${topPosition};
                                right: 10px;
                                background: rgba(0, 0, 0, 0.8);
                                color: white;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                z-index: 9;
                                box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                                border: 1px solid rgba(255,255,255,0.3);
                                backdrop-filter: blur(5px);
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                <i class="fas fa-video" style="color: #FFD700; font-size: 14px;"></i>
                                <span>TEM VÍDEO</span>
                            </div>
                        `;
                    }
                } else if (!hasVideo && videoIndicator) {
                    videoIndicator.remove();
                }
            }
            
            card.classList.add('highlighted');
            setTimeout(() => {
                card.classList.remove('highlighted');
            }, 1000);
            
            console.log(`✅ Conteúdo do card ${propertyId} atualizado com sucesso`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao atualizar card ${propertyId}:`, error);
            return false;
        }
    }
}

// Instância global
window.propertyTemplates = new PropertyTemplateEngine();

/* ==========================================================
   FUNÇÃO PARA ATUALIZAR CARD ESPECÍFICO APÓS EDIÇÃO
   ========================================================== */
window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.log('🔄 Atualizando card do imóvel:', propertyId, updatedData ? 'com dados específicos' : '');
    
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado para atualizar card:', propertyId);
        return false;
    }
    
    const propertyToRender = updatedData ? { ...property, ...updatedData } : property;
    
    // Tentar atualização parcial primeiro
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
    
    // Se falhar a atualização parcial, fazer substituição completa
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
        
        console.log('✅ Card completamente substituído com todos os campos atualizados:', {
            título: propertyToRender.title,
            preço: propertyToRender.price,
            localização: propertyToRender.location,
            vídeo: propertyToRender.has_video
        });
        
        const index = window.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
            window.properties[index] = propertyToRender;
        }
        
        setTimeout(() => {
            const updatedCard = document.querySelector(`[data-property-id="${propertyId}"]`);
            if (updatedCard) {
                updatedCard.classList.add('highlighted');
                setTimeout(() => {
                    updatedCard.classList.remove('highlighted');
                }, 1000);
            }
        }, 50);
        
        return true;
    } else {
        console.warn('⚠️ Card não encontrado na página, renderizando todos os imóveis');
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos');
        }
        return false;
    }
};

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
    // ✅ PRIMEIRO: Executar sincronização automática silenciosa
    try {
        window.checkPropertySystem(true);
    } catch (e) {
        // Ignorar erros na sincronização prévia
    }
    
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
        
        for (let i = 0; i < loadStrategies.length; i++) {
            try {
                propertiesData = await loadStrategies[i]();
                if (propertiesData && propertiesData.length > 0) {
                    break;
                }
            } catch (e) { 
                console.warn(`⚠️ Estratégia ${i+1} falhou:`, e.message);
            }
        }

        window.properties = propertiesData || getInitialProperties();
        
        window.properties = window.properties.map(prop => ({
            ...prop,
            has_video: window.SharedCore?.ensureBooleanVideo?.(prop.has_video) || false,
            features: window.SharedCore?.parseFeaturesForStorage?.(prop.features) || '[]'
        }));
        
        const saved = window.savePropertiesToStorage();
        if (!saved) {
            console.error('❌ CRÍTICO: Não foi possível salvar propriedades no localStorage!');
            try {
                sessionStorage.setItem('properties_backup', JSON.stringify(window.properties));
            } catch (backupError) {
                console.error('❌ Fallback também falhou!');
            }
        }

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
window.renderProperties = function(filter = 'todos', forceClearCache = false) {
    console.log(`🎨 Renderizando propriedades (filtro: ${filter})${forceClearCache ? ' - CACHE LIMPO' : ''}`);
    
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

// ========== 4. SALVAR NO STORAGE - VERSÃO UNIFICADA ==========
window.savePropertiesToStorage = function() {
    console.log('💾 Salvando propriedades NO LOCALSTORAGE UNIFICADO...');
    
    try {
        if (!window.properties || !Array.isArray(window.properties)) {
            console.error('❌ window.properties não é um array válido para salvar');
            return false;
        }
        
        const propertiesToSave = JSON.stringify(window.properties);
        localStorage.setItem('properties', propertiesToSave);
        
        ['weberlessa_properties', 'properties_backup', 'weberlessa_backup'].forEach(oldKey => {
            if (localStorage.getItem(oldKey)) {
                localStorage.removeItem(oldKey);
            }
        });
        
        const verify = localStorage.getItem('properties');
        if (!verify) {
            console.error('❌ VERIFICAÇÃO FALHOU: localStorage vazio após salvar!');
            return false;
        }
        
        const parsedVerify = JSON.parse(verify);
        if (parsedVerify.length !== window.properties.length) {
            console.error(`❌ VERIFICAÇÃO FALHOU: Quantidade diferente! Salvo: ${parsedVerify.length}, Esperado: ${window.properties.length}`);
            return false;
        }
        
        console.log(`✅ ${window.properties.length} imóveis salvos em "properties"`);
        
        return true;
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao salvar:', error);
        
        try {
            const backupData = window.properties.map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                location: p.location
            }));
            localStorage.setItem('properties_minimal', JSON.stringify(backupData));
        } catch (backupError) {
            console.error('❌ Fallback também falhou!');
        }
        
        return false;
    }
};

// ========== FUNÇÃO AUXILIAR: Atualizar localStorage sempre ==========
window.updateLocalStorage = function() {
    return window.savePropertiesToStorage();
};

// ========== 5. CONFIGURAR FILTROS (VERSÃO COMPATÍVEL) ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros (compatibilidade)...');
    
    if (window.FilterManager && typeof window.FilterManager.setupWithFallback === 'function') {
        return window.FilterManager.setupWithFallback();
    }
    
    console.error('❌ Sistema de filtros não disponível!');
    return false;
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

// ========== 7. ADICIONAR NOVO IMÓVEL - VERSÃO CORRIGIDA ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL - VERSÃO CORRIGIDA');

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        if (propertyData.price) {
            if (window.SharedCore?.PriceFormatter?.formatForInput) {
                propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
            } else {
                let formattedPrice = propertyData.price;
                if (!formattedPrice.startsWith('R$')) {
                    formattedPrice = 'R$ ' + formattedPrice.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                }
                propertyData.price = formattedPrice;
            }
        }

        if (propertyData.features) {
            propertyData.features = window.SharedCore?.parseFeaturesForStorage?.(propertyData.features) || '[]';
        } else {
            propertyData.features = '[]';
        }

        propertyData.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) || false;

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

        let newId;
        
        if (supabaseSuccess && supabaseId) {
            newId = supabaseId;
            console.log(`✅ ID sincronizado do Supabase: ${newId}`);
        } else {
            const maxLocalId = window.properties.length > 0 ? 
                Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
            newId = maxLocalId + 1;
            console.log(`⚠️ ID local temporário: ${newId} (sem conexão Supabase)`);
        }

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
            savedToSupabase: supabaseSuccess,
            syncStatus: supabaseSuccess ? 'synced' : 'local_only'
        };

        console.log(`💾 Salvando imóvel ${newId} localmente...`);
        
        window.properties.unshift(newProperty);
        
        const saved = window.savePropertiesToStorage();
        
        if (!saved) {
            try {
                localStorage.setItem('properties_backup_' + Date.now(), JSON.stringify([newProperty]));
            } catch (backupError) {
                console.error('❌ Backup também falhou!');
                alert('⚠️ ATENÇÃO: Não foi possível salvar o imóvel localmente!\n\nO imóvel aparecerá agora mas pode desaparecer ao recarregar.');
            }
        }

        console.log('🎨 Atualizando interface...');
        
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
        
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => {
                window.loadPropertyList();
            }, 100);
        }
        
        setTimeout(() => {
            const cardExists = !!document.querySelector(`[data-property-id="${newId}"]`);
            const inList = window.properties.some(p => p.id === newId);
            
            if (!cardExists || !inList) {
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos', true);
                }
            }
        }, 300);

        const imageCount = newProperty.images
            ? newProperty.images.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        const pdfCount = newProperty.pdfs
            ? newProperty.pdfs.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        let message = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!\n\n`;
        message += `💰 Preço: ${newProperty.price}\n`;
        message += `📍 Local: ${newProperty.location}\n`;
        
        if (imageCount > 0) message += `📸 ${imageCount} foto(s)/vídeo(s) anexada(s)\n`;
        if (pdfCount > 0) message += `📄 ${pdfCount} documento(s) PDF anexado(s)\n`;
        if (newProperty.has_video) message += `🎬 Marcado como "Tem vídeo"\n`;
        
        if (!supabaseSuccess) {
            message += `\n⚠️ Salvo apenas localmente (sem conexão com servidor)`;
        } else {
            message += `\n🌐 Salvo no servidor com ID: ${supabaseId}`;
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

        console.log(`✅ Imóvel ${newId} cadastrado com sucesso`);
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

// ========== 8. FUNÇÃO AUXILIAR: Validar ID para Supabase ==========
window.validateIdForSupabase = function(propertyId) {
    if (!propertyId) {
        console.error('❌ ID não fornecido');
        return null;
    }
    
    if (typeof propertyId === 'number' && !isNaN(propertyId) && propertyId > 0) {
        return propertyId;
    }
    
    if (typeof propertyId === 'string') {
        const cleanId = propertyId
            .replace('test_id_', '')
            .replace('temp_', '')
            .replace(/[^0-9]/g, '');
        
        const numericId = parseInt(cleanId);
        
        if (!isNaN(numericId) && numericId > 0) {
            return numericId;
        }
    }
    
    const directConvert = parseInt(propertyId);
    if (!isNaN(directConvert) && directConvert > 0) {
        return directConvert;
    }
    
    console.error('❌ Não foi possível converter ID para formato Supabase:', propertyId);
    return null;
};

// ========== 9. ATUALIZAR IMÓVEL - VERSÃO COMPLETA CORRIGIDA ==========
window.updateProperty = async function(id, propertyData) {
    console.group('📤 updateProperty - VERSÃO CORRIGIDA');

    if (!id || id === 'null' || id === 'undefined') {
        console.error('❌ ID inválido fornecido:', id);
        if (window.editingPropertyId) {
            console.log(`🔄 Usando editingPropertyId: ${window.editingPropertyId}`);
            id = window.editingPropertyId;
        } else {
            alert('❌ ERGO: Não foi possível identificar o imóvel para atualização!');
            console.groupEnd();
            return { success: false, localOnly: true, error: 'ID inválido' };
        }
    }

    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado! IDs disponíveis:', window.properties.map(p => p.id));
        alert(`❌ Imóvel não encontrado!\n\nIDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`);
        console.groupEnd();
        return { success: false, localOnly: true, error: 'Imóvel não encontrado' };
    }

    try {
        if (propertyData.price) {
            if (window.SharedCore?.PriceFormatter?.formatForInput) {
                propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
            } else {
                let formattedPrice = propertyData.price;
                if (!formattedPrice.startsWith('R$')) {
                    formattedPrice = 'R$ ' + formattedPrice.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                }
                propertyData.price = formattedPrice;
            }
        }

        const processedData = {
            ...propertyData,
            has_video: window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) || false
        };

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
                } else {
                    supabaseError = await response.text();
                }
            } catch (error) {
                supabaseError = error.message;
            }
        }

        const imagesCount = updateData.images ? updateData.images.split(',').filter(p => p.trim()).length : 0;
        
        if (supabaseSuccess) {
            let msg = `✅ Imóvel "${updateData.title}" atualizado PERMANENTEMENTE!\n`;
            msg += `💰 Preço: ${updateData.price}\n`;
            msg += `📍 Local: ${updateData.location}\n`;
            if (imagesCount > 0) msg += `📸 ${imagesCount} imagem(ns)\n`;
            if (updateData.has_video) msg += `🎬 Agora tem vídeo\n`;
            alert(msg);
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
            return { success: true, localOnly: true, error: supabaseError };
        }

    } catch (error) {
        console.error('❌ ERRO ao atualizar imóvel:', error);
        console.groupEnd();
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\n${error.message}`);
        return { success: false, localOnly: true, error: error.message };
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
    
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = window.SharedCore?.ensureBooleanVideo?.(updatedData.has_video) || false;
    }
    
    if (updatedData.features !== undefined) {
        updatedData.features = window.SharedCore?.parseFeaturesForStorage?.(updatedData.features) || '[]';
    }
    
    const existingProperty = window.properties[index];
    
    window.properties[index] = {
        ...existingProperty,
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha crítica ao salvar no localStorage após atualização!');
        console.groupEnd();
        return false;
    }
    
    console.log(`✅ Imóvel ${propertyId} atualizado localmente:`, {
        título: updatedData.title || existingProperty.title,
        preço: updatedData.price || existingProperty.price,
        localização: updatedData.location || existingProperty.location,
        video: updatedData.has_video
    });
    
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
        }, 100);
    }
    
    if (typeof window.updatePropertyCard === 'function') {
        setTimeout(() => {
            window.updatePropertyCard(propertyId, updatedData);
        }, 150);
    } else {
        if (typeof window.renderProperties === 'function') {
            setTimeout(() => {
                window.renderProperties(window.currentFilter || 'todos', true);
            }, 200);
        }
    }
    
    console.groupEnd();
    return true;
};

// ========== 11. FUNÇÃO CRÍTICA: Adicionar propriedade localmente ==========
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
    
    propertyWithId.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyWithId.has_video) || false;
    propertyWithId.features = window.SharedCore?.parseFeaturesForStorage?.(propertyWithId.features) || '[]';
    
    window.properties.unshift(propertyWithId);
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha crítica ao salvar imóvel no localStorage!');
        console.groupEnd();
        return null;
    }
    
    console.log(`✅ Imóvel ${propertyWithId.id} adicionado localmente:`, {
        titulo: propertyWithId.title,
        preço: propertyWithId.price,
        localização: propertyWithId.location
    });
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
    }, 100);
    
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

    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"\n\nEsta ação NÃO pode não ser desfeita.`)) {
        console.log('❌ Exclusão cancelada pelo usuário');
        return false;
    }

    let supabaseSuccess = false;
    let supabaseError = null;

    if (window.ensureSupabaseCredentials()) {
        const validId = window.validateIdForSupabase?.(id) || id;
        
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
            } else {
                supabaseError = await response.text();
            }
        } catch (error) {
            supabaseError = error.message;
        }
    }

    window.properties = window.properties.filter(p => p.id !== id);
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha ao salvar após exclusão!');
        alert('⚠️ Erro ao salvar alterações localmente!');
        console.groupEnd();
        return false;
    }

    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos', true);
    }

    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
        }, 100);
    }

    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\nFoi removido do servidor e não voltará a aparecer.`);
    } else {
        let errorMessage = supabaseError ? 
            `\n\nErro no servidor: ${supabaseError.substring(0, 100)}...` : 
            '\n\nMotivo: Conexão com servidor falhou.';

        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.${errorMessage}\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
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

// ========== 14. SISTEMA DE RECUPERAÇÃO DE FALHAS CORRIGIDO ==========
(function essentialPropertiesRecovery() {
    setTimeout(() => {
        if (!window.properties || window.properties.length === 0) {
            console.warn('⚠️ window.properties vazio após 3 segundos, tentando recuperação...');
            
            let stored = localStorage.getItem('properties');
            
            if (!stored) {
                stored = localStorage.getItem('weberlessa_properties');
                if (stored) {
                    console.log('🔄 Encontrado na chave antiga, migrando para chave unificada...');
                    localStorage.setItem('properties', stored);
                    localStorage.removeItem('weberlessa_properties');
                }
            }
            
            if (stored) {
                try {
                    window.properties = JSON.parse(stored);
                    window.properties = window.properties.map(prop => ({
                        ...prop,
                        has_video: window.SharedCore?.ensureBooleanVideo?.(prop.has_video) || false,
                        features: window.SharedCore?.parseFeaturesForStorage?.(prop.features) || '[]'
                    }));
                    
                    console.log(`✅ Recuperado do localStorage: ${window.properties.length} imóveis`);
                    
                    if (typeof window.renderProperties === 'function' && document.readyState === 'complete') {
                        setTimeout(() => window.renderProperties('todos', true), 300);
                    }
                    
                } catch (e) {
                    console.error('❌ Erro ao recuperar do localStorage:', e);
                }
            }
            
            if (!window.properties || window.properties.length === 0) {
                window.properties = getInitialProperties();
                window.savePropertiesToStorage();
                
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos', true), 300);
                }
            }
        }
    }, 3000);
})();

// ========== 15. FUNÇÕES DE TESTE (SIMPLIFICADAS) ==========
window.testFullUpdate = function() {
    console.group('🧪 TESTE DE ATUALIZAÇÃO COMPLETA');
    
    if (!window.properties || window.properties.length === 0) {
        alert('❌ Nenhum imóvel disponível para teste');
        return;
    }
    
    const testProperty = window.properties[0];
    const hasVideoBefore = testProperty.has_video;
    const titleBefore = testProperty.title;
    const priceBefore = testProperty.price;
    const locationBefore = testProperty.location;
    
    testProperty.has_video = !hasVideoBefore;
    testProperty.title = `${titleBefore} [TESTE ATUALIZADO]`;
    testProperty.price = `R$ ${Math.floor(Math.random() * 1000000).toLocaleString()}`;
    testProperty.location = `${locationBefore} [LOCAL ATUALIZADO]`;
    
    const index = window.properties.findIndex(p => p.id === testProperty.id);
    if (index !== -1) {
        window.properties[index] = testProperty;
        
        const saved = window.savePropertiesToStorage();
        
        if (saved) {
            if (typeof window.updatePropertyCard === 'function') {
                window.updatePropertyCard(testProperty.id, {
                    title: testProperty.title,
                    price: testProperty.price,
                    location: testProperty.location,
                    has_video: testProperty.has_video
                });
            }
            
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
                }
            }, 10000);
        } else {
            alert('❌ Teste falhou! Não foi possível salvar no localStorage.');
        }
    }
    
    console.groupEnd();
};

window.forceFullGalleryUpdate = function() {
    console.log('🔄 Forçando atualização completa da galeria...');
    if (typeof window.renderProperties === 'function') {
        window.renderProperties(window.currentFilter || 'todos', true);
        alert('✅ Galeria atualizada com cache limpo!');
    } else {
        alert('❌ Função renderProperties não disponível');
    }
};

// ========== 16. VERIFICAÇÃO DO SISTEMA DE PROPRIEDADES - VERSÃO SILENCIOSA ==========
window.checkPropertySystem = function(silent = true) {
    if (!silent) console.group('🔍 VERIFICAÇÃO DO SISTEMA');
    
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        
        if (stored.length > 0) {
            if (!window.properties || window.properties.length === 0) {
                window.properties = stored;
                console.log(`✅ [AUTO] Carregados ${stored.length} imóveis do localStorage`);
                return { action: 'loaded_from_storage', count: stored.length };
            }
            else if (Math.abs(stored.length - window.properties.length) > 2) {
                if (stored.length > window.properties.length) {
                    window.properties = stored;
                    console.log(`✅ [AUTO] Sincronizado: storage tem +${stored.length - window.properties.length} imóveis`);
                    return { action: 'synced_from_storage', difference: stored.length - window.properties.length };
                } else {
                    window.savePropertiesToStorage();
                    console.log(`✅ [AUTO] Sincronizado: memória tem +${window.properties.length - stored.length} imóveis`);
                    return { action: 'synced_to_storage', difference: window.properties.length - stored.length };
                }
            }
        }
        
        if (!silent) {
            console.log('⚙️ FUNÇÕES ESSENCIAIS:');
            console.log('- toggleAdminPanel:', typeof window.toggleAdminPanel);
            console.log('- saveProperty:', typeof window.saveProperty);
            console.log('- addNewProperty:', typeof window.addNewProperty);
            console.log('- updateProperty:', typeof window.updateProperty);
        }
        
        return { action: 'no_sync_needed', status: 'ok' };
        
    } catch (error) {
        console.error('❌ Erro na verificação automática:', error);
        return { action: 'error', error: error.message };
    } finally {
        if (!silent) console.groupEnd();
    }
};

// ========== 17. SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA INICIAL ==========
window.autoSyncOnLoad = function() {
    setTimeout(() => {
        try {
            const syncResult = window.checkPropertySystem(true);
            
            if (window.location.search.includes('debug=true')) {
                console.log('🔄 Sincronização automática:', syncResult);
            }
            
            if (syncResult.action !== 'no_sync_needed') {
                setTimeout(() => {
                    if (typeof window.renderProperties === 'function' && syncResult.count > 0) {
                        window.renderProperties('todos');
                    }
                }, 500);
            }
        } catch (e) {
            console.warn('⚠️ Sincronização automática falhou (não crítico):', e.message);
        }
    }, 3000);
};

// Executar automaticamente quando o sistema estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.autoSyncOnLoad);
} else {
    setTimeout(window.autoSyncOnLoad, 1000);
}

// ========== 18. MONITORAMENTO SILENCIOSO CONTÍNUO ==========
setInterval(() => {
    if (window.location.search.includes('debug=true')) {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        const inMemory = window.properties?.length || 0;
        
        if (Math.abs(stored.length - inMemory) > 0) {
            console.log(`📊 [MONITOR] Storage: ${stored.length} | Memória: ${inMemory}`);
            if (Math.abs(stored.length - inMemory) <= 3) {
                window.checkPropertySystem(true);
            }
        }
    }
}, 30000);

// ========== (SEÇÃO 19 REMOVIDA - FUNÇÃO DE DIAGNÓSTICO MIGRADA) ==========

// ========== 20. VERIFICAÇÃO AUTOMÁTICA AO INICIAR ==========
setTimeout(() => {
    if (window.properties && window.properties.length > 0) {
        try {
            const stored = localStorage.getItem('properties');
            if (!stored) {
                console.warn('⚠️ localStorage vazio (chave unificada), salvando array atual...');
                window.savePropertiesToStorage();
            } else {
                const parsed = JSON.parse(stored);
                if (parsed.length !== window.properties.length) {
                    console.warn(`⚠️ INCONSISTÊNCIA: localStorage tem ${parsed.length}, array tem ${window.properties.length}`);
                    console.warn('🔄 Corrigindo automaticamente...');
                    window.savePropertiesToStorage();
                }
            }
            
            if (localStorage.getItem('weberlessa_properties')) {
                localStorage.removeItem('weberlessa_properties');
            }
        } catch (error) {
            console.error('❌ Erro na verificação automática:', error);
        }
    }
}, 5000);

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js VERSÃO OTIMIZADA CARREGADA');

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
            }

            runLowPriority(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                }
            });
        });
    });
} else {
    runLowPriority(() => {
        if (typeof window.loadPropertiesData === 'function') {
            window.loadPropertiesData();
        }

        runLowPriority(() => {
            if (typeof window.setupFilters === 'function') {
                window.setupFilters();
            }
        });
    });
}

// Exportar funções necessárias
window.getInitialProperties = getInitialProperties;

console.log('🎯 VERSÃO OTIMIZADA - SEM BOTÕES DE DIAGNÓSTICO VISÍVEIS');
console.log('💡 Execute window.diagnosticoSincronizacao() no console (F12) para verificar o sistema');
console.log('💡 Adicione ?debug=true na URL para logs detalhados no console');
