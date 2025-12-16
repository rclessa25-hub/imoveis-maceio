// js/modules/reader/pdf-ui.js
console.log('🎨 pdf-ui.js carregado - INICIALIZANDO VARIÁVEIS GLOBAIS');

// INICIALIZAÇÃO CRÍTICA - garantir que as variáveis existam
if (typeof window.selectedPdfFiles === 'undefined') window.selectedPdfFiles = [];
if (typeof window.existingPdfFiles === 'undefined') window.existingPdfFiles = [];

// SISTEMA DE PDFs CORRETO E FUNCIONAL - VERSÃO LIMPA

// ========== CONFIGURAÇÕES ==========
const PDF_CONFIG = {
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf'],
    password: "doc123",
    supabaseUrl: 'https://syztbxvpdaplpetmixmt.supabase.co'
};

// ========== VARIÁVEIS GLOBAIS ==========
window.selectedPdfFiles = [];
window.existingPdfFiles = [];
window.isProcessingPdfs = false;

// ========== 1. SISTEMA DE UPLOAD NO ADMIN ==========

// 1.1 Inicializar sistema de PDF no admin
window.initPdfSystem = function() {
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    
    if (pdfUploadArea && pdfFileInput) {
        pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
        
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
        
        pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                window.handleNewPdfFiles(e.target.files);
            }
        });
    }
};

// 1.2 Manipular NOVOS arquivos PDF
window.handleNewPdfFiles = function(files) {
    console.log('🔄 handleNewPdfFiles CHAMADO!');
    console.log('📁 Arquivos recebidos:', files);
    console.log('🔍 Estado atual das variáveis:', {
        selectedPdfFiles: window.selectedPdfFiles,
        selectedLength: window.selectedPdfFiles ? window.selectedPdfFiles.length : 'undefined',
        existingPdfFiles: window.existingPdfFiles,
        existingLength: window.existingPdfFiles ? window.existingPdfFiles.length : 'undefined'
    });
    
    if (files.length > PDF_CONFIG.maxFiles) {
        alert(`Máximo de ${PDF_CONFIG.maxFiles} arquivos permitido!`);
        return;
    }
    
    Array.from(files).forEach(file => {
        if (!PDF_CONFIG.allowedTypes.includes(file.type)) {
            alert(`"${file.name}" não é um PDF válido!`);
            return;
        }
        
        if (file.size > PDF_CONFIG.maxSize) {
            alert(`"${file.name}" excede 10MB!`);
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
    });
    
    window.updatePdfPreview();
    document.getElementById('pdfFileInput').value = '';
};

// 1.3 Atualizar preview dos PDFs
window.updatePdfPreview = function() {
    const pdfPreview = document.getElementById('pdfUploadPreview');
    if (!pdfPreview) return;
    
    pdfPreview.innerHTML = '';
    
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
                <div class="pdf-preview-container">
                    <div class="pdf-item-new" style="background: #e8f4fc; border: 1px solid #3498db; border-radius: 6px; padding: 0.5rem; width: 90px; height: 90px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden;">
                        <i class="fas fa-file-pdf" style="font-size: 1.2rem; color: #3498db; margin-bottom: 0.3rem;"></i>
                        <p style="font-size: 0.7rem; margin: 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${shortName}</p>
                        <small style="color: #7f8c8d; font-size: 0.6rem;">${pdf.size}</small>
                    </div>
                    <button class="delete-pdf-btn" onclick="removeNewPdf(${index})" title="Excluir PDF">×</button>
                </div>
            `;
        });
        
        newSection.innerHTML += '</div>';
        pdfPreview.appendChild(newSection);
    }
    
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
                <div class="pdf-preview-container">
                    <div class="pdf-item-existing" style="background: #e8f8ef; border: 1px solid #27ae60; border-radius: 6px; padding: 0.5rem; width: 90px; height: 90px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden;">
                        <i class="fas fa-file-pdf" style="font-size: 1.2rem; color: #27ae60; margin-bottom: 0.3rem;"></i>
                        <p style="font-size: 0.7rem; margin: 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${shortName}</p>
                        <small style="color: #7f8c8d; font-size: 0.6rem;">PDF</small>
                    </div>
                    <button class="delete-pdf-btn" onclick="removeExistingPdf(${index})" title="Excluir PDF">×</button>
                </div>
            `;
        });
        
        existingSection.innerHTML += '</div>';
        pdfPreview.appendChild(existingSection);
    }
    
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
        
        if (confirm(`Excluir PDF "${removedFile.name}"?\n\nEsta ação removerá permanentemente este documento do imóvel.`)) {
            const newExistingFiles = [...window.existingPdfFiles];
            newExistingFiles.splice(index, 1);
            window.existingPdfFiles = newExistingFiles;
            
            window.updatePdfPreview();
            
            alert(`PDF "${removedFile.name}" será removido ao salvar as alterações.`);
        }
    }
};

// 1.5 Remover NOVO PDF
window.removeNewPdf = function(index) {
    if (index >= 0 && index < window.selectedPdfFiles.length) {
        const removedFile = window.selectedPdfFiles[index];
        window.selectedPdfFiles.splice(index, 1);
        window.updatePdfPreview();
    }
};

// 1.6 Carregar PDFs para edição
window.loadExistingPdfsForEdit = function(property) {
    window.existingPdfFiles = [];
    window.selectedPdfFiles = [];
    
    if (property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '') {
        try {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => {
                    return url !== '' && 
                           url !== 'EMPTY' && 
                           url !== 'undefined' && 
                           url !== 'null' &&
                           (url.startsWith('http') || url.includes('supabase.co'));
                });
            
            pdfUrls.forEach((url, index) => {
                try {
                    let fileName = 'Documento';
                    
                    if (url.includes('/')) {
                        const parts = url.split('/');
                        fileName = parts[parts.length - 1] || `Documento ${index + 1}`;
                        
                        try {
                            fileName = decodeURIComponent(fileName);
                        } catch (e) {}
                        
                        if (fileName.length > 50) {
                            fileName = fileName.substring(0, 47) + '...';
                        }
                    } else {
                        fileName = `Documento ${index + 1}`;
                    }
                    
                    window.existingPdfFiles.push({
                        url: url,
                        id: `existing_${Date.now()}_${index}`,
                        name: fileName,
                        size: 'PDF',
                        date: 'Arquivado',
                        isExisting: true,
                        originalUrl: url
                    });
                    
                } catch (error) {}
            });
          
        } catch (error) {}
    }
    
    window.updatePdfPreview();
};

// 1.7 Limpar todos os PDFs
window.clearAllPdfs = function() {
    window.existingPdfFiles = [];
    window.selectedPdfFiles = [];
    window.updatePdfPreview();
};
