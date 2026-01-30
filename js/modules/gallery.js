// js/modules/gallery.js - Sistema de galeria de fotos MOBILE FIRST
console.log('🚀 gallery.js carregado - Sistema de Galeria (CSS otimizado)');

// ========== VARIÁVEIS GLOBAIS DA GALERIA ==========
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

// ========== FUNÇÕES BÁSICAS DA GALERIA ==========

// Função para criar a galeria no card do imóvel - VERSÃO CORRIGIDA
window.createPropertyGallery = function(property) {
    console.log('🖼️ Criando galeria para:', property.title);
    
    // Verificar se há imagens
    const hasImages = property.images && 
                     property.images.length > 0 && 
                     property.images !== 'EMPTY';
    
    const imageUrls = hasImages ? 
        property.images.split(',').filter(url => url.trim() !== '') : 
        [];
    
    const firstImageUrl = imageUrls.length > 0 ? 
        imageUrls[0] : 
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    
    // Se só tem uma imagem, mostrar imagem estática
    if (imageUrls.length <= 1) {
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                <div class="property-gallery-container" onclick="openGallery(${property.id})">
                    <img src="${firstImageUrl}" 
                         class="property-gallery-image"
                         alt="${property.title}"
                         onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                </div>
                
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                
                <!-- INDICADOR DE VÍDEO COM MESMA CLASSE DO TEMPLATE DE MÚLTIPLAS IMAGENS -->
                ${property.has_video ? `
                    <div class="video-indicator pulsing" style="
                        position: absolute;
                        top: 35px !important;
                        right: 10px !important;
                        background: rgba(0, 0, 0, 0.8);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        z-index: 9;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                        border: 1px solid rgba(255,255,255,0.3);
                        backdrop-filter: blur(5px);
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">
                        <i class="fas fa-video" style="color: #FFD700; font-size: 14px;"></i>
                        <span>TEM VÍDEO</span>
                    </div>
                ` : ''}
                
                <!-- BOTÃO PDF COM MESMA POSIÇÃO DO TEMPLATE DE MÚLTIPLAS IMAGENS -->
                ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                    `<button class="pdf-access" 
                            onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id})"
                            style="
                                position: absolute;
                                bottom: 10px;
                                right: 10px;
                                background: rgba(220, 53, 69, 0.9);
                                color: white;
                                border: none;
                                border-radius: 50%;
                                width: 40px;
                                height: 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                z-index: 8;
                                box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                                transition: all 0.3s ease;
                            "
                            title="Documentos do imóvel (senha: doc123)">
                        <i class="fas fa-file-pdf" style="font-size: 18px;"></i>
                    </button>` : ''}
                
                ${imageUrls.length > 0 ? `<div class="image-count">${imageUrls.length}</div>` : ''}
            </div>
        `;
    }
    
    // Se tem múltiplas imagens, criar galeria
    return `
        <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
            <div class="property-gallery-container" onclick="openGallery(${property.id})">
                <img src="${firstImageUrl}" 
                     class="property-gallery-image"
                     alt="${property.title}"
                     onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                
                <!-- Indicador de galeria MOBILE -->
                <div class="gallery-indicator-mobile">
                    <i class="fas fa-images"></i>
                    <span>${imageUrls.length}</span>
                </div>
                
                <!-- Pontos indicadores -->
                <div class="gallery-controls">
                    ${imageUrls.map((_, index) => `
                        <div class="gallery-dot ${index === 0 ? 'active' : ''}" 
                             data-index="${index}"
                             onclick="event.stopPropagation(); event.preventDefault(); showGalleryImage(${property.id}, ${index})"></div>
                    `).join('')}
                </div>
                
                <!-- Ícone de expansão -->
                <div class="gallery-expand-icon" onclick="event.stopPropagation(); openGallery(${property.id})">
                    <i class="fas fa-expand"></i>
                </div>
            </div>
            
            ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
            
            <!-- INDICADOR DE VÍDEO COM MESMA CLASSE DO TEMPLATE DE UMA IMAGEM -->
            ${property.has_video ? `
                <div class="video-indicator pulsing" style="
                    position: absolute;
                    top: 35px !important;
                    right: 10px !important;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    z-index: 9;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.3);
                    backdrop-filter: blur(5px);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">
                    <i class="fas fa-video" style="color: #FFD700; font-size: 14px;"></i>
                    <span>TEM VÍDEO</span>
                </div>
            ` : ''}
            
            <!-- Botão PDF COM ESTILO EXPLÍCITO (garantir consistência) -->
            ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                `<button class="pdf-access"
                    onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id});"
                    style="
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        background: rgba(220, 53, 69, 0.9);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        z-index: 8;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                        transition: all 0.3s ease;
                    "
                    title="Documentos do imóvel (senha: doc123)">
                    <i class="fas fa-file-pdf" style="font-size: 18px;"></i>
                </button>` : ''}
        </div>
    `;
};

// Função para abrir a galeria
window.openGallery = function(propertyId) {
    console.log('📸 Abrindo galeria para imóvel ID:', propertyId);
    
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado:', propertyId);
        return;
    }
    
    const hasImages = property.images && 
                     property.images.length > 0 && 
                     property.images !== 'EMPTY';
    
    if (!hasImages) {
        console.log('⚠️ Imóvel sem imagens para galeria');
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
    
    console.log('✅ Galeria aberta com', window.currentGalleryImages.length, 'imagens');
};

// Função para fechar a galeria
window.closeGallery = function() {
    console.log('❌ Fechando galeria');
    
    const galleryModal = document.getElementById('propertyGalleryModal');
    if (galleryModal) {
        galleryModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaurar scroll
        
        // Remover listener de teclado
        document.removeEventListener('keydown', window.handleGalleryKeyboard);
        
        // Limpar variáveis
        window.currentGalleryImages = [];
        window.currentGalleryIndex = 0;
        
        console.log('✅ Galeria fechada');
    }
};

// Função para mostrar imagem específica na galeria do card
window.showGalleryImage = function(propertyId, index) {
    console.log('🖼️ Mostrando imagem', index, 'do imóvel', propertyId);
    
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
        
        console.log('✅ Imagem atualizada no card');
    }
};

// Função para próxima imagem
window.nextGalleryImage = function() {
    if (window.currentGalleryImages.length === 0) return;
    
    window.currentGalleryIndex = (window.currentGalleryIndex + 1) % window.currentGalleryImages.length;
    window.updateGalleryModal();
    
    console.log('➡️ Próxima imagem:', window.currentGalleryIndex);
};

// Função para imagem anterior
window.prevGalleryImage = function() {
    if (window.currentGalleryImages.length === 0) return;
    
    window.currentGalleryIndex = (window.currentGalleryIndex - 1 + window.currentGalleryImages.length) % window.currentGalleryImages.length;
    window.updateGalleryModal();
    
    console.log('⬅️ Imagem anterior:', window.currentGalleryIndex);
};

// Função para atualizar o modal da galeria
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

// ========== FUNÇÕES TOUCH/SWIPE PARA MOBILE ==========

window.handleTouchStart = function(event) {
    window.touchStartX = event.changedTouches[0].screenX;
    event.stopPropagation();
    
    console.log('👆 Touch start:', window.touchStartX);
};

window.handleTouchEnd = function(event) {
    window.touchEndX = event.changedTouches[0].screenX;
    window.handleSwipe();
    event.stopPropagation();
    
    console.log('👇 Touch end:', window.touchEndX);
};

window.handleSwipe = function() {
    const diff = window.touchStartX - window.touchEndX;
    console.log('🔄 Swipe diff:', diff);
    
    // Swipe esquerda (próxima imagem)
    if (diff > window.SWIPE_THRESHOLD) {
        console.log('⬅️ Swipe esquerda detectado');
        window.nextGalleryImage();
    }
    // Swipe direita (imagem anterior)
    else if (diff < -window.SWIPE_THRESHOLD) {
        console.log('➡️ Swipe direita detectado');
        window.prevGalleryImage();
    }
};

// ========== SUPORTE A TECLADO ==========

window.handleGalleryKeyboard = function(event) {
    const galleryModal = document.getElementById('propertyGalleryModal');
    if (!galleryModal || galleryModal.style.display !== 'block') return;
    
    console.log('⌨️ Tecla pressionada:', event.key);
    
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
    console.log('🎮 Configurando eventos da galeria...');
    
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
    
    console.log('✅ Eventos da galeria configurados');
};

// ========== OTIMIZAÇÃO MOBILE ==========

window.optimizeGalleryForMobile = function() {
    if (!window.isMobileDevice || !window.isMobileDevice()) return;
    
    console.log('📱 Otimizando galeria para mobile...');
    
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
    
    console.log('✅ Galeria otimizada para mobile');
};

// ========== VERIFICAÇÃO DE INTEGRIDADE ==========

window.validateGalleryModule = function() {
    console.log('🔍 Validação básica da galeria (core)...');
    
    // Se ValidationSystem disponível, delega para ele
    if (window.ValidationSystem && typeof window.ValidationSystem.validateGalleryModule === 'function') {
        return window.ValidationSystem.validateGalleryModule();
    }
    
    // Fallback mínimo no core
    const basicChecks = {
        'openGallery': typeof window.openGallery === 'function',
        'closeGallery': typeof window.closeGallery === 'function',
        'currentGalleryImages': Array.isArray(window.currentGalleryImages)
    };
    
    const allValid = Object.values(basicChecks).every(check => check === true);
    console.log(allValid ? '✅ Galeria OK' : '⚠️ Galeria com problemas');
    
    return allValid;
};

// ========== INICIALIZAÇÃO AUTOMÁTICA (OPCIONAL) ==========

window.initializeGalleryModule = function() {
    console.log('🚀 Inicializando módulo da galeria...');
    
    // NOTA: Estilos agora são carregados somente pelo gallery.css
    // window.galleryStyles foi REMOVIDO para eliminar duplicação
    
    // Configurar eventos da galeria
    window.setupGalleryEvents();
    
    // Otimizar para mobile se necessário
    setTimeout(() => {
        if (window.isMobileDevice && window.isMobileDevice()) {
            window.optimizeGalleryForMobile();
        }
    }, 1000);
    
    // Validar módulo
    setTimeout(window.validateGalleryModule, 500);
    
    console.log('✅ Módulo da galeria inicializado (CSS otimizado)');
};

// ========== VERIFICAÇÃO DE CSS (NOVA ADIÇÃO) ==========

setTimeout(() => {
    console.group('🔍 VERIFICAÇÃO DE CSS DA GALERIA');
    console.log('✅ CSS carregado externamente:', !!document.querySelector('link[href*="gallery.css"]'));
    console.log('✅ Estilos inline removidos:', !window.galleryStyles);
    
    // Teste de seletor crítico
    const testElement = document.createElement('div');
    testElement.className = 'video-indicator';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    console.log('✅ video-indicator tem top 35px?', computedStyle.top.includes('35'));
    
    testElement.remove();
    console.groupEnd();
}, 1000);

// ========== EXPORT DO MÓDULO ==========
console.log('✅ gallery.js completamente carregado e pronto (CSS otimizado)');
