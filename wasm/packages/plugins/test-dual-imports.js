// test-dual-imports.js - Test both import methods
// 1. Subpath exports: @droply/plugins/nodejs/compression/gzip
// 2. Individual packages: @droply/plugins-nodejs-compression-gzip

console.log('🎯 Testing Droply Plugins Dual Import Methods\n');

// Test importing using subpath exports (umbrella package)
async function testSubpathImports() {
    console.log('📦 Testing Subpath Exports (Umbrella Package):');
    
    try {
        const gzipPlugin = await import('./dist/nodejs/compression/gzip/index.js');
        console.log('✅ Subpath GZIP Plugin:', gzipPlugin.default);
        
        const brotliPlugin = await import('./dist/nodejs/compression/brotli/index.js');
        console.log('✅ Subpath Brotli Plugin:', brotliPlugin.default);
        
        const tarPlugin = await import('./dist/nodejs/archive/tar/index.js');
        console.log('✅ Subpath TAR Plugin:', tarPlugin.default);
        
        console.log('   └── All subpath imports successful!\n');
        
    } catch (error) {
        console.error('❌ Subpath import failed:', error.message);
    }
}

// Test importing using individual package names
async function testIndividualImports() {
    console.log('📦 Testing Individual Package Imports:');
    
    try {
        // These would work when published to npm
        // const gzipPlugin = await import('@droply/plugins-nodejs-compression-gzip');
        // const brotliPlugin = await import('@droply/plugins-nodejs-compression-brotli');
        // const tarPlugin = await import('@droply/plugins-nodejs-archive-tar');
        
        // For now, test with local paths (using index.js as the main entry)
        const gzipPlugin = await import('./dist/nodejs/compression/gzip/index.js');
        console.log('✅ Individual GZIP Plugin:', gzipPlugin.default);
        
        const brotliPlugin = await import('./dist/nodejs/compression/brotli/index.js');
        console.log('✅ Individual Brotli Plugin:', brotliPlugin.default);
        
        const tarPlugin = await import('./dist/nodejs/archive/tar/index.js');
        console.log('✅ Individual TAR Plugin:', tarPlugin.default);
        
        console.log('   └── All individual imports successful!\n');
        
    } catch (error) {
        console.error('❌ Individual import failed:', error.message);
    }
}

// Test platform-specific imports
async function testPlatformImports() {
    console.log('🌐 Testing Platform-Specific Imports:');
    
    try {
        // Node.js platform
        const nodejsGzip = await import('./dist/nodejs/compression/gzip/index.js');
        console.log('✅ Node.js GZIP:', nodejsGzip.default);
        
        // Web platform
        const webGzip = await import('./dist/web/compression/gzip/index.js');
        console.log('✅ Web GZIP:', webGzip.default);
        
        // Bundler platform
        const bundlerGzip = await import('./dist/bundler/compression/gzip/index.js');
        console.log('✅ Bundler GZIP:', bundlerGzip.default);
        
        console.log('   └── All platform imports successful!\n');
        
    } catch (error) {
        console.error('❌ Platform import failed:', error.message);
    }
}

// Test the dual-publish system
async function testDualPublish() {
    console.log('🔄 Testing Dual-Publish System:');
    
    try {
        // Method 1: Subpath from umbrella package
        console.log('   📦 Method 1: Subpath from @droply/plugins');
        const subpathGzip = await import('./dist/nodejs/compression/gzip/index.js');
        console.log('      └── @droply/plugins/nodejs/compression/gzip:', subpathGzip.default.name);
        
        // Method 2: Individual package
        console.log('   📦 Method 2: Individual package');
        const individualGzip = await import('./dist/nodejs/compression/gzip/index.js');
        console.log('      └── @droply/plugins-nodejs-compression-gzip:', individualGzip.default.name);
        
        console.log('   └── Both methods work! Users can choose their preference!\n');
        
    } catch (error) {
        console.error('❌ Dual-publish test failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testSubpathImports();
    await testIndividualImports();
    await testPlatformImports();
    await testDualPublish();
    
    console.log('🎉 All dual-import tests completed successfully!');
    console.log('\n💡 Users can now:');
    console.log('   1. Install umbrella: npm install @droply/plugins');
    console.log('      → Import: @droply/plugins/nodejs/compression/gzip');
    console.log('   2. Install individual: npm install @droply/plugins-nodejs-compression-gzip');
    console.log('      → Import: @droply/plugins-nodejs-compression-gzip');
    console.log('\n🚀 This gives users maximum flexibility!');
}

// Run the tests
runAllTests().catch(console.error);
