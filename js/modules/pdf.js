// js/modules/pdf.js - SISTEMA COMPLETO DE GERENCIAMENTO DE PDF
console.log('📄 pdf.js carregado - Sistema de Documentos PDF Completo');

// ========== CONFIGURAÇÕES ==========
const PDF_CONFIG = {
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    password: "doc123",
    storagePrefix: 'weberlessa_pdf_',
    supabaseUrl: 'https://syztbxvpdaplpetmixmt.supabase.co/storage/v1/object/public/pdfs/'
};

// ========== VARIÁVEIS GLOBAIS ==========
window.selectedPdfFiles = []; // PDFs NOVOS selecionados
window.existingPdfFiles = []; // PDFs EXISTENTES do imóvel em edição

// ========== 1. SISTEMA DE UPLOAD NO ADMIN ==========

// 1.1 Inicializar sistema de PDF no admin
window.initPdfSystem = function() {
    console.log('📄 Inicializando sistema de PDF no admin...');
    
    // Configurar área de upload
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    
    if (pdfUploadArea && pdfFileInput) {
        // Evento: Clique na área
        pdfUploadArea.addEventListener('click', () => {
            pdfFileInput.click();
        });
        
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
                handleNewPdfFiles(e.dataTransfer.files);
            }
        });
        
        // Evento: Seleção de arquivos
        pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleNewPdfFiles(e.target.files);
            }
        });
        
        console.log('✅ Sistema de upload de PDF inicializado');
    }
};

// 1.2 Manipular NOVOS arquivos PDF
window.handleNewPdfFiles = function(files) {
    console.log(`📄 Processando ${files.length} NOVO(s) PDF(s)...`);
    
    // Limitar quantidade
    if (files.length > PDF_CONFIG.maxFiles) {
        alert(`❌ Máximo de ${PDF_CONFIG.maxFiles} arquivos permitido!`);
        return;
    }
    
    // Processar cada arquivo
    Array.from(files).forEach(file => {
        // Validar tipo
        if (!PDF_CONFIG.allowedTypes.includes(file.type)) {
            alert(`❌ "${file.name}" não é um PDF válido!`);
            return;
        }
        
        // Validar tamanho
        if (file.size > PDF_CONFIG.maxSize) {
            alert(`❌ "${file.name}" excede 10MB!`);
            return;
        }
        
        // Adicionar à lista de NOVOS PDFs
        window.selectedPdfFiles.push({
            file: file,
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            date: new Date().toLocaleDateString(),
            isNew: true // Marcar como novo
        });
        
        console.log(`✅ NOVO PDF adicionado: ${file.name}`);
    });
    
    // Atualizar preview
    updatePdfPreview();
    
    // Limpar input
    document.getElementById('pdfFileInput').value = '';
};

