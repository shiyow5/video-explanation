# video-explanation

プロジェクトの概要・進捗・これまでの経緯を、時間の順に追える解説動画にするClaude Codeのスキルです。台本をJSONで書くと、Remotionのひな形が場面を組み立てます。場面には、フロー図、割合の円、前後の比較、期間の帯、判断の候補と採用の印、成果物の年表、線を描くように現れるアイコンなどの動きが付きます。読み上げは手元で動かすVOICEVOX ENGINEで作り、BGMはプログラムで合成します。

A Claude Code skill that turns a project's history and progress into a narrated explainer video with animated infographics, flow diagrams and icons (Remotion + local VOICEVOX + synthesized BGM). Japanese only.

## 中身

```
skills/video-explanation/
  SKILL.md                 スキル本体（守ること、手順、完了条件、落とし穴）
  references/              台本の書き方、図とアイコン、専用の場面の作り方、経緯の調べ方、音声と書き出し、ファクトチェックの項目
  template/                Remotion のひな形（見本の台本は架空のプロジェクト）
    src/                   場面の部品（13種類）、アイコン、専用の場面（custom/）
    scripts/               台本の点検、アイコン探し、音声の生成、BGM の合成、動きの確認、書き出し、VOICEVOX の準備
    tests/                 点検・読み替え・動きの確認のテスト（pytest）
```

## 入れ方

```bash
git clone https://github.com/shiyow5/video-explanation.git ~/video-explanation
ln -s ~/video-explanation/skills/video-explanation ~/.claude/skills/video-explanation
```

## ひな形だけを試す

Node.js 20以上、Python 3.10以上、numpy、Pillow、ffmpegが必要です。

```bash
cp -r ~/video-explanation/skills/video-explanation/template my-video && cd my-video
npm i
python3 scripts/check_script.py scripts/narration.json     # 台本の点検
python3 scripts/find_icon.py データ --sheet out/icons.png    # アイコンの候補を探して並べる
bash scripts/setup_voicevox.sh install                     # 初回だけ
bash scripts/setup_voicevox.sh start &                     # 127.0.0.1 だけで待ち受ける
python3 scripts/gen_voice.py scripts/narration.json src/voice-manifest.json voice
python3 scripts/make_bgm.py public/bgm.wav 220
python3 scripts/motion_check.py ProjectStory src/voice-manifest.json out/check   # 全場面の動きを確かめる
bash scripts/render.sh ProjectStory out/sample.mp4
bash scripts/setup_voicevox.sh stop
```

見本は15場面、約3分14秒の動画になります。

## 場面の種類

| 見せたいこと | kind |
|---|---|
| 表紙・章の扉 | cover, chapter |
| 箇条・大きな数字・棒グラフ | bullets, stats, bars |
| 処理の流れ・フロー図・構成図 | flow, diagram |
| 割合・前後の比較・期間 | ratio, compare, timeline |
| 人・道具・概念の紹介（アイコン） | icons |
| 判断・成果物の年表 | decision, docs |
| その案件だけの図 | custom:<名前>（`src/custom/`に作る） |

アイコンはLucideの約1,900種から名前で選べます。合うものが無いときは、`src/custom-icons.tsx`に線で描いて足せます。どのアイコンにも、線を描く・ふわっと出る・脈打つ・回る・弾むのいずれかの動きを付けられます。

## 台本の点検でわかること

`check_script.py`は、音声を作る前に次の点を確かめます。

- その場面の時点（`asof`）より後の年月や期間の帯が出ていないか（未来の情報を先に出さない）
- キャラクターの口調（「〜のだ」）や、顔・生き物に見えるアイコンが無いか
- 判断の場面に、問い・理由・決めた主体・採用した候補があるか
- アイコンの名前と専用の場面が実在するか、図のつなぎ先が正しいか
- 読み方の分からない英字や、分数に読まれる日付（「10/24」）が無いか、伏せる語が出ていないか
- 項目の数や字幕の長さが画面に収まるか、数字のある場面に出典があるか

## ライセンス

このリポジトリで書いたコードと文書は [MIT](LICENSE)です。Remotion、VOICEVOX ENGINE、音声ライブラリ「ずんだもん」、Lucide、フォントなどの依存物は、それぞれのライセンスと利用規約に従います。特に注意が要るのは2点で、Remotionは従業員4人以上の営利組織では会社ライセンスが必要になり、ずんだもんの声を使った動画には「VOICEVOX:ずんだもん」のクレジットが必要です。詳しくは [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)を読んでください。
