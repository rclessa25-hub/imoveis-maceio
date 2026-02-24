// js/modules/utils/FilterManager.js - Sistema unificado de filtros
console.log('🎛️ FilterManager.js carregado - Sistema unificado de filtros');

const FilterManager = (function() {
    // Configuração centralizada
    const CONFIG = {
        containerClass: 'filter-options',
        buttonClass: 'filter-btn',
        activeClass: 'active',
        defaultFilter: 'todos',
        animationDuration: 200
    };

    // Estado global dos filtros
    const state = {
        currentFilter: CONFIG.defaultFilter,
        containers: new Map(),
        callbacks: new Map(),
        initialized: false // Flag para evitar múltiplas inicializações
    };

    // API pública
    return {
        /**
         * Inicializa todos os filtros na página
         * @param {Function} onFilterChange - Callback quando filtro muda
         */
        init(onFilterChange = null) {
            // Verificar se já foi inicializado
            if (state.initialized) {
                console.log('⏭️ FilterManager já está inicializado, ignorando...');
                return;
            }
            
            console.log('🔧 Inicializando FilterManager...');
            
            // Encontrar todos os containers de filtro
            const containers = document.querySelectorAll(`.${CONFIG.containerClass}`);
            if (containers.length === 0) {
                console.warn('⚠️ Nenhum container de filtros encontrado');
                return;
            }

            containers.forEach((container, index) => {
                const containerId = `filter-container-${index}`;
                state.containers.set(containerId, {
                    element: container,
                    buttons: []
                });

                this.setupContainer(container, containerId, onFilterChange);
            });

            // Registrar callback se fornecido
            if (onFilterChange && typeof onFilterChange === 'function') {
                state.callbacks.set('global', onFilterChange);
            }

            // Ativar filtro padrão
            this.activateDefaultFilter();
            
            state.initialized = true; // Marcar como inicializado
            console.log(`✅ FilterManager inicializado: ${state.containers.size} container(s)`);
        },

        /**
         * Configura um container específico de filtros
         */
        setupContainer(container, containerId, onFilterChange) {
            const buttons = container.querySelectorAll(`.${CONFIG.buttonClass}`);
            const containerState = state.containers.get(containerId);

            buttons.forEach((button, btnIndex) => {
                // Clonar para remover listeners antigos
                const newBtn = button.cloneNode(true);
                button.parentNode.replaceChild(newBtn, button);

                // Configurar evento
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const filterText = newBtn.textContent.trim();
                    const filterValue = filterText === 'Todos' ? 'todos' : filterText;
                    
                    // Atualizar todos os containers
                    this.setActiveFilter(filterValue, containerId);
                    
                    // Executar callback
                    if (onFilterChange) {
                        onFilterChange(filterValue);
                    }
                    
                    // Executar callbacks globais
                    state.callbacks.forEach(callback => {
                        if (typeof callback === 'function') {
                            callback(filterValue);
                        }
                    });
                });

                containerState.buttons.push({
                    element: newBtn,
                    originalText: newBtn.textContent.trim(),
                    value: newBtn.textContent.trim() === 'Todos' ? 'todos' : newBtn.textContent.trim()
                });
            });

            state.containers.set(containerId, containerState);
        },

        /**
         * Define o filtro ativo em todos os containers
         */
        setActiveFilter(filterValue, sourceContainerId = null) {
            state.currentFilter = filterValue;
            
            state.containers.forEach((containerState, containerId) => {
                containerState.buttons.forEach(button => {
                    const isActive = button.value === filterValue;
                    
                    // Atualizar classes CSS
                    button.element.classList.toggle(CONFIG.activeClass, isActive);
                    
                    // Aplicar estilos visuais
                    if (isActive) {
                        button.element.style.backgroundColor = 'var(--primary)';
                        button.element.style.color = 'white';
                        button.element.style.borderColor = 'var(--primary)';
                        button.element.style.fontWeight = '700';
                        button.element.style.boxShadow = '0 4px 12px rgba(26, 82, 118, 0.3)';
                    } else {
                        button.element.style.backgroundColor = '';
                        button.element.style.color = '';
                        button.element.style.borderColor = '';
                        button.element.style.fontWeight = '';
                        button.element.style.boxShadow = '';
                    }
                });
            });

            console.log(`🎯 Filtro alterado para: ${filterValue}`);
        },

        /**
         * Ativa o filtro padrão (Todos)
         */
        activateDefaultFilter() {
            this.setActiveFilter(CONFIG.defaultFilter);
        },

        /**
         * Retorna o filtro atual
         */
        getCurrentFilter() {
            return state.currentFilter;
        },

        /**
         * Registra um callback para mudanças de filtro
         */
        onFilterChange(callback, id = 'custom') {
            if (typeof callback === 'function') {
                state.callbacks.set(id, callback);
                return true;
            }
            return false;
        },

        /**
         * Configura filtros com fallback automático
         */
        setupWithFallback() {
            // Verificar se já foi inicializado
            if (state.initialized) {
                console.log('⏭️ setupWithFallback ignorado - FilterManager já inicializado');
                return true;
            }
            
            console.log('🎛️ Configurando filtros com fallback...');
            
            // Usar sistema unificado se disponível
            if (this.init) {
                this.init((filterValue) => {
                    window.currentFilter = filterValue;
                    if (typeof window.renderProperties === 'function') {
                        window.renderProperties(filterValue);
                    }
                });
                console.log('✅ Filtros configurados via FilterManager');
                return true;
            }
            
            return false;
        },

        /**
         * Destroi todos os listeners (limpeza)
         */
        destroy() {
            state.containers.forEach(containerState => {
                containerState.buttons.forEach(button => {
                    const newBtn = button.element.cloneNode(true);
                    button.element.parentNode.replaceChild(newBtn, button.element);
                });
            });
            
            state.containers.clear();
            state.callbacks.clear();
            state.initialized = false; // Resetar flag
            console.log('🧹 FilterManager destruído');
        },
        
        /**
         * Verifica se o FilterManager já foi inicializado
         */
        isInitialized() {
            return state.initialized;
        }
    };
})();

// Exportar para escopo global
window.FilterManager = FilterManager;

// Inicialização automática com compatibilidade - EXECUTAR APENAS UMA VEZ
if (!window._filterManagerInitScheduled) {
    window._filterManagerInitScheduled = true;
    
    setTimeout(() => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // Inicializar apenas se existirem filtros na página e ainda não foi inicializado
            if (document.querySelector('.filter-options') && !FilterManager.isInitialized()) {
                FilterManager.setupWithFallback();
            }
        }
    }, 500);
}

console.log('✅ FilterManager carregado');
