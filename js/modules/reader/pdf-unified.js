// js/modules/pdf/pdf-unified.js - SISTEMA DE PDF UNIFICADO (ADMIN + CLIENTE)
const SC = window.SharedCore || {
    logModule: (mod, msg) => console.log(`[${mod}] ${msg}`)
};

SC.logModule('pdf', '📄 pdf-unified.js carregado - Sistema de PDF Unificado');

// ========== CONFIGURAÇÃO DO SISTEMA ==========
window.PdfSystem = {
    // Configurações
    config: {
        isAdmin: window.location.pathname.includes('/admin/'),
        currentSystem: 'vendas',
        maxPdfSize: 10 * 1024 * 1024, // 10MB
        defaultPassword: 'doc123'
    },
    
    // Estado
    state: {
        isInitialized: false,
        currentProperty: null,
        selectedPdfs: [],
        isUploading: false
    },
    
    // ========== INICIALIZAÇÃO ==========
    init: function(system = 'vendas') {
        if (this.state.isInitialized) {
            SC.logModule('pdf', '⚠️ PdfSystem já inicializado');
            return this;
        }
        
        this.config.currentSystem = system;
        this.state.isInitialized = true;
        
        // Adicionar estilos
        this.addStyles();
        
        // Configurar eventos se for admin
        if (this.config.isAdmin) {
            this.setupAdminEvents();
            SC.logModule('pdf', '🔧 PdfSystem inicializado no modo ADMIN');
        } else {
            // Modo cliente - configurar modal de visualização
            this.setupClientModal();
            SC.logModule('pdf', '👁️ PdfSystem inicializado no modo CLIENTE');
        }
        
        // Expor showModal globalmente
        if (!window.showPdfModal) {
            window.showPdfModal = (propertyId) => this.showModal(propertyId);
            SC.logModule('pdf', '✅ showPdfModal exposto globalmente');
        }
        
        return this;
    },
    
    // ========== MODO CLIENTE - VISUALIZAÇÃO ==========
    setupClientModal: function() {
        // Criar modal de visualização de PDFs se não existir
        if (!document.getElementById('pdfViewerModal')) {
            const modalHTML = `
                <div id="pdfViewerModal" class="pdf-modal" style="display:none;">
                    <div class="pdf-modal-content">
                        <div class="pdf-modal-header">
                            <h3 id="pdfModalTitle">Documentos do Imóvel</h3>
                            <button class="pdf-modal-close" onclick="PdfSystem.closeModal()">&times;</button>
                        </div>
                        <div class="pdf-modal-body">
                            <div id="pdfPasswordSection">
                                <div class="password-input-group">
                                    <label for="pdfPassword">Senha de acesso:</label>
                                    <input type="password" id="pdfPassword" placeholder="Digite a senha" />
                                    <button onclick="PdfSystem.checkPassword()">Acessar</button>
                                </div>
                                <p class="password-hint">Senha padrão: <code>doc123</code></p>
                            </div>
                            <div id="pdfListSection" style="display:none;">
                                <div class="pdf-list">
                                    <!-- PDFs serão listados aqui -->
                                </div>
                            </div>
                            <div id="pdfErrorSection" style="display:none;color:#e74c3c;text-align:center;padding:2rem;">
                                <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:1rem;"></i>
                                <p>Nenhum documento disponível para este imóvel.</p>
                            </div>
                        </div>
                        <div class="pdf-modal-footer">
                            <button onclick="PdfSystem.closeModal()">Fechar</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar estilos
            const styles = `
                .pdf-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.85);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                
                .pdf-modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                
                .pdf-modal-header {
                    background: #2c3e50;
                    color: white;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .pdf-modal-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                
                .pdf-modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 2rem;
                    cursor: pointer;
                    line-height: 1;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .pdf-modal-body {
                    padding: 2rem;
                    max-height: 50vh;
                    overflow-y: auto;
                }
                
                .password-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .password-input-group label {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .password-input-group input {
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    font-size: 1rem;
                }
                
                .password-input-group button {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                
                .password-input-group button:hover {
                    background: #2980b9;
                }
                
                .password-hint {
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 0.9rem;
                    margin-top: 1rem;
                }
                
                .pdf-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .pdf-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                    transition: all 0.3s;
                    cursor: pointer;
                }
                
                .pdf-item:hover {
                    background: #e3f2fd;
                    border-color: #3498db;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
                }
                
                .pdf-icon {
                    background: #e74c3c;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    margin-right: 1rem;
                    flex-shrink: 0;
                }
                
                .pdf-info {
                    flex: 1;
                }
                
                .pdf-name {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.25rem;
                }
                
                .pdf-size {
                    font-size: 0.85rem;
                    color: #7f8c8d;
                }
                
                .pdf-download-btn {
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                
                .pdf-download-btn:hover {
                    background: #219653;
                }
                
                .pdf-modal-footer {
                    padding: 1.5rem;
                    background: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                    text-align: right;
                }
                
                .pdf-modal-footer button {
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                }
                
                .pdf-modal-footer button:hover {
                    background: #7f8c8d;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @media (max-width: 768px) {
                    .pdf-modal-content {
                        width: 95%;
                    }
                    
                    .pdf-modal-body {
                        padding: 1rem;
                    }
                    
                    .password-input-group {
                        flex-direction: column;
                    }
                }
            `;
            
            document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    },
    
    // ========== API PÚBLICA - MODO CLIENTE ==========
    showModal: function(propertyId) {
        SC.logModule('pdf', `📄 showModal chamado para propertyId: ${propertyId}`);
        
        // Encontrar a propriedade
        const property = window.properties?.find(p => p.id == propertyId);
        if (!property) {
            alert('❌ Imóvel não encontrado!');
            return;
        }
        
        this.state.currentProperty = property;
        
        // Verificar se há PDFs
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY';
        if (!hasPdfs) {
            this.showError('Este imóvel não possui documentos disponíveis.');
            return;
        }
        
        // Mostrar modal
        const modal = document.getElementById('pdfViewerModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('pdfModalTitle').textContent = `Documentos - ${property.title}`;
            
            // Mostrar seção de senha
            document.getElementById('pdfPasswordSection').style.display = 'block';
            document.getElementById('pdfListSection').style.display = 'none';
            document.getElementById('pdfErrorSection').style.display = 'none';
            
            // Focar no input de senha
            setTimeout(() => {
                const passwordInput = document.getElementById('pdfPassword');
                if (passwordInput) passwordInput.focus();
            }, 100);
        } else {
            // Fallback se modal não existir
            this.showPasswordPrompt(property);
        }
        
        return this;
    },
    
    closeModal: function() {
        const modal = document.getElementById('pdfViewerModal');
        if (modal) {
            modal.style.display = 'none';
            // Limpar senha
            const passwordInput = document.getElementById('pdfPassword');
            if (passwordInput) passwordInput.value = '';
        }
        this.state.currentProperty = null;
    },
    
    checkPassword: function() {
        const passwordInput = document.getElementById('pdfPassword');
        const password = passwordInput?.value;
        
        if (password === this.config.defaultPassword) {
            this.showPdfList();
        } else {
            alert('❌ Senha incorreta! A senha padrão é: doc123');
            passwordInput.focus();
            passwordInput.select();
        }
    },
    
    showPdfList: function() {
        if (!this.state.currentProperty) return;
        
        const pdfUrls = this.state.currentProperty.pdfs
            .split(',')
            .map(url => url.trim())
            .filter(url => url && url !== 'EMPTY');
        
        if (pdfUrls.length === 0) {
            this.showError('Nenhum documento disponível.');
            return;
        }
        
        // Esconder seção de senha, mostrar lista
        document.getElementById('pdfPasswordSection').style.display = 'none';
        document.getElementById('pdfListSection').style.display = 'block';
        
        // Gerar lista de PDFs
        const pdfList = document.querySelector('#pdfListSection .pdf-list');
        if (pdfList) {
            pdfList.innerHTML = pdfUrls.map((url, index) => {
                const fileName = this.extractFileName(url);
                const fileSize = this.formatFileSize(0); // Tamanho não disponível
                
                return `
                    <div class="pdf-item" onclick="PdfSystem.openPdf('${url}')">
                        <div class="pdf-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="pdf-info">
                            <div class="pdf-name">${fileName}</div>
                            <div class="pdf-size">Documento PDF</div>
                        </div>
                        <button class="pdf-download-btn" onclick="event.stopPropagation(); window.open('${url}', '_blank')">
                            <i class="fas fa-download"></i> Abrir
                        </button>
                    </div>
                `;
            }).join('');
        }
    },
    
    openPdf: function(url) {
        window.open(url, '_blank');
    },
    
    showError: function(message) {
        const errorSection = document.getElementById('pdfErrorSection');
        if (errorSection) {
            errorSection.style.display = 'block';
            errorSection.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:1rem;"></i>
                <p>${message}</p>
            `;
            document.getElementById('pdfPasswordSection').style.display = 'none';
            document.getElementById('pdfListSection').style.display = 'none';
        } else {
            alert(message);
        }
    },
    
    // Fallback para modal não criado
    showPasswordPrompt: function(property) {
        const password = prompt("🔒 Documentos do Imóvel\n\nDigite a senha para acessar os documentos:");
        if (password === this.config.defaultPassword) {
            const pdfUrls = property.pdfs
                .split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            if (pdfUrls.length > 0) {
                if (pdfUrls.length === 1) {
                    window.open(pdfUrls[0], '_blank');
                } else {
                    const choice = prompt(`Escolha um documento (1-${pdfUrls.length}):\n\n` +
                        pdfUrls.map((url, i) => `${i + 1}. ${url.split('/').pop()}`).join('\n'));
                    const index = parseInt(choice) - 1;
                    
                    if (index >= 0 && index < pdfUrls.length) {
                        window.open(pdfUrls[index], '_blank');
                    }
                }
            }
        } else if (password !== null) {
            alert('❌ Senha incorreta! A senha é: doc123');
        }
    },
    
    // ========== MODO ADMIN ==========
    setupAdminEvents: function() {
        // Configurações específicas do admin
        SC.logModule('pdf', '⚙️ Configurando eventos do modo admin');
        
        // Adicionar estilos específicos do admin
        const adminStyles = `
            .pdf-admin-preview {
                border: 2px dashed #3498db;
                padding: 1.5rem;
                border-radius: 8px;
                background: #f8f9fa;
                margin-top: 1rem;
            }
            
            .pdf-admin-list {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .pdf-admin-item {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 1rem;
                width: 150px;
                text-align: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                position: relative;
            }
            
            .pdf-admin-item .remove-btn {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 14px;
                cursor: pointer;
            }
        `;
        
        document.head.insertAdjacentHTML('beforeend', `<style>${adminStyles}</style>`);
    },
    
    // ========== UTILIDADES ==========
    extractFileName: function(url) {
        if (!url) return 'Documento PDF';
        const parts = url.split('/');
        let fileName = parts[parts.length - 1] || 'Documento PDF';
        try { fileName = decodeURIComponent(fileName); } catch (e) {}
        return fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
    },
    
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    addStyles: function() {
        // Estilos já adicionados em setupClientModal
    }
};

// ========== INICIALIZAÇÃO IMEDIATA ==========
if (!window.pdfSystemInitialized) {
    window.pdfSystemInitialized = false;
    
    const initPdfSystem = function() {
        if (window.pdfSystemInitialized) return;
        
        try {
            window.PdfSystem.init('vendas');
            window.pdfSystemInitialized = true;
            
            // Expor função global para galeria
            if (!window.showPdfModal) {
                window.showPdfModal = function(propertyId) {
                    return window.PdfSystem.showModal(propertyId);
                };
            }
            
            SC.logModule('pdf', '✅ PdfSystem inicializado IMEDIATAMENTE');
        } catch (error) {
            SC.logModule('pdf', `❌ Erro na inicialização: ${error.message}`);
        }
    };
    
    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPdfSystem);
    } else {
        initPdfSystem();
    }
    
    // Tentar após 300ms para garantir
    setTimeout(initPdfSystem, 300);
}

