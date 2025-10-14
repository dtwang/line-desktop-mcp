#!/usr/bin/env node

import { platform } from 'os';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const currentPlatform = platform();

// 顏色輸出（跨平台）
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// 檢查命令是否存在
function commandExists(command) {
  try {
    execSync(currentPlatform === 'win32' ? `where ${command}` : `which ${command}`, {
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

// Windows 安裝
async function setupWindows() {
  log('\n🪟 Windows detected', 'cyan');
  log('═══════════════════════════════════════════════', 'cyan');
  
  // 檢查 AutoHotkey
  log('\n📦 Checking AutoHotkey...', 'yellow');
  
  if (commandExists('autohotkey')) {
    log('✅ AutoHotkey is already installed', 'green');
  } else {
    log('❌ AutoHotkey not found', 'red');
    log('\nPlease install AutoHotkey:', 'yellow');
    log('  Option 1: choco install autohotkey', 'white');
    log('  Option 2: https://www.autohotkey.com/', 'white');
    
    const answer = await askQuestion('\nContinue setup without AutoHotkey? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      log('\n⏭️  Setup cancelled. Please install AutoHotkey first.', 'yellow');
      return;
    }
  }

  // 執行 Claude Desktop 設定
  const answer = await askQuestion('\nConfigure Claude Desktop now? (Y/n): ');
  
  if (answer.toLowerCase() === 'n') {
    log('\n⏭️  Skipped. Run setup later with: npm run setup', 'yellow');
    return;
  }

  log('\n🔧 Configuring Claude Desktop...', 'yellow');
  
  try {
    const batPath = path.join(__dirname, '..', 'setup-claude-extension.bat');
    execSync(`"${batPath}"`, {
      stdio: 'inherit',
      cwd: path.dirname(batPath)
    });
    
    log('\n✅ Setup completed successfully!', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('   1. Restart Claude Desktop', 'white');
    log('   2. LINE Desktop MCP is now available', 'white');
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    log('\nYou can manually run: setup-claude-extension.bat', 'yellow');
  }
}

// macOS 安裝
async function setupMacOS() {
  log('\n🍎 macOS detected', 'cyan');
  log('═══════════════════════════════════════════════', 'cyan');
  
  // 檢查 Homebrew
  log('\n📦 Checking dependencies...', 'yellow');
  
  if (!commandExists('brew')) {
    log('❌ Homebrew not found', 'red');
    log('\nPlease install Homebrew first:', 'yellow');
    log('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', 'white');
    process.exit(1);
  }
  
  log('✅ Homebrew found', 'green');

  // 檢查並安裝 cliclick
  log('\n📦 Checking cliclick...', 'yellow');
  
  if (commandExists('cliclick')) {
    log('✅ cliclick is already installed', 'green');
  } else {
    log('⚠️  cliclick not found', 'yellow');
    
    const answer = await askQuestion('\nInstall cliclick now? (Y/n): ');
    
    if (answer.toLowerCase() !== 'n') {
      try {
        log('\n📥 Installing cliclick via Homebrew...', 'yellow');
        execSync('brew install cliclick', { stdio: 'inherit' });
        log('✅ cliclick installed successfully!', 'green');
      } catch (error) {
        log(`\n❌ Failed to install cliclick: ${error.message}`, 'red');
        log('\nYou can manually install with: brew install cliclick', 'yellow');
        
        const continueAnyway = await askQuestion('\nContinue setup anyway? (y/N): ');
        if (continueAnyway.toLowerCase() !== 'y') {
          process.exit(1);
        }
      }
    } else {
      log('\n⏭️  Skipping cliclick installation', 'yellow');
      log('You can install it later with: brew install cliclick', 'white');
    }
  }

  // 執行 Claude Desktop 設定
  const answer = await askQuestion('\nConfigure Claude Desktop now? (Y/n): ');
  
  if (answer.toLowerCase() === 'n') {
    log('\n⏭️  Skipped. Run setup later with: npm run setup', 'yellow');
    return;
  }

  log('\n🔧 Configuring Claude Desktop...', 'yellow');
  
  try {
    const shPath = path.join(__dirname, '..', 'setup-claude-extension.sh');
    execSync(`chmod +x "${shPath}"`, { stdio: 'ignore' });
    execSync(`"${shPath}"`, {
      stdio: 'inherit',
      cwd: path.dirname(shPath)
    });
    
    log('\n✅ Setup completed successfully!', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('   1. Restart Claude Desktop', 'white');
    log('   2. LINE Desktop MCP is now available', 'white');
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    log('\nYou can manually run: ./setup-claude-extension.sh', 'yellow');
  }
}

// 不支援的平台
function unsupportedPlatform() {
  log('\n❌ Unsupported Platform', 'red');
  log('═══════════════════════════════════════════════', 'red');
  log(`\nCurrent platform: ${currentPlatform}`, 'white');
  log('\nThis package only supports:', 'yellow');
  log('  • Windows (win32)', 'white');
  log('  • macOS (darwin)', 'white');
  log('\nLinux and other platforms are not currently supported.', 'red');
  process.exit(1);
}

// 主流程
async function main() {
  log('\n📦 LINE Desktop MCP - Installation', 'cyan');
  
  // 允許透過環境變數跳過
  if (process.env.SKIP_SETUP === 'true') {
    log('\n⏭️  Setup skipped (SKIP_SETUP=true)', 'yellow');
    return;
  }

  switch (currentPlatform) {
    case 'win32':
      await setupWindows();
      break;
    
    case 'darwin':
      await setupMacOS();
      break;
    
    case 'linux':
    default:
      unsupportedPlatform();
      break;
  }
}

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});