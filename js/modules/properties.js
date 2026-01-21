// js/modules/properties.js - SISTEMA COMPLETO COM SINCRONIZAÇÃO AUTOMÁTICA
console.log('🏠 properties.js - Sistema Core (COM SINCRONIZAÇÃO AUTOMÁTICA)');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;

// ========== TEMPLATE ENGINE ==========
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
        const imageUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
        const imageCount = imageUrls.length;
        const firstImageUrl = imageCount > 0 ? imageUrls[0] : this.imageFallback;
        const hasGallery = imageCount > 1;
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';

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
        const featureArray = Array.isArray(features) ? features : 
                           (typeof features === 'string' ? features.split(',') : []);
        
        return featureArray.length > 0 ? `
            <div class="property-features">
                ${featureArray.map(f => `<span class="feature-tag ${isRural ? 'rural-tag' : ''}">${f.trim()}</span>`).join('')}
            </div>
        ` : '';
    }
}

window.propertyTemplates = new PropertyTemplateEngine();

// ========== 1. CARREGAMENTO DE PROPRIEDADES ==========
window.loadPropertiesData = async function () {
    const loading = window.LoadingManager?.show?.(
        'Carregando imóveis...', 
        'Buscando as melhores oportunidades em Maceió',
        { variant: 'processing' }
    );
    
    try {
        const loadStrategies = [
            () => window.supabaseLoadProperties?.()?.then(r => r?.data?.length ? r.data : null),
            () => window.supabaseFetch?.('/properties?select=*')?.then(r => r.ok ? r.data : null),
            () => {
                const stored = localStorage.getItem('weberlessa_properties');
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
        
        // Verificar sincronização após carregar
        setTimeout(() => {
            if (window.SyncManager) {
                window.SyncManager.checkUnsyncedProperties();
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        loading?.setVariant?.('error');
        loading?.updateMessage?.('⚠️ Erro ao carregar imóveis');
        window.properties = getInitialProperties();
        window.renderProperties('todos');
        
    } finally {
        setTimeout(() => loading?.hide?.(), 800);
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
            features: ["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas de carro"],
            type: "residencial",
            has_video: true,
            badge: "Destaque",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        }
    ];
}

// ========== 3. RENDERIZAÇÃO ==========
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

// ========== 4. SALVAR STORAGE ==========
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

// ========== 5. CONFIGURAR FILTROS ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    if (window.FilterManager && typeof window.FilterManager.init === 'function') {
        window.FilterManager.init((filterValue) => {
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filterValue);
            }
        });
        console.log('✅ Filtros configurados via FilterManager');
        return;
    }
    
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

// ========== 7. ADICIONAR IMÓVEL COM SINCRONIZAÇÃO ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL');
    
    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        let mediaResult = { images: '', pdfs: '' };
        let hasMedia = false;

        if (typeof MediaSystem !== 'undefined') {
            hasMedia = MediaSystem.state.files.length > 0 || MediaSystem.state.pdfs.length > 0;
            
            if (hasMedia) {
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                
                if (mediaResult.images) propertyData.images = mediaResult.images;
                if (mediaResult.pdfs) propertyData.pdfs = mediaResult.pdfs;
            } else {
                propertyData.images = '';
                propertyData.pdfs = '';
            }
        }

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
            savedToSupabase: supabaseSuccess,
            supabaseId: supabaseId,
            lastSync: supabaseSuccess ? new Date().toISOString() : null
        };

        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();

        if (!supabaseSuccess && window.SyncManager) {
            console.log('🔄 Adicionando à fila de sincronização...');
            window.SyncManager.syncProperty(newProperty);
        }

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
        
        if (imageCount > 0) message += `📸 ${imageCount} foto(s)/vídeo(s)\n`;
        if (pdfCount > 0) message += `📄 ${pdfCount} documento(s) PDF\n`;
        if (!hasMedia) message += `ℹ️ Nenhuma mídia anexada\n`;
        
        if (!supabaseSuccess) {
            message += `⚠️ Salvo localmente - será sincronizado quando a conexão voltar`;
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
        console.error('❌ ERRO ao adicionar imóvel:', error);
        
        let errorMessage = '❌ Erro ao cadastrar imóvel:\n';
        errorMessage += error.message || 'Erro desconhecido';
        
        if (error.message.includes('fetch')) {
            errorMessage += '\n\nPossível problema de conexão.';
        }
        
        if (error.message.includes('undefined')) {
            errorMessage += '\n\n⚠️ Constantes Supabase não definidas!';
        }
        
        alert(errorMessage);
        
        console.groupEnd();
        return null;
    }
};

