// js/modules/admin.js - SISTEMA ADMIN COM VALIDAÇÃO DE IDs PARA SUPABASE
console.log('🔧 admin.js com validação de IDs carregado');

/* ==========================================================
   CONFIGURAÇÃO E CONSTANTES
   ========================================================== */
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

const DEBUG = false;
const log = DEBUG ? console.log : () => {};

// Estado global
window.editingPropertyId = null;
let autoSaveTimeout = null;
let pendingAutoSave = false;

/* ==========================================================
   HELPER FUNCTIONS (Redução de 200+ linhas)
   ========================================================== */
const Helpers = {
    // Formatação unificada
    format: {
        price: (value) => window.SharedCore?.PriceFormatter?.formatForInput?.(value) || value,
        features: (value) => {
            if (!value) return '[]';
            try {
                if (Array.isArray(value)) return JSON.stringify(value);
                if (value.startsWith('[')) return value;
                const arr = value.split(',').map(f => f.trim()).filter(f => f);
                return JSON.stringify(arr);
            } catch { return '[]'; }
        }
    },
    
    // UI Helpers
    updateUI: {
        formTitle: (text) => {
            const el = document.getElementById('formTitle');
            if (el) el.textContent = text;
        },
        submitButton: (isEditing = false) => {
            const btn = document.querySelector('#propertyForm button[type="submit"]');
            if (!btn) return;
            btn.innerHTML = isEditing ? 
                '<i class="fas fa-save"></i> Salvar Alterações' : 
                '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
            btn.style.background = isEditing ? 'var(--accent)' : 'var(--success)';
            btn.disabled = false;
        },
        cancelButton: (show = true) => {
            const btn = document.getElementById('cancelEditBtn');
            if (btn) {
                btn.style.display = show ? 'block' : 'none';
                btn.disabled = !show;
            }
        }
    },
    
    // Configuração de uploads (redução de 80+ linhas)
    setupUpload: (inputId, areaId, callback, autoSaveType = null) => {
        const input = document.getElementById(inputId);
        const area = document.getElementById(areaId);
        if (!input || !area) return false;
        
        const cleanInput = input.cloneNode(true);
        const cleanArea = area.cloneNode(true);
        input.parentNode.replaceChild(cleanInput, input);
        area.parentNode.replaceChild(cleanArea, area);
        
        const freshInput = document.getElementById(inputId);
        const freshArea = document.getElementById(areaId);
        
        freshArea.addEventListener('click', (e) => {
            e.preventDefault();
            freshInput.click();
        });
        
        freshInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                callback(e.target.files);
                e.target.value = '';
                if (autoSaveType) window.triggerAutoSave(autoSaveType);
            }
        });
        
        return true;
    },
    
    // Notificações (redução de 30+ linhas)
    showNotification: (message, type = 'success', duration = 3000) => {
        const existing = document.querySelectorAll('.auto-save-notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `auto-save-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${type === 'error' ? '#e74c3c' : 'var(--success)'};
            color: white; padding: 12px 18px; border-radius: 8px;
            z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex; align-items: center; gap: 10px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), duration);
    }
};

/* ==========================================================
   SISTEMA DE PDFs COM VALIDAÇÃO DE IDs PARA SUPABASE
   ========================================================== */
