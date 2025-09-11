#!/bin/bash
set -e

# -------------------------
# Colors
# -------------------------
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

FRONTEND_PATH="$(pwd)/dist/browser"
BACKEND_PATH="$(pwd)/backend"

echo -e "${YELLOW}=== Pulling from git ===${NC}"
git pull origin main

echo -e "${YELLOW}Installing Dependencies...${NC}"
npm install
npm --prefix "$BACKEND_PATH" install

echo -e "${YELLOW}Building Frontend & Backend...${NC}"
npm run build:frontend:prod
npm --prefix "$BACKEND_PATH" run build

echo -e "${YELLOW}Running Backend...${NC}"
pm2 reload pm2-ng-backend || pm2 start "$BACKEND_PATH/dist/main.js" --name pm2-ng-backend

echo -e "${YELLOW}Running Frontend...${NC}"
pm2 reload pm2-ng-frontend || pm2 serve "$FRONTEND_PATH" 4141 --name pm2-ng-frontend --spa

echo -e "${GREEN}Deployed Successfully!${NC}"
echo -e "${GREEN}Backend running with PM2 as 'pm2-ng-backend'${NC}"
echo -e "${GREEN}Frontend running at: http://localhost:4141${NC}"
