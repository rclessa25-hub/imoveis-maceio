// js/modules/properties.js - COM NOVAS MENSAGENS DE LOADING
console.log('🏠 properties.js - Sistema Core de Propriedades (VERSÃO OTIMIZADA COMPLETA)');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;

// ========== TEMPLATE ENGINE COM CACHE AVANÇADO E GALERIA ==========
class PropertyTemplateEngine {
    constructor() {
        this.cache = new Map();
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    generate(property) {
        const cacheKey = `prop_${property.id}_${property.images?.length || 0}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

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
                    ${this.generateFeatures(property.features, property.rural)}
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
        const hasImages = property.images && property.images !== 'EMPTY';
        const imageUrls = hasImages ? property.images.split(',').filter(u => u.trim()) : [];
        const imageCount = imageUrls.length;
        const firstImageUrl = imageCount ? imageUrls[0] : this.imageFallback;
        const hasGallery = imageCount > 1;
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY';

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
                ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                ${hasGallery ? `<div class="image-count">${imageCount}</div>` : ''}
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem.showModal(${property.id})">
                        <i class="fas fa-file-pdf"></i>
                    </button>` : ''}
            </div>
        `;
    }

    generateFeatures(features, isRural = false) {
        if (!features) return '';
        const list = Array.isArray(features)
            ? features
            : typeof features === 'string'
                ? features.split(',')
                : [];

        return list.length ? `
            <div class="property-features">
                ${list.map(f => `<span class="feature-tag ${isRural ? 'rural-tag' : ''}">${f.trim()}</span>`).join('')}
            </div>
        ` : '';
    }
}

window.propertyTemplates = new PropertyTemplateEngine();

// ========== CARREGAMENTO UNIFICADO ==========
window.loadPropertiesData = async function () {
    const loading = window.LoadingManager?.show?.(
        'Olá! Carregando sonhos 👋',
        'Estamos preparando tudo para você...'
    );

    try {
        const strategies = [
            () => window.supabaseLoadProperties?.().then(r => r?.data?.length ? r.data : null),
            () => {
                const stored = localStorage.getItem('weberlessa_properties');
                return stored ? JSON.parse(stored) : null;
            },
            () => getInitialProperties()
        ];

        let data = null;

        setTimeout(() => {
            loading?.updateMessage?.('Encontre seu imóvel dos sonhos em Maceió 🌴');
        }, 800);

        for (const fn of strategies) {
            try {
                data = await fn();
                if (data?.length) break;
            } catch {}
        }

        window.properties = data || getInitialProperties();
        window.savePropertiesToStorage();

        loading?.setVariant?.('success');
        loading?.updateMessage?.(`🏠 ${window.properties.length} imóveis disponíveis`);

        window.renderProperties('todos');

    } catch (e) {
        console.error(e);
        loading?.setVariant?.('error');
        loading?.updateMessage?.('Erro ao carregar. Recarregue 🔄');
        window.properties = getInitialProperties();
        window.renderProperties('todos');
    } finally {
        setTimeout(() => loading?.hide?.(), 800);
    }
};

// ========== DADOS INICIAIS ==========
function getInitialProperties() {
    return [
        {
            id: 1,
            title: "Casa 2Qtos - Forene",
            price: "R$ 180.000",
            location: "Residência Conj. Portal do Renascer, Forene",
            description: "Casa a 100m do CEASA...",
            features: ["02 Quartos", "Sala", "Cozinha", "02 Banheiros"],
            type: "residencial",
            has_video: true,
            badge: "Destaque",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        }
    ];
}

// ========== RENDERIZAÇÃO ==========
window.renderProperties = function (filter = 'todos') {
    const container = document.getElementById('properties-container');
    if (!container) return;

    const filtered = filter === 'todos'
        ? window.properties
        : window.properties.filter(p => p.type === filter);

    container.innerHTML = filtered.length
        ? filtered.map(p => window.propertyTemplates.generate(p)).join('')
        : '<p class="no-properties">Nenhum imóvel disponível.</p>';
};

// ========== STORAGE ==========
window.savePropertiesToStorage = function () {
    localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
};

// ========== CONTATO ==========
window.contactAgent = function (id) {
    const prop = window.properties.find(p => p.id === id);
    if (!prop) return alert('Imóvel não encontrado');

    const msg = `Olá! Tenho interesse no imóvel: ${prop.title} - ${prop.price}`;
    window.open(`https://wa.me/5582996044513?text=${encodeURIComponent(msg)}`, '_blank');
};

// ========== INIT ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.loadPropertiesData());
} else {
    window.loadPropertiesData();
}

console.log('✅ properties.js carregado com sucesso');
