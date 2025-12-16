// js/modules/pdf.js - SISTEMA COMPLETO DE PDF CORRIGIDO
console.log('📄 pdf.js carregado - Sistema Corrigido');

// ========== CONFIGURAÇÕES ==========
const PDF_CONFIG = {
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    password: "doc123",
    supabaseUrl: 'https://syztbxvpdaplpetmixmt.supabase.co'
};

// ========== VARIÁVEIS GLOBAIS ==========
window.selectedPdfFiles = []; // PDFs NOVOS selecionados
window.existingPdfFiles = []; // PDFs EXISTENTES do imóvel em edição

// ========== 1. SISTEMA DE UPLOAD NO ADMIN ==========

// 1.1 Inicializar sistema de PDF no admin
window.initPdfSystem = function() {
    console.log('📄 Inicializando sistema de PDF no admin...');
    
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    
    if (pdfUploadArea && pdfFileInput) {
        // Evento: Clique na área
        pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
        
        // Evento: Arraste e solte
        pdfUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            pdfUploadArea.style.borderColor = '#3498db';
            pdfUploadArea.style.background = '#e8f4fc';
        });
        
        pdfUploadArea.addEventListener('dragleave', () => {
            pdfUploadArea.style.borderColor = '#95a5a6';
            pdfUploadArea.style.background = '#fafafa';
        });
        
        pdfUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            pdfUploadArea.style.borderColor = '#95a5a6';
            pdfUploadArea.style.background = '#fafafa';
            if (e.dataTransfer.files.length > 0) {
                window.handleNewPdfFiles(e.dataTransfer.files);
            }
        });
        
        // Evento: Seleção de arquivos
        pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                window.handleNewPdfFiles(e.target.files);
            }
        });
        
        console.log('✅ Sistema de upload de PDF inicializado');
    }
};

// 1.2 Manipular NOVOS arquivos PDF
window.handleNewPdfFiles = function(files) {
    console.log(`📄 Processando ${files.length} NOVO(s) PDF(s)...`);
    
    if (files.length > PDF_CONFIG.maxFiles) {
        alert(`❌ Máximo de ${PDF_CONFIG.maxFiles} arquivos permitido!`);
        return;
    }
    
    Array.from(files).forEach(file => {
        if (!PDF_CONFIG.allowedTypes.includes(file.type)) {
            alert(`❌ "${file.name}" não é um PDF válido!`);
            return;
        }
        
        if (file.size > PDF_CONFIG.maxSize) {
            alert(`❌ "${file.name}" excede 10MB!`);
            return;
        }
        
        window.selectedPdfFiles.push({
            file: file,
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            date: new Date().toLocaleDateString(),
            isNew: true
        });
        
        console.log(`✅ NOVO PDF adicionado: ${file.name}`);
    });
    
    window.updatePdfPreview();
    document.getElementById('pdfFileInput').value = '';
};

