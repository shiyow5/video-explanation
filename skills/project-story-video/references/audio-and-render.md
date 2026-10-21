# 音声と書き出し

## 読み上げ（VOICEVOX ENGINE）

```bash
bash scripts/setup_voicevox.sh install      # 初回だけ。GitHub の公式リリースから CPU 版を取得
bash scripts/setup_voicevox.sh start        # 127.0.0.1:50021 で待ち受ける（バックグラウンドで実行）
python3 scripts/gen_voice.py --dry scripts/narration.json          # 読みだけ確かめる
python3 scripts/gen_voice.py scripts/narration.json src/voice-manifest.json voice
bash scripts/setup_voicevox.sh stop
```

`gen_voice.py`の動きは次のとおり。

- 接続先が127.0.0.1 / localhost以外なら止まる（台本を外部に送らないため）。
- 文ごとに`public/<フォルダ>/<場面id>_<番号>.wav`を作り、平均-18dBに一律で増幅する（ピークは-1dBまで）。
- 読みが前回と同じ文は作り直さない（`_cache.json`）。長編で台本を少し直したときに速い。
- 文の秒数を音声の一覧（manifest）に書く。場面の長さと各文の出るタイミングは、この秒数から決まる。

読み替え表`scripts/readings.json`は`[元の語, 読み]`の並び。長い語から順に当てるので、並べる順は気にしなくてよい。プロジェクト固有の語（製品名など）は、そのプロジェクトのreadings.jsonに足す。

## BGM

`python3 scripts/make_bgm.py public/bgm.wav <秒数>`で、外部の素材を使わずに合成する（116 BPM、C-G-Am-F）。秒数は動画より少し長くする。音量は`stories.ts`の`bgmVolume`（0.14で声が聞き取りやすかった）。

## 書き出し

```bash
bash scripts/render.sh ProjectStory out/short.mp4          # 短編
bash scripts/render.sh ProjectStoryLong out/long.mp4 4     # 長編（4分割）
```

`render.sh`は総フレーム数を読み、指定の数に分けて書き出し、ffmpegでつないでから`finalize_audio.sh`で音量をそろえる（コンプレッサーと2回測るloudnormで-16 LUFS、TP -1.5dB）。最後に表示される`I:`が-16.0 LUFS前後なら正常。分割のつなぎ目の前後で音量を測り、途切れていないことも確かめる。

かかる時間の目安は、手元のCPUで短編（約3分）が数分、長編（約45分）が1時間以上。

## 見た目の確かめ方

```bash
npx tsc --noEmit
npx remotion still ProjectStory out/check_0100.png --frame=100
```

場面ごとに、項目が出そろったあとのフレームを1枚ずつ出して見る。見ること: 見出しと内容の重なり、数字のはみ出し、字幕の折り返し、まだ来ていない段階の名前が伏せてあるか、出典と担当者の表示。
