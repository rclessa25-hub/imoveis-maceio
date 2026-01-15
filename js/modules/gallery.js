// js/modules/gallery.js - Sistema de galeria de fotos MOBILE FIRST
// VERSÃO OTIMIZADA SEM DUPLICAÇÕES - COM CORREÇÃO DO BOTÃO PDF

(function() {
    'use strict';
    
    // ========== SHAREDCORE - USAR O EXISTENTE ==========
    if (typeof window.SharedCore === 'undefined') {
        console.error('❌ ERRO: SharedCore não carregado!');
        return;
    }
    
    const SC = window.SharedCore;
    SC.logModule('gallery', '🚀 gallery.js carregado - Sistema de Galeria');

    // ========== VERIFICAÇÃO DE EXISTÊNCIA DE VARIÁVEIS ==========
    const galleryVars = {
        currentGalleryImages: window.currentGalleryImages || [],
        currentGalleryIndex: window.currentGalleryIndex || 0,
        touchStartX: window.touchStartX || 0,
        touchEndX: window.touchEndX || 0,
        SWIPE_THRESHOLD: window.SWIPE_THRESHOLD || 50
    };

    // ========== ESTILOS DA GALERIA (MOBILE FIRST) ==========
    const galleryStyles = `
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
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
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
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
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
            background: rgba(0,0,0,0.5);
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

    // ========== FUNÇÕES PRINCIPAIS ==========
    
    // Função para criar a galeria no card do imóvel
    window.createPropertyGallery = function(property) {
        SC.logModule('gallery', `🖼️ Criando galeria para: ${property.title}`);
        
        // Verificar se há imagens
        const hasImages = property.images && property.images.trim() !== '' && property.images !== 'EMPTY';
        const imageUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
        const firstImageUrl = imageUrls[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa';
        
        // Verificação de PDFs
        const hasPdfs = property.pdfs && 
                       property.pdfs.trim() !== '' && 
                       property.pdfs !== 'EMPTY' &&
                       property.pdfs !== 'null' &&
                       property.pdfs !== 'undefined';
        
        // Botão PDF - usar handler centralizado se existir
        const pdfButtonHtml = hasPdfs ? `
            <button class="pdf-access" 
                    onclick="event.stopPropagation(); window.pdfButtonHandler(${property.id}, event)"
                    title="Documentos do imóvel">
                <i class="fas fa-file-pdf"></i>
            </button>
        ` : '';
        
        // Se só tem uma imagem
        if (imageUrls.length <= 1) {
            return `
                <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                    <img src="${firstImageUrl}" 
                         style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                         alt="${property.title}"
                         onclick="window.galleryModule && window.galleryModule.openGallery(${property.id})"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                    
                    ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                    ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                    
                    ${imageUrls.length > 1 ? `
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; z-index: 5; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-images" style="font-size: 0.7rem;"></i>
                            <span>${imageUrls.length}</span>
                        </div>` : ''}
                    
                    ${pdfButtonHtml}
                </div>
            `;
        }
        
        // Se tem múltiplas imagens
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                <img src="${firstImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                     alt="${property.title}"
                     onclick="window.galleryModule && window.galleryModule.openGallery(${property.id})"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                
                ${imageUrls.length > 1 ? `
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; z-index: 5; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-images" style="font-size: 0.7rem;"></i>
                        <span>${imageUrls.length}</span>
                    </div>` : ''}
                
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                
                ${pdfButtonHtml}
            </div>
        `;
    };
    
    // ========== MÓDULO DA GALERIA ==========
    const galleryModule = {
        // Abrir galeria
        openGallery: function(propertyId) {
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
            
            // Usar variáveis existentes ou criar locais
            const currentGalleryImages = property.images.split(',').filter(url => url.trim() !== '');
            let currentGalleryIndex = 0;
            
            // Criar ou atualizar modal
            let galleryModal = document.getElementById('propertyGalleryModal');
            
            if (!galleryModal) {
                galleryModal = document.createElement('div');
                galleryModal.id = 'propertyGalleryModal';
                galleryModal.className = 'gallery-modal';
                galleryModal.innerHTML = `
                    <div class="gallery-modal-content">
                        <div class="gallery-swipe-area" 
                             ontouchstart="window.galleryModule.handleTouchStart(event)"
                             ontouchend="window.galleryModule.handleTouchEnd(event)"></div>
                        
                        <img id="galleryCurrentImage" class="gallery-modal-image" 
                             src="${currentGalleryImages[0]}"
                             alt="Imagem ${currentGalleryIndex + 1} de ${currentGalleryImages.length}">
                        
                        <div class="gallery-modal-controls">
                            <button class="gallery-modal-btn" onclick="window.galleryModule.prevImage()" 
                                    aria-label="Imagem anterior">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            
                            <div id="galleryCounter" class="gallery-counter">
                                ${currentGalleryIndex + 1} / ${currentGalleryImages.length}
                            </div>
                            
                            <button class="gallery-modal-btn" onclick="window.galleryModule.nextImage()" 
                                    aria-label="Próxima imagem">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        
                        <button class="gallery-modal-close" onclick="window.galleryModule.closeGallery()" 
                                aria-label="Fechar galeria">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                document.body.appendChild(galleryModal);
            } else {
                document.getElementById('galleryCurrentImage').src = currentGalleryImages[0];
                document.getElementById('galleryCounter').textContent = 
                    `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
            }
            
            // Armazenar dados no modal
            galleryModal.dataset.images = JSON.stringify(currentGalleryImages);
            galleryModal.dataset.currentIndex = currentGalleryIndex;
            
            // Mostrar modal
            galleryModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                const closeBtn = galleryModal.querySelector('.gallery-modal-close');
                if (closeBtn) closeBtn.focus();
            }, 100);
            
            SC.logModule('gallery', `✅ Galeria aberta com ${currentGalleryImages.length} imagens`);
        },
        
        // Fechar galeria
        closeGallery: function() {
            SC.logModule('gallery', '❌ Fechando galeria');
            
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (galleryModal) {
                galleryModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                galleryModal.removeAttribute('data-images');
                galleryModal.removeAttribute('data-current-index');
                
                SC.logModule('gallery', '✅ Galeria fechada');
            }
        },
        
        // Navegação
        nextImage: function() {
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (!galleryModal) return;
            
            const images = JSON.parse(galleryModal.dataset.images || '[]');
            if (images.length === 0) return;
            
            let currentIndex = parseInt(galleryModal.dataset.currentIndex || 0);
            currentIndex = (currentIndex + 1) % images.length;
            
            this.updateGalleryImage(galleryModal, images, currentIndex);
        },
        
        prevImage: function() {
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (!galleryModal) return;
            
            const images = JSON.parse(galleryModal.dataset.images || '[]');
            if (images.length === 0) return;
            
            let currentIndex = parseInt(galleryModal.dataset.currentIndex || 0);
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            
            this.updateGalleryImage(galleryModal, images, currentIndex);
        },
        
        // Atualizar imagem
        updateGalleryImage: function(galleryModal, images, index) {
            const imageElement = document.getElementById('galleryCurrentImage');
            const counterElement = document.getElementById('galleryCounter');
            
            if (imageElement && counterElement) {
                imageElement.src = images[index];
                counterElement.textContent = `${index + 1} / ${images.length}`;
                galleryModal.dataset.currentIndex = index;
                
                imageElement.style.opacity = '0';
                setTimeout(() => {
                    imageElement.style.opacity = '1';
                }, 50);
            }
        },
        
        // Touch handlers
        handleTouchStart: function(event) {
            galleryVars.touchStartX = event.changedTouches[0].screenX;
            event.stopPropagation();
        },
        
        handleTouchEnd: function(event) {
            galleryVars.touchEndX = event.changedTouches[0].screenX;
            this.handleSwipe();
            event.stopPropagation();
        },
        
        handleSwipe: function() {
            const diff = galleryVars.touchStartX - galleryVars.touchEndX;
            
            if (diff > galleryVars.SWIPE_THRESHOLD) {
                this.nextImage();
            } else if (diff < -galleryVars.SWIPE_THRESHOLD) {
                this.prevImage();
            }
        },
        
        // Keyboard handler
        handleGalleryKeyboard: function(event) {
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (!galleryModal || galleryModal.style.display !== 'block') return;
            
            switch(event.key) {
                case 'ArrowLeft':
                    this.prevImage();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    event.preventDefault();
                    break;
                case 'Escape':
                    this.closeGallery();
                    event.preventDefault();
                    break;
                case ' ':
                case 'Enter':
                    if (event.target.tagName !== 'BUTTON') {
                        event.preventDefault();
                    }
                    break;
            }
        },
        
        // Otimização mobile
        optimizeForMobile: function() {
            if (typeof window.isMobileDevice !== 'function' || !window.isMobileDevice()) return;
            
            SC.logModule('gallery', '📱 Otimizando galeria para mobile...');
            
            const galleryContainers = document.querySelectorAll('.property-gallery-container');
            galleryContainers.forEach(container => {
                container.style.height = '300px';
            });
            
            const galleryButtons = document.querySelectorAll('.gallery-modal-btn, .gallery-modal-close');
            galleryButtons.forEach(button => {
                button.style.minWidth = '50px';
                button.style.minHeight = '50px';
                button.style.fontSize = '1.5rem';
            });
        },
        
        // Setup events
        setupEvents: function() {
            SC.logModule('gallery', '🎮 Configurando eventos da galeria...');
            
            // Fechar ao clicar fora
            document.addEventListener('click', (event) => {
                const galleryModal = document.getElementById('propertyGalleryModal');
                if (galleryModal && galleryModal.style.display === 'block') {
                    if (event.target === galleryModal) {
                        this.closeGallery();
                    }
                }
            });
            
            // Keyboard
            document.addEventListener('keydown', (event) => {
                this.handleGalleryKeyboard(event);
            });
            
            // Touch
            document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
            
            // Prevenir zoom
            document.addEventListener('gesturestart', (event) => {
                const galleryModal = document.getElementById('propertyGalleryModal');
                if (galleryModal && galleryModal.style.display === 'block') {
                    event.preventDefault();
                }
            });
            
            SC.logModule('gallery', '✅ Eventos da galeria configurados');
        },
        
        // Inicialização
        initialize: function() {
            SC.logModule('gallery', '🚀 Inicializando módulo da galeria...');
            
            // Adicionar estilos
            const styleSheet = document.createElement("style");
            styleSheet.textContent = galleryStyles;
            document.head.appendChild(styleSheet);
            
            // Setup events
            this.setupEvents();
            
            // Otimizar para mobile
            setTimeout(() => {
                this.optimizeForMobile();
            }, 1000);
            
            SC.logModule('gallery', '✅ Módulo da galeria inicializado');
        }
    };

    // ========== CORREÇÃO DO BOTÃO PDF ==========
    // 🔴 CORREÇÃO SIMPLIFICADA: Handler direto para botão PDF
    window.pdfButtonHandler = function(propertyId, event) {
        console.log(`📄 Botão PDF clicado para imóvel ${propertyId}`);
        
        // 1. Prevenir comportamento padrão
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        
        // 2. Verificar se o sistema de PDFs está disponível
        if (typeof window.showPdfModal === 'function') {
            console.log('✅ Usando showPdfModal disponível');
            window.showPdfModal(propertyId);
            return false;
        }
        
        // 3. Fallback: Modal de senha simplificado
        console.log('⚠️ showPdfModal não encontrado, usando fallback');
        
        const property = window.properties?.find(p => p.id == propertyId);
        if (!property) {
            alert('❌ Imóvel não encontrado!');
            return false;
        }
        
        if (!property.pdfs || property.pdfs === 'EMPTY' || property.pdfs.trim() === '') {
            alert('ℹ️ Este imóvel não possui documentos PDF disponíveis.');
            return false;
        }
        
        // Modal de senha simplificado
        const password = prompt("🔒 Documentos do Imóvel\n\nDigite a senha para acessar os documentos:");
        
        if (password === null) {
            return false; // Usuário cancelou
        }
        
        if (password !== "doc123") {
            alert('❌ Senha incorreta!\n\nA senha correta é: doc123\n(Solicite ao corretor se não souber)');
            return false;
        }
        
        // Abrir PDFs
        const pdfUrls = property.pdfs.split(',')
            .map(url => url.trim())
            .filter(url => url && url !== 'EMPTY');
        
        if (pdfUrls.length > 0) {
            // Se só tem 1 PDF, abrir diretamente
            if (pdfUrls.length === 1) {
                window.open(pdfUrls[0], '_blank');
            } else {
                // Mostrar opções
                let message = "📄 Selecione o documento para abrir:\n\n";
                pdfUrls.forEach((url, index) => {
                    const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                    message += `${index + 1}. ${fileName}\n`;
                });
                
                const choice = prompt(message + "\nDigite o número do documento:");
                const index = parseInt(choice) - 1;
                
                if (index >= 0 && index < pdfUrls.length) {
                    window.open(pdfUrls[index], '_blank');
                }
            }
        }
        
        return false;
    };

    // ========== EXPORT DO MÓDULO ==========
    window.galleryModule = galleryModule;
    
    // Inicializar automaticamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            galleryModule.initialize();
        });
    } else {
        galleryModule.initialize();
    }
    
    SC.logModule('gallery', '✅ gallery.js completamente carregado (com correção do botão PDF)');

    // ========== INICIALIZAÇÃO SEGURA DO HANDLER PDF ==========
    // Garantir que a função está disponível globalmente
    if (typeof window.pdfButtonHandler === 'undefined') {
        // Já definido acima, mas garantir disponibilidade
        console.log('✅ pdfButtonHandler disponível globalmente');
    }
    
    // Teste rápido para verificar se o sistema está funcionando
    setTimeout(() => {
        console.log('🔍 Verificação do sistema PDF na galeria:');
        console.log('- pdfButtonHandler:', typeof window.pdfButtonHandler === 'function' ? '✅ Disponível' : '❌ Ausente');
        console.log('- showPdfModal:', typeof window.showPdfModal === 'function' ? '✅ Disponível' : '❌ Ausente');
        
        // Se showPdfModal não existe, criar um fallback mínimo
        if (typeof window.showPdfModal === 'undefined') {
            console.log('⚠️ Criando fallback mínimo para showPdfModal');
            window.showPdfModal = function(propertyId) {
                console.log('📄 showPdfModal (fallback) chamado');
                return window.pdfButtonHandler(propertyId, { preventDefault: () => {} });
            };
        }
    }, 2000);
    
})();
