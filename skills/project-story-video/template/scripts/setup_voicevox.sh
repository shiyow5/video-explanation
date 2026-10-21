#!/usr/bin/env bash
# VOICEVOX ENGINE（CPU 版）を GitHub の公式リリースから取ってきて、手元だけで起動する。
# 台本を外部に送らないため、待ち受けは 127.0.0.1 に限る。
# 使い方:
#   bash scripts/setup_voicevox.sh install   # 取得と展開（初回だけ）
#   bash scripts/setup_voicevox.sh start     # 起動（終わるまで戻らない。別の端末かバックグラウンドで）
#   bash scripts/setup_voicevox.sh stop      # 停止
# 利用規約: https://voicevox.hiroshiba.jp/term/ と、各キャラクターの音声ライブラリの規約に従うこと。
set -euo pipefail
VERSION="${VOICEVOX_VERSION:-0.25.2}"
DIR="${VOICEVOX_DIR:-$HOME/.cache/voicevox-engine/$VERSION}"
ASSET="voicevox_engine-linux-cpu-x64-$VERSION.vvpp"
PORT=50021

case "${1:-}" in
  install)
    mkdir -p "$DIR"
    if [ ! -x "$DIR/engine/run" ]; then
      curl -fL -o "$DIR/$ASSET" "https://github.com/VOICEVOX/voicevox_engine/releases/download/$VERSION/$ASSET"
      unzip -q -o "$DIR/$ASSET" -d "$DIR/engine"
      chmod +x "$DIR/engine/run"
      rm -f "$DIR/$ASSET"
    fi
    echo "展開先: $DIR/engine"
    ;;
  start)
    exec "$DIR/engine/run" --host 127.0.0.1 --port "$PORT"
    ;;
  stop)
    # pkill -f は呼び出した自分のシェルまで止めることがあるので、待ち受けている pid だけを止める
    PID=$(ss -ltnp 2>/dev/null | awk -v p=":$PORT" '$4 ~ p' | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)
    if [ -n "$PID" ]; then kill "$PID" && echo "停止しました（pid $PID）"; else echo "起動していません"; fi
    ;;
  *)
    echo "使い方: bash $0 install|start|stop" >&2
    exit 1
    ;;
esac
