// 場面の部品が共通で使う、配置と読み上げの位置の道具
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneTitle } from "./parts";
import { C, colorOf } from "./theme";
import { SceneDef, Script } from "./types";

// at[i] は i 番目の文が始まる秒（シーンの頭から）
export type KindProps = { scene: SceneDef; at: number[]; story: Script };

// 今読み上げている文の番号
export const useLineIndex = (at: number[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = 0;
  at.forEach((s, i) => {
    if (t >= s - 0.1) idx = i;
  });
  return idx;
};

// 項目 l を読み始める秒
export const lineAt = (at: number[], l: number) => at[l] ?? 0;

// 内容を置く領域（見出しの下から字幕の上まで。1680 x 445）
export const AREA = { left: 120, top: 355, width: 1680, height: 445 };

export const Area: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      left: AREA.left,
      right: AREA.left,
      top: AREA.top,
      height: AREA.height,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{ scene: SceneDef }> = ({ scene }) => (
  <SceneTitle
    label={scene.label}
    owner={scene.owner}
    badge={scene.interpretation ? "解説者の見方" : undefined}
    title={scene.title}
  />
);

// 作成者・決めた主体の色。「A・B」は先頭の A の色
export const whoColor = (story: Script, who?: string) => {
  if (!who) return C.sub;
  const name = story.actors?.[who.split(/[・／]/)[0]];
  return name ? colorOf(name) : C.sub;
};
