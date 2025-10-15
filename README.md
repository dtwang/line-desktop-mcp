# LINE Desktop MCP

[English](#english) | [繁體中文](#繁體中文)

---

## 繁體中文

透過 MCP（Model Context Protocol），使 AI 工具能夠與 LINE Desktop 整合，並執行訊息的讀取與發送操作。

### ⚠️ 重要說明

**這個專案不是 LINE 官方的 line-bot-mcp-server**

如果你要找的是官方版本，請前往：https://github.com/line/line-bot-mcp-server

### 與官方版本的差異

- **官方 line-bot-mcp-server**：透過 LINE Messaging API 操作 LINE Bot
- **本專案 line-desktop-mcp**：透過 MCP 在 Windows 或 Mac 上直接操作 LINE Desktop 應用程式

### 關於專案

LINE Desktop MCP 是一個基於 Model Context Protocol 的整合工具，讓 AI 助手（如 Claude Desktop）能夠直接與 LINE Desktop 應用程式互動。透過此專案，您可以：

- 📖 讀取 LINE 聊天訊息
- ✉️ 發送 LINE 訊息（手動或自動）
- 🤖 將 LINE 整合到您的 AI 工作流程中

### 功能特色

- 🤖 **AI 整合**：透過 MCP 協議與 Claude Desktop 等 AI 工具無縫整合
- 💬 **訊息操作**：支援讀取和發送 LINE 訊息
- 🖥️ **桌面整合**：直接與 LINE Desktop 應用程式互動
- 🔄 **自動化支援**：可選擇手動確認或自動發送訊息

### 系統需求

- **LINE Desktop**：v9.10 或以上版本
- **Claude Desktop App**：最新版本
- **Claude 訂閱方案**：Pro 方案
- **作業系統**：Windows 或 macOS

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

2. **設定 Claude Desktop**
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

### 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE.md](LICENSE.md) 檔案

### 作者

**Geoffrey Wang**
- GitHub: [@dtwang](https://github.com/dtwang)
- Threads: [@geoff_spacetime](https://www.threads.com/@geoff_spacetime)

---

## English

Integrate AI tools with LINE Desktop through MCP (Model Context Protocol) to enable message reading and sending operations.

### ⚠️ Important Notice

**This project is NOT the official LINE line-bot-mcp-server**

If you're looking for the official version, please visit: https://github.com/line/line-bot-mcp-server

### Differences from Official Version

- **Official line-bot-mcp-server**: Operates LINE Bot through LINE Messaging API
- **This project line-desktop-mcp**: Directly operates LINE Desktop application on Windows or Mac through MCP

### About

LINE Desktop MCP is an integration tool based on the Model Context Protocol that allows AI assistants (such as Claude Desktop) to interact directly with the LINE Desktop application. With this project, you can:

- 📖 Read LINE chat messages
- ✉️ Send LINE messages (manual or automatic)
- 🤖 Integrate LINE into your AI workflows

### Features

- 🤖 **AI Integration**: Seamlessly integrate with AI tools like Claude Desktop through the MCP protocol
- 💬 **Message Operations**: Support for reading and sending LINE messages
- 🖥️ **Desktop Integration**: Direct interaction with the LINE Desktop application
- 🔄 **Automation Support**: Choose between manual confirmation or automatic message sending

### System Requirements

- **LINE Desktop**: v9.10 or above
- **Claude Desktop App**: Latest version
- **Claude Subscription**: Pro plan
- **Operating System**: Windows or macOS

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

2. **Configure Claude Desktop**
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

### License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

### Author

**Geoffrey Wang**
- GitHub: [@dtwang](https://github.com/dtwang)
- Threads: [@geoff_spacetime](https://www.threads.com/@geoff_spacetime)
