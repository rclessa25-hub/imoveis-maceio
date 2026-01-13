// js/modules/pdf/pdf-unified.js - SISTEMA DE PDF UNIFICADO (VERSÃO CORRIGIDA)
(function() {
    'use strict';
    
    // ========== VERIFICAÇÃO SEGURA DE SHAREDCORE ==========
    if (typeof window.SharedCore === 'undefined') {
        console.error('❌ ERRO CRÍTICO: SharedCore não está disponível!');
        // Criar fallback mínimo
        window.SharedCore = {
            logModule: (mod, msg) => console.log(`[${mod}] ${msg}`),
            warn: (msg) => console.warn(msg),
            error: (msg) => console.error(msg)
        };
    }
    
    const SC = window.SharedCore;
    SC.logModule('pdf', '📄 pdf-unified.js carregado - Sistema de PDF Corrigido');

    // ========== CONFIGURAÇÃO DO SISTEMA ==========
    window.PdfSystem = {
        config: {
            isAdmin: window.location.pathname.includes('/admin/'),
            currentSystem: 'vendas',
            maxPdfSize: 10 * 1024 * 1024, // 10MB
            defaultPassword: 'doc123'
        },
        
        state: {
            isInitialized: false,
            currentProperty: null,
            selectedPdfs: [],
            isUploading: false,
            modalCreated: false
        },
        
        // ========== INICIALIZAÇÃO SEGURA ==========
        init: function(system = 'vendas') {
            if (this.state.isInitialized) {
                SC.logModule('pdf', '⚠️ PdfSystem já inicializado');
                return this;
            }
            
            this.config.currentSystem = system;
            this.state.isInitialized = true;
            
            // IMPORTANTE: NÃO criar modal automaticamente
            // Apenas preparar o sistema
            
            // Configurar eventos se for admin
            if (this.config.isAdmin) {
                this.setupAdminEvents();
                SC.logModule('pdf', '🔧 PdfSystem inicializado no modo ADMIN');
            } else {
                SC.logModule('pdf', '👁️ PdfSystem inicializado no modo CLIENTE');
            }
            
            return this;
        },
        
        // ========== MODO CLIENTE - VISUALIZAÇÃO ==========
        createModalIfNeeded: function() {
            // Verificar se o modal já existe
            if (document.getElementById('pdfViewerModal')) {
                this.state.modalCreated = true;
                return true;
            }
            
            SC.logModule('pdf', '🔄 Criando modal de visualização de PDFs...');
            
            // Criar modal apenas quando necessário
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
            
            // Adicionar estilos (versão compacta similar à antiga)
            const styles = `
                .pdf-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.85);
                    z-index: 10000;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                
                .pdf-modal-content {
                    background: white;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                }
                
                .pdf-modal-header {
                    background: #2c3e50;
                    color: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .pdf-modal-header h3 {
                    margin: 0;
                    font-size: 16px;
                }
                
                .pdf-modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    line-height: 1;
                }
                
                .pdf-modal-body {
                    padding: 20px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .password-input-group {
                    margin-bottom: 15px;
                }
                
                .password-input-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .password-input-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    box-sizing: border-box;
                }
                
                .password-input-group button {
                    width: 100%;
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .password-hint {
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 12px;
                    margin-top: 10px;
                }
                
                .pdf-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .pdf-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .pdf-item:hover {
                    background: #e3f2fd;
                    border-color: #3498db;
                }
                
                .pdf-icon {
                    background: #e74c3c;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 10px;
                }
                
                .pdf-info {
                    flex: 1;
                }
                
                .pdf-name {
                    font-weight: 600;
                    color: #2c3e50;
                    font-size: 14px;
                }
                
                .pdf-size {
                    font-size: 12px;
                    color: #7f8c8d;
                }
                
                .pdf-download-btn {
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                }
                
                .pdf-modal-footer {
                    padding: 15px;
                    background: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                    text-align: right;
                }
                
                .pdf-modal-footer button {
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            
            // Adicionar estilos
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
            
            // Adicionar modal ao body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.state.modalCreated = true;
            
            SC.logModule('pdf', '✅ Modal criado (estilo compacto)');
            return true;
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
                alert('ℹ️ Este imóvel não possui documentos disponíveis.');
                return;
            }
            
            // Criar modal se necessário
            if (!this.state.modalCreated) {
                this.createModalIfNeeded();
            }
            
            // Mostrar modal
            const modal = document.getElementById('pdfViewerModal');
            if (modal) {
                modal.style.display = 'flex';
                document.getElementById('pdfModalTitle').textContent = `Documentos - ${property.title}`;
                
                // Resetar seções
                document.getElementById('pdfPasswordSection').style.display = 'block';
                document.getElementById('pdfListSection').style.display = 'none';
                document.getElementById('pdfErrorSection').style.display = 'none';
                
                // Limpar senha anterior
                const passwordInput = document.getElementById('pdfPassword');
                if (passwordInput) passwordInput.value = '';
                
                // Focar no input de senha
                setTimeout(() => {
                    if (passwordInput) passwordInput.focus();
                }, 100);
                
                SC.logModule('pdf', '✅ Modal exibido corretamente');
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
                // CORREÇÃO: Remover o alert que mostra a senha
                alert('❌ Senha incorreta!');
                if (passwordInput) {
                    passwordInput.focus();
                    passwordInput.select();
                }
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
                                <i class="fas fa-external-link-alt"></i> Abrir
                            </button>
                        </div>
                    `;
                }).join('');
            }
            
            SC.logModule('pdf', `📄 Mostrando ${pdfUrls.length} PDF(s)`);
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
                alert('❌ Senha incorreta!');
            }
        },
        
        // ========== MODO ADMIN ==========
        setupAdminEvents: function() {
            // Configurações específicas do admin
            SC.logModule('pdf', '⚙️ Configurando eventos do modo admin');
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
        }
    };

    // ========== INICIALIZAÇÃO IMEDIATA CORRIGIDA ==========
    // NÃO inicializar automaticamente - apenas preparar
    if (!window.pdfSystemInitialized) {
        window.pdfSystemInitialized = false;
        
        // Função de inicialização segura
        const initPdfSystem = function() {
            if (window.pdfSystemInitialized) return;
            
            try {
                window.PdfSystem.init('vendas');
                window.pdfSystemInitialized = true;
                
                SC.logModule('pdf', '✅ PdfSystem inicializado (sem criar modal)');
            } catch (error) {
                SC.logModule('pdf', `❌ Erro na inicialização: ${error.message}`);
            }
        };
        
        // Inicializar apenas quando necessário
        // NÃO criar modal automaticamente
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initPdfSystem, 500);
        });
        
        // Fallback
        setTimeout(initPdfSystem, 1000);
    }

    // ========== EXPOR FUNÇÕES GLOBAIS ==========
    // Garantir que showPdfModal esteja disponível
    if (!window.showPdfModal) {
        window.showPdfModal = function(propertyId) {
            SC.logModule('pdf', '📄 showPdfModal (global) chamado');
            
            if (window.PdfSystem && typeof window.PdfSystem.showModal === 'function') {
                return window.PdfSystem.showModal(propertyId);
            }
            
            // Fallback básico
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }
            
            if (!property.pdfs || property.pdfs === 'EMPTY') {
                alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
                return;
            }
            
            const password = prompt("🔒 Documentos do Imóvel\n\nDigite a senha para acessar os documentos:");
            if (password === "doc123") {
                const pdfUrls = property.pdfs.split(',')
                    .map(url => url.trim())
                    .filter(url => url && url !== 'EMPTY');
                
                if (pdfUrls.length > 0) {
                    window.open(pdfUrls[0], '_blank');
                }
            } else if (password !== null) {
                alert('❌ Senha incorreta!');
            }
        };
    }

    // ========== COMPATIBILIDADE COM GALLERY.JS ==========
    window.handlePdfButtonClick = function(event, propertyId) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        if (typeof window.showPdfModal === 'function') {
            window.showPdfModal(propertyId);
        } else {
            alert('📄 Carregando documentos...');
            setTimeout(() => {
                if (typeof window.showPdfModal === 'function') {
                    window.showPdfModal(propertyId);
                }
            }, 500);
        }
    };

    // ========== VERIFICAÇÃO DE INTEGRIDADE ==========
    setTimeout(() => {
        SC.logModule('pdf', '🔍 Verificando integridade do PdfSystem...');
        
        const checks = {
            'PdfSystem': typeof window.PdfSystem === 'object',
            'showModal (global)': typeof window.showPdfModal === 'function',
            'showModal (PdfSystem)': typeof window.PdfSystem?.showModal === 'function',
            'modalCriado': window.PdfSystem?.state?.modalCreated || false
        };
        
        SC.logModule('pdf', '📊 Status:', checks);
    }, 1500);

    SC.logModule('pdf', '✅ Sistema PDF corrigido e pronto');
})();
