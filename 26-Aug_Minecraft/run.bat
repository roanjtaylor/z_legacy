@echo off
rem Craft - launcher. Builds first if needed, then runs.
setlocal
cd /d "%~dp0"

if not exist "out\com\craft\Main.class" (
    echo No build found, building first...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
    if errorlevel 1 (
        echo Build failed.
        pause
        exit /b 1
    )
)

java -cp "libs\*;out" com.craft.Main %*
if errorlevel 1 pause
