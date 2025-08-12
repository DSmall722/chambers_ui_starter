
#!/usr/bin/env bash
# Developer helper for Chambers UI
set -euo pipefail
PROJ="/Users/andrewbowers/Downloads/chambers_ui_starter"

usage() {
  cat <<EOF
Chambers Dev Helper
Usage: $0 <command> [args]

Commands:
  run-backend           Start backend (API)
  run-frontend          Start frontend (Vite site)
  stop                  (Ctrl+C in each window to stop)
  apply-mbox <file>     Apply a PR-style .mbox patch on a new branch
  apply-zip <dir>       Run a zip patcher's apply_patch.sh in <dir>
  branch <name>         Create and switch to feature/<name>
  pr <title> <body>     Open a PR from current branch to main (requires gh)
  tag <title>           Create and push a dated tag with <title>
  changelog <line>      Append a line to CHANGELOG.md and commit

Examples:
  $0 apply-mbox ~/Downloads/feature_x.mbox
  $0 branch ux-buttons
  $0 pr "UX: buttons" "Bigger, clearer buttons"
  $0 tag "UX: buttons"
  $0 changelog "- UX buttons: larger primary actions"
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  run-backend)
    bash "$PROJ/scripts/mac_backend.sh"
    ;;
  run-frontend)
    bash "$PROJ/scripts/mac_frontend.sh"
    ;;
  apply-mbox)
    file="${1:-}"; [[ -f "$file" ]] || { echo "mbox file missing"; exit 1; }
    cd "$PROJ"
    git checkout main && git pull
    b="feature/$(date +%Y%m%d-%H%M)-$(basename "$file" | sed 's/\..*//')"
    git checkout -b "$b"
    git am "$file"
    git push -u origin "$b"
    echo "Branch pushed: $b"
    ;;
  apply-zip)
    dir="${1:-}"; [[ -d "$dir" ]] || { echo "dir missing"; exit 1; }
    bash "$dir/apply_patch.sh"
    ;;
  branch)
    name="${1:-}"; [[ -n "$name" ]] || { echo "name required"; exit 1; }
    cd "$PROJ"; git checkout main && git pull; git checkout -b "feature/$name";;
  pr)
    title="${1:-}"; body="${2:-}"
    [[ -n "$title" ]] || { echo "title required"; exit 1; }
    cd "$PROJ"
    if command -v gh >/dev/null 2>&1; then
      gh pr create -t "$title" -b "$body" -B main -H "$(git rev-parse --abbrev-ref HEAD)"
    else
      echo "Install GitHub CLI (gh) to open PRs from terminal."
    fi
    ;;
  tag)
    title="${1:-Release}"
    cd "$PROJ"
    TAG="v$(date -u +%Y%m%d-%H%M)"
    git tag -a "$TAG" -m "$title"
    git push origin "$TAG"
    echo "Tagged $TAG"
    ;;
  changelog)
    line="${1:-}"; [[ -n "$line" ]] || { echo "line required"; exit 1; }
    cd "$PROJ"
    echo "$line" >> CHANGELOG.md
    git add CHANGELOG.md
    git commit -m "chore: update changelog"
    git push
    ;;
  *)
    usage; exit 1;;
esac
