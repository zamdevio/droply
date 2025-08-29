// 🔧 Bundler Configuration for @droply/web
// This file shows how to configure different bundlers to handle WASM assets

// 📦 Webpack Configuration
export const webpackConfig = {
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'wasm/[name][ext]'
        }
      }
    ]
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  }
};

// ⚡ Vite Configuration
export const viteConfig = {
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@droply/plugins']
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'wasm/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
};

// 🎯 Rollup Configuration
export const rollupConfig = {
  plugins: [
    // Add your rollup plugins here
  ],
  output: {
    assetFileNames: (assetInfo) => {
      if (assetInfo.name?.endsWith('.wasm')) {
        return 'wasm/[name][extname]';
      }
      return 'assets/[name]-[hash][extname]';
    }
  }
};

// 🚀 Next.js Configuration (next.config.js)
export const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true
    };

    // WASM asset handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name][ext]'
      }
    });

    // Handle Node.js polyfills for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false
      };
    }

    return config;
  },
  
  // Optional: Configure headers for WASM files
  async headers() {
    return [
      {
        source: '/static/wasm/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm'
          }
        ]
      }
    ];
  }
};

// 📱 Parcel Configuration (.parcelrc)
export const parcelConfig = {
  extends: '@parcel/config-default',
  transformers: {
    '*.wasm': ['@parcel/transformer-raw']
  }
};

// 🔍 ESBuild Configuration
export const esbuildConfig = {
  loader: {
    '.wasm': 'file'
  },
  outdir: 'dist',
  assetNames: 'wasm/[name]'
};

// 📋 Usage Examples:

// 1. Webpack (webpack.config.js):
// import { webpackConfig } from '@droply/web/bundler.config.js';
// export default webpackConfig;

// 2. Vite (vite.config.js):
// import { defineConfig } from 'vite';
// import { viteConfig } from '@droply/web/bundler.config.js';
// export default defineConfig(viteConfig);

// 3. Next.js (next.config.js):
// import { nextConfig } from '@droply/web/bundler.config.js';
// module.exports = nextConfig;

// 4. Rollup (rollup.config.js):
// import { rollupConfig } from '@droply/web/bundler.config.js';
// export default rollupConfig;
