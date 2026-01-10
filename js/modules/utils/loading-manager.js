// js/modules/utils/loading-manager.js
/**
 * SISTEMA DE LOADING VISUAL REUTILIZÁVEL
 * Responsabilidade única: Gerenciar overlay de loading visual
 * Dependências: Nenhuma (puro JavaScript)
 */

const LoadingManager = (function() {
    // Configuração padrão - pode ser sobrescrita
    const DEFAULT_CONFIG = {
        containerId: 'globalLoadingOverlay',
        minShowTime: 800,
        fadeDuration: 300,
        zIndex: 99999,
        spinnerColor: '#1a5276', // var(--primary) como valor concreto
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        animationDuration: '1s'
    };

    let currentConfig = {...DEFAULT_CONFIG};
    let activeInstance = null;
    let progressInterval = null;

    // Funções privadas
    function createOverlay(config) {
        removeExistingOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = config.containerId;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${config.backgroundColor};
            z-index: ${config.zIndex};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
            transition: opacity ${config.fadeDuration}ms ease;
        `;

        overlay.innerHTML = generateLoadingHTML(config);
        document.body.appendChild(overlay);
        
        // Adicionar estilos CSS uma única vez
        if (!document.getElementById('loadingManagerStyles')) {
            addStyles();
        }
        
        return overlay;
    }

    function generateLoadingHTML(config) {
        return `
            <div class="loading-manager-content" style="
                text-align: center;
                max-width: 500px;
                padding: 2rem;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                border: 2px solid ${config.spinnerColor};
            ">
                <div class="loading-spinner" style="
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 1.5rem;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid ${config.spinnerColor};
                    border-radius: 50%;
                    animation: loadingSpin ${config.animationDuration} linear infinite;
                "></div>
                
                <h3 id="loadingManagerTitle" style="
                    color: ${config.spinnerColor}; 
                    margin: 0 0 0.5rem 0;
                ">
                    Processando...
                </h3>
                
                <p id="loadingManagerMessage" style="
                    color: #666; 
                    margin: 0 0 1.5rem 0;
                ">
                    Por favor, aguarde...
                </p>
                
                <div style="
                    width: 100%;
                    height: 6px;
                    background: #f0f0f0;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 1rem;
                ">
                    <div id="loadingManagerProgress" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, 
                            ${config.spinnerColor}, 
                            #3498db);
                        transition: width 0.5s ease;
                        border-radius: 3px;
                    "></div>
                </div>
                
                <div id="loadingManagerSteps" style="
                    font-size: 0.85rem;
                    color: #888;
                    text-align: left;
                    margin-top: 1rem;
                    padding: 0.5rem;
                    background: #f9f9f9;
                    border-radius: 5px;
                ">
                    <!-- Etapas serão injetadas dinamicamente -->
                </div>
            </div>
        `;
    }

    function addStyles() {
        const style = document.createElement('style');
        style.id = 'loadingManagerStyles';
        style.textContent = `
            @keyframes loadingSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .loading-step {
                transition: all 0.3s ease;
                margin-bottom: 0.3rem;
            }
            
            .loading-step-completed {
                color: #27ae60 !important;
            }
            
            .loading-step-active {
                color: #1a5276 !important;
                font-weight: 600;
                animation: pulse 1.5s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    function removeExistingOverlay() {
        const existing = document.getElementById(currentConfig.containerId);
        if (existing && existing.parentNode) {
            existing.style.opacity = '0';
            setTimeout(() => {
                if (existing.parentNode) {
                    existing.parentNode.removeChild(existing);
                }
            }, currentConfig.fadeDuration);
        }
    }

    function startProgressAnimation() {
        if (progressInterval) clearInterval(progressInterval);
        
        const progressBar = document.getElementById('loadingManagerProgress');
        if (!progressBar) return;
        
        let progress = 0;
        progressInterval = setInterval(() => {
            if (progress >= 80) {
                clearInterval(progressInterval);
                return;
            }
            
            progress += Math.random() * 3 + 1;
            if (progress > 80) progress = 80;
            progressBar.style.width = `${progress}%`;
        }, 200);
    }

    // API Pública
    return {
        /**
         * Configurar opções do loading
         * @param {Object} options - Opções de configuração
         */
        config(options = {}) {
            currentConfig = {...DEFAULT_CONFIG, ...options};
            return this;
        },

        /**
         * Mostrar overlay de loading
         * @param {string} title - Título do loading
         * @param {string} message - Mensagem descritiva
         * @param {Array} steps - Etapas do processo (opcional)
         * @returns {Object} Controles do loading
         */
        show(title = 'Processando...', message = 'Aguarde enquanto concluímos esta operação.', steps = []) {
            console.log('🔄 LoadingManager: Exibindo overlay...');
            
            const overlay = createOverlay(currentConfig);
            const startTime = Date.now();
            
            // Atualizar conteúdo
            const titleEl = document.getElementById('loadingManagerTitle');
            const messageEl = document.getElementById('loadingManagerMessage');
            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.textContent = message;
            
            // Configurar etapas se fornecidas
            if (steps.length > 0) {
                const stepsContainer = document.getElementById('loadingManagerSteps');
                if (stepsContainer) {
                    stepsContainer.innerHTML = steps.map((step, index) => `
                        <div class="loading-step" id="loadingStep${index}">
                            <span style="color: #ccc;">⏳</span> ${step}
                        </div>
                    `).join('');
                }
            }
            
            // Iniciar animações
            startProgressAnimation();
            
            activeInstance = {
                overlay,
                startTime,
                currentStep: 0,
                totalSteps: steps.length,
                
                // Métodos de controle
                updateTitle: (newTitle) => {
                    const el = document.getElementById('loadingManagerTitle');
                    if (el) el.textContent = newTitle;
                },
                
                updateMessage: (newMessage) => {
                    const el = document.getElementById('loadingManagerMessage');
                    if (el) el.textContent = newMessage;
                },
                
                updateProgress: (percent) => {
                    const progressBar = document.getElementById('loadingManagerProgress');
                    if (progressBar) {
                        progressBar.style.width = `${Math.min(100, percent)}%`;
                    }
                },
                
                completeStep: (stepIndex = null) => {
                    const targetIndex = stepIndex !== null ? stepIndex : this.currentStep;
                    const stepEl = document.getElementById(`loadingStep${targetIndex}`);
                    if (stepEl) {
                        stepEl.innerHTML = stepEl.innerHTML.replace('⏳', '✓');
                        stepEl.classList.add('loading-step-completed');
                        stepEl.classList.remove('loading-step-active');
                    }
                    this.currentStep++;
                },
                
                setStepActive: (stepIndex) => {
                    const stepEl = document.getElementById(`loadingStep${stepIndex}`);
                    if (stepEl) {
                        stepEl.innerHTML = stepEl.innerHTML.replace('✓', '⏳');
                        stepEl.classList.add('loading-step-active');
                        stepEl.classList.remove('loading-step-completed');
                    }
                },
                
                hide: () => this.hide(startTime, true)
            };
            
            return activeInstance;
        },

        /**
         * Esconder overlay de loading
         * @param {number} startTime - Timestamp de início (opcional)
         * @param {boolean} forceImmediate - Forçar fechamento imediato (opcional)
         */
        hide(startTime = null, forceImmediate = false) {
            console.log('✅ LoadingManager: Ocultando overlay...');
            
            // Parar animação de progresso
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            
            // Completar barra de progresso
            const progressBar = document.getElementById('loadingManagerProgress');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            // Verificar tempo mínimo de exibição
            const elapsedTime = startTime ? Date.now() - startTime : 0;
            const minTime = currentConfig.minShowTime;
            
            const hideNow = () => {
                const overlay = document.getElementById(currentConfig.containerId);
                if (overlay) {
                    // Mudar para estado de sucesso
                    const titleEl = document.getElementById('loadingManagerTitle');
                    const messageEl = document.getElementById('loadingManagerMessage');
                    const spinner = overlay.querySelector('.loading-spinner');
                    
                    if (titleEl) titleEl.textContent = '✅ Concluído!';
                    if (messageEl) messageEl.textContent = 'Operação concluída com sucesso!';
                    if (spinner) {
                        spinner.style.borderTopColor = '#27ae60';
                        spinner.style.animation = 'none';
                    }
                    
                    // Fechar após breve delay
                    setTimeout(() => {
                        removeExistingOverlay();
                        activeInstance = null;
                    }, 800);
                }
            };
            
            if (forceImmediate || elapsedTime >= minTime) {
                hideNow();
            } else {
                setTimeout(hideNow, minTime - elapsedTime);
            }
        },

        /**
         * Obter instância ativa do loading
         * @returns {Object|null} Instância ativa ou null
         */
        getActiveInstance() {
            return activeInstance;
        },

        /**
         * Verificar se há loading ativo
         * @returns {boolean}
         */
        isLoading() {
            return activeInstance !== null;
        }
    };
})();

// Exportar para escopo global
if (typeof window !== 'undefined') {
    window.LoadingManager = LoadingManager;
    console.log('✅ LoadingManager carregado como módulo reutilizável');
}

export default LoadingManager;
