#!/usr/bin/env node

import { createWriteStream, readFileSync, statSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';

const projectRoot = join(process.cwd());
const outputFile = join(projectRoot, 'line-desktop-mcp.mcpb');

// 讀取需要打包的檔案列表
const filesToInclude = [
  'src/**/*',
  'scripts/**/*',
  'manifest.json',
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE.md'
];

// 需要排除的檔案/目錄
const excludePatterns = [
  'node_modules',
  '.git',
  '.DS_Store',
  '*.mcpb',
  'test',
  '.env'
];

async function shouldInclude(filePath) {
  const relativePath = relative(projectRoot, filePath);
  
  // 檢查是否符合排除規則
  for (const pattern of excludePatterns) {
    if (relativePath.includes(pattern)) {
      return false;
    }
  }
  
  return true;
}

async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);
    
    if (!(await shouldInclude(filePath))) {
      continue;
    }
    
    if (fileStat.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function buildMCPB() {
  console.log('🔨 Building .mcpb bundle...');
  
  // 建立輸出檔案 - .mcpb 必須是 ZIP 格式
  const output = createWriteStream(outputFile);
  const archive = archiver('zip', {
    zlib: { level: 9 } // 最高壓縮等級
  });
  
  // 監聽錯誤
  archive.on('error', (err) => {
    throw err;
  });
  
  // 監聽進度
  archive.on('progress', (progress) => {
    console.log(`📦 Processed: ${progress.entries.processed}/${progress.entries.total} files`);
  });
  
  // 連接輸出流
  archive.pipe(output);
  
  // 加入必要檔案
  const essentialFiles = ['manifest.json', 'package.json', 'README.md', 'LICENSE.md'];
  for (const file of essentialFiles) {
    const filePath = join(projectRoot, file);
    try {
      archive.file(filePath, { name: file });
      console.log(`✅ Added: ${file}`);
    } catch (err) {
      console.warn(`⚠️  Skipped: ${file} (not found)`);
    }
  }
  
  // 加入 src 目錄
  archive.directory(join(projectRoot, 'src'), 'src');
  console.log('✅ Added: src/');
  
  // 加入 scripts 目錄
  archive.directory(join(projectRoot, 'scripts'), 'scripts');
  console.log('✅ Added: scripts/');
  
  // 完成打包
  await archive.finalize();
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`\n✨ Bundle created successfully!`);
      console.log(`📁 Output: ${outputFile}`);
      console.log(`📊 Size: ${size} MB`);
      console.log(`📦 Total bytes: ${archive.pointer()}`);
      resolve();
    });
    
    output.on('error', reject);
  });
}

// 執行打包
buildMCPB().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
