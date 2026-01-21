// ========== 10. SINCRONIZAÇÃO SIMPLIFICADA (MANTIDA) ==========
window.testSupabaseConnectionSimple = async function() {
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
        return { connected: false, error: 'Credenciais não configuradas' };
    }
    
    try {
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?select=id&limit=1`, {
            headers: { 'apikey': window.SUPABASE_KEY, 'Authorization': `Bearer ${window.SUPABASE_KEY}` }
        });
        return { connected: response.ok, status: response.status };
    } catch (error) {
        return { connected: false, error: error.message };
    }
};

window.syncWithSupabase = async function() {
    const test = await this.testSupabaseConnectionSimple();
    if (!test.connected) {
        return { success: false, error: test.error || 'Sem conexão' };
    }
    
    try {
        const result = await window.supabaseLoadProperties?.() || 
                      await window.supabaseFetch?.('/properties?select=*&order=id.desc');
        
        if (result?.data?.length > 0) {
            // Mesclar evitando duplicatas
            const existingIds = new Set(window.properties.map(p => p.id));
            const newProperties = result.data.filter(item => !existingIds.has(item.id));
            
            if (newProperties.length > 0) {
                window.properties = [...newProperties, ...window.properties];
                window.savePropertiesToStorage();
                
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos');
                }
                
                return { success: true, count: newProperties.length };
            }
        }
        return { success: true, count: 0, message: 'Já sincronizado' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ========== 11. ✅ NOVO: SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA ==========
window.SyncManager = {
    queue: [],
    isSyncing: false,
    lastSyncAttempt: null,
    syncInterval: null,
    
    // Adicionar indicador visual de status
    addStatusIndicator() {
        const existingIndicator = document.getElementById('sync-status-indicator');
        if (existingIndicator) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'sync-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        indicator.innerHTML = `
            <i class="fas fa-sync-alt" style="animation: spin 2s linear infinite;"></i>
            <span id="sync-status-text">Sincronizando...</span>
            <span id="sync-queue-count" style="background:#e74c3c;padding:2px 6px;border-radius:10px;font-size:0.7rem;">0</span>
        `;
        
        document.body.appendChild(indicator);
        
        // Adicionar estilo de animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .sync-success { background: #27ae60 !important; }
            .sync-error { background: #e74c3c !important; }
            .sync-offline { background: #f39c12 !important; }
        `;
        document.head.appendChild(style);
    },
    
    // Atualizar indicador
    updateStatus(status, message = '', queueSize = null) {
        const indicator = document.getElementById('sync-status-indicator');
        if (!indicator) return;
        
        const text = document.getElementById('sync-status-text');
        const count = document.getElementById('sync-queue-count');
        
        if (text) text.textContent = message || this.getStatusMessage(status);
        if (count && queueSize !== null) {
            count.textContent = queueSize;
            count.style.display = queueSize > 0 ? 'inline-block' : 'none';
        }
        
        // Atualizar classes
        indicator.className = '';
        indicator.classList.add(`sync-${status}`);
        
        // Mostrar/ocultar
        if (status === 'idle' && queueSize === 0) {
            indicator.style.opacity = '0';
        } else {
            indicator.style.opacity = '1';
        }
    },
    
    getStatusMessage(status) {
        const messages = {
            'syncing': 'Sincronizando...',
            'success': 'Sincronizado',
            'error': 'Erro na sincronização',
            'offline': 'Offline - Salvando localmente',
            'queued': 'Na fila para sincronizar',
            'idle': 'Pronto'
        };
        return messages[status] || 'Sincronizando...';
    },
    
    // Sincronizar uma propriedade específica
    async syncProperty(property) {
        // Se já foi salvo no Supabase, pular
        if (property.savedToSupabase) {
            console.log(`✅ Propriedade já sincronizada: ${property.title}`);
            return true;
        }
        
        // Verificar se já está na fila
        const alreadyInQueue = this.queue.some(p => p.id === property.id);
        if (!alreadyInQueue) {
            this.queue.push(property);
            console.log(`🔄 Adicionado à fila de sincronização: ${property.title}`);
            this.updateStatus('queued', `Na fila: ${property.title}`, this.queue.length);
        }
        
        // Processar fila
        return await this.processQueue();
    },
    
    // Processar fila de sincronização
    async processQueue() {
        if (this.isSyncing || this.queue.length === 0) {
            return false;
        }
        
        this.isSyncing = true;
        this.lastSyncAttempt = new Date();
        console.log(`🔄 Processando fila de sincronização: ${this.queue.length} item(s)`);
        this.updateStatus('syncing', `Sincronizando ${this.queue.length} item(s)...`, this.queue.length);
        
        // Verificar conexão
        const connectionStatus = await window.testSupabaseConnectionSimple?.();
        if (!connectionStatus?.connected) {
            console.warn('⚠️ Supabase offline - mantendo em fila');
            this.updateStatus('offline', 'Offline - Tentando reconectar...', this.queue.length);
            this.isSyncing = false;
            return false;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        // Processar cópias da fila (para evitar problemas de mutação)
        const queueCopy = [...this.queue];
        
        for (const property of queueCopy) {
            try {
                console.log(`📤 Tentando sincronizar: ${property.title}`);
                
                // Preparar dados para Supabase
                const supabaseData = {
                    title: property.title,
                    price: property.price,
                    location: property.location,
                    description: property.description || '',
                    features: typeof property.features === 'string' 
                        ? property.features 
                        : Array.isArray(property.features) 
                            ? property.features.join(', ') 
                            : property.features || '',
                    type: property.type || 'residencial',
                    has_video: property.has_video || false,
                    badge: property.badge || 'Novo',
                    rural: property.rural || false,
                    images: property.images || '',
                    pdfs: property.pdfs || '',
                    created_at: property.created_at || new Date().toISOString()
                };
                
                let result = null;
                
                // Tentar usar função existente primeiro
                if (typeof window.supabaseSaveProperty === 'function') {
                    result = await window.supabaseSaveProperty(supabaseData);
                } else {
                    // Fallback: fazer upload direto
                    result = await this.directSupabaseSave(supabaseData);
                }
                
                if (result?.success || result?.ok) {
                    // Atualizar propriedade local
                    const localIndex = window.properties.findIndex(p => p.id === property.id);
                    if (localIndex !== -1) {
                        const supabaseId = result.id || result.data?.id || property.id;
                        
                        window.properties[localIndex] = {
                            ...window.properties[localIndex],
                            id: supabaseId,
                            savedToSupabase: true,
                            supabaseId: supabaseId,
                            lastSync: new Date().toISOString()
                        };
                        
                        console.log(`✅ Sincronizado com sucesso: ${property.title} (ID: ${supabaseId})`);
                        
                        // Remover da fila
                        this.queue = this.queue.filter(p => p.id !== property.id);
                        successCount++;
                        
                        // Salvar alterações localmente
                        window.savePropertiesToStorage();
                    }
                } else {
                    console.error(`❌ Falha ao sincronizar ${property.title}:`, result?.error);
                    errorCount++;
                }
                
            } catch (error) {
                console.error(`❌ Erro ao sincronizar ${property.title}:`, error);
                errorCount++;
            }
            
            // Pequena pausa entre sincronizações
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Atualizar status final
        if (successCount > 0) {
            console.log(`✅ ${successCount} propriedade(s) sincronizada(s) com sucesso`);
            this.updateStatus('success', `${successCount} item(s) sincronizado(s)`, this.queue.length);
            
            // Atualizar UI se necessário
            if (typeof window.renderProperties === 'function') {
                window.renderProperties('todos');
            }
            
            if (typeof window.loadPropertyList === 'function') {
                setTimeout(() => window.loadPropertyList(), 500);
            }
        }
        
        if (errorCount > 0) {
            console.warn(`⚠️ ${errorCount} propriedade(s) falharam na sincronização`);
            this.updateStatus('error', `${errorCount} erro(s) na sincronização`, this.queue.length);
        }
        
        this.isSyncing = false;
        return successCount > 0;
    },
    
    // Fallback: salvamento direto no Supabase
    async directSupabaseSave(propertyData) {
        try {
            if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
                return { success: false, error: 'Credenciais não configuradas' };
            }
            
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(propertyData)
            });
            
            if (response.ok) {
                const data = await response.json();
                return { 
                    success: true, 
                    data: data,
                    id: data[0]?.id || data.id 
                };
            } else {
                const errorText = await response.text();
                return { success: false, error: errorText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Verificar propriedades não sincronizadas
    checkUnsyncedProperties() {
        const unsynced = window.properties.filter(p => !p.savedToSupabase);
        
        if (unsynced.length > 0) {
            console.warn(`⚠️ ${unsynced.length} propriedade(s) não sincronizada(s) com Supabase`);
            
            // Adicionar à fila
            unsynced.forEach(property => {
                const alreadyInQueue = this.queue.some(p => p.id === property.id);
                if (!alreadyInQueue) {
                    this.queue.push(property);
                }
            });
            
            this.updateStatus('queued', `${unsynced.length} item(s) para sincronizar`, this.queue.length);
            
            // Tentar sincronizar após 5 segundos
            setTimeout(() => this.processQueue(), 5000);
        } else {
            console.log('✅ Todas as propriedades estão sincronizadas');
            this.updateStatus('idle', 'Tudo sincronizado', 0);
        }
    },
    
    // Inicializar sistema de sincronização
    init() {
        console.log('🔄 Inicializando SyncManager...');
        
        // Adicionar indicador visual
        this.addStatusIndicator();
        
        // Verificar propriedades não sincronizadas
        setTimeout(() => this.checkUnsyncedProperties(), 3000);
        
        // Configurar sincronização periódica (a cada 2 minutos)
        this.syncInterval = setInterval(() => {
            if (this.queue.length > 0) {
                console.log('🔄 Verificação periódica de sincronização...');
                this.processQueue();
            }
        }, 120000); // 2 minutos
        
        // Tentar sincronizar quando a conexão voltar
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada - tentando sincronizar...');
            if (this.queue.length > 0) {
                this.processQueue();
            }
        });
        
        console.log('✅ SyncManager inicializado');
    },
    
    // Destruir/limpar
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('🔄 SyncManager destruído');
    }
};

