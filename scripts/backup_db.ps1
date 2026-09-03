$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups\postgres"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$backupFile = "$backupDir\backup_$timestamp.sql"
Write-Host "💾 Starting PostgreSQL database backup..." -ForegroundColor Cyan

docker exec razorpay_enterprise-postgres-1 pg_dump -U razorpay recovery_db > $backupFile

if (Test-Path $backupFile) {
    $size = (Get-Item $backupFile).Length
    Write-Host "✅ Backup created: $backupFile ($([math]::Round($size / 1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed." -ForegroundColor Red
}
