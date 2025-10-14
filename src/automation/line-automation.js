import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { MacOSLineAutomation } from './macos-line-automation.js';
import { WindowsLineAutomation } from './windows-line-automation.js';

export class LineAutomation {
  constructor() {
    this.platform = process.platform;
        
    if (this.platform === 'darwin') {
      this.automation = new MacOSLineAutomation();
    } else if (this.platform === 'win32') {
      this.automation = new WindowsLineAutomation();
    } else {
      throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  async switchToEnglish() {
    return await this.automation.switchToEnglish();
  }

  async selectChat(chatName) {
    return await this.automation.selectChat(chatName);
  }

  async copyAllChatToClipboard() {
    return await this.automation.copyAllChatToClipboard();
  }

  async pageUp(times = 2) {
    return await this.automation.pageUp(times);
  }

  async getChatHistory(chatName, date, messageLimit = 100, pageUpTimes = 10) {

    await this.automation.switchToEnglish();
    await this.automation.activateLine();
    const ok = await this.automation.selectChat(chatName);

    if (!ok) throw new Error(`Chat "${chatName}" not found`);

    await this.automation.pageUp(pageUpTimes);

    const chatHistory = await this.automation.copyAllChatToClipboard();

    if ( process.env.CHAT_LOG_ON==='true' ) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // Remove only filesystem-unsafe characters, preserve CJK characters
        const safeChatName = chatName.replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, '_');
        const fileName = `${safeChatName}_${timestamp}.txt`;
        
        let logDir = '';

        if( process.env.CHAT_LOG_PATH ) {
           logDir = process.env.CHAT_LOG_PATH;
        }
        else
        {
           logDir = path.join(process.cwd(), 'logs');
        }

        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const logFilePath = path.join(logDir, fileName);
        fs.writeFileSync(logFilePath, chatHistory);
        console.error(`Chat history saved to ${logFilePath}`);
      } catch (error) {
        console.error('Failed to write chat history to log file:', error);
      }
    }

    return chatHistory;
  }

  async sendChatMessage(chatName, message, autoSend = false) {

    await this.automation.switchToEnglish();
    await this.automation.activateLine();
    const ok = await this.automation.selectChat(chatName);
    if (!ok) throw new Error(`Chat "${chatName}" not found`);

    return await this.automation.sendMessage(chatName, message, autoSend);
  }

  async getChatList(includeGroups = true, includeIndividual = true) {
    return await this.automation.getChatList(includeGroups, includeIndividual);
  }

  async isLineRunning() {
    return await this.automation.isLineRunning();
  }

  async activateLine() {
    return await this.automation.activateLine();
  }
}
