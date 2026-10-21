#!/usr/bin/env bash
# 書き出した動画の音声を、解説動画の標準の音量（-16 LUFS）にそろえる。映像はそのまま写す。
# VOICEVOX の声は小さく、そのままだと平均 -26dB 前後で聞こえにくかったため（2026-10-21）。
# 使い方: bash scripts/finalize_audio.sh <remotion で書き出した mp4> <出力 mp4>
set -euo pipefail
IN="$1"
OUT="$2"
PRE="acompressor=threshold=-26dB:ratio=3:attack=5:release=120:makeup=2"

# 1回目: 音量を測る
MEASURED=$(ffmpeg -hide_banner -i "$IN" -vn -af "$PRE,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null /dev/null 2>&1 \
  | sed -n '/^{/,/^}/p' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")

# 2回目: 測った値で一律に合わせる
ffmpeg -hide_banner -loglevel error -y -i "$IN" -c:v copy \
  -af "$PRE,loudnorm=I=-16:TP=-1.5:LRA=11:$MEASURED:linear=true" \
  -ar 48000 -c:a aac -b:a 192k "$OUT"

ffmpeg -hide_banner -i "$OUT" -vn -af ebur128 -f null /dev/null 2>&1 | grep -A3 Summary | grep 'I:'
