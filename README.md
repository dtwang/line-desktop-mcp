# LINE Desktop MCP

[English](#english) | [繁體中文](#繁體中文)

---

## 繁體中文

透過 MCP（Model Context Protocol），使 AI 工具能夠與 LINE Desktop 整合，並執行訊息的讀取與發送操作。

![LINE Desktop MCP Demo with Claude Desktop](doc_media/line-desktop-demo-4x.gif)

![LINE Desktop MCP Demo with n8n](doc_media/line-desktop-mcp-demo-n8n-2x.gif)

### ⚠️ 重要說明

**這個專案不是 LINE 官方的 line-bot-mcp-server**

如果你要找的是官方版本，請前往：https://github.com/line/line-bot-mcp-server

### 與官方版本的差異

- **官方 line-bot-mcp-server**：透過 LINE Messaging API 操作 LINE Bot
- **本專案 line-desktop-mcp**：透過 MCP 在 Windows 或 Mac 上直接操作 LINE Desktop 應用程式

### 重要聲明

1. **本專案與 LINE 官方無任何關聯**  
   This project is NOT officially affiliated with LINE.

2. **無需申請 LINE Developers 或使用 Channel Access Token**  
   本專案透過已經完成登入的 LINE Desktop 應用程式進行操作，不需要申請開發者帳號或 API Token。

### 關於專案

LINE Desktop MCP 是一個基於 Model Context Protocol 的整合工具，讓 AI 工具（如 Claude Desktop, n8n ），能夠直接與 LINE Desktop 應用程式互動。透過此專案，您可以：

- 📖 讀取 LINE 聊天訊息
- ✉️ 發送 LINE 訊息（手動或自動）
- 🤖 將 LINE 整合到您的 AI 工作流程中

### 功能特色

- 🤖 **AI 整合**：透過 MCP 協議與 Claude Desktop、 n8n 等 AI 工具無縫整合
- 💬 **訊息操作**：支援讀取和發送 LINE 訊息
- 🖥️ **桌面整合**：直接與 LINE Desktop 應用程式互動
- 🔄 **自動化支援**：可選擇手動確認或自動發送訊息

### 系統需求

#### 基本需求

- **LINE Desktop**：v9.10 或以上版本
- **作業系統**：
  - Windows 10 或以上版本
  - macOS Ventura 13.0 或以上版本（需要 AppleScript 支援）

#### 與 Claude Desktop 整合

- **Claude Desktop App**：最新版本
- **Claude 訂閱方案**：Pro 方案

#### 與 n8n 整合

- **n8n**：支援 MCP 的版本

### 安裝方式

#### Windows

1. **安裝 Node.js**
   - 參考微軟官方文件：https://learn.microsoft.com/zh-tw/windows/dev-environment/javascript/nodejs-on-windows

2. **安裝 AutoHotkey v2**
   - 下載並安裝：https://www.autohotkey.com/

3. **設定 Claude Desktop**
   - 開啟 Claude Desktop 設定檔
   - 在 `mcpServers` 中加入以下設定：

```json
{
  "mcpServers": {
    "line-desktop-mcp": {
      "command": "npx",
      "args": ["line-desktop-mcp@latest"]
    }
  }
}
```

#### macOS

1. **安裝 Node.js**
   - 使用 Homebrew：`brew install node`
   - 或從官網下載：https://nodejs.org/

2. **（選擇性）安裝 cliclick**
   - 如果有安裝 Homebrew，會於啟動時自動安裝
   - 或手動安裝：`brew install cliclick`

3. **設定 Claude Desktop**
   - 開啟 Claude Desktop 設定檔
   - 在 `mcpServers` 中加入以下設定：

```json
{
  "mcpServers": {
    "line-desktop-mcp": {
      "command": "npx",
      "args": ["line-desktop-mcp@latest"]
    }
  }
}
```

### 進階設定

#### Streamable HTTP 模式

除了預設的 stdio 模式外，本專案也支援透過 Streamable HTTP 方式運行。此模式特別適合在 **n8n** 等支援 MCP 的平台中使用。

**啟動 Streamable HTTP 模式：**

```bash
npx line-desktop-mcp@latest --http-mode --port 3000
```

**參數說明：**
- `--http-mode`：啟用 Streamable HTTP 模式，使用 HTTP streaming 而非 stdio
- `--port <port>`：指定 HTTP 伺服器的 port（預設：3000）

**MCP 端點配置：**

本機連接：
```
http://127.0.0.1:3000/mcp
```

Docker 中的 n8n 連接（同一台機器）：
```
http://host.docker.internal:3000/mcp
```

**傳輸方式：**
- POST 請求：發送 JSON-RPC 訊息並透過 SSE stream 接收回應
- 支援 session 管理，每個連接會獲得唯一的 session ID

**n8n 工作流程範例：**

如果您想在 n8n 中使用 LINE Desktop MCP，可以下載我們提供的範例工作流程檔案：
- 📥 [下載 n8n 工作流程範例](doc_media/LINE-Desktop-MCP-Demo-chatbot-sample.json)

此範例展示如何在 n8n 中整合 LINE Desktop MCP 建立聊天機器人工作流程。

### 使用方式

在 Claude Desktop 的對話中，您可以使用以下方式操作 LINE：

#### 1. 讀取聊天內容

```
請幫我讀取 LINE 群組『專案討論』的訊息，並作出總結
```

#### 2. 發送訊息（手動確認）

```
請幫我撰寫一個問候，發送到 LINE 群組『專案討論』中
```

Claude 會先撰寫訊息內容，等待您確認後再發送。

#### 3. 發送訊息（自動送出）

```
請幫我撰寫一個問候，發送到 LINE 群組『專案討論』中，並自動發送
```

Claude 會撰寫訊息並自動完成發送動作。

### 使用注意事項

#### 重要提醒

1. **避免干擾自動化操作**  
   本工具透過圖形使用者介面（GUI）進行自動化操作。在自動化程式執行期間，請勿同時使用滑鼠進行其他操作，以免干擾程式運作。

2. **LINE Desktop 視窗配置要求**  
   請確保 LINE Desktop 使用「展開聊天視窗」模式。在此模式下，聊天視窗會固定顯示在聊天室清單的右側，而非以獨立視窗方式開啟。

3. **多顯示器環境配置**  
   若您使用多個顯示器,請將 LINE Desktop 應用程式放置於主要顯示器（第一個顯示器）上,以確保自動化功能正常運作。

### 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE.md](LICENSE.md) 檔案

### 作者

**Geoffrey Wang**
- GitHub: [@dtwang](https://github.com/dtwang)
- Threads: [@geoff_spacetime](https://www.threads.com/@geoff_spacetime)

---

## English

Integrate AI tools with LINE Desktop through MCP (Model Context Protocol) to enable message reading and sending operations.

![LINE Desktop MCP Demo with Claude Desktop](doc_media/line-desktop-demo-4x.gif)

![LINE Desktop MCP Demo with n8n](doc_media/line-desktop-mcp-demo-n8n-2x.gif)

### ⚠️ Important Notice

**This project is NOT the official LINE line-bot-mcp-server**

If you're looking for the official version, please visit: https://github.com/line/line-bot-mcp-server

### Differences from Official Version

- **Official line-bot-mcp-server**: Operates LINE Bot through LINE Messaging API
- **This project line-desktop-mcp**: Directly operates LINE Desktop application on Windows or Mac through MCP

### Important Disclaimer

1. **This project is NOT officially affiliated with LINE**  
   本專案與 LINE 官方無任何關聯。

2. **No need to apply for LINE Developers or use Channel Access Token**  
   This project operates through the already logged-in LINE Desktop application, without requiring developer account registration or API tokens.

### About

LINE Desktop MCP is an integration tool based on the Model Context Protocol that allows AI tools (such as Claude Desktop, n8n ) to interact directly with the LINE Desktop application. With this project, you can:

- 📖 Read LINE chat messages
- ✉️ Send LINE messages (manual or automatic)
- 🤖 Integrate LINE into your AI workflows

### Features

- 🤖 **AI Integration**: Seamlessly integrate with AI tools like Claude Desktop, n8n through the MCP protocol
- 💬 **Message Operations**: Support for reading and sending LINE messages
- 🖥️ **Desktop Integration**: Direct interaction with the LINE Desktop application
- 🔄 **Automation Support**: Choose between manual confirmation or automatic message sending

### System Requirements

#### Basic Requirements

- **LINE Desktop**: v9.10 or above
- **Operating System**:
  - Windows 10 or above
  - macOS Ventura 13.0 or above (requires AppleScript support)

#### Integration with Claude Desktop

- **Claude Desktop App**: Latest version
- **Claude Subscription**: Pro plan

#### Integration with n8n

- **n8n**: Version with MCP support

### Installation

#### Windows

1. **Install Node.js**
   - Follow Microsoft's official guide: https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows

2. **Install AutoHotkey v2**
   - Download and install: https://www.autohotkey.com/

3. **Configure Claude Desktop**
   - Open Claude Desktop configuration file
   - Add the following to `mcpServers`:

```json
{
  "mcpServers": {
    "line-desktop-mcp": {
      "command": "npx",
      "args": ["line-desktop-mcp@latest"]
    }
  }
}
```

#### macOS

1. **Install Node.js**
   - Using Homebrew: `brew install node`
   - Or download from: https://nodejs.org/

2. **(Optional) Install cliclick**
   - If Homebrew is installed, it will be automatically installed on startup
   - Or install manually: `brew install cliclick`

3. **Configure Claude Desktop**
   - Open Claude Desktop configuration file
   - Add the following to `mcpServers`:

```json
{
  "mcpServers": {
    "line-desktop-mcp": {
      "command": "npx",
      "args": ["line-desktop-mcp@latest"]
    }
  }
}
```

### Advanced Configuration

#### Streamable HTTP Mode

In addition to the default stdio mode, this project also supports running via Streamable HTTP. This mode is particularly suitable for use with platforms like **n8n** that support MCP.

**Start Streamable HTTP Mode:**

```bash
npx line-desktop-mcp@latest --http-mode --port 3000
```

**Parameters:**
- `--http-mode`: Enable Streamable HTTP mode, using HTTP streaming instead of stdio
- `--port <port>`: Specify the HTTP server port (default: 3000)

**MCP Endpoint Configuration:**

Local connection:
```
http://127.0.0.1:3000/mcp
```

n8n in Docker (same machine):
```
http://host.docker.internal:3000/mcp
```

**Transport Method:**
- POST requests: Send JSON-RPC messages and receive responses via SSE stream
- Supports session management with unique session IDs for each connection

**n8n Workflow Example:**

If you want to use LINE Desktop MCP in n8n, you can download our sample workflow file:
- 📥 [Download n8n Workflow Example](doc_media/LINE-Desktop-MCP-Demo-chatbot-sample.json)

This example demonstrates how to integrate LINE Desktop MCP in n8n to create a chatbot workflow.

### Usage

In Claude Desktop conversations, you can interact with LINE in the following ways:

#### 1. Read Chat Messages

```
Please read the messages from LINE group 'Project Discussion' and summarize them
```

#### 2. Send Messages (Manual Confirmation)

```
Please write a greeting and send it to LINE group 'Project Discussion'
```

Claude will compose the message and wait for your confirmation before sending.

#### 3. Send Messages (Automatic)

```
Please write a greeting and send it to LINE group 'Project Discussion', and send it automatically
```

Claude will compose the message and automatically complete the sending action.

### Usage Precautions

#### Important Reminders

1. **Avoid Interfering with Automation**  
   This tool performs automation through the graphical user interface (GUI). During automated operations, please refrain from using the mouse for other tasks to prevent interference with the program's execution.

2. **LINE Desktop Window Configuration**  
   Please ensure that LINE Desktop is configured in "Expanded Chat Window" mode. In this mode, the chat window remains docked to the right side of the chat list, rather than opening as a separate independent window.

3. **Multi-Monitor Setup**  
   If you are using multiple monitors, please ensure that the LINE Desktop application is positioned on the primary display (first monitor) for the automation to function correctly.

### License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

### Author

**Geoffrey Wang**
- GitHub: [@dtwang](https://github.com/dtwang)
- Threads: [@geoff_spacetime](https://www.threads.com/@geoff_spacetime)