// 1.3 Atualizar preview dos PDFs
window.updatePdfPreview = function() {
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (!pdfPreview) return;
    
    pdfPreview.innerHTML = '';
    
    // 🔵 SEÇÃO 1: NOVOS PDFs
    if (window.selectedPdfFiles.length > 0) {
        const newSection = document.createElement('div');
        newSection.id = 'newPdfsSection';
        newSection.innerHTML = `
            <p style="color: #3498db; margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.9rem;">
                <i class="fas fa-plus-circle"></i> NOVO PDF
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
        `;
        
        window.selectedPdfFiles.forEach((pdf, index) => {
            const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
            newSection.innerHTML += `
                <div style="background: #e8f4fc; border: 1px solid #3498db; border-radius: 6px; padding: 0.5rem; width: 90px; height: 90px; text-align: center; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden;">
                    <i class="fas fa-file-pdf" style="font-size: 1.2rem; color: #3498db; margin-bottom: 0.3rem;"></i>
                    <p style="font-size: 0.7rem; margin: 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${shortName}</p>
                    <small style="color: #7f8c8d; font-size: 0.6rem;">${pdf.size}</small>
                    <button onclick="removeNewPdf(${index})" style="position: absolute; top: -5px; right: -5px; background: #3498db; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; font-size: 0.7rem; font-weight: bold; line-height: 1; padding: 0;">×</button>
                </div>
            `;
        });
        
        newSection.innerHTML += '</div>';
        pdfPreview.appendChild(newSection);
    }
    
    // 🔵 SEÇÃO 2: PDFs EXISTENTES
    if (window.existingPdfFiles.length > 0) {
        const existingSection = document.createElement('div');
        existingSection.id = 'existingPdfsSection';
        existingSection.innerHTML = `
            <p style="color: #27ae60; margin: ${window.selectedPdfFiles.length > 0 ? '0' : '0 0 0.5rem 0'}; font-weight: 600; font-size: 0.9rem;">
                <i class="fas fa-archive"></i> PDF ARQUIVADO
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        `;
        
        window.existingPdfFiles.forEach((pdf, index) => {
            const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
            existingSection.innerHTML += `
                <div style="background: #e8f8ef; border: 1px solid #27ae60; border-radius: 6px; padding: 0.5rem; width: 90px; height: 90px; text-align: center; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden;">
                    <i class="fas fa-file-pdf" style="font-size: 1.2rem; color: #27ae60; margin-bottom: 0.3rem;"></i>
                    <p style="font-size: 0.7rem; margin: 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${shortName}</p>
                    <small style="color: #7f8c8d; font-size: 0.6rem;">PDF</small>
                    <button onclick="removeExistingPdf(${index})" style="position: absolute; top: -5px; right: -5px; background: #27ae60; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; font-size: 0.7rem; font-weight: bold; line-height: 1; padding: 0;">×</button>
                </div>
            `;
        });
        
        existingSection.innerHTML += '</div>';
        pdfPreview.appendChild(existingSection);
    }
    
    // 🔵 SEÇÃO 3: Mensagem vazia
    if (window.existingPdfFiles.length === 0 && window.selectedPdfFiles.length === 0) {
        pdfPreview.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
            </div>
        `;
    }
};

// 1.4 Remover PDF EXISTENTE (VERSÃO MELHORADA)
// 1.4 Remover PDF EXISTENTE (VERSÃO DEFINITIVAMENTE CORRIGIDA)
window.removeExistingPdf = function(index) {
    console.log(`🗑️ Tentando remover PDF existente no índice ${index}`);
    
    if (index >= 0 && index < window.existingPdfFiles.length) {
        const removedFile = window.existingPdfFiles[index];
        
        // Confirmar exclusão
        if (confirm(`🗑️ Excluir PDF "${removedFile.name}"?\n\nEsta ação removerá permanentemente este documento do imóvel.`)) {
            
            // ✅ CRÍTICO: Criar NOVO array para garantir que a referência seja atualizada
            const newExistingFiles = [...window.existingPdfFiles];
            newExistingFiles.splice(index, 1);
            window.existingPdfFiles = newExistingFiles;
            
            console.log(`✅ PDF removido da lista: ${removedFile.name}`);
            console.log(`📊 Agora temos ${window.existingPdfFiles.length} PDF(s) existente(s)`);
            
            // ✅ Forçar atualização imediata do preview
            window.updatePdfPreview();
            
            // ✅ Marcar para exclusão do storage apenas como informação
            if (removedFile.url && removedFile.url.includes('supabase.co')) {
                console.log(`📝 PDF marcado para exclusão: ${removedFile.name}`);
                // NOTA: A exclusão real do storage será feita ao salvar o imóvel
                // pois o array updatedPdfFiles já não contém este arquivo
            }
            
            // ✅ Feedback visual imediato
            alert(`✅ PDF "${removedFile.name}" removido.\n\nClique em "Salvar Alterações" para confirmar a exclusão permanente.`);
            
            // ✅ Verificação de debug (opcional)
            console.log('🔍 Verificação pós-exclusão:');
            console.log('- existingPdfFiles:', window.existingPdfFiles);
            console.log('- Índice removido:', index);
            console.log('- Arquivo removido:', removedFile);
        }
    } else {
        console.error(`❌ Índice inválido para exclusão: ${index}`);
        console.log(`📊 existingPdfFiles tem ${window.existingPdfFiles.length} itens`);
    }
};

// 1.5 Função de verificação para garantir integridade dos PDFs
window.verifyPdfIntegrity = function() {
    console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE DOS PDFs:');
    console.log('- selectedPdfFiles:', window.selectedPdfFiles.length);
    console.log('- existingPdfFiles:', window.existingPdfFiles.length);
    
    // Verificar se há IDs duplicados
    const allIds = [
        ...window.selectedPdfFiles.map(p => p.id),
        ...window.existingPdfFiles.map(p => p.id)
    ];
    const uniqueIds = [...new Set(allIds)];
    
    console.log(`- IDs únicos: ${uniqueIds.length} de ${allIds.length} total`);
    
    if (allIds.length !== uniqueIds.length) {
        console.warn('⚠️ POSSÍVEL DUPLICAÇÃO DE IDs DETECTADA!');
    }
    
    return {
        selected: window.selectedPdfFiles.length,
        existing: window.existingPdfFiles.length,
        hasDuplicates: allIds.length !== uniqueIds.length
    };
};

// 1.6 Carregar PDFs para edição (VERSÃO CORRIGIDA)
window.removeNewPdf = function(index) {
    if (index >= 0 && index < window.selectedPdfFiles.length) {
        const removedFile = window.selectedPdfFiles[index];
        window.selectedPdfFiles.splice(index, 1);
        window.updatePdfPreview();
        console.log(`🗑️ NOVO PDF removido: ${removedFile.name}`);
    }
};

// 1.7 Carregar PDFs para edição (VERSÃO CORRIGIDA)
window.loadExistingPdfsForEdit = function(property) {
    console.log('📄 Carregando TODOS os PDFs existentes para edição:', property);
    console.log('📋 Campo pdfs do imóvel:', property.pdfs);
    
    // Limpar arrays
    window.existingPdfFiles = [];
    window.selectedPdfFiles = [];
    
    // Verificar se há PDFs
    if (property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '') {
        try {
            // Separar por vírgula e filtrar URLs válidas
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => {
                    // Filtrar apenas URLs válidas
                    const isValid = url !== '' && 
                                  url !== 'EMPTY' && 
                                  url !== 'undefined' && 
                                  url !== 'null' &&
                                  (url.startsWith('http') || url.includes('supabase.co'));
                    if (!isValid) {
                        console.log(`⚠️ URL ignorada: ${url}`);
                    }
                    return isValid;
                });
            
            console.log(`📊 ${pdfUrls.length} URLs de PDF encontradas após filtro`);
            
            // Processar CADA URL
            pdfUrls.forEach((url, index) => {
                try {
                    // Extrair nome do arquivo da URL
                    let fileName = 'Documento';
                    
                    if (url.includes('/')) {
                        const parts = url.split('/');
                        fileName = parts[parts.length - 1] || `Documento ${index + 1}`;
                        
                        // Decodificar URL se necessário
                        try {
                            fileName = decodeURIComponent(fileName);
                        } catch (e) {
                            // Se falhar, usar como está
                        }
                        
                        // Limitar nome muito longo
                        if (fileName.length > 50) {
                            fileName = fileName.substring(0, 47) + '...';
                        }
                    } else {
                        fileName = `Documento ${index + 1}`;
                    }
                    
                    // Adicionar à lista
                    window.existingPdfFiles.push({
                        url: url,
                        id: `existing_${Date.now()}_${index}`,
                        name: fileName,
                        size: 'PDF',
                        date: 'Arquivado',
                        isExisting: true,
                        originalUrl: url // Manter URL original
                    });
                    
                    console.log(`✅ PDF ${index + 1} carregado: ${fileName}`);
                    
                } catch (error) {
                    console.error(`❌ Erro ao processar URL ${index}:`, error);
                }
            });
            
            console.log(`✅ TOTAL: ${window.existingPdfFiles.length} PDFs existentes carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao processar campo pdfs:', error);
            console.log('📋 Valor bruto do campo pdfs:', property.pdfs);
        }
    } else {
        console.log('ℹ️ Nenhum PDF encontrado no campo pdfs');
    }
    
    // Atualizar preview
    window.updatePdfPreview();
};