window.adminPdfHandler = {
    clear: function() {
        console.log('[adminPdfHandler] Limpando PDFs');
        return window.MediaSystem?.clearAllPdfs?.() || window.PdfSystem?.clearAllPdfs?.();
    },
    
    // ✅ NOVA FUNÇÃO: Limpar apenas PDFs não enviados
    clearNonUploaded: function() {
        console.log('[adminPdfHandler] Limpando apenas PDFs NÃO enviados');
        
        if (window.MediaSystem?.state?.pdfs) {
            // Manter apenas PDFs já enviados
            const uploadedPdfs = window.MediaSystem.state.pdfs.filter(pdf => pdf.uploaded);
            window.MediaSystem.state.pdfs = uploadedPdfs;
            
            console.log(`💾 Mantidos ${uploadedPdfs.length} PDF(s) já enviado(s)`);
            
            if (window.MediaSystem.updateUI) {
                window.MediaSystem.updateUI();
            }
        }
        
        return true;
    },
    
    // ✅ NOVA FUNÇÃO: Verificar se há PDFs persistidos
    hasPersistedPdfs: function() {
        if (!window.editingPropertyId) return false;
        
        // Verificar no estado do MediaSystem
        if (window.MediaSystem?.state?.pdfs) {
            const uploadedPdfs = window.MediaSystem.state.pdfs.filter(pdf => pdf.uploaded);
            return uploadedPdfs.length > 0;
        }
        
        return false;
    },
    
    load: function(property) {
        console.log('[adminPdfHandler] Carregando PDFs existentes para edição:', property?.id);
        return window.MediaSystem?.loadExistingPdfsForEdit?.(property) || 
               window.PdfSystem?.loadExistingPdfsForEdit?.(property);
    },
    
    // ✅ FUNÇÃO CRÍTICA: Processa e SALVA PDFs definitivamente no Supabase
    process: async function(id, title) {
        console.group('[adminPdfHandler] PROCESSANDO PDFs DEFINITIVAMENTE');
        console.log('📋 Parâmetros:', { 
            id, 
            tipoId: typeof id,
            title 
        });
        
        if (!id) {
            console.error('❌ ID do imóvel não fornecido!');
            console.groupEnd();
            return '';
        }
        
        try {
            let pdfUrls = '';
            
            // Estratégia 1: Usar MediaSystem (preferencial)
            if (window.MediaSystem?.processAndSavePdfs) {
                console.log('🔍 Usando MediaSystem para processar PDFs...');
                pdfUrls = await window.MediaSystem.processAndSavePdfs(id, title);
                console.log('📄 URLs do MediaSystem:', pdfUrls ? pdfUrls.split(',').length + ' PDF(s)' : 'Nenhum');
            }
            // Estratégia 2: Usar PdfSystem (alternativo)
            else if (window.PdfSystem?.processAndSavePdfs) {
                console.log('🔍 Usando PdfSystem para processar PDFs...');
                pdfUrls = await window.PdfSystem.processAndSavePdfs(id, title);
                console.log('📄 URLs do PdfSystem:', pdfUrls ? pdfUrls.split(',').length + ' PDF(s)' : 'Nenhum');
            }
            // Estratégia 3: Processar manualmente
            else {
                console.log('⚠️ Sistemas de PDF não disponíveis, tentando processamento manual...');
                pdfUrls = await this.processPdfsManually(id, title);
            }
            
            // ✅ GARANTIR PERSISTÊNCIA IMEDIATA NO SUPABASE (COM VALIDAÇÃO DE ID)
            if (pdfUrls?.trim()) {
                // ✅ VALIDAR ID ANTES DE PERSISTIR
                const validId = this.validateIdForSupabase(id);
                
                if (validId) {
                    const persistSuccess = await this.persistPdfsToSupabase(validId, pdfUrls);
                    if (persistSuccess) {
                        console.log('✅ PDFs persistidos com SUCESSO no Supabase!');
                        
                        // 🔄 CRÍTICO: Marcar PDFs como já enviados no estado local
                        if (window.MediaSystem?.state?.pdfs) {
                            window.MediaSystem.state.pdfs.forEach(pdf => {
                                if (pdfUrls.includes(pdf.url)) {
                                    pdf.uploaded = true;
                                    console.log(`🏷️ Marcado PDF como enviado: ${pdf.name}`);
                                }
                            });
                        }
                    } else {
                        console.error('❌ Falha ao persistir PDFs no Supabase');
                        // Mesmo se falhar, retorna as URLs para salvamento local
                    }
                } else {
                    console.warn('⚠️ ID inválido para Supabase, salvando apenas localmente');
                }
            } else {
                console.log('ℹ️ Nenhum PDF para processar');
            }
            
            console.groupEnd();
            return pdfUrls || '';
            
        } catch (error) {
            console.error('❌ ERRO CRÍTICO em adminPdfHandler.process:', error);
            console.groupEnd();
            return '';
        }
    },
    
    // ✅ MÉTODO NOVO: Persistir PDFs diretamente no Supabase (COM VALIDAÇÃO DE ID)
    persistPdfsToSupabase: async function(propertyId, pdfUrls) {
        console.log('[adminPdfHandler] Persistindo PDFs no Supabase:', {
            propertyId,
            propertyIdType: typeof propertyId,
            pdfCount: pdfUrls.split(',').filter(p => p.trim()).length
        });
        
        if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
            console.error('❌ Credenciais Supabase não configuradas');
            return false;
        }
        
        if (!propertyId || !pdfUrls?.trim()) {
            console.error('❌ Dados inválidos para persistência');
            return false;
        }
        
        // ✅ CRÍTICO: Garantir que o ID é numérico para Supabase
        if (typeof propertyId !== 'number' || isNaN(propertyId)) {
            console.error('❌ ID deve ser numérico para Supabase:', propertyId);
            return false;
        }
        
        try {
            console.log(`🌐 Enviando para Supabase com ID: ${propertyId} (${typeof propertyId})`);
            
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ 
                    pdfs: pdfUrls
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ PDFs atualizados no Supabase:', {
                    success: true,
                    pdfsNaResposta: result[0]?.pdfs,
                    propertyId: propertyId,
                    rowsAfetadas: result.length
                });
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erro ao atualizar PDFs no Supabase:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText,
                    idUsado: propertyId
                });
                
                // ✅ ESTRATÉGIA ALTERNATIVA: Verificar se o imóvel existe
                console.log('🔍 Verificando se o imóvel existe no Supabase...');
                const checkResponse = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}&select=id`, {
                    headers: {
                        'apikey': window.SUPABASE_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`
                    }
                });
                
                if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    console.log('📊 Verificação de existência:', {
                        existe: checkData.length > 0,
                        dados: checkData
                    });
                    
                    if (checkData.length === 0) {
                        console.warn(`⚠️ Imóvel ID ${propertyId} não existe no Supabase`);
                    }
                }
                
                return false;
            }
        } catch (error) {
            console.error('❌ Erro de conexão ao persistir PDFs:', error);
            return false;
        }
    },
    
    // ✅ FUNÇÃO AUXILIAR: Validar e converter ID para Supabase
    validateIdForSupabase: function(propertyId) {
        console.log('[adminPdfHandler] Validando ID para Supabase:', {
            original: propertyId,
            type: typeof propertyId
        });
        
        if (!propertyId) {
            console.error('❌ ID não fornecido');
            return null;
        }
        
        // Se já for número e válido, retornar como está
        if (typeof propertyId === 'number' && !isNaN(propertyId) && propertyId > 0) {
            console.log(`✅ ID já é numérico válido: ${propertyId}`);
            return propertyId;
        }
        
        // Se for string, tentar extrair número
        if (typeof propertyId === 'string') {
            // Remover prefixos comuns de teste
            const cleanId = propertyId
                .replace('test_id_', '')
                .replace('temp_', '')
                .replace(/[^0-9]/g, '');
            
            const numericId = parseInt(cleanId);
            
            if (!isNaN(numericId) && numericId > 0) {
                console.log(`✅ ID convertido: "${propertyId}" -> ${numericId}`);
                return numericId;
            }
        }
        
        // Tentar converter direto
        const directConvert = parseInt(propertyId);
        if (!isNaN(directConvert) && directConvert > 0) {
            console.log(`✅ ID convertido diretamente: ${directConvert}`);
            return directConvert;
        }
        
        console.error('❌ Não foi possível converter ID para formato Supabase:', propertyId);
        return null;
    },
    
    // ✅ MÉTODO NOVO: Processamento manual de fallback
    processPdfsManually: async function(propertyId, title) {
        console.log('[adminPdfHandler] Processamento manual de PDFs');
        
        // Tentar obter PDFs do estado atual
        if (window.MediaSystem?.state?.pdfs) {
            const pdfs = MediaSystem.state.pdfs || [];
            const uploadedPdfs = pdfs.filter(pdf => pdf.url && pdf.uploaded);
            
            if (uploadedPdfs.length > 0) {
                const urls = uploadedPdfs.map(pdf => pdf.url).join(',');
                console.log(`📄 ${uploadedPdfs.length} PDF(s) encontrado(s) no estado`);
                return urls;
            }
        }
        
        return '';
    },
    
    isAvailable: function() {
        const available = !!(window.MediaSystem || window.PdfSystem);
        console.log('[adminPdfHandler] Disponível?', available);
        return available;
    }
};

