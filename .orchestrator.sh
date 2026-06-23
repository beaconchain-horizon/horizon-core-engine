#!/bin/bash
# ================================================================
# orchestrator.sh – Horizon Ecosystem Orchestrator
# ================================================================
# This script automatically detects the current repository and
# executes the appropriate actions based on its name.
# ================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")

if [ "$REPO_NAME" == "unknown" ]; then
    echo -e "${RED}❌ This directory is not a Git repository.${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🚀 Horizon Orchestrator${NC}"
echo -e "${BLUE}📁 Repository: $REPO_NAME${NC}"
echo -e "${BLUE}========================================${NC}"

ensure_mine_branch() {
    local current_branch=$(git branch --show-current 2>/dev/null || echo "")
    if [ "$current_branch" != "mine" ]; then
        echo -e "${YELLOW}⚠️  Switching to 'mine' branch...${NC}"
        git checkout mine 2>/dev/null || git checkout -b mine
        git pull origin mine 2>/dev/null || echo "⚠️  Pull failed, continuing..."
    else
        echo -e "${GREEN}✅ Already on 'mine' branch.${NC}"
    fi
}

install_go_deps() {
    echo -e "${YELLOW}📦 Installing Go dependencies...${NC}"
    go mod tidy
}

run_backend() {
    echo -e "${GREEN}🚀 Starting backend on port 8080...${NC}"
    go run cmd/main.go &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Backend running with PID: $BACKEND_PID${NC}"
    echo -e "${YELLOW}📌 To stop: kill $BACKEND_PID${NC}"
}

update_frontend() {
    local CORE_PATH="../horizon-core-engine"
    local STORE_PATH="."
    if [ -d "$CORE_PATH" ]; then
        echo -e "${YELLOW}📂 Copying store files from core...${NC}"
        cp -f "$CORE_PATH/Beaconchain.us/index.html" "$STORE_PATH/index.html" 2>/dev/null || echo "⚠️  index.html not found"
        echo -e "${GREEN}✅ Frontend updated successfully.${NC}"
    else
        echo -e "${RED}❌ Core repository not found at: $CORE_PATH${NC}"
    fi
}

case "$REPO_NAME" in
    "horizon-core-engine"|"horizon_core_engine"|"beaconchain_horizon")
        ensure_mine_branch
        install_go_deps
        run_backend
        echo -e "${GREEN}✅ Horizon ecosystem (backend) started successfully.${NC}"
        ;;
    "Beaconchain.us"|"beaconchain_us"|"hub")
        ensure_mine_branch
        update_frontend
        echo -e "${GREEN}✅ Horizon store updated successfully.${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unknown repository: $REPO_NAME${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 Operation completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
