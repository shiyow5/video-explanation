import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Bar, Card, Counter, Pop, SceneTitle, Slide, useEnter } from "./parts";
import { C, colorOf } from "./theme";
import { Kind, SceneDef, Script } from "./types";

// at[i] は i 番目の文が始まる秒（シーンの頭から）
export type KindProps = { scene: SceneDef; at: number[]; story: Script };

// 今読み上げている文の番号
const useLineIndex = (at: number[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = 0;
  at.forEach((s, i) => {
    if (t >= s - 0.1) idx = i;
  });
  return idx;
};

// 内容を置く領域（見出しの下から字幕の上まで）
const Area: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      left: 120,
      right: 120,
      top: 355,
      height: 445,
      ...style,
    }}
  >
    {children}
  </div>
);

const Title: React.FC<{ scene: SceneDef }> = ({ scene }) => (
  <SceneTitle label={scene.label} owner={scene.owner} title={scene.title} />
);

// 作成者・決めた主体の色。「A・B」は先頭の A の色
const whoColor = (story: Script, who?: string) => {
  if (!who) return C.sub;
  const name = story.actors?.[who.split(/[・／]/)[0]];
  return name ? colorOf(name) : C.sub;
};

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
          {scene.period ? (
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: C.sub,
                marginTop: 8,
              }}
            >
              {scene.period}
            </div>
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
                  }}
                >
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

// 判断の場面：問い → 候補が並ぶ → 選ばれた候補に印 → 理由と決めた主体
export const Decision: React.FC<KindProps> = ({ scene, at, story }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.items ?? [];
  const pick = at[scene.rl ?? at.length - 1] ?? 0;
  const decided = interpolate(frame, [pick * fps, (pick + 0.5) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const n = items.length;
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>
        <Slide delay={0.25}>
          <div
            style={{
              display: "inline-block",
              fontSize: 32,
              fontWeight: 800,
              color: C.ink,
              background: "#fff3d6",
              border: `4px solid ${C.yellow}`,
              borderRadius: 20,
              padding: "8px 26px",
            }}
          >
            問い：{scene.question}
          </div>
        </Slide>
        <div
          style={{
            display: "flex",
            gap: 22,
            marginTop: 26,
            alignItems: "stretch",
          }}
        >
          {items.map((it, i) => {
            const chosen = Boolean(it.chosen);
            return (
              <Pop
                key={i}
                delay={(at[it.l] ?? 0) + 0.2 + i * 0.18}
                style={{ flex: 1, position: "relative" }}
              >
                <div
                  style={{
                    height: n > 4 ? 200 : 190,
                    background: C.card,
                    borderRadius: 24,
                    border: `5px solid ${chosen && decided > 0.5 ? C.accent : C.muted}`,
                    boxShadow: "0 10px 0 rgba(0,0,0,0.07)",
                    padding: "18px 18px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    opacity: chosen
                      ? 1
                      : interpolate(decided, [0, 1], [1, 0.45]),
                    scale: chosen
                      ? String(interpolate(decided, [0, 1], [1, 1.05]))
                      : "1",
                  }}
                >
                  <div
                    style={{
                      fontSize: n > 4 ? 30 : 34,
                      fontWeight: 800,
                      color: C.ink,
                      lineHeight: 1.3,
                    }}
                  >
                    {it.t}
                  </div>
                  {it.s ? (
                    <div
                      style={{
                        fontSize: n > 4 ? 24 : 27,
                        fontWeight: 800,
                        color: C.sub,
                        marginTop: 10,
                        lineHeight: 1.3,
                      }}
                    >
                      {it.s}
                    </div>
                  ) : null}
                </div>
                {chosen ? (
                  <div
                    style={{
                      position: "absolute",
                      top: -22,
                      right: -10,
                      background: C.accent,
                      color: "#fff",
                      fontSize: 28,
                      fontWeight: 800,
                      padding: "4px 18px",
                      borderRadius: 30,
                      opacity: decided,
                      scale: String(interpolate(decided, [0, 1], [2, 1])),
                      rotate: `${interpolate(decided, [0, 1], [-25, 6])}deg`,
                    }}
                  >
                    採用
                  </div>
                ) : null}
              </Pop>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 28,
            alignItems: "center",
            opacity: decided,
            translate: `0 ${interpolate(decided, [0, 1], [20, 0])}px`,
          }}
        >
          {scene.by ? (
            <div
              style={{
                flex: "0 0 auto",
                background: whoColor(story, scene.by),
                color: "#fff",
                fontSize: 28,
                fontWeight: 800,
                padding: "8px 22px",
                borderRadius: 30,
              }}
            >
              決めた主体：{scene.by}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: C.accentDark,
              lineHeight: 1.35,
            }}
          >
            理由：{scene.reason}
          </div>
        </div>
      </Area>
    </AbsoluteFill>
  );
};

// 成果物の年表：縦の線が伸び、日付・名前・作成者が順に出る
export const Docs: React.FC<KindProps> = ({ scene, at, story }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.items ?? [];
  const n = items.length;
  const rowH = n > 4 ? 88 : 104;
  const grow = interpolate(frame, [0.2 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>
        <div
          style={{
            position: "absolute",
            left: 196,
            top: 20,
            width: 8,
            height: grow * (n * rowH - 30),
            background: C.muted,
            borderRadius: 4,
          }}
        />
        {items.map((it, i) => (
          <Slide
            key={i}
            delay={(at[it.l] ?? 0) + 0.2 + i * 0.25}
            from={-40}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: i * rowH,
              height: rowH,
              display: "flex",
              alignItems: "center",
              gap: 26,
            }}
          >
            <div
              style={{
                width: 170,
                textAlign: "right",
                fontSize: 32,
                fontWeight: 800,
                color: C.sub,
              }}
            >
              {it.date}
            </div>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: whoColor(story, it.who),
                border: "5px solid #fff",
                boxShadow: `0 0 0 3px ${C.muted}`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: C.ink }}>
                  {it.t}
                </div>
                {it.who ? (
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#fff",
                      background: whoColor(story, it.who),
                      padding: "2px 14px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {it.who}
                  </div>
                ) : null}
              </div>
              {it.s ? (
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: C.sub,
                    marginTop: 4,
                  }}
                >
                  {it.s}
                </div>
              ) : null}
            </div>
          </Slide>
        ))}
      </Area>
    </AbsoluteFill>
  );
};

export const KINDS: Record<Kind, React.FC<KindProps>> = {
  cover: Cover,
  chapter: Chapter,
  bullets: Bullets,
  stats: Stats,
  bars: Bars,
  flow: Flow,
  decision: Decision,
  docs: Docs,
};
