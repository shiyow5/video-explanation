# 専用の場面を作る

用意した13種類の場面で表せない図（その案件だけの図解、特別な比較、モデルの構造など）は、専用の場面として作る。台本では`"kind": "custom:<名前>"`と書く。見本は`src/custom/UnitGrid.tsx`（10個のマスが順に埋まって割合を見せる）。

## 手順

1. Remotionの公式スキルremotion-markupを読む（アニメーションは`useCurrentFrame`と`interpolate`・`spring`で作り、CSSのtransitionやanimationは使わない）。
2. `src/custom/<名前>.tsx`を作る。`KindProps`（`scene`・`at`・`story`）を受け取るReactの部品にする。
3. `src/custom/index.ts`の`CUSTOM_KINDS`に名前を登録する（台本の点検は、登録されていない名前をエラーにする）。
4. 台本に場面を書き、`check_script.py`と`motion_check.py --only <id>`で確かめる。

## 決まり

- 見出しは`<Title scene={scene} />`、内容は`<Area>`の中（1680 x 445）に置く。上の進み具合・右上の出典・下の字幕と重ならない。
- 動きは読み上げに合わせる。`at[i]`がi番目の文の始まる秒なので、項目は`lineAt(at, it.l)`の時刻に出す。文より先に答えを見せない。
- 少なくとも1つ、読み上げの途中で変わる動きを入れる（数え上げ、伸びる棒、線を引く、強調の移動など）。止まった絵だけの場面にしない。
- 色は`theme.ts`の`C`と`colorOf`を使い、ほかの場面とそろえる。アイコンは`Icon`を使う。
- 顔・キャラクターに見える絵は描かない。
- 数値は台本の`items`から読み、部品の中に書き込まない（ファクトチェックの対象を台本に集めるため）。

## 部品の雛形

```tsx
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Area, KindProps, Title, lineAt } from "../layout";

export const MyScene: React.FC<KindProps> = ({ scene, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const it = scene.items?.[0];
  if (!it) return null;
  const t = lineAt(at, it.l); // この項目を読み始める秒
  const p = interpolate(frame, [t * fps, (t + 1) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>{/* p を使って動かす */}</Area>
    </AbsoluteFill>
  );
};
```