// ==========================================================
// FUNÇÕES DE COMPATIBILIDADE COM VALIDAÇÃO DE IDs
// ==========================================================
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    console.group('[COMPATIBILIDADE] processAndSavePdfs -> delegando para adminPdfHandler');
    console.log('📋 Parâmetros:', { 
        propertyId, 
        tipoId: typeof propertyId,
        propertyTitle 
    });
    
    try {
        const result = await window.adminPdfHandler.process(propertyId, propertyTitle);
        console.log('✅ Resultado:', result ? result.split(',').length + ' PDF(s)' : 'Nenhum');
        console.groupEnd();
        return result;
    } catch (error) {
        console.error('❌ Erro:', error);
        console.groupEnd();
        return '';
    }
};

window.clearAllPdfs = function() {
    console.log('[COMPATIBILIDADE] clearAllPdfs -> delegando para adminPdfHandler');
    return window.adminPdfHandler.clear();
};

window.loadExistingPdfsForEdit = function(property) {
    console.log('[COMPATIBILIDADE] loadExistingPdfsForEdit -> delegando para adminPdfHandler');
    return window.adminPdfHandler.load(property);
};

window.getPdfsToSave = async function(propertyId) {
    console.log('[COMPATIBILIDADE] getPdfsToSave -> delegando para processAndSavePdfs');
    return await window.processAndSavePdfs(propertyId, 'Imóvel');
};

window.clearProcessedPdfs = function() {
    console.log('[COMPATIBILIDADE] clearProcessedPdfs - Limpando apenas PDFs processados');
    if (MediaSystem?.state?.pdfs) {
        MediaSystem.state.pdfs = MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
        if (MediaSystem.updateUI) MediaSystem.updateUI();
    }
    window.adminPdfHandler.clear();
};

window.getMediaUrlsForProperty = async function(propertyId, propertyTitle) {
    return await (MediaSystem?.getMediaUrlsForProperty?.(propertyId, propertyTitle) || '');
};

/* ==========================================================
   FUNÇÃO PARA LIMPAR PDFs REMANESCENTES
   ========================================================== */
window.clearStalePdfs = function() {
    console.log('🧹 Verificando PDFs remanescentes...');
    
    if (!window.MediaSystem || !window.MediaSystem.state || !window.MediaSystem.state.pdfs) {
        return false;
    }
    
    const beforeCount = window.MediaSystem.state.pdfs.length;
    
    // Remover PDFs que estão marcados como uploaded mas não há imóvel em edição
    if (!window.editingPropertyId) {
        window.MediaSystem.state.pdfs = window.MediaSystem.state.pdfs.filter(pdf => !pdf.uploaded);
    }
    
    const afterCount = window.MediaSystem.state.pdfs.length;
    
    if (beforeCount !== afterCount) {
        console.log(`🗑️ ${beforeCount - afterCount} PDF(s) remanescente(s) removido(s)`);
        
        if (window.MediaSystem.updateUI) {
            window.MediaSystem.updateUI();
        }
        
        return true;
    }
    
    return false;
};

/* ==========================================================
   AUTO-SALVAMENTO OTIMIZADO COM VALIDAÇÃO DE IDs
   ========================================================== */
