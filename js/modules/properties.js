// js/modules/properties.js - Sistema principal de imóveis
console.log('🚀 properties.js carregado');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;
window.selectedFiles = [];
window.selectedPdfFiles = [];

// ========== FUNÇÕES DO SISTEMA DE IMÓVEIS ==========

// ========== FUNÇÃO 1: getInitialProperties() ==========
window.getInitialProperties = function() {
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
            images: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
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
            images: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        }
    ];
};

console.log('✅ getInitialProperties() carregada');

// ========== CORREÇÃO DO DEBUG DOS DADOS ==========
// ========== FUNÇÃO 2: debugPropertyData() ==========
window.debugPropertyData = function() {
    console.log('🐛 DEBUG - Dados dos Imóveis:');
    window.properties.forEach((property, index) => {
        console.log(`--- Imóvel ${index + 1} ---`);
        console.log('Título:', property.title);
        console.log('ID:', property.id);
        console.log('PDFs:', property.pdfs);
        console.log('Tipo de PDFs:', typeof property.pdfs);
        console.log('Tem PDFs?', property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '');
        console.log('---------------');
    });
};

// ========== FUNÇÃO 3: checkPdfData() ==========
window.checkPdfData = function() {
    console.log('🔍 Verificando dados dos PDFs...');
    window.properties.forEach((property, index) => {
        console.log(`Imóvel ${index + 1}: ${property.title}`);
        console.log(`PDFs:`, property.pdfs);
        console.log(`Tem PDFs:`, property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '');
    });
};

// ========== FUNÇÃO 4: contactAgent() ==========
window.contactAgent = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (property) {
        const message = `Olá! Tenho interesse no imóvel: ${property.title} - ${property.price}`;
        const whatsappURL = `https://wa.me/5582996044513?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }
};

// ========== FUNÇÃO 5: viewProperty() ==========
window.viewProperty = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (property) {
        alert(`🏠 ${property.title}\n\n💰 ${property.price}\n📍 ${property.location}\n\n${property.description}`);
    }
};

console.log('✅ properties.js com 5 funções carregadas');

// ========== FUNÇÃO 6: setupFilters() ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Obter o texto do filtro
            const filterText = this.textContent.trim();
            const filter = filterText === 'Todos' ? 'todos' : filterText;
            
            console.log(`🎯 Filtrando por: ${filter}`);
            if (typeof window.renderProperties === 'function') {
                window.renderProperties(filter);
            } else {
                console.error('❌ renderProperties() não disponível');
            }
        });
    });
};

console.log('🚀 Weber Lessa Imóveis - Sistema Iniciado');

// ========== FUNÇÃO 7: loadPropertyList() ==========
window.loadPropertyList = function() {
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    container.innerHTML = '';
    if (countElement) countElement.textContent = window.properties.length;
    
    if (window.properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum imóvel cadastrado.</p>';
        return;
    }
    
    window.properties.forEach(property => {
        const features = Array.isArray(property.features)   
            ? property.features 
            : (property.features ? property.features.split(',') : []);
            
        const item = document.createElement('div');
        item.className = 'property-item';
        item.innerHTML = `
            <div style="flex: 1;">
                <strong style="color: var(--primary);">${property.title}</strong><br>
                <small>${property.price} - ${property.location}</small>
                <div style="margin-top: 0.5rem;">
                    ${features.map(f => 
                        `<span style="background: var(--accent); color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.8rem; margin-right: 0.3rem; display: inline-block; margin-bottom: 0.3rem;">${f.trim()}</span>`
                    ).join('')}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProperty(${property.id})" style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
};

