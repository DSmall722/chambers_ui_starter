
Chambers Dev Scripts
====================
Drop the 'scripts' folder and Makefile into your project root.

Usage:
  ./scripts/dev.sh run-backend
  ./scripts/dev.sh run-frontend
  ./scripts/dev.sh apply-mbox ~/Downloads/some_patch.mbox
  ./scripts/dev.sh apply-zip ~/Downloads/unzipped_patch_dir
  ./scripts/dev.sh branch <name>
  ./scripts/dev.sh pr "Title" "Body"
  ./scripts/dev.sh tag "Feature: notes"
  ./scripts/dev.sh changelog "- 2025-08-12: Feature shipped"

Tip: make dev.sh executable:
  chmod +x ./scripts/dev.sh
