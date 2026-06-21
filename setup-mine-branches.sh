#!/bin/bash
# change-to-mine.sh
for repo in horizon-core-engine Beaconchain.us hub; do
  if [ -d "$repo" ]; then
    cd "$repo"
    git checkout -b mine
    git add .
    git commit -m "chore: establish 'mine' branch as the unified development hub for all repositories"
    git push -u origin mine
    cd ..
  else
    echo "Repository $repo not found, skipping..."
  fi
done
