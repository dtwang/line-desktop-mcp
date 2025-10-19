#!/usr/bin/env node
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
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
          stdio: ['ignore', 'ignore', 'inherit'],
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


  async run(useSSE = false, port = 3000) {
    if (useSSE) {
      // 使用 Streamable HTTP 模式（符合 MCP 2025-06-18 規範）
      const app = express();
      
      // 添加 CORS 支援
      app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
        next();
      });
      
      app.use(express.json());
      
      // MCP 端點路徑
      const endpoint = '/mcp';
      
      // 添加全局日誌中間件
      app.use((req, res, next) => {
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
        console.error(`Headers:`, JSON.stringify(req.headers));
        next();
      });
      
      // 健康檢查端點
      app.get('/', (req, res) => {
        res.json({
          status: 'running',
          server: 'LINE Desktop MCP Server',
          version: '1.0.0',
          mcp_endpoint: endpoint,
          transport: 'Streamable HTTP (MCP 2025-06-18)'
        });
      });
      
      app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
      });
      
      // Session 管理
      const transports = {};
      
      // 處理 MCP 端點的請求  
      app.all(endpoint, async (req, res) => {
        console.error(`=== MCP ${req.method} Request ===`);
        const sessionId = req.headers['mcp-session-id'];
        console.error(`Session ID: ${sessionId || 'none'}`);
        
        try {
          let transport;
          
          if (sessionId && transports[sessionId]) {
            // 使用現有 session
            transport = transports[sessionId];
            console.error(`Reusing session: ${sessionId}`);
            const body = req.method === 'POST' ? req.body : null;
            await transport.handleRequest(req, res, body);
            
          } else if (req.method === 'POST' && req.body?.method === 'initialize') {
            // 新的初始化請求
            console.error(`Body:`, JSON.stringify(req.body));
            console.error('Creating new StreamableHTTP transport');
            
            transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => {
                const id = Math.random().toString(36).substring(7);
                console.error(`Generated session ID: ${id}`);
                return id;
              },
              onsessioninitialized: (newSessionId) => {
                console.error(`Session initialized: ${newSessionId}`);
                transports[newSessionId] = transport;
              }
            });
            
            transport.onclose = () => {
              const sid = transport.sessionId;
              if (sid) {
                console.error(`Transport closed: ${sid}`);
                delete transports[sid];
              }
            };
            
            transport.onerror = (error) => {
              console.error(`Transport error:`, error);
            };
            
            // 連接 transport 到 server
            await this.server.connect(transport);
            console.error('Server connected to transport');
            
            // 處理請求
            await transport.handleRequest(req, res, req.body);
            
          } else {
            res.status(400).json({
              jsonrpc: '2.0',
              error: { code: -32000, message: 'Invalid request or missing session' },
              id: null
            });
          }
          
        } catch (error) {
          console.error('Error in endpoint handler:', error);
          if (!res.headersSent) {
            res.status(500).json({
              jsonrpc: '2.0',
              error: { code: -32603, message: error.message },
              id: null
            });
          }
        }
      });
      
      
      app.listen(port, '0.0.0.0', () => {
        console.error(`LINE Desktop MCP Server running on Streamable HTTP mode`);
        console.error(`  Local:   http://127.0.0.1:${port}${endpoint}`);
        console.error(`  Network: http://0.0.0.0:${port}${endpoint}`);
        console.error(`  Health:  http://127.0.0.1:${port}/health`);
        console.error(`Ready to accept connections...`);
      });
    } else {
      // 使用 stdio 模式
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('LINE Desktop MCP Server running on stdio');
    }
  }
}

// 解析命令列參數
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    sseMode: false,
    port: 3000
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--http-mode') {
      config.sseMode = true;
    } else if (args[i] === '--port' && i + 1 < args.length) {
      config.port = parseInt(args[i + 1], 10);
      i++; // 跳過下一個參數
    }
  }
  
  return config;
}

// 首次執行時的設定檢查
await firstRunSetup();

// 解析命令列參數並啟動伺服器
const config = parseArgs();
const server = new LineDesktopMCPServer();

if (config.sseMode) {
  console.error(`Starting server in  Streamable HTTP  mode on port ${config.port}`);
  server.run(true, config.port).catch(console.error);
} else {
  console.error('Starting server in stdio mode');
  server.run(false).catch(console.error);
}