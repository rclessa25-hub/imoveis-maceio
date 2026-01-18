// js/modules/properties.js - SISTEMA COMPLETO CORRIGIDO
console.log('🏠 properties.js - Sistema Core de Propriedades');
console.log('🚀 properties.js carregado - Versão Corrigida');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;

window.initializeProperties = async function () {
    console.log('🔄 Inicializando propriedades (consolidado)...');
    
    // Estratégias de carregamento em ordem de prioridade
    const strategies = {
        supabase: async () => {
            if (window.supabaseLoadProperties) {
                const result = await window.supabaseLoadProperties();
                return result?.data?.length > 0 ? result.data : null;
            }
            return null;
        },
        
        fetch: async () => {
            if (window.supabaseFetch) {
                const result = await window.supabaseFetch('/properties?select=*');
                return result.ok && result.data?.length > 0 ? result.data : null;
            }
            return null;
        },
        
        localStorage: () => {
            const stored = localStorage.getItem('weberlessa_properties');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    return parsed.length > 0 ? parsed : null;
                } catch (e) {}
            }
            return null;
        },
        
        initial: () => getInitialProperties() // função mantida
    };

    try {
        let loadedData = null;
        
        // Tentar em ordem de prioridade
        for (const [strategyName, strategyFn] of Object.entries(strategies)) {
            console.log(`🔄 Tentando estratégia: ${strategyName}`);
            loadedData = await strategyFn();
            if (loadedData) {
                console.log(`✅ Carregado via ${strategyName}: ${loadedData.length} imóveis`);
                break;
            }
        }

        window.properties = loadedData || [];
        window.savePropertiesToStorage();

        // Cache inteligente (se disponível)
        if (window.SmartCache && window.PerformanceCache) {
            SmartCache.setWithAutoInvalidation('properties_data', window.properties, 'data', 60000);
        }

        // Renderizar imóveis
        if (typeof window.renderProperties === 'function') {
            setTimeout(() => window.renderProperties('todos'), 100);
        }

        console.log(`✅ Sistema de propriedades inicializado: ${window.properties.length} imóveis`);
        
    } catch (error) {
        console.error('❌ Erro crítico:', error);
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
        console.log('💾 Imóveis salvos no localStorage:', window.properties.length);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
};

// ========== CACHE DE TEMPLATES ==========
const propertyTemplateCache = new Map();