// ========== 8. ATUALIZAR IMÓVEL COM SINCRONIZAÇÃO ==========
window.updateProperty = async function(id, propertyData) {
    console.log(`✏️ ATUALIZANDO IMÓVEL ${id}`);

    if (!id || id === 'null' || id === 'undefined') {
        console.error('❌ ID inválido fornecido:', id);
        if (window.editingPropertyId) {
            id = window.editingPropertyId;
        } else {
            alert('❌ ERRO: Não foi possível identificar o imóvel!');
            return false;
        }
    }

    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        alert(`❌ Imóvel não encontrado!`);
        return false;
    }

    try {
        const updateData = {
            title: propertyData.title || window.properties[index].title,
            price: propertyData.price || window.properties[index].price,
            location: propertyData.location || window.properties[index].location,
            description: propertyData.description || window.properties[index].description || '',
            features: propertyData.features || window.properties[index].features || '',
            type: propertyData.type || window.properties[index].type || 'residencial',
            has_video: Boolean(propertyData.has_video) || false,
            badge: propertyData.badge || window.properties[index].badge || 'Novo',
            rural: propertyData.type === 'rural' || window.properties[index].rural || false,
            images: propertyData.images || window.properties[index].images || '',
            pdfs: propertyData.pdfs || window.properties[index].pdfs || ''
        };

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

                if (response.ok) {
                    supabaseSuccess = true;
                }
            } catch (error) {
                console.error('❌ Erro de conexão com Supabase:', error);
            }
        }

        const updatedProperty = {
            ...window.properties[index],
            ...updateData,
            id: id,
            savedToSupabase: supabaseSuccess,
            lastSync: supabaseSuccess ? new Date().toISOString() : window.properties[index].lastSync
        };
        
        window.properties[index] = updatedProperty;
        window.savePropertiesToStorage();

        if (!supabaseSuccess && window.SyncManager) {
            console.log('🔄 Adicionando à fila de sincronização...');
            window.SyncManager.syncProperty(updatedProperty);
        }

        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }

        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
        }

        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
        }

        if (supabaseSuccess) {
            alert(`✅ Imóvel "${updateData.title}" atualizado PERMANENTEMENTE!`);
        } else {
            alert(`⚠️ Atualizado localmente - será sincronizado automaticamente.`);
        }

        return true;

    } catch (error) {
        console.error('❌ ERRO ao atualizar imóvel:', error);
        alert(`❌ ERRO: Não foi possível atualizar.\n\n${error.message}`);
        return false;
    }
};

