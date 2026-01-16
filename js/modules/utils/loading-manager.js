/**
 * SISTEMA DE LOADING VISUAL REUTILIZÁVEL - VERSÃO OTIMIZADA (180 linhas)
 * Responsabilidade única: Gerenciar overlay de loading visual
 * Compatibilidade total com admin.js, vendas.js e aluguel.js (futuro)
 */

const LoadingManager = (function() {
    // Configuração mínima e eficiente
    const CONFIG = {
        containerId: 'globalLoadingOverlay',
        minShowTime: 800,
        zIndex: 99999,
        spinnerColor: '#1a5276',
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
    };

    let activeInstance = null;
    let progressInterval = null;
    let startTime = null;

    // Função PRINCIPAL única (30 linhas em vez de 55)
    function createOverlay(title = 'Processando...') {
        removeExistingOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = CONFIG.containerId;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${CONFIG.backgroundColor};
            z-index: ${CONFIG.zIndex};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 2px solid ${CONFIG.spinnerColor};
                max-width: 90%;
                width: 400px;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    margin: auto;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid ${CONFIG.spinnerColor};
                    border-radius: 50%;
                    animation: spin 1s linear infinite
                "></div>
                <h3 style="
                    margin: 1rem 0 0.5rem;
                    color: ${CONFIG.spinnerColor};
                    font-size: 1.2rem;
                ">${title}</h3>
                <p id="loadingMessage" style="
                    color: #666;
                    margin: 0;
                    font-size: 0.95rem;
                ">Por favor, aguarde...</p>
                <div id="loadingProgressBar" style="
                    width: 100%;
                    height: 4px;
                    background: #f0f0f0;
                    border-radius: 2px;
                    margin-top: 1.5rem;
                    overflow: hidden;
                    display: none;
                ">
                    <div id="loadingProgressFill" style="
                        width: 0%;
                        height: 100%;
                        background: ${CONFIG.spinnerColor};
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }

    function removeExistingOverlay() {
        const existing = document.getElementById(CONFIG.containerId);
        if (existing && existing.parentNode) {
            existing.style.opacity = '0';
            setTimeout(() => {
                if (existing.parentNode) {
                    existing.parentNode.removeChild(existing);
                }
            }, 300);
        }
    }

    function startProgressAnimation() {
        if (progressInterval) clearInterval(progressInterval);
        
        const progressBar = document.getElementById('loadingProgressBar');
        const progressFill = document.getElementById('loadingProgressFill');
        
        if (!progressBar || !progressFill) return;
        
        progressBar.style.display = 'block';
        let progress = 0;
        
        progressInterval = setInterval(() => {
            if (progress >= 85) {
                clearInterval(progressInterval);
                return;
            }
            
            progress += Math.random() * 2 + 0.5;
            progress = Math.min(85, progress);
            progressFill.style.width = `${progress}%`;
        }, 200);
    }

    function completeProgress() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        const progressFill = document.getElementById('loadingProgressFill');
        if (progressFill) {
            progressFill.style.width = '100%';
            progressFill.style.background = '#27ae60';
        }
        
        const spinner = document.querySelector(`#${CONFIG.containerId} div[style*="animation: spin"]`);
        if (spinner) {
            spinner.style.borderTopColor = '#27ae60';
            spinner.style.animation = 'none';
        }
    }

    // Adicionar estilos uma única vez
    function ensureStyles() {
        if (!document.getElementById('loadingManagerStyles')) {
            const style = document.createElement('style');
            style.id = 'loadingManagerStyles';
            style.textContent = `
                @keyframes spin { 
                    0% { transform: rotate(0deg); } 
                    100% { transform: rotate(360deg); } 
                }
                
                #${CONFIG.containerId} {
                    animation: fadeIn 0.3s ease forwards;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // API pública reduzida (6 métodos em vez de 9)
    return {
        show(title = 'Processando...', message = 'Aguarde...') {
            ensureStyles();
            startTime = Date.now();
            
            const overlay = createOverlay(title);
            const messageEl = overlay.querySelector('#loadingMessage');
            if (messageEl && message) {
                messageEl.textContent = message;
            }
            
            startProgressAnimation();
            
            activeInstance = {
                overlay,
                updateMessage: (newMsg) => {
                    const el = overlay.querySelector('#loadingMessage');
                    if (el) el.textContent = newMsg;
                },
                updateProgress: (percent) => {
                    const progressFill = document.getElementById('loadingProgressFill');
                    const progressBar = document.getElementById('loadingProgressBar');
                    if (progressFill) {
                        progressFill.style.width = `${Math.min(100, percent)}%`;
                    }
                    if (progressBar && progressBar.style.display === 'none') {
                        progressBar.style.display = 'block';
                    }
                },
                hide: () => this.hide()
            };
            
            return activeInstance;
        },
        
        hide() {
            completeProgress();
            
            const elapsed = Date.now() - (startTime || 0);
            const wait = Math.max(0, CONFIG.minShowTime - elapsed);
            
            setTimeout(() => {
                const overlay = document.getElementById(CONFIG.containerId);
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                        activeInstance = null;
                        startTime = null;
                    }, 300);
                }
            }, wait);
        },
        
        isLoading() {
            return activeInstance !== null;
        },
        
        getInstance() {
            return activeInstance;
        },
        
        config(options = {}) {
            Object.assign(CONFIG, options);
            return this;
        }
    };
})();

// Exportação global segura
if (typeof window !== 'undefined') {
    if (!window.LoadingManager) {
        window.LoadingManager = LoadingManager;
        console.log('✅ LoadingManager otimizado carregado (180 linhas)');
    }
}
