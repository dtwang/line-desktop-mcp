#!/usr/bin/env node
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// HTTP 伺服器將使用 Express 實現
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { platform } from 'os';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { LineAutomation } from './automation/line-automation.js';

// 取得當前模組的目錄路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 首次執行時的設定檢查
async function firstRunSetup() {
  const configMarker = path.join(process.env.HOME || process.env.USERPROFILE, '.line-mcp-setup-complete');
  
  // 如果已經設定過，跳過
  if (fs.existsSync(configMarker)) {
    console.error('configMarker file exists=' + configMarker);
    return;
  }

  console.error('First-time setup...');

  let allDependenciesInstalled = true;

  // Windows: 檢查 AutoHotkey
  if (platform() === 'win32') {
    // 建立測試用的 AHK script
    const testScriptPath = path.join(process.env.TEMP || '.', 'test-ahk-installation.ahk');
    const testScriptContent = 'MsgBox "AutoHotkey installation detected successfully"\nExitApp()';
    
    try {
      // 寫入測試 script
      fs.writeFileSync(testScriptPath, testScriptContent);
      
      // 第一次嘗試執行測試 script
      execSync(`autohotkey.exe "${testScriptPath}"`, { stdio: 'ignore', timeout: 5000 });
      console.error('AutoHotkey found');
      
      // 清理測試檔案
      if (fs.existsSync(testScriptPath)) {
        fs.unlinkSync(testScriptPath);
      }
    } catch (firstError) {
      console.error('AutoHotkey not found in PATH, attempting to setup...');
      
      try {
        // 執行 setup-claude-extension.bat 來設定 PATH
        const setupScriptPath = path.join(__dirname, '..', 'scripts', 'setup-claude-extension.bat');
        console.error(`Running setup script: ${setupScriptPath}`);
        execSync(`"${setupScriptPath}"`, { stdio: 'inherit' });
        
        // 再次嘗試執行測試 script
        execSync(`autohotkey.exe "${testScriptPath}"`, { stdio: 'ignore', timeout: 5000 });
        console.error('AutoHotkey found after setup');
        
        // 清理測試檔案
        if (fs.existsSync(testScriptPath)) {
          fs.unlinkSync(testScriptPath);
        }
      } catch (secondError) {
        console.error('ERROR: AutoHotkey installation could not be detected.');
        console.error('Please ensure AutoHotkey is installed and added to your system PATH.');
        console.error('Download from: https://www.autohotkey.com/');
        console.error(`First attempt error: ${firstError.message}`);
        console.error(`Second attempt error: ${secondError.message}`);
        
        // 清理測試檔案
        if (fs.existsSync(testScriptPath)) {
          fs.unlinkSync(testScriptPath);
        }
        
        allDependenciesInstalled = false;
      }
    }
  }
  
  // macOS: 檢查 cliclick
  if (platform() === 'darwin') {
    try {
      execSync('which cliclick', { stdio: 'ignore' });
      console.error('cliclick found');
    } catch (firstError) {
      console.error('cliclick not installed, attempting to install via Homebrew...');
      
      try {
        // 使用 Homebrew 安裝 cliclick (不自動更新 Homebrew)
        console.error('Installing cliclick with: brew install cliclick');
        execSync('brew install cliclick', { 
          stdio: 'inherit',
          env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' }
        });
        
        // 驗證安裝是否成功
        execSync('which cliclick', { stdio: 'ignore' });
        console.error('cliclick installed successfully');
      } catch (secondError) {
        console.error('ERROR: Failed to install cliclick automatically.');
        console.error('Please ensure Homebrew is installed: https://brew.sh/');
        console.error('Then manually install cliclick with: brew install cliclick');
        console.error(`Error: ${secondError.message}`);
        allDependenciesInstalled = false;
      }
    }
  }

  // 標記為已設定
  if (allDependenciesInstalled)
    fs.writeFileSync(configMarker, new Date().toISOString());

  console.error('Setup complete!');
}

class LineDesktopMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'line-desktop-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.lineAutomation = new LineAutomation();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    /* 圖片功能，先實作在 LineDesktopMCP_DQ 的 PC 版中
              outputSchema: {
                type: 'object',
                properties: {
                  content: {
                    type: 'array',
                    items: {
                      oneOf: [
                        // TextContent 格式
                        { type: 'text', text: 'string' , description: 'JSON string containing chat metadata and text history'},
                        // ImageContent 格式  
                        { type: 'image', data: 'string', mimeType: 'string' , description: 'last image data which Base64 encoded PNG or JPEG format in chat history'}
                      ]
                    }
                  }
                }
              }
    */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_line_chatroom_history_default',
            description: 'Extract conversation history from a specific LINE group chat or individual chat, when the amount of data to be read is uncertain, always use this function.',
            inputSchema: {
              type: 'object',
              properties: {
                chatName: {
                  type: 'string',
                  description: 'Name of the chat/group to extract history from',
                },
                date: {
                  type: 'string',
                  description: 'Date to extract history for (YYYY-MM-DD format, defaults to today)',
                },
                messageLimit: {
                  type: 'number',
                  description: 'Maximum number of messages to extract (default: 100)',
                  default: 100,
                },
              },
              required: ['chatName'],
            },
          },
          {
            name: 'get_line_chatroom_history_long',
            description: 'Extract conversation history from a specific LINE group chat or individual chat, when a more complete set of content is needed, such as for summarizing or analyzing data over a period of time.',
            inputSchema: {
              type: 'object',
              properties: {
                chatName: {
                  type: 'string',
                  description: 'Name of the chat/group to extract history from',
                },
                date: {
                  type: 'string',
                  description: 'Date to extract history for (YYYY-MM-DD format, defaults to today)',
                },
                messageLimit: {
                  type: 'number',
                  description: 'Maximum number of messages to extract (default: 100)',
                  default: 100,
                },
              },
              required: ['chatName'],
            },
          },
          {
            name: 'get_line_chatroom_history_short',
            description: 'Extract conversation history from a specific LINE group chat or individual chat, when a quick response is needed, only retrieve the most recent few messages.',
            inputSchema: {
              type: 'object',
              properties: {
                chatName: {
                  type: 'string',
                  description: 'Name of the chat/group to extract history from',
                },
                date: {
                  type: 'string',
                  description: 'Date to extract history for (YYYY-MM-DD format, defaults to today)',
                },
                messageLimit: {
                  type: 'number',
                  description: 'Maximum number of messages to extract (default: 100)',
                  default: 100,
                },
              },
              required: ['chatName'],
            },
          },
          {
            name: 'send_message_manual',
            description: 'Send a message to a specific LINE chat or group, with pre-send review in LINE. If the user’s intent to auto-send is unclear, use this function by default',
            inputSchema: {
              type: 'object',
              properties: {
                chatName: {
                  type: 'string',
                  description: 'Name of the chat/group to send message to',
                },
                message: {
                  type: 'string',
                  description: 'Message content to send',
                },
              },
              required: ['chatName', 'message'],
            },
          },
          {
            name: 'send_message_auto',
            description: 'Send a message to a specific LINE chat or group. Sends immediately with no pre-send review in LINE. Use this only if the user explicitly requests immediate sending; otherwise, do not call this function',
            inputSchema: {
              type: 'object',
              properties: {
                chatName: {
                  type: 'string',
                  description: 'Name of the chat/group to send message to',
                },
                message: {
                  type: 'string',
                  description: 'Message content to send',
                },
              },
              required: ['chatName', 'message'],
            },
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_line_chatroom_history_default':
            return await this.handleGetLineChatroomHistoryDefault(args);

          case 'get_line_chatroom_history_long':
            return await this.handleGetLineChatroomHistoryLong(args);

          case 'get_line_chatroom_history_short':
            return await this.handleGetLineChatroomHistoryShort(args);

          case 'send_message_manual':
            return await this.handleSendMessage(args);

          case 'send_message_auto':
            return await this.handleSendMessageAuto(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error.message}`
        );
      }
    });
  }

  async handleGetLineChatroomHistoryDefault(args) {
    const { chatName, date, messageLimit = 100 } = args;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const history = await this.lineAutomation.getChatHistory(chatName, targetDate, messageLimit, 10);
    
   // Ensure history is a string and handle null/undefined cases
   // 限制回應內容長度，避免傳輸問題
   const historyText = (history || '').slice(-50000); // 限制 50KB, 由後往前截取
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            chatName: chatName,
            date: targetDate,
            messageLimit: messageLimit,
            history: historyText,
            chatRoomUpdatedAt: new Date().toLocaleString()
          }, null, 2),
        }
      ],
    };
  }

  async handleGetLineChatroomHistoryLong(args) {
    const { chatName, date, messageLimit = 100 } = args;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const history = await this.lineAutomation.getChatHistory(chatName, targetDate, messageLimit, 50);
    
   // Ensure history is a string and handle null/undefined cases
   // 限制回應內容長度，避免傳輸問題
   const historyText = (history || '').slice(-50000); // 限制 50KB, 由後往前截取
    
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            chatName: chatName,
            date: targetDate,
            messageLimit: messageLimit,
            history: historyText,
            chatRoomUpdatedAt: new Date().toLocaleString(),
          }, null, 2),
        },
      ],
    };
  }

  async handleGetLineChatroomHistoryShort(args) {
    const { chatName, date, messageLimit = 100 } = args;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const history = await this.lineAutomation.getChatHistory(chatName, targetDate, messageLimit, 5);
    
   // Ensure history is a string and handle null/undefined cases
   // 限制回應內容長度，避免傳輸問題
   const historyText = (history || '').slice(-50000); // 限制 50KB, 由後往前截取
    
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            chatName: chatName,
            date: targetDate,
            messageLimit: messageLimit,
            history: historyText,
            chatRoomUpdatedAt: new Date().toLocaleString(),
          }, null, 2),
        },
      ],
    };
  }

  async handleSendMessage(args) {
    const { chatName, message } = args;
    
    const result = await this.lineAutomation.sendChatMessage(chatName, message, false);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            chatName,
            message,
            timestamp: new Date().toISOString(),
            error: result.error || null,
          }, null, 2),
        },
      ],
    };
  }

  async handleSendMessageAuto(args) {
    const { chatName, message } = args;
    
    const result = await this.lineAutomation.sendChatMessage(chatName, message,  true);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            chatName,
            message,
            timestamp: new Date().toISOString(),
            error: result.error || null,
          }, null, 2),
        },
      ],
    };
  }


  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LINE Desktop MCP Server running on stdio');
  }
}

// 首次執行時的設定檢查
await firstRunSetup();

// Start the server
const server = new LineDesktopMCPServer();
server.run().catch(console.error);