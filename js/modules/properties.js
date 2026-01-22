// js/modules/properties.js - COM CORREÇÃO DE UPLOAD E FORMATAÇÃO COMPATÍVEL
console.log('🏠 properties.js - Sistema Core de Propriedades (VERSÃO COMPATÍVEL)');

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

        // Template minimalista com todos os elementos visuais CRÍTICOS
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
        const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
        const imageUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
        const imageCount = imageUrls.length;
        const firstImageUrl = imageCount > 0 ? imageUrls[0] : this.imageFallback;
        const hasGallery = imageCount > 1;
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';

        // ✅ CRÍTICO: Verificar se existe função de galeria e usá-la se disponível
        if (hasGallery && typeof window.createPropertyGallery === 'function') {
            try {
                // Usar galeria se disponível
                return window.createPropertyGallery(property);
            } catch (e) {
                console.warn('❌ Erro na galeria, usando fallback:', e);
            }
        }

        // Fallback: Imagem única com todos os elementos visuais
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

// Instância global
window.propertyTemplates = new PropertyTemplateEngine();

/**
 * AGUARDA TODAS AS IMAGENS DOS IMÓVEIS CARREGAREM
 * Garante que loading só fecha quando site está 100% pronto
 */
async function waitForAllPropertyImages() {
    console.log('🖼️ Aguardando carregamento completo de todas as imagens...');
    
    // Seleciona TODAS as imagens dos cards de imóveis
    const propertyImages = document.querySelectorAll('.property-image img, .property-gallery-image');
    
    if (propertyImages.length === 0) {
        console.log('ℹ️ Nenhuma imagem de imóvel encontrada');
        return 0;
    }
    
    console.log(`📸 ${propertyImages.length} imagem(ns) de imóveis para carregar`);
    
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = propertyImages.length;
        
        // Verificar cada imagem
        propertyImages.forEach(img => {
            // Se já carregou
            if (img.complete && img.naturalWidth > 0) {
                loadedCount++;
                console.log(`✅ Imagem já carregada: ${img.src.substring(0, 50)}...`);
            } 
            // Se ainda não carregou
            else {
                img.onload = () => {
                    loadedCount++;
                    console.log(`✅ Imagem carregada: ${img.src.substring(0, 50)}...`);
                    checkCompletion();
                };
                
                img.onerror = () => {
                    loadedCount++; // Conta mesmo se falhou
                    console.warn(`⚠️ Falha na imagem: ${img.src.substring(0, 50)}...`);
                    checkCompletion();
                };
            }
        });
        
        // Timeout de segurança: máximo 10 segundos
        const safetyTimeout = setTimeout(() => {
            console.log(`⏰ Timeout: ${loadedCount}/${totalImages} imagens carregadas`);
            resolve(loadedCount);
        }, 10000); // 10 segundos máximo
        
        function checkCompletion() {
            if (loadedCount >= totalImages) {
                clearTimeout(safetyTimeout);
                console.log(`🎉 TODAS ${totalImages} imagens dos imóveis carregadas!`);
                resolve(loadedCount);
            }
        }
        
        // Se todas já estivessem carregadas
        if (loadedCount >= totalImages) {
            clearTimeout(safetyTimeout);
            console.log(`⚡ ${totalImages} imagens já estavam carregadas`);
            resolve(loadedCount);
        }
    });
}