// ========== EXPOR FUNÇÕES GLOBAIS ==========
// Garantir que showPdfModal esteja disponível mesmo se inicialização falhar
if (!window.showPdfModal) {
    window.showPdfModal = function(propertyId) {
        SC.logModule('pdf', '📄 showPdfModal (fallback global) chamado');
        
        // Buscar imóvel
        const property = window.properties?.find(p => p.id == propertyId);
        if (!property) {
            alert('❌ Imóvel não encontrado!');
            return;
        }
        
        if (!property.pdfs || property.pdfs === 'EMPTY') {
            alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
            return;
        }
        
        // Usar PdfSystem se disponível
        if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
            return window.PdfSystem.showModal(propertyId);
        }
        
        // Fallback básico
        const password = prompt("🔒 Documentos do Imóvel\n\nDigite a senha para acessar os documentos:");
        if (password === "doc123") {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            if (pdfUrls.length > 0) {
                window.open(pdfUrls[0], '_blank');
            }
        } else if (password !== null) {
            alert('❌ Senha incorreta! A senha é: doc123');
        }
    };
    
    SC.logModule('pdf', '✅ showPdfModal (fallback) criado globalmente');
}

// ========== VERIFICAÇÃO DE INTEGRIDADE ==========
setTimeout(() => {
    SC.logModule('pdf', '🔍 Verificando integridade do PdfSystem...');
    
    const checks = {
        'PdfSystem': typeof window.PdfSystem === 'object',
        'showModal (global)': typeof window.showPdfModal === 'function',
        'showModal (PdfSystem)': typeof window.PdfSystem?.showModal === 'function',
        'initialized': window.pdfSystemInitialized === true
    };
    
    SC.logModule('pdf', '📊 Status:', checks);
    
    if (checks['showModal (global)']) {
        SC.logModule('pdf', '✅ Galeria pode acessar PDFs via showPdfModal()');
    }
}, 1500);

// ========== COMPATIBILIDADE COM GALLERY.JS ==========
// Criar função de compatibilidade que a galeria pode chamar
window.handlePdfButtonClick = function(event, propertyId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    if (typeof window.showPdfModal === 'function') {
        window.showPdfModal(propertyId);
    } else if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
        window.PdfSystem.showModal(propertyId);
    } else {
        alert('📄 Carregando documentos...');
        // Tentar novamente após 500ms
        setTimeout(() => {
            if (typeof window.showPdfModal === 'function') {
                window.showPdfModal(propertyId);
            }
        }, 500);
    }
};
