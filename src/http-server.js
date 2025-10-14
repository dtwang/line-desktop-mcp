#!/usr/bin/env node

import express from 'express';
import { LineAutomation } from './automation/line-automation.js';

const app = express();
const port = 3123;
const lineAutomation = new LineAutomation();

// 中間件，解析 JSON 請求體
app.use(express.json());

// 路由處理 get_chat_history 工具
app.post('/get_chat_history', async (req, res) => {
  try {
    const { chatName } = req.body;
    if (!chatName) {
      return res.status(400).json({ error: 'chatName is required' });
    }

    console.log('Activating get_chat_history...');
    const chatHistory = await lineAutomation.getChatHistory(chatName);

    res.json({ 
      success: true, 
      chatName,
      chatHistory
    });
  } catch (error) {
    console.error('Error in get_chat_history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 路由處理 send_message 工具
app.post('/send_message_manual', async (req, res) => {
  try {
    const { chatName, message } = req.body;
    if (!chatName || !message) {
      return res.status(400).json({ error: 'chatName and message are required' });
    }

    const result = await lineAutomation.sendChatMessage(chatName, message, false);

    res.json({ 
      success: true, 
      chatName,
      message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in send_message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 路由處理 send_message_auto 工具
app.post('/send_message_auto', async (req, res) => {
  try {
    const { chatName, message } = req.body;
    if (!chatName || !message) {
      return res.status(400).json({ error: 'chatName and message are required' });
    }

    const result = await lineAutomation.sendChatMessage(chatName, message, true);

    res.json({ 
      success: true, 
      chatName,
      message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in send_message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`LINE Desktop HTTP Server is running on port ${port}`);
  console.log(`You can now test with Postman:`);
  console.log(`1. Get chat history: POST http://localhost:${port}/get_chat_history`);
  console.log(`   Body: { "chatName": "測試群組" }`);
  console.log(`2. Send message: POST http://localhost:${port}/send_message_manual`);
  console.log(`   Body: { "chatName": "測試群組", "message": "測試訊息" }`);
  console.log(`3. Send message: POST http://localhost:${port}/send_message_auto`);
  console.log(`   Body: { "chatName": "測試群組", "message": "測試訊息" }`);
});
