#!/usr/bin/env node

// 🧪 Fuzz Test File Generator
// Generates various test files to stress-test the WASM compression system

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Ensure fuzz directory exists
const fuzzDir = join(__dirname, 'fuzz');
try {
  mkdirSync(fuzzDir, { recursive: true });
} catch (e) {
  // Directory already exists
}

// Generate different types of test content
function generateFuzzFiles() {
  console.log('🧪 Generating Fuzz Test Files...\n');
  
  // 1. Random binary data (high entropy, hard to compress)
  const randomData = new Uint8Array(1024);
  for (let i = 0; i < randomData.length; i++) {
    randomData[i] = Math.floor(Math.random() * 256);
  }
  writeFileSync(join(fuzzDir, 'random.bin'), randomData);
  console.log('✅ Generated: random.bin (1KB random binary data)');
  
  // 2. Highly compressible text (repeated patterns)
  const repeatedText = 'This is a highly compressible text file. '.repeat(100) + 
                      'It contains many repeated patterns that should compress very well. '.repeat(50) +
                      'The compression ratio should be excellent for this type of content. '.repeat(25);
  writeFileSync(join(fuzzDir, 'compressible.txt'), repeatedText);
  console.log('✅ Generated: compressible.txt (highly compressible text)');
  
  // 3. Mixed content (some compression, some not)
  const mixedContent = 'Mixed content file with various patterns.\n'.repeat(20) +
                      'Some repeated text that compresses well.\n'.repeat(15) +
                      'And some unique content that doesn\'t compress much.\n'.repeat(10) +
                      'Numbers: ' + Array.from({length: 100}, (_, i) => i.toString()).join(', ') + '\n' +
                      'Random chars: ' + Array.from({length: 200}, () => String.fromCharCode(65 + Math.random() * 26)).join('') + '\n';
  writeFileSync(join(fuzzDir, 'mixed.txt'), mixedContent);
  console.log('✅ Generated: mixed.txt (mixed compressible/non-compressible content)');
  
  // 4. JSON data (structured, moderate compression)
  const jsonData = {
    users: Array.from({length: 50}, (_, i) => ({
      id: i + 1,
      name: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
      data: Array.from({length: 10}, () => Math.random().toString(36).substring(7))
    })),
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: ['compression', 'archiving', 'wasm', 'fuzz-testing']
    }
  };
  writeFileSync(join(fuzzDir, 'data.json'), JSON.stringify(jsonData, null, 2));
  console.log('✅ Generated: data.json (structured JSON data)');
  
  // 5. CSV data (tabular, moderate compression)
  const csvData = 'id,name,email,status,created_at\n' +
                  Array.from({length: 100}, (_, i) => 
                    `${i + 1},User${i + 1},user${i + 1}@test.com,${i % 2 === 0 ? 'active' : 'inactive'},2024-01-${String(i % 28 + 1).padStart(2, '0')}\n`
                  ).join('');
  writeFileSync(join(fuzzDir, 'users.csv'), csvData);
  console.log('✅ Generated: users.csv (tabular CSV data)');
  
  // 6. Empty file (edge case)
  writeFileSync(join(fuzzDir, 'empty.txt'), '');
  console.log('✅ Generated: empty.txt (empty file - edge case)');
  
  // 7. Very large repeated pattern (stress test)
  const largePattern = 'A'.repeat(10000) + 'B'.repeat(10000) + 'C'.repeat(10000);
  writeFileSync(join(fuzzDir, 'large-pattern.txt'), largePattern);
  console.log('✅ Generated: large-pattern.txt (30KB repeated patterns)');
  
  // 8. Unicode content (international characters)
  const unicodeContent = 'Unicode test file with international characters:\n' +
                        '🌍 Hello World! 你好世界! Bonjour le monde! Hola mundo!\n'.repeat(50) +
                        'Arabic: مرحبا بالعالم\n'.repeat(20) +
                        'Russian: Привет мир\n'.repeat(20) +
                        'Japanese: こんにちは世界\n'.repeat(20);
  writeFileSync(join(fuzzDir, 'unicode.txt'), unicodeContent);
  console.log('✅ Generated: unicode.txt (international characters)');
  
  console.log('\n🎯 Fuzz test files generated successfully!');
  console.log('📁 Location:', fuzzDir);
  console.log('\n🧪 Now you can test compression with:');
  console.log('   npx tsx bin/droply.ts compress bin/fuzz/*.txt --algo brotli --level 11 --meta');
  console.log('   npx tsx bin/droply.ts compress bin/fuzz/*.txt --algo gzip --level 9 --archive zip --meta');
}

// Run the generator
if (require.main === module) {
  generateFuzzFiles();
}
