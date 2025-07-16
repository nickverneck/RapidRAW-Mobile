#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const wasmDir = join(projectRoot, 'wasm');
const outputDir = join(projectRoot, 'src', 'lib', 'wasm');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const modules = [
  'image-processing',
  'raw-processing',
  'color-grading'
];

console.log('🦀 Building WebAssembly modules...');

for (const module of modules) {
  const modulePath = join(wasmDir, module);
  const moduleOutputDir = join(outputDir, module);
  
  if (!existsSync(modulePath)) {
    console.log(`⚠️  Module ${module} not found, skipping...`);
    continue;
  }

  console.log(`📦 Building ${module}...`);
  
  try {
    // Build with wasm-pack
    const cmd = `wasm-pack build --target web --out-dir "${moduleOutputDir}" --scope rapidraw "${modulePath}"`;
    execSync(cmd, { 
      stdio: 'inherit',
      cwd: projectRoot 
    });
    
    console.log(`✅ Successfully built ${module}`);
  } catch (error) {
    console.error(`❌ Failed to build ${module}:`, error.message);
    process.exit(1);
  }
}

console.log('🎉 All WebAssembly modules built successfully!');