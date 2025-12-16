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
