// js/modules/properties.js - VERSÃO FINAL CORRIGIDA (SEM FUNÇÕES DUPLICADAS)
console.log('🏠 properties.js - VERSÃO FINAL CORRIGIDA - FUNÇÕES CENTRALIZADAS NO SHAREDCORE');

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
    
    // Garantir que as constantes globais também existam
    if (!window.SUPABASE_URL) window.SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
    if (!window.SUPABASE_KEY) window.SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
    
    console.log('✅ Credenciais Supabase garantidas:', {
        hasURL: !!window.SUPABASE_URL,
        hasKEY: !!window.SUPABASE_KEY
    });
    
    return !!window.SUPABASE_URL && !!window.SUPABASE_KEY;
};

// ========== TEMPLATE ENGINE COM CACHE AVANÇADO E GALERIA ==========
class PropertyTemplateEngine {
    constructor() {
        this.cache = new Map();
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    generate(property) {
        const cacheKey = `prop_${property.id}_${property.images?.length || 0}_${property.has_video}`;
        // Remover do cache para forçar atualização
        if (this.cache.has(cacheKey)) {
            this.cache.delete(cacheKey);
        }

        // Formatar features para exibição (usando SharedCore)
        const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(property.features) || '';
        
        // Formatação de preço usando SharedCore
        const formatPrice = (price) => {
            // Usar SharedCore se disponível, fallback para formato básico
            if (window.SharedCore?.PriceFormatter?.formatForCard) {
                return window.SharedCore.PriceFormatter.formatForCard(price);
            }
            
            // Fallback básico
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

        // CORREÇÃO CRÍTICA: Verificar vídeo corretamente (usando SharedCore)
        const hasVideo = window.SharedCore?.ensureBooleanVideo?.(property.has_video) || false;
        
        console.log('🎬 Renderizando card com vídeo:', {
            id: property.id,
            title: property.title,
            has_video: property.has_video,
            hasVideo_boolean: hasVideo,
            imageCount: imageCount
        });
        
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
                
                <!-- CORREÇÃO: Indicador de vídeo com classe CSS -->
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
    
    // NOVA FUNÇÃO: Atualizar conteúdo do card sem substituir completamente
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
                // Atualizar também o atributo data
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
            
            // Atualizar features se fornecido (usando SharedCore)
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
            
            // Atualizar indicador de vídeo (AJUSTADO)
            if (propertyData.has_video !== undefined) {
                const videoIndicator = card.querySelector('.video-indicator');
                const hasVideo = window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) || false;
                
                if (hasVideo && !videoIndicator) {
                    // Adicionar indicador de vídeo (posição ajustada)
                    const imageSection = card.querySelector('.property-image');
                    if (imageSection) {
                        // Verificar se já tem contador de imagens
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
                    // Remover indicador de vídeo
                    videoIndicator.remove();
                }
            }
            
            // Adicionar efeito visual de atualização COM CLASSE CSS
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
   FUNÇÃO PARA ATUALIZAR CARD ESPECÍFICO APÓS EDIÇÃO - VERSÃO MELHORADA
   ========================================================== */
window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.log('🔄 Atualizando card do imóvel:', propertyId, updatedData ? 'com dados específicos' : '');
    
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado para atualizar card:', propertyId);
        return false;
    }
    
    // Se dados atualizados foram fornecidos, usar eles
    const propertyToRender = updatedData ? { ...property, ...updatedData } : property;
    
    // Tentar atualização parcial primeiro
    if (updatedData && window.propertyTemplates.updateCardContent) {
        const partialSuccess = window.propertyTemplates.updateCardContent(propertyId, propertyToRender);
        if (partialSuccess) {
            console.log(`✅ Atualização parcial bem-sucedida para ${propertyId}`);
            
            // Atualizar também no array global
            const index = window.properties.findIndex(p => p.id === propertyId);
            if (index !== -1) {
                window.properties[index] = { ...window.properties[index], ...updatedData };
            }
            
            return true;
        }
    }
    
    // Se falhar a atualização parcial, fazer substituição completa
    console.log(`🔄 Realizando substituição completa do card ${propertyId}`);
    
    // Encontrar o card existente
    const allCards = document.querySelectorAll('.property-card');
    let cardToUpdate = null;
    
    allCards.forEach(card => {
        const cardId = card.getAttribute('data-property-id');
        if (cardId && cardId == propertyId) {
            cardToUpdate = card;
        }
    });
    
    if (cardToUpdate) {
        // Gerar novo HTML para o card
        const newCardHTML = window.propertyTemplates.generate(propertyToRender);
        
        // Substituir o card antigo pelo novo
        cardToUpdate.outerHTML = newCardHTML;
        
        console.log('✅ Card completamente substituído com todos os campos atualizados:', {
            título: propertyToRender.title,
            preço: propertyToRender.price,
            localização: propertyToRender.location,
            vídeo: propertyToRender.has_video
        });
        
        // Atualizar também no array global
        const index = window.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
            window.properties[index] = propertyToRender;
        }
        
        // Adicionar animação para destacar a atualização COM CLASSE CSS
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
        
        // ========== VERIFICAÇÃO CRÍTICA DE CHAVES ==========
        console.log('🔍 Verificando todas as chaves de propriedades no localStorage...');
        const todasChaves = Object.keys(localStorage);
        const chavesPropriedades = todasChaves.filter(key => 
            key.includes('prop') || key.includes('weber') || key.includes('imovel')
        );
        
        chavesPropriedades.forEach(chave => {
            console.log(`   Encontrada chave: "${chave}"`);
        });
        
        const loadStrategies = [
            // Estratégia 1: Cliente Supabase oficial
            () => window.supabaseLoadProperties?.()?.then(r => r?.data?.length ? r.data : null),
            
            // Estratégia 2: Supabase fetch
            () => window.supabaseFetch?.('/properties?select=*')?.then(r => r.ok ? r.data : null),
            
            // Estratégia 3: localStorage com chave UNIFICADA (PRIORIDADE)
            () => {
                const stored = localStorage.getItem('properties');
                console.log('💾 Tentando carregar da chave UNIFICADA "properties":', stored ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
                return stored ? JSON.parse(stored) : null;
            },
            
            // Estratégia 4: Dados iniciais
            () => getInitialProperties()
        ];

        let propertiesData = null;
        let source = 'unknown';
        
        setTimeout(() => {
            loading?.updateMessage?.('Encontre seu imóvel dos sonhos em Maceió 🌴');
        }, 800);
        
        for (let i = 0; i < loadStrategies.length; i++) {
            try {
                propertiesData = await loadStrategies[i]();
                if (propertiesData && propertiesData.length > 0) {
                    source = ['supabase-client', 'supabase-fetch', 'properties-key', 'initial-data'][i];
                    console.log(`✅ Dados carregados da fonte: ${source} (${propertiesData.length} imóveis)`);
                    break;
                }
            } catch (e) { 
                console.warn(`⚠️ Estratégia ${i+1} falhou:`, e.message);
            }
        }

        window.properties = propertiesData || getInitialProperties();
        
        // Processar dados para garantir formato correto (usando SharedCore)
        window.properties = window.properties.map(prop => ({
            ...prop,
            has_video: window.SharedCore?.ensureBooleanVideo?.(prop.has_video) || false,
            features: window.SharedCore?.parseFeaturesForStorage?.(prop.features) || '[]'
        }));
        
        // ========== SALVAMENTO CRÍTICO GARANTIDO ==========
        const saved = window.savePropertiesToStorage();
        if (!saved) {
            console.error('❌ CRÍTICO: Não foi possível salvar propriedades no localStorage!');
            // Tentar fallback
            try {
                sessionStorage.setItem('properties_backup', JSON.stringify(window.properties));
                console.log('✅ Fallback: Salvo no sessionStorage como backup');
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

// ========== 3. RENDERIZAÇÃO OTIMIZADA COM ATUALIZAÇÃO DE VÍDEO ==========
window.renderProperties = function(filter = 'todos', forceClearCache = false) {
    console.log(`🎨 Renderizando propriedades (filtro: ${filter})${forceClearCache ? ' - CACHE LIMPO' : ''}`);
    
    if (forceClearCache && window.propertyTemplates && window.propertyTemplates.cache) {
        window.propertyTemplates.cache.clear();
        console.log('🧹 Cache do template limpo');
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
    
    // Atualizar contador
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
        
        // ✅ APENAS UMA CHAVE: 'properties'
        const propertiesToSave = JSON.stringify(window.properties);
        localStorage.setItem('properties', propertiesToSave);
        
        // 🗑️ REMOVER QUALQUER CHAVE ANTIGA
        ['weberlessa_properties', 'properties_backup', 'weberlessa_backup'].forEach(oldKey => {
            if (localStorage.getItem(oldKey)) {
                localStorage.removeItem(oldKey);
                console.log(`🗑️ Chave antiga removida: ${oldKey}`);
            }
        });
        
        // ✅ VERIFICAÇÃO DE INTEGRIDADE
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
        console.log(`   Primeiro imóvel salvo: "${window.properties[0]?.title || 'N/A'}"`);
        
        // ✅ LOG PARA DEBUG
        if (window.location.search.includes('debug=true')) {
            console.log('🔍 DEBUG - Todas as chaves do localStorage:', Object.keys(localStorage));
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao salvar:', error);
        
        // Tentar fallback com dados menores
        try {
            console.log('🔄 Tentando fallback com dados reduzidos...');
            const backupData = window.properties.map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                location: p.location
            }));
            localStorage.setItem('properties_minimal', JSON.stringify(backupData));
            console.log('✅ Fallback salvo (dados mínimos)');
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
    
    // Delegar para FilterManager se disponível
    if (window.FilterManager && typeof window.FilterManager.setupWithFallback === 'function') {
        return window.FilterManager.setupWithFallback();
    }
    
    // Fallback extremo
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

// ========== 7. ADICIONAR NOVO IMÓVEL (COM FORMATAÇÃO UNIFICADA) - VERSÃO CORRIGIDA ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL - VERSÃO CORRIGIDA');
    console.log('📋 Dados recebidos:', propertyData);

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        // Formatar preço usando SharedCore unificado
        if (propertyData.price) {
            // Usar SharedCore se disponível
            if (window.SharedCore?.PriceFormatter?.formatForInput) {
                propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
            } else {
                // Fallback básico
                let formattedPrice = propertyData.price;
                if (!formattedPrice.startsWith('R$')) {
                    formattedPrice = 'R$ ' + formattedPrice.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                }
                propertyData.price = formattedPrice;
            }
        }

        // CORREÇÃO: Processar features corretamente (usando SharedCore)
        if (propertyData.features) {
            propertyData.features = window.SharedCore?.parseFeaturesForStorage?.(propertyData.features) || '[]';
            console.log('✅ Features processadas:', propertyData.features);
        } else {
            propertyData.features = '[]';
        }

        // CORREÇÃO: Garantir que has_video seja booleano (usando SharedCore)
        propertyData.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) || false;
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

        // ✅ CORREÇÃO CRÍTICA: GARANTIR ID ÚNICO
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

        // Criar objeto com ID CORRETO
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

        // ========== CORREÇÃO CRÍTICA: SALVAMENTO GARANTIDO ==========
        console.log(`💾 Salvando imóvel ${newId} localmente...`);
        
        // 1. Adicionar ao array
        window.properties.unshift(newProperty);
        
        // 2. SALVAR NO localStorage UNIFICADO COM VERIFICAÇÃO
        const saved = window.savePropertiesToStorage();
        
        if (!saved) {
            // TENTAR SALVAMENTO ALTERNATIVO
            console.error('❌ Salvamento principal falhou! Tentando alternativa...');
            
            try {
                // Tentar salvar em chave alternativa
                localStorage.setItem('properties_backup_' + Date.now(), JSON.stringify([newProperty]));
                console.log('✅ Salvo em backup alternativo');
            } catch (backupError) {
                console.error('❌ Backup também falhou!');
                alert('⚠️ ATENÇÃO: Não foi possível salvar o imóvel localmente!\n\n' +
                      'O imóvel aparecerá agora mas pode desaparecer ao recarregar.');
            }
        }

        // ========== ATUALIZAÇÃO DA INTERFACE GARANTIDA ==========
        console.log('🎨 Atualizando interface...');
        
        // 1. Atualizar galeria principal IMEDIATAMENTE
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
        
        // 2. Atualizar lista do admin IMEDIATAMENTE
        if (typeof window.loadPropertyList === 'function') {
            // Forçar execução síncrona
            setTimeout(() => {
                window.loadPropertyList();
                console.log('✅ Lista do admin atualizada');
            }, 100);
        }
        
        // 3. Verificar se o imóvel aparece na interface
        setTimeout(() => {
            const cardExists = !!document.querySelector(`[data-property-id="${newId}"]`);
            const inList = window.properties.some(p => p.id === newId);
            
            console.log('🔍 Verificação pós-salvamento:', {
                cardNaInterface: cardExists ? '✅' : '❌',
                noArray: inList ? '✅' : '❌'
            });
            
            if (!cardExists || !inList) {
                console.warn('⚠️ Imóvel não aparece na interface! Forçando nova renderização...');
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos', true);
                }
            }
        }, 300);

        // ========== FEEDBACK AO USUÁRIO ==========
        const imageCount = newProperty.images
            ? newProperty.images.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        const pdfCount = newProperty.pdfs
            ? newProperty.pdfs.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        let message = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!\n\n`;
        message += `💰 Preço: ${newProperty.price}\n`;
        message += `📍 Local: ${newProperty.location}\n`;
        
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
            message += `\n⚠️ Salvo apenas localmente (sem conexão com servidor)`;
        } else {
            message += `\n🌐 Salvo no servidor com ID: ${supabaseId}`;
        }

        alert(message);

        // ========== LIMPEZA ==========
        setTimeout(() => {
            if (typeof MediaSystem !== 'undefined') {
                MediaSystem.resetState();
            }
        }, 300);

        // Invalidar cache
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

// ========== 9. ATUALIZAR IMÓVEL - VERSÃO COMPLETA CORRIGIDA ==========
window.updateProperty = async function(id, propertyData) {
    console.group('📤 updateProperty - VERSÃO CORRIGIDA');
    console.log('📋 Dados recebidos:', {
        id: id,
        tipoId: typeof id,
        title: propertyData.title,
        price: propertyData.price,
        location: propertyData.location,
        has_video: propertyData.has_video
    });

    // ✅ VALIDAR ID
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

        // ✅ CORREÇÕES CRÍTICAS (usando SharedCore)
        const processedData = {
            ...propertyData,
            has_video: window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) || false
        };

        // ✅ DADOS PARA ATUALIZAÇÃO
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
            has_video: updateData.has_video
        });

        // ✅ ATUALIZAR LOCALMENTE (SEMPRE) - USANDO FUNÇÃO CORRIGIDA
        const localSuccess = window.updateLocalProperty(id, updateData);
        
        if (!localSuccess) {
            throw new Error('Falha ao atualizar localmente');
        }

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
                    title: updateData.title,
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
                } else {
                    supabaseError = await response.text();
                    console.error('❌ Erro na atualização completa:', {
                        status: response.status,
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

        // ✅ FEEDBACK AO USUÁRIO
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
    
    // CORREÇÃO: Garantir que has_video seja booleano (usando SharedCore)
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = window.SharedCore?.ensureBooleanVideo?.(updatedData.has_video) || false;
        console.log(`✅ VÍDEO salvo localmente para ${propertyId}: ${updatedData.has_video}`);
    }
    
    // CORREÇÃO: Processar features (usando SharedCore)
    if (updatedData.features !== undefined) {
        updatedData.features = window.SharedCore?.parseFeaturesForStorage?.(updatedData.features) || '[]';
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
    
    // ✅ CORREÇÃO CRÍTICA: SALVAR NO localStorage UNIFICADO COM VERIFICAÇÃO
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
    
    // ✅ ATUALIZAÇÃO IMEDIATA DA INTERFACE
    // 1. Atualizar lista do admin IMEDIATAMENTE
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
            console.log(`📋 Lista do admin atualizada para imóvel ${propertyId}`);
        }, 100);
    }
    
    // 2. ATUALIZAR CARD NA GALERIA IMEDIATAMENTE
    if (typeof window.updatePropertyCard === 'function') {
        console.log(`🎬 Atualizando card ${propertyId} na galeria principal...`);
        setTimeout(() => {
            window.updatePropertyCard(propertyId, updatedData);
        }, 150);
    } else {
        // Fallback: renderizar todos os imóveis
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
    
    // Garantir formato correto (usando SharedCore)
    propertyWithId.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyWithId.has_video) || false;
    propertyWithId.features = window.SharedCore?.parseFeaturesForStorage?.(propertyWithId.features) || '[]';
    
    window.properties.unshift(propertyWithId);
    
    // ✅ CORREÇÃO: SALVAMENTO GARANTIDO NO LOCALSTORAGE UNIFICADO
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
    
    // Atualizar UI IMEDIATAMENTE
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
    
    // ✅ CORREÇÃO: SALVAR NO localStorage UNIFICADO COM VERIFICAÇÃO
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha ao salvar após exclusão!');
        alert('⚠️ Erro ao salvar alterações localmente!');
        console.groupEnd();
        return false;
    }

    // ✅ Atualizar interface
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos', true);
    }

    // ✅ Atualizar lista do admin
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
            console.log('📋 Lista do admin atualizada após exclusão');
        }, 100);
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

// ========== 14. SISTEMA DE RECUPERAÇÃO DE FALHAS CORRIGIDO ==========
(function essentialPropertiesRecovery() {
    const isDebug = window.location.search.includes('debug=true');
    
    // Verificar após 3 segundos se propriedades foram carregadas
    setTimeout(() => {
        if (!window.properties || window.properties.length === 0) {
            console.warn('⚠️ window.properties vazio após 3 segundos, tentando recuperação...');
            
            // Estratégia 1: Verificar localStorage (chave UNIFICADA)
            let stored = localStorage.getItem('properties');
            
            // Estratégia 2: Verificar localStorage (chave antiga - apenas para migração)
            if (!stored) {
                stored = localStorage.getItem('weberlessa_properties');
                if (stored) {
                    console.log('🔄 Encontrado na chave antiga, migrando para chave unificada...');
                    localStorage.setItem('properties', stored);
                    localStorage.removeItem('weberlessa_properties');
                    console.log('✅ Migração automática concluída');
                }
            }
            
            if (stored) {
                try {
                    window.properties = JSON.parse(stored);
                    // Processar dados para garantir formato correto (usando SharedCore)
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
            
            // Estratégia 3: Dados iniciais
            if (!window.properties || window.properties.length === 0) {
                window.properties = getInitialProperties();
                console.log(`✅ Usando dados iniciais: ${window.properties.length} imóveis`);
                
                // Salvar imediatamente na chave unificada
                window.savePropertiesToStorage();
                
                if (typeof window.renderProperties === 'function') {
                    setTimeout(() => window.renderProperties('todos', true), 300);
                }
            }
        } else {
            if (isDebug) {
                console.log(`✅ Propriedades carregadas: ${window.properties.length} imóveis`);
            }
        }
    }, 3000);
})();

// ========== 15. FUNÇÕES DE TESTE ==========
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
    
    console.log('📊 Estado antes:', {
        id: testProperty.id,
        title: titleBefore,
        price: priceBefore,
        location: locationBefore,
        has_video: hasVideoBefore
    });
    
    // Alterar dados para teste
    testProperty.has_video = !hasVideoBefore;
    testProperty.title = `${titleBefore} [TESTE ATUALIZADO]`;
    testProperty.price = `R$ ${Math.floor(Math.random() * 1000000).toLocaleString()}`;
    testProperty.location = `${locationBefore} [LOCAL ATUALIZADO]`;
    
    // Atualizar no array
    const index = window.properties.findIndex(p => p.id === testProperty.id);
    if (index !== -1) {
        window.properties[index] = testProperty;
        
        // Salvar no localStorage unificado
        const saved = window.savePropertiesToStorage();
        
        if (saved) {
            // Atualizar interface
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
            
            // Restaurar estado original após 10 segundos
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

window.testIndicatorPosition = function() {
    console.group('🧪 TESTE DA POSIÇÃO DO INDICADOR DE VÍDEO');
    
    if (!window.properties || window.properties.length === 0) {
        alert('❌ Nenhum imóvel disponível para teste');
        return;
    }
    
    const testProperty = window.properties[0];
    
    // Verificar se o imóvel tem vídeo
    if (!testProperty.has_video) {
        alert('⚠️ Este imóvel não tem vídeo habilitado.\n\nAtive o vídeo primeiro para testar a posição.');
        return;
    }
    
    // Encontrar o card
    const card = document.querySelector(`[data-property-id="${testProperty.id}"]`);
    if (!card) {
        alert('❌ Card não encontrado na página');
        return;
    }
    
    // Verificar elementos
    const videoIndicator = card.querySelector('.video-indicator');
    const imageCount = card.querySelector('.image-count');
    
    console.log('🔍 Elementos encontrados:', {
        temVideoIndicator: !!videoIndicator,
        temImageCount: !!imageCount,
        posicaoVideoIndicator: videoIndicator ? videoIndicator.style.top : 'não encontrado',
        posicaoImageCount: imageCount ? imageCount.style.top : 'não encontrado'
    });
    
    if (videoIndicator) {
        // Destacar visualmente
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
          `3. Posição do indicador: ${videoIndicator ? videoIndicator.style.top : 'N/A'}\n\n` +
          `✅ O indicador deve estar 85px do topo.`);
    
    console.groupEnd();
};

// ========== 16. ESTILOS CSS PARA ANIMAÇÕES (REMOVIDOS - MOVIDOS PARA main.css) ==========
// NOTA: Estilos movidos para main.css - linhas após propriedades
// Animations: highlightUpdate, pulseVideo (agora em main.css)
// Classes: .property-card.highlighted, .video-indicator.pulsing (definidas em main.css)

// ========== 17. FUNÇÃO DE DIAGNÓSTICO DE SINCRONIZAÇÃO ==========
window.debugSyncIssue = function() {
    console.group('🐛 DIAGNÓSTICO DO BUG DE SINCRONIZAÇÃO');
    
    console.log('📊 ESTADO ATUAL:');
    console.log('- Propriedades no array:', window.properties?.length || 0);
    console.log('- IDs disponíveis:', window.properties?.map(p => p.id).join(', ') || 'nenhum');
    
    // Verificar localStorage
    console.log('💾 VERIFICAÇÃO DE LOCALSTORAGE:');
    const chaves = ['properties', 'weberlessa_properties'];
    chaves.forEach(chave => {
        try {
            const stored = localStorage.getItem(chave);
            if (stored) {
                const parsed = JSON.parse(stored);
                console.log(`- "${chave}": ${parsed.length} imóveis`);
                console.log(`  IDs: ${parsed.map(p => p.id).join(', ')}`);
            } else {
                console.log(`- "${chave}": NÃO ENCONTRADA`);
            }
        } catch (e) {
            console.log(`- "${chave}": ERRO ao ler`);
        }
    });
    
    console.log('⚡ SUGESTÕES:');
    console.log('1. Execute window.diagnosticoSincronizacao() para diagnóstico detalhado');
    console.log('2. Adicione ?debug=true na URL para logs detalhados');
    console.log('3. Verifique console por erros de localStorage');
    
    console.groupEnd();
};

// ========== 18. VERIFICAÇÃO AUTOMÁTICA AO INICIAR ==========
setTimeout(() => {
    // Verificar inconsistência entre array e localStorage unificado
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
            
            // Remover chave antiga se ainda existir
            if (localStorage.getItem('weberlessa_properties')) {
                console.log('🗑️ Removendo chave antiga residual...');
                localStorage.removeItem('weberlessa_properties');
            }
        } catch (error) {
            console.error('❌ Erro na verificação automática:', error);
        }
    }
}, 5000);

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js VERSÃO FINAL CORRIGIDA - FUNÇÕES CENTRALIZADAS NO SHAREDCORE');

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

// ========== FUNÇÃO DE DIAGNÓSTICO PÚBLICA ==========
window.diagnosticoSincronizacao = function() {
    console.group('🔍 DIAGNÓSTICO DE SINCRONIZAÇÃO - PROPERTIES.JS');
    
    // 1. Verificar estado atual
    console.log('📊 ESTADO ATUAL:');
    console.log('- window.properties:', window.properties?.length || 0, 'imóveis');
    console.log('- É array?', Array.isArray(window.properties));
    
    if (window.properties && window.properties.length > 0) {
        console.log('- Primeiros 3 IDs:', window.properties.slice(0, 3).map(p => p.id));
    }
    
    // 2. Verificar localStorage
    console.log('💾 LOCALSTORAGE (CHAVE UNIFICADA):');
    const chaves = Object.keys(localStorage);
    const chavesProp = chaves.filter(k => k.includes('prop') || k.includes('weber'));
    
    chavesProp.forEach(chave => {
        try {
            const valor = localStorage.getItem(chave);
            const parsed = JSON.parse(valor || '[]');
            console.log(`- "${chave}": ${parsed.length} imóveis`);
            if (parsed.length > 0) {
                console.log(`  Primeiro: "${parsed[0]?.title}" (ID: ${parsed[0]?.id})`);
            }
        } catch (e) {
            console.log(`- "${chave}": ERRO ao parsear`);
        }
    });
    
    // 3. Verificar funções críticas
    console.log('⚙️ FUNÇÕES CRÍTICAS:');
    ['savePropertiesToStorage', 'addNewProperty', 'loadPropertiesData'].forEach(fn => {
        console.log(`- ${fn}:`, typeof window[fn] === 'function' ? '✅' : '❌');
    });
    
    // 4. Teste de salvamento rápido
    console.log('🧪 TESTE RÁPIDO DE SALVAMENTO:');
    const testObj = { test: Date.now() };
    try {
        localStorage.setItem('test_sync', JSON.stringify(testObj));
        const retrieved = JSON.parse(localStorage.getItem('test_sync') || '{}');
        console.log('- Teste de escrita/leitura:', testObj.test === retrieved.test ? '✅ OK' : '❌ FALHOU');
        localStorage.removeItem('test_sync');
    } catch (e) {
        console.log('- Teste falhou:', e.message);
    }
    
    // 5. Recomendações
    console.log('💡 RECOMENDAÇÕES:');
    if (!window.properties || window.properties.length === 0) {
        console.log('1. window.properties está vazio - execute window.loadPropertiesData()');
    }
    
    const propsStorage = localStorage.getItem('properties');
    if (!propsStorage) {
        console.log('2. localStorage "properties" não encontrado - verifique salvamento');
    }
    
    const hasOldKey = localStorage.getItem('weberlessa_properties');
    if (hasOldKey) {
        console.log('3. CHAVE ANTIGA DETECTADA! Execute localStorage.removeItem("weberlessa_properties")');
    }
    
    console.groupEnd();
    
    alert('✅ Diagnóstico completo! Verifique o console (F12) para detalhes.');
};

console.log('🎯 VERSÃO CORRIGIDA - FUNÇÕES CENTRALIZADAS NO SHAREDCORE');
console.log('💡 Execute window.diagnosticoSincronizacao() para verificar o estado do sistema');
console.log('💡 Execute window.testFullUpdate() para testar atualização completa');
console.log('💡 Adicione ?debug=true na URL para logs detalhados');

// Adicionar botão de diagnóstico se em modo debug
if (window.location.search.includes('debug=true')) {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            const btn = document.createElement('button');
            btn.innerHTML = '🔍 Diagnóstico Sync';
            btn.style.position = 'fixed';
            btn.style.bottom = '60px';
            btn.style.right = '20px';
            btn.style.zIndex = '9999';
            btn.style.padding = '8px 12px';
            btn.style.background = '#e74c3c';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '5px';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '11px';
            btn.onclick = window.diagnosticoSincronizacao;
            document.body.appendChild(btn);
        }, 2000);
    });
}
