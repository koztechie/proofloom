#!/bin/bash
set -e

# Build the application
echo "Building the application..."
npm run build

# Start the application in the background
echo "Starting the application..."
npm run start &
SERVER_PID=$!

# Wait for the server to be ready on port 3000
echo "Waiting for port 3000 to be active..."
timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 1; done'

# Run Playwright tests
echo "Running E2E tests..."
npx playwright test

# Gracefully terminate the server
echo "Terminating the server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null || true
echo "Done."
