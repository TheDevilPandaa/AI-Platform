#!/bin/bash

# Local AI Platform - Start Script
# This script starts both backend and frontend servers

set -e

echo "🚀 Starting Local AI Platform..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt --quiet
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

# Check if Ollama or LM Studio is running
echo "🔍 Checking for AI backends..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama detected"
elif curl -s http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo "✅ LM Studio detected"
else
    echo "⚠️  No AI backend detected. Please start Ollama or LM Studio."
    echo "   - Ollama: ollama serve"
    echo "   - LM Studio: Start the local server"
fi

# Start backend in background
echo "🐍 Starting backend server..."
cd backend
python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check backend.log for details."
    cat backend.log
    exit 1
fi

echo "✅ Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

# Start frontend
echo "⚛️  Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "🎉 Local AI Platform is running!"
echo "=========================================="
echo "📡 Backend:  http://localhost:8000"
echo "🎨 Frontend: http://localhost:3000"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ All servers stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
