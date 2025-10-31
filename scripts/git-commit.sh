#!/bin/bash

# Git commit and push script using credentials from .env
# Usage: ./scripts/git-commit.sh "Your commit message"

# Load .env file
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

# Configure git user from .env
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"

# Get commit message from argument or prompt
if [ -z "$1" ]; then
  echo "Enter commit message:"
  read COMMIT_MSG
else
  COMMIT_MSG="$1"
fi

# Add all changes
echo "Adding all changes..."
git add -A

# Create commit with Claude Code attribution
git commit -m "$(cat <<EOF
$COMMIT_MSG

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to origin
echo "Pushing to GitHub..."
git push origin main

echo "Done! Changes pushed to GitHub."
