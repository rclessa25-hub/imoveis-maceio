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

// 1.4 Remover PDFs
window.removeExistingPdf = function(index) {
    if (index >= 0 && index < window.existingPdfFiles.length) {
        const removedFile = window.existingPdfFiles[index];
        window.existingPdfFiles.splice(index, 1);
        window.updatePdfPreview();
        console.log(`🗑️ PDF existente removido: ${removedFile.name}`);
        alert(`PDF "${removedFile.name}" será excluído ao salvar.`);
    }
};

window.removeNewPdf = function(index) {
    if (index >= 0 && index < window.selectedPdfFiles.length) {
        const removedFile = window.selectedPdfFiles[index];
        window.selectedPdfFiles.splice(index, 1);
        window.updatePdfPreview();
        console.log(`🗑️ NOVO PDF removido: ${removedFile.name}`);
    }
};

// 1.5 Carregar PDFs para edição
window.loadExistingPdfsForEdit = function(property) {
    console.log('📄 Carregando PDFs existentes para edição:', property);
    
    window.existingPdfFiles = [];
    window.selectedPdfFiles = [];
    
    if (property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '') {
        const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
        
        pdfUrls.forEach((url, index) => {
            const fileName = url.split('/').pop() || `Documento ${index + 1}`;
            window.existingPdfFiles.push({
                url: url,
                id: `existing_${index}`,
                name: fileName,
                size: 'PDF',
                date: 'Existente',
                isExisting: true
            });
        });
        
        console.log(`✅ ${window.existingPdfFiles.length} PDFs existentes carregados`);
    }
    
    window.updatePdfPreview();
};

// 1.6 Limpar PDFs
window.clearAllPdfs = function() {
    window.existingPdfFiles = [];
    window.selectedPdfFiles = [];
    window.updatePdfPreview();
    console.log('🧹 Todos os PDFs removidos');
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

// ========== 4. SISTEMA DE SALVAMENTO SIMPLIFICADO ==========

// ========== 4. SISTEMA DE SALVAMENTO NO SUPABASE (REAL) ==========

// 4.1 Upload REAL para Supabase Storage
window.uploadPdfToSupabaseStorage = async function(file, propertyId) {
    try {
        console.log(`⬆️ Iniciando upload REAL para Supabase: ${file.name}`);
        
        // Preparar nome do arquivo seguro
        const safeName = file.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .toLowerCase();
        
        const fileName = `pdf_${propertyId}_${Date.now()}_${safeName}`;
        const uploadUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/public/pdfs/${fileName}`;
        
        console.log(`📤 Upload para: ${uploadUrl}`);
        
        // Criar FormData para upload
        const formData = new FormData();
        formData.append('file', file);
        
        // IMPORTANTE: URL CORRETA para upload
        const storageUploadUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/pdfs/${fileName}`;
        
        const response = await fetch(storageUploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY,
                'x-upsert': 'true' // Substitui se já existir
            },
            body: formData
        });
        
        console.log('📊 Status do upload:', response.status);
        
        if (response.ok) {
            console.log(`✅ PDF enviado COM SUCESSO para Supabase: ${uploadUrl}`);
            return uploadUrl;
        } else {
            const errorText = await response.text();
            console.error('❌ Erro no upload REAL:', errorText);
            return null;
        }
    } catch (error) {
        console.error('❌ Erro no upload REAL do PDF:', error);
        return null;
    }
};

// 4.2 Processar e salvar PDFs NO SUPABASE
window.savePdfsToSupabase = async function(propertyId) {
    console.log(`💾 SALVANDO PDFs no Supabase para imóvel ${propertyId}...`);
    
    const allPdfUrls = [];
    
    // 1. Manter PDFs existentes que não foram excluídos
    window.existingPdfFiles.forEach(pdf => {
        if (pdf.url && pdf.url.trim() !== '' && pdf.url !== 'EMPTY') {
            // Verificar se é URL válida do Supabase
            if (pdf.url.includes('supabase.co/storage')) {
                allPdfUrls.push(pdf.url);
                console.log(`📎 Mantendo PDF existente: ${pdf.name}`);
            }
        }
    });
    
    // 2. Fazer upload REAL dos NOVOS PDFs
    if (window.selectedPdfFiles.length > 0) {
        console.log(`📤 Enviando ${window.selectedPdfFiles.length} NOVO(s) PDF(s) para Supabase Storage...`);
        
        for (const pdf of window.selectedPdfFiles) {
            if (pdf.file) {
                console.log(`⬆️ Enviando PDF REAL: ${pdf.name}`);
                const uploadedUrl = await window.uploadPdfToSupabaseStorage(pdf.file, propertyId);
                
                if (uploadedUrl) {
                    allPdfUrls.push(uploadedUrl);
                    console.log(`✅ PDF REAL salvo no Supabase: ${uploadedUrl}`);
                } else {
                    console.warn(`⚠️ PDF não enviado: ${pdf.name}`);
                }
            }
        }
    }
    
    // 3. Preparar string final para campo 'pdfs'
    const pdfsString = allPdfUrls.length > 0 ? allPdfUrls.join(',') : '';
    
    console.log('📊 RESUMO FINAL do salvamento:');
    console.log(`- PDFs existentes mantidos: ${window.existingPdfFiles.length}`);
    console.log(`- Novos PDFs enviados: ${window.selectedPdfFiles.length}`);
    console.log(`- Total de URLs: ${allPdfUrls.length}`);
    console.log(`- String para campo 'pdfs': ${pdfsString.substring(0, 80)}...`);
    
    // 4. ATUALIZAR SUPABASE com os novos PDFs
    if (pdfsString && window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            console.log(`🔄 Atualizando campo 'pdfs' no Supabase para imóvel ${propertyId}...`);
            
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    pdfs: pdfsString,
                    updated_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                console.log(`✅ Campo 'pdfs' ATUALIZADO no Supabase!`);
                
                // Atualizar localmente também
                const property = window.properties.find(p => p.id === propertyId);
                if (property) {
                    property.pdfs = pdfsString;
                    window.savePropertiesToStorage();
                }
                
                return pdfsString;
            } else {
                console.error('❌ Erro ao atualizar Supabase:', await response.text());
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar campo pdfs:', error);
        }
    }
    
    return pdfsString;
};