window.triggerAutoSave = function(reason = 'media_deletion') {
    if (!window.editingPropertyId) return;
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(async () => {
        if (!pendingAutoSave) return;
        
        const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
        const originalText = submitBtn?.innerHTML;
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Auto-salvando...';
            submitBtn.disabled = true;
        }
        
        try {
            console.log('🔍 DEBUG triggerAutoSave:', {
                editingId: window.editingPropertyId,
                tipoId: typeof window.editingPropertyId,
                reason: reason,
                timestamp: new Date().toISOString()
            });
            
            const fields = ['propTitle','propPrice','propLocation','propDescription',
                          'propFeatures','propType','propBadge','propHasVideo'];
            
            const propertyData = fields.reduce((acc, id) => {
                const el = document.getElementById(id);
                acc[id.replace('prop', '').toLowerCase()] = 
                    el?.type === 'checkbox' ? el.checked : el?.value?.trim() || '';
                return acc;
            }, {});
            
            // Formatação
            propertyData.price = Helpers.format.price(propertyData.price);
            propertyData.features = Helpers.format.features(propertyData.features);
            
            const updateData = { ...propertyData };
            
            // ✅ PROCESSAR PDFs COM VALIDAÇÃO DE ID
            if (window.adminPdfHandler) {
                try {
                    const pdfsString = await window.adminPdfHandler.process(
                        window.editingPropertyId, 
                        propertyData.title
                    );
                    
                    if (pdfsString?.trim()) {
                        updateData.pdfs = pdfsString;
                        console.log('✅ PDFs processados no auto-save:', {
                            count: pdfsString.split(',').filter(p => p.trim()).length,
                            propertyTitle: propertyData.title
                        });
                    } else {
                        console.log('ℹ️ Nenhum PDF novo processado no auto-save');
                    }
                } catch (error) {
                    console.error('❌ Erro ao processar PDFs no auto-save:', error);
                }
            }
            
            // Processar mídia
            if (window.MediaSystem?.getOrderedMediaUrls) {
                const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                if (mediaUrls?.trim()) updateData.images = mediaUrls;
            }
            
            // ✅ VALIDAR ID ANTES DE ENVIAR
            const validId = window.adminPdfHandler?.validateIdForSupabase?.(window.editingPropertyId);
            console.log('📤 Dados para envio:', {
                id: window.editingPropertyId,
                idValidoParaSupabase: validId,
                temPdfs: !!updateData.pdfs,
                campos: Object.keys(updateData)
            });
            
            // Atualizar array local e banco
            window.updateLocalProperty(window.editingPropertyId, updateData);
            if (typeof window.updateProperty === 'function') {
                // Usar ID validado se disponível
                const idToUse = validId || window.editingPropertyId;
                await window.updateProperty(idToUse, updateData);
                Helpers.showNotification('✅ Alterações salvas automaticamente');
            }
            
        } catch (error) {
            console.error('Auto-salvamento falhou:', error);
            Helpers.showNotification('❌ Erro ao salvar', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            pendingAutoSave = false;
        }
    }, 1500);
    
    pendingAutoSave = true;
};

/* ==========================================================
   FUNÇÃO UNIFICADA DE LIMPEZA
   ========================================================== */
window.cleanAdminForm = function(mode = 'reset') {
    console.log('[cleanAdminForm] Modo:', mode);
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
    pendingAutoSave = false;
    
    // 🔴 SEMPRE limpar PDFs remanescentes
    window.clearStalePdfs();
    
    if (mode === 'reset') {
        // 🔴 LIMPEZA COMPLETA
        window.editingPropertyId = null;
        
        const form = document.getElementById('propertyForm');
        if (form) {
            form.reset();
            document.getElementById('propType').value = 'residencial';
            document.getElementById('propBadge').value = 'Novo';
            document.getElementById('propHasVideo').checked = false;
        }
        
        if (window.MediaSystem) {
            console.log('[cleanAdminForm] Reset COMPLETO do MediaSystem');
            
            if (window.MediaSystem.resetState) {
                window.MediaSystem.resetState();
            }
            
            ['uploadPreview', 'pdfUploadPreview'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });
        }
        
        Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
        Helpers.updateUI.submitButton(false);
        Helpers.updateUI.cancelButton(false);
        
        console.log('✅ cleanAdminForm: Reset COMPLETO');
        
    } else if (mode === 'cancel') {
        if (window.editingPropertyId && !confirm('Cancelar edição? Alterações serão perdidas.')) {
            return false;
        }
        
        window.editingPropertyId = null;
        
        const form = document.getElementById('propertyForm');
        if (form) {
            form.reset();
            document.getElementById('propType').value = 'residencial';
            document.getElementById('propBadge').value = 'Novo';
            document.getElementById('propHasVideo').checked = false;
        }
        
        if (window.MediaSystem) {
            window.MediaSystem.resetState();
        }
        
        Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
        Helpers.updateUI.submitButton(false);
        Helpers.updateUI.cancelButton(false);
        
        if (window.showNotification) {
            window.showNotification('Edição cancelada', 'info');
        }
        
    } else if (mode === 'soft_reset') {
        console.log('✅ cleanAdminForm: Soft reset (estado preservado)');
        // 🔴 NÃO limpa nada durante soft_reset
    }
    
    return true;
};

