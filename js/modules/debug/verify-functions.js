// Verificação de duplicações nas funções relacionadas a mídia
setTimeout(() => {
    const allFunctions = Object.keys(window).sort();
    const mediaFunctions = allFunctions.filter(name => 
        name.toLowerCase().includes('media') || 
        name.toLowerCase().includes('format') ||
        name.toLowerCase().includes('file')
    );

    console.log('📊 FUNÇÕES RELACIONADAS A MÍDIA:');
    mediaFunctions.forEach(name => {
        console.log(`- ${name}: ${typeof window[name]}`);
    });
}, 3000); // Atraso de 3 segundos para garantir que os módulos principais foram carregados
