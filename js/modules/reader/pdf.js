// js/modules/reader/pdf.js
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

// ========== 2. SISTEMA DE VISUALIZAÇÃO NOS CARDS ==========

// 2.1 Mostrar PDFs do imóvel
window.showPropertyPdf = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) {
        alert('Imóvel não encontrado!');
        return;
    }
    
    window.showPdfModal(propertyId);
};

// 2.2 Modal de PDFs (COM SENHA)
window.showPdfModal = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
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
        alert('Digite a senha para acessar os documentos!');
        return;
    }
    
    if (password === PDF_CONFIG.password) {
        document.getElementById('pdfAccessSection').style.display = 'none';
        document.getElementById('pdfListContainer').style.display = 'block';
        loadPdfList(property);
    } else {
        alert('Senha incorreta para documentos PDF!');
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

// ========== 4. SISTEMA DE SALVAMENTO NO SUPABASE ==========

// 4.1 Upload REAL para Supabase Storage
window.uploadPdfToSupabaseStorage = async function(file, propertyId) {
    try {
        const safePropertyId = propertyId && propertyId !== 'undefined' && propertyId !== 'null' 
            ? propertyId 
            : `temp_${Date.now()}`;
        
        const safeName = file.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .toLowerCase();
        
        const fileName = `pdf_${safePropertyId}_${Date.now()}_${safeName}`;
        const uploadUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/public/properties/${fileName}`;
        const storageUploadUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/properties/${fileName}`;
        
        const response = await fetch(storageUploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY,
                'x-upsert': 'true'
            },
            body: file
        });
        
        if (response.ok) {
            return uploadUrl;
        } else {
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
                    return altUrl;
                }
            } catch (altError) {
                return null;
            }
            
            return null;
        }
    } catch (error) {
        return null;
    }
};