// ========== 12. SISTEMA DE ESTADO SIMPLIFICADO ==========
window.PropertyState = {
    properties: [],
    currentFilter: 'todos',
    editingId: null,

    init(initialData = []) {
        this.properties = initialData;
        return this;
    },

    add(property) {
        this.properties.unshift(property);
        this.save();
        return property;
    },

    update(id, updates) {
        const index = this.properties.findIndex(p => p.id == id);
        if (index === -1) return false;
        
        this.properties[index] = { ...this.properties[index], ...updates };
        this.save();
        return true;
    },

    remove(id) {
        const initialLength = this.properties.length;
        this.properties = this.properties.filter(p => p.id !== id);
        this.save();
        return initialLength !== this.properties.length;
    },

    save() {
        try {
            localStorage.setItem('weberlessa_properties', JSON.stringify(this.properties));
        } catch (e) {
            console.warn('⚠️ Não foi possível salvar no localStorage');
        }
    }
};

// ========== 13. INICIALIZAÇÃO AUTOMÁTICA DO SISTEMA DE SINCRONIZAÇÃO ==========
// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Aguardar propriedades serem carregadas
        setTimeout(() => {
            if (window.SyncManager) {
                window.SyncManager.init();
            }
        }, 5000); // Aguardar 5 segundos para garantir que as propriedades foram carregadas
    });
} else {
    // DOM já carregado
    setTimeout(() => {
        if (window.SyncManager) {
            window.SyncManager.init();
        }
    }, 5000);
}

