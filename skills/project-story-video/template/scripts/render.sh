#!/usr/bin/env bash
# 動画を書き出し、音声を -16 LUFS にそろえる。
# 長い動画（目安 20 分以上）を一度に書き出すと Node のメモリが足りなくなる
# （JavaScript heap out of memory）ため、フレームを分割して書き出し、ffmpeg でつなぐ。
# 使い方: bash scripts/render.sh <composition の id> <出力 mp4> [分割数（既定 1）]
set -euo pipefail
cd "$(dirname "$0")/.."
ID="$1"
OUT="$2"
PARTS="${3:-1}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=6144}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/story-render.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

# composition の一覧から総フレーム数を読む（列: id fps 大きさ フレーム数）
# （--log=error を付けると一覧そのものが出ないので付けない）
N=$(npx remotion compositions 2>/dev/null | awk -v id="$ID" '$1 == id { print $4 }')
if [ -z "$N" ]; then
  echo "composition $ID が見つかりません" >&2
  exit 1
fi
echo "$ID: $N フレーム、$PARTS 分割"

if [ "$PARTS" -le 1 ]; then
  npx remotion render "$ID" "$WORK/raw.mp4" --codec=h264 --concurrency=4 --log=error
else
  STEP=$(( (N + PARTS - 1) / PARTS ))
  : > "$WORK/parts.txt"
  for (( i = 0; i < PARTS; i++ )); do
    A=$(( i * STEP ))
    B=$(( (i + 1) * STEP - 1 ))
    [ "$B" -ge "$N" ] && B=$(( N - 1 ))
    echo "  分割 $((i + 1))/$PARTS: フレーム $A-$B"
    npx remotion render "$ID" "$WORK/part$i.mp4" --codec=h264 --concurrency=4 --frames="$A-$B" --log=error
    echo "file '$WORK/part$i.mp4'" >> "$WORK/parts.txt"
  done
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORK/parts.txt" -c copy "$WORK/raw.mp4"
fi

bash scripts/finalize_audio.sh "$WORK/raw.mp4" "$OUT"
echo "書き出し完了: $OUT"
