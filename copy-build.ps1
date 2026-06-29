$projectDir = "D:\TraeSolo\adb-device-manager"
$distDir = "$projectDir\dist"
$appDir = "$projectDir\release-output\win-unpacked\resources\app"
$pkgSrc = "$projectDir\package.json"
$pkgDst = "$projectDir\release-output\win-unpacked\resources\package.json"

Write-Host "Setting up app directory structure..."

if (Test-Path $appDir) {
    Remove-Item $appDir -Recurse -Force
}

New-Item -ItemType Directory -Path $appDir -Force | Out-Null

Write-Host "  Copying dist to app/dist..."
Copy-Item $distDir "$appDir\dist" -Recurse -Force

Write-Host "  Copying package.json to app directory..."
Copy-Item $pkgSrc "$appDir\package.json" -Force

Write-Host ""
Write-Host "Setup complete!"
Write-Host "Executable: $projectDir\release-output\win-unpacked\ADB Device Manager.exe"
Write-Host ""
Write-Host "App structure:"
Write-Host "  resources/app/"
Write-Host "    dist/main/main/index.js  <- main entry"
Write-Host "    dist/renderer/index.html  <- renderer"
Write-Host "    package.json              <- main field: dist/main/main/index.js"
