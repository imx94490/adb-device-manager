@echo off
chcp 65001 >nul
setlocal

echo ========================================
echo ADB Device Manager - Build Script
echo ========================================
echo.

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo [0/4] Checking for running application...
taskkill /F /IM "ADB Device Manager.exe" 2>nul
taskkill /F /IM "electron.exe" 2>nul
timeout /t 3 /nobreak >nul
echo Done.
echo.

echo [1/4] Cleaning previous build...
REM Use PowerShell to force delete locked files
powershell -Command "Get-ChildItem -Path 'release' -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue"
powershell -Command "if (Test-Path 'release') { Remove-Item -Path 'release' -Force -Recurse -ErrorAction SilentlyContinue }"
if exist "release" (
    echo Retrying deletion...
    timeout /t 2 /nobreak >nul
    powershell -Command "if (Test-Path 'release') { Remove-Item -Path 'release' -Force -Recurse -ErrorAction SilentlyContinue }"
)
if exist "dist" rd /s /q "dist"
echo Done.
echo.

echo [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo Done.
echo.

echo [3/4] Building project...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Done.
echo.

echo [4/4] Packaging executable (dir mode)...
call npx electron-builder --win dir --x64
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo Build completed!
    echo Executable: release-output\win-unpacked\ADB Device Manager.exe
    echo ========================================
) else (
    echo.
    echo ERROR: Build failed!
)
echo.

echo Done! Press any key to exit...
pause >nul
endlocal