// 4.2 Excluir PDF do Supabase Storage
window.deletePdfFromSupabaseStorage = async function(pdfUrl) {
    try {
        const fileName = pdfUrl.split('/').pop();
        
        if (!fileName) {
            return false;
        }
        
        let bucket = 'properties';
        if (pdfUrl.includes('/pdfs/')) {
            bucket = 'pdfs';
        }
        
        const deleteUrl = `${PDF_CONFIG.supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
        
        if (!window.SUPABASE_KEY) {
            return false;
        }
        
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY
            }
        });
        
        if (response.ok) {
            return true;
        } else {
            return false;
        }
        
    } catch (error) {
        return false;
    }
};

// 4.3 Processar e salvar TODOS os PDFs
window.processAndSavePdfs = async function(propertyId, propertyTitle) {
    if (window.isProcessingPdfs) {
        return '';
    }
    
    window.isProcessingPdfs = true;
    
    try {
        const pdfsToKeep = new Set();
        const keptPdfUrls = [];
        
        window.existingPdfFiles.forEach(pdf => {
            if (pdf.url && pdf.url.trim() !== '' && pdf.url !== 'EMPTY' && !pdfsToKeep.has(pdf.url)) {
                pdfsToKeep.add(pdf.url);
                keptPdfUrls.push(pdf.url);
            }
        });
        
        const property = window.properties.find(p => p.id == propertyId);
        const originalPdfs = property && property.pdfs ? 
            property.pdfs.split(',').filter(url => url.trim() !== '') : 
            [];
        
        const pdfsToDelete = originalPdfs.filter(url => !pdfsToKeep.has(url));
        
        if (pdfsToDelete.length > 0) {
            for (const pdfUrl of pdfsToDelete) {
                try {
                    await window.deletePdfFromSupabaseStorage(pdfUrl);
                } catch (error) {}
            }
        }
        
        if (window.selectedPdfFiles.length > 0) {
            for (const pdf of window.selectedPdfFiles) {
                if (pdf.processed) {
                    continue;
                }
                
                if (pdf.file) {
                    const uploadedUrl = await window.uploadPdfToSupabaseStorage(pdf.file, propertyId);
                    
                    if (uploadedUrl) {
                        pdf.processed = true;
                        pdf.url = uploadedUrl;
                        keptPdfUrls.push(uploadedUrl);
                    }
                }
            }
        }
        
        const pdfsString = keptPdfUrls.length > 0 ? keptPdfUrls.join(',') : '';
        
        return pdfsString;
        
    } finally {
        window.isProcessingPdfs = false;
    }
};

// 4.4 Salvar PDFs para Supabase
window.savePdfsToSupabase = async function(propertyId) {
    if (!propertyId || propertyId === 'undefined') {
        propertyId = `temp_${Date.now()}`;
    }
    
    return await window.processAndSavePdfs(propertyId, 'Novo Imóvel');
};

// 4.5 Obter PDFs para salvar
window.getPdfsToSave = async function(propertyId) {
    if (!propertyId) {
        return '';
    }
    
    return await window.savePdfsToSupabase(propertyId);
};

// 4.6 Integração automática
window.setupPdfSupabaseIntegration = function() {
    window.initPdfSystem();
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closePdfViewer();
    });
    
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('pdfViewerModal');
        if (modal && modal.style.display === 'flex' && e.target === modal) {
            window.closePdfViewer();
        }
    });
    
    window.savePdfsForProperty = async function(propertyId, propertyTitle) {
        if (!propertyId) {
            return '';
        }
        
        if (typeof window.processAndSavePdfs === 'function') {
            return await window.processAndSavePdfs(propertyId, propertyTitle);
        }
        
        return '';
    };
    
    window.addPdfHookToNewProperty = async function(propertyId, propertyData) {
        if (window.selectedPdfFiles && window.selectedPdfFiles.length > 0) {
            try {
                const pdfsString = await window.savePdfsForProperty(propertyId, propertyData.title);
                
                if (pdfsString) {
                    const index = window.properties.findIndex(p => p.id === propertyId);
                    if (index !== -1) {
                        window.properties[index].pdfs = pdfsString;
                        window.savePropertiesToStorage();
                    }
                    
                    if (typeof window.updateProperty === 'function') {
                        setTimeout(async () => {
                            try {
                                await window.updateProperty(propertyId, { pdfs: pdfsString });
                            } catch (error) {}
                        }, 1000);
                    }
                }
            } catch (error) {}
        }
    };
    
    window.addPdfHookToUpdateProperty = async function(propertyId, propertyData) {
        if ((window.selectedPdfFiles && window.selectedPdfFiles.length > 0) || 
            (window.existingPdfFiles && window.existingPdfFiles.length > 0)) {
            
            try {
                const pdfsString = await window.savePdfsForProperty(propertyId, propertyData.title || 'Imóvel');
                
                if (pdfsString) {
                    return pdfsString;
                }
            } catch (error) {}
        }
        
        return null;
    };
    
    const form = document.getElementById('propertyForm');
    if (form) {
        const originalSubmit = form.onsubmit;
        
        form.addEventListener('submit', async function(e) {
            if (typeof originalSubmit === 'function') {
                originalSubmit.call(this, e);
            }
        });
    }
};

// 4.7 Vincular PDFs pendentes
window.linkPendingPdfsToProperty = function(tempId, realId) {
    try {
        const pendingPdfs = JSON.parse(localStorage.getItem('pending_pdfs') || '[]');
        const propertyPdfs = pendingPdfs.filter(item => item.propertyId === tempId);
        
        if (propertyPdfs.length > 0) {
            propertyPdfs.forEach(pending => {
                const updatedUrls = pending.pdfUrls.map(url => {
                    return url.replace(`_${tempId}_`, `_${realId}_`);
                });
                
                const index = pendingPdfs.findIndex(item => item.propertyId === tempId);
                if (index !== -1) {
                    pendingPdfs[index].propertyId = realId;
                    pendingPdfs[index].pdfUrls = updatedUrls;
                    localStorage.setItem('pending_pdfs', JSON.stringify(pendingPdfs));
                }
            });
            
            const filtered = pendingPdfs.filter(item => item.propertyId !== tempId);
            localStorage.setItem('pending_pdfs', JSON.stringify(filtered));
        }
    } catch (error) {}
};

// ========== 5. INICIALIZAÇÃO COMPLETA ==========
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof window.setupPdfSupabaseIntegration === 'function') {
            window.setupPdfSupabaseIntegration();
        } else {
            if (typeof window.initPdfSystem === 'function') {
                window.initPdfSystem();
            }
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') window.closePdfViewer();
            });
        }
        
    }, 1500);
});
