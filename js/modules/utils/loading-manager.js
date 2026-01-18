// js/modules/loading-manager.js - SISTEMA UNIFICADO DE LOADING
console.log('⏳ LoadingManager.js carregado - Sistema Unificado');

/**
 * 🎯 SISTEMA COMPLETO DE LOADING VISUAL
 * Migrado do admin.js (200+ linhas) + funcionalidades estendidas
 * @version 2.0 - Unificado
 */

window.LoadingManager = (function() {
    // ========== CONFIGURAÇÃO ==========
    const CONFIG = {
        overlayId: 'global-loading-overlay',
        containerId: 'loading-container',
        titleId: 'loading-title',
        messageId: 'loading-message',
        progressId: 'loading-progress',
        spinnerId: 'loading-spinner',
        zIndex: 99999,
        animationDuration: 300,
        minDisplayTime: 500, // ms mínimo para evitar "piscar"
        maxDisplayTime: 30000 // ms máximo (timeout de segurança)
    };

    // ========== ESTADO ==========
    const state = {
        isVisible: false,
        startTime: null,
        currentOperation: null,
        progress: 0,
        timeoutId: null,
        queue: [],
        isProcessing: false
    };

    // ========== ELEMENTOS DOM ==========
    let elements = {
        overlay: null,
        container: null,
        title: null,
        message: null,
        progress: null,
        spinner: null
    };

    // ========== INICIALIZAÇÃO ==========
    function init() {
        if (elements.overlay) return; // Já inicializado
        
        createElements();
        setupStyles();
        
        console.log('✅ LoadingManager inicializado');
        
        // Garantir que elementos existam
        document.addEventListener('DOMContentLoaded', function() {
            if (!document.getElementById(CONFIG.overlayId)) {
                document.body.appendChild(elements.overlay);
            }
        });
        
        // Auto-hide por timeout de segurança
        state.timeoutId = setTimeout(() => {
            if (state.isVisible && Date.now() - state.startTime > CONFIG.maxDisplayTime) {
                console.warn('⚠️ Loading excedeu tempo máximo. Auto-hiding...');
                hide();
            }
        }, CONFIG.maxDisplayTime);
    }

    // ========== CRIAÇÃO DOS ELEMENTOS (MIGRADO DO admin.js) ==========
    function createElements() {
        // Overlay principal
        elements.overlay = document.createElement('div');
        elements.overlay.id = CONFIG.overlayId;
        elements.overlay.className = 'loading-overlay';
        elements.overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: ${CONFIG.zIndex};
            align-items: center;
            justify-content: center;
            transition: opacity ${CONFIG.animationDuration}ms ease;
            opacity: 0;
        `;

        // Container central
        elements.container = document.createElement('div');
        elements.container.id = CONFIG.containerId;
        elements.container.className = 'loading-container';
        elements.container.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 2.5rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            transform: translateY(20px);
            transition: transform ${CONFIG.animationDuration}ms ease, opacity ${CONFIG.animationDuration}ms ease;
            opacity: 0;
        `;

        // Spinner animado
        elements.spinner = document.createElement('div');
        elements.spinner.id = CONFIG.spinnerId;
        elements.spinner.className = 'loading-spinner';
        elements.spinner.style.cssText = `
            width: 60px;
            height: 60px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid var(--primary);
            border-radius: 50%;
            animation: loading-spin 1s linear infinite;
            margin: 0 auto 1.5rem auto;
        `;

        // Título
        elements.title = document.createElement('h3');
        elements.title.id = CONFIG.titleId;
        elements.title.className = 'loading-title';
        elements.title.style.cssText = `
            color: #2c3e50;
            margin: 0 0 0.8rem 0;
            font-size: 1.4rem;
            font-weight: 600;
        `;

        // Mensagem
        elements.message = document.createElement('p');
        elements.message.id = CONFIG.messageId;
        elements.message.className = 'loading-message';
        elements.message.style.cssText = `
            color: #7f8c8d;
            margin: 0 0 1.5rem 0;
            font-size: 1rem;
            line-height: 1.5;
        `;

        // Barra de progresso (opcional)
        elements.progress = document.createElement('div');
        elements.progress.id = CONFIG.progressId;
        elements.progress.className = 'loading-progress';
        elements.progress.style.cssText = `
            height: 6px;
            background: #ecf0f1;
            border-radius: 3px;
            overflow: hidden;
            margin-top: 1rem;
            display: none;
        `;

        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--primary), var(--accent));
            border-radius: 3px;
            transition: width 0.3s ease;
        `;
        elements.progress.appendChild(progressBar);

        // Montar hierarquia
        elements.container.appendChild(elements.spinner);
        elements.container.appendChild(elements.title);
        elements.container.appendChild(elements.message);
        elements.container.appendChild(elements.progress);
        elements.overlay.appendChild(elements.container);
        
        // Adicionar ao body
        document.body.appendChild(elements.overlay);
    }

    // ========== ESTILOS GLOBAIS ==========
    function setupStyles() {
        if (document.getElementById('loading-manager-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-manager-styles';
        style.textContent = `
            @keyframes loading-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes loading-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes loading-shimmer {
                0% { background-position: -500px 0; }
                100% { background-position: 500px 0; }
            }
            
            .loading-overlay.show {
                display: flex !important;
                opacity: 1 !important;
            }
            
            .loading-overlay.show .loading-container {
                transform: translateY(0) !important;
                opacity: 1 !important;
            }
            
            .loading-overlay.hiding {
                opacity: 0 !important;
            }
            
            .loading-overlay.hiding .loading-container {
                transform: translateY(-20px) !important;
                opacity: 0 !important;
            }
            
            /* Variantes de loading */
            .loading-variant-processing .loading-spinner {
                border-top-color: var(--accent);
            }
            
            .loading-variant-success .loading-spinner {
                border-top-color: var(--success);
                animation: none;
                border-color: transparent;
                position: relative;
            }
            
            .loading-variant-success .loading-spinner::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--success);
                font-size: 1.8rem;
                font-weight: bold;
            }
            
            .loading-variant-error .loading-spinner {
                border-top-color: var(--danger);
                animation: none;
                border-color: transparent;
                position: relative;
            }
            
            .loading-variant-error .loading-spinner::after {
                content: '✗';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--danger);
                font-size: 1.8rem;
                font-weight: bold;
            }
            
            .loading-with-progress .loading-progress {
                display: block !important;
            }
            
            /* Responsividade */
            @media (max-width: 768px) {
                .loading-container {
                    padding: 2rem !important;
                    width: 95% !important;
                }
                
                .loading-spinner {
                    width: 50px !important;
                    height: 50px !important;
                }
                
                .loading-title {
                    font-size: 1.2rem !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // ========== API PÚBLICA ==========
    
    /**
     * Mostra o loading com título e mensagem
     * @param {string} title - Título do loading
     * @param {string} message - Mensagem descritiva
     * @param {Object} options - Opções adicionais
     * @returns {Object} Instância do loading para controle
     */
    function show(title = 'Carregando...', message = 'Por favor, aguarde.', options = {}) {
        // Inicializar se necessário
        init();
        
        // Registrar estado
        state.isVisible = true;
        state.startTime = Date.now();
        state.currentOperation = title;
        
        // Configurar elementos
        elements.title.textContent = title;
        elements.message.textContent = message;
        
        // Aplicar variante
        elements.container.className = 'loading-container';
        if (options.variant) {
            elements.container.classList.add(`loading-variant-${options.variant}`);
        }
        
        // Configurar progresso
        if (options.showProgress) {
            elements.container.classList.add('loading-with-progress');
            setProgress(options.progress || 0);
        } else {
            elements.container.classList.remove('loading-with-progress');
        }
        
        // Mostrar overlay com animação
        elements.overlay.style.display = 'flex';
        
        setTimeout(() => {
            elements.overlay.classList.add('show');
        }, 10);
        
        console.log(`⏳ Loading: "${title}" - ${message}`);
        
        // Retornar interface de controle
        return {
            updateMessage: (newMessage) => updateMessage(newMessage),
            updateTitle: (newTitle) => updateTitle(newTitle),
            setProgress: (percent) => setProgress(percent),
            setVariant: (variant) => setVariant(variant),
            hide: () => hide(),
            getState: () => ({ ...state })
        };
    }
    
    /**
     * Atualiza a mensagem do loading visível
     * @param {string} newMessage - Nova mensagem
     */
    function updateMessage(newMessage) {
        if (!state.isVisible || !elements.message) return;
        
        elements.message.textContent = newMessage;
        console.log(`⏳ Loading atualizado: ${newMessage}`);
    }
    
    /**
     * Atualiza o título do loading visível
     * @param {string} newTitle - Novo título
     */
    function updateTitle(newTitle) {
        if (!state.isVisible || !elements.title) return;
        
        elements.title.textContent = newTitle;
        state.currentOperation = newTitle;
    }
    
    /**
     * Define o progresso (0-100)
     * @param {number} percent - Percentual de progresso
     */
    function setProgress(percent) {
        if (!state.isVisible || !elements.progress) return;
        
        const progress = Math.max(0, Math.min(100, percent));
        state.progress = progress;
        
        const progressBar = elements.progress.querySelector('.loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        // Mostrar barra se progresso > 0
        if (progress > 0) {
            elements.container.classList.add('loading-with-progress');
        }
    }
    
    /**
     * Define a variante visual do loading
     * @param {string} variant - 'processing', 'success', 'error'
     */
    function setVariant(variant) {
        if (!state.isVisible || !elements.container) return;
        
        // Remover variantes anteriores
        elements.container.classList.remove(
            'loading-variant-processing',
            'loading-variant-success',
            'loading-variant-error'
        );
        
        // Adicionar nova variante
        if (variant && ['processing', 'success', 'error'].includes(variant)) {
            elements.container.classList.add(`loading-variant-${variant}`);
        }
    }
    
    /**
     * Esconde o loading com animação
     * @param {boolean} immediate - Esconder imediatamente (sem animação)
     */
    function hide(immediate = false) {
        if (!state.isVisible || !elements.overlay) return;
        
        // Garantir tempo mínimo de exibição
        const displayTime = Date.now() - state.startTime;
        const minTime = immediate ? 0 : CONFIG.minDisplayTime;
        
        const hideAfterDelay = () => {
            if (immediate) {
                elements.overlay.style.display = 'none';
                elements.overlay.className = 'loading-overlay';
            } else {
                elements.overlay.classList.remove('show');
                elements.overlay.classList.add('hiding');
                
                setTimeout(() => {
                    elements.overlay.style.display = 'none';
                    elements.overlay.className = 'loading-overlay';
                    elements.overlay.classList.remove('hiding');
                }, CONFIG.animationDuration);
            }
            
            // Resetar estado
            state.isVisible = false;
            state.currentOperation = null;
            state.progress = 0;
            
            // Resetar barra de progresso
            const progressBar = elements.progress.querySelector('.loading-progress-bar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
            
            console.log(`✅ Loading finalizado após ${displayTime}ms`);
        };
        
        if (displayTime < minTime) {
            setTimeout(hideAfterDelay, minTime - displayTime);
        } else {
            hideAfterDelay();
        }
    }
    
    /**
     * Mostra loading de sucesso
     * @param {string} message - Mensagem de sucesso
     * @param {number} autoHideDelay - Delay para auto-esconder (ms)
     */
    function showSuccess(message = 'Operação concluída com sucesso!', autoHideDelay = 2000) {
        const loading = show('Sucesso!', message, { variant: 'success' });
        
        if (autoHideDelay > 0) {
            setTimeout(() => loading.hide(), autoHideDelay);
        }
        
        return loading;
    }
    
    /**
     * Mostra loading de erro
     * @param {string} message - Mensagem de erro
     * @param {number} autoHideDelay - Delay para auto-esconder (ms)
     */
    function showError(message = 'Ocorreu um erro. Tente novamente.', autoHideDelay = 3000) {
        const loading = show('Erro!', message, { variant: 'error' });
        
        if (autoHideDelay > 0) {
            setTimeout(() => loading.hide(), autoHideDelay);
        }
        
        return loading;
    }
    
    /**
     * Mostra loading com progresso
     * @param {string} title - Título
     * @param {string} message - Mensagem inicial
     * @param {number} initialProgress - Progresso inicial (0-100)
     */
    function showWithProgress(title, message, initialProgress = 0) {
        return show(title, message, {
            showProgress: true,
            progress: initialProgress
        });
    }
    
    /**
     * Processa uma operação com loading automático
     * @param {Function} operation - Função assíncrona a executar
     * @param {string} title - Título do loading
     * @param {string} message - Mensagem do loading
     */
    async function withLoading(operation, title = 'Processando...', message = 'Aguarde') {
        const loading = show(title, message);
        
        try {
            const result = await operation();
            loading.setVariant('success');
            loading.updateMessage('Concluído!');
            
            // Aguardar um pouco para mostrar sucesso
            await new Promise(resolve => setTimeout(resolve, 500));
            loading.hide();
            
            return result;
        } catch (error) {
            loading.setVariant('error');
            loading.updateMessage(`Erro: ${error.message}`);
            loading.updateTitle('Falha na operação');
            
            // Mostrar erro por mais tempo
            await new Promise(resolve => setTimeout(resolve, 2000));
            loading.hide();
            
            throw error;
        }
    }

    // ========== API PÚBLICA COMPLETA ==========
    return {
        // Controle básico
        show,
        hide,
        updateMessage,
        updateTitle,
        setProgress,
        setVariant,
        
        // Métodos especializados
        showSuccess,
        showError,
        showWithProgress,
        withLoading,
        
        // Informações
        getState: () => ({ ...state }),
        isVisible: () => state.isVisible,
        
        // Inicialização manual (se necessário)
        init,
        
        // Deprecação/Compatibilidade
        showLoading: show, // Alias para compatibilidade
        hideLoading: hide, // Alias para compatibilidade
        createOverlay: init // Alias para compatibilidade
    };
})();

// ========== COMPATIBILIDADE COM CÓDIGO LEGADO ==========
// Garantir que funções globais antigas ainda funcionem
(function ensureLoadingCompatibility() {
    console.log('🔄 Configurando compatibilidade do sistema de loading...');
    
    // Criar aliases globais para compatibilidade
    if (!window.showLoading && window.LoadingManager?.show) {
        window.showLoading = window.LoadingManager.show.bind(window.LoadingManager);
        console.log('✅ showLoading disponível via LoadingManager');
    }
    
    if (!window.hideLoading && window.LoadingManager?.hide) {
        window.hideLoading = window.LoadingManager.hide.bind(window.LoadingManager);
        console.log('✅ hideLoading disponível via LoadingManager');
    }
    
    if (!window.updateLoading && window.LoadingManager?.updateMessage) {
        window.updateLoading = window.LoadingManager.updateMessage.bind(window.LoadingManager);
        console.log('✅ updateLoading disponível via LoadingManager');
    }
    
    if (!window.createOverlay && window.LoadingManager?.init) {
        window.createOverlay = window.LoadingManager.init.bind(window.LoadingManager);
        console.log('✅ createOverlay disponível via LoadingManager');
    }
})();

// ========== VALIDAÇÃO AUTOMÁTICA ==========
setTimeout(() => {
    console.group('🧪 VALIDAÇÃO DO LOADING MANAGER');
    
    const tests = [
        {
            name: 'LoadingManager disponível globalmente',
            test: () => typeof window.LoadingManager !== 'undefined',
            critical: true
        },
        {
            name: 'Método show disponível',
            test: () => typeof window.LoadingManager?.show === 'function',
            critical: true
        },
        {
            name: 'Método hide disponível',
            test: () => typeof window.LoadingManager?.hide === 'function',
            critical: true
        },
        {
            name: 'Funções de compatibilidade disponíveis',
            test: () => typeof window.showLoading === 'function' && 
                       typeof window.hideLoading === 'function',
            critical: false // Não crítico, são fallbacks
        },
        {
            name: 'Elementos DOM criados',
            test: () => document.getElementById('global-loading-overlay') !== null,
            critical: true
        }
    ];
    
    let allPassed = true;
    let passed = 0;
    
    tests.forEach((t, i) => {
        const result = t.test();
        console.log(`${result ? '✅' : '❌'} ${i + 1}. ${t.name}`);
        if (result) passed++;
        if (!result && t.critical) allPassed = false;
    });
    
    console.log(`📊 Resultado: ${passed}/${tests.length} testes passados`);
    console.log(allPassed ? '🎉 SISTEMA DE LOADING VALIDADO' : '⚠️ VERIFICAÇÃO REQUERIDA');
    console.groupEnd();
}, 1000);

console.log('✅ LoadingManager.js carregado - Sistema unificado pronto');
