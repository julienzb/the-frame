#!/bin/bash
set -e

APP_DIR="/srv/apps/the-frame"
SERVICE_NAME="the-frame"

echo "Pulling latest changes..."
cd "$APP_DIR"
git pull

echo "Building backend..."
cd "$APP_DIR/backend"
npm run build

echo "Building frontend..."
cd "$APP_DIR/frontend"
npm run build

echo "Restarting service..."
sudo systemctl restart "$SERVICE_NAME"

echo "Refreshing browser..."
DISPLAY=:0 xdotool key F5

echo "Update complete."