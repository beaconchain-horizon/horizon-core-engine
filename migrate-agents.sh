#!/bin/bash
# ============================================================
# migrate-agents.sh – Migrate all Agency Agents into Core
# ============================================================
# Usage: ./migrate-agents.sh [--dry-run]
# ============================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
log() { echo -e "${BLUE}[MIGRATE]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Variables
CORE_ROOT="$(pwd)"
AGENTS_REPO="https://github.com/beaconchain-horizon/agency-agents.git"
TEMP_DIR="$CORE_ROOT/.temp-agents-migration"
DRY_RUN=false

# Parse args
[[ "$1" == "--dry-run" ]] && DRY_RUN=true

# Check if running in Core root
if [ ! -f "$CORE_ROOT/go.mod" ] && [ ! -d "$CORE_ROOT/cmd" ]; then
    error "Run this script from the root of horizon-core-engine"
fi

# Dry-run mode
if [ "$DRY_RUN" = true ]; then
    log "🧪 DRY-RUN mode – no changes will be made"
fi

# Clone agents (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    log "Cloning agency-agents..."
    rm -rf "$TEMP_DIR"
    git clone --depth 1 "$AGENTS_REPO" "$TEMP_DIR" || error "Clone failed"
else
    log "🧪 [DRY-RUN] Skipping clone"
fi

# Create target directories (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    mkdir -p "$CORE_ROOT/agents"/{engineering,design,marketing,community,special}
    mkdir -p "$CORE_ROOT/scripts"
    mkdir -p "$CORE_ROOT/cmd/agent-manager"
else
    log "🧪 [DRY-RUN] Skipping directory creation"
fi

# Copy agent profiles (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    log "Copying agent profiles..."
    for dir in engineering design marketing community special; do
        cp -r "$TEMP_DIR/$dir/"*.md "$CORE_ROOT/agents/$dir/" 2>/dev/null || warn "No $dir agents found"
    done
else
    log "🧪 [DRY-RUN] Skipping agent copy"
fi

# Copy scripts and configs (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    [ -f "$TEMP_DIR/scripts/install.sh" ] && cp "$TEMP_DIR/scripts/install.sh" "$CORE_ROOT/scripts/install-agents.sh"
    [ -f "$TEMP_DIR/scripts/convert.sh" ] && cp "$TEMP_DIR/scripts/convert.sh" "$CORE_ROOT/scripts/convert-agents.sh"
    [ -f "$TEMP_DIR/.env" ] && cp "$TEMP_DIR/.env" "$CORE_ROOT/.env.agents"
    [ -f "$TEMP_DIR/package.json" ] && cp "$TEMP_DIR/package.json" "$CORE_ROOT/agents/package.json"
else
    log "🧪 [DRY-RUN] Skipping script/config copy"
fi

# Generate AGENTS_INDEX.md (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    log "Creating AGENTS_INDEX.md..."
    cat > "$CORE_ROOT/AGENTS_INDEX.md" <<EOF
# 🤖 Horizon AI Agents – Master Index

All AI agents are now centralized in Core.

## Engineering
$(ls -1 $CORE_ROOT/agents/engineering/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- None")

## Design
$(ls -1 $CORE_ROOT/agents/design/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- None")

## Marketing
$(ls -1 $CORE_ROOT/agents/marketing/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- None")

## Community
$(ls -1 $CORE_ROOT/agents/community/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- None")

## Special
$(ls -1 $CORE_ROOT/agents/special/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- None")
EOF
    success "AGENTS_INDEX.md created"
fi

# Create unified control script (unless dry-run)
if [ "$DRY_RUN" = false ]; then
    log "Creating horizon-ctl.sh..."
    cat > "$CORE_ROOT/horizon-ctl.sh" <<'EOF'
#!/bin/bash
# horizon-ctl.sh – Unified Horizon Controller
# Usage: ./horizon-ctl.sh {start|stop|status|agent|core}

ROOT_DIR="$(pwd)"; LOG_DIR="$ROOT_DIR/logs"; PID_DIR="$ROOT_DIR/.pids"
mkdir -p "$LOG_DIR" "$PID_DIR"

case "$1" in
    start)
        echo "🚀 Starting Core..."
        ./bin/horizon-api > "$LOG_DIR/core.log" 2>&1 &
        echo $! > "$PID_DIR/core.pid"
        echo "🤖 Starting Agents..."
        [ -f "./scripts/install-agents.sh" ] && ./scripts/install-agents.sh --start
        echo "✅ Done"
        ;;
    stop)
        echo "⏹️ Stopping all..."
        kill $(cat "$PID_DIR"/*.pid 2>/dev/null) 2>/dev/null || true
        rm -f "$PID_DIR"/*.pid
        echo "✅ Stopped"
        ;;
    status)
        echo "📊 Status:"
        for pid in "$PID_DIR"/*.pid; do
            [ -f "$pid" ] && name=$(basename "$pid" .pid) && \
                ps -p $(cat "$pid") >/dev/null && echo "✅ $name RUNNING" || echo "❌ $name STOPPED"
        done
        ;;
    agent)
        case "$2" in
            list) ls -1 ./agents/*/*.md 2>/dev/null | sed 's/\.md$//;s/\.\/agents\///' || echo "No agents";;
            enable) echo "🔓 Enabling agent: $3";;
            disable) echo "🔒 Disabling agent: $3";;
            *) echo "Usage: $0 agent {list|enable|disable} [name]";;
        esac
        ;;
    core)
        [ "$2" == "migrate" ] && ./bin/horizon-api --migrate || echo "Usage: $0 core migrate"
        ;;
    *) echo "Usage: $0 {start|stop|status|agent|core}"; exit 1;;
esac
EOF
    chmod +x "$CORE_ROOT/horizon-ctl.sh"
    success "horizon-ctl.sh created"
fi

# Archive the old repo (unless dry-run)
if [ "$DRY_RUN" = false ] && command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
    log "Archiving agency-agents → agency-agents-archive..."
    gh repo rename "agency-agents" "agency-agents-archive" --repo "beaconchain-horizon/agency-agents" 2>/dev/null && \
        success "Repo renamed" || warn "Could not rename (admin rights needed)"
else
    warn "GitHub CLI not available – archive manually"
fi

# Cleanup
if [ "$DRY_RUN" = false ]; then
    rm -rf "$TEMP_DIR"
    success "✅ Migration complete!"
    echo "📌 All agents are now in horizon-core-engine"
    echo "🔧 Use ./horizon-ctl.sh to manage everything"
else
    log "🧪 DRY-RUN finished – no changes made"
fi
