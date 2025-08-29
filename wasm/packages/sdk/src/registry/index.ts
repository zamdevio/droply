// registry/index.ts - Registry exports
// 🎯 Single responsibility: Export registry functionality

export * from './abi';
export * from './loader';

// Default registry instance
export { DefaultRegistryABI as Registry } from './abi';

// Default module loader factory
export { DefaultModuleLoader as ModuleLoader } from './loader';