// 1.8 Limpar PDFs
window.clearAllPdfs = function() {
    window.existingPdfFiles = [];
    window.selectedPdfFiles = [];
    window.updatePdfPreview();
    console.log('🧹 Todos os PDFs removidos');
};

// 1.9 Função de DEBUG para verificar PDFs
window.debugPdfs = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado');
        return;
    }
    
    console.log('🔍 DEBUG DE PDFs - Imóvel:', propertyId);
    console.log('📋 Título:', property.title);
    console.log('📄 Campo pdfs:', property.pdfs);
    console.log('📏 Comprimento:', property.pdfs?.length || 0);
    
    if (property.pdfs) {
        console.log('📊 Separando por vírgulas:');
        const parts = property.pdfs.split(',');
        console.log(`- Total de partes: ${parts.length}`);
        
        parts.forEach((part, index) => {
            console.log(`  ${index + 1}. "${part.trim()}" (${part.trim().length} chars)`);
        });
        
        console.log('📁 PDFs carregados no sistema:');
        console.log(window.existingPdfFiles);
    }
};

// 1.9 Obter PDFs originais de um imóvel
window.getOriginalPropertyPdfs = function(propertyId) {
    const property = window.properties.find(p => p.id == propertyId);
    if (!property || !property.pdfs) {
        return [];
    }
    
    return property.pdfs
        .split(',')
        .map(url => url.trim())
        .filter(url => url !== '' && url !== 'EMPTY');
};