// 1.3 Atualizar preview dos PDFs (EXISTENTES e NOVOS)
// 1.3 Atualizar preview dos PDFs (compacto e ordenado)
window.updatePdfPreview = function() {
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (!pdfPreview) return;
    
    pdfPreview.innerHTML = '';
    
    // 🔵 SEÇÃO 1: NOVOS PDFs (próximo ao upload)
    if (window.selectedPdfFiles.length > 0) {
        const newSection = document.createElement('div');
        newSection.id = 'newPdfsSection';
        newSection.innerHTML = `
            <p style="color: #3498db; margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.9rem;">
                <i class="fas fa-plus-circle"></i> NOVO PDF
            </p>
            <div style="
                display: flex; 
                flex-wrap: wrap; 
                gap: 0.5rem;
                margin-bottom: 1.5rem;
            ">
        `;
        
        window.selectedPdfFiles.forEach((pdf, index) => {
            // Nome compacto (máximo 15 caracteres)
            const shortName = pdf.name.length > 15 
                ? pdf.name.substring(0, 12) + '...' 
                : pdf.name;
            
            newSection.innerHTML += `
                <div style="
                    background: #e8f4fc;
                    border: 1px solid #3498db;
                    border-radius: 6px;
                    padding: 0.5rem;
                    width: 90px;
                    height: 90px;
                    text-align: center;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                ">
                    <i class="fas fa-file-pdf" style="font-size: 1.2rem; color: #3498db; margin-bottom: 0.3rem;"></i>
                    <p style="
                        font-size: 0.7rem; 
                        margin: 0; 
                        width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        font-weight: 500;
                    ">
                        ${shortName}
                    </p>
                    <small style="color: #7f8c8d; font-size: 0.6rem;">${pdf.size}</small>
                    <button onclick="removeNewPdf(${index})" style="
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        font-size: 0.7rem;
                        font-weight: bold;
                        line-height: 1;
                        padding: 0;
                    ">
                        ×
                    </button>
                </div>
            `;
        });
        
        newSection.innerHTML += '</div>';
        pdfPreview.appendChild(newSection);
    }
    
    // 🔵 SEÇÃO 2: PDFs EXISTENTES (abaixo dos novos)
    if (window.existingPdfFiles.length > 0) {
        const existingSection = document.createElement('div');
        existingSection.id = 'existingPdfsSection';
        existingSection.innerHTML = `
            <p style="color: #27ae60; margin: ${window.selectedPdfFiles.length > 0 ? '0' : '0 0 0.5rem 0'}; font-weight: 600; font-size: 0.9rem;">
                <i class="fas fa-archive"></i> PDF ARQUIVADO
            </p>
            <div style="
                display: flex; 
                flex-wrap: wrap; 
                gap: 0.5rem;
            ">
        `;
        
        window.existingPdfFiles.forEach((pdf, index) => {
            // Nome compacto (máximo 15 caracteres)
            const shortName = pdf.name.length > 15 
                ? pdf.name.substring(0, 12) + '...' 
                : pdf.name;
            
            existingSection.innerHTML += `
                <div style="
                    background: #e8f8ef;
                    border: 1px solid #27ae60;
                    border-radius: 6px;
                    padding: 0.5rem;
                    width: 90px;
                    height: 90px;
                    text-align: center;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                ">
                    <i class="fas fa-file-pdf" style="font-size: 1.2rem; color: #27ae60; margin-bottom: 0.3rem;"></i>
                    <p style="
                        font-size: 0.7rem; 
                        margin: 0; 
                        width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        font-weight: 500;
                    ">
                        ${shortName}
                    </p>
                    <small style="color: #7f8c8d; font-size: 0.6rem;">PDF</small>
                    <button onclick="removeExistingPdf(${index})" style="
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #27ae60;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        font-size: 0.7rem;
                        font-weight: bold;
                        line-height: 1;
                        padding: 0;
                    ">
                        ×
                    </button>
                </div>
            `;
        });
        
        existingSection.innerHTML += '</div>';
        pdfPreview.appendChild(existingSection);
    }
    
    // 🔵 SEÇÃO 3: Mensagem se não houver PDFs
    if (window.existingPdfFiles.length === 0 && window.selectedPdfFiles.length === 0) {
        pdfPreview.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
            </div>
        `;
    }
};

// 1.4 Remover PDF EXISTENTE
window.removeExistingPdf = function(index) {
    if (index >= 0 && index < window.existingPdfFiles.length) {
        const removedFile = window.existingPdfFiles[index];
        window.existingPdfFiles.splice(index, 1);
        updatePdfPreview();
        console.log(`🗑️ PDF existente removido: ${removedFile.name}`);
        
        // Aqui você pode adicionar lógica para deletar do Supabase
        alert(`PDF "${removedFile.name}" será excluído ao salvar as alterações.`);
    }
};

// 1.5 Remover PDF NOVO
window.removeNewPdf = function(index) {
    if (index >= 0 && index < window.selectedPdfFiles.length) {
        const removedFile = window.selectedPdfFiles[index];
        window.selectedPdfFiles.splice(index, 1);
        updatePdfPreview();
        console.log(`🗑️ NOVO PDF removido: ${removedFile.name}`);
    }
};

// 1.6 Carregar PDFs EXISTENTES para edição
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
    
    updatePdfPreview();
};

// 1.7 Limpar todos os PDFs
window.clearAllPdfs = function() {
    window.existingPdfFiles = [];
    window.selectedPdfFiles = [];
    updatePdfPreview();
    console.log('🧹 Todos os PDFs removidos');
};

// ========== 2. SISTEMA DE VISUALIZAÇÃO NOS CARDS ==========

// 2.1 Abrir modal de PDFs do imóvel
window.showPdfModal = function(propertyId) {
    console.log(`📄 Abrindo PDFs do imóvel ${propertyId}`);
    
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    // Criar modal dinâmico se não existir
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
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 10px;
                padding: 2rem;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            ">
                <button onclick="closePdfViewer()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    font-size: 1.2rem;
                ">
                    ×
                </button>
                <h3 id="pdfModalTitle" style="color: var(--primary); margin-bottom: 1.5rem;">
                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                </h3>
                <div id="pdfListContainer" style="margin-bottom: 1.5rem;"></div>
                <div id="pdfAccessSection" style="display: none;">
                    <input type="password" id="pdfPasswordInput" placeholder="Digite a senha para acesso" 
                           style="padding: 0.8rem; border: 1px solid #ddd; border-radius: 5px; width: 100%; margin-bottom: 1rem;">
                    <button onclick="accessPdfDocuments()" style="
                        background: var(--primary);
                        color: white;
                        padding: 0.8rem 1.5rem;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        width: 100%;
                    ">
                        <i class="fas fa-lock-open"></i> Acessar Documentos
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Carregar lista de PDFs
    const pdfListContainer = document.getElementById('pdfListContainer');
    pdfListContainer.innerHTML = '';
    
    if (property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '') {
        const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
        
        pdfUrls.forEach((url, index) => {
            const fileName = url.split('/').pop() || `Documento ${index + 1}`;
            
            const pdfItem = document.createElement('div');
            pdfItem.style.cssText = `
                padding: 1rem;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f9f9f9;
            `;
            
            pdfItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-file-pdf" style="font-size: 1.5rem; color: #e74c3c;"></i>
                    <div>
                        <strong>${fileName}</strong>
                        <br>
                        <small style="color: #666;">Documento ${index + 1} de ${pdfUrls.length}</small>
                    </div>
                </div>
                <button onclick="viewPdfDocument('${url}', '${fileName}')" style="
                    background: var(--success);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 3px;
                    cursor: pointer;
                ">
                    <i class="fas fa-eye"></i> Visualizar
                </button>
            `;
            
            pdfListContainer.appendChild(pdfItem);
        });
        
        // Mostrar seção de senha (se necessário)
        document.getElementById('pdfAccessSection').style.display = 'block';
        
    } else {
        pdfListContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-file-pdf" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhum documento PDF disponível para este imóvel.</p>
            </div>
        `;
        document.getElementById('pdfAccessSection').style.display = 'none';
    }
    
    modal.style.display = 'flex';
};

// 2.2 Visualizar documento PDF
window.viewPdfDocument = function(url, fileName) {
    // Abrir em nova aba
    window.open(url, '_blank');
    console.log(`📄 Abrindo PDF: ${fileName}`);
};

// 2.3 Acessar documentos (com senha)
window.accessPdfDocuments = function() {
    const password = document.getElementById('pdfPasswordInput')?.value;
    
    if (!password) {
        alert('⚠️ Digite a senha para acessar os documentos!');
        return;
    }
    
    if (password === PDF_CONFIG.password) {
        // Mostrar todos os links para download
        const pdfLinks = document.querySelectorAll('#pdfListContainer button');
        pdfLinks.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-eye"></i> Visualizar';
        });
        
        alert('✅ Documentos desbloqueados! Clique em "Visualizar" para abrir.');
    } else {
        alert('❌ Senha incorreta para documentos PDF!');
    }
};

// 2.4 Fechar visualizador
window.closePdfViewer = function() {
    const modal = document.getElementById('pdfViewerModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// ========== 3. FUNÇÕES AUXILIARES ==========

// 3.1 Formatar tamanho de arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 3.2 Obter URLs dos PDFs para salvar
window.getPdfUrlsToSave = function() {
    // URLs dos PDFs existentes que não foram removidos
    const existingUrls = window.existingPdfFiles.map(pdf => pdf.url).filter(url => url);
    
    // URLs dos novos PDFs (em produção, você faria upload aqui)
    const newFileNames = window.selectedPdfFiles.map(pdf => pdf.name);
    
    console.log('📄 URLs de PDFs para salvar:');
    console.log('- Existentes:', existingUrls.length);
    console.log('- Novos:', newFileNames.length);
    
    // Retornar string combinada
    return [...existingUrls, ...newFileNames.map(name => PDF_CONFIG.supabaseUrl + name)].join(',');
};

// ========== 4. INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.initPdfSystem();
        console.log('✅ Módulo PDF completamente inicializado');
    }, 1000);
});

console.log('📄 pdf.js carregado com sistema completo');
