#!/bin/sh

# Exit on any error
set -e

echo "========================================="
echo "Ferraco CRM - Starting Application"
echo "========================================="

# Change to backend directory
cd /app/backend

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Start backend as nodejs user in background
echo "Starting Node.js backend on port 3002..."
su nodejs -c "node dist/server.js" &

# Store backend PID
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend failed to start"
    exit 1
fi

echo "Backend started successfully (PID: $BACKEND_PID)"

# Start nginx in foreground
echo "Starting Nginx..."
echo "========================================="
echo "Application is ready!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo "Health Check: http://localhost/health"
echo "========================================="

# Function to handle shutdown gracefully
shutdown() {
    echo "Shutting down gracefully..."
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill -TERM $BACKEND_PID 2>/dev/null || true
    echo "Stopping nginx..."
    nginx -s quit
    exit 0
}

# Trap signals for graceful shutdown
trap shutdown SIGTERM SIGINT

# Start nginx in foreground (this keeps the container running)
exec nginx -g 'daemon off;'