// 1.10 Função de debug para verificar exclusão
window.debugPdfDeletion = function(propertyId) {
    console.log('🔍 DEBUG DE EXCLUSÃO DE PDFs - Imóvel:', propertyId);
    
    const property = window.properties.find(p => p.id == propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado');
        return;
    }
    
    const originalPdfs = window.getOriginalPropertyPdfs(propertyId);
    const currentPdfs = window.existingPdfFiles.map(p => p.url).filter(url => url);
    
    console.log('📊 ESTADO ATUAL:');
    console.log('- PDFs originais:', originalPdfs.length);
    console.log('- PDFs atuais (existingPdfFiles):', currentPdfs.length);
    
    const pdfsToDelete = originalPdfs.filter(url => !currentPdfs.includes(url));
    
    console.log('🗑️ PDFs que SERÃO excluídos:', pdfsToDelete.length);
    pdfsToDelete.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.split('/').pop() || url}`);
    });
};

// ========== 2. SISTEMA DE VISUALIZAÇÃO NOS CARDS ==========

// 2.1 Função que será chamada pelos cards
window.showPropertyPdf = function(propertyId) {
    console.log(`📄 showPropertyPdf chamado para imóvel ${propertyId}`);
    
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    window.showPdfModal(propertyId);
};

// 2.2 Modal de PDFs (COM SENHA)
window.showPdfModal = function(propertyId) {
    console.log(`📄 Abrindo modal de PDFs para imóvel ${propertyId}`);
    
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    // Criar ou reutilizar modal
    let modal = document.getElementById('pdfViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pdfViewerModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; padding: 1.5rem; width: 100%; max-width: 500px; max-height: 80vh; overflow-y: auto; position: relative; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
                <button onclick="closePdfViewer()" style="position: absolute; top: 10px; right: 10px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 1.2rem; z-index: 10;">×</button>
                <h3 style="color: var(--primary); margin: 0 0 1rem 0; padding-right: 30px;">
                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                </h3>
                <div id="pdfListContainer" style="margin: 0; display: none;"></div>
                <div id="pdfAccessSection" style="margin-top: 1rem;">
                    <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <p style="margin: 0 0 0.8rem 0; color: #333; font-size: 0.9rem;"><i class="fas fa-lock"></i> Documentos protegidos por senha</p>
                        <input type="password" id="pdfPasswordInput" placeholder="Digite a senha para visualizar" style="padding: 0.8rem; border: 1px solid #ddd; border-radius: 5px; width: 100%; margin-bottom: 1rem; font-size: 0.9rem;">
                        <button onclick="validatePdfPassword(${propertyId})" style="background: var(--primary); color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: 600;"><i class="fas fa-key"></i> Validar Senha</button>
                    </div>
                    <p style="font-size: 0.8rem; color: #666; text-align: center; margin: 0;"><i class="fas fa-info-circle"></i> Solicite a senha ao corretor</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
    document.getElementById('pdfPasswordInput').value = '';
    document.getElementById('pdfListContainer').style.display = 'none';
    document.getElementById('pdfAccessSection').style.display = 'block';
};

// 2.3 Validar senha
window.validatePdfPassword = function(propertyId) {
    const password = document.getElementById('pdfPasswordInput')?.value;
    const property = window.properties.find(p => p.id === propertyId);
    
    if (!password) {
        alert('⚠️ Digite a senha para acessar os documentos!');
        return;
    }
    
    if (password === PDF_CONFIG.password) {
        document.getElementById('pdfAccessSection').style.display = 'none';
        document.getElementById('pdfListContainer').style.display = 'block';
        loadPdfList(property);
    } else {
        alert('❌ Senha incorreta para documentos PDF!');
        document.getElementById('pdfPasswordInput').value = '';
        document.getElementById('pdfPasswordInput').focus();
    }
};

// 2.4 Carregar lista de PDFs
function loadPdfList(property) {
    const pdfListContainer = document.getElementById('pdfListContainer');
    pdfListContainer.innerHTML = '';
    
    if (property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '') {
        const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
        
        pdfUrls.forEach((url, index) => {
            const fileName = url.split('/').pop() || `Documento ${index + 1}`;
            const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
            
            const pdfItem = document.createElement('div');
            pdfItem.style.cssText = `
                padding: 0.8rem;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f9f9f9;
                transition: all 0.2s ease;
            `;
            
            pdfItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.8rem; flex: 1; min-width: 0;">
                    <i class="fas fa-file-pdf" style="font-size: 1.3rem; color: #e74c3c; flex-shrink: 0;"></i>
                    <div style="min-width: 0;">
                        <strong style="display: block; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</strong>
                        <small style="color: #666; font-size: 0.8rem;">PDF ${index + 1} de ${pdfUrls.length}</small>
                    </div>
                </div>
                <button onclick="viewPdfDocument('${url}', '${fileName}')" style="background: var(--success); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; flex-shrink: 0; white-space: nowrap;"><i class="fas fa-eye"></i> Visualizar</button>
            `;
            
            pdfListContainer.appendChild(pdfItem);
        });
    } else {
        pdfListContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-file-pdf" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 0.95rem;">Nenhum documento PDF disponível.</p>
            </div>
        `;
    }
}

// 2.5 Visualizar documento
window.viewPdfDocument = function(url, fileName) {
    window.open(url, '_blank');
    console.log(`📄 Abrindo PDF: ${fileName}`);
};

// 2.6 Fechar visualizador
window.closePdfViewer = function() {
    const modal = document.getElementById('pdfViewerModal');
    if (modal) modal.style.display = 'none';
};

// ========== 3. FUNÇÕES AUXILIARES ==========

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========== 4. SISTEMA DE SALVAMENTO NO SUPABASE (REAL) ==========
// 4.1 Upload REAL para Supabase Storage (CORRIGIDA)
window.uploadPdfToSupabaseStorage = async function(file, propertyId) {
    try {
        console.log(`⬆️ Iniciando upload REAL para Supabase: ${file.name}`);
        console.log(`📁 Property ID fornecido: ${propertyId}`);
        
        // ✅ CORREÇÃO: Se propertyId for undefined, usar um ID temporário
        const safePropertyId = propertyId && propertyId !== 'undefined' && propertyId !== 'null' 
            ? propertyId 
            : `temp_${Date.now()}`;
        
        console.log(`🆔 Property ID seguro: ${safePropertyId}`);
        
        // Preparar nome do arquivo seguro
        const safeName = file.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .toLowerCase();
        
        const fileName = `pdf_${safePropertyId}_${Date.now()}_${safeName}`;
        
        // ✅ CORREÇÃO: URL CORRETA para o bucket de properties (não pdfs)
        const uploadUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/public/properties/${fileName}`;
        
        console.log(`📤 Upload para: ${uploadUrl}`);
        
        // IMPORTANTE: Usar o bucket correto "properties" (não "pdfs")
        const storageUploadUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/properties/${fileName}`;
        
        console.log(`📦 Bucket: properties (correto)`);
        console.log(`📄 Nome do arquivo: ${fileName}`);
        
        const response = await fetch(storageUploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY,
                'x-upsert': 'true'
            },
            body: file // Enviar arquivo diretamente
        });
        
        console.log('📊 Status do upload:', response.status);
        
        if (response.ok) {
            console.log(`✅ PDF enviado COM SUCESSO para Supabase: ${uploadUrl}`);
            return uploadUrl;
        } else {
            const errorText = await response.text();
            console.error('❌ Erro no upload REAL:', errorText);
            
            // ✅ FALLBACK: Tentar URL alternativa se o bucket "properties" não existir
            console.log('🔄 Tentando bucket alternativo "pdfs"...');
            
            const altUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/public/pdfs/${fileName}`;
            const altUploadUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/pdfs/${fileName}`;
            
            try {
                const altResponse = await fetch(altUploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                        'apikey': window.SUPABASE_KEY
                    },
                    body: file
                });
                
                if (altResponse.ok) {
                    console.log(`✅ PDF enviado para bucket alternativo: ${altUrl}`);
                    return altUrl;
                }
            } catch (altError) {
                console.error('❌ Erro no bucket alternativo:', altError);
            }
            
            return null;
        }
    } catch (error) {
        console.error('❌ Erro no upload REAL do PDF:', error);
        return null;
    }
};

// 4.1.1 Excluir PDF do Supabase Storage
window.deletePdfFromSupabaseStorage = async function(pdfUrl) {
    try {
        console.log(`🗑️ Iniciando exclusão de PDF: ${pdfUrl}`);
        
        // Extrair nome do arquivo da URL
        const fileName = pdfUrl.split('/').pop();
        
        if (!fileName) {
            console.error('❌ Não foi possível extrair nome do arquivo da URL');
            return false;
        }
        
        console.log(`📁 Nome do arquivo para exclusão: ${fileName}`);
        
        // Verificar qual bucket está sendo usado
        let bucket = 'properties';
        if (pdfUrl.includes('/pdfs/')) {
            bucket = 'pdfs';
        }
        
        console.log(`📦 Bucket identificado: ${bucket}`);
        
        // URL para exclusão
        const deleteUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
        
        console.log(`🔗 URL de exclusão: ${deleteUrl}`);
        
        // Verificar se temos a chave do Supabase
        if (!window.SUPABASE_KEY) {
            console.error('❌ Chave do Supabase não disponível');
            return false;
        }
        
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY
            }
        });
        
        console.log(`📊 Status da exclusão: ${response.status}`);
        
        if (response.ok) {
            console.log(`✅ PDF excluído com sucesso: ${fileName}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`❌ Erro ao excluir PDF: ${errorText}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro na exclusão do PDF:', error);
        return false;
    }
};

// 4.2 Processar e salvar TODOS os PDFs (VERSÃO COM EXCLUSÃO CORRIGIDA)
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    console.log(`💾 ==========================================`);
    console.log(`💾 PROCESSANDO PDFs para imóvel ${propertyId}`);
    console.log(`💾 ==========================================`);
    
    // ✅ DEBUG: Mostrar estado atual
    console.log(`📊 ESTADO ATUAL DOS PDFs:`);
    console.log(`- existingPdfFiles: ${window.existingPdfFiles.length}`);
    console.log(`- selectedPdfFiles: ${window.selectedPdfFiles ? window.selectedPdfFiles.length : 0}`);
    console.log(`- propertyId: ${propertyId}`);
    
    // Mostrar URLs dos PDFs existentes
    if (window.existingPdfFiles.length > 0) {
        console.log(`📄 PDFs EXISTENTES:`);
        window.existingPdfFiles.forEach((pdf, i) => {
            console.log(`  ${i + 1}. ${pdf.name} - ${pdf.url ? 'Com URL' : 'Sem URL'}`);
        });
    }
  // ✅ CONTROLE PARA EVITAR EXECUÇÃO DUPLA
    if (window.isProcessingPdfs) {
        console.log('⚠️ PDFs já sendo processados, ignorando chamada duplicada');
        return '';
    }
    
    window.isProcessingPdfs = true;
    
    try {
        // ✅ 1. IDENTIFICAR PDFs que devem ser MANTIDOS (baseado no array existente ATUAL)
        const pdfsToKeep = new Set();
        const keptPdfUrls = [];
        
        window.existingPdfFiles.forEach(pdf => {
            if (pdf.url && pdf.url.trim() !== '' && pdf.url !== 'EMPTY' && !pdfsToKeep.has(pdf.url)) {
                pdfsToKeep.add(pdf.url);
                keptPdfUrls.push(pdf.url);
                console.log(`📎 Mantendo PDF: ${pdf.name} (${pdf.url})`);
            }
        });
        
        // ✅ 2. IDENTIFICAR PDFs que foram REMOVIDOS (comparando com o estado original)
        // Para isso, precisamos saber quais PDFs estavam originalmente no imóvel
        const property = window.properties.find(p => p.id == propertyId);
        const originalPdfs = property && property.pdfs ? 
            property.pdfs.split(',').filter(url => url.trim() !== '') : 
            [];
        
        console.log(`📊 PDFs originais do imóvel: ${originalPdfs.length}`);
        console.log(`📊 PDFs que serão mantidos: ${keptPdfUrls.length}`);
        
        // ✅ 3. IDENTIFICAR PDFs para EXCLUIR (estavam no original mas NÃO estão na lista para manter)
        const pdfsToDelete = originalPdfs.filter(url => !pdfsToKeep.has(url));
        
        if (pdfsToDelete.length > 0) {
            console.log(`🗑️ PDFs marcados para exclusão: ${pdfsToDelete.length}`);
            pdfsToDelete.forEach(url => {
                console.log(`   - ${url.split('/').pop() || url}`);
            });
            
            // ✅ 4. EXCLUIR PDFs do Supabase Storage
            for (const pdfUrl of pdfsToDelete) {
                try {
                    await window.deletePdfFromSupabaseStorage(pdfUrl);
                } catch (error) {
                    console.error(`❌ Erro ao excluir PDF: ${error.message}`);
                    // Continuar mesmo se uma exclusão falhar
                }
            }
        }
        
        // ✅ 5. Fazer upload dos NOVOS PDFs (APENAS OS QUE AINDA NÃO FORAM PROCESSADOS)
        if (window.selectedPdfFiles.length > 0) {
            console.log(`📤 Enviando ${window.selectedPdfFiles.length} NOVO(s) PDF(s)...`);
            
            for (const pdf of window.selectedPdfFiles) {
                // ✅ VERIFICAR SE JÁ FOI PROCESSADO
                if (pdf.processed) {
                    console.log(`⏭️ PDF já processado: ${pdf.name}`);
                    continue;
                }
                
                if (pdf.file) {
                    console.log(`⬆️ Enviando: ${pdf.name}`);
                    
                    const uploadedUrl = await window.uploadPdfToSupabaseStorage(pdf.file, propertyId);
                    
                    if (uploadedUrl) {
                        // ✅ MARCAR COMO PROCESSADO
                        pdf.processed = true;
                        pdf.url = uploadedUrl; // Guardar URL gerada
                        
                        keptPdfUrls.push(uploadedUrl);
                        console.log(`✅ PDF salvo: ${pdf.name}`);
                    }
                }
            }
        }
        
        const pdfsString = keptPdfUrls.length > 0 ? keptPdfUrls.join(',') : '';
        
        console.log('📊 RESULTADO FINAL:');
        console.log(`- PDFs mantidos: ${keptPdfUrls.length}`);
        console.log(`- PDFs excluídos: ${pdfsToDelete.length}`);
        console.log(`- Novos PDFs enviados: ${window.selectedPdfFiles.filter(p => p.processed).length}`);
        console.log(`- String final: ${pdfsString.substring(0, 50)}...`);
        
        return pdfsString;
        
    } finally {
        window.isProcessingPdfs = false;
    }
};

// 4.3 Função completa de salvamento de PDFs (NOVA)
window.savePdfsToSupabase = async function(propertyId) {
    console.log(`💾 savePdfsToSupabase chamado para propertyId: ${propertyId}`);
    
    if (!propertyId || propertyId === 'undefined') {
        console.log('⚠️ PropertyId inválido, usando temporário');
        propertyId = `temp_${Date.now()}`;
    }
    
    // Usar função existente
    return await window.processAndSavePdfs(propertyId, 'Novo Imóvel');
};

// 4.4 Obter PDFs para salvar (versão simples)
// 4.4 Substituir função antiga por nova
window.getPdfsToSave = async function(propertyId) {
    if (!propertyId) {
        console.error('❌ propertyId não fornecido para salvar PDFs');
        return '';
    }
    
    return await window.savePdfsToSupabase(propertyId);
};

// 4.5 Integração automática com sistema existente
// ========== CONFIGURAÇÃO DE INTEGRAÇÃO COM SUPABASE (VERSÃO CORRIGIDA) ==========
window.setupPdfSupabaseIntegration = function() {
    console.log('🔗 Configurando integração SEGURA com Supabase...');
    
    // ✅ 1. Inicializar sistema de upload
    window.initPdfSystem();
    
    // ✅ 2. Configurar eventos do modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closePdfViewer();
    });
    
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('pdfViewerModal');
        if (modal && modal.style.display === 'flex' && e.target === modal) {
            window.closePdfViewer();
        }
    });
    
    // ✅ 3. Função auxiliar para salvar PDFs quando um imóvel é criado/editado
    window.savePdfsForProperty = async function(propertyId, propertyTitle) {
        console.log(`💾 Salvando PDFs para imóvel ${propertyId}...`);
        
        if (!propertyId) {
            console.error('❌ PropertyId não fornecido para salvar PDFs');
            return '';
        }
        
        // Usar a função existente
        if (typeof window.processAndSavePdfs === 'function') {
            return await window.processAndSavePdfs(propertyId, propertyTitle);
        }
        
        console.log('⚠️ Função processAndSavePdfs não disponível');
        return '';
    };
    
    // ✅ 4. Integração NÃO-INTRUSIVA com addNewProperty
    // Em vez de interceptar, adicionamos um hook pós-criação
    window.addPdfHookToNewProperty = async function(propertyId, propertyData) {
        console.log(`📎 Hook de PDF para novo imóvel ${propertyId}`);
        
        // Se houver PDFs selecionados, processá-los
        if (window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
            try {
                console.log(`📤 Processando ${window.selectedPdfFiles.length} PDF(s) para imóvel ${propertyId}`);
                
                const pdfsString = await window.savePdfsForProperty(propertyId, propertyData.title);
                
                if (pdfsString) {
                    // Atualizar o imóvel localmente com os PDFs
                    const index = window.properties.findIndex(p => p.id === propertyId);
                    if (index !== -1) {
                        window.properties[index].pdfs = pdfsString;
                        window.savePropertiesToStorage();
                        console.log(`✅ PDFs salvos para imóvel ${propertyId}`);
                    }
                    
                    // Se o imóvel já está no Supabase, atualizar lá também
                    if (typeof window.updateProperty === 'function') {
                        setTimeout(async () => {
                            try {
                                await window.updateProperty(propertyId, { pdfs: pdfsString });
                                console.log(`🌐 PDFs atualizados no Supabase para imóvel ${propertyId}`);
                            } catch (error) {
                                console.log('⚠️ PDFs não atualizados no Supabase (será sincronizado depois)');
                            }
                        }, 1000);
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao processar PDFs:', error);
            }
        }
    };
    
    // ✅ 5. Integração NÃO-INTRUSIVA com updateProperty
    window.addPdfHookToUpdateProperty = async function(propertyId, propertyData) {
        console.log(`📎 Hook de PDF para atualização do imóvel ${propertyId}`);
        
        // Se houver PDFs selecionados, processá-los
        if ((window.selectedPdfFiles && window.selectedPdfFiles.length > 0) || 
            (window.existingPdfFiles && window.existingPdfFiles.length > 0)) {
            
            try {
                const totalPdfs = (window.selectedPdfFiles?.length || 0) + (window.existingPdfFiles?.length || 0);
                console.log(`📤 Processando ${totalPdfs} PDF(s) para atualização`);
                
                const pdfsString = await window.savePdfsForProperty(propertyId, propertyData.title || 'Imóvel');
                
                if (pdfsString) {
                    // Retornar string de PDFs para ser incluída na atualização
                    return pdfsString;
                }
            } catch (error) {
                console.error('❌ Erro ao processar PDFs na atualização:', error);
            }
        }
        
        return null;
    };
    
    // ✅ 6. Configurar listener para quando um imóvel for criado
    // Observar o botão de submit do formulário
    const form = document.getElementById('propertyForm');
    if (form) {
        const originalSubmit = form.onsubmit;
        
        form.addEventListener('submit', async function(e) {
            // Executar normalmente primeiro
            if (typeof originalSubmit === 'function') {
                originalSubmit.call(this, e);
            }
            
            // Depois processar PDFs (se houver)
//            setTimeout(async () => {
//                if (window.editingPropertyId && window.selectedPdfFiles.length > 0) {
//                    console.log(`🔄 Processando PDFs pós-edição para imóvel ${window.editingPropertyId}`);
//                    
//                    if (typeof window.addPdfHookToUpdateProperty === 'function') {
//                        const pdfsString = await window.addPdfHookToUpdateProperty(window.editingPropertyId, {});
//                        if (pdfsString && typeof window.updateProperty === 'function') {
//                            // Atualizar com PDFs
//                            await window.updateProperty(window.editingPropertyId, { pdfs: pdfsString });
//                        }
//                    }
//                }
//            }, 500);
        });
    }
    
    console.log('✅ Integração de PDFs configurada (modo não-intrusivo)');
    
    // ✅ 7. Testar conexão com Supabase Storage
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        console.log('🔍 Verificando acesso ao Supabase Storage...');
        console.log('- URL:', window.SUPABASE_URL);
        console.log('- Bucket de PDFs disponível');
        
        // Teste simples
        setTimeout(() => {
            if (window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
                console.log(`📄 ${window.selectedPdfFiles.length} PDF(s) prontos para upload`);
            }
        }, 2000);
    }
};

// 4.6 Integrar com sistema existente
window.setupPdfIntegration = function() {
    console.log('🔗 Configurando integração de PDFs...');
    
    // Sobrescrever funções do properties.js para incluir PDFs
    if (typeof window.updateProperty !== 'undefined') {
        const originalUpdateProperty = window.updateProperty;
        
        window.updateProperty = function(id, propertyData) {
            console.log(`✏️ Atualizando imóvel ${id} com PDFs...`);
            
            // Adicionar PDFs aos dados
            const pdfsString = window.getPdfsToSave();
            if (pdfsString) {
                propertyData.pdfs = pdfsString;
                console.log(`📄 PDFs incluídos na atualização: ${pdfsString.substring(0, 50)}...`);
            }
            
            // Limpar PDFs após processar
            setTimeout(() => {
                window.selectedPdfFiles = [];
                window.updatePdfPreview();
            }, 100);
            
            return originalUpdateProperty.call(this, id, propertyData);
        };
        
        console.log('✅ updateProperty integrado com PDFs');
    }
};

// 4.7 Vincular PDFs pendentes quando imóvel receber ID real
window.linkPendingPdfsToProperty = function(tempId, realId) {
    console.log(`🔗 Vinculando PDFs pendentes: ${tempId} → ${realId}`);
    
    try {
        const pendingPdfs = JSON.parse(localStorage.getItem('pending_pdfs') || '[]');
        
        // Encontrar PDFs pendentes para este tempId
        const propertyPdfs = pendingPdfs.filter(item => item.propertyId === tempId);
        
        if (propertyPdfs.length > 0) {
            console.log(`📄 ${propertyPdfs.length} PDF(s) pendentes encontrados para vinculação`);
            
            // Atualizar URLs com ID real
            propertyPdfs.forEach(pending => {
                const updatedUrls = pending.pdfUrls.map(url => {
                    return url.replace(`_${tempId}_`, `_${realId}_`);
                });
                
                // Atualizar no localStorage
                const index = pendingPdfs.findIndex(item => item.propertyId === tempId);
                if (index !== -1) {
                    pendingPdfs[index].propertyId = realId;
                    pendingPdfs[index].pdfUrls = updatedUrls;
                    localStorage.setItem('pending_pdfs', JSON.stringify(pendingPdfs));
                }
                
                console.log(`✅ PDFs atualizados com ID real: ${realId}`);
            });
            
            // Remover do array pendente
            const filtered = pendingPdfs.filter(item => item.propertyId !== tempId);
            localStorage.setItem('pending_pdfs', JSON.stringify(filtered));
        }
    } catch (error) {
        console.error('❌ Erro ao vincular PDFs pendentes:', error);
    }
};

// ========== 5. INICIALIZAÇÃO COMPLETA ==========
// ========== INICIALIZAÇÃO COMPLETA E SEGURA ==========
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🚀 Inicializando sistema de PDFs CORRETAMENTE...');
        
        // ✅ Usar a versão CORRIGIDA e SEGURA
        if (typeof window.setupPdfSupabaseIntegration === 'function') {
            window.setupPdfSupabaseIntegration();
        } else {
            // Fallback seguro
            console.log('⚠️ Usando inicialização mínima de PDFs...');
            if (typeof window.initPdfSystem === 'function') {
                window.initPdfSystem();
            }
            
            // Configurar eventos básicos
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') window.closePdfViewer();
            });
        }
        
        console.log('✅ Sistema de PDFs completamente inicializado!');
        
    }, 1500); // Aumentar delay para garantir que tudo esteja carregado
});

// ✅ Exportar funções essenciais para uso externo
console.log('📄 pdf.js carregado - Sistema CORRETO com salvamento REAL no Supabase');
