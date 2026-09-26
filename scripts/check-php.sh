#!/usr/bin/env bash
#
# Syntax-checks every file in api/ before you upload it.
#
# Worth having because of how this deployment fails. The PHP runs on go54 with
# display_errors off, so a parse error anywhere in api/ produces an empty HTTP
# 500 with no message — in the browser, in curl, and in the Next.js logs. The
# only clue is cPanel's error log. A check that takes ten seconds here saves
# that hunt.
#
# Uses whichever is available: a local php, then podman, then docker. The
# container route needs its machine running:
#
#   podman machine start
#
# Usage: npm run check:php
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d api ]; then
  echo "No api/ directory here." >&2
  exit 1
fi

# PHP 8.1 is the floor the front controller enforces, so check against it
# rather than against whatever happens to be installed.
IMAGE=php:8.1-cli

lint_with_local_php() {
  find api -name '*.php' -print0 | xargs -0 -n1 php -l
}

lint_in_container() {
  "$1" run --rm -v "$PWD/api":/api:ro "$2" \
    sh -c 'find /api -name "*.php" -print0 | xargs -0 -n1 php -l'
}

if command -v php >/dev/null 2>&1; then
  echo "Checking api/ with local php $(php -r 'echo PHP_VERSION;')"
  lint_with_local_php
elif command -v podman >/dev/null 2>&1; then
  echo "Checking api/ in podman ($IMAGE)"
  lint_in_container podman "docker.io/library/$IMAGE"
elif command -v docker >/dev/null 2>&1; then
  echo "Checking api/ in docker ($IMAGE)"
  lint_in_container docker "$IMAGE"
else
  echo "Need php, podman or docker to check api/." >&2
  exit 1
fi

echo
echo "api/ parses cleanly. Remember that a clean parse is not a working"
echo "deployment — upload every file, including lib/ and routes/."