// 4.3 Obter PDFs para salvar (versão simples)
// 4.3 Substituir função antiga por nova
window.getPdfsToSave = async function(propertyId) {
    if (!propertyId) {
        console.error('❌ propertyId não fornecido para salvar PDFs');
        return '';
    }
    
    return await window.savePdfsToSupabase(propertyId);
};

// 4.4 Integração automática com sistema existente
window.setupPdfSupabaseIntegration = function() {
    console.log('🔗 Configurando integração REAL com Supabase...');
    
    // Interceptar função updateProperty do properties.js
    if (typeof window.updateProperty !== 'undefined') {
        const originalUpdateProperty = window.updateProperty;
        
        window.updateProperty = async function(id, propertyData) {
            console.log(`✏️ Atualizando imóvel ${id} com PDFs REAIS...`);
            
            // Se houver PDFs para processar
            if (window.selectedPdfFiles.length > 0 || window.existingPdfFiles.length > 0) {
                try {
                    const pdfsString = await window.savePdfsToSupabase(id);
                    
                    if (pdfsString) {
                        propertyData.pdfs = pdfsString;
                        console.log(`📄 PDFs REAIS incluídos na atualização`);
                    }
                } catch (error) {
                    console.error('❌ Erro ao salvar PDFs REAIS:', error);
                }
            }
            
            // Limpar PDFs após processar
            setTimeout(() => {
                window.selectedPdfFiles = [];
                window.updatePdfPreview();
            }, 100);
            
            // Chamar função original do properties.js
            return originalUpdateProperty.call(this, id, propertyData);
        };
        
        console.log('✅ updateProperty integrado com PDFs REAIS no Supabase');
    }
    
    // Interceptar função addNewProperty
    if (typeof window.addNewProperty !== 'undefined') {
        const originalAddNewProperty = window.addNewProperty;
        
        window.addNewProperty = async function(propertyData) {
            console.log('➕ Adicionando novo imóvel com PDFs REAIS...');
            
            // Primeiro criar o imóvel
            const newProperty = originalAddNewProperty.call(this, propertyData);
            
            // Depois salvar PDFs REAIS
            if (window.selectedPdfFiles.length > 0) {
                try {
                    const pdfsString = await window.savePdfsToSupabase(newProperty.id);
                    
                    if (pdfsString) {
                        // Atualizar localmente
                        newProperty.pdfs = pdfsString;
                        const index = window.properties.findIndex(p => p.id === newProperty.id);
                        if (index !== -1) {
                            window.properties[index].pdfs = pdfsString;
                            window.savePropertiesToStorage();
                        }
                    }
                } catch (error) {
                    console.error('❌ Erro ao salvar PDFs REAIS no novo imóvel:', error);
                }
            }
            
            return newProperty;
        };
        
        console.log('✅ addNewProperty integrado com PDFs REAIS no Supabase');
    }
};

// 4.4 Integrar com sistema existente
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

// ========== 5. INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🚀 Inicializando sistema de PDFs...');
        
        // 1. Sistema de upload
        window.initPdfSystem();
        
        // 2. Integração com properties.js
        window.setupPdfIntegration();
        
        // 3. Eventos do modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closePdfViewer();
        });
        
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('pdfViewerModal');
            if (modal && modal.style.display === 'flex' && e.target === modal) {
                window.closePdfViewer();
            }
        });
        
        console.log('✅ Sistema de PDFs completamente inicializado');
        
    }, 1000);
});

console.log('📄 pdf.js carregado - Sistema completo e corrigido');