window.cancelEdit = function() {
    return window.cleanAdminForm('cancel');
};

/* ==========================================================
   TOGGLE ADMIN PANEL COM LIMPEZA COMPLETA AO ABRIR
   ========================================================== */
window.toggleAdminPanel = function() {
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha:");
    if (password === null) return;
    if (password === "") return alert('⚠️ Campo vazio!');
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            
            if (!isVisible) {
                console.log('🆕 Admin aberto - Limpando estado anterior...');
                
                // 🔴 CRÍTICO: Limpar completamente ao abrir
                window.editingPropertyId = null;
                autoSaveTimeout = null;
                pendingAutoSave = false;
                
                // Limpar formulário
                const form = document.getElementById('propertyForm');
                if (form) {
                    form.reset();
                    document.getElementById('propType').value = 'residencial';
                    document.getElementById('propBadge').value = 'Novo';
                    document.getElementById('propHasVideo').checked = false;
                }
                
                // Limpar MediaSystem COMPLETAMENTE
                if (window.MediaSystem) {
                    if (window.MediaSystem.resetState) {
                        window.MediaSystem.resetState();
                    } else if (window.MediaSystem.state) {
                        window.MediaSystem.state = { files: [], pdfs: [], deleted: [] };
                    }
                    
                    ['uploadPreview', 'pdfUploadPreview'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.innerHTML = '';
                    });
                    
                    if (window.MediaSystem.updateUI) {
                        window.MediaSystem.updateUI();
                    }
                }
                
                // Atualizar UI
                Helpers.updateUI.formTitle('Adicionar Novo Imóvel');
                Helpers.updateUI.submitButton(false);
                Helpers.updateUI.cancelButton(false);
                
                console.log('✅ Estado do admin limpo completamente');
            }
            
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
                }, 300);
            }
        }
    } else {
        alert('❌ Senha incorreta!');
    }
};

/* ==========================================================
   CONFIGURAÇÃO DE UI (40 linhas vs 80+)
   ========================================================== */
window.setupAdminUI = function() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    // Configurar botão admin
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.toggleAdminPanel();
        });
    }
    
    // Configurar botão cancelar
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.cancelEdit();
        });
    }
    
    // Adicionar botão sincronização
    if (!document.getElementById('syncButton')) {
        const syncBtn = document.createElement('button');
        syncBtn.id = 'syncButton';
        syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
        syncBtn.onclick = window.syncWithSupabaseManual;
        syncBtn.style.cssText = `
            background: var(--gold); color: white; border: none;
            padding: 0.8rem 1.5rem; border-radius: 5px; cursor: pointer;
            margin-top: 1rem; display: inline-flex; align-items: center;
            gap: 0.5rem; font-weight: 600;
        `;
        
        const panelTitle = document.querySelector('#adminPanel h3');
        if (panelTitle) panelTitle.parentNode.insertBefore(syncBtn, panelTitle.nextSibling);
    }
    
    // Configurar formulário
    if (typeof window.setupForm === 'function') window.setupForm();
    
    // 🔴 ADICIONAR: Limpar PDFs remanescentes ao carregar
    setTimeout(() => window.clearStalePdfs(), 1000);
    
    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
        #propertiesContainer.updating .property-card { opacity: 0.7; transition: opacity 0.3s; }
        .auto-save-notification { animation: slideInRight 0.3s ease; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
};

/* ==========================================================
   FUNÇÃO editProperty OTIMIZADA (40 linhas vs 80+)
   ========================================================== */
