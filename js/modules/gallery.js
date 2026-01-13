// js/modules/gallery.js - Sistema de galeria de fotos MOBILE FIRST
console.log('🚀 gallery.js carregado - Sistema de Galeria');

// ========== VARIÁVEIS GLOBAIS DA GALERIA ==========
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

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

// Função para criar a galeria no card do imóvel - USANDO showPdfModal
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
                <img src="${firstImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                     alt="${property.title}"
                     onclick="openGallery(${property.id})"
                     onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
                ${imageUrls.length > 0 ? `<div class="image-count">${imageUrls.length}</div>` : ''}
                
                <!-- BOTÃO PDF PARA IMAGEM ÚNICA - USANDO showPdfModal -->
                ${property.pdfs && property.pdfs !== 'EMPTY' ? 
                    `<button class="pdf-access"
                         onclick="event.stopPropagation(); event.preventDefault(); window.showPdfModal(${property.id})"
                         title="Documentos do imóvel (senha: doc123)">
                        <i class="fas fa-file-pdf"></i>
                    </button>` : ''}
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
                             onclick="event.stopPropagation(); showGalleryImage(${property.id}, ${index})"></div>
                    `).join('')}
                </div>
                
                <!-- Ícone de expansão -->
                <div class="gallery-expand-icon" onclick="event.stopPropagation(); openGallery(${property.id})">
                    <i class="fas fa-expand"></i>
                </div>
            </div>
            
            ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
            ${property.has_video ? `<div class="video-indicator"><i class="fas fa-video"></i> TEM VÍDEO</div>` : ''}
            
            <!-- BOTÃO PDF PARA MÚLTIPLAS IMAGENS - USANDO showPdfModal -->
            ${property.pdfs && property.pdfs !== 'EMPTY' ? 
                `<button class="pdf-access"
                     onclick="event.stopPropagation(); event.preventDefault(); window.showPdfModal(${property.id})"
                     title="Documentos do imóvel (senha: doc123)">
                    <i class="fas fa-file-pdf"></i>
                </button>` : ''}
        </div>
    `;
};

// Função para abrir a galeria (mantida igual)
window.openGallery = function(propertyId) {
