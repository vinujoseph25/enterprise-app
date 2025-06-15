#!/bin/bash

# Backup script for application data and configuration
set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="enterprise-react-backup-$TIMESTAMP"

echo "💾 Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration files
tar -czf "$BACKUP_DIR/$BACKUP_NAME-config.tar.gz" \
    .env.* \
    package*.json \
    tsconfig*.json \
    .eslintrc.js \
    .prettierrc \
    nginx.conf \
    docker-compose*.yml \
    Dockerfile*

# Backup source code (excluding node_modules and build)
tar -czf "$BACKUP_DIR/$BACKUP_NAME-source.tar.gz" \
    --exclude=node_modules \
    --exclude=build \
    --exclude=coverage \
    --exclude=.git \
    src/ \
    public/ \
    scripts/

echo "✅ Backup created successfully in $BACKUP_DIR/"
echo "Config: $BACKUP_NAME-config.tar.gz"
echo "Source: $BACKUP_NAME-source.tar.gz"