#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/postgres"

mkdir -p "$BACKUP_DIR"

echo "💾 Starting automated PostgreSQL database backup at $TIMESTAMP..."
docker exec razorpay_enterprise-postgres-1 pg_dump -U razorpay recovery_db > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "✅ Backup successfully created at $BACKUP_DIR/backup_$TIMESTAMP.sql"

# Upload to S3 if AWS CLI is configured
if command -v aws &> /dev/null; then
    echo "☁️ Uploading backup to S3 bucket..."
    aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql" s3://payresq-backups/ || true
fi

# Clean up backups older than 30 days
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete || true
echo "🧹 Old backups pruned."
