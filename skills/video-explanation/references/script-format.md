# 台本JSONの書き方

台本は`scripts/<名前>.json`に置き、`src/stories.ts`に登録する。見本は`template/scripts/narration.json`（架空のプロジェクト）。

## 全体

| 欄 | 内容 |
|---|---|
| speaker | VOICEVOXの話者番号。ずんだもん（ノーマル）は3 |
| speedScale | 話す速さ。1.1が聞き取りやすかった |
| stages | 上部の進み具合に出す段階の名前。4〜6個 |
| actors | 作成者・決めた主体ごとの色（`dark` `blue` `orange` `purple` `green` `red` `gray`） |
| credits | 最後の場面に出すクレジット。「ナレーション：VOICEVOX:ずんだもん」は必須 |
| scenes | 場面の並び（時間の順） |

## 場面に共通の欄

| 欄 | 内容 |
|---|---|
| id | 一意の名前。音声のファイル名にも使う |
| stage | 何段目の場面か。0は進み具合を出さない（表紙など） |
| asof | その場面の情報がいつの時点のものか（YYYY-MM）。前の場面より戻してはいけない |
| retrospective | まとめなど、終わった時点から振り返る場面はtrue。asofの点検から外れる |
| kind | 下の8種類のどれか |
| label | 見出しの上の小さな札（時期など） |
| title | 見出し。22字まで |
| owner | 個人の作業なら担当者名。見出しの横に「担当：〇〇」と出る |
| source | 右上に出す出典。数字や日付のある場面には必ず付ける |
| lines | 読み上げる文。`text`が字幕、`say`があれば読みはそちらを使う。1文80字まで |
| items | 画面の項目。`l`はその項目を出す文の番号（linesの添字） |

## 項目（items）に共通の欄

| 欄 | 内容 |
|---|---|
| l | その項目を出す文の番号 |
| c | 色（`dark` `blue` `orange` `purple` `green` `red` `gray`） |
| icon | アイコンの名前（Lucideの表記、または`custom:<名前>`）。探し方と作り方は`diagrams-and-icons.md` |
| motion | アイコンの動き（`draw` `pop` `pulse` `spin` `bounce` `none`。既定は`draw`） |

## 13種類の場面と専用の場面

| kind | 使う欄 | 項目数の上限 | 使いどころ |
|---|---|---|---|
| cover | label, title, note | なし | 表紙。noteは2文目で出る補足 |
| chapter | label, title, period | なし | 章の扉 |
| bullets | items[].t, items[].c, credits | 5 | 箇条の説明。読んでいる文の項目が強調される |
| stats | items[].v/d/pre/suf/label/c, note | 4 | 大きな数字。vを0から数え上げる。dは小数の桁 |
| bars | unit, max, suffix, items[].label/v/c | 7 | 横棒の比較。棒の長さはv / max |
| flow | items[].t/s | 4 | 処理の流れ。箱から箱へ点が動く |
| decision | question, items[].t/s/chosen, reason, by, rl | 5 | 判断。問い→候補→採用の印→理由と決めた主体。rlは理由を読む文の番号で、その文で採用の印が出る |
| docs | items[].date/t/who/s | 5 | 成果物の年表。whoで色が変わる |
| diagram | items[].t/s/g/to/icon | 12（1列4個） | フロー図・構成図。gは列（0〜3）、toはつなぎ先の項目の番号 |
| ratio | items[].v（0〜100）/d/suf/label/s/c | 3 | 割合の円。円が満ちて数字が数え上がる |
| compare | items（前・後の2つ）[].label/s/v/d/suf/icon, stamp, rl | 2 | 前後の比較。後の棒が前の長さから変わり、rlの文でstampを押す |
| timeline | from, to, items[].t/start/end/plan/s/icon | 6 | 期間の帯（YYYY-MM）。planはその時点ではまだ予定の帯（斜線）。asofの位置に「この時点」の線 |
| icons | items[].icon/t/s/c/motion | 6 | 人・道具・概念の紹介。大きなアイコンが描かれる |
| custom:<名前> | 部品しだい | 部品しだい | `src/custom/`に作った専用の場面。作り方は`custom-scenes.md` |

## 書き方の決まり

- 文は説明の調子で書く。「〜のだ」などのキャラクターの口調は使わない（点検でエラーになる）。
- 日付は「10月24日」と書く。「10/24」は分数に読まれる。
- 英字の略語は`scripts/readings.json`に読みを足すか、その文に`say`を書く。
- decisionで資料に理由や主体が無いときは、`reason`や`by`に「記録なし」と書く。空にしない。
- 1つの場面に詰め込みすぎない。項目が上限を超えるときは場面を分ける。
- 文字の箇条（bullets）を続けない。流れ・割合・前後・期間・役割は、それぞれの図の場面で見せる。
- timelineの帯は、その場面のasofより後まで伸ばさない（その時点の予定ならplanにする。点検でエラーになる）。
- 短編はおよそ10場面（約3分）、長編は章ごとに10〜20場面（40分前後でも可）が目安。