window.editProperty = function(id) {
    const property = window.properties?.find(p => p.id === id);
    if (!property) return alert('❌ Imóvel não encontrado!');
    
    // Resetar sistemas
    if (window.MediaSystem) MediaSystem.resetState();
    
    // Preencher formulário
    const fields = {
        propTitle: property.title || '',
        propPrice: Helpers.format.price(property.price) || '',
        propLocation: property.location || '',
        propDescription: property.description || '',
        propFeatures: Array.isArray(property.features) ? 
                     property.features.join(', ') : (property.features || ''),
        propType: property.type || 'residencial',
        propBadge: property.badge || 'Novo',
        propHasVideo: property.has_video === true || property.has_video === 'true'
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.type === 'checkbox' ? el.checked = value : el.value = value;
    });
    
    // Atualizar UI
    Helpers.updateUI.formTitle(`Editando: ${property.title}`);
    Helpers.updateUI.submitButton(true);
    Helpers.updateUI.cancelButton(true);
    
    window.editingPropertyId = property.id;
    
    // Carregar mídia e PDFs
    if (window.MediaSystem) MediaSystem.loadExisting(property);
    if (window.adminPdfHandler) window.adminPdfHandler.load(property);
    
    // Abrir painel e scroll
    setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        if (panel) panel.style.display = 'block';
        document.getElementById('propertyForm')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return true;
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO (60 linhas vs 120+)
   ========================================================== */
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    
    // Clonar para remover listeners antigos
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Aguarde...', { variant: 'processing' });
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }
        
        try {
            // Coletar dados
            const fields = ['propTitle','propPrice','propLocation','propDescription',
                          'propFeatures','propType','propBadge','propHasVideo'];
            
            const propertyData = fields.reduce((acc, id) => {
                const el = document.getElementById(id);
                acc[id.replace('prop', '').toLowerCase()] = 
                    el?.type === 'checkbox' ? el.checked : el?.value?.trim() || '';
                return acc;
            }, {});
            
            // Validação
            if (!propertyData.title || !propertyData.price || !propertyData.location) {
                throw new Error('Preencha Título, Preço e Localização!');
            }
            
            // Formatação
            propertyData.price = Helpers.format.price(propertyData.price);
            propertyData.features = Helpers.format.features(propertyData.features);
            
            // 🔄 CRÍTICO: Verificar se é edição após auto-salvamento
            const isEditAfterAutoSave = window.editingPropertyId && 
                                       window.adminPdfHandler?.hasPersistedPdfs?.();
            
            if (window.editingPropertyId) {
                const updateData = { ...propertyData };
                
                console.log('🔄 Salvamento manual após auto-salvamento:', {
                    editingId: window.editingPropertyId,
                    hasPersistedPdfs: isEditAfterAutoSave,
                    timestamp: new Date().toISOString()
                });
                
                let pdfsProcessed = false;
                if (window.adminPdfHandler) {
                    try {
                        const hasNewPdfs = window.MediaSystem?.state?.pdfs?.some(pdf => !pdf.uploaded);
                        
                        if (hasNewPdfs) {
                            console.log('📤 Processando NOVOS PDFs no salvamento manual');
                            const pdfsString = await window.adminPdfHandler.process(
                                window.editingPropertyId, 
                                propertyData.title
                            );
                            if (pdfsString?.trim()) {
                                updateData.pdfs = pdfsString;
                                pdfsProcessed = true;
                            }
                        } else if (isEditAfterAutoSave) {
                            console.log('ℹ️ Usando PDFs já persistidos pelo auto-salvamento');
                            const existingPdfs = window.MediaSystem?.state?.pdfs?.filter(pdf => pdf.uploaded) || [];
                            if (existingPdfs.length > 0) {
                                const pdfUrls = existingPdfs.map(pdf => pdf.url).join(',');
                                updateData.pdfs = pdfUrls;
                                console.log(`💾 Usando ${existingPdfs.length} PDF(s) já persistido(s)`);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Erro ao processar PDFs:', error);
                    }
                }
                
                if (window.MediaSystem?.getOrderedMediaUrls) {
                    const mediaUrls = window.MediaSystem.getOrderedMediaUrls().images;
                    if (mediaUrls?.trim()) updateData.images = mediaUrls;
                }
                
                window.updateLocalProperty(window.editingPropertyId, updateData);
                
                if (typeof window.updateProperty === 'function') {
                    const validId = window.adminPdfHandler?.validateIdForSupabase?.(window.editingPropertyId);
                    const idToUse = validId || window.editingPropertyId;
                    
                    const success = await window.updateProperty(idToUse, updateData);
                    if (success) {
                        Helpers.showNotification('✅ Imóvel atualizado!');
                        
                        // 🔄 CRÍTICO: Não limpar formulário após salvamento
                        console.log('✅ Salvamento concluído - Formulário mantido para continuar edição');
                    }
                }
                
            } else {
                if (typeof window.addNewProperty === 'function') {
                    const newProperty = await window.addNewProperty(propertyData);
                    if (newProperty) {
                        window.addToLocalProperties(newProperty);
                        Helpers.showNotification('✅ Imóvel criado!');
                        
                        // Apenas para novos imóveis, limpar formulário
                        window.cleanAdminForm('reset');
                    }
                }
            }
            
        } catch (error) {
            alert(`❌ Erro: ${error.message}`);
        } finally {
            if (loading) loading.hide();
            
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText || 
                        (window.editingPropertyId ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site');
                }, 500);
            }
        }
    });
};

/* ==========================================================
   FUNÇÕES RESTANTES (RESUMIDAS)
   ========================================================== */
window.loadPropertyList = function() {
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    if (!container || !window.properties) return;
    
    container.innerHTML = window.properties.length === 0 ? 
        '<p style="text-align: center; color: #666;">Nenhum imóvel</p>' :
        window.properties.sort((a,b) => b.id - a.id).map(property => `
            <div class="property-item">
                <div style="flex: 1;">
                    <strong style="color: var(--primary);">${property.title}</strong><br>
                    <small>${property.price} - ${property.location}</small>
                    <div style="font-size: 0.8em; color: #666; margin-top: 0.2rem;">
                        ID: ${property.id} | Tipo: ${property.type || 'residencial'}
                        ${property.has_video ? ' | 🎬 Tem vídeo' : ''}
                        ${property.badge ? ` | 🏷️ ${property.badge}` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="editProperty(${property.id})" class="btn-edit">Editar</button>
                    <button onclick="deleteProperty(${property.id})" class="btn-delete">Excluir</button>
                </div>
            </div>
        `).join('');
    
    if (countElement) countElement.textContent = window.properties.length;
};

window.updateLocalProperty = function(propertyId, updatedData) {
    if (!window.properties) return false;
    
    const index = window.properties.findIndex(p => p.id === propertyId);
    if (index === -1) return false;
    
    // Normalizar dados
    if (updatedData.has_video !== undefined) updatedData.has_video = Boolean(updatedData.has_video);
    if (Array.isArray(updatedData.features)) updatedData.features = JSON.stringify(updatedData.features);
    
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    // Atualizar UI
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos', true);
        }
    }, 150);
    
    return true;
};

