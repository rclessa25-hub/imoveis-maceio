// js/modules/gallery.js - Sistema de galeria de fotos MOBILE FIRST
// VERSÃO ATUALIZADA COM SHAREDCORE CORRETAMENTE INTEGRADO

(function() {
    'use strict';
    
    // ========== SHAREDCORE - USAR O EXISTENTE SEM REDECLARAR ==========
    // Verificar se SharedCore está disponível
    if (typeof window.SharedCore === 'undefined') {
        console.error('❌ ERRO: SharedCore não carregado!');
        console.error('💡 Certifique-se que SharedCore.js é carregado ANTES deste script');
        return;
    }
    
    // Usar window.SharedCore diretamente (sem criar nova variável SC)
    const SC = window.SharedCore;
    SC.logModule('gallery', '🚀 gallery.js carregado - Sistema de Galeria');

    // ========== VARIÁVEIS GLOBAIS DA GALERIA ==========
    // Não use 'window.' se já estiver no escopo global
    // Em vez disso, declare diretamente:
    if (typeof window.currentGalleryImages === 'undefined') {
        window.currentGalleryImages = [];
    }
    
    if (typeof window.currentGalleryIndex === 'undefined') {
        window.currentGalleryIndex = 0;
    }
    
    if (typeof window.touchStartX === 'undefined') {
        window.touchStartX = 0;
    }
    
    if (typeof window.touchEndX === 'undefined') {
        window.touchEndX = 0;
    }
    
    if (typeof window.SWIPE_THRESHOLD === 'undefined') {
        window.SWIPE_THRESHOLD = 50;
    }

    // ========== ESTILOS DA GALERIA (MOBILE FIRST) ==========
    window.galleryStyles = `
        /* Estilos específicos da galeria - MOBILE FIRST */
        .property-gallery-container {
            position: relative;
            width: 100%;
            height: 250px;
            overflow: hidden;
            cursor: pointer;
        }
        
        .property-gallery-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .property-gallery-image:hover {
            transform: scale(1.02);
        }
        
        /* Controles da galeria MOBILE */
        .gallery-controls {
            position: absolute;
            bottom: 10px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 8px;
            z-index: 5;
            padding: 0 10px;
        }
        
        .gallery-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .gallery-dot.active {
            background: white;
            transform: scale(1.2);
        }
        
        /* Indicador de múltiplas fotos (MOBILE) */
        .gallery-indicator-mobile {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            z-index: 5;
            display: flex;
            align-items: center;
            gap: 4px;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        /* Modal da galeria FULLSCREEN - MOBILE FIRST */
        .gallery-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            touch-action: pan-y pinch-zoom;
        }
        
        .gallery-modal-content {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        /* Imagem principal no modal */
        .gallery-modal-image {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
            margin: 0 auto;
            display: block;
            -webkit-user-select: none;
            user-select: none;
            touch-action: manipulation;
        }
        
        /* Controles do modal MOBILE */
        .gallery-modal-controls {
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            z-index: 10;
            padding: 0 20px;
        }
        
        .gallery-modal-btn {
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: #333;
            cursor: pointer;
            transition: all 0.3s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .gallery-modal-btn:active {
            transform: scale(0.95);
            background: white;
        }
        
        .gallery-modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: #333;
            cursor: pointer;
            z-index: 10;
            transition: all 0.3s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .gallery-modal-close:active {
            transform: scale(0.95);
            background: white;
        }
        
        /* Contador no modal */
        .gallery-counter {
            color: white;
            font-size: 0.9rem;
            font-weight: 600;
            background: rgba(0, 0, 0, 0.5);
            padding: 6px 12px;
            border-radius: 20px;
            min-width: 70px;
            text-align: center;
        }
        
        /* Swipe para mobile */
        .gallery-swipe-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 5;
        }
        
        /* Ícone de expansão na imagem principal */
        .gallery-expand-icon {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            z-index: 5;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .gallery-expand-icon:hover {
            background: rgba(0, 0, 0, 0.9);
            transform: scale(1.1);
        }
        
        /* Para Desktop - ajustes */
        @media (min-width: 768px) {
            .gallery-indicator-mobile {
                top: 15px;
                right: 15px;
                padding: 6px 12px;
                font-size: 0.8rem;
            }
            
            .gallery-controls {
                bottom: 15px;
                gap: 10px;
            }
            
            .gallery-dot {
                width: 10px;
                height: 10px;
            }
            
            .gallery-modal-btn {
                width: 50px;
                height: 50px;
                font-size: 1.3rem;
            }
            
            .gallery-modal-close {
                width: 50px;
                height: 50px;
                font-size: 1.5rem;
                top: 30px;
                right: 30px;
            }
            
            .gallery-counter {
                font-size: 1rem;
                padding: 8px 16px;
            }
        }
        
        /* Animações */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .gallery-modal {
            animation: fadeIn 0.3s ease;
        }
        
        /* Melhorias de acessibilidade */
        .gallery-modal-btn:focus,
        .gallery-modal-close:focus {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
        }
        
        /* Prevenção de seleção de texto */
        .gallery-modal-content {
            -webkit-user-select: none;
            user-select: none;
        }
    `;

    // ========== FUNÇÕES BÁSICAS DA GALERIA ==========
    
    // Função para criar a galeria no card do imóvel - VERSÃO CORRIGIDA
// ========== FUNÇÕES BÁSICAS DA GALERIA ==========

// Função para criar a galeria no card do imóvel - VERSÃO CORRIGIDA
    window.createPropertyGallery = function(property) {
        SC.logModule('gallery', `🖼️ Criando galeria para: ${property.title}`);
        
        // Verificar se há imagens
        const hasImages = property.images && 
                         property.images.length > 0 && 
                         property.images !== 'EMPTY';
        
        const imageUrls = hasImages ? 
            property.images.split(',').filter(url => url.trim() !== '') : [];
        
        const firstImageUrl = imageUrls.length > 0 ? 
            imageUrls[0] : 
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
        
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY';
        
        // Se só tem uma imagem, mostrar imagem estática
        if (imageUrls.length <= 1) {
            return `
                <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                    <img src="${firstImageUrl}" 
                         style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                         alt="${property.title}"
                         onclick="openGallery(${property.id})"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                    
                    ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                    ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                    
                    ${imageUrls.length > 1 ? `
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; z-index: 5; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-images" style="font-size: 0.7rem;"></i>
                            <span>${imageUrls.length}</span>
                        </div>` : ''}
                    
                    <!-- BOTÃO PDF CORRIGIDO -->
                    ${hasImages && hasPdfs ? 
                        `<button class="pdf-access" 
                                onclick="window.pdfButtonHandler(event, ${property.id})" 
                                title="Documentos do imóvel (senha: doc123)">
                            <i class="fas fa-file-pdf"></i>
                        </button>` : ''}
                </div>
            `;
        }
        
        // Se tem múltiplas imagens (galeria)
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                <img src="${firstImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                     alt="${property.title}"
                     onclick="openGallery(${property.id})"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                
                <!-- NUMERAÇÃO DE FOTOS (Canto superior direito) -->
                ${imageUrls.length > 1 ? `
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; z-index: 5; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-images" style="font-size: 0.7rem;"></i>
                        <span>${imageUrls.length}</span>
                    </div>` : ''}
                
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                
                <!-- BOTÃO PDF CORRIGIDO -->
                ${hasPdfs ? `
                    <button class="pdf-access" 
                            onclick="window.pdfButtonHandler(event, ${property.id})"
                            title="Documentos do imóvel (senha: doc123)">
                        <i class="fas fa-file-pdf"></i>
                    </button>` : ''}
            </div>
        `;
    };
    
    // Função para manipular clique no botão PDF
    window.pdfButtonHandler = function(event, propertyId) {
        event.stopPropagation();
        event.preventDefault();
        if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
            window.PdfSystem.showModal(propertyId);
        } else {
            console.warn('Sistema PDF não encontrado');
            SC.showAlert('Sistema de documentos temporariamente indisponível', 'warning');
        }
    };    
    // Função para abrir a galeria (mantida igual)
    window.openGallery = function(propertyId) {
        SC.logModule('gallery', `📸 Abrindo galeria para imóvel ID: ${propertyId}`);
        
        const property = window.properties.find(p => p.id === propertyId);
        if (!property) {
            SC.logError('gallery', `❌ Imóvel não encontrado: ${propertyId}`);
            return;
        }
        
        const hasImages = property.images && 
                         property.images.length > 0 && 
                         property.images !== 'EMPTY';
        
        if (!hasImages) {
            SC.logModule('gallery', '⚠️ Imóvel sem imagens para galeria');
            return;
        }
        
        window.currentGalleryImages = property.images.split(',').filter(url => url.trim() !== '');
        window.currentGalleryIndex = 0;
        
        // Criar ou atualizar modal da galeria
        let galleryModal = document.getElementById('propertyGalleryModal');
        
        if (!galleryModal) {
            galleryModal = document.createElement('div');
            galleryModal.id = 'propertyGalleryModal';
            galleryModal.className = 'gallery-modal';
            galleryModal.innerHTML = `
                <div class="gallery-modal-content">
                    <!-- Área para swipe -->
                    <div class="gallery-swipe-area" 
                         ontouchstart="handleTouchStart(event)"
                         ontouchend="handleTouchEnd(event)"></div>
                    
                    <!-- Imagem -->
                    <img id="galleryCurrentImage" class="gallery-modal-image" 
                         src="${window.currentGalleryImages[0]}"
                         alt="Imagem ${window.currentGalleryIndex + 1} de ${window.currentGalleryImages.length}">
                    
                    <!-- Controles -->
                    <div class="gallery-modal-controls">
                        <button class="gallery-modal-btn" onclick="prevGalleryImage()" 
                                aria-label="Imagem anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <div id="galleryCounter" class="gallery-counter">
                            ${window.currentGalleryIndex + 1} / ${window.currentGalleryImages.length}
                        </div>
                        
                        <button class="gallery-modal-btn" onclick="nextGalleryImage()" 
                                aria-label="Próxima imagem">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <!-- Botão fechar -->
                    <button class="gallery-modal-close" onclick="closeGallery()" 
                            aria-label="Fechar galeria">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            document.body.appendChild(galleryModal);
            
            // Adicionar suporte a teclado
            document.addEventListener('keydown', window.handleGalleryKeyboard);
        } else {
            // Atualizar imagem atual
            document.getElementById('galleryCurrentImage').src = window.currentGalleryImages[0];
            document.getElementById('galleryCounter').textContent = 
                `${window.currentGalleryIndex + 1} / ${window.currentGalleryImages.length}`;
        }
        
        // Mostrar modal
        galleryModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevenir scroll
        
        // Focar no botão fechar para acessibilidade
        setTimeout(() => {
            const closeBtn = galleryModal.querySelector('.gallery-modal-close');
            if (closeBtn) closeBtn.focus();
        }, 100);
        
        SC.logModule('gallery', `✅ Galeria aberta com ${window.currentGalleryImages.length} imagens`);
    };

    // Função para fechar a galeria (mantida igual)
    window.closeGallery = function() {
        SC.logModule('gallery', '❌ Fechando galeria');
        
        const galleryModal = document.getElementById('propertyGalleryModal');
        if (galleryModal) {
            galleryModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restaurar scroll
            
            // Remover listener de teclado
            document.removeEventListener('keydown', window.handleGalleryKeyboard);
            
            // Limpar variáveis
            window.currentGalleryImages = [];
            window.currentGalleryIndex = 0;
            
            SC.logModule('gallery', '✅ Galeria fechada');
        }
    };

    // Função para mostrar imagem específica (mantida igual)
    window.showGalleryImage = function(propertyId, index) {
        SC.logModule('gallery', `🖼️ Mostrando imagem ${index} do imóvel ${propertyId}`);
        
        const property = window.properties.find(p => p.id === propertyId);
        if (!property) return;
        
        const hasImages = property.images && 
                         property.images.length > 0 && 
                         property.images !== 'EMPTY';
        
        if (!hasImages) return;
        
        const images = property.images.split(',').filter(url => url.trim() !== '');
        if (index < 0 || index >= images.length) return;
        
        // Atualizar imagem no card
        const container = document.querySelector(`[onclick="openGallery(${propertyId})"]`);
        if (container) {
            const img = container.querySelector('.property-gallery-image');
            if (img) {
                img.src = images[index];
                img.onerror = function() {
                    this.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
                };
            }
            
            // Atualizar dots ativos
            const dots = container.querySelectorAll('.gallery-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            
            SC.logModule('gallery', '✅ Imagem atualizada no card');
        }
    };

    // Função para próxima imagem (mantida igual)
    window.nextGalleryImage = function() {
        if (window.currentGalleryImages.length === 0) return;
        
        window.currentGalleryIndex = (window.currentGalleryIndex + 1) % window.currentGalleryImages.length;
        window.updateGalleryModal();
        
        SC.logModule('gallery', `➡️ Próxima imagem: ${window.currentGalleryIndex}`);
    };

    // Função para imagem anterior (mantida igual)
    window.prevGalleryImage = function() {
        if (window.currentGalleryImages.length === 0) return;
        
        window.currentGalleryIndex = (window.currentGalleryIndex - 1 + window.currentGalleryImages.length) % window.currentGalleryImages.length;
        window.updateGalleryModal();
        
        SC.logModule('gallery', `⬅️ Imagem anterior: ${window.currentGalleryIndex}`);
    };

    // Função para atualizar o modal da galeria (mantida igual)
    window.updateGalleryModal = function() {
        const imageElement = document.getElementById('galleryCurrentImage');
        const counterElement = document.getElementById('galleryCounter');
        
        if (imageElement && counterElement) {
            imageElement.src = window.currentGalleryImages[window.currentGalleryIndex];
            counterElement.textContent = `${window.currentGalleryIndex + 1} / ${window.currentGalleryImages.length}`;
            
            // Animar transição
            imageElement.style.opacity = '0';
            setTimeout(() => {
                imageElement.style.opacity = '1';
            }, 50);
        }
    };

    // ========== FUNÇÕES TOUCH/SWIPE PARA MOBILE (mantidas iguais) ==========

    window.handleTouchStart = function(event) {
        window.touchStartX = event.changedTouches[0].screenX;
        event.stopPropagation();
        
        SC.logModule('gallery', `👆 Touch start: ${window.touchStartX}`);
    };

    window.handleTouchEnd = function(event) {
        window.touchEndX = event.changedTouches[0].screenX;
        window.handleSwipe();
        event.stopPropagation();
        
        SC.logModule('gallery', `👇 Touch end: ${window.touchEndX}`);
    };

    window.handleSwipe = function() {
        const diff = window.touchStartX - window.touchEndX;
        SC.logModule('gallery', `🔄 Swipe diff: ${diff}`);
        
        // Swipe esquerda (próxima imagem)
        if (diff > window.SWIPE_THRESHOLD) {
            SC.logModule('gallery', '⬅️ Swipe esquerda detectado');
            window.nextGalleryImage();
        }
        // Swipe direita (imagem anterior)
        else if (diff < -window.SWIPE_THRESHOLD) {
            SC.logModule('gallery', '➡️ Swipe direita detectado');
            window.prevGalleryImage();
        }
    };

    // ========== SUPORTE A TECLADO (mantido igual) ==========

    window.handleGalleryKeyboard = function(event) {
        const galleryModal = document.getElementById('propertyGalleryModal');
        if (!galleryModal || galleryModal.style.display !== 'block') return;
        
        SC.logModule('gallery', `⌨️ Tecla pressionada: ${event.key}`);
        
        switch(event.key) {
            case 'ArrowLeft':
                window.prevGalleryImage();
                event.preventDefault();
                break;
            case 'ArrowRight':
                window.nextGalleryImage();
                event.preventDefault();
                break;
            case 'Escape':
                window.closeGallery();
                event.preventDefault();
                break;
            case ' ':
            case 'Enter':
                // Evitar comportamento padrão do espaço
                if (event.target.tagName !== 'BUTTON') {
                    event.preventDefault();
                }
                break;
        }
    };

    // ========== CONFIGURAÇÃO DE EVENTOS DA GALERIA ==========

    window.setupGalleryEvents = function() {
        SC.logModule('gallery', '🎮 Configurando eventos da galeria...');
        
        // Adicionar evento para fechar galeria ao clicar fora
        document.addEventListener('click', function(event) {
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (galleryModal && galleryModal.style.display === 'block') {
                if (event.target === galleryModal) {
                    window.closeGallery();
                }
            }
        });
        
        // Adicionar suporte a teclado para navegação na galeria
        document.addEventListener('keydown', function(event) {
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (!galleryModal || galleryModal.style.display !== 'block') return;
            
            switch(event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    window.prevGalleryImage();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    window.nextGalleryImage();
                    break;
                case 'Escape':
                    event.preventDefault();
                    window.closeGallery();
                    break;
            }
        });
        
        // Adicionar evento de toque para swipe
        document.addEventListener('touchstart', window.handleTouchStart, { passive: true });
        document.addEventListener('touchend', window.handleTouchEnd, { passive: true });
        
        // Prevenir zoom com dois dedos na galeria
        document.addEventListener('gesturestart', function(event) {
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (galleryModal && galleryModal.style.display === 'block') {
                event.preventDefault();
            }
        });
        
        SC.logModule('gallery', '✅ Eventos da galeria configurados');
    };

    // ========== OTIMIZAÇÃO MOBILE (mantida igual) ==========

    window.optimizeGalleryForMobile = function() {
        if (!window.isMobileDevice || !window.isMobileDevice()) return;
        
        SC.logModule('gallery', '📱 Otimizando galeria para mobile...');
        
        // Ajustar tamanho das imagens para mobile
        const galleryContainers = document.querySelectorAll('.property-gallery-container');
        galleryContainers.forEach(container => {
            container.style.height = '300px'; // Mais alto para mobile
        });
        
        // Ajustar botões para touch
        const galleryButtons = document.querySelectorAll('.gallery-modal-btn, .gallery-modal-close');
        galleryButtons.forEach(button => {
            button.style.minWidth = '50px';
            button.style.minHeight = '50px';
            button.style.fontSize = '1.5rem';
        });
        
        SC.logModule('gallery', '✅ Galeria otimizada para mobile');
    };

    // ========== VERIFICAÇÃO DE INTEGRIDADE (atualizada) ==========

    window.validateGalleryModule = function() {
        SC.logModule('gallery', '🔍 Validação básica da galeria (core)...');
        
        // Se ValidationSystem disponível, delega para ele
        if (window.ValidationSystem && typeof window.ValidationSystem.validateGalleryModule === 'function') {
            return window.ValidationSystem.validateGalleryModule();
        }
        
        // Fallback mínimo no core
        const basicChecks = {
            'openGallery': typeof window.openGallery === 'function',
            'closeGallery': typeof window.closeGallery === 'function',
            'currentGalleryImages': Array.isArray(window.currentGalleryImages),
            'showPdfModal': typeof window.showPdfModal === 'function' // Nova verificação
        };
        
        const allValid = Object.values(basicChecks).every(check => check === true);
        SC.logModule('gallery', allValid ? '✅ Galeria OK' : '⚠️ Galeria com problemas');
        
        // Log específico para PDF
        if (!basicChecks.showPdfModal) {
            SC.logWarning('gallery', '⚠️ showPdfModal não disponível - PDFs podem não funcionar');
            
            // Criar fallback imediato se não existir
            if (!window.showPdfModal) {
                window.showPdfModal = function(propertyId) {
                    SC.logWarning('gallery', '📄 Usando fallback de PDF na galeria');
                    const property = window.properties?.find(p => p.id == propertyId);
                    if (property && property.pdfs && property.pdfs !== 'EMPTY') {
                        const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
                        if (pdfUrls.length > 0) {
                            window.open(pdfUrls[0], '_blank');
                        }
                    }
                };
                SC.logModule('gallery', '✅ Fallback showPdfModal criado');
            }
        }
        
        return allValid;
    };

    // ========== INICIALIZAÇÃO AUTOMÁTICA (atualizada) ==========

    window.initializeGalleryModule = function() {
        SC.logModule('gallery', '🚀 Inicializando módulo da galeria...');
        
        // Adicionar estilos da galeria
        const styleSheet = document.createElement("style");
        styleSheet.textContent = window.galleryStyles;
        document.head.appendChild(styleSheet);
        
        // Configurar eventos da galeria
        window.setupGalleryEvents();
        
        // Verificar se showPdfModal está disponível
        if (!window.showPdfModal) {
            SC.logWarning('gallery', '⚠️ showPdfModal não encontrado na inicialização da galeria');
            
            // Tentar encontrar ou criar fallback
            setTimeout(() => {
                if (!window.showPdfModal && window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
                    window.showPdfModal = window.PdfSystem.showModal;
                    SC.logModule('gallery', '✅ showPdfModal configurado via PdfSystem');
                } else if (!window.showPdfModal) {
                    window.showPdfModal = function(propertyId) {
                        SC.logWarning('gallery', '📄 PDF System não disponível - usando fallback básico');
                        alert('Sistema de documentos temporariamente indisponível.');
                    };
                    SC.logModule('gallery', '✅ Fallback básico criado');
                }
            }, 1000);
        } else {
            SC.logModule('gallery', '✅ showPdfModal já disponível');
        }
        
        // Otimizar para mobile se necessário
        setTimeout(() => {
            if (window.isMobileDevice && window.isMobileDevice()) {
                window.optimizeGalleryForMobile();
            }
        }, 1000);
        
        // Validar módulo
        setTimeout(window.validateGalleryModule, 500);
        
        SC.logModule('gallery', '✅ Módulo da galeria inicializado');
    };

    // ========== TESTE RÁPIDO ==========

    // Função para testar acesso a PDFs
    window.testGalleryPdfAccess = function(propertyId) {
        SC.logModule('gallery', '🧪 Testando acesso a PDFs da galeria...');
        
        if (!propertyId && window.properties && window.properties.length > 0) {
            propertyId = window.properties[0].id;
        }
        
        if (typeof window.showPdfModal === 'function') {
            window.showPdfModal(propertyId);
            return true;
        } else {
            SC.logError('gallery', '❌ showPdfModal não disponível');
            return false;
        }
    };

    // ========== EXPORT DO MÓDULO ==========
    SC.logModule('gallery', '✅ gallery.js completamente carregado e pronto');
})();
