#!/bin/bash

# Script to ensure frontend always runs on port 3000
# Kills any processes using port 3000 before starting

echo "🚀 Starting CreativeCore Frontend on port 3000..."

# Kill any process using port 3000
echo "🔍 Checking if port 3000 is in use..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚡ Found process using port 3000, killing it..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Double check with netstat and kill if needed
PORT_PROCESS=$(sudo netstat -tulpn 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1)
if [[ ! -z "$PORT_PROCESS" ]]; then
    echo "⚡ Found remaining process $PORT_PROCESS using port 3000, killing it..."
    sudo kill -9 "$PORT_PROCESS" 2>/dev/null || true
    sleep 2
fi

echo "✅ Port 3000 is now free"

# Start the frontend development server
echo "🎯 Starting Next.js development server on port 3000..."
PORT=3000 npm run dev