window.addToLocalProperties = function(newProperty) {
    if (!window.properties) window.properties = [];
    
    const maxId = window.properties.length > 0 ? Math.max(...window.properties.map(p => p.id)) : 0;
    const propertyWithId = {
        ...newProperty,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    window.properties.push(propertyWithId);
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
    }, 200);
    
    return propertyWithId;
};

// Configuração de uploads simplificada
setTimeout(() => {
    Helpers.setupUpload('pdfFileInput', 'pdfUploadArea', 
        files => window.MediaSystem?.addPdfs?.(files), 'pdf_addition');
    
    Helpers.setupUpload('fileInput', 'uploadArea', 
        files => {
            window.MediaSystem?.addFiles?.(files);
            setTimeout(() => window.forceMediaPreviewUpdate?.(), 300);
        }, 'media_addition');
}, 1000);

/* ==========================================================
   BOTÃO DE VERIFICAÇÃO DE PDFs (SEGURO E SIMPLES)
   ========================================================== */
// ✅ BOTÃO DE TESTE SEGURO - SEM MODIFICAR ESTRUTURA
setTimeout(() => {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel && !document.getElementById('simplePdfTestBtn')) {
        const testBtn = document.createElement('button');
        testBtn.id = 'simplePdfTestBtn';
        testBtn.innerHTML = '<i class="fas fa-search"></i> Verificar PDFs';
        testBtn.onclick = async function() {
            if (!window.editingPropertyId) {
                alert('Edite um imóvel primeiro para testar.');
                return;
            }
            
            const result = await window.checkPdfPersistence?.(window.editingPropertyId);
            if (result) {
                const count = result.pdfs ? result.pdfs.split(',').filter(p => p.trim()).length : 0;
                alert(`📊 Estado no Supabase:\n\nTítulo: ${result.title}\nPDFs: ${count} documento(s)\n\nVerifique console para detalhes.`);
            } else {
                alert('❌ Não foi possível verificar estado no Supabase.');
            }
        };
        
        testBtn.style.cssText = `
            background: #2ecc71; color: white; border: none;
            padding: 0.6rem 1rem; border-radius: 5px; cursor: pointer;
            margin: 0.5rem; font-size: 0.9rem; display: inline-flex;
            align-items: center; gap: 0.5rem;
        `;
        
        const panelActions = adminPanel.querySelector('div:first-child');
        if (panelActions) panelActions.appendChild(testBtn);
    }
}, 3000);

/* ==========================================================
   FUNÇÃO DE TESTE SEGURO PARA SUPABASE
   ========================================================== */
window.testSupabaseConnectionSafe = async function() {
    console.group('🧪 TESTE DE CONEXÃO SEGURA COM SUPABASE');
    
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.error('❌ Credenciais Supabase não configuradas');
        alert('❌ Configure SUPABASE_URL e SUPABASE_KEY primeiro!');
        console.groupEnd();
        return;
    }
    
    console.log('🔍 Verificando conexão...');
    
    try {
        // Testar conexão básica
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: {
                'apikey': window.SUPABASE_KEY,
                'Authorization': `Bearer ${window.SUPABASE_KEY}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexão com Supabase: OK');
            
            // Verificar IDs existentes
            const idsResponse = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id,title&order=id.desc&limit=5`, {
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });
            
            if (idsResponse.ok) {
                const properties = await idsResponse.json();
                console.log('📋 IDs disponíveis no Supabase:', properties);
                
                if (properties.length > 0) {
                    alert(`✅ Conexão com Supabase estabelecida!\n\nIDs disponíveis:\n${properties.map(p => `• ID ${p.id}: ${p.title || 'Sem título'}`).join('\n')}`);
                } else {
                    alert('✅ Conexão com Supabase estabelecida!\n\nTabela "properties" existe, mas está vazia.');
                }
            }
        } else {
            console.error('❌ Erro na conexão:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Detalhes do erro:', errorText);
            alert(`❌ Erro na conexão: ${response.status} ${response.statusText}\n\n${errorText.substring(0, 200)}...`);
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        alert(`❌ Erro: ${error.message}`);
    }
    
    console.groupEnd();
};

/* ==========================================================
   FUNÇÃO DE TESTE PARA DIAGNÓSTICO DE PDFs (ATUALIZADA)
   ========================================================== */
