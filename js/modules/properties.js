// js/modules/properties.js - Sistema principal de imóveis
console.log('🚀 properties.js carregado');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;
window.selectedFiles = [];
window.selectedPdfFiles = [];

// ========== FUNÇÕES DO SISTEMA DE IMÓVEIS ==========
// (As funções serão adicionadas aqui)
// Dados iniciais com IMAGENS de exemplo
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
========== FUNÇÃO 2: debugPropertyData() ==========
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
