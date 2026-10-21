import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Icon, IconBadge } from "./icons";
import { Area, KindProps, Title, useLineIndex } from "./layout";
import { Bar, Card, Counter, Pop, Slide, useEnter } from "./parts";
import { C, colorOf } from "./theme";
import { Decision, Docs } from "./history";
import { BasicKind } from "./types";

// 小さな資料の絵（表紙用）
const MiniDoc: React.FC<{ tint: string }> = ({ tint }) => (
  <div
    style={{
      width: 220,
      height: 300,
      background: "#fff",
      borderRadius: 16,
      border: `4px solid ${C.muted}`,
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      boxShadow: "0 12px 0 rgba(0,0,0,0.08)",
    }}
  >
    <div style={{ height: 34, background: tint, borderRadius: 8 }} />
    {[0.9, 0.7, 0.85, 0.6].map((w, i) => (
      <div
        key={i}
        style={{
          height: 14,
          width: `${w * 100}%`,
          background: "#eadfcb",
          borderRadius: 7,
        }}
      />
    ))}
    <div
      style={{
        marginTop: "auto",
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        height: 70,
      }}
    >
      {[0.4, 0.7, 0.55, 1].map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h * 100}%`,
            background: i === 3 ? tint : "#f0c98a",
            borderRadius: 6,
          }}
        />
      ))}
    </div>
  </div>
);

export const Cover: React.FC<KindProps> = ({ scene, at }) => {
  const frame = useCurrentFrame();
  const p = useEnter(0.2, 12);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {[-1, 1].map((s) => (
        <div
          key={s}
          style={{
            position: "absolute",
            top: 540,
            left: s < 0 ? 160 : undefined,
            right: s > 0 ? 160 : undefined,
            rotate: `${s * 8 + Math.sin(frame / 22) * 3}deg`,
          }}
        >
          <Pop delay={0.5 + (s + 1) * 0.15}>
            <MiniDoc tint={s < 0 ? C.orange : C.blue} />
          </Pop>
        </div>
      ))}
      <div
        style={{
          opacity: p,
          scale: String(interpolate(p, [0, 1], [0.4, 1])),
          textAlign: "center",
          marginTop: -140,
        }}
      >
        {scene.label ? (
          <div
            style={{
              display: "inline-block",
              background: C.accentDark,
              color: "#fff",
              fontSize: 38,
              fontWeight: 800,
              padding: "8px 28px",
              borderRadius: 40,
            }}
          >
            {scene.label}
          </div>
        ) : null}
        <div
          style={{
            // 長い題名でも 1 行で幅 1500px に収める
            fontSize: Math.min(96, Math.floor(1500 / scene.title.length)),
            fontWeight: 800,
            color: C.ink,
            marginTop: 26,
            letterSpacing: 4,
          }}
        >
          {scene.title}
        </div>
      </div>
      {scene.note ? (
        <Pop delay={at[1] ?? 2} style={{ marginTop: 40 }}>
          <div style={{ fontSize: 34, color: C.sub, fontWeight: 500 }}>
            {scene.note}
          </div>
        </Pop>
      ) : null}
    </AbsoluteFill>
  );
};

export const Chapter: React.FC<KindProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useEnter(0.05, 13);
  const sweep = interpolate(frame, [0, 0.9 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* 左から伸びる帯 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 390,
          height: 300,
          width: `${sweep * 100}%`,
          background: C.accentPale,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 60,
          opacity: p,
          translate: `${interpolate(p, [0, 1], [-60, 0])}px 0`,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: scene.stage === 0 ? C.accentDark : C.accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 800,
            rotate: `${interpolate(p, [0, 1], [-90, 0])}deg`,
            scale: String(interpolate(p, [0, 1], [0.5, 1])),
          }}
        >
          {scene.label}
        </div>
        <div>
          <div style={{ fontSize: 100, fontWeight: 800, color: C.ink }}>
            {scene.title}
          </div>
          {/* 題名の下に伸びる線（読み上げの間も動きを続ける） */}
          <div
            style={{
              height: 10,
              borderRadius: 5,
              background: C.accent,
              width: `${interpolate(frame, [0.6 * fps, 2.2 * fps], [0, 100], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              })}%`,
            }}
          />
          {scene.period ? (
            <Slide delay={0.9} from={-40}>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: C.sub,
                  marginTop: 12,
                }}
              >
                {scene.period}
              </div>
            </Slide>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Credits: React.FC<{ delay: number; lines: string[] }> = ({
  delay,
  lines,
}) => (
  <Pop
    delay={delay}
    style={{ position: "absolute", right: 120, top: 690, textAlign: "right" }}
  >
    <div style={{ fontSize: 28, color: C.sub, lineHeight: 1.6 }}>
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  </Pop>
);

// 項目を声に合わせて出し、今の文に対応する項目を強調する
export const Bullets: React.FC<KindProps> = ({ scene, at, story }) => {
  const now = useLineIndex(at);
  const items = scene.items ?? [];
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {items.map((it, i) => {
          const color = colorOf(it.c, C.accent);
          const active = it.l === now;
          return (
            <Slide key={i} delay={(at[it.l] ?? 0) + 0.15 + i * 0.12}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  background: C.card,
                  borderRadius: 26,
                  border: `5px solid ${active ? color : "#e4dccd"}`,
                  boxShadow: "0 10px 0 rgba(0,0,0,0.07)",
                  padding: "18px 30px",
                  opacity: active ? 1 : 0.62,
                  scale: active ? "1.015" : "1",
                }}
              >
                {it.icon ? (
                  <IconBadge
                    name={it.icon}
                    background={color}
                    delay={(at[it.l] ?? 0) + 0.35 + i * 0.12}
                    motion={it.motion}
                  />
                ) : (
                  <div
                    style={{
                      flex: "0 0 auto",
                      width: 62,
                      height: 62,
                      borderRadius: "50%",
                      background: color,
                      color: "#fff",
                      fontSize: 34,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: C.ink,
                    lineHeight: 1.35,
                  }}
                >
                  {it.t}
                </div>
              </div>
            </Slide>
          );
        })}
      </Area>
      {scene.credits && story.credits ? (
        <Credits delay={(at[at.length - 1] ?? 0) + 2} lines={story.credits} />
      ) : null}
    </AbsoluteFill>
  );
};

// 大きな数字をカウントアップして並べる
export const Stats: React.FC<KindProps> = ({ scene, at }) => {
  const items = scene.items ?? [];
  const now = useLineIndex(at);
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area
        style={{
          display: "flex",
          gap: 36,
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 30,
        }}
      >
        {items.map((it, i) => {
          const color = colorOf(it.c);
          const delay = (at[it.l] ?? 0) + 0.2 + i * 0.15;
          // 前後の文字と数字を合わせた長さで、カードに収まる大きさにする
          const chars =
            (it.pre ?? "").length +
            (it.suf ?? "").length +
            String(it.v ?? 0).length;
          const size = chars > 12 ? 60 : chars > 8 ? 76 : 100;
          return (
            <Pop key={i} delay={delay} style={{ flex: 1, maxWidth: 560 }}>
              <Card
                accent={it.l === now ? color : "#e4dccd"}
                style={{ textAlign: "center", padding: "36px 26px" }}
              >
                {it.icon ? (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                    <Icon name={it.icon} size={60} color={color} delay={delay + 0.1} motion={it.motion} />
                  </div>
                ) : null}
                <div
                  style={{
                    color,
                    fontWeight: 800,
                    fontSize: size,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Counter
                    to={it.v ?? 0}
                    decimals={it.d ?? 0}
                    delay={delay + 0.1}
                    prefix={it.pre ?? ""}
                    suffix={it.suf ?? ""}
                  />
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: C.sub,
                    marginTop: 18,
                    lineHeight: 1.35,
                  }}
                >
                  {it.label}
                </div>
              </Card>
            </Pop>
          );
        })}
      </Area>
      {scene.note ? (
        <Pop
          delay={(at[0] ?? 0) + 1.2}
          style={{ position: "absolute", left: 120, right: 120, top: 700 }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 30,
              fontWeight: 800,
              color: C.purple,
              background: "#f1ecfb",
              borderRadius: 20,
              padding: "12px 24px",
            }}
          >
            {scene.note}
          </div>
        </Pop>
      ) : null}
    </AbsoluteFill>
  );
};

// 横棒グラフ。棒の長さは v / max
export const Bars: React.FC<KindProps> = ({ scene, at }) => {
  const items = scene.items ?? [];
  const max = scene.max ?? 1;
  const n = items.length;
  const h = n > 5 ? 40 : n > 3 ? 62 : 80;
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>
        <Pop delay={0.3}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.sub }}>
            {scene.unit}
          </div>
        </Pop>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: n > 5 ? 12 : n > 3 ? 22 : 34,
            marginTop: 26,
          }}
        >
          {items.map((it, i) => {
            const color = colorOf(it.c);
            const delay = (at[it.l] ?? 0) + 0.2 + i * 0.3;
            return (
              <Slide key={i} delay={delay} from={-60}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div
                    style={{
                      width: 560,
                      textAlign: "right",
                      fontSize: n > 5 ? 30 : 34,
                      fontWeight: 800,
                      color: C.ink,
                    }}
                  >
                    {it.label}
                  </div>
                  <Bar
                    ratio={Math.min(1, (it.v ?? 0) / max)}
                    color={color}
                    delay={delay}
                    height={h}
                    max={860}
                  />
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 800,
                      color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Counter
                      to={it.v ?? 0}
                      decimals={it.d ?? 0}
                      delay={delay}
                      dur={1}
                      suffix={scene.suffix ?? ""}
                    />
                  </div>
                </div>
              </Slide>
            );
          })}
        </div>
      </Area>
    </AbsoluteFill>
  );
};

// 矢印でつないだ処理の流れ。点が箱から箱へ動く
export const Flow: React.FC<KindProps> = ({ scene, at }) => {
  const items = scene.items ?? [];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = [C.blue, C.orange, C.purple, C.accent];
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {items.map((it, i) => {
          const delay = (at[it.l] ?? 0) + 0.3 + i * 0.45;
          const dot = interpolate(
            frame,
            [(delay - 0.3) * fps, delay * fps],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div
                  style={{
                    position: "relative",
                    width: 50,
                    height: 8,
                    background: C.muted,
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -8,
                      left: `${dot * 100}%`,
                      translate: "-50% 0",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: colors[i % 4],
                      opacity: dot > 0 && dot < 1 ? 1 : 0,
                    }}
                  />
                </div>
              ) : null}
              <Pop delay={delay}>
                <div
                  style={{
                    width: 340,
                    minHeight: 250,
                    background: C.card,
                    borderRadius: 28,
                    border: `6px solid ${colors[i % 4]}`,
                    boxShadow: "0 12px 0 rgba(0,0,0,0.08)",
                    padding: "26px 20px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {it.icon ? (
                    <div style={{ marginBottom: 10 }}>
                      <Icon name={it.icon} size={64} color={colors[i % 4]} delay={delay + 0.1} motion={it.motion} />
                    </div>
                  ) : null}
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 800,
                      color: colors[i % 4],
                    }}
                  >
                    {it.t}
                  </div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: C.sub,
                      marginTop: 14,
                      lineHeight: 1.35,
                    }}
                  >
                    {it.s}
                  </div>
                </div>
              </Pop>
            </React.Fragment>
          );
        })}
      </Area>
    </AbsoluteFill>
  );
};

export const BASIC_KINDS: Record<BasicKind, React.FC<KindProps>> = {
  cover: Cover,
  chapter: Chapter,
  bullets: Bullets,
  stats: Stats,
  bars: Bars,
  flow: Flow,
  decision: Decision,
  docs: Docs,
};
