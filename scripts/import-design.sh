#!/usr/bin/env bash
# Turn a Claude Design "Project" export (zip) into the playable web build in web/.
#   scripts/import-design.sh path/to/export.zip
# Keeps: our latest engine (dist/), all paintings (assets/bg), local React/Babel/fonts (web/vendor),
# icons + manifest; re-injects the PWA head and regenerates the offline cache list (web/sw.js).
set -euo pipefail
ZIP="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
unzip -q "$ZIP" -d "$TMP"
SRC="$(dirname "$(find "$TMP" -name 'Love Sim Game.dc.html' | head -1)")"
[ -d "$SRC" ] || { echo "Love Sim Game.dc.html not found in $ZIP"; exit 1; }

cp "$SRC/Love Sim Game.dc.html" "$ROOT/web/index.html"
cp "$SRC/support.js" "$SRC/charsys.js" "$SRC/props.js" "$ROOT/web/"
cp "$SRC/uploads/logo-ko.png" "$SRC/uploads/logo-en.png" "$ROOT/web/uploads/"
cp "$ROOT/dist/lovesim-engine.js" "$ROOT/web/uploads/lovesim-engine.js"
mkdir -p "$ROOT/web/bg" && cp "$ROOT"/assets/bg/*.png "$ROOT/web/bg/"

# Everything local (works offline, no CDN).
sed -i 's|https://unpkg.com/react@18.3.1/umd/react.production.min.js|vendor/react.production.min.js|; s|https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js|vendor/react-dom.production.min.js|; s|https://unpkg.com/@babel/standalone@7.29.0/babel.min.js|vendor/babel.min.js|' "$ROOT/web/support.js"
sed -i 's|https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css|vendor/fonts/galmuri.css|' "$ROOT/web/index.html"

python3 - "$ROOT/web/index.html" <<'EOF'
import sys
p = sys.argv[1]
s = open(p).read()
head = open(p.replace("index.html", "head.html")).read().strip()
old = '<meta name="viewport" content="width=device-width, initial-scale=1">'
assert old in s, "viewport meta not found"
open(p, "w").write(s.replace(old, head, 1))
EOF
node "$ROOT/web/build-sw.mjs"
rm -rf "$TMP"
echo "web/ updated from $ZIP"
