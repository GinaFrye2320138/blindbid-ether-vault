#!/bin/bash

# Script to rewrite git history:
# 1. Change all gpt-engineer-app[bot] commits to use .env credentials
# 2. Remove Co-Authored-By: Claude lines from commit messages

# Load .env file
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

NEW_NAME="$GITHUB_USERNAME"
NEW_EMAIL="$GITHUB_EMAIL"

echo "Rewriting git history..."
echo "New author: $NEW_NAME <$NEW_EMAIL>"
echo ""
echo "WARNING: This will rewrite git history and require force push!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Rewrite history
git filter-branch --env-filter '
OLD_EMAIL_1="159125892+gpt-engineer-app[bot]@users.noreply.github.com"
CORRECT_NAME="'"$NEW_NAME"'"
CORRECT_EMAIL="'"$NEW_EMAIL"'"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL_1" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL_1" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --msg-filter '
sed -e "/^Generated with \[Claude Code\]/d" \
    -e "/^Co-Authored-By: Claude/d" \
    -e "/^$/N;/^\n$/D"
' --tag-name-filter cat -- --branches --tags

echo ""
echo "History rewritten successfully!"
echo ""
echo "To apply changes to GitHub, run:"
echo "git push --force origin main"
