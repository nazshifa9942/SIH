#!/usr/bin/env bash
#
# Commit this folder and push it to a branch on your team's GitHub repo.
#
# This has to be run on YOUR machine (or CI) with your own GitHub
# credentials/SSH key — this project was built in a sandbox with no
# access to your repo or credentials, so it can't push for you.
#
# Usage:
#   ./push_to_github.sh <repo-url> <branch-name> ["commit message"]
#
# Example:
#   ./push_to_github.sh git@github.com:your-team/freight-forecasting.git \
#       feature/freight-rate-model "Add freight rate forecasting model"

set -euo pipefail

REPO_URL="${1:?Usage: ./push_to_github.sh <repo-url> <branch-name> [\"commit message\"]}"
BRANCH_NAME="${2:?Usage: ./push_to_github.sh <repo-url> <branch-name> [\"commit message\"]}"
COMMIT_MSG="${3:-Add freight rate forecasting model}"

cd "$(dirname "$0")"

if [ ! -d .git ]; then
  git init
fi

git add -A
git commit -m "$COMMIT_MSG" || echo "Nothing new to commit."

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git checkout -B "$BRANCH_NAME"
git push -u origin "$BRANCH_NAME"

echo "Pushed to $REPO_URL on branch $BRANCH_NAME"
