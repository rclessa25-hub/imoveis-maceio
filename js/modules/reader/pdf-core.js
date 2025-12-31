// js/modules/reader/pdf-core.js  
console.log('📄 pdf-core.js carregado - VERIFICANDO VARIÁVEIS GLOBAIS');

// GARANTIR compatibilidade com outros módulos
if (typeof window.selectedPdfFiles === 'undefined') window.selectedPdfFiles = [];
if (typeof window.existingPdfFiles === 'undefined') window.existingPdfFiles = [];
if (typeof window.isProcessingPdfs === 'undefined') window.isProcessingPdfs = false;

// ========== 2. SISTEMA DE VISUALIZAÇÃO NOS CARDS ==========

// 2.1 Mostrar PDFs do imóvel (CONTROLADOR)
window.showPropertyPdf = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) {
        alert('Imóvel não encontrado!');
        return;
    }

    // ⚠️ NÃO chamar showPdfModal diretamente (evita loop)
    window.showPdfModalDirect(propertyId);
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
// SUBSTITUA por:
window.viewPdfDocument = function(url, fileName) {
    // Primeiro verifica se o arquivo existe
    fetch(url, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                window.open(url, '_blank');
            } else {
                alert('❌ Documento PDF não encontrado!\n\nO arquivo pode ter sido excluído.');
                console.error('PDF não encontrado:', url);
                
                // Opcional: Remover URL inválida do imóvel
                if (confirm('Deseja remover este link inválido do imóvel?')) {
                    removeInvalidPdfUrl(url);
                }
            }
        })
        .catch(error => {
            alert('❌ Erro ao acessar documento PDF.');
            console.error('Erro ao acessar PDF:', error);
        });
};

// 2.5.1 Função auxiliar para remover URL inválida
function removeInvalidPdfUrl(badUrl) {
    // Encontrar imóvel que contém esta URL
    const propertyIndex = window.properties.findIndex(p => 
        p.pdfs && p.pdfs.includes(badUrl)
    );
    
    if (propertyIndex !== -1) {
        const property = window.properties[propertyIndex];
        const pdfUrls = property.pdfs.split(',')
            .map(url => url.trim())
            .filter(url => url !== badUrl && url !== '');
        
        property.pdfs = pdfUrls.join(',');
        window.savePropertiesToStorage();
        
        // Atualizar no Supabase
        if (window.updateProperty) {
            window.updateProperty(property.id, { pdfs: property.pdfs });
        }
        
        alert('✅ Link PDF inválido removido do imóvel!');
    }
}

// 2.6 Fechar visualizador
window.closePdfViewer = function() {
    const modal = document.getElementById('pdfViewerModal');
    if (modal) modal.style.display = 'none';
};

// ========== 3. FUNÇÕES AUXILIARES ==========

//REMOVIDA