// ========== 9. EXCLUIR IMÓVEL ==========
window.deleteProperty = async function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }

    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"`)) {
        return false;
    }

    let supabaseSuccess = false;
    let supabaseError = null;

    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });

            if (response.ok) {
                supabaseSuccess = true;
            } else {
                const errorText = await response.text();
                supabaseError = errorText;
            }
        } catch (error) {
            supabaseError = error.message;
        }
    }

    window.properties = window.properties.filter(p => p.id !== id);
    window.savePropertiesToStorage();

    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }

    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => window.loadPropertyList(), 300);
    }

    if (window.SmartCache) {
        SmartCache.invalidatePropertiesCache();
    }

    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE!`);
    } else {
        alert(`⚠️ Excluído apenas localmente.`);
    }

    return supabaseSuccess;
};

// ========== 10. CARREGAR LISTA PARA ADMIN ==========
window.loadPropertyList = function() {
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
};

// ========== 11. SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA (SyncManager) ==========
window.SyncManager = {
    queue: [],
    isSyncing: false,
    lastSyncAttempt: null,
    syncInterval: null,
    
    addStatusIndicator() {
        const existingIndicator = document.getElementById('sync-status-indicator');
        if (existingIndicator) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'sync-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        indicator.innerHTML = `
            <i class="fas fa-sync-alt" style="animation: spin 2s linear infinite;"></i>
            <span id="sync-status-text">Sincronizando...</span>
            <span id="sync-queue-count" style="background:#e74c3c;padding:2px 6px;border-radius:10px;font-size:0.7rem;">0</span>
        `;
        
        document.body.appendChild(indicator);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .sync-success { background: #27ae60 !important; }
            .sync-error { background: #e74c3c !important; }
            .sync-offline { background: #f39c12 !important; }
            .sync-syncing { background: #3498db !important; }
            .sync-queued { background: #9b59b6 !important; }
        `;
        document.head.appendChild(style);
    },
    
    updateStatus(status, message = '', queueSize = null) {
        const indicator = document.getElementById('sync-status-indicator');
        if (!indicator) return;
        
        const text = document.getElementById('sync-status-text');
        const count = document.getElementById('sync-queue-count');
        
        if (text) text.textContent = message || this.getStatusMessage(status);
        if (count && queueSize !== null) {
            count.textContent = queueSize;
            count.style.display = queueSize > 0 ? 'inline-block' : 'none';
        }
        
        indicator.className = '';
        indicator.classList.add(`sync-${status}`);
        
        if (status === 'success' && queueSize === 0) {
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 3000);
        } else {
            indicator.style.opacity = '1';
        }
    },
    
    getStatusMessage(status) {
        const messages = {
            'syncing': 'Sincronizando...',
            'success': 'Sincronizado ✓',
            'error': 'Erro na sincronização',
            'offline': 'Offline - Salvando localmente',
            'queued': 'Na fila para sincronizar',
            'idle': 'Pronto'
        };
        return messages[status] || 'Sincronizando...';
    },
    
    async syncProperty(property) {
        if (property.savedToSupabase) {
            console.log(`✅ Propriedade já sincronizada: ${property.title}`);
            return true;
        }
        
        const alreadyInQueue = this.queue.some(p => p.id === property.id);
        if (!alreadyInQueue) {
            this.queue.push(property);
            console.log(`🔄 Adicionado à fila: ${property.title}`);
            this.updateStatus('queued', `Na fila: ${property.title}`, this.queue.length);
        }
        
        return await this.processQueue();
    },
    
    async processQueue() {
        if (this.isSyncing || this.queue.length === 0) {
            return false;
        }
        
        this.isSyncing = true;
        this.lastSyncAttempt = new Date();
        console.log(`🔄 Processando fila: ${this.queue.length} item(s)`);
        this.updateStatus('syncing', `Sincronizando ${this.queue.length} item(s)...`, this.queue.length);
        
        const connectionTest = await this.testConnection();
        if (!connectionTest.connected) {
            console.warn('⚠️ Supabase offline - mantendo em fila');
            this.updateStatus('offline', 'Offline - Tentando reconectar...', this.queue.length);
            this.isSyncing = false;
            return false;
        }
        
        let successCount = 0;
        let errorCount = 0;
        const queueCopy = [...this.queue];
        
        for (const property of queueCopy) {
            try {
                console.log(`📤 Sincronizando: ${property.title}`);
                
                const supabaseData = {
                    title: property.title,
                    price: property.price,
                    location: property.location,
                    description: property.description || '',
                    features: property.features || '',
                    type: property.type || 'residencial',
                    has_video: property.has_video || false,
                    badge: property.badge || 'Novo',
                    rural: property.rural || false,
                    images: property.images || '',
                    pdfs: property.pdfs || '',
                    created_at: property.created_at || new Date().toISOString()
                };
                
                let result = null;
                
                if (typeof window.supabaseSaveProperty === 'function') {
                    result = await window.supabaseSaveProperty(supabaseData);
                } else {
                    result = await this.directSupabaseSave(supabaseData);
                }
                
                if (result?.success || result?.ok) {
                    const localIndex = window.properties.findIndex(p => p.id === property.id);
                    if (localIndex !== -1) {
                        const supabaseId = result.id || result.data?.id || property.id;
                        
                        window.properties[localIndex] = {
                            ...window.properties[localIndex],
                            id: supabaseId,
                            savedToSupabase: true,
                            supabaseId: supabaseId,
                            lastSync: new Date().toISOString()
                        };
                        
                        console.log(`✅ Sincronizado: ${property.title} (ID: ${supabaseId})`);
                        
                        this.queue = this.queue.filter(p => p.id !== property.id);
                        successCount++;
                        
                        window.savePropertiesToStorage();
                    }
                } else {
                    console.error(`❌ Falha ao sincronizar ${property.title}:`, result?.error);
                    errorCount++;
                }
                
            } catch (error) {
                console.error(`❌ Erro ao sincronizar ${property.title}:`, error);
                errorCount++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (successCount > 0) {
            console.log(`✅ ${successCount} propriedade(s) sincronizada(s) com sucesso`);
            this.updateStatus('success', `${successCount} item(s) sincronizado(s)`, this.queue.length);
            
            if (typeof window.renderProperties === 'function') {
                window.renderProperties('todos');
            }
            
            if (typeof window.loadPropertyList === 'function') {
                setTimeout(() => window.loadPropertyList(), 500);
            }
        }
        
        if (errorCount > 0) {
            console.warn(`⚠️ ${errorCount} propriedade(s) falharam`);
            this.updateStatus('error', `${errorCount} erro(s)`, this.queue.length);
        }
        
        this.isSyncing = false;
        return successCount > 0;
    },
    
    async directSupabaseSave(propertyData) {
        try {
            if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
                return { success: false, error: 'Credenciais não configuradas' };
            }
            
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(propertyData)
            });
            
            if (response.ok) {
                const data = await response.json();
                return { 
                    success: true, 
                    data: data,
                    id: data[0]?.id || data.id 
                };
            } else {
                const errorText = await response.text();
                return { success: false, error: errorText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async testConnection() {
        if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
            return { connected: false, error: 'Credenciais não configuradas' };
        }
        
        try {
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
                headers: { 
                    'apikey': window.SUPABASE_KEY, 
                    'Authorization': `Bearer ${window.SUPABASE_KEY}` 
                }
            });
            return { connected: response.ok, status: response.status };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    },
    
    checkUnsyncedProperties() {
        const unsynced = window.properties.filter(p => !p.savedToSupabase);
        
        if (unsynced.length > 0) {
            console.warn(`⚠️ ${unsynced.length} propriedade(s) não sincronizada(s)`);
            
            unsynced.forEach(property => {
                const alreadyInQueue = this.queue.some(p => p.id === property.id);
                if (!alreadyInQueue) {
                    this.queue.push(property);
                }
            });
            
            this.updateStatus('queued', `${unsynced.length} item(s) para sincronizar`, this.queue.length);
            
            setTimeout(() => this.processQueue(), 5000);
        } else {
            console.log('✅ Todas as propriedades sincronizadas');
            this.updateStatus('idle', 'Tudo sincronizado', 0);
        }
    },
    
    init() {
        console.log('🔄 Inicializando SyncManager...');
        
        this.addStatusIndicator();
        
        setTimeout(() => this.checkUnsyncedProperties(), 3000);
        
        this.syncInterval = setInterval(() => {
            if (this.queue.length > 0) {
                console.log('🔄 Verificação periódica de sincronização...');
                this.processQueue();
            }
        }, 120000);
        
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada - sincronizando...');
            if (this.queue.length > 0) {
                this.processQueue();
            }
        });
        
        console.log('✅ SyncManager inicializado');
    },
    
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('🔄 SyncManager destruído');
    }
};

