// js/modules/properties.js - VERSÃO FINAL COM PADRÃO IDÊNTICO PARA TODAS AS QUANTIDADES DE FOTOS
console.log('🏠 properties.js - VERSÃO FINAL - PADRÃO IDÊNTICO PARA 1+ FOTOS');

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

// ========== FUNÇÕES DE FORMATAÇÃO ==========
window.formatFeaturesForDisplay = function(features) {
    if (!features) return '';
    try {
        if (Array.isArray(features)) {
            return features.filter(f => f && f.trim()).join(', ');
        }
        if (typeof features === 'string' && features.trim().startsWith('[')) {
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
        return '';
    }
};

window.parseFeaturesForStorage = function(value) {
    if (!value) return '[]';
    try {
        if (Array.isArray(value)) {
            return JSON.stringify(value.filter(f => f && f.trim()));
        }
        if (typeof value === 'string' && value.trim().startsWith('[')) {
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
        return '[]';
    }
};

window.ensureBooleanVideo = function(videoValue) {
    if (videoValue === undefined || videoValue === null) return false;
    if (typeof videoValue === 'boolean') return videoValue;
    if (typeof videoValue === 'string') {
        const lower = videoValue.toLowerCase().trim();
        if (lower === 'true' || lower === '1' || lower === 'sim' || lower === 'yes') return true;
        if (lower === 'false' || lower === '0' || lower === 'não' || lower === 'no') return false;
    }
    if (typeof videoValue === 'number') return videoValue === 1;
    return Boolean(videoValue);
};

// ========== TEMPLATE ENGINE COM PADRÃO IDÊNTICO ==========
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
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';
        const hasVideo = window.ensureBooleanVideo(property.has_video);
        
        console.log('🎬 Renderizando card (PADRÃO IDÊNTICO):', {
            id: property.id,
            imageCount: imageCount,
            hasVideo: hasVideo,
            hasPdfs: hasPdfs
        });
        
        // ✅ PADRÃO IDÊNTICO PARA TODAS AS QUANTIDADES DE FOTOS
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" 
                 style="position: relative; height: 250px;">
                <img src="${firstImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     alt="${property.title}"
                     onerror="this.src='${this.imageFallback}'">
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                
                <!-- ✅ CONTADOR SEMPRE VISÍVEL (mesmo para 1 foto) -->
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
                
                <!-- ✅ VÍDEO SEMPRE EM 35px (abaixo do contador) -->
                ${hasVideo ? `
                    <div class="video-indicator" style="
                        position: absolute;
                        top: 45px;  <!-- 10px do contador + 35px = 45px -->
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
                        animation: pulseVideo 2s infinite;
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
                
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem.showModal(${property.id})" style="
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        background: rgba(220, 53, 69, 0.9);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        z-index: 8;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-file-pdf" style="font-size: 18px;"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    updateCardContent(propertyId, propertyData) {
        console.log(`🔍 Atualizando conteúdo do card ${propertyId}`, propertyData);
        
        const card = document.querySelector(`.property-card[data-property-id="${propertyId}"]`);
        if (!card) return false;
        
        try {
            // Atualizar preço
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
            
            // Atualizar título
            if (propertyData.title !== undefined) {
                const titleElement = card.querySelector('[data-title-field]');
                if (titleElement) {
                    titleElement.textContent = propertyData.title;
                }
                card.setAttribute('data-property-title', propertyData.title);
            }
            
            // Atualizar localização
            if (propertyData.location !== undefined) {
                const locationElement = card.querySelector('[data-location-field]');
                if (locationElement) {
                    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${propertyData.location}`;
                }
            }
            
            // Atualizar descrição
            if (propertyData.description !== undefined) {
                const descriptionElement = card.querySelector('[data-description-field]');
                if (descriptionElement) {
                    descriptionElement.textContent = propertyData.description;
                }
            }
            
            // Atualizar features
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
            
            // ✅ ATUALIZAR CONTADOR (SEMPRE VISÍVEL)
            if (propertyData.images !== undefined) {
                const imageCountElement = card.querySelector('.image-count');
                const imageUrls = propertyData.images && propertyData.images !== 'EMPTY' 
                    ? propertyData.images.split(',').filter(url => url.trim() !== '') 
                    : [];
                const imageCount = imageUrls.length;
                
                if (imageCountElement) {
                    imageCountElement.innerHTML = `<i class="fas fa-images" style="margin-right: 5px;"></i>${imageCount}`;
                } else {
                    // Adicionar contador se não existir
                    const imageSection = card.querySelector('.property-image');
                    if (imageSection) {
                        const countDiv = document.createElement('div');
                        countDiv.className = 'image-count';
                        countDiv.style.cssText = `
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
                        `;
                        countDiv.innerHTML = `<i class="fas fa-images" style="margin-right: 5px;"></i>${imageCount}`;
                        imageSection.appendChild(countDiv);
                    }
                }
            }
            
            // ✅ ATUALIZAR VÍDEO (SEMPRE EM 45px)
            if (propertyData.has_video !== undefined) {
                const videoIndicator = card.querySelector('.video-indicator');
                const hasVideo = window.ensureBooleanVideo(propertyData.has_video);
                
                if (hasVideo && !videoIndicator) {
                    const imageSection = card.querySelector('.property-image');
                    if (imageSection) {
                        const videoDiv = document.createElement('div');
                        videoDiv.className = 'video-indicator';
                        videoDiv.style.cssText = `
                            position: absolute;
                            top: 45px;
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
                            animation: pulseVideo 2s infinite;
                            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                            border: 1px solid rgba(255,255,255,0.3);
                            backdrop-filter: blur(5px);
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        `;
                        videoDiv.innerHTML = '<i class="fas fa-video" style="color: #FFD700; font-size: 14px;"></i><span>TEM VÍDEO</span>';
                        imageSection.appendChild(videoDiv);
                    }
                } else if (!hasVideo && videoIndicator) {
                    videoIndicator.remove();
                }
            }
            
            // ✅ ATUALIZAR PDF
            if (propertyData.pdfs !== undefined) {
                const pdfButton = card.querySelector('.pdf-access');
                const hasPdfs = propertyData.pdfs && propertyData.pdfs !== 'EMPTY' && propertyData.pdfs.trim() !== '';
                const imageSection = card.querySelector('.property-image');
                
                if (hasPdfs && !pdfButton && imageSection) {
                    const pdfBtn = document.createElement('button');
                    pdfBtn.className = 'pdf-access';
                    pdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i>';
                    pdfBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
                            window.PdfSystem.showModal(propertyId);
                        }
                    };
                    pdfBtn.style.cssText = `
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        background: rgba(220, 53, 69, 0.9);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        z-index: 8;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                        transition: all 0.3s ease;
                    `;
                    imageSection.appendChild(pdfBtn);
                } else if (!hasPdfs && pdfButton) {
                    pdfButton.remove();
                }
            }
            
            card.style.animation = 'highlightUpdate 1s ease';
            setTimeout(() => {
                card.style.animation = '';
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
                updatedCard.style.animation = 'highlightUpdate 1s ease';
                setTimeout(() => {
                    updatedCard.style.animation = '';
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
            } catch (e) { }
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

// ========== 9. ATUALIZAR IMÓVEL - VERSÃO COMPLETA ==========
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
                setTimeout(() => window.renderProperties('todos', true), 300);
            }
        }
    }, 3000);
})();

// ========== 15. ADICIONAR ESTILOS CSS PARA ANIMAÇÕES ==========
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
console.log('✅ properties.js VERSÃO FINAL - PADRÃO IDÊNTICO PARA 1+ FOTOS');

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

console.log('🎯 PADRÃO IDÊNTICO IMPLEMENTADO!');
console.log('✅ Contador SEMPRE visível (mesmo para 1 foto)');
console.log('✅ Vídeo SEMPRE em 45px (abaixo do contador)');
console.log('✅ Mesmo z-index e posições para todas as quantidades de fotos');
console.log('💡 Teste: Adicione um imóvel com 1 foto - o layout será IDÊNTICO ao de 5+ fotos');
