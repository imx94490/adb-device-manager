# ADB Device Manager - Build Script (PowerShell)
# Run this script to build and package the application

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================"
Write-Host "ADB Device Manager - Build Script"
Write-Host "========================================"
Write-Host ""

Set-Location $ProjectDir

# Step 0: Close running application
Write-Host "[0/4] Closing running application..."
Get-Process -Name "ADB Device Manager" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 1: Clean previous build - use robust deletion
Write-Host "[1/4] Cleaning previous build..."

function Remove-Item-Retry {
    param([string]$Path, [int]$MaxRetries = 3)
    for ($i = 1; $i -le $MaxRetries; $i++) {
        if (-not (Test-Path $Path)) { return $true }
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            return $true
        } catch {
            Write-Host "  Retry $i/$MaxRetries..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

if (Test-Path "release") {
    Write-Host "  Deleting release folder..." -ForegroundColor Yellow
    Remove-Item-Retry -Path "release"
}

if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}

Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "[2/4] Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 3: Build project
Write-Host "[3/4] Building project..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 4: Package executable (dir mode, no asar)
Write-Host "[4/4] Packaging executable (dir mode)..."
npx electron-builder --win dir --x64

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Build completed!" -ForegroundColor Green
    Write-Host "Executable: release-output\win-unpacked\ADB Device Manager.exe" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
