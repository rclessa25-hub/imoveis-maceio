// js/modules/reader/pdf-unified.js - SISTEMA UNIFICADO DE PDF READER

// ========== CONFIGURAÇÃO SHAREDCORE ==========
const SC = window.SharedCore;

SC.logModule('pdf-system', '🔄 pdf-unified.js carregado - Sistema Centralizado PDF');

/**
 * SISTEMA UNIFICADO DE PDF READER - VERSÃO OTIMIZADA
 * Responsabilidade única: Gerenciar visualização, zoom e interação com PDFs
 */

const PdfSystem = {
    // ========== CONFIGURAÇÃO ==========
    config: {
        zoomLevels: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
        defaultZoom: 1.0,
        maxZoom: 3.0,
        minZoom: 0.25,
        pdfWorkerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
        pdfJsSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    },

    // ========== ESTADO GLOBAL ==========
    state: {
        currentPdfUrl: null,
        currentPdfDoc: null,
        currentPage: 1,
        totalPages: 0,
        zoomLevel: 1.0,
        isRendering: false,
        isInitialized: false,
        pdfViewer: null,
        currentPropertyId: null
    },

    // ========== INICIALIZAÇÃO ==========
    init() {
        SC.logModule('pdf-system', '🔧 Inicializando sistema de PDF Reader');
        
        if (this.state.isInitialized) {
            SC.logModule('pdf-system', '⚠️ PdfSystem já inicializado');
            return this;
        }
        
        // Carregar PDF.js dinamicamente se não estiver disponível
        if (typeof window.pdfjsLib === 'undefined') {
            SC.logModule('pdf-system', '📦 Carregando PDF.js dinamicamente...');
            this.loadPdfJs().then(() => {
                this.finishInitialization();
            }).catch(error => {
                SC.logModule('pdf-system', `❌ Erro ao carregar PDF.js: ${error.message}`);
                this.setupFallbackMode();
            });
        } else {
            this.finishInitialization();
        }
        
        return this;
    },

    async loadPdfJs() {
        return new Promise((resolve, reject) => {
            // Carregar script principal
            const script = document.createElement('script');
            script.src = this.config.pdfJsSrc;
            script.onload = () => {
                // Configurar worker
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = this.config.pdfWorkerSrc;
                    SC.logModule('pdf-system', '✅ PDF.js carregado com sucesso');
                    resolve();
                } else {
                    reject(new Error('PDF.js não carregou corretamente'));
                }
            };
            script.onerror = () => reject(new Error('Falha ao carregar PDF.js'));
            document.head.appendChild(script);
        });
    },

    finishInitialization() {
        SC.logModule('pdf-system', '🎯 Finalizando inicialização do PDF System');
        
        this.state.isInitialized = true;
        this.setupEventListeners();
        this.createPdfViewer();
        
        // Inicialização independente - SEM DEPENDER DE MEDIASYSTEM
        setTimeout(() => {
            this.checkPdfElements();
        }, 100);
        
        SC.logModule('pdf-system', '✅ PdfSystem inicializado independentemente');
    },

    setupFallbackMode() {
        SC.logModule('pdf-system', '🔄 Configurando modo fallback para PDF');
        
        this.state.isInitialized = true;
        
        // Fallback básico para visualização
        window.PdfSystem = {
            showModal: function(propertyId, pdfUrl = null) {
                if (pdfUrl) {
                    window.open(pdfUrl, '_blank');
                } else {
                    alert('Sistema PDF em manutenção. Tente novamente em instantes.');
                }
            },
            loadPdf: function() {
                alert('Funcionalidade PDF temporariamente indisponível.');
            }
        };
        
        SC.logModule('pdf-system', '✅ Modo fallback ativado');
    },

    // ========== INICIALIZAÇÃO INDEPENDENTE ==========
    
    // Inicialização independente (NÃO depende mais de MediaSystem)
    if (!window.pdfSystemInitialized) {
        window.pdfSystemInitialized = false;
        
        const initPdfSystem = function() {
            if (window.pdfSystemInitialized) return;
            if (typeof window.PdfSystem !== 'undefined') {
                try {
                    window.PdfSystem.init();
                    window.pdfSystemInitialized = true;
                    SC.logModule('pdf', '✅ PdfSystem inicializado independentemente');
                } catch (error) {
                    SC.logModule('pdf', `❌ Erro na inicialização: ${error.message}`);
                    // Forçar inicialização básica
                    window.PdfSystem = window.PdfSystem || {
                        showModal: function(propertyId) {
                            alert('Sistema PDF em manutenção. Tente novamente em instantes.');
                        }
                    };
                }
            }
        };
        
        // Inicializar independentemente - SEM DEPENDER DE MEDIASYSTEM
        setTimeout(initPdfSystem, 100);
    }

    // ========== GERENCIAMENTO DE PDFs ==========
    
    showModal(propertyId, pdfUrl = null) {
        SC.logModule('pdf-modal', `📄 Abrindo modal para propriedade: ${propertyId}`);
        
        this.state.currentPropertyId = propertyId;
        
        if (pdfUrl) {
            this.state.currentPdfUrl = pdfUrl;
        } else {
            // Buscar PDFs da propriedade
            this.loadPropertyPdfs(propertyId);
        }
        
        this.openPdfModal();
        return this;
    },

    async loadPropertyPdfs(propertyId) {
        try {
            SC.logModule('pdf-load', `📚 Carregando PDFs da propriedade: ${propertyId}`);
            
            // Buscar dados da propriedade
            const response = await fetch(`/api/properties/${propertyId}`);
            if (!response.ok) throw new Error('Falha ao buscar propriedade');
            
            const property = await response.json();
            
            if (property.pdfs && property.pdfs !== 'EMPTY') {
                const pdfUrls = property.pdfs.split(',')
                    .map(url => url.trim())
                    .filter(url => url && url !== 'EMPTY');
                
                if (pdfUrls.length > 0) {
                    this.state.currentPdfUrl = pdfUrls[0];
                    this.populatePdfList(pdfUrls);
                }
            }
        } catch (error) {
            SC.logModule('pdf-load', `❌ Erro ao carregar PDFs: ${error.message}`);
        }
    },

    populatePdfList(pdfUrls) {
        const pdfList = document.getElementById('pdfList');
        if (!pdfList) return;
        
        pdfList.innerHTML = '';
        
        pdfUrls.forEach((url, index) => {
            const fileName = this.extractFileName(url);
            const listItem = document.createElement('div');
            listItem.className = 'pdf-list-item';
            listItem.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <span>${fileName}</span>
                <button onclick="PdfSystem.loadPdfFromUrl('${url}')">
                    Abrir
                </button>
            `;
            pdfList.appendChild(listItem);
        });
    },

    async loadPdfFromUrl(pdfUrl) {
        SC.logModule('pdf-load', `📥 Carregando PDF: ${pdfUrl.substring(0, 50)}...`);
        
        try {
            this.state.currentPdfUrl = pdfUrl;
            this.state.isRendering = true;
            
            // Mostrar loader
            this.showLoader();
            
            // Carregar documento PDF
            const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
            const pdfDoc = await loadingTask.promise;
            
            this.state.currentPdfDoc = pdfDoc;
            this.state.totalPages = pdfDoc.numPages;
            this.state.currentPage = 1;
            
            SC.logModule('pdf-load', `✅ PDF carregado: ${this.state.totalPages} páginas`);
            
            // Renderizar primeira página
            await this.renderPage(1);
            
            // Atualizar controles
            this.updateControls();
            
        } catch (error) {
            SC.logModule('pdf-load', `❌ Erro ao carregar PDF: ${error.message}`);
            alert('Erro ao carregar PDF. Verifique se o arquivo está acessível.');
        } finally {
            this.state.isRendering = false;
            this.hideLoader();
        }
    },

    async renderPage(pageNumber) {
        if (!this.state.currentPdfDoc || this.state.isRendering) return;
        
        try {
            this.state.isRendering = true;
            this.state.currentPage = Math.max(1, Math.min(pageNumber, this.state.totalPages));
            
            const page = await this.state.currentPdfDoc.getPage(this.state.currentPage);
            
            // Configurar viewport com zoom
            const viewport = page.getViewport({ scale: this.state.zoomLevel });
            
            // Configurar canvas
            const canvas = document.getElementById('pdfCanvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Renderizar página
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            SC.logModule('pdf-render', `🖼️ Página ${this.state.currentPage}/${this.state.totalPages} renderizada`);
            
        } catch (error) {
            SC.logModule('pdf-render', `❌ Erro ao renderizar página: ${error.message}`);
        } finally {
            this.state.isRendering = false;
        }
    },

    // ========== CONTROLES DE NAVEGAÇÃO ==========
    
    zoomIn() {
        const currentIndex = this.config.zoomLevels.indexOf(this.state.zoomLevel);
        if (currentIndex < this.config.zoomLevels.length - 1) {
            this.state.zoomLevel = this.config.zoomLevels[currentIndex + 1];
            this.applyZoom();
        }
    },

    zoomOut() {
        const currentIndex = this.config.zoomLevels.indexOf(this.state.zoomLevel);
        if (currentIndex > 0) {
            this.state.zoomLevel = this.config.zoomLevels[currentIndex - 1];
            this.applyZoom();
        }
    },

    applyZoom() {
        SC.logModule('pdf-zoom', `🔍 Aplicando zoom: ${this.state.zoomLevel}x`);
        
        const canvas = document.getElementById('pdfCanvas');
        if (canvas && this.state.currentPdfDoc) {
            // Re-renderizar página com novo zoom
            this.renderPage(this.state.currentPage);
        }
        
        // Atualizar indicador de zoom
        const zoomIndicator = document.getElementById('pdfZoomLevel');
        if (zoomIndicator) {
            zoomIndicator.textContent = `${Math.round(this.state.zoomLevel * 100)}%`;
        }
    },

    nextPage() {
        if (this.state.currentPage < this.state.totalPages) {
            this.renderPage(this.state.currentPage + 1);
            this.updateControls();
        }
    },

    prevPage() {
        if (this.state.currentPage > 1) {
            this.renderPage(this.state.currentPage - 1);
            this.updateControls();
        }
    },

    goToPage(pageNumber) {
        const page = parseInt(pageNumber);
        if (!isNaN(page) && page >= 1 && page <= this.state.totalPages) {
            this.renderPage(page);
            this.updateControls();
        }
    },

    updateControls() {
        // Atualizar página atual
        const pageInput = document.getElementById('pdfCurrentPage');
        if (pageInput) {
            pageInput.value = this.state.currentPage;
            pageInput.max = this.state.totalPages;
        }
        
        // Atualizar total de páginas
        const totalPages = document.getElementById('pdfTotalPages');
        if (totalPages) {
            totalPages.textContent = this.state.totalPages;
        }
        
        // Atualizar botões de navegação
        const prevBtn = document.getElementById('pdfPrevPage');
        const nextBtn = document.getElementById('pdfNextPage');
        
        if (prevBtn) prevBtn.disabled = this.state.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.state.currentPage >= this.state.totalPages;
    },

    // ========== UI E MODAL ==========
    
    openPdfModal() {
        // Criar modal se não existir
        if (!document.getElementById('pdfModal')) {
            this.createPdfModal();
        }
        
        const modal = document.getElementById('pdfModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Se já temos um PDF, carregá-lo
            if (this.state.currentPdfUrl) {
                setTimeout(() => {
                    this.loadPdfFromUrl(this.state.currentPdfUrl);
                }, 100);
            }
        }
    },

    closePdfModal() {
        const modal = document.getElementById('pdfModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Limpar estado
        this.state.currentPdfDoc = null;
        this.state.currentPdfUrl = null;
        this.state.currentPage = 1;
        this.state.totalPages = 0;
        
        // Limpar canvas
        const canvas = document.getElementById('pdfCanvas');
        if (canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    createPdfModal() {
        const modalHTML = `
            <div id="pdfModal" class="pdf-modal" style="display:none;">
                <div class="pdf-modal-content">
                    <div class="pdf-modal-header">
                        <h3>
                            <i class="fas fa-file-pdf"></i>
                            Visualizador de PDF
                        </h3>
                        <button class="pdf-modal-close" onclick="PdfSystem.closePdfModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="pdf-modal-body">
                        <div class="pdf-toolbar">
                            <div class="pdf-toolbar-group">
                                <button id="pdfPrevPage" onclick="PdfSystem.prevPage()">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                
                                <div class="pdf-page-info">
                                    <input type="number" id="pdfCurrentPage" 
                                           min="1" 
                                           onchange="PdfSystem.goToPage(this.value)">
                                    <span>/</span>
                                    <span id="pdfTotalPages">1</span>
                                </div>
                                
                                <button id="pdfNextPage" onclick="PdfSystem.nextPage()">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            
                            <div class="pdf-toolbar-group">
                                <button onclick="PdfSystem.zoomOut()">
                                    <i class="fas fa-search-minus"></i>
                                </button>
                                <span id="pdfZoomLevel">100%</span>
                                <button onclick="PdfSystem.zoomIn()">
                                    <i class="fas fa-search-plus"></i>
                                </button>
                            </div>
                            
                            <div class="pdf-toolbar-group">
                                <button onclick="window.open(PdfSystem.state.currentPdfUrl, '_blank')">
                                    <i class="fas fa-external-link-alt"></i> Abrir em nova aba
                                </button>
                                <button onclick="PdfSystem.downloadPdf()">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <div class="pdf-viewer-container">
                            <div class="pdf-loader" id="pdfLoader">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Carregando PDF...</p>
                            </div>
                            
                            <canvas id="pdfCanvas"></canvas>
                        </div>
                        
                        <div class="pdf-sidebar" id="pdfSidebar">
                            <h4><i class="fas fa-list"></i> PDFs Disponíveis</h4>
                            <div id="pdfList" class="pdf-list">
                                <p class="pdf-empty">Nenhum PDF disponível</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar estilos CSS
        this.addPdfStyles();
        
        // Adicionar modal ao body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    addPdfStyles() {
        const styleId = 'pdf-system-styles';
        if (document.getElementById(styleId)) return;
        
        const styles = `
            <style id="${styleId}">
                .pdf-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .pdf-modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 95%;
                    height: 90%;
                    max-width: 1400px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .pdf-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    background: #2c3e50;
                    color: white;
                }
                
                .pdf-modal-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .pdf-modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                
                .pdf-modal-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .pdf-modal-body {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .pdf-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.8rem 1.5rem;
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .pdf-toolbar-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .pdf-toolbar button {
                    background: white;
                    border: 1px solid #ced4da;
                    padding: 0.4rem 0.8rem;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                
                .pdf-toolbar button:hover {
                    background: #e9ecef;
                    border-color: #adb5bd;
                }
                
                .pdf-toolbar button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .pdf-page-info {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.9rem;
                }
                
                #pdfCurrentPage {
                    width: 60px;
                    padding: 0.3rem;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    text-align: center;
                }
                
                .pdf-viewer-container {
                    flex: 1;
                    position: relative;
                    overflow: auto;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    padding: 2rem;
                    background: #4a5568;
                }
                
                .pdf-loader {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: white;
                    z-index: 10;
                }
                
                .pdf-loader i {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                }
                
                #pdfCanvas {
                    max-width: 100%;
                    height: auto;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    background: white;
                }
                
                .pdf-sidebar {
                    width: 300px;
                    background: #f8f9fa;
                    border-left: 1px solid #dee2e6;
                    padding: 1rem;
                    overflow-y: auto;
                    display: none;
                }
                
                .pdf-sidebar h4 {
                    margin-top: 0;
                    margin-bottom: 1rem;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .pdf-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .pdf-list-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.7rem;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                
                .pdf-list-item:hover {
                    border-color: #3498db;
                    background: #e8f4fc;
                }
                
                .pdf-list-item i {
                    color: #e74c3c;
                    margin-right: 0.5rem;
                }
                
                .pdf-list-item span {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.9rem;
                }
                
                .pdf-list-item button {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 0.3rem 0.6rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8rem;
                }
                
                .pdf-empty {
                    text-align: center;
                    color: #95a5a6;
                    font-style: italic;
                    padding: 1rem;
                }
                
                @media (min-width: 1200px) {
                    .pdf-modal-body {
                        flex-direction: row;
                    }
                    
                    .pdf-sidebar {
                        display: block;
                    }
                }
                
                @media (max-width: 768px) {
                    .pdf-toolbar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .pdf-toolbar-group {
                        justify-content: center;
                    }
                    
                    .pdf-viewer-container {
                        padding: 1rem;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    },

    createPdfViewer() {
        SC.logModule('pdf-system', '🎨 Criando visualizador de PDF');
        
        // Apenas cria elementos básicos, o modal será criado sob demanda
    },

    showLoader() {
        const loader = document.getElementById('pdfLoader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader() {
        const loader = document.getElementById('pdfLoader');
        if (loader) loader.style.display = 'none';
    },

    // ========== UTILITIES ==========
    
    extractFileName(url) {
        if (!url) return 'Documento PDF';
        const parts = url.split('/');
        let fileName = parts[parts.length - 1] || 'documento.pdf';
        try { fileName = decodeURIComponent(fileName); } catch (e) {}
        fileName = fileName.replace(/\.[^/.]+$/, ''); // Remover extensão
        return fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
    },

    downloadPdf() {
        if (!this.state.currentPdfUrl) return;
        
        const link = document.createElement('a');
        link.href = this.state.currentPdfUrl;
        link.download = this.extractFileName(this.state.currentPdfUrl) + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    checkPdfElements() {
        SC.logModule('pdf-system', '🔍 Verificando elementos PDF na página...');
        
        // Verificar botões de visualização PDF
        const pdfButtons = document.querySelectorAll('[data-pdf-preview]');
        pdfButtons.forEach(button => {
            if (!button.dataset.pdfListenerAdded) {
                const propertyId = button.dataset.propertyId || button.closest('[data-property-id]')?.dataset.propertyId;
                const pdfUrl = button.dataset.pdfUrl;
                
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showModal(propertyId, pdfUrl);
                });
                
                button.dataset.pdfListenerAdded = 'true';
                SC.logModule('pdf-system', `✅ Listener adicionado ao botão PDF: ${propertyId}`);
            }
        });
    },

    setupEventListeners() {
        SC.logModule('pdf-system', '🔧 Configurando event listeners...');
        
        // Verificar elementos periodicamente
        setInterval(() => {
            this.checkPdfElements();
        }, 2000);
        
        // Configurar teclas de navegação
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('pdfModal');
            if (!modal || modal.style.display !== 'flex') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevPage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextPage();
                    break;
                case 'Escape':
                    this.closePdfModal();
                    break;
                case '+':
                case '=':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.zoomIn();
                    }
                    break;
                case '-':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.zoomOut();
                    }
                    break;
            }
        });
        
        // Configurar clique fora do modal para fechar
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('pdfModal');
            if (modal && modal.style.display === 'flex' && e.target === modal) {
                this.closePdfModal();
            }
        });
    }
};

// Exportar para window
window.PdfSystem = PdfSystem;

// ========== AUTO-INICIALIZAÇÃO ==========
setTimeout(() => {
    if (!window.pdfSystemInitialized && window.PdfSystem) {
        try {
            window.PdfSystem.init();
            window.pdfSystemInitialized = true;
            SC.logModule('pdf', '✅ PdfSystem auto-inicializado');
        } catch (error) {
            SC.logModule('pdf', `❌ Erro na auto-inicialização: ${error.message}`);
        }
    }
}, 500);

// ========== COMPATIBILIDADE ==========

// Função de compatibilidade para módulos antigos
if (typeof window.showPdfModal === 'undefined') {
    window.showPdfModal = function(propertyId, pdfUrl) {
        SC.logModule('pdf-compat', '🔌 showPdfModal chamada (compatibilidade)');
        return PdfSystem ? PdfSystem.showModal(propertyId, pdfUrl) : null;
    };
}

// ========== VERIFICAÇÃO SHAREDCORE ==========
setTimeout(() => {
    if (!SC) {
        console.warn('❌ SharedCore não carregado no PdfSystem!');
        window.SharedCore = window.SharedCore || {
            logModule: (module, msg) => console.log(`[${module}] ${msg}`)
        };
    }
}, 1000);

SC.logModule('pdf-system', '✅ Sistema de PDF unificado pronto com inicialização independente');
