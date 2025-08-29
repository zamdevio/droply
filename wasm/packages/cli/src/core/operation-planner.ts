// core/operation-planner.ts - Operation planning engine
// 🎯 Single responsibility: Plan operations based on ChatGPT rules

import type { CliOptions } from '../types';
import type { SdkDiscoveryService } from '../interfaces/sdk-discovery';

export interface OperationPlan {
  kind: 'manySingle' | 'archived';
  archive: string;
  wrapper: string;
  zipInternal: { enabled: boolean; level: number };
  embedMeta: boolean;
  mode: 'each' | 'bundle' | 'error';
  inputs: { isMulti: boolean; isDirectory: boolean };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  plan?: OperationPlan;
}

export class OperationPlanner {
  constructor(private sdkDiscovery: SdkDiscoveryService) {}

  async planOperation(options: CliOptions, inputs: { isMulti: boolean; isDirectory: boolean }): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get SDK capabilities
      const capabilities = await this.sdkDiscovery.getCapabilities();
      
      // Validate algorithm
      if (options.algo && !(await this.sdkDiscovery.validateAlgorithm(options.algo))) {
        errors.push(`"${options.algo}" is not a supported compression algorithm`);
      }

      // Validate archive
      if (options.archive && !(await this.sdkDiscovery.validateArchive(options.archive))) {
        errors.push(`"${options.archive}" is not a supported archive format`);
      }

      // Check for invalid algo=zip
      if (options.algo === 'zip') {
        errors.push('`--algo zip` is invalid. Zip is an archive format. Use `--archive zip` and optionally `--compress-inside` to enable internal deflate.');
      }

      // Validate compression level
      if (options.level !== undefined && options.algo && options.algo !== 'none') {
        const levels = await this.sdkDiscovery.getCompressionLevels(options.algo);
        if (levels && (options.level < levels.min || options.level > levels.max)) {
          errors.push(`Compression level must be between ${levels.min} and ${levels.max} for ${options.algo}`);
        }
      }

      // If we have validation errors, stop here
      if (errors.length > 0) {
        return { valid: false, errors, warnings };
      }

      // Plan the operation
      const plan = await this.createOperationPlan(options, inputs, capabilities);
      
      // Generate warnings
      if (plan.archive === 'zip' && !plan.zipInternal.enabled && options.level !== undefined) {
        warnings.push('`--level` has no effect unless `--compress-inside` is set for zip. Continuing with STORE.');
      }

      if (options.archive && options.algo === undefined) {
        warnings.push('Archive selected; outer compression default is now "none". Use `--algo gzip|brotli` to wrap the archive.');
      }

      if (plan.archive === 'none' && options.meta) {
        warnings.push('Metadata embedding is only available with archives. Use `--archive tar|zip` or `--meta` to print metadata after completion.');
      }

      return { valid: true, errors, warnings, plan };
    } catch (error) {
      return { 
        valid: false, 
        errors: [`Operation planning failed: ${error instanceof Error ? error.message : String(error)}`], 
        warnings 
      };
    }
  }

  private async createOperationPlan(
    options: CliOptions, 
    inputs: { isMulti: boolean; isDirectory: boolean },
    capabilities: any
  ): Promise<OperationPlan> {
    const multi = inputs.isMulti || inputs.isDirectory;
    const mode = options.mode || (options.archive === 'none' && multi ? 'each' : 'bundle');

    // Defaults based on ChatGPT rules
    let archive = options.archive ?? (multi ? 'zip' : 'none');
    let algo = options.algo ?? (archive === 'none' ? 'gzip' : 'none');

    // Handle multi-file without archive
    if (archive === 'none' && multi) {
      if (mode === 'each') {
        // Compress each file individually
        return {
          kind: 'manySingle',
          archive: 'none',
          wrapper: algo,
          zipInternal: { enabled: false, level: 0 },
          embedMeta: false,
          mode: 'each',
          inputs
        };
      } else if (mode === 'error') {
        throw new Error('Multiple inputs require an archive. Use `--archive zip|tar` or `--mode each`.');
      } else {
        // mode 'bundle' without archive: fix by setting a default archive
        archive = 'zip';
      }
    }

    // Archive chosen → set wrapper default to none if user didn't pass it
    if (options.archive && options.algo === undefined) {
      algo = 'none';
    }

    // Zip internal compression
    const zipInternal = archive === 'zip' && options.compressInside 
      ? { enabled: true, level: options.level ?? 6 }
      : { enabled: false, level: 0 };

    // Meta embedding only if archive
    const embedMeta = !options.noMeta && archive !== 'none';

    return {
      kind: 'archived',
      archive,
      wrapper: algo,
      zipInternal,
      embedMeta,
      mode,
      inputs
    };
  }
}
