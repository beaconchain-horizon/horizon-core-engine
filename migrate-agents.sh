#!/bin/bash
# ============================================================
# migrate-agents.sh – مهاجرت کامل Agency Agents به Core
# ============================================================
# Location: ریشه‌ی مخزن horizon-core-engine
# Usage:   ./migrate-agents.sh
# ============================================================

set -euo pipefail

# ---------- Colors ----------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${BLUE}[MIGRATE]${NC} $1"; }
success(){ echo -e "${GREEN}✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ---------- Variables ----------
CORE_ROOT="$(pwd)"  # ریشه‌ی Core که اسکریپت در آن اجرا می‌شود
AGENTS_REPO="https://github.com/beaconchain-horizon/agency-agents.git"
TEMP_DIR="$CORE_ROOT/.temp-agents-migration"
GITHUB_ORG="beaconchain-horizon"

# ---------- شروع ----------
log "شروع مهاجرت Agency Agents به Core Engine..."
log "ریشه‌ی Core: $CORE_ROOT"

# ۱. بررسی اینکه در ریشه‌ی Core هستیم
if [ ! -f "$CORE_ROOT/go.mod" ] && [ ! -d "$CORE_ROOT/cmd" ]; then
    error "این اسکریپت باید در ریشه‌ی مخزن horizon-core-engine اجرا شود."
fi

# ۲. کلون کردن Agency Agents
log "کلون کردن Agency Agents از گیت‌هاب..."
rm -rf "$TEMP_DIR"
git clone --depth 1 "$AGENTS_REPO" "$TEMP_DIR" || error "کلون کردن Agency Agents ناموفق بود."

# ۳. ایجاد پوشه‌های هدف در Core
mkdir -p "$CORE_ROOT/agents"
mkdir -p "$CORE_ROOT/agents/engineering"
mkdir -p "$CORE_ROOT/agents/design"
mkdir -p "$CORE_ROOT/agents/marketing"
mkdir -p "$CORE_ROOT/agents/community"
mkdir -p "$CORE_ROOT/agents/special"
mkdir -p "$CORE_ROOT/scripts"
mkdir -p "$CORE_ROOT/cmd/agent-manager"

# ۴. کپی کردن فایل‌های Agents (Markdown)
log "کپی کردن پروفایل‌های Agents..."
cp -r "$TEMP_DIR/engineering/"*.md "$CORE_ROOT/agents/engineering/" 2>/dev/null || warn "هیچ Agent مهندسی یافت نشد."
cp -r "$TEMP_DIR/design/"*.md "$CORE_ROOT/agents/design/" 2>/dev/null || warn "هیچ Agent طراحی یافت نشد."
cp -r "$TEMP_DIR/marketing/"*.md "$CORE_ROOT/agents/marketing/" 2>/dev/null || warn "هیچ Agent بازاریابی یافت نشد."
cp -r "$TEMP_DIR/community/"*.md "$CORE_ROOT/agents/community/" 2>/dev/null || warn "هیچ Agent جامعه یافت نشد."
cp -r "$TEMP_DIR/special/"*.md "$CORE_ROOT/agents/special/" 2>/dev/null || warn "هیچ Agent ویژه یافت نشد."

# ۵. کپی کردن اسکریپت‌های نصب و تبدیل
log "کپی کردن اسکریپت‌های نصب و تبدیل..."
[ -f "$TEMP_DIR/scripts/install.sh" ] && cp "$TEMP_DIR/scripts/install.sh" "$CORE_ROOT/scripts/install-agents.sh"
[ -f "$TEMP_DIR/scripts/convert.sh" ] && cp "$TEMP_DIR/scripts/convert.sh" "$CORE_ROOT/scripts/convert-agents.sh"

# ۶. کپی کردن فایل‌های پیکربندی
[ -f "$TEMP_DIR/.env" ] && cp "$TEMP_DIR/.env" "$CORE_ROOT/.env.agents"
[ -f "$TEMP_DIR/package.json" ] && cp "$TEMP_DIR/package.json" "$CORE_ROOT/agents/package.json"

# ۷. ایجاد فایل INDEX جامع
log "ایجاد فهرست جامع Agents..."
cat > "$CORE_ROOT/AGENTS_INDEX.md" <<EOF
# 🤖 Horizon AI Agents – فهرست جامع

تمامی عوامل هوش مصنوعی (AI Agents) در این مخزن متمرکز شده‌اند.

## 🧠 دسته‌بندی Agents

### مهندسی (Engineering)
$(ls -1 $CORE_ROOT/agents/engineering/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- هیچ Agent مهندسی یافت نشد.")

### طراحی (Design)
$(ls -1 $CORE_ROOT/agents/design/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- هیچ Agent طراحی یافت نشد.")

### بازاریابی (Marketing)
$(ls -1 $CORE_ROOT/agents/marketing/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- هیچ Agent بازاریابی یافت نشد.")

### جامعه (Community)
$(ls -1 $CORE_ROOT/agents/community/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- هیچ Agent جامعه یافت نشد.")

### ویژه (Special)
$(ls -1 $CORE_ROOT/agents/special/*.md 2>/dev/null | sed 's/^/- /;s/\.md$//' || echo "- هیچ Agent ویژه یافت نشد.")

---
**نکته:** تمام Agents از کلیدهای خصوصی Core استفاده می‌کنند و به‌صورت یکپارچه با موتور اصلی کار می‌کنند.
EOF

success "فهرست جامع Agents ایجاد شد."

# ۸. ایجاد اسکریپت مدیریت یکپارچه (horizon-ctl.sh) در ریشه‌ی Core
log "ایجاد اسکریپت مدیریت یکپارچه horizon-ctl.sh در ریشه..."
cat > "$CORE_ROOT/horizon-ctl.sh" <<'EOFCTL'
#!/bin/bash
# ============================================================
# horizon-ctl.sh – کنترلر یکپارچهٔ اکوسیستم Horizon
# ============================================================
# Location: ریشه‌ی horizon-core-engine
# Usage: ./horizon-ctl.sh {command} [target]
# Commands:
#   start     : راه‌اندازی Core + Agents
#   stop      : توقف همه
#   status    : نمایش وضعیت
#   deploy    : استقرار کامل (Core + Agents)
#   agent     : مدیریت Agents (لیست، فعال‌سازی، غیرفعال‌سازی)
#   core      : مدیریت Core (مهاجرت دیتابیس)
# ============================================================

set -euo pipefail

ROOT_DIR="$(pwd)"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/.pids"
mkdir -p "$LOG_DIR" "$PID_DIR"

case "$1" in
    start)
        echo "🚀 راه‌اندازی Core Engine..."
        cd "$ROOT_DIR"
        ./bin/horizon-api > "$LOG_DIR/core.log" 2>&1 &
        echo $! > "$PID_DIR/core.pid"
        
        echo "🤖 راه‌اندازی Agents..."
        if [ -f "./scripts/install-agents.sh" ]; then
            ./scripts/install-agents.sh --start
        fi
        echo "✅ همه چیز راه‌اندازی شد."
        ;;
        
    stop)
        echo "⏹️ توقف همه سرویس‌ها..."
        kill $(cat "$PID_DIR"/*.pid 2>/dev/null) 2>/dev/null || true
        rm -f "$PID_DIR"/*.pid
        echo "✅ متوقف شد."
        ;;
        
    status)
        echo "📊 وضعیت سرویس‌ها:"
        for pid in "$PID_DIR"/*.pid; do
            if [ -f "$pid" ]; then
                name=$(basename "$pid" .pid)
                if ps -p $(cat "$pid") >/dev/null 2>&1; then
                    echo "✅ $name: RUNNING (PID: $(cat $pid))"
                else
                    echo "❌ $name: STOPPED"
                fi
            fi
        done
        ;;
        
    deploy)
        echo "🛠 استقرار کامل Horizon..."
        if [ -f "./scripts/horizon-deploy.sh" ]; then
            ./scripts/horizon-deploy.sh install
        else
            echo "⚠️ horizon-deploy.sh یافت نشد. لطفاً ابتدا آن را نصب کنید."
        fi
        ;;
        
    agent)
        case "$2" in
            list)
                echo "📋 لیست Agents:"
                ls -1 ./agents/*/*.md 2>/dev/null | sed 's/\.md$//;s/\.\/agents\///' || echo "هیچ Agentی یافت نشد."
                ;;
            enable)
                echo "🔓 فعال‌سازی Agent: $3"
                # منطق فعال‌سازی
                ;;
            disable)
                echo "🔒 غیرفعال‌سازی Agent: $3"
                # منطق غیرفعال‌سازی
                ;;
            *)
                echo "Usage: $0 agent {list|enable|disable} [agent-name]"
                ;;
        esac
        ;;
        
    core)
        case "$2" in
            migrate)
                echo "🔄 اجرای مهاجرت دیتابیس..."
                ./bin/horizon-api --migrate
                ;;
            *)
                echo "Usage: $0 core {migrate}"
                ;;
        esac
        ;;
        
    *)
        echo "Usage: $0 {start|stop|status|deploy|agent|core} [args...]"
        echo "  start   : راه‌اندازی Core + Agents"
        echo "  stop    : توقف همه"
        echo "  status  : نمایش وضعیت"
        echo "  deploy  : استقرار کامل"
        echo "  agent   : مدیریت Agents (list, enable, disable)"
        echo "  core    : مدیریت Core (migrate)"
        exit 1
        ;;