// ========== SALVAR NO LOCALSTORAGE ==========
// ========== FUNÇÃO 8: saveToLocalStorage() ==========
window.saveToLocalStorage = function(propertyData) {
    try {
        console.log('💾 Salvando no localStorage...');
        
        // Se estiver editando, atualizar o imóvel existente
        if (window.editingPropertyId) {
            const index = window.properties.findIndex(p => p.id === window.editingPropertyId);
            if (index !== -1) {
                // Manter o ID original e adicionar URLs das imagens
                propertyData.id = window.editingPropertyId;
                if (window.selectedFiles.length > 0) {
                    // Em modo local, usar URLs de imagens de exemplo
                    propertyData.images = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
                }
                window.properties[index] = { ...window.properties[index], ...propertyData };
            }
        } else {
            // Novo imóvel
            const newId = window.properties.length > 0 ? Math.max(...window.properties.map(p => p.id)) + 1 : 1;
            const newProperty = {
                id: newId,
                ...propertyData,
                images: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
            };
            window.properties.push(newProperty);
        }
        
        localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        if (typeof window.renderProperties === 'function') {
            window.renderProperties();
        }
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        console.log('✅ Salvo no localStorage com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
};

console.log('✅ properties.js com 8 funções carregadas');

// ========== FUNÇÃO 9: initializeProperties() ==========
window.initializeProperties = async function() {
    console.log('🔍 Inicializando sistema de imóveis...');
    
    // Primeiro tentar carregar do Supabase
    let loadedFromSupabase = false;
    
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            console.log('📡 Tentando carregar do Supabase...');
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${data.length} imóveis carregados do Supabase`);
                window.properties = Array.isArray(data) ? data : [];
                loadedFromSupabase = true;
                
                // Salvar no localStorage como backup
                localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
            } else {
                console.log('⚠️ Supabase não disponível, usando localStorage...');
            }
        } catch (error) {
            console.log('⚠️ Erro ao acessar Supabase:', error.message);
        }
    }
    
    // Se não carregou do Supabase, tentar localStorage
    if (!loadedFromSupabase) {
        const localData = localStorage.getItem('weberlessa_properties');
        if (localData) {
            try {
                window.properties = JSON.parse(localData);
                console.log(`📁 ${window.properties.length} imóveis carregados do localStorage`);
            } catch (error) {
                console.log('⚠️ Erro ao carregar do localStorage:', error);
                window.properties = window.getInitialProperties();
            }
        } else {
            // Usar dados iniciais
            window.properties = window.getInitialProperties();
            console.log(`🎯 ${window.properties.length} imóveis de exemplo carregados`);
            
            // Salvar no localStorage para referência futura
            localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        }
    }
    
    // DEBUG: Mostrar quantos imóveis carregados
    console.log(`📊 Total de imóveis carregados: ${window.properties.length}`);
    
    // Renderizar os imóveis
    if (typeof window.renderProperties === 'function') {
        window.renderProperties();
    } else {
        console.error('❌ renderProperties() não disponível ainda');
        // Forçar renderização básica
        setTimeout(() => {
            if (typeof window.renderProperties === 'function') {
                window.renderProperties();
            }
        }, 100);
    }
    
    // Configurar filtros se disponível
    if (typeof window.setupFilters === 'function') {
        setTimeout(() => {
            window.setupFilters();
        }, 200);
    }
    
    // Configurar admin se disponível
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
        }, 300);
    }
    
    console.log('✅ Sistema de imóveis inicializado com sucesso!');
    return window.properties;
};

// ========== FUNÇÃO 10: renderProperties() ==========
window.renderProperties = function(filter = 'todos') {
    console.log('🎨 renderProperties() chamada com filtro:', filter);
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container de propriedades não encontrado!');
        return;
    }
    
    container.innerHTML = '';
    
    // Filtrar imóveis
    let filteredProperties = window.properties || [];
    if (filter !== 'todos') {
        filteredProperties = filteredProperties.filter(p => {
            if (filter === 'Residencial') return p.type === 'residencial';
            if (filter === 'Comercial') return p.type === 'comercial';
            if (filter === 'Rural') return p.type === 'rural';
            if (filter === 'Minha Casa Minha Vida') return p.badge === 'MCMV';
            return true;
        });
    }
    
    if (filteredProperties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum imóvel encontrado para este filtro.</p>';
        return;
    }
    
    console.log(`🎨 Renderizando ${filteredProperties.length} imóveis...`);
    
    // Usar createPropertyGallery() se disponível (do gallery.js)
    const useGallery = typeof window.createPropertyGallery === 'function';
    
    filteredProperties.forEach(property => {
        const features = Array.isArray(property.features) ? property.features : 
                        (property.features ? property.features.split(',') : []);
        
        // Gerar HTML da galeria/imagem
        let propertyImageHTML = '';
        if (useGallery) {
            propertyImageHTML = window.createPropertyGallery(property);
        } else {
            // Fallback simples
            const firstImage = property.images ? property.images.split(',')[0] : 
                             'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
            
            propertyImageHTML = `
                <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                    <img src="${firstImage}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="${property.title}"
                         onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                    ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                    ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                </div>
            `;
        }
        
        const card = `
            <div class="property-card">
                ${propertyImageHTML}
                <div class="property-content">
                    <div class="property-price">${property.price}</div>
                    <h3 class="property-title">${property.title}</h3>
                    <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</div>
                    <p>${property.description}</p>
                    <div class="property-features">
                        ${features.map(f => `<span class="feature-tag ${property.rural ? 'rural-tag' : ''}">${f.trim()}</span>`).join('')}
                    </div>
                    <button class="contact-btn" onclick="contactAgent(${property.id})">
                        <i class="fab fa-whatsapp"></i> Entrar em Contato
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
    
    console.log('✅ Imóveis renderizados com sucesso');
};

console.log('✅ properties.js com 10 funções carregadas (complete)');

// ========== FUNÇÕES DO FORMULÁRIO ADMIN ==========
// ========== FUNÇÕES ADMIN BÁSICAS ==========

window.setupForm = function() {
    console.log('📝 Configurando formulário admin...');
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.error('❌ Formulário admin não encontrado!');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const propertyData = {
            title: document.getElementById('propTitle').value,
            price: document.getElementById('propPrice').value,
            location: document.getElementById('propLocation').value,
            description: document.getElementById('propDescription').value,
            features: document.getElementById('propFeatures').value.split(',').map(f => f.trim()).filter(f => f !== ''),
            type: document.getElementById('propType').value,
            has_video: document.getElementById('propHasVideo').checked,
            badge: document.getElementById('propBadge').value,
            rural: document.getElementById('propType').value === 'rural',
            created_at: new Date().toISOString()
        };

        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            alert('❌ Preencha Título, Preço e Localização!');
            return;
        }

        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        try {
            const success = await window.saveToLocalStorage(propertyData);
            
            if (success) {
                alert("✅ Imóvel salvo com sucesso!");
            } else {
                alert("❌ Erro ao salvar o imóvel!");
            }

            this.reset();
            if (typeof window.cancelEdit === 'function') {
                window.cancelEdit();
            }

        } catch (error) {
            alert("❌ Erro: " + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    console.log('✅ Formulário admin configurado');
};

// ========== FUNÇÕES UPLOAD ==========

window.setupUploadSystem = function() {
    console.log('📸 Configurando sistema de upload...');
    // Implementação básica
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        console.log('✅ Upload básico configurado');
    }
};

window.setupPdfUploadSystem = function() {
    console.log('📄 Configurando upload de PDFs...');
    // Implementação básica
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    
    if (pdfUploadArea && pdfFileInput) {
        pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
        console.log('✅ Upload PDF básico configurado');
    }
};

// ========== FUNÇÕES PDF ==========

window.showPdfModal = function(propertyId) {
    console.log('📄 Abrindo modal PDF para imóvel:', propertyId);
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closePdfModal = function() {
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.accessPdfDocuments = function() {
    const password = document.getElementById('pdfPassword')?.value;
    if (password === window.PDF_PASSWORD) {
        alert('✅ Documentos acessados!');
        closePdfModal();
    } else {
        alert('❌ Senha incorreta!');
    }
};

console.log('✅ properties.js com funções admin completas');

// ========== FUNÇÃO 11: editProperty() ==========
window.editProperty = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) return;
    
    window.editingPropertyId = id;
    
    // Preencher formulário básico
    document.getElementById('propTitle').value = property.title || '';
    document.getElementById('propPrice').value = property.price || '';
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDescription').value = property.description || '';
    
    alert("Imóvel carregado para edição! Modifique os campos e clique em 'Atualizar Imóvel' para salvar.");
};

// ========== FUNÇÃO 12: deleteProperty() ==========
window.deleteProperty = function(id) {
    if (!confirm('Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const index = window.properties.findIndex(p => p.id === id);
    if (index !== -1) {
        window.properties.splice(index, 1);
        
        // Atualizar localStorage
        localStorage.setItem('weberlessa_properties', JSON.stringify(window.properties));
        
        // Recarregar lista
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        
        // Re-renderizar
        if (typeof window.renderProperties === 'function') {
            window.renderProperties();
        }
        
        alert('✅ Imóvel excluído com sucesso!');
    }
};

console.log('✅ properties.js com 12 funções carregadas (admin básico)');
