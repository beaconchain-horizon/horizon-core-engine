# 1. Rename local branch from main to mine
git branch -m main mine

# 2. Fetch latest updates from remote
git fetch origin

# 3. Set the mine branch to track origin/mine
git branch -u origin/mine mine

# 4. Set remote HEAD to point to the mine branch
git remote set-head origin -a
