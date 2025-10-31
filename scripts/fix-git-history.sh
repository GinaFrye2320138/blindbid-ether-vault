#!/bin/bash

# Enhanced script to rewrite git history
# 1. Change gpt-engineer-app[bot] to .env credentials
# 2. Remove Claude Co-Authored-By lines

if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

NEW_NAME="$GITHUB_USERNAME"
NEW_EMAIL="$GITHUB_EMAIL"

echo "Rewriting git history with improved filters..."
echo "New author: $NEW_NAME <$NEW_EMAIL>"

export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch -f --env-filter '
OLD_EMAIL="159125892+gpt-engineer-app[bot]@users.noreply.github.com"
CORRECT_NAME="'"$NEW_NAME"'"
CORRECT_EMAIL="'"$NEW_EMAIL"'"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]; then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]; then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --msg-filter '
# Remove all Claude-related lines (including emoji variations)
sed -e "/Generated with \[Claude Code\]/d" \
    -e "/Co-Authored-By: Claude/d" \
    -e "/Generated with Claude Code/d" \
    -e "/.*Generated with Claude Code.*/d" | \
sed -e :a -e "/^\n*$/{$d;N;ba" -e "}"
' --tag-name-filter cat -- --branches --tags

echo "Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "Done! Now force push with:"
echo "git push --force origin main"
