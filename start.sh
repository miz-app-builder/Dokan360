#!/bin/bash
echo "📦 Building frontend..."
cd client && npm install && npm run build
cd ..
echo "🚀 Starting server..."
PORT=5000 node server.js
