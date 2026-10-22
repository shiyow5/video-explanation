// 論文の解説で使う場面：数式、結果の表、図
import React, { useEffect, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AREA, Area, KindProps, Title, lineAt, useLineIndex } from "./layout";
import { Pop, Slide, useEnter } from "./parts";
import { C, colorOf } from "./theme";
import { PaperKind } from "./types";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// KaTeX のフォントが読み込まれるまで書き出しを待つ（待たないと記号が崩れることがある）
const useMathFonts = () => {
  const [handle] = useState(() => delayRender("KaTeX のフォントを読み込む"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
};

const TeX: React.FC<{ tex: string; size: number; color?: string }> = ({
  tex,
  size,
  color = C.ink,
}) => (
  <span
    style={{ fontSize: size, color, lineHeight: 1.2 }}
    // 台本の LaTeX を KaTeX で HTML にする（誤った式は書き出しを止めて知らせる）
    dangerouslySetInnerHTML={{
      __html: katex.renderToString(tex, {
        displayMode: false,
        throwOnError: true,
        output: "html",
      }),
    }}
  />
);

// ---------- equation: 式が左から現れ、各項が読み上げに合わせて説明つきで出る

export const Equation: React.FC<KindProps> = ({ scene, at }) => {
  useMathFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = useLineIndex(at);
  const items = scene.items ?? [];
  const t0 = lineAt(at, 0) + 0.2;
  const reveal = interpolate(frame, [t0 * fps, (t0 + 1.2) * fps], [0, 100], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const colors = [C.blue, C.orange, C.purple, C.accent, C.red];
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            background: C.card,
            borderRadius: 28,
            border: `5px solid ${C.line}`,
            padding: "26px 30px",
            clipPath: `inset(0 ${100 - reveal}% 0 0)`,
          }}
        >
          {scene.tex ? <TeX tex={scene.tex} size={items.length > 3 ? 58 : 66} /> : null}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 26, justifyContent: "center" }}>
          {items.map((it, i) => {
            const color = colorOf(it.c, colors[i % colors.length]);
            const active = it.l === now;
            return (
              <Pop
                key={i}
                delay={lineAt(at, it.l) + 0.3 + i * 0.12}
                style={{ flex: 1, maxWidth: 420 }}
              >
                <div
                  style={{
                    background: C.card,
                    borderRadius: 22,
                    border: `5px solid ${active ? color : "#e4dccd"}`,
                    boxShadow: "0 10px 0 rgba(0,0,0,0.07)",
                    padding: "14px 18px",
                    textAlign: "center",
                    minHeight: 150,
                  }}
                >
                  {it.tex ? <TeX tex={it.tex} size={44} color={color} /> : null}
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: active ? C.ink : C.sub,
                      marginTop: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    {it.t}
                  </div>
                </div>
              </Pop>
            );
          })}
        </div>
      </Area>
    </AbsoluteFill>
  );
};

// ---------- table: 結果の表。行が順に出て、rl の文で最良の行（chosen）を強調する

export const ResultTable: React.FC<KindProps> = ({ scene, at }) => {
  const now = useLineIndex(at);
  const cols = scene.columns ?? [];
  const items = scene.items ?? [];
  const best = useEnter(lineAt(at, scene.rl ?? at.length - 1) + 0.4, 12);
  const rowH = Math.min(70, (AREA.height - 64) / Math.max(1, items.length));
  const font = rowH < 56 ? 26 : 30;
  const grid = `minmax(300px, 2fr) repeat(${Math.max(1, cols.length - 1)}, 1fr)`;
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>
        <Pop delay={0.3}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: grid,
              background: C.accentDark,
              color: "#fff",
              borderRadius: "18px 18px 0 0",
              fontSize: 26,
              fontWeight: 800,
              height: 58,
              alignItems: "center",
            }}
          >
            {cols.map((c, k) => (
              <div key={k} style={{ padding: "0 20px", textAlign: k === 0 ? "left" : "center" }}>
                {c}
              </div>
            ))}
          </div>
        </Pop>
        {items.map((it, i) => {
          const chosen = Boolean(it.chosen);
          const active = it.l === now;
          return (
            <Slide key={i} delay={lineAt(at, it.l) + 0.2 + i * 0.15} from={-50}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: grid,
                  height: rowH,
                  alignItems: "center",
                  fontSize: font,
                  fontWeight: 800,
                  color: active || (chosen && best > 0.5) ? C.ink : C.sub,
                  background: chosen
                    ? `rgba(91,176,74,${0.22 * best})`
                    : i % 2
                      ? "#fbf6ec"
                      : C.card,
                  borderBottom: `2px solid ${C.line}`,
                  outline: chosen && best > 0.5 ? `4px solid ${C.accent}` : "none",
                  outlineOffset: -4,
                }}
              >
                {(it.cells ?? []).map((cell, k) => (
                  <div
                    key={k}
                    style={{
                      padding: "0 20px",
                      textAlign: k === 0 ? "left" : "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </Slide>
          );
        })}
      </Area>
    </AbsoluteFill>
  );
};

// ---------- figure: 図がゆっくり寄り、読み上げに合わせて注目する部分に枠が付く

export const Figure: React.FC<KindProps> = ({ scene, at }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const now = useLineIndex(at);
  const items = scene.items ?? [];
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.04]);
  if (!scene.image) return null;
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Pop delay={0.3}>
          <div style={{ position: "relative", display: "inline-block", scale: String(zoom) }}>
            <Img
              src={staticFile(scene.image)}
              style={{
                display: "block",
                maxHeight: AREA.height - 44,
                maxWidth: AREA.width,
                borderRadius: 12,
                border: `3px solid ${C.line}`,
                background: "#fff",
              }}
            />
            {items.map((it, i) => {
              if (!it.box) return null;
              const [x, y, w, h] = it.box;
              const t = lineAt(at, it.l) + 0.3;
              const p = interpolate(frame, [t * fps, (t + 0.5) * fps], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.back(1.6)),
              });
              const color = colorOf(it.c, C.red);
              const active = it.l === now;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${w}%`,
                    height: `${h}%`,
                    border: `${active ? 8 : 5}px solid ${color}`,
                    borderRadius: 14,
                    opacity: p * (active ? 1 : 0.55),
                    // 出るときは外から縮み、読み上げ中の枠はゆっくり脈打つ
                    scale: String(
                      interpolate(p, [0, 1], [1.25, 1]) *
                        (active ? 1 + 0.015 * Math.sin((frame / fps) * Math.PI * 1.6) : 1),
                    ),
                  }}
                >
                  {it.t ? (
                    <div
                      style={{
                        position: "absolute",
                        left: -6,
                        top: -44,
                        background: color,
                        color: "#fff",
                        fontSize: 24,
                        fontWeight: 800,
                        padding: "4px 14px",
                        borderRadius: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.t}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Pop>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.sub, marginTop: 10 }}>
          図の出典：{scene.credit}（{scene.license}）
        </div>
      </Area>
    </AbsoluteFill>
  );
};

export const PAPER_KINDS: Record<PaperKind, React.FC<KindProps>> = {
  equation: Equation,
  table: ResultTable,
  figure: Figure,
};