// ========== 14. RECUPERAÇÃO ESSENCIAL (MANTIDA) ==========
(function essentialPropertiesRecovery() {
    const isDebug = window.location.search.includes('debug=true');
    
    // Monitorar se properties foi carregado
    setTimeout(() => {
        if (!window.properties || window.properties.length === 0) {
            const stored = localStorage.getItem('weberlessa_properties');
            if (stored) {
                try {
                    window.properties = JSON.parse(stored);
                    if (isDebug) console.log(`✅ Recuperado do localStorage: ${window.properties.length} imóveis`);
                } catch (e) {}
            }
            
            // Fallback final
            if (!window.properties || window.properties.length === 0) {
                window.properties = getInitialProperties();
                if (isDebug) console.log(`✅ Usando dados iniciais: ${window.properties.length} imóveis`);
            }
            
            // Renderizar se necessário
            if (typeof window.renderProperties === 'function' && document.readyState === 'complete') {
                setTimeout(() => window.renderProperties('todos'), 300);
            }
        }
    }, 3000);
})();

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js carregado com sistema de sincronização automática');

// Função utilitária para executar tarefas em baixa prioridade
function runLowPriority(task) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(task, { timeout: 1000 });
    } else {
        setTimeout(task, 100);
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - inicializando properties...');

        // Inicializar propriedades em baixa prioridade
        runLowPriority(() => {
            if (typeof window.loadPropertiesData === 'function') {
                window.loadPropertiesData();
                console.log('⚙️ loadPropertiesData executada');
            }

            // Configurar filtros também em baixa prioridade
            runLowPriority(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                    console.log('⚙️ setupFilters executada');
                }
            });
        });
    });
} else {
    console.log('🏠 DOM já carregado - inicializando agora...');

    // Inicializar direto em baixa prioridade
    runLowPriority(() => {
        if (typeof window.loadPropertiesData === 'function') {
            window.loadPropertiesData();
            console.log('⚙️ loadPropertiesData executada');
        }

        runLowPriority(() => {
            if (typeof window.setupFilters === 'function') {
                window.setupFilters();
                console.log('⚙️ setupFilters executada');
            }
        });
    });
}

