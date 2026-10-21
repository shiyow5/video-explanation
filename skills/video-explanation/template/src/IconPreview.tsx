// アイコンの候補を並べて見比べるための1枚（動画には使わない）
// npx remotion still IconPreview out/icons.png --props='{"names":["database","server"]}'
import React from "react";
import { AbsoluteFill } from "remotion";
import { Icon } from "./icons";
import { C, fontFamily } from "./theme";

export const IconPreview: React.FC<{ names: string[] }> = ({ names }) => (
  <AbsoluteFill
    style={{
      background: C.bg,
      fontFamily,
      padding: 60,
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "flex-start",
      gap: 28,
    }}
  >
    {names.slice(0, 40).map((n) => (
      <div
        key={n}
        style={{
          width: 200,
          height: 200,
          background: C.card,
          borderRadius: 24,
          border: `4px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <Icon name={n} size={88} color={C.ink} motion="none" />
        <div style={{ fontSize: 20, fontWeight: 800, color: C.sub, textAlign: "center" }}>
          {n}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
