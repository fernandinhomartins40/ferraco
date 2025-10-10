#!/bin/sh

# Exit on any error
set -e

echo "========================================="
echo "Ferraco CRM - Starting Application"
echo "========================================="

# Change to backend directory
cd /app/backend

# Fix initial directory permissions
echo "Fixing directory permissions..."
chown -R nodejs:nodejs /app/backend/data /app/backend/logs
chmod 755 /app/backend/data

# Regenerate Prisma Client (ensures it's in sync with schema)
echo "Regenerating Prisma Client..."
npx prisma generate

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Fix database file permissions AFTER migrations (which create the db file)
echo "Fixing database file permissions..."
chown nodejs:nodejs /app/backend/data/*.db 2>/dev/null || true
chown nodejs:nodejs /app/backend/data/*.db-journal 2>/dev/null || true
chmod 644 /app/backend/data/*.db 2>/dev/null || true

# Check if database needs seeding (if users table is empty)
echo "Checking if database needs seeding..."
USER_COUNT=$(sqlite3 /app/backend/data/ferraco.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
    echo "Database is empty. Running seed..."
    npx tsx prisma/seed.ts
    echo "Seed completed successfully!"
else
    echo "Database already has $USER_COUNT users. Skipping seed."
fi

# Start backend as nodejs user in background
echo "Starting Node.js backend on port 3002..."
su-exec nodejs:nodejs node dist/server.js > /app/backend/logs/backend.log 2>&1 &

# Store backend PID
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend failed to start"
    echo "Logs:"
    cat /app/backend/logs/backend.log
    exit 1
fi

# Check if backend is listening on port 3002
if ! netstat -tuln | grep -q ':3002'; then
    echo "WARNING: Backend started but not listening on port 3002 yet, waiting..."
    sleep 3
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