// ========== 1. FUNÇÃO OTIMIZADA: CARREGAMENTO UNIFICADO COM NOVAS MENSAGENS ==========
window.loadPropertiesData = async function () {
    const loading = window.LoadingManager?.show?.(
        'Carregando imóveis...', 
        'Buscando as melhores oportunidades em Maceió',
        { variant: 'processing' }
    );
    
    try {
        // Estratégias de carregamento otimizadas
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
        
        // Atualizar mensagem durante o carregamento
        setTimeout(() => {
            loading?.updateMessage?.('Encontre seu imóvel dos sonhos em Maceió 🌴');
        }, 800);
        
        // Executar estratégias sequencialmente até sucesso
        for (const strategy of loadStrategies) {
            try {
                propertiesData = await strategy();
                if (propertiesData && propertiesData.length > 0) break;
            } catch (e) { /* Silenciosamente tenta próxima estratégia */ }
        }

        window.properties = propertiesData || getInitialProperties();
        window.savePropertiesToStorage();

        // Feedback visual otimizado
        loading?.setVariant?.('success');
        
        // Mensagem final personalizada
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
        
        // Renderizar com cache otimizado
        window.renderProperties('todos');

        // ✅✅✅ NOVO: AGUARDAR TODAS AS IMAGENS CARREGAREM
        const imagesLoaded = await waitForAllPropertyImages();

        // ✅ Atualizar mensagem baseada no resultado
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
        // ✅ Fechar loading APÓS imagens + pequeno delay para leitura
        setTimeout(() => loading?.hide?.(), 1200);
    }
};

// ========== 2. DADOS INICIAIS (MANTIDA) ==========
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

// ========== 3. RENDERIZAÇÃO OTIMIZADA ==========
window.renderProperties = function(filter = 'todos') {
    const container = document.getElementById('properties-container');
    if (!container || !window.properties) return;

    // Filtrar propriedades
    const filtered = this.filterProperties(window.properties, filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>';
        return;
    }

    // Renderizar com template engine otimizada
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

// ========== 4. SALVAR NO STORAGE (MANTIDA) ==========
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

// ========== 5. CONFIGURAR FILTROS (DELEGADO PARA FILTERMANAGER) ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros via FilterManager...');
    
    // Delegar para FilterManager se disponível
    if (window.FilterManager && typeof window.FilterManager.init === 'function') {
        window.FilterManager.init((filterValue) => {
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filterValue);
            }
        });
        console.log('✅ Filtros configurados via FilterManager');
        return;
    }
    
    // Fallback para código original (compatibilidade)
    console.warn('⚠️ FilterManager não disponível, usando fallback...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (!filterButtons || filterButtons.length === 0) {
        console.error('❌ Botões de filtro não encontrados!');
        return;
    }
    
    // Código fallback simplificado (15 linhas vs 45 original)
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            if (window.renderProperties) window.renderProperties(filter);
        });
    });
    
    // Ativar "Todos" por padrão
    const todosBtn = Array.from(filterButtons).find(btn => 
        btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
    );
    if (todosBtn) todosBtn.classList.add('active');
};

// ========== 6. CONTATAR AGENTE (MANTIDA) ==========
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

