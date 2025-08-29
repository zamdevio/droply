export interface ConflictResolution {
  action: 'replace' | 'skip' | 'keep-both';
  newPath?: string;
}

export interface FileConflict {
  originalPath: string;
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
  size?: number;
  modified?: Date;
}

export interface ConflictOptions {
  allowReplace?: boolean;
  allowSkip?: boolean;
  allowKeepBoth?: boolean;
  defaultAction?: 'replace' | 'skip' | 'keep-both';
  autoResolve?: boolean;
}

export interface NamingOptions {
  separator?: string;
  startNumber?: number;
  maxAttempts?: number;
}
