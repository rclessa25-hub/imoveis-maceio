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
        initialized: false
    };

    // API pública
    return {
        init(onFilterChange = null) {
            if (state.initialized) {
                console.log('⏭️ FilterManager já está inicializado, ignorando...');
                return;
            }
            
            console.log('🔧 Inicializando FilterManager...');
            
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

            if (onFilterChange && typeof onFilterChange === 'function') {
                state.callbacks.set('global', onFilterChange);
            }

            this.activateDefaultFilter();
            
            state.initialized = true;
            console.log(`✅ FilterManager inicializado: ${state.containers.size} container(s)`);
        },

        setupContainer(container, containerId, onFilterChange) {
            const buttons = container.querySelectorAll(`.${CONFIG.buttonClass}`);
            const containerState = state.containers.get(containerId);

            buttons.forEach((button, btnIndex) => {
                const newBtn = button.cloneNode(true);
                button.parentNode.replaceChild(newBtn, button);

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const filterText = newBtn.textContent.trim();
                    const filterValue = filterText === 'Todos' ? 'todos' : filterText;
                    
                    this.setActiveFilter(filterValue, containerId);
                    
                    if (onFilterChange) {
                        onFilterChange(filterValue);
                    }
                    
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

        setActiveFilter(filterValue, sourceContainerId = null) {
            state.currentFilter = filterValue;
            
            state.containers.forEach((containerState, containerId) => {
                containerState.buttons.forEach(button => {
                    const isActive = button.value === filterValue;
                    
                    button.element.classList.toggle(CONFIG.activeClass, isActive);
                    
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

        activateDefaultFilter() {
            this.setActiveFilter(CONFIG.defaultFilter);
        },

        getCurrentFilter() {
            return state.currentFilter;
        },

        onFilterChange(callback, id = 'custom') {
            if (typeof callback === 'function') {
                state.callbacks.set(id, callback);
                return true;
            }
            return false;
        },

        setupWithFallback() {
            if (state.initialized) {
                console.log('⏭️ setupWithFallback ignorado - FilterManager já inicializado');
                return true;
            }
            
            console.log('🎛️ Configurando filtros com fallback...');
            
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

        destroy() {
            state.containers.forEach(containerState => {
                containerState.buttons.forEach(button => {
                    const newBtn = button.element.cloneNode(true);
                    button.element.parentNode.replaceChild(newBtn, button.element);
                });
            });
            
            state.containers.clear();
            state.callbacks.clear();
            state.initialized = false;
            console.log('🧹 FilterManager destruído');
        },
        
        isInitialized() {
            return state.initialized;
        }
    };
})();

window.FilterManager = FilterManager;

if (!window._filterManagerInitScheduled) {
    window._filterManagerInitScheduled = true;
    
    setTimeout(() => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            if (document.querySelector('.filter-options') && !FilterManager.isInitialized()) {
                FilterManager.setupWithFallback();
            }
        }
    }, 500);
}

console.log('✅ FilterManager carregado');
