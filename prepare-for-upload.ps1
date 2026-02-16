# Скрипт для підготовки файлів для завантаження на сервер
# Використання: .\prepare-for-upload.ps1

Write-Host "🚀 Підготовка файлів для завантаження на сервер..." -ForegroundColor Green
Write-Host ""

# Перевірка, чи скрипт запущений з правильної директорії
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Помилка: package.json не знайдено. Запустіть скрипт з кореневої директорії проєкту" -ForegroundColor Red
    exit 1
}

# Створення тимчасової папки
$tempDir = "..\deploy-temp"
$zipFile = "..\deploy.zip"

Write-Host "📦 Створення тимчасової папки..." -ForegroundColor Yellow
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "📋 Копіювання файлів (виключаючи node_modules та .env)..." -ForegroundColor Yellow

# Копіювання файлів
Get-ChildItem -Path . -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -notmatch "\.env$" -and
    $_.FullName -notmatch "\.log$" -and
    $_.FullName -notmatch "logs\\" -and
    $_.FullName -notmatch "\.git\\" -and
    $_.FullName -notmatch "deploy-temp" -and
    $_.FullName -notmatch "\.zip$"
} | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
    $destPath = Join-Path $tempDir $relativePath
    $destDir = Split-Path $destPath -Parent
    
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    if (-not $_.PSIsContainer) {
        Copy-Item $_.FullName -Destination $destPath -Force
    }
}

Write-Host "📦 Створення архіву..." -ForegroundColor Yellow
if (Test-Path $zipFile) {
    Remove-Item -Path $zipFile -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

Write-Host "🧹 Очищення тимчасових файлів..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

$zipSize = (Get-Item $zipFile).Length / 1MB
Write-Host ""
Write-Host "✅ Готово! Архів створено: $zipFile" -ForegroundColor Green
Write-Host "   Розмір: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Наступні кроки:" -ForegroundColor Cyan
Write-Host "   1. Завантажте deploy.zip на сервер через FileZilla або WinSCP" -ForegroundColor Cyan
Write-Host "   2. Розпакуйте архів на сервері: unzip deploy.zip -d affiliate-tracking" -ForegroundColor Cyan
Write-Host "   3. Дотримуйтесь інструкцій з UPLOAD_TO_SERVER.md" -ForegroundColor Cyan
