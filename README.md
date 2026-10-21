# project-story-video

プロジェクトの概要・進捗・これまでの経緯を、時間の順に追える解説動画にするClaude Codeのスキルです。台本をJSONで書くと、Remotionのひな形が場面を組み立てます。場面には、数字のカウントアップ、伸びる棒グラフ、判断の候補と採用の印、成果物の年表などの動きが付きます。読み上げは手元で動かすVOICEVOX ENGINEで作り、BGMはプログラムで合成します。

A Claude Code skill that turns a project's history and progress into a narrated explainer video (Remotion + local VOICEVOX + synthesized BGM). Japanese only.

## 中身

```
skills/project-story-video/
  SKILL.md                 スキル本体（守ること、手順、完了条件、落とし穴）
  references/              台本の書き方、経緯の調べ方、音声と書き出し、ファクトチェックの項目
  template/                Remotion のひな形（見本の台本は架空のプロジェクト）
    src/                   場面の部品（表紙・章・箇条・数字・棒・流れ・判断・年表）
    scripts/               台本の点検、音声の生成、BGM の合成、書き出し、VOICEVOX の準備
    tests/                 台本の点検と読み替えのテスト（pytest）
```

## 入れ方

```bash
git clone https://github.com/shiyow5/project-story-video.git ~/project-story-video
ln -s ~/project-story-video/skills/project-story-video ~/.claude/skills/project-story-video
```

## ひな形だけを試す

Node.js 20以上、Python 3.10以上、numpy、ffmpegが必要です。

```bash
cp -r ~/project-story-video/skills/project-story-video/template my-video && cd my-video
npm i
python3 scripts/check_script.py scripts/narration.json     # 台本の点検
bash scripts/setup_voicevox.sh install                     # 初回だけ
bash scripts/setup_voicevox.sh start &                     # 127.0.0.1 だけで待ち受ける
python3 scripts/gen_voice.py scripts/narration.json src/voice-manifest.json voice
python3 scripts/make_bgm.py public/bgm.wav 140
bash scripts/render.sh ProjectStory out/sample.mp4
bash scripts/setup_voicevox.sh stop
```

見本は約2分10秒の動画になります。

## 台本の点検でわかること

`check_script.py`は、音声を作る前に次の点を確かめます。

- その場面の時点（`asof`）より後の年月が出ていないか（未来の情報を先に出さない）
- 場面の時点が前に戻っていないか
- キャラクターの口調（「〜のだ」）になっていないか
- 判断の場面に、問い・理由・決めた主体・採用した候補があるか
- 読み方の分からない英字や、分数に読まれる日付（「10/24」）がないか
- 伏せる語（`--banned`で渡すファイル）が出ていないか
- 項目の数や字幕の長さが画面に収まるか、数字のある場面に出典があるか

## ライセンス

このリポジトリで書いたコードと文書は [MIT](LICENSE)です。Remotion、VOICEVOX ENGINE、音声ライブラリ「ずんだもん」、フォントなどの依存物は、それぞれのライセンスと利用規約に従います。特に注意が要るのは2点で、Remotionは従業員4人以上の営利組織では会社ライセンスが必要になり、ずんだもんの声を使った動画には「VOICEVOX:ずんだもん」のクレジットが必要です。詳しくは [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)を読んでください。
