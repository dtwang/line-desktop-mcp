@echo off
setlocal

:: LINE Desktop MCP Server - Claude Desktop Configuration Setup Script for Windows
echo. >&2
echo 🚀 Setting up LINE Desktop MCP Server configuration for Windows... >&2
echo. >&2

:: Define paths
set "CLAUDE_DIR=%APPDATA%\Claude"
set "SOURCE_DIR=%CD%"
set "JSON_SOURCE_DIR=%SOURCE_DIR:\=\\%"

:: Check for AutoHotkey installation
echo 🔍 Checking for AutoHotkey installation... >&2
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
    echo ❌ AutoHotkey is not installed or not found in the default location. >&2
    echo    Please install AutoHotkey from https://www.autohotkey.com/ and run this script again. >&2
    echo. >&2
    pause
    exit /b 1
)

echo    ✅ AutoHotkey found at: %AHK_PATH% >&2

:: Add AutoHotkey to PATH for current session and persistently
echo 🔧 Adding AutoHotkey to PATH... >&2
set "PATH=%AHK_PATH%;%PATH%"
echo    Added to PATH for current session. >&2

:: Check if it's already in the user's persistent PATH
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path') do set USER_PATH=%%b
echo %USER_PATH% | find /I "%AHK_PATH%" >nul
if errorlevel 1 (
    echo    Adding to user's persistent PATH for future sessions... >&2
    setx PATH "%USER_PATH%;%AHK_PATH%"
    echo    Done. You may need to restart your terminal for changes to take effect. >&2
) else (
    echo    Already in user's persistent PATH. >&2
)
echo. >&2

endlocal