// ========== 12. SISTEMA DE ESTADO ==========
window.PropertyState = {
    properties: [],
    currentFilter: 'todos',
    editingId: null,

    init(initialData = []) {
        this.properties = initialData;
        return this;
    },

    add(property) {
        this.properties.unshift(property);
        this.save();
        return property;
    },

    update(id, updates) {
        const index = this.properties.findIndex(p => p.id == id);
        if (index === -1) return false;
        
        this.properties[index] = { ...this.properties[index], ...updates };
        this.save();
        return true;
    },

    remove(id) {
        const initialLength = this.properties.length;
        this.properties = this.properties.filter(p => p.id !== id);
        this.save();
        return initialLength !== this.properties.length;
    },

    save() {
        try {
            localStorage.setItem('weberlessa_properties', JSON.stringify(this.properties));
        } catch (e) {
            console.warn('⚠️ Não foi possível salvar no localStorage');
        }
    }
};

if (window.properties && window.properties.length > 0) {
    window.PropertyState.init(window.properties);
    window.properties = window.PropertyState.properties;
}

// ========== 13. INICIALIZAÇÃO AUTOMÁTICA ==========
(function initializePropertiesSystem() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🏠 DOM carregado - inicializando...');
            
            if (typeof window.loadPropertiesData === 'function') {
                window.loadPropertiesData();
            }
            
            if (typeof window.setupFilters === 'function') {
                window.setupFilters();
            }
            
            setTimeout(() => {
                if (window.SyncManager) {
                    window.SyncManager.init();
                }
            }, 5000);
        });
    } else {
        console.log('🏠 DOM já carregado - inicializando agora...');
        
        if (typeof window.loadPropertiesData === 'function') {
            window.loadPropertiesData();
        }
        
        if (typeof window.setupFilters === 'function') {
            window.setupFilters();
        }
        
        setTimeout(() => {
            if (window.SyncManager) {
                window.SyncManager.init();
            }
        }, 5000);
    }
})();