// ========== 7. ADICIONAR NOVO IMÓVEL - VERSÃO COMPATÍVEL ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL - VERSÃO COMPATÍVEL');
    console.log('📋 Dados recebidos:', propertyData);

    // ✅ Validação básica
    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        // =========================================================
        // 1. PROCESSAR MÍDIA (IMAGENS + PDFs) VIA SISTEMA UNIFICADO
        // =========================================================
        let mediaResult = { images: '', pdfs: '' };
        let hasMedia = false;

        if (typeof MediaSystem !== 'undefined') {
            console.log('🔍 Verificando estado do MediaSystem:');
            console.log('- Files:', MediaSystem.state.files.length);
            console.log('- PDFs:', MediaSystem.state.pdfs.length);
            console.log('- Existing:', MediaSystem.state.existing.length);
            console.log('- Existing PDFs:', MediaSystem.state.existingPdfs.length);
            
            hasMedia = MediaSystem.state.files.length > 0 || MediaSystem.state.pdfs.length > 0;
            
            if (hasMedia) {
                console.log('📤 Processando mídia com MediaSystem...');
                
                // Usar um ID temporário para o upload
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                console.log(`🆔 ID temporário para upload: ${tempId}`);
                
                // Fazer upload - ✅ AGORA COM CONSTANTES FIXAS
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                
                console.log('📊 Resultado do upload:', {
                    imagesCount: mediaResult.images ? mediaResult.images.split(',').length : 0,
                    pdfsCount: mediaResult.pdfs ? mediaResult.pdfs.split(',').length : 0,
                    hasImages: !!mediaResult.images,
                    hasPdfs: !!mediaResult.pdfs
                });
                
                if (mediaResult.images) {
                    propertyData.images = mediaResult.images;
                    console.log(`✅ ${mediaResult.images.split(',').length} URL(s) de imagem obtidas`);
                    console.log('📸 URLs:', mediaResult.images.split(',').map(url => url.substring(0, 80) + '...'));
                }
                
                if (mediaResult.pdfs) {
                    propertyData.pdfs = mediaResult.pdfs;
                    console.log(`✅ ${mediaResult.pdfs.split(',').length} URL(s) de PDF obtidas`);
                    console.log('📄 URLs:', mediaResult.pdfs.split(',').map(url => url.substring(0, 80) + '...'));
                }
            } else {
                console.log('ℹ️ Nenhuma mídia selecionada para este imóvel');
                propertyData.images = '';
                propertyData.pdfs = '';
            }
        } else {
            console.warn('⚠️ MediaSystem não disponível');
        }

        // =========================================================
        // 2. SALVAR NO SUPABASE (SE DISPONÍVEL)
        // =========================================================
        let supabaseSuccess = false;
        let supabaseId = null;
        let supabaseResponse = null;

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

                // ✅✅✅ VERSÃO COMPATÍVEL: Formatar preço usando método disponível
                if (supabaseData.price && !supabaseData.price.startsWith('R$')) {
                    if (SharedCore?.PriceFormatter?.formatForInput) {
                        supabaseData.price = SharedCore.PriceFormatter.formatForInput(supabaseData.price);
                        console.log('✅ Preço formatado via PriceFormatter para Supabase');
                    } else if (SharedCore?.formatPriceForInput) {
                        supabaseData.price = SharedCore.formatPriceForInput(supabaseData.price);
                        console.log('✅ Preço formatado via função de compatibilidade para Supabase');
                    } else if (window.formatPriceForInput) {
                        supabaseData.price = window.formatPriceForInput(supabaseData.price);
                        console.log('✅ Preço formatado via função global (legado) para Supabase');
                    }
                }

                console.log('📤 Enviando imóvel ao Supabase:', supabaseData);
                supabaseResponse = await window.supabaseSaveProperty(supabaseData);
                console.log('📡 Resposta do Supabase:', supabaseResponse);

                if (supabaseResponse && supabaseResponse.success) {
                    supabaseSuccess = true;
                    supabaseId = supabaseResponse.data?.id || supabaseResponse.data?.[0]?.id;
                    console.log(`✅ Imóvel salvo no Supabase com ID ${supabaseId}`);
                } else {
                    console.warn('⚠️ Supabase respondeu sem sucesso:', supabaseResponse);
                }
            } catch (error) {
                console.error('❌ Erro ao salvar no Supabase:', error);
                // Continuar com salvamento local
            }
        }

        // =========================================================
        // 3. CRIAR OBJETO LOCAL
        // =========================================================
        const newId = supabaseSuccess && supabaseId
            ? supabaseId
            : (window.properties.length > 0
                ? Math.max(...window.properties.map(p => parseInt(p.id) || 0)) + 1
                : 1);

        console.log(`🆔 ID do novo imóvel: ${newId}`);

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

        console.log('🏠 Novo imóvel criado:', newProperty);

        // =========================================================
        // 4. SALVAR LOCALMENTE
        // =========================================================
        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();
        console.log('💾 Imóvel salvo localmente');

        // =========================================================
        // 5. ATUALIZAR UI
        // =========================================================
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
            console.log('🎨 UI atualizada');
        }

        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 300);
            console.log('📋 Lista admin atualizada');
        }

        // =========================================================
        // 6. FEEDBACK AO USUÁRIO
        // =========================================================
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
        
        if (!hasMedia) {
            message += `ℹ️ Nenhuma mídia anexada\n`;
        }
        
        if (!supabaseSuccess) {
            message += `⚠️ Salvo apenas localmente (sem conexão com servidor)`;
        } else {
            message += `🌐 Salvo no servidor com ID: ${supabaseId}`;
        }

        console.log('📝 Mensagem para usuário:', message);
        alert(message);

        // =========================================================
        // 7. LIMPEZA DO SISTEMA DE MÍDIA
        // =========================================================
        setTimeout(() => {
            if (typeof MediaSystem !== 'undefined') {
                MediaSystem.resetState();
                console.log('🧹 MediaSystem resetado após criação');
            }
        }, 300);

        // =========================================================
        // 8. INVALIDAR CACHE
        // =========================================================
        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
            console.log('🗑️ Cache invalidado');
        }

        console.log('🎯 Processo de criação concluído com sucesso (VERSÃO COMPATÍVEL)');
        console.groupEnd();
        
        return newProperty;

    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao adicionar imóvel:', error);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = '❌ Erro ao cadastrar imóvel:\n';
        errorMessage += error.message || 'Erro desconhecido';
        
        if (error.message.includes('fetch')) {
            errorMessage += '\n\nPossível problema de conexão com o servidor.';
        }
        
        if (error.message.includes('storage')) {
            errorMessage += '\n\nErro no armazenamento de arquivos.';
        }
        
        if (error.message.includes('undefined')) {
            errorMessage += '\n\n⚠️ ERRO CRÍTICO: Constantes Supabase não definidas!';
            errorMessage += '\nExecute no console: console.log("SUPABASE_URL:", window.SUPABASE_URL)';
        }
        
        alert(errorMessage);
        
        console.groupEnd();
        return null;
    }
};