const generatePropertyCardHTML = (property) => {
    const cacheKey = `property_${property.id}`;
    if (propertyTemplateCache.has(cacheKey)) {
        return propertyTemplateCache.get(cacheKey);
    }

    const features = Array.isArray(property.features) ? property.features : 
                     (property.features ? property.features.split(',') : []);

    const imageUrl = property.images ? 
        property.images.split(',')[0] : 
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

    const html = `
        <div class="property-card">
            <div class="property-image" style="position: relative; height: 250px;">
                <img src="${imageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     alt="${property.title}"
                     onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                ${property.badge ? `<div class="property-badge">${property.badge}</div>` : ''}
            </div>
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

    propertyTemplateCache.set(cacheKey, html);
    return html;
};

// ========== FUNÇÃO 4: Renderizar Propriedades (Atualizada com cache) ==========
window.renderProperties = function(filter = 'todos') {
    console.log('🎨 Renderizando com filtro:', filter);
    
    const container = document.getElementById('properties-container');
    if (!container) return;
    
    // Limpar cache se mudou o filtro
    if (window.lastFilter !== filter) {
        propertyTemplateCache.clear();
        window.lastFilter = filter;
    }
    
    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: #666;">Nenhum imóvel disponível.</p>';
        return;
    }
    
    // Filtrar (lógica existente mantida)
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
    
    // Renderizar usando templates com cache
    container.innerHTML = filteredProperties.map(generatePropertyCardHTML).join('');
    
    console.log(`✅ ${filteredProperties.length} imóveis renderizados`);
};

// ========== FUNÇÃO 5: Configurar Filtros ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons || filterButtons.length === 0) {
        console.error('❌ Botões de filtro não encontrados!');
        return;
    }
    
    // Ativar "Todos" automaticamente
    const todosBtn = Array.from(filterButtons).find(btn => 
        btn.textContent.trim() === 'Todos' || btn.textContent.trim() === 'todos'
    );
    
    if (todosBtn && !todosBtn.classList.contains('active')) {
        todosBtn.classList.add('active');
    }
    
    // Configurar eventos
    filterButtons.forEach(button => {
        // Remover event listeners antigos
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
            // Remover active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar active ao clicado
            this.classList.add('active');
            
            // Obter filtro
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            console.log(`🎯 Filtrando por: ${filter}`);
            
            // Renderizar
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filter);
            }
        });
    });
    
    console.log('✅ Filtros configurados');
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
    console.log('➕ ADICIONANDO NOVO IMÓVEL COM SISTEMA UNIFICADO:', propertyData);

    // ✅ Validação básica
    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        return null;
    }

    try {
        // =========================================================
        // 1. PROCESSAR MÍDIA (IMAGENS + PDFs) VIA SISTEMA UNIFICADO
        // =========================================================
        let mediaResult = { images: '', pdfs: '' };

        if (typeof MediaSystem !== 'undefined' &&
            (MediaSystem.state.files.length > 0 || MediaSystem.state.pdfs.length > 0)) {

            console.log('📤 Processando mídia com MediaSystem (COM PREVIEW GARANTIDO)...');
            const tempId = `temp_${Date.now()}`;

            mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);

            if (mediaResult.images) {
                propertyData.images = mediaResult.images;
                console.log(`✅ ${mediaResult.images.split(',').length} URL(s) de imagem obtidas`);
            }
            if (mediaResult.pdfs) {
                propertyData.pdfs = mediaResult.pdfs;
                console.log(`✅ ${mediaResult.pdfs.split(',').length} URL(s) de PDF obtidas`);
            }
            
            // ✅ FORÇAR ATUALIZAÇÃO DO PREVIEW IMEDIATAMENTE
            setTimeout(() => {
                if (MediaSystem && typeof MediaSystem.updateUI === 'function') {
                    MediaSystem.updateUI();
                    console.log('🔄 Preview atualizado após upload');
                }
            }, 500);
        } else {
            console.log('ℹ️ Nenhuma mídia selecionada para este imóvel');
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

                console.log('📤 Enviando imóvel ao Supabase:', supabaseData);
                const result = await window.supabaseSaveProperty(supabaseData);

                if (result && result.success) {
                    supabaseSuccess = true;
                    supabaseId = result.data?.id;
                    console.log(`✅ Imóvel salvo no Supabase com ID ${supabaseId}`);
                }
            } catch (error) {
                console.error('❌ Erro ao salvar no Supabase:', error);
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

        return newProperty;

    } catch (error) {
        console.error('❌ Erro crítico ao adicionar imóvel:', error);
        alert('❌ Erro ao cadastrar imóvel: ' + error.message);
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
    console.log('🧹 PDFs limpos no cancelamento');
};

// Função para verificar se há PDFs pendentes
window.hasPendingPdfs = function() {
    return window.selectedPdfFiles && window.selectedPdfFiles.length > 0;
};

// ========== DEBUG AVANÇADO: CHECKBOX "TEM VÍDEO" ==========
window.debugHasVideoIssue = function(propertyId) {
    console.group('🔍 DEBUG AVANÇADO: CHECKBOX TEM VÍDEO');
    
    const property = window.properties.find(p => p.id == propertyId);
    const checkbox = document.getElementById('propHasVideo');
    
    console.log('📊 ESTADO ATUAL:');
    console.log('- Checkbox marcado:', checkbox?.checked);
    console.log('- Valor na propriedade original:', property?.has_video);
    console.log('- Tipo na propriedade:', typeof property?.has_video);
    
    // Forçar atualização do estado
    if (property) {
        property.has_video = checkbox?.checked || false;
        console.log('🔄 Estado forçado para:', property.has_video);
        window.savePropertiesToStorage();
    }
    
    console.groupEnd();
};

// ========== FUNÇÃO 9: ATUALIZAR IMÓVEL (VERSÃO ROBUSTA COM SUPABASE E CACHE INTELIGENTE) ==========
window.updateProperty = async function(id, propertyData) {
    console.log(`✏️ ATUALIZANDO IMÓVEL ${id}:`, propertyData);

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

    const property = window.properties[index];
    console.log(`✅ Imóvel encontrado: "${property.title}"`);

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

        console.log('📤 Dados para Supabase:', updateData);

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

                console.log('📊 Status do Supabase:', response.status);

                if (response.ok) {
                    supabaseSuccess = true;
                    console.log(`✅ Imóvel ${id} atualizado no Supabase`);
                } else {
                    const errorText = await response.text();
                    console.error('❌ Erro no Supabase:', errorText);
                }
            } catch (error) {
                console.error('❌ Erro de conexão com Supabase:', error);
            }
        }

        // ✅ 3. ATUALIZAR LOCALMENTE
        window.properties[index] = {
            ...property,
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

        // ✅ 6. INVALIDAR CACHE INTELIGENTE
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

        // ✅ 8. ATUALIZAR PREVIEWS APÓS SUCESSO
        if (typeof MediaSystem !== 'undefined' && MediaSystem.state) {
            // Forçar atualização do preview com URLs permanentes
            setTimeout(() => {
                MediaSystem.updateUI();
                console.log('🔄 Previews visuais atualizados após salvamento');
            }, 300);
        }

        return true;

    } catch (error) {
        console.error('❌ ERRO ao atualizar imóvel:', error);
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\n${error.message}`);
        return false;
    }
};

