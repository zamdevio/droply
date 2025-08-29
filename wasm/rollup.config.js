import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

const config = [
  // Main bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        clean: true,
        useTsconfigDeclarationDir: true
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          toplevel: true
        }
      })
    ],
    external: [],
    treeshake: {
      moduleSideEffects: false
    }
  },

  // CLI bundle
  {
    input: 'bin/droply.ts',
    output: {
      file: 'dist/cli.js',
      format: 'cjs',
      sourcemap: true,
      banner: '#!/usr/bin/env node'
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        clean: true
      }),
      terser({
        compress: {
          drop_console: false, // Keep console for CLI
          drop_debugger: true
        }
      })
    ],
    external: ['fs', 'path', 'process'],
    treeshake: {
      moduleSideEffects: false
    }
  },

  // Web bundle (browser-optimized)
  {
    input: 'src/web.ts',
    output: {
      file: 'dist/web.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        clean: true
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ],
    external: [],
    treeshake: {
      moduleSideEffects: false
    }
  },

  // Node bundle (Node.js optimized)
  {
    input: 'src/node.ts',
    output: {
      file: 'dist/node.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        clean: true
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ],
    external: ['fs', 'path', 'crypto'],
    treeshake: {
      moduleSideEffects: false
    }
  },

  // Type definitions
  {
    input: 'dist/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [dts()],
    external: []
  }
];

export default config;