// ========== 8. ATUALIZAR IMÓVEL - VERSÃO COMPATÍVEL ==========
window.updateProperty = async function(id, propertyData) {
    console.log(`✏️ ATUALIZANDO IMÓVEL ${id} - VERSÃO COMPATÍVEL:`, propertyData);

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

    try {
        // ✅ 1. DADOS PARA SUPABASE
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

        // ✅✅✅ VERSÃO COMPATÍVEL: Formatar preço usando método disponível
        if (updateData.price && !updateData.price.startsWith('R$')) {
            if (SharedCore?.PriceFormatter?.formatForInput) {
                updateData.price = SharedCore.PriceFormatter.formatForInput(updateData.price);
                console.log('✅ Preço formatado via PriceFormatter para atualização');
            } else if (SharedCore?.formatPriceForInput) {
                updateData.price = SharedCore.formatPriceForInput(updateData.price);
                console.log('✅ Preço formatado via função de compatibilidade para atualização');
            } else if (window.formatPriceForInput) {
                updateData.price = window.formatPriceForInput(updateData.price);
                console.log('✅ Preço formatado via função global (legado) para atualização');
            }
        }

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

                if (response.ok) {
                    supabaseSuccess = true;
                    console.log(`✅ Imóvel ${id} atualizado no Supabase`);
                }
            } catch (error) {
                console.error('❌ Erro de conexão com Supabase:', error);
            }
        }

        // ✅ 3. ATUALIZAR LOCALMENTE
        window.properties[index] = {
            ...window.properties[index],
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

        // ✅ 6. INVALIDAR CACHE
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

        return true;

    } catch (error) {
        console.error('❌ ERRO ao atualizar imóvel:', error);
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\n${error.message}`);
        return false;
    }
};

// ========== 9. EXCLUIR IMÓVEL (MANTIDA) ==========
window.deleteProperty = async function(id) {
    console.log(`🗑️ Iniciando exclusão COMPLETA do imóvel ${id}...`);

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
    }

    // ✅ 4. Excluir localmente (sempre)
    const originalLength = window.properties.length;
    window.properties = window.properties.filter(p => p.id !== id);
    window.savePropertiesToStorage();

    // ✅ 5. Atualizar interface
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }

    // ✅ 6. Atualizar lista do admin
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
            console.log('📋 Lista do admin atualizada após exclusão');
        }, 300);
    }

    // ✅ 7. INVALIDAR CACHE
    if (window.SmartCache) {
        SmartCache.invalidatePropertiesCache();
        console.log('🗑️ Cache invalidado após excluir imóvel');
    }

    // ✅ 8. Feedback ao usuário
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\nFoi removido do servidor e não voltará a aparecer.`);
        console.log(`🎯 Imóvel ${id} excluído completamente (online + local)`);
    } else {
        const errorMessage = supabaseError ? 
            `\n\nErro no servidor: ${supabaseError.substring(0, 100)}...` : 
            '\n\nMotivo: Conexão com servidor falhou.';

        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.${errorMessage}\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
        console.log(`🎯 Imóvel ${id} excluído apenas localmente (Supabase falhou)`);
    }

    return supabaseSuccess;
};

