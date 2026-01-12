// js/modules/properties/properties-core.js
console.log('🏠 properties-core.js carregado - Sistema Core de Imóveis (Módulo 1/6)');

/**
 * MÓDULO CORE DO SISTEMA DE PROPRIEDADES
 * Responsabilidade: Gerenciar as variáveis globais e inicialização básica.
 * Dependências: SharedCore para supabaseFetch.
 */

// 1. VARIÁVEIS GLOBAIS ESSENCIAIS (Compatibilidade com sistema existente)
if (typeof window.properties === 'undefined') window.properties = [];
if (typeof window.editingPropertyId === 'undefined') window.editingPropertyId = null;

// 2. FUNÇÃO DE INICIALIZAÇÃO BÁSICA (Versão simplificada que redireciona para a função principal)
window.initializeProperties = async function() {
    console.log('🔄 [properties-core] initializeProperties() chamada - Redirecionando para função principal');
    
    // Verificar se a função principal já está carregada
    if (typeof window.initializePropertiesFull === 'function') {
        console.log('✅ Função principal encontrada, delegando...');
        return await window.initializePropertiesFull();
    }
    
    // Se não encontrar a função principal, carregar dados básicos
    console.warn('⚠️  Função principal não encontrada, carregando fallback...');
    
    // Fallback básico: carregar do localStorage
    try {
        const stored = localStorage.getItem('weberlessa_properties');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                window.properties = parsed;
                console.log(`✅ ${parsed.length} imóveis carregados do localStorage (fallback)`);
                return parsed;
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar fallback:', error);
    }
    
    // Dados iniciais de emergência
    window.properties = getInitialProperties();
    console.log(`✅ ${window.properties.length} imóveis carregados (dados iniciais)`);
    return window.properties;
};

// 3. FUNÇÃO DE DADOS INICIAIS (mantida para compatibilidade)
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

// 4. ADICIONAR: Verificar se precisa carregar funções do SharedCore
window.checkSharedCoreDependencies = function() {
    console.log('🔍 Verificando dependências do SharedCore...');
    
    const dependencies = {
        'supabaseFetch': typeof window.SharedCore?.supabaseFetch === 'function',
        'debounce': typeof window.SharedCore?.debounce === 'function',
        'throttle': typeof window.SharedCore?.throttle === 'function',
        'formatPrice': typeof window.SharedCore?.formatPrice === 'function'
    };
    
    console.log('📊 Status das dependências:', dependencies);
    
    const missing = Object.entries(dependencies)
        .filter(([name, exists]) => !exists)
        .map(([name]) => name);
    
    if (missing.length > 0) {
        console.warn(`⚠️  Funções do SharedCore faltando: ${missing.join(', ')}`);
        return false;
    }
    
    console.log('✅ Todas as dependências do SharedCore estão disponíveis');
    return true;
};

// 5. LOG DE SUCESSO
console.log('✅ properties-core.js inicializado. Variáveis globais definidas.');
console.log('📌 Integrado com SharedCore para supabaseFetch e outras funções utilitárias.');

// 6. Inicializar verificação de dependências após carregamento
setTimeout(() => {
    if (typeof window.SharedCore !== 'undefined') {
        window.checkSharedCoreDependencies();
    } else {
        console.warn('⚠️  SharedCore não foi carregado ainda. O sistema pode precisar dele para algumas funcionalidades.');
    }
}, 1000);