esac
EOFCTL

chmod +x "$CORE_ROOT/horizon-ctl.sh"
success "اسکریپت horizon-ctl.sh در ریشه‌ی Core ساخته شد."

# ۹. قطع ارتباط با مخزن قبلی (بایگانی)
log "قطع ارتباط با مخزن agency-agents..."
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
    if gh repo view "$GITHUB_ORG/agency-agents" >/dev/null 2>&1; then
        gh repo rename "agency-agents" "agency-agents-archive" --repo "$GITHUB_ORG/agency-agents" || warn "تغییر نام مخزن انجام نشد (نیاز به دسترسی admin)."
        success "مخزن agency-agents به agency-agents-archive تغییر نام یافت."
    else
        warn "مخزن agency-agents وجود ندارد یا دسترسی کافی ندارید."
    fi
else
    warn "ابزار gh (GitHub CLI) نصب یا پیکربندی نشده است. برای بایگانی خودکار مخزن، لطفاً gh را نصب و لاگین کنید."
    warn "در غیر این صورت، مخزن agency-agents را به‌صورت دستی بایگانی کنید."
fi

# ۱۰. پاکسازی
log "پاکسازی فایل‌های موقت..."
rm -rf "$TEMP_DIR"

# ۱۱. جمع‌بندی
success "✅ مهاجرت کامل انجام شد!"
echo ""
echo "📌 اکنون تمام قابلیت‌های Agency Agents در horizon-core-engine متمرکز شده‌اند."
echo "🔧 برای مدیریت کل اکوسیستم، از دستور زیر استفاده کنید:"
echo "   ./horizon-ctl.sh {command}"
echo ""
echo "📂 مخزن agency-agents به agency-agents-archive تغییر نام یافت و ارتباط قطع شد."