// ========== 10. CARREGAR LISTA PARA ADMIN (MANTIDA) ==========
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

// ========== 11. SINCRONIZAÇÃO SIMPLIFICADA (MANTIDA) ==========
window.testSupabaseConnectionSimple = async function() {
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        return { connected: false, error: 'Credenciais não configuradas' };
    }
    
    try {
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: { 'apikey': window.SUPABASE_KEY, 'Authorization': `Bearer ${window.SUPABASE_KEY}` }
        });
        return { connected: response.ok, status: response.status };
    } catch (error) {
        return { connected: false, error: error.message };
    }
};

window.syncWithSupabase = async function() {
    const test = await this.testSupabaseConnectionSimple();
    if (!test.connected) {
        return { success: false, error: test.error || 'Sem conexão' };
    }
    
    try {
        const result = await window.supabaseLoadProperties?.() || 
                      await window.supabaseFetch?.('/properties?select=*&order=id.desc');
        
        if (result?.data?.length > 0) {
            // Mesclar evitando duplicatas
            const existingIds = new Set(window.properties.map(p => p.id));
            const newProperties = result.data.filter(item => !existingIds.has(item.id));
            
            if (newProperties.length > 0) {
                window.properties = [...newProperties, ...window.properties];
                window.savePropertiesToStorage();
                
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos');
                }
                
                return { success: true, count: newProperties.length };
            }
        }
        return { success: true, count: 0, message: 'Já sincronizado' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ========== 12. SISTEMA DE ESTADO SIMPLIFICADO ==========
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

// Inicializar com dados existentes
if (window.properties && window.properties.length > 0) {
    window.PropertyState.init(window.properties);
    window.properties = window.PropertyState.properties; // Manter compatibilidade
}

// ========== 13. RECUPERAÇÃO ESSENCIAL (MANTIDA) ==========
(function essentialPropertiesRecovery() {
    const isDebug = window.location.search.includes('debug=true');
    
    // Monitorar se properties foi carregado
    setTimeout(() => {
        if (!window.properties || window.properties.length === 0) {
            const stored = localStorage.getItem('weberlessa_properties');
            if (stored) {
                try {
                    window.properties = JSON.parse(stored);
                    if (isDebug) console.log(`✅ Recuperado do localStorage: ${window.properties.length} imóveis`);
                } catch (e) {}
            }
            
            // Fallback final
            if (!window.properties || window.properties.length === 0) {
                window.properties = getInitialProperties();
                if (isDebug) console.log(`✅ Usando dados iniciais: ${window.properties.length} imóveis`);
            }
            
            // Renderizar se necessário
            if (typeof window.renderProperties === 'function' && document.readyState === 'complete') {
                setTimeout(() => window.renderProperties('todos'), 300);
            }
        }
    }, 3000);
})();

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js carregado - VERSÃO COMPATÍVEL com formatação unificada');

// Função utilitária para executar tarefas em baixa prioridade
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
        console.log('🏠 DOM carregado - inicializando properties (VERSÃO COMPATÍVEL)...');

        // Inicializar propriedades em baixa prioridade
        runLowPriority(() => {
            if (typeof window.loadPropertiesData === 'function') {
                window.loadPropertiesData();
                console.log('⚙️ loadPropertiesData executada');
            }

            // Configurar filtros também em baixa prioridade
            runLowPriority(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                    console.log('⚙️ setupFilters executada');
                }
            });
        });
    });
} else {
    console.log('🏠 DOM já carregado - inicializando agora (VERSÃO COMPATÍVEL)...');

    // Inicializar direto em baixa prioridade
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

// Adicionar função de teste de upload
window.testUploadSystem = function() {
    console.group('🧪 TESTE DO SISTEMA DE UPLOAD (VERSÃO COMPATÍVEL)');
    
    // Verificar constantes
    console.log('1. Verificando constantes:');
    console.log('- SUPABASE_URL:', window.SUPABASE_URL);
    console.log('- SUPABASE_KEY:', window.SUPABASE_KEY ? '✅ Disponível' : '❌ Indisponível');
    
    // Testar MediaSystem
    console.log('2. Verificando MediaSystem:');
    console.log('- Disponível?', !!window.MediaSystem);
    
    if (window.MediaSystem) {
        console.log('- Files:', MediaSystem.state.files.length);
        console.log('- PDFs:', MediaSystem.state.pdfs.length);
        
        // Testar upload direto
        if (MediaSystem.uploadFiles) {
            console.log('3. Testando upload...');
            
            // Criar arquivo de teste
            const testBlob = new Blob(['test'], { type: 'image/jpeg' });
            const testFile = new File([testBlob], 'test_upload.jpg', { type: 'image/jpeg' });
            
            MediaSystem.uploadFiles([testFile], 'test_' + Date.now(), 'images')
                .then(urls => {
                    console.log('✅ Upload teste concluído:', urls.length > 0 ? 'SUCESSO' : 'FALHA');
                    if (urls.length > 0) {
                        console.log('🔗 URL:', urls[0].substring(0, 100) + '...');
                        alert('✅ Upload funcionou! Verifique console.');
                    } else {
                        alert('❌ Upload falhou. Verifique console.');
                    }
                })
                .catch(err => {
                    console.error('❌ Erro no upload teste:', err);
                    alert('Erro no upload: ' + err.message);
                });
        }
    }
    
    console.groupEnd();
};

// Adicionar teste de formatação de preço
window.testPriceFormatting = function() {
    console.group('🧪 TESTE DE FORMATAÇÃO DE PREÇO (VERSÃO COMPATÍVEL)');
    
    console.log('1. Verificando funções disponíveis:');
    console.log('- SharedCore.PriceFormatter:', SharedCore?.PriceFormatter ? '✅ Disponível' : '❌ Indisponível');
    console.log('- SharedCore.formatPriceForInput:', typeof SharedCore?.formatPriceForInput === 'function' ? '✅ Disponível' : '❌ Indisponível');
    console.log('- window.formatPriceForInput:', typeof window.formatPriceForInput === 'function' ? '✅ Disponível' : '❌ Indisponível');
    
    if (SharedCore?.PriceFormatter?.formatForInput) {
        console.log('2. Testando PriceFormatter:');
        const tests = [
            { input: '450000', expected: 'R$ 450.000' },
            { input: '2500', expected: 'R$ 2.500' },
            { input: 'R$ 450.000', expected: 'R$ 450.000' },
            { input: '', expected: '' },
            { input: 'abc', expected: '' }
        ];
        
        tests.forEach(test => {
            const result = SharedCore.PriceFormatter.formatForInput(test.input);
            const passed = result === test.expected;
            console.log(`   "${test.input}" → "${result}" ${passed ? '✅' : '❌'} ${passed ? '' : `(esperado: "${test.expected}")`}`);
        });
    }
    
    if (SharedCore?.formatPriceForInput) {
        console.log('3. Testando função de compatibilidade:');
        const result = SharedCore.formatPriceForInput('300000');
        console.log(`   "300000" → "${result}"`, result === 'R$ 300.000' ? '✅' : '❌');
    }
    
    console.log('4. Testando campo de preço no DOM:');
    const priceField = document.getElementById('propPrice');
    if (priceField) {
        console.log('   - Campo encontrado:', priceField.id);
        console.log('   - Valor atual:', priceField.value || '(vazio)');
        
        // Testar formatação automática
        priceField.value = '500000';
        priceField.dispatchEvent(new Event('input'));
        console.log('   - Após input "500000":', priceField.value);
        
        // Resetar
        priceField.value = '';
    } else {
        console.log('   ❌ Campo propPrice não encontrado');
    }
    
    console.groupEnd();
};

console.log('💡 Execute window.testPriceFormatting() para testar a formatação de preço');
