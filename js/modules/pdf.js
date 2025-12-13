// js/modules/pdf.js - SISTEMA COMPLETO DE GERENCIAMENTO DE PDF
console.log('📄 pdf.js carregado - Sistema de Documentos PDF');

// ========== CONFIGURAÇÕES ==========
const PDF_CONFIG = {
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    password: "doc123", // Senha para acesso
    storagePrefix: 'weberlessa_pdf_'
};

// ========== VARIÁVEIS ==========
window.selectedPdfFiles = [];
window.pdfPreviewElement = null;

// ========== FUNÇÕES PRINCIPAIS ==========

// 1. Inicializar sistema de PDF
window.initPdfSystem = function() {
    console.log('📄 Inicializando sistema de PDF...');
    
    // Configurar área de upload
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadPreview = document.getElementById('pdfUploadPreview');
    
    if (pdfUploadArea && pdfFileInput) {
        window.pdfPreviewElement = pdfUploadPreview;
        
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
                handlePdfFiles(e.dataTransfer.files);
            }
        });
        
        // Evento: Seleção de arquivos
        pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handlePdfFiles(e.target.files);
            }
        });
        
        console.log('✅ Sistema de PDF inicializado');
    }
};

// 2. Manipular arquivos PDF
window.handlePdfFiles = function(files) {
    console.log(`📄 Processando ${files.length} arquivo(s) PDF...`);
    
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
        
        // Adicionar à lista
        window.selectedPdfFiles.push({
            file: file,
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            date: new Date().toLocaleDateString()
        });
        
        console.log(`✅ PDF adicionado: ${file.name} (${formatFileSize(file.size)})`);
    });
    
    // Atualizar preview
    updatePdfPreview();
    
    // Limpar input
    document.getElementById('pdfFileInput').value = '';
};

// 3. Atualizar preview dos PDFs
window.updatePdfPreview = function() {
    if (!window.pdfPreviewElement) return;
    
    if (window.selectedPdfFiles.length === 0) {
        window.pdfPreviewElement.innerHTML = `
            <div style="text-align: center; color: #95a5a6; padding: 1rem;">
                <i class="fas fa-file-pdf" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p>Nenhum documento PDF selecionado</p>
            </div>
        `;
        return;
    }
    
    let previewHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">';
    
    window.selectedPdfFiles.forEach((pdf, index) => {
        previewHTML += `
            <div class="pdf-preview-item" style="
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                padding: 0.8rem;
                text-align: center;
                position: relative;
            ">
                <i class="fas fa-file-pdf" style="font-size: 2rem; color: #e74c3c; margin-bottom: 0.5rem;"></i>
                <p style="font-size: 0.8rem; margin: 0.3rem 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${pdf.name}
                </p>
                <small style="color: #7f8c8d;">${pdf.size}</small>
                <button onclick="removePdfFile(${index})" style="
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    font-size: 0.7rem;
                ">
                    ×
                </button>
            </div>
        `;
    });
    
    previewHTML += '</div>';
    window.pdfPreviewElement.innerHTML = previewHTML;
};

// 4. Remover PDF da lista
window.removePdfFile = function(index) {
    if (index >= 0 && index < window.selectedPdfFiles.length) {
        const removedFile = window.selectedPdfFiles[index];
        window.selectedPdfFiles.splice(index, 1);
        updatePdfPreview();
        console.log(`🗑️ PDF removido: ${removedFile.name}`);
    }
};

// 5. Limpar todos os PDFs
window.clearAllPdfs = function() {
    window.selectedPdfFiles = [];
    updatePdfPreview();
    console.log('🧹 Todos os PDFs removidos');
};

// 6. Função de formatação de tamanho
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 7. Modal de acesso a PDFs
window.showPdfModal = function(propertyId) {
    console.log(`📄 Abrindo PDFs do imóvel ${propertyId}`);
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('pdfPassword').value = '';
    }
};

window.accessPdfDocuments = function() {
    const password = document.getElementById('pdfPassword')?.value;
    
    if (password === null || password === "") {
        alert('⚠️ Digite a senha para acessar os documentos!');
        return;
    }
    
    if (password === PDF_CONFIG.password) {
        alert('✅ Documentos PDF acessados com sucesso!');
        closePdfModal();
        
        // Aqui você pode implementar o download ou visualização
        // Exemplo: window.downloadPdfDocuments();
        
    } else {
        alert('❌ Senha incorreta para documentos PDF!');
    }
};

window.closePdfModal = function() {
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('pdfPassword').value = '';
    }
};

// 8. Salvar PDFs no formulário de imóvel
window.savePdfsToProperty = function(propertyId) {
    if (window.selectedPdfFiles.length === 0) {
        console.log('📄 Nenhum PDF para salvar');
        return null;
    }
    
    console.log(`💾 Salvando ${window.selectedPdfFiles.length} PDF(s) para imóvel ${propertyId}`);
    
    // Em produção, aqui você faria upload para o servidor
    // Por enquanto, simulamos salvando metadados
    
    const pdfData = window.selectedPdfFiles.map(pdf => ({
        name: pdf.name,
        size: pdf.size,
        date: pdf.date,
        id: pdf.id
    }));
    
    // Limpar após salvar
    window.selectedPdfFiles = [];
    updatePdfPreview();
    
    return pdfData;
};

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.initPdfSystem();
        console.log('✅ Módulo PDF pronto para uso');
    }, 1000);
});
console.log('📄 pdf.js carregado com 8 funções principais');
