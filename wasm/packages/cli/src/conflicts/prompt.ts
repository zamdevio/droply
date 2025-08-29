import { createInterface } from 'readline';
import { basename } from 'path';

export interface PromptOptions {
  timeout?: number;
  defaultChoice?: string;
  allowEmpty?: boolean;
}

/**
 * Create an interactive prompt for user input with modern CLI features
 */
export function createInteractivePrompt(): {
  ask: (question: string, options?: PromptOptions) => Promise<string>;
  close: () => void;
} {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Handle process termination to prevent hanging
  const cleanup = () => {
    rl.close();
    process.stdin.pause();
  };

  // Clean up on process exit
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const ask = (question: string, options: PromptOptions = {}): Promise<string> => {
    const { timeout, defaultChoice, allowEmpty = false } = options;
    
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      if (timeout) {
        timeoutId = setTimeout(() => {
          rl.close();
          resolve(defaultChoice || '');
        }, timeout);
      }

      const fullQuestion = defaultChoice 
        ? `${question} [${defaultChoice}]: `
        : `${question}: `;

      rl.question(fullQuestion, (answer) => {
        if (timeoutId) clearTimeout(timeoutId);
        
        const trimmedAnswer = answer.trim();
        if (trimmedAnswer === '' && defaultChoice) {
          resolve(defaultChoice);
        } else if (trimmedAnswer === '' && !allowEmpty) {
          // Ask again if empty answer not allowed
          resolve(ask(question, options));
        } else {
          resolve(trimmedAnswer);
        }
      });
    });
  };

  const close = () => {
    rl.close();
    process.stdin.pause();
    // Remove event listeners to prevent memory leaks
    process.removeListener('exit', cleanup);
    process.removeListener('SIGINT', cleanup);
    process.removeListener('SIGTERM', cleanup);
  };

  return { ask, close };
}

/**
 * Display conflict resolution options and get user choice with modern CLI UX
 */
export async function promptConflictResolution(
  conflictPath: string,
  conflictType: 'file' | 'directory',
  numberedPath: string,
  options: PromptOptions = {}
): Promise<'replace' | 'skip' | 'keep-both'> {
  const prompt = createInteractivePrompt();
  
  const conflictName = basename(conflictPath);
  const numberedName = basename(numberedPath);
  
  // Modern CLI-style conflict resolution display
  console.log(`\n⚠️  ${conflictType} already exists: ${conflictName}`);
  console.log('💡 Choose an option:');
  console.log('  (r) Replace existing');
  console.log('  (s) Skip (keep existing)');
  console.log(`  (k) Keep both (create: ${numberedName})`);
  
  try {
    while (true) {
      const choice = await prompt.ask('Your choice', { 
        defaultChoice: 'k',
        ...options 
      });
      
      const normalizedChoice = choice.toLowerCase().trim();
      
      // Auto-complete and auto-accept logic
      if (normalizedChoice === 'r' || normalizedChoice === 'replace') {
        console.log('✅ Replace existing');
        return 'replace';
      } else if (normalizedChoice === 's' || normalizedChoice === 'skip') {
        console.log('✅ Skip (keep existing)');
        return 'skip';
      } else if (normalizedChoice === 'k' || normalizedChoice === 'keep-both' || normalizedChoice === '') {
        console.log(`✅ Keep both (create: ${numberedName})`);
        return 'keep-both';
      } else {
        // Enhanced error handling with suggestions
        console.log(`❌ Invalid choice: "${choice}"`);
        console.log('💡 Valid options: (r)eplace, (s)kip, (k)eep both');
        console.log('💡 You can also type the full word: replace, skip, keep-both');
      }
    }
  } finally {
    prompt.close();
  }
}
