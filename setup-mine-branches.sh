#!/bin/bash
# ================================================================
# setup-mine-branches.sh
# Unified branch setup for all Horizon repositories
# ================================================================
# Created by : Mahdi Amolimoghaddam
# Purpose    : Automate creation of 'mine' branch across all repos
# Usage      : bash setup-mine-branches.sh
# ================================================================

set -e  # exit on error

# رنگ‌ها برای خروجی زیبا
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting unified branch setup for Horizon repositories...${NC}"

# لیست مخزن‌ها (می‌توانی اضافه یا کم کنی)
REPOS=(
    "horizon-core-engine"
    "Beaconchain.us"
    "hub"
)

for repo in "${REPOS[@]}"; do
    if [ -d "$repo" ]; then
        echo -e "${YELLOW}📁 Entering repository: $repo${NC}"
        cd "$repo"

        # بررسی وجود شاخه‌ی mine
        if git show-ref --verify --quiet refs/heads/mine; then
            echo -e "${YELLOW}⚠️  Branch 'mine' already exists in $repo. Switching to it...${NC}"
            git checkout mine
        else
            echo -e "${GREEN}✅ Creating 'mine' branch in $repo...${NC}"
            git checkout -b mine
        fi

        # افزودن همه‌ی تغییرات (در صورت وجود)
        git add .

        # کامیت با پیام استاندارد (فقط در صورت وجود تغییر)
        if ! git diff --staged --quiet; then
            git commit -m "chore: establish 'mine' branch as the unified development hub for all repositories

This branch serves as the single source of truth and the primary working branch across all Horizon-related projects. All future development, features, and hotfixes will be first merged into 'mine' before being promoted to 'main' for production releases.

Why 'mine'?
- Clearly identifies the branch as the personal/team development workspace.
- Avoids confusion with generic names like 'dev' or 'develop'.
- Allows for quick identification of the active integration branch.

For more details, see: https://github.com/beaconchain-horizon/horizon-core-engine/wiki

Signed-off-by: Mahdi Amolimoghaddam <beaconchain@beaconchain.us>"
        else
            echo -e "${YELLOW}ℹ️  No changes to commit in $repo.${NC}"
        fi

        # پوش به گیت‌هاب
        echo -e "${GREEN}⬆️  Pushing 'mine' branch to remote...${NC}"
        git push -u origin mine

        cd ..
        echo -e "${GREEN}✅ Done with $repo.${NC}"
        echo ""
    else
        echo -e "${RED}❌ Repository $repo not found, skipping...${NC}"
    fi
done

echo -e "${GREEN}🎉 All repositories processed successfully!${NC}"
echo -e "${YELLOW}📌 Next step: Set 'mine' as the default branch on GitHub for each repo.${NC}"
echo -e "${YELLOW}   Go to Settings → Branches → Default branch → change to 'mine'.${NC}"