window.testPdfPersistence = async function() {
    console.group('🧪 TESTE DE PERSISTÊNCIA DE PDFs (COM VALIDAÇÃO DE ID)');
    
    if (!window.editingPropertyId) {
        console.error('❌ Nenhum imóvel em edição');
        alert('❌ Nenhum imóvel em edição. Edite um imóvel primeiro.');
        console.groupEnd();
        return;
    }
    
    const propertyId = window.editingPropertyId;
    const property = window.properties.find(p => p.id === propertyId);
    
    if (!property) {
        console.error('❌ Imóvel não encontrado');
        alert('❌ Imóvel não encontrado');
        console.groupEnd();
        return;
    }
    
    console.log('🔍 Imóvel em teste:', {
        id: property.id,
        tipoId: typeof property.id,
        title: property.title,
        pdfsAtuais: property.pdfs || 'Nenhum',
        pdfsCount: property.pdfs ? property.pdfs.split(',').filter(p => p.trim()).length : 0
    });
    
    // ✅ VALIDAR ID ANTES DE TESTAR
    let validId = null;
    if (window.adminPdfHandler && window.adminPdfHandler.validateIdForSupabase) {
        validId = window.adminPdfHandler.validateIdForSupabase(propertyId);
        console.log('✅ ID validado para Supabase:', validId);
        
        if (!validId) {
            console.error('❌ ID inválido para testes com Supabase');
            alert('⚠️ ID do imóvel não é compatível com Supabase.\n\nUse um ID numérico para testes.');
            console.groupEnd();
            return;
        }
    }
    
    // 1. Testar adminPdfHandler
    console.log('\n1. Testando adminPdfHandler.process()...');
    if (window.adminPdfHandler && window.adminPdfHandler.process) {
        try {
            const pdfUrls = await window.adminPdfHandler.process(propertyId, property.title);
            console.log('✅ adminPdfHandler.process() retornou:', {
                pdfs: pdfUrls || 'Nenhum',
                count: pdfUrls ? pdfUrls.split(',').filter(p => p.trim()).length : 0
            });
        } catch (error) {
            console.error('❌ Erro no adminPdfHandler.process():', error);
        }
    } else {
        console.error('❌ adminPdfHandler não disponível');
    }
    
    // 2. Verificar estado atual no Supabase
    console.log('\n2. Verificando estado no Supabase...');
    if (window.updateProperty && window.updateProperty.verifyPdfs) {
        if (validId) {
            const supabaseState = await window.updateProperty.verifyPdfs(validId);
            console.log('📊 Estado no Supabase:', supabaseState);
        } else {
            console.log('⚠️ ID inválido para verificação no Supabase');
        }
    }
    
    // 3. Testar persistência direta
    console.log('\n3. Testando persistência direta...');
    if (window.adminPdfHandler && window.adminPdfHandler.persistPdfsToSupabase && validId) {
        const testPdfs = 'https://exemplo.com/test1.pdf,https://exemplo.com/test2.pdf';
        const result = await window.adminPdfHandler.persistPdfsToSupabase(validId, testPdfs);
        console.log('📤 Resultado da persistência direta:', result ? '✅ Sucesso' : '❌ Falha');
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO');
    console.groupEnd();
    
    alert('🧪 Teste de persistência de PDFs concluído!\n\nVerifique o console (F12) para resultados detalhados.');
};

// Adicionar botões de teste ao painel admin
setTimeout(() => {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        // Botão Testar PDFs
        if (!document.getElementById('testPdfButton')) {
            const testBtn = document.createElement('button');
            testBtn.id = 'testPdfButton';
            testBtn.innerHTML = '<i class="fas fa-vial"></i> Testar PDFs';
            testBtn.onclick = window.testPdfPersistence;
            testBtn.style.cssText = `
                background: #9b59b6; color: white; border: none;
                padding: 0.8rem 1.5rem; border-radius: 5px; cursor: pointer;
                margin: 0.5rem; display: inline-flex; align-items: center;
                gap: 0.5rem; font-weight: 600;
            `;
            testBtn.title = 'Testar persistência de PDFs no Supabase';
            
            const panelActions = adminPanel.querySelector('.panel-actions') || 
                               adminPanel.querySelector('div:first-child');
            if (panelActions) {
                panelActions.appendChild(testBtn);
            }
        }
        
        // Botão Testar Supabase
        if (!document.getElementById('testSupabaseButton')) {
            const supabaseBtn = document.createElement('button');
            supabaseBtn.id = 'testSupabaseButton';
            supabaseBtn.innerHTML = '<i class="fas fa-database"></i> Testar Supabase';
            supabaseBtn.onclick = window.testSupabaseConnectionSafe;
            supabaseBtn.style.cssText = `
                background: #3498db; color: white; border: none;
                padding: 0.8rem 1.5rem; border-radius: 5px; cursor: pointer;
                margin: 0.5rem; display: inline-flex; align-items: center;
                gap: 0.5rem; font-weight: 600;
            `;
            supabaseBtn.title = 'Testar conexão segura com Supabase';
            
            const panelActions = adminPanel.querySelector('.panel-actions') || 
                               adminPanel.querySelector('div:first-child');
            if (panelActions) {
                panelActions.appendChild(supabaseBtn);
            }
        }
    }
}, 2500);

/* ==========================================================
   LISTENER PARA LIMPEZA PERIÓDICA DE PDFs REMANESCENTES
   ========================================================== */
(function setupCleanupListener() {
    // Limpar PDFs remanescentes periodicamente (a cada 2 minutos)
    setInterval(() => {
        if (!window.editingPropertyId) {
            window.clearStalePdfs();
        }
    }, 2 * 60 * 1000);
    
    // Limpar ao carregar a página
    window.addEventListener('load', function() {
        setTimeout(() => window.clearStalePdfs(), 2000);
    });
})();

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.setupAdminUI, 500);
    });
} else {
    setTimeout(window.setupAdminUI, 300);
}

console.log('✅ admin.js - SISTEMA COMPLETO COM CORREÇÕES IMPLEMENTADO');
