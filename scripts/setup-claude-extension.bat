@echo off
setlocal

:: LINE Desktop MCP Server - Claude Desktop Configuration Setup Script for Windows
echo.
echo 🚀 Setting up LINE Desktop MCP Server configuration for Windows...
echo.

:: Define paths
set "CLAUDE_DIR=%APPDATA%\Claude"
set "SOURCE_DIR=%CD%"
set "JSON_SOURCE_DIR=%SOURCE_DIR:\=\\%"

:: Check for AutoHotkey installation
echo 🔍 Checking for AutoHotkey installation...
set "AHK_PATH="
if exist "%ProgramFiles%\AutoHotkey\AutoHotkey.exe" (
    set "AHK_PATH=%ProgramFiles%\AutoHotkey"
) else if exist "%ProgramFiles%\AutoHotkey\v2\AutoHotkey.exe" (
    set "AHK_PATH=%ProgramFiles%\AutoHotkey\v2"
) else if exist "%ProgramFiles(x86)%\AutoHotkey\AutoHotkey.exe" (
    set "AHK_PATH=%ProgramFiles(x86)%\AutoHotkey"
) else if exist "%ProgramFiles(x86)%\AutoHotkey\v2\AutoHotkey.exe" (
    set "AHK_PATH=%ProgramFiles(x86)%\AutoHotkey\v2"
)

if not defined AHK_PATH (
    echo ❌ AutoHotkey is not installed or not found in the default location.
    echo    Please install AutoHotkey from https://www.autohotkey.com/ and run this script again.
    echo.
    pause
    exit /b 1
)

echo    ✅ AutoHotkey found at: %AHK_PATH%

:: Add AutoHotkey to PATH for current session and persistently
echo 🔧 Adding AutoHotkey to PATH...
set "PATH=%AHK_PATH%;%PATH%"
echo    Added to PATH for current session.

:: Check if it's already in the user's persistent PATH
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path') do set USER_PATH=%%b
echo %USER_PATH% | find /I "%AHK_PATH%" >nul
if errorlevel 1 (
    echo    Adding to user's persistent PATH for future sessions...
    setx PATH "%USER_PATH%;%AHK_PATH%"
    echo    Done. You may need to restart your terminal for changes to take effect.
) else (
    echo    Already in user's persistent PATH.
)
echo.

:: Create Claude directory if it doesn't exist
echo 📁 Creating Claude directory...
if not exist "%CLAUDE_DIR%" (
    mkdir "%CLAUDE_DIR%"
    echo    Directory created at %CLAUDE_DIR%
) else (
    echo    Directory already exists at %CLAUDE_DIR%
)
echo.

:: Create or update Claude Desktop config
set "CONFIG_FILE=%CLAUDE_DIR%\claude_desktop_config.json"
echo ⚙️  Updating Claude Desktop configuration...
echo.

:: Backup existing config if it exists
if exist "%CONFIG_FILE%" (
    for /f "tokens=1-4 delims=/ " %%i in ("%date%") do (
        for /f "tokens=1-3 delims=/: " %%a in ("%time%") do (
            set "TIMESTAMP=%%l%%j%%k_%%a%%b%%c"
        )
    )
    copy "%CONFIG_FILE%" "%CONFIG_FILE%.backup.%TIMESTAMP%"
    echo 📄 Backed up existing config to %CONFIG_FILE%.backup.%TIMESTAMP%
    echo.
)

:: Check if config already has mcpServers section
if exist "%CONFIG_FILE%" (
    findstr /C:"mcpServers" "%CONFIG_FILE%" >nul
    if %errorlevel% equ 0 (
        echo ⚠️  Existing mcpServers configuration found.
        echo 📝 Please manually add the following to your claude_desktop_config.json:
        echo.
        echo Add this to the "mcpServers" section:
        echo     "line-desktop-mcp": {
        echo       "command": "node",
        echo       "args": [
        echo         "%JSON_SOURCE_DIR%\\src\\server.js"
        echo       ],
        echo       "env": {
        echo         "DEBUG": "false"
        echo       }
        echo     }
        echo.
    ) else (
        echo ⚠️  Config file exists but is missing "mcpServers". Please add it manually.
    )
) else (
    echo 📝 Creating new claude_desktop_config.json...
    (
        echo {
        echo   "mcpServers": {
        echo     "line-desktop-mcp": {
        echo       "command": "node",
        echo       "args": [
        echo         "%JSON_SOURCE_DIR%\\src\\server.js"
        echo       ],
        echo       "env": {
        echo         "DEBUG": "false"
        echo       }
        echo     }
        echo   }
        echo }
    ) > "%CONFIG_FILE%"
)

echo.
echo ✅ Configuration complete!
echo.
echo 📋 Next steps:
echo 1. Restart Claude Desktop completely
echo 2. Ensure LINE Desktop is running and logged in
echo 3. Test the MCP tools in a new Claude conversation
echo.
echo 📍 MCP Server location: %SOURCE_DIR%
echo 📍 Config file: %CONFIG_FILE%
echo.
echo 🔧 Manual configuration (if needed):
echo Edit: %CONFIG_FILE%
echo Add the line-desktop-mcp server to the mcpServers section
echo.

pause
endlocal
