// 専門用語・固有名詞の説明の札。その場面の terms にある言葉を、初めて読み上げる文に合わせて出す
import React from "react";
import { Pop } from "./parts";
import { C, fontFamily } from "./theme";
import { SceneDef, Script } from "./types";

export const TermNotes: React.FC<{
  scene: SceneDef;
  story: Script;
  at: number[];
}> = ({ scene, story, at }) => {
  const terms = scene.terms ?? [];
  if (terms.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 120,
        bottom: 186,
        display: "flex",
        flexDirection: "row-reverse",
        gap: 16,
        fontFamily,
      }}
    >
      {terms.map((term) => {
        const name = story.names?.[term];
        const desc = name?.desc ?? story.glossary?.[term] ?? "";
        // その言葉を初めて読む文の頭で出す（見つからなければ最初の文）
        const l = scene.lines.findIndex((ln) => ln.text.includes(term));
        return (
          <Pop key={term} delay={(at[Math.max(0, l)] ?? 0) + 0.3}>
            <div
              style={{
                maxWidth: 760,
                background: "rgba(255,255,255,0.97)",
                border: `4px solid ${C.purple}`,
                borderRadius: 20,
                padding: "10px 18px",
                boxShadow: "0 8px 0 rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    background: C.purple,
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: 800,
                    padding: "2px 12px",
                    borderRadius: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  {name ? name.what : "用語"}
                </span>
                <span style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>
                  {term}
                </span>
              </div>
              <div
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                  color: C.sub,
                  marginTop: 4,
                  lineHeight: 1.35,
                }}
              >
                {desc}
              </div>
            </div>
          </Pop>
        );
      })}
    </div>
  );
};