// Exportar funções necessárias
window.getInitialProperties = getInitialProperties;

// Adicionar função de teste de upload
window.testUploadSystem = function() {
    console.group('🧪 TESTE DO SISTEMA DE UPLOAD');
    
    // Verificar constantes
    console.log('1. Verificando constantes:');
    console.log('- SUPABASE_URL:', window.SUPABASE_URL);
    console.log('- SUPABASE_KEY:', window.SUPABASE_KEY ? '✅ Disponível' : '❌ Indisponível');
    
    // Testar MediaSystem
    console.log('2. Verificando MediaSystem:');
    console.log('- Disponível?', !!window.MediaSystem);
    
    if (window.MediaSystem) {
        console.log('- Files:', MediaSystem.state.files.length);
        console.log('- PDFs:', MediaSystem.state.pdfs.length);
        
        // Testar upload direto
        if (MediaSystem.uploadFiles) {
            console.log('3. Testando upload...');
            
            // Criar arquivo de teste
            const testBlob = new Blob(['test'], { type: 'image/jpeg' });
            const testFile = new File([testBlob], 'test_upload.jpg', { type: 'image/jpeg' });
            
            MediaSystem.uploadFiles([testFile], 'test_' + Date.now(), 'images')
                .then(urls => {
                    console.log('✅ Upload teste concluído:', urls.length > 0 ? 'SUCESSO' : 'FALHA');
                    if (urls.length > 0) {
                        console.log('🔗 URL:', urls[0].substring(0, 100) + '...');
                        alert('✅ Upload funcionou! Verifique console.');
                    } else {
                        alert('❌ Upload falhou. Verifique console.');
                    }
                })
                .catch(err => {
                    console.error('❌ Erro no upload teste:', err);
                    alert('Erro no upload: ' + err.message);
                });
        }
    }
    
    console.groupEnd();
};

// Função para testar o sistema de sincronização
window.testSyncSystem = function() {
    console.group('🧪 TESTE DO SISTEMA DE SINCRONIZAÇÃO');
    
    console.log('1. Verificando SyncManager:');
    console.log('- Disponível?', !!window.SyncManager);
    console.log('- Queue:', window.SyncManager?.queue?.length || 0);
    console.log('- Is Syncing?', window.SyncManager?.isSyncing || false);
    
    // Criar propriedade de teste não sincronizada
    const testProperty = {
        id: 'test_' + Date.now(),
        title: 'Imóvel de Teste - Não Sincronizado',
        price: 'R$ 999.999',
        location: 'Local de Teste',
        description: 'Esta é uma propriedade de teste para verificar a sincronização',
        features: 'Teste, Sincronização',
        type: 'residencial',
        savedToSupabase: false,
        created_at: new Date().toISOString()
    };
    
    console.log('2. Criando propriedade de teste:', testProperty);
    
    // Adicionar à lista local
    window.properties.unshift(testProperty);
    window.savePropertiesToStorage();
    
    console.log('3. Adicionando à fila de sincronização...');
    
    if (window.SyncManager) {
        window.SyncManager.syncProperty(testProperty)
            .then(success => {
                if (success) {
                    console.log('✅ Sincronização do teste bem-sucedida!');
                    alert('✅ Teste de sincronização bem-sucedido!\n\nVerifique o indicador no canto inferior direito.');
                } else {
                    console.log('⚠️ Sincronização falhou ou está em fila');
                    alert('⚠️ Sincronização falhou ou está em fila.\n\nVerifique se o Supabase está online.');
                }
            })
            .catch(err => {
                console.error('❌ Erro no teste de sincronização:', err);
                alert('❌ Erro no teste de sincronização: ' + err.message);
            });
    } else {
        console.error('❌ SyncManager não disponível');
        alert('❌ Sistema de sincronização não disponível');
    }
    
    console.groupEnd();
};

console.log('💡 Execute:');
console.log('- window.testUploadSystem() para testar uploads');
console.log('- window.testSyncSystem() para testar sincronização');
console.log('- window.SyncManager.processQueue() para forçar sincronização');
