// js/modules/properties.js - VERSÃO COMPLETA COM ATUALIZAÇÃO IMEDIATA DE TODOS OS CAMPOS
console.log('🏠 properties.js - VERSÃO FINAL COM ATUALIZAÇÃO IMEDIATA DE TODOS OS CAMPOS');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;
window.currentFilter = 'todos';
window.lastUpdateTime = null;

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

// ========== TEMPLATE ENGINE DINÂMICO SEM CACHE PARA ATUALIZAÇÕES ==========
class PropertyTemplateEngine {
    constructor() {
        this.cache = new Map();
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    generate(property, forceRefresh = false) {
        // Se forçar refresh ou não tiver cache, gerar novo HTML
        const timestamp = Date.now();
        const cacheKey = `prop_${property.id}_${timestamp}`;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Formatar features para exibição
        const displayFeatures = window.formatFeaturesForDisplay(property.features);

        const html = `
            <div class="property-card" data-property-id="${property.id}" data-updated="${timestamp}">
                ${this.generateImageSection(property)}
                <div class="property-content">
                    <div class="property-price" style="color: #1a5276; font-weight: 700; font-size: 1.2rem; margin-bottom: 5px;">
                        ${property.price || 'R$ 0,00'}
                    </div>
                    <h3 class="property-title" style="font-size: 1.1rem; margin-bottom: 8px; color: #0c2d48; font-weight: 600;">
                        ${property.title || 'Sem título'}
                    </h3>
                    <div class="property-location" style="color: #495057; font-size: 0.9rem; margin-bottom: 10px; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-map-marker-alt" style="color: #d4af37;"></i> 
                        ${property.location || 'Local não informado'}
                    </div>
                    <p style="color: #6c757d; font-size: 0.9rem; line-height: 1.4; margin-bottom: 10px;">
                        ${property.description || 'Descrição não disponível.'}
                    </p>
                    ${displayFeatures ? `
                        <div class="property-features" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${displayFeatures.split(',').map(f => `
                                <span class="feature-tag ${property.rural ? 'rural-tag' : ''}" 
                                      style="background: #e9ecef; color: #495057; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">
                                    ${f.trim()}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button class="contact-btn" onclick="contactAgent(${property.id})" 
                            style="background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 15px;">
                        <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> 
                        <span>Entrar em Contato</span>
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

        // CORREÇÃO CRÍTICA: Verificar vídeo corretamente
        const hasVideo = window.ensureBooleanVideo(property.has_video);
        
        console.log('🎬 Renderizando card com vídeo:', {
            id: property.id,
            title: property.title,
            has_video: property.has_video,
            hasVideo_boolean: hasVideo,
            imageCount: imageCount
        });

        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" 
                 style="position: relative; height: 250px; border-radius: 8px 8px 0 0; overflow: hidden;">
                <img src="${firstImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;"
                     alt="${property.title}"
                     onerror="this.src='${this.imageFallback}'"
                     onload="this.style.opacity='1'">
                ${property.badge ? `
                    <div class="property-badge ${property.rural ? 'rural-badge' : ''}" 
                         style="position: absolute; top: 10px; left: 10px; background: ${property.rural ? '#27ae60' : '#d4af37'}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;">
                        ${property.badge}
                    </div>
                ` : ''}
                
                ${hasVideo ? `
                    <div class="video-indicator" style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.7);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        z-index: 10;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.2);
                        backdrop-filter: blur(4px);
                        animation: pulseVideo 2s infinite;
                    ">
                        <i class="fas fa-video" style="color: #FFD700; font-size: 12px;"></i>
                        <span>TEM VÍDEO</span>
                    </div>
                ` : ''}
                
                ${hasGallery ? `
                    <div class="image-count" style="
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                        z-index: 5;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        backdrop-filter: blur(4px);
                    ">
                        <i class="fas fa-images" style="font-size: 10px;"></i>
                        <span>${imageCount}</span>
                    </div>
                ` : ''}
                
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem?.showModal?.(${property.id})"
                            style="position: absolute; bottom: 10px; left: 10px; background: rgba(255, 255, 255, 0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #e74c3c; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    // Invalidar cache de um imóvel específico
    invalidatePropertyCache(propertyId) {
        const keysToDelete = [];
        this.cache.forEach((value, key) => {
            if (key.startsWith(`prop_${propertyId}_`)) {
                keysToDelete.push(key);
            }
        });
        
        keysToDelete.forEach(key => {
            this.cache.delete(key);
            console.log(`🗑️ Cache invalidado: ${key}`);
        });
        
        return keysToDelete.length;
    }
}

// Instância global
window.propertyTemplates = new PropertyTemplateEngine();

/* ==========================================================
   FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO DE CARD
   ========================================================== */
window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.group(`🔄 ATUALIZANDO CARD DO IMÓVEL ${propertyId}`);
    
    // Registrar tempo da atualização
    window.lastUpdateTime = Date.now();
    
    // 1. Encontrar o imóvel
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado:', propertyId);
        console.groupEnd();
        return false;
    }
    
    // 2. Atualizar dados locais se fornecidos
    if (updatedData && typeof updatedData === 'object') {
        console.log('📦 Dados atualizados recebidos:', updatedData);
        
        // Atualizar propriedade no array global
        const index = window.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
            window.properties[index] = {
                ...window.properties[index],
                ...updatedData,
                updated_at: new Date().toISOString()
            };
            
            // Atualizar referência local
            Object.assign(property, updatedData);
        }
    }
    
    // 3. Invalidar cache do template engine
    if (window.propertyTemplates && window.propertyTemplates.invalidatePropertyCache) {
        const deletedCount = window.propertyTemplates.invalidatePropertyCache(propertyId);
        console.log(`🗑️ ${deletedCount} entradas de cache invalidadas`);
    }
    
    // 4. Encontrar o card existente no DOM
    const allCards = document.querySelectorAll('.property-card');
    let cardToUpdate = null;
    
    // Buscar por data-property-id primeiro
    const cardById = document.querySelector(`.property-card[data-property-id="${propertyId}"]`);
    if (cardById) {
        cardToUpdate = cardById;
        console.log(`✅ Card encontrado por data-property-id: ${propertyId}`);
    } else {
        // Fallback: buscar por título
        allCards.forEach(card => {
            const titleElement = card.querySelector('.property-title');
            if (titleElement && titleElement.textContent.includes(property.title)) {
                cardToUpdate = card;
            }
        });
    }
    
    if (cardToUpdate) {
        console.log(`✅ Card encontrado no DOM: "${property.title}"`);
        
        // 5. Gerar NOVO HTML (forçar refresh)
        const newCardHTML = window.propertyTemplates.generate(property, true);
        
        // 6. Substituir o card antigo pelo novo
        cardToUpdate.outerHTML = newCardHTML;
        
        // 7. Aplicar animação de destaque
        setTimeout(() => {
            const updatedCard = document.querySelector(`[data-property-id="${propertyId}"]`);
            
            if (updatedCard) {
                // Adicionar classe de animação
                updatedCard.classList.add('card-updating');
                
                // Animação CSS
                updatedCard.style.animation = 'highlightUpdate 1s ease';
                updatedCard.style.transition = 'all 0.3s ease';
                updatedCard.style.boxShadow = '0 5px 15px rgba(26, 82, 118, 0.2)';
                
                // Remover animação após completar
                setTimeout(() => {
                    updatedCard.classList.remove('card-updating');
                    updatedCard.style.animation = '';
                    updatedCard.style.boxShadow = '';
                }, 1000);
            }
        }, 50);
        
        console.log(`✅ Card atualizado com sucesso:`, {
            título: property.title,
            preço: property.price,
            localização: property.location,
            vídeo: property.has_video,
            descrição: property.description?.substring(0, 30) + '...',
            imagens: property.images ? property.images.split(',').length : 0,
            timestamp: window.lastUpdateTime
        });
        
        // 8. Salvar no localStorage
        window.savePropertiesToStorage();
        
        console.groupEnd();
        return true;
    } else {
        console.warn('⚠️ Card não encontrado no DOM, renderizando todos os imóveis');
        
        // Fallback: renderizar todos os imóveis
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos');
        }
        
        console.groupEnd();
        return false;
    }
};

/* ==========================================================
   FUNÇÃO DE ATUALIZAÇÃO LOCAL COM ATUALIZAÇÃO VISUAL IMEDIATA
   ========================================================== */
window.updateLocalProperty = function(propertyId, updatedData) {
    console.group(`💾 updateLocalProperty COM ATUALIZAÇÃO VISUAL IMEDIATA: ${propertyId}`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ window.properties não é um array válido');
        console.groupEnd();
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id == propertyId || p.id === propertyId);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado localmente');
        console.groupEnd();
        return false;
    }
    
    // Garantir formato correto dos dados
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = window.ensureBooleanVideo(updatedData.has_video);
        console.log(`✅ VÍDEO processado: ${updatedData.has_video}`);
    }
    
    if (updatedData.features !== undefined) {
        updatedData.features = window.parseFeaturesForStorage(updatedData.features);
        console.log(`✅ FEATURES processadas`);
    }
    
    // Formatar preço se necessário
    if (updatedData.price && !updatedData.price.startsWith('R$')) {
        updatedData.price = 'R$ ' + updatedData.price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        console.log(`✅ PREÇO formatado: ${updatedData.price}`);
    }
    
    // Preservar dados importantes
    const existingProperty = window.properties[index];
    
    // Atualizar com spread operator para manter todos os campos
    window.properties[index] = {
        ...existingProperty,
        ...updatedData,
        id: propertyId, // Garantir que o ID não mude
        updated_at: new Date().toISOString()
    };
    
    console.log(`📊 Dados atualizados:`, {
        título: updatedData.title || existingProperty.title,
        preço: updatedData.price || existingProperty.price,
        localização: updatedData.location || existingProperty.location,
        descrição: updatedData.description?.substring(0, 30) + '...' || existingProperty.description?.substring(0, 30) + '...',
        vídeo_antes: existingProperty.has_video,
        vídeo_depois: updatedData.has_video,
        timestamp: new Date().toISOString()
    });
    
    // Salvar no localStorage
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log(`💾 Imóvel ${propertyId} salvo no localStorage`);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        console.groupEnd();
        return false;
    }
    
    // ATUALIZAÇÃO VISUAL IMEDIATA - CORREÇÃO CRÍTICA
    setTimeout(() => {
        // 1. Atualizar lista do admin
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
            console.log('📋 Lista do admin atualizada');
        }
        
        // 2. ATUALIZAR CARD NA GALERIA COM OS NOVOS DADOS
        console.log('🎨 Chamando updatePropertyCard com dados atualizados...');
        if (typeof window.updatePropertyCard === 'function') {
            // Passar os dados atualizados para garantir renderização correta
            window.updatePropertyCard(propertyId, updatedData);
        } else {
            // Fallback: renderizar todos
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(window.currentFilter || 'todos');
            }
        }
        
        // 3. Mostrar notificação visual
        window.showUpdateNotification(`✅ Imóvel "${updatedData.title || existingProperty.title}" atualizado!`);
        
    }, 100);
    
    console.groupEnd();
    return true;
};

/* ==========================================================
   FUNÇÃO DE ATUALIZAÇÃO COMPLETA (LOCAL + SUPABASE)
   ========================================================== */
window.updateProperty = async function(id, propertyData) {
    console.group(`📤 UPDATE PROPERTY CHAMADO: ${id}`);
    
    // Validações iniciais
    if (!id) {
        console.error('❌ ID não fornecido');
        console.groupEnd();
        return { success: false, error: 'ID não fornecido' };
    }
    
    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado');
        console.groupEnd();
        return { success: false, error: 'Imóvel não encontrado' };
    }
    
    try {
        // Formatar dados
        const processedData = { ...propertyData };
        
        // Formatar preço
        if (processedData.price) {
            if (window.SharedCore?.PriceFormatter?.formatForInput) {
                try {
                    processedData.price = window.SharedCore.PriceFormatter.formatForInput(processedData.price);
                } catch (e) {
                    console.warn('⚠️ Erro no formatador de preço:', e);
                }
            }
            if (!processedData.price.startsWith('R$')) {
                processedData.price = 'R$ ' + processedData.price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            }
        }
        
        // Processar vídeo e features
        processedData.has_video = window.ensureBooleanVideo(processedData.has_video);
        processedData.features = window.parseFeaturesForStorage(processedData.features);
        
        console.log('📦 Dados processados:', {
            título: processedData.title,
            preço: processedData.price,
            localização: processedData.location,
            descrição: processedData.description?.substring(0, 30) + '...',
            vídeo: processedData.has_video,
            timestamp: new Date().toISOString()
        });
        
        // ATUALIZAÇÃO LOCAL IMEDIATA (para resposta visual instantânea)
        console.log('⚡ Atualizando localmente para resposta imediata...');
        const localSuccess = window.updateLocalProperty(id, processedData);
        
        if (!localSuccess) {
            throw new Error('Falha ao atualizar localmente');
        }
        
        // Tentar salvar no Supabase (opcional - em segundo plano)
        let supabaseSuccess = false;
        let supabaseError = null;
        
        if (window.ensureSupabaseCredentials()) {
            console.log('🌐 Tentando sincronizar com Supabase...');
            try {
                const validId = window.validateIdForSupabase?.(id) || id;
                const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': window.SUPABASE_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(processedData)
                });
                
                if (response.ok) {
                    supabaseSuccess = true;
                    console.log('✅ Sincronizado com Supabase');
                    
                    // Atualizar status no objeto local
                    const propertyIndex = window.properties.findIndex(p => p.id == id);
                    if (propertyIndex !== -1) {
                        window.properties[propertyIndex].lastSynced = new Date().toISOString();
                        window.properties[propertyIndex].syncStatus = 'synced';
                    }
                } else {
                    supabaseError = await response.text();
                    console.warn('⚠️ Erro no Supabase:', supabaseError);
                    
                    // Marcar como pendente de sincronização
                    const propertyIndex = window.properties.findIndex(p => p.id == id);
                    if (propertyIndex !== -1) {
                        window.properties[propertyIndex].syncStatus = 'pending';
                        window.properties[propertyIndex].syncError = supabaseError;
                    }
                }
            } catch (error) {
                supabaseError = error.message;
                console.warn('⚠️ Erro de conexão com Supabase:', error);
                
                // Marcar como offline
                const propertyIndex = window.properties.findIndex(p => p.id == id);
                if (propertyIndex !== -1) {
                    window.properties[propertyIndex].syncStatus = 'offline';
                }
            }
        }
        
        // Feedback final
        const result = { 
            success: true, 
            localOnly: !supabaseSuccess,
            supabaseError: supabaseError,
            data: processedData,
            updatedAt: new Date().toISOString()
        };
        
        console.log('✅ UpdateProperty concluído:', result);
        console.groupEnd();
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
        
        // Mostrar feedback de erro
        window.showUpdateNotification(`❌ Erro ao atualizar: ${error.message}`, 'error');
        
        console.groupEnd();
        return { success: false, error: error.message };
    }
};

/* ==========================================================
   FUNÇÃO PARA MOSTRAR NOTIFICAÇÃO DE ATUALIZAÇÃO
   ========================================================== */
window.showUpdateNotification = function(message, type = 'success') {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.update-notification');
    existingNotifications.forEach(n => n.remove());
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `update-notification ${type}`;
    notification.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        ">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span style="font-size: 0.9rem;">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
};

// ========== FUNÇÕES DE TESTE E DEBUG ==========
window.testAllFieldsUpdate = function() {
    console.group('🧪 TESTE DE ATUALIZAÇÃO DE TODOS OS CAMPOS');
    
    if (!window.properties || window.properties.length === 0) {
        alert('❌ Nenhum imóvel disponível para teste');
        console.groupEnd();
        return;
    }
    
    const testProperty = window.properties[0];
    const originalData = { ...testProperty };
    
    // Modificar todos os campos importantes
    const updatedData = {
        title: `[TESTE] ${testProperty.title} - ${Date.now()}`,
        price: `R$ ${Math.floor(Math.random() * 1000000)}`,
        location: `Localização Teste ${Math.floor(Math.random() * 100)}`,
        description: `Descrição atualizada em ${new Date().toLocaleTimeString()}. Este é um teste de atualização de todos os campos simultaneamente. O sistema deve atualizar visualmente todos os elementos do card imediatamente após o salvamento.`,
        has_video: !testProperty.has_video,
        badge: testProperty.badge === 'Novo' ? 'Destaque' : 'Novo',
        type: testProperty.type === 'residencial' ? 'comercial' : 'residencial'
    };
    
    console.log('📤 Dados de teste:', updatedData);
    
    // Atualizar usando a função corrigida
    console.log('⚡ Iniciando atualização de teste...');
    const success = window.updateLocalProperty(testProperty.id, updatedData);
    
    if (success) {
        alert(`🧪 TESTE DE ATUALIZAÇÃO COMPLETA:\n\n` +
              `✅ Título alterado\n` +
              `✅ Preço alterado\n` +
              `✅ Localização alterada\n` +
              `✅ Descrição alterada\n` +
              `✅ Vídeo: ${updatedData.has_video ? 'ATIVADO' : 'DESATIVADO'}\n` +
              `✅ Badge alterado\n` +
              `✅ Tipo alterado\n\n` +
              `O card deve atualizar IMEDIATAMENTE com todos os novos dados.\n\n` +
              `Os dados serão restaurados em 5 segundos.`);
        
        // Restaurar após 5 segundos
        setTimeout(() => {
            console.log('🔄 Restaurando dados originais...');
            window.updateLocalProperty(testProperty.id, originalData);
            console.log('✅ Dados originais restaurados');
        }, 5000);
    } else {
        alert('❌ Falha no teste de atualização');
    }
    
    console.groupEnd();
};

window.forcePropertyUpdate = function(propertyId) {
    if (!propertyId) {
        const firstProperty = window.properties?.[0];
        if (firstProperty) propertyId = firstProperty.id;
        else {
            alert('❌ Nenhum imóvel disponível');
            return;
        }
    }
    
    console.group(`🔧 FORÇANDO ATUALIZAÇÃO DO IMÓVEL ${propertyId}`);
    
    if (typeof window.updatePropertyCard === 'function') {
        const property = window.properties?.find(p => p.id === propertyId);
        if (!property) {
            alert('❌ Imóvel não encontrado');
            console.groupEnd();
            return;
        }
        
        console.log('⚡ Forçando atualização do card...');
        window.updatePropertyCard(propertyId);
        
        // Mostrar detalhes
        console.log('📊 Detalhes do imóvel:', {
            id: property.id,
            title: property.title,
            price: property.price,
            location: property.location,
            video: property.has_video
        });
        
        alert(`✅ Forçando atualização do card ${propertyId}\n\n` +
              `Título: ${property.title}\n` +
              `Preço: ${property.price}\n` +
              `Localização: ${property.location}\n` +
              `Vídeo: ${property.has_video ? 'SIM' : 'NÃO'}\n\n` +
              `Verifique se todos os campos estão visíveis e atualizados.`);
    } else {
        alert('❌ Função updatePropertyCard não disponível');
    }
    
    console.groupEnd();
};

// ========== FUNÇÕES DE SUPORTE ==========
window.savePropertiesToStorage = function() {
    try {
        localStorage.setItem('properties', JSON.stringify(window.properties));
        console.log('💾 Imóveis salvos no localStorage:', window.properties.length);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
};

window.renderProperties = function(filter = 'todos', forceRefresh = false) {
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container de propriedades não encontrado');
        return;
    }
    
    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = `
            <div class="no-properties" style="text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-home" style="font-size: 3rem; margin-bottom: 1rem; color: #ddd;"></i>
                <h3 style="margin-bottom: 0.5rem;">Nenhum imóvel disponível</h3>
                <p>Adicione seu primeiro imóvel no painel administrativo!</p>
            </div>
        `;
        return;
    }
    
    const filtered = filter === 'todos' ? window.properties : 
        window.properties.filter(p => {
            if (filter === 'residencial') return p.type === 'residencial';
            if (filter === 'comercial') return p.type === 'comercial';
            if (filter === 'rural') return p.rural === true || p.type === 'rural';
            return true;
        });
    
    // Limpar cache se forçar refresh
    if (forceRefresh && window.propertyTemplates) {
        window.propertyTemplates.cache.clear();
        console.log('🗑️ Cache do template engine limpo');
    }
    
    container.innerHTML = filtered.map(prop => 
        window.propertyTemplates.generate(prop, forceRefresh)
    ).join('');
    
    console.log(`✅ ${filtered.length} imóveis renderizados (filtro: ${filter})`);
    
    // Atualizar contador
    const countElement = document.getElementById('propertyCount');
    if (countElement) {
        countElement.textContent = `${filtered.length} imóveis`;
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
            description: "Casa a 100m do CEASA; - Medindo 6,60m frente X 19m lado; - 125,40m² de área total; -Somente um único dono; - 02 Quartos, Sala; - Cozinha; - 02 Banheiros; - Varanda; - 02 Vagas de garagem; - Água de Poço Artesiano;",
            features: JSON.stringify(["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas de carro"]),
            type: "residencial",
            has_video: true,
            badge: "Destaque",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];
}

// ========== CSS DINÂMICO PARA ANIMAÇÕES ==========
if (!document.querySelector('#property-update-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'property-update-styles';
    styleEl.textContent = `
        @keyframes highlightUpdate {
            0% { 
                box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); 
                transform: scale(1); 
            }
            50% { 
                box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); 
                transform: scale(1.02); 
            }
            100% { 
                box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); 
                transform: scale(1); 
            }
        }
        
        @keyframes pulseVideo {
            0% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0.8; transform: scale(1); }
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .property-card {
            transition: all 0.3s ease;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            background: white;
        }
        
        .property-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .card-updating {
            animation: highlightUpdate 1s ease !important;
        }
        
        .update-notification {
            animation: slideInRight 0.3s ease;
        }
        
        .update-notification.slide-out {
            animation: slideOutRight 0.3s ease;
        }
    `;
    document.head.appendChild(styleEl);
    console.log('🎨 Estilos de atualização carregados');
}

// ========== CONFIGURAÇÃO DE FILTROS ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        console.warn('⚠️ Botões de filtro não encontrados');
        return;
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterText = this.textContent.trim();
            let filter = 'todos';
            
            if (filterText === 'Residencial') filter = 'residencial';
            else if (filterText === 'Comercial') filter = 'comercial';
            else if (filterText === 'Rural') filter = 'rural';
            
            window.currentFilter = filter;
            
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filter);
            }
        });
    });
    
    // Ativar botão "Todos" por padrão
    const todosBtn = Array.from(filterButtons).find(btn => 
        btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
    );
    if (todosBtn) {
        todosBtn.classList.add('active');
        window.currentFilter = 'todos';
    }
    
    console.log('✅ Filtros configurados');
};

// ========== CONTATAR AGENTE ==========
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

// ========== INICIALIZAÇÃO ==========
window.initializePropertiesModule = function() {
    console.log('🚀 Inicializando módulo de propriedades...');
    
    // Carregar propriedades do localStorage se disponível
    const storedProperties = localStorage.getItem('properties');
    if (storedProperties) {
        try {
            window.properties = JSON.parse(storedProperties);
            console.log(`✅ ${window.properties.length} imóveis carregados do localStorage`);
        } catch (error) {
            console.error('❌ Erro ao carregar do localStorage:', error);
            window.properties = getInitialProperties();
        }
    } else {
        window.properties = getInitialProperties();
        console.log('✅ Dados iniciais carregados');
    }
    
    // Renderizar propriedades
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
    
    // Configurar filtros
    setTimeout(() => {
        window.setupFilters();
    }, 500);
    
    console.log('✅ Módulo de propriedades inicializado');
};

// ========== CARREGAMENTO AUTOMÁTICO ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - inicializando properties...');
        setTimeout(window.initializePropertiesModule, 100);
    });
} else {
    console.log('🏠 DOM já carregado - inicializando agora...');
    setTimeout(window.initializePropertiesModule, 100);
}

// ========== EXPORTAR FUNÇÕES PARA TESTE ==========
window.getInitialProperties = getInitialProperties;

console.log('🎯 properties.js - VERSÃO FINAL COM ATUALIZAÇÃO IMEDIATA DE TODOS OS CAMPOS');
console.log('📋 Funções disponíveis:');
console.log('1. window.testAllFieldsUpdate() - Testa atualização de todos os campos');
console.log('2. window.forcePropertyUpdate(id) - Força atualização de um card específico');
console.log('3. window.updatePropertyCard(id, data) - Atualiza card com animação');
console.log('4. window.updateLocalProperty(id, data) - Atualiza localmente com feedback visual');
console.log('5. window.updateProperty(id, data) - Atualização completa (local + Supabase)');
console.log('');
console.log('✅ Sistema 100% funcional com atualização imediata de TODOS os campos!');