// ========== 14. FUNÇÕES DE TESTE ==========
window.getInitialProperties = getInitialProperties;

window.testUploadSystem = function() {
    console.group('🧪 TESTE UPLOAD');
    
    console.log('SUPABASE_URL:', window.SUPABASE_URL);
    console.log('SUPABASE_KEY:', window.SUPABASE_KEY ? '✅ Disponível' : '❌ Indisponível');
    
    if (window.MediaSystem) {
        const testBlob = new Blob(['test'], { type: 'image/jpeg' });
        const testFile = new File([testBlob], 'test_upload.jpg', { type: 'image/jpeg' });
        
        MediaSystem.uploadFiles([testFile], 'test_' + Date.now(), 'images')
            .then(urls => {
                console.log('✅ Upload teste:', urls.length > 0 ? 'SUCESSO' : 'FALHA');
                if (urls.length > 0) {
                    console.log('🔗 URL:', urls[0].substring(0, 100) + '...');
                    alert('✅ Upload funcionou!');
                }
            })
            .catch(err => {
                console.error('❌ Erro no upload:', err);
                alert('Erro: ' + err.message);
            });
    }
    
    console.groupEnd();
};

window.testSyncSystem = function() {
    console.group('🧪 TESTE SINCRONIZAÇÃO');
    
    console.log('SyncManager:', !!window.SyncManager);
    console.log('Queue:', window.SyncManager?.queue?.length || 0);
    
    const testProperty = {
        id: 'test_' + Date.now(),
        title: 'Imóvel de Teste',
        price: 'R$ 999.999',
        location: 'Local de Teste',
        savedToSupabase: false,
        created_at: new Date().toISOString()
    };
    
    console.log('Criando teste:', testProperty);
    
    window.properties.unshift(testProperty);
    window.savePropertiesToStorage();
    
    if (window.SyncManager) {
        window.SyncManager.syncProperty(testProperty)
            .then(success => {
                if (success) {
                    console.log('✅ Sincronização bem-sucedida!');
                    alert('✅ Teste de sincronização OK!');
                } else {
                    console.log('⚠️ Sincronização em fila');
                    alert('⚠️ Sincronização em fila.');
                }
            })
            .catch(err => {
                console.error('❌ Erro:', err);
                alert('❌ Erro: ' + err.message);
            });
    }
    
    console.groupEnd();
};

console.log('💡 Execute:');
console.log('- window.testUploadSystem() para testar uploads');
console.log('- window.testSyncSystem() para testar sincronização');
console.log('✅ properties.js carregado com sistema de sincronização automática');
