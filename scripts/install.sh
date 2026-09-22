#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_NAME="hide-albums.js"
BOOTSTRAP_NAME="hide-albums-bootstrap.js"
POST_SNAPSHOT_NAME="hide-albums-post-snapshot.js"
SRC="$ROOT/dist/$EXT_NAME"
BOOTSTRAP_SRC="$ROOT/dist/$BOOTSTRAP_NAME"
POST_SNAPSHOT_SRC="$ROOT/dist/$POST_SNAPSHOT_NAME"
DEST="${HOME}/.config/spicetify/Extensions/$EXT_NAME"
BOOTSTRAP_DEST="${HOME}/.config/spicetify/Extensions/$BOOTSTRAP_NAME"
POST_SNAPSHOT_DEST="${HOME}/.config/spicetify/Extensions/$POST_SNAPSHOT_NAME"
XPUI_INDEX="/Applications/Spotify.app/Contents/Resources/Apps/xpui/index.html"
XPUI_EXT_DIR="/Applications/Spotify.app/Contents/Resources/Apps/xpui/extensions"
BOOTSTRAP_TAG="extensions/hide-albums-bootstrap.js"
POST_SNAPSHOT_TAG="extensions/hide-albums-post-snapshot.js"
MODULES_TAG='<script defer="defer" src="/xpui-modules.js"></script>'
BOOTSTRAP_SCRIPT="<script defer src='${BOOTSTRAP_TAG}'></script>"
SNAPSHOT_TAG='defer="defer" src="/xpui-snapshot.js"'

for f in "$SRC" "$BOOTSTRAP_SRC" "$POST_SNAPSHOT_SRC"; do
  if [[ ! -f "$f" ]]; then
    echo "missing build output: $f (run npm run build)" >&2
    exit 1
  fi
done

mkdir -p "${HOME}/.config/spicetify/Extensions"
cp "$SRC" "$DEST"
cp "$BOOTSTRAP_SRC" "$BOOTSTRAP_DEST"
cp "$POST_SNAPSHOT_SRC" "$POST_SNAPSHOT_DEST"
rm -f "${HOME}/.config/spicetify/Extensions/spotify-customization.js" \
  "${HOME}/.config/spicetify/Extensions/hidden-albums.js" \
  "${HOME}/.config/spicetify/Extensions/hidden-albums-bootstrap.js" \
  "${HOME}/.config/spicetify/Extensions/hidden-albums-post-snapshot.js"

if command -v spicetify >/dev/null 2>&1 || [[ -x "${HOME}/.spicetify/spicetify" ]]; then
  SPICETIFY_BIN="$(command -v spicetify 2>/dev/null || true)"
  if [[ -z "$SPICETIFY_BIN" ]]; then
    SPICETIFY_BIN="${HOME}/.spicetify/spicetify"
  fi
  "$SPICETIFY_BIN" config extensions spotify-customization.js- 2>/dev/null || true
  "$SPICETIFY_BIN" config extensions hidden-albums.js- 2>/dev/null || true
  "$SPICETIFY_BIN" config extensions "$EXT_NAME" 2>/dev/null || true
  "$SPICETIFY_BIN" apply
else
  echo "spicetify not on PATH; copied to $DEST" >&2
fi

if [[ -f "$XPUI_INDEX" ]]; then
  mkdir -p "$XPUI_EXT_DIR"
  cp "$BOOTSTRAP_SRC" "$XPUI_EXT_DIR/$BOOTSTRAP_NAME"
  cp "$POST_SNAPSHOT_SRC" "$XPUI_EXT_DIR/$POST_SNAPSHOT_NAME"
  rm -f "$XPUI_EXT_DIR/spotify-customization.js" \
    "$XPUI_EXT_DIR/hidden-albums.js" \
    "$XPUI_EXT_DIR/hidden-albums-bootstrap.js" \
    "$XPUI_EXT_DIR/hidden-albums-post-snapshot.js"
  perl -i -0pe "s|<script src='extensions/hidden-albums-bootstrap.js'></script>||g" "$XPUI_INDEX"
  perl -i -0pe "s|<script defer src='extensions/hidden-albums-bootstrap.js'></script>||g" "$XPUI_INDEX"
  perl -i -0pe "s|<script src='extensions/hide-albums-bootstrap.js'></script>||g" "$XPUI_INDEX"
  perl -i -0pe "s|<script defer src='extensions/hide-albums-bootstrap.js'></script>||g" "$XPUI_INDEX"
  if ! grep -q "hide-albums-bootstrap.js'></script>${MODULES_TAG}" "$XPUI_INDEX"; then
    perl -i -pe "s|\Q${MODULES_TAG}\E|${BOOTSTRAP_SCRIPT}${MODULES_TAG}|" "$XPUI_INDEX"
    echo "injected bootstrap before xpui-modules in $XPUI_INDEX"
  fi
  if ! grep -q "$POST_SNAPSHOT_TAG" "$XPUI_INDEX"; then
    perl -i -pe "s|<script ${SNAPSHOT_TAG}></script>|<script ${SNAPSHOT_TAG}></script><script defer src='${POST_SNAPSHOT_TAG}'></script>|" "$XPUI_INDEX"
    echo "injected post-snapshot after xpui-snapshot in $XPUI_INDEX"
  fi
else
  echo "xpui index not found: $XPUI_INDEX" >&2
fi

echo "installed $DEST"
echo "installed $BOOTSTRAP_DEST"
echo "installed $POST_SNAPSHOT_DEST"
