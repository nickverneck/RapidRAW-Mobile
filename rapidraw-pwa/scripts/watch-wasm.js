#!/usr/bin/env node

import { watch } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const wasmDir = join(projectRoot, 'wasm');

let isBuilding = false;
let buildTimeout = null;

console.log('👀 Watching WebAssembly modules for changes...');
console.log(`📁 Watching directory: ${wasmDir}`);

function debounceRebuild() {
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }
  
  buildTimeout = setTimeout(() => {
    if (!isBuilding) {
      rebuildWasm();
    }
  }, 1000); // Wait 1 second after last change
}

function rebuildWasm() {
  if (isBuilding) return;
  
  isBuilding = true;
  console.log('\n🔄 Rebuilding WebAssembly modules...');
  
  try {
    execSync('npm run build:wasm', { 
      stdio: 'inherit',
      cwd: projectRoot 
    });
    console.log('✅ WebAssembly modules rebuilt successfully\n');
  } catch (error) {
    console.error('❌ Failed to rebuild WebAssembly modules:', error.message);
  } finally {
    isBuilding = false;
  }
}

// Watch for changes in Rust source files and Cargo.toml files
watch(wasmDir, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Only rebuild for Rust source files and Cargo.toml changes
  if (filename.endsWith('.rs') || filename.endsWith('Cargo.toml')) {
    console.log(`📝 Changed: ${filename}`);
    debounceRebuild();
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping WASM watcher...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Stopping WASM watcher...');
  process.exit(0);
});