// interfaces/sdk-discovery.ts - SDK capability discovery
// 🎯 Single responsibility: Discover what the SDK supports dynamically

export interface SdkCapabilities {
  compression: {
    algorithms: string[];
    levels: Record<string, { min: number; max: number; default: number }>;
  };
  archives: {
    formats: string[];
    features: Record<string, string[]>;
  };
  metadata: {
    supported: boolean;
    formats: string[];
  };
}

export interface SdkDiscoveryService {
  getCapabilities(): Promise<SdkCapabilities>;
  validateAlgorithm(algo: string): Promise<boolean>;
  validateArchive(archive: string): Promise<boolean>;
  getCompressionLevels(algo: string): Promise<{ min: number; max: number; default: number } | null>;
}
