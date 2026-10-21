// 専用の場面の見本：10個のマスが順に埋まり、割合を見せる（台本では "kind": "custom:UnitGrid"）
// items[0].v（0〜10）がいくつ埋めるか、items[0].label が大きな文字、items[0].s が説明。
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Area, KindProps, Title, lineAt } from "../layout";
import { Card, Pop } from "../parts";
import { C, colorOf } from "../theme";

export const UnitGrid: React.FC<KindProps> = ({ scene, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const it = scene.items?.[0];
  if (!it) return null;
  const color = colorOf(it.c, C.purple);
  const start = lineAt(at, it.l) + 0.4;
  const filled = Math.round(it.v ?? 0);
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Pop delay={lineAt(at, it.l)}>
          <Card accent={color} style={{ width: 1100, textAlign: "center" }}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {Array.from({ length: 10 }, (_, i) => {
                // 埋まるマスは 0.15 秒ずつずらして色が付き、少し跳ねる
                const t = start + i * 0.15;
                const on = i < filled ? interpolate(frame, [t * fps, (t + 0.25) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
                return (
                  <div
                    key={i}
                    style={{
                      width: 70,
                      height: 96,
                      borderRadius: 10,
                      background: on > 0.5 ? color : `${color}26`,
                      translate: `0 ${-14 * Math.sin(on * Math.PI)}px`,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: 96, fontWeight: 800, color, marginTop: 18 }}>
              {it.label}
            </div>
            {it.s ? (
              <div style={{ fontSize: 36, fontWeight: 800, color: C.ink }}>{it.s}</div>
            ) : null}
          </Card>
        </Pop>
      </Area>
    </AbsoluteFill>
  );
};
