# 依存ソフトのライセンスと利用条件

このリポジトリには、下のソフト・音声・フォントの本体は含まれていません。`npm i`やスクリプトで各自の環境に入れて使います。それぞれ、ここに書いた要点ではなく、リンク先の原文に従ってください（2026年10月21日に確認）。

## 特に注意が要るもの

### Remotion（動画の組み立てと書き出し）

独自のライセンスです（オープンソースのライセンスではありません）。

- 無料で使えるのは、個人、従業員3人以下の営利組織、非営利組織、商用利用の前に評価する人です。この範囲なら、商用の動画を作ることもできます。
- 従業員4人以上の営利組織で使うには、会社ライセンスが必要です。
- Remotionのコードを複製・改変して、派生物として販売・貸与・再許諾することは禁止されています。

対象: remotion, @remotion/cli, @remotion/google-fonts（4.0.537、npmのlicense欄は"SEE LICENSE IN LICENSE.md"）。@remotion/media 4.0.537はnpmのpackage.jsonにlicense欄が無く、同じリポジトリのLICENSE.mdに従うと推定しています（確定していません）。

- https://github.com/remotion-dev/remotion/blob/v4.0.537/LICENSE.md
- https://www.remotion.pro/license

### VOICEVOX ENGINE（読み上げ音声の合成）

LGPL-3.0と、別の許諾（作者に求めて得るもの）のデュアルライセンスです。このリポジトリには同梱していません。`template/scripts/setup_voicevox.sh`がGitHubの公式リリースから取得します。

ソフトの利用規約の要点は次のとおりです。商用・非商用とも使えます。VOICEVOXを使ったことが分かるクレジットが必要です。作った音声は、各音声ライブラリの規約に従います。

- https://github.com/VOICEVOX/voicevox_engine/blob/0.25.2/LICENSE
- https://voicevox.hiroshiba.jp/term/

### 音声ライブラリ「ずんだもん」（VOICEVOX）

独自の利用規約です。

- 商用・非商用とも使えます。
- クレジットの表記が必要です。表記は「VOICEVOX:ずんだもん」で、動画なら動画の中か説明欄など、見る人が気づける場所に書きます。ひな形では最後の場面のクレジットに入れてあります。
- 禁止されている使い方があります。公序良俗に反する利用、政治・宗教活動や特定の個人・団体への批判・応援、虚偽や誤解を招く内容の作成と拡散などです。詳しくは原文を読んでください。
- 規約の対象は音声です。キャラクターの絵を使う場合は、別にキャラクターのガイドラインに従います（このスキルでは絵を使いません）。

- https://zunko.jp/con_ongen_kiyaku.html
- https://zunko.jp/guideline.html

## そのほかの依存

| ソフト | 用途 | ライセンス | 一次情報 |
|---|---|---|---|
| React / react-dom 19 | 画面の部品 | MIT | https://github.com/facebook/react/blob/main/LICENSE |
| M PLUS Rounded 1c | 字幕と見出しのフォント（@remotion/google-fontsで読み込む） | SIL Open Font License（Copyright 2016 The Rounded M+ Project Authors） | https://github.com/google/fonts/blob/main/ofl/mplusrounded1c/METADATA.pb |
| numpy | 音声の音量の調整、BGMの合成 | BSD-3-Clause | https://github.com/numpy/numpy/blob/main/LICENSE.txt |
| FFmpeg | 動画の結合と音量の調整（各自の環境のものを呼ぶだけで、同梱しない） | 多くはLGPL-2.1以降。ビルドの設定によってGPL | https://github.com/FFmpeg/FFmpeg/blob/master/LICENSE.md |
| TypeScript | 型の検査（開発用） | Apache-2.0 | https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt |
| ESLint | 静的検査（開発用） | MIT | https://github.com/eslint/eslint/blob/main/LICENSE |
| @remotion/eslint-config-flat | ESLintの設定（開発用） | ISC（npmのlicense欄） | https://www.npmjs.com/package/@remotion/eslint-config-flat |
| Prettier | 整形（開発用） | MIT | https://github.com/prettier/prettier/blob/main/LICENSE |
| pytest | テスト（開発用） | MIT | https://github.com/pytest-dev/pytest/blob/main/LICENSE |

## このリポジトリで作ったもの

- BGMは`template/scripts/make_bgm.py`がプログラムで合成します。外部の音源や素材は使っていません。
- 表紙の資料の絵などの図形は、コードで描いています。画像ファイルは使っていません。
- これらと、スキルの文書・コード・テストは、[LICENSE](LICENSE)（MIT）で公開しています。MIT が及ぶのはこのリポジトリで書いたファイルだけで、上の依存物には及びません。
