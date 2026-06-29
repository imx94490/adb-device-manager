# Manual build script for ADB Device Manager
$ProjectDir = "D:\TraeSolo\adb-device-manager"
$OutputDir = "$ProjectDir\release-output\win-unpacked"

Set-Location $ProjectDir

Write-Host "========================================"
Write-Host "Manual Build Script"
Write-Host "========================================"
Write-Host ""

# Step 1: Build the project
Write-Host "[1/3] Building project..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build successful." -ForegroundColor Green
Write-Host ""

# Step 2: Copy Electron runtime
Write-Host "[2/3] Setting up Electron runtime..."

# Find Electron executable
$ElectronExe = "$ProjectDir\node_modules\electron\dist\electron.exe"
$ElectronExe64 = "$ProjectDir\node_modules\electron\dist\electron64.exe"

if (-not (Test-Path $ElectronExe)) {
    Write-Host "ERROR: electron.exe not found at $ElectronExe" -ForegroundColor Red
    Write-Host "Please run: npm install electron" -ForegroundColor Yellow
    exit 1
}

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Copy Electron files
Write-Host "  Copying Electron runtime..."
Copy-Item -Path "$ProjectDir\node_modules\electron\dist\*" -Destination $OutputDir -Recurse -Force

# Copy resources
Write-Host "  Copying application files..."
if (-not (Test-Path "$OutputDir\resources")) {
    New-Item -ItemType Directory -Path "$OutputDir\resources" -Force | Out-Null
}

# Copy dist to resources/app
if (Test-Path "$OutputDir\resources\app") {
    Remove-Item -Path "$OutputDir\resources\app" -Recurse -Force
}
Copy-Item -Path "$ProjectDir\dist" -Destination "$OutputDir\resources\app" -Recurse -Force

# Copy package.json
Copy-Item -Path "$ProjectDir\package.json" -Destination "$OutputDir\resources\" -Force

Write-Host "Done." -ForegroundColor Green
Write-Host ""

# Step 3: Summary
Write-Host "[3/3] Build complete!"
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Executable location:" -ForegroundColor Cyan
Write-Host "$OutputDir\ADB Device Manager.exe" -ForegroundColor White
Write-Host ""
Write-Host "Or simply:" -ForegroundColor Cyan
Write-Host "$OutputDir\electron.exe" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "Note: The app is built with asar DISABLED." -ForegroundColor Yellow
Write-Host "For a proper installer, run in admin mode or use a different machine." -ForegroundColor Yellow