// ========== 4. SISTEMA DE SALVAMENTO NO SUPABASE ==========
// 4.1 Upload REAL para Supabase Storage
window.uploadPdfToSupabaseStorage = async function(file, propertyId) {
    console.group('📤 UPLOAD DE PDF PARA SUPABASE');
    console.log('📄 Arquivo:', file.name, `(${file.size} bytes)`);
    console.log('🏠 ID do imóvel:', propertyId);
    
    try {
        // 1. Validar credenciais
        if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
            console.error('❌ Credenciais do Supabase não configuradas');
            return null;
        }
        
        // 2. Preparar nome do arquivo (SIMPLIFICADO)
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const fileExt = file.name.split('.').pop().toLowerCase();
        const safeName = file.name
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 40);
        
        // Nome FINAL correto para Supabase
        const fileName = `pdf_${propertyId}_${timestamp}_${random}_${safeName}`;
        
        console.log('📝 Nome do arquivo gerado:', fileName);
        
        // 3. URL CORRETA para upload (IMPORTANTE!)
        // Supabase espera: /storage/v1/object/{bucket}/{path}
        const bucket = 'properties'; // Mesmo bucket das imagens
        const uploadUrl = `${window.SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`;
        
        console.log('🔗 URL de upload:', uploadUrl);
        
        // 4. Fazer upload CORRETAMENTE
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY,
                'Content-Type': file.type || 'application/pdf',
                'Cache-Control': 'no-cache'
            },
            body: file
        });
        
        console.log('📊 Status do upload:', response.status, response.statusText);
        
        if (response.ok) {
            // URL pública para acesso (IMPORTANTE: usar 'public' no caminho)
            const publicUrl = `${window.SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
            
            console.log('✅ Upload bem-sucedido!');
            console.log('🔗 URL pública:', publicUrl);
            console.groupEnd();
            
            return publicUrl;
        } else {
            const errorText = await response.text();
            console.error('❌ Erro no upload:', errorText);
            
            // Tentar método alternativo com FormData
            console.log('🔄 Tentando método alternativo com FormData...');
            
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const formResponse = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                        'apikey': window.SUPABASE_KEY
                        // NÃO definir Content-Type - FormData define automaticamente
                    },
                    body: formData
                });
                
                if (formResponse.ok) {
                    const publicUrl = `${window.SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
                    console.log('✅ Upload com FormData bem-sucedido!');
                    console.groupEnd();
                    return publicUrl;
                } else {
                    console.error('❌ FormData também falhou:', await formResponse.text());
                }
            } catch (formError) {
                console.error('❌ Erro no FormData:', formError);
            }
            
            console.groupEnd();
            return null;
        }
        
    } catch (error) {
        console.error('💥 Erro fatal no upload:', error);
        console.groupEnd();
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

// ========== FUNÇÃO DE TESTE DE PDF ==========
window.testPdfUpload = async function() {
    console.group('🧪 TESTE DE UPLOAD DE PDF');
    
    // Verificar credenciais
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        console.error('❌ Credenciais não configuradas');
        alert('Configure SUPABASE_URL e SUPABASE_KEY no utils.js');
        console.groupEnd();
        return false;
    }
    
    console.log('🔑 Credenciais OK');
    console.log('🌐 URL:', window.SUPABASE_URL);
    console.log('🔑 Key:', window.SUPABASE_KEY.substring(0, 20) + '...');
    
    // Testar acesso ao bucket
    try {
        const testUrl = `${window.SUPABASE_URL}/storage/v1/object/list/properties`;
        const response = await fetch(testUrl, {
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                'apikey': window.SUPABASE_KEY
            }
        });
        
        console.log('📦 Status do bucket:', response.status);
        
        if (response.ok) {
            console.log('✅ Bucket "properties" acessível');
            
            // Criar arquivo de teste
            const testContent = 'PDF de teste - Weber Lessa Imóveis';
            const blob = new Blob([testContent], { type: 'application/pdf' });
            const testFile = new File([blob], 'teste_weber_lessa.pdf', {
                type: 'application/pdf',
                lastModified: Date.now()
            });
            
            console.log('📄 Arquivo de teste criado:', testFile.name);
            
            // Testar upload
            if (typeof window.uploadPdfToSupabaseStorage === 'function') {
                console.log('🚀 Iniciando upload de teste...');
                const testId = 'test_' + Date.now();
                const uploadedUrl = await window.uploadPdfToSupabaseStorage(testFile, testId);
                
                if (uploadedUrl) {
                    console.log('🎉 UPLOAD BEM-SUCEDIDO!');
                    console.log('🔗 URL:', uploadedUrl);
                    
                    // Testar acesso ao arquivo
                    const accessResponse = await fetch(uploadedUrl);
                    console.log('🔍 Teste de acesso:', accessResponse.status);
                    
                    if (accessResponse.ok) {
                        alert('✅ SISTEMA DE PDF FUNCIONANDO!\n\nURL: ' + uploadedUrl);
                    } else {
                        alert('⚠️  Upload feito mas acesso falhou. Verifique permissões do bucket.');
                    }
                    
                    console.groupEnd();
                    return true;
                } else {
                    console.error('❌ Upload falhou');
                    alert('❌ Upload falhou. Verifique console para detalhes.');
                }
            } else {
                console.error('❌ Função uploadPdfToSupabaseStorage não encontrada');
            }
        } else {
            console.error('❌ Bucket não acessível');
            alert('Bucket "properties" não acessível. Verifique:\n1. Permissões do bucket\n2. CORS configuration\n3. Row Level Security');
        }
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        alert('Erro: ' + error.message);
    }
    
    console.groupEnd();
    return false;
};

// Adicionar também uma função para verificar PDFs existentes
window.checkExistingPdfs = function() {
    console.group('🔍 VERIFICAÇÃO DE PDFs EXISTENTES');
    
    if (!window.properties || window.properties.length === 0) {
        console.log('ℹ️ Nenhum imóvel carregado');
        console.groupEnd();
        return;
    }
    
    let pdfCount = 0;
    let brokenPdfs = 0;
    
    window.properties.forEach((property, index) => {
        if (property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '') {
            const pdfUrls = property.pdfs.split(',').filter(url => url.trim() !== '');
            
            pdfUrls.forEach((url, pdfIndex) => {
                pdfCount++;
                console.log(`📄 Imóvel ${index}: ${property.title}`);
                console.log(`   PDF ${pdfIndex + 1}: ${url.substring(0, 80)}...`);
                
                // Verificar se URL é válida
                if (!url.includes('supabase.co')) {
                    console.warn(`   ⚠️  URL não é do Supabase`);
                    brokenPdfs++;
                }
            });
        }
    });
    
    console.log(`📊 Total: ${pdfCount} PDF(s) em ${window.properties.length} imóvel(is)`);
    console.log(`⚠️  PDFs com problemas: ${brokenPdfs}`);
    console.groupEnd();
    
    return { total: pdfCount, broken: brokenPdfs };
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
