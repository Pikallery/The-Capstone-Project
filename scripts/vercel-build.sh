#!/bin/bash
set -e

echo "=== Building frontend ==="
npm install --prefix frontend
npm run build --prefix frontend

echo "=== Setting up backend ==="
npm install --prefix backend
cd backend && npx prisma generate && cd ..

echo "=== Build complete ==="
