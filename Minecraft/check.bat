@echo off
rem Craft - headless self-checks over world generation and collision.
setlocal
cd /d "%~dp0"

if not exist "out\com\craft\Main.class" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
    if errorlevel 1 exit /b 1
)

java -cp "libs\*;out" com.craft.dev.SelfCheck %*