// ========== FUNÇÃO 10: EXCLUIR IMÓVEL (COM SUPABASE E CACHE INTELIGENTE) ==========
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

            console.log('📊 Status da exclusão no Supabase:', response.status);

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
    } else {
        console.log('⚠️ Credenciais Supabase não disponíveis');
    }

    // ✅ 4. Excluir localmente (sempre)
    const originalLength = window.properties.length;
    window.properties = window.properties.filter(p => p.id !== id);
    const newLength = window.properties.length;
    if (originalLength !== newLength) {
        console.log(`💾 Imóvel ${id} excluído localmente`);
    } else {
        console.log('⚠️ Imóvel não encontrado localmente após tentativa de exclusão');
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
            console.log('📋 Lista do admin atualizada após exclusão');
        }, 300);
    }

    // ✅ 8. INVALIDAR CACHE INTELIGENTE
    if (window.SmartCache) {
        SmartCache.invalidatePropertiesCache();
        console.log('🗑️ Cache invalidado após excluir imóvel');
    }

    // ✅ 9. Feedback ao usuário
    if (supabaseSuccess) {
        alert(`✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\nFoi removido do servidor e não voltará a aparecer.`);
        console.log(`🎯 Imóvel ${id} excluído completamente (online + local)`);

        // ✅ 10. Excluir PDFs relacionados (opcional)
        if (property.pdfs && property.pdfs !== '' && property.pdfs !== 'EMPTY') {
            console.log(`🗑️ Excluindo ${property.pdfs.split(',').length} PDF(s) do storage...`);
            if (typeof window.deletePdfFromSupabaseStorage === 'function') {
                const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
                pdfUrls.forEach(url => {
                    window.deletePdfFromSupabaseStorage(url).then(success => {
                        console.log(success ? `✅ PDF excluído: ${url}` : `❌ Falha ao excluir: ${url}`);
                    });
                });
            }
        }
    } else {
        const errorMessage = supabaseError ? 
            `\n\nErro no servidor: ${supabaseError.substring(0, 100)}...` : 
            '\n\nMotivo: Conexão com servidor falhou.';

        alert(`⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.${errorMessage}\n\nO imóvel ainda existe no servidor e reaparecerá ao sincronizar.`);
        console.log(`🎯 Imóvel ${id} excluído apenas localmente (Supabase falhou)`);
    }

    return supabaseSuccess;
};

// ========== FUNÇÃO 11: Carregar Lista para Admin ==========
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

// ========== FUNÇÃO 12: Sincronização com Supabase (SIMPLIFICADA) ==========
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

// ========== FUNÇÃO 13: Teste Simples de Conexão (SIMPLIFICADA) ==========
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

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js carregado com 13 funções principais');

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
        console.log('🏠 DOM carregado - inicializando properties...');

        // Inicializar propriedades em baixa prioridade
        runLowPriority(() => {
            if (typeof window.initializeProperties === 'function') {
                window.initializeProperties();
                console.log('⚙️ initializeProperties executada');
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
    console.log('🏠 DOM já carregado - inicializando agora...');

    // Inicializar direto em baixa prioridade
    runLowPriority(() => {
        if (typeof window.initializeProperties === 'function') {
            window.initializeProperties();
            console.log('⚙️ initializeProperties executada');
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

// ========== RECUPERAÇÃO DE EMERGÊNCIA ==========
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
