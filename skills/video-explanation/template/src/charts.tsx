// 図解の場面：割合の円、前後の比較、構成図（フロー図）、期間の帯、アイコンの並び
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Icon } from "./icons";
import { AREA, Area, KindProps, Title, lineAt, useLineIndex } from "./layout";
import { Card, Counter, Pop, Slide, useEnter } from "./parts";
import { C, colorOf } from "./theme";
import { ChartKind, Item } from "./types";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// t 秒から dur 秒かけて 0→1（動き出しが速く、終わりがゆっくり）
const useProgress = (t: number, dur = 1.2) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return interpolate(frame, [t * fps, (t + dur) * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
};

const fmt = (v: number, d: number) =>
  v.toLocaleString("ja-JP", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

// ---------- ratio: 割合の円（0〜100）。円が満ちながら中央の数字が数え上がる

const Ring: React.FC<{ it: Item; delay: number; active: boolean }> = ({
  it,
  delay,
  active,
}) => {
  const p = useProgress(delay);
  const v = Math.max(0, Math.min(100, it.v ?? 0));
  const color = colorOf(it.c, C.accent);
  return (
    <Card
      accent={active ? color : "#e4dccd"}
      style={{ textAlign: "center", padding: "30px 26px" }}
    >
      <div
        style={{
          width: 250,
          height: 250,
          margin: "0 auto",
          borderRadius: "50%",
          background: `conic-gradient(${color} ${v * p * 3.6}deg, #f1e7da 0deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 168,
            height: 168,
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 50,
            fontWeight: 800,
            color,
          }}
        >
          <Counter
            to={v}
            decimals={it.d ?? 0}
            delay={delay}
            suffix={it.suf ?? "%"}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: C.ink,
          marginTop: 18,
          lineHeight: 1.35,
        }}
      >
        {it.label}
      </div>
      {it.s ? (
        <div style={{ fontSize: 26, fontWeight: 800, color: C.sub }}>
          {it.s}
        </div>
      ) : null}
    </Card>
  );
};

export const Ratio: React.FC<KindProps> = ({ scene, at }) => {
  const items = scene.items ?? [];
  const now = useLineIndex(at);
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area
        style={{
          display: "flex",
          gap: 40,
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {items.map((it, i) => {
          const delay = lineAt(at, it.l) + 0.2 + i * 0.15;
          return (
            <Pop key={i} delay={delay} style={{ flex: 1, maxWidth: 480 }}>
              <Ring it={it} delay={delay + 0.15} active={it.l === now} />
            </Pop>
          );
        })}
      </Area>
    </AbsoluteFill>
  );
};

// ---------- compare: 前と後。後の棒は前の長さから縮む（伸びる）。rl の文でスタンプ

export const Compare: React.FC<KindProps> = ({ scene, at }) => {
  const [before, after] = scene.items ?? [];
  const tBefore = lineAt(at, before?.l ?? 0) + 0.2;
  const tAfter = lineAt(at, after?.l ?? 0) + 0.2;
  const pBefore = useProgress(tBefore);
  const pAfter = useProgress(tAfter + 0.4, 1.4);
  const arrow = useProgress(tAfter, 0.6);
  const stamp = useEnter(lineAt(at, scene.rl ?? at.length - 1) + 0.6, 9);
  if (!before || !after) return null;
  const v0 = before.v ?? 0;
  const v1 = after.v ?? 0;
  const d = Math.max(before.d ?? 0, after.d ?? 0);
  const suf = before.suf ?? after.suf ?? "";
  const max = Math.max(Math.abs(v0), Math.abs(v1)) || 1;
  const BAR = 600;
  const shown = interpolate(pAfter, [0, 1], [v0, v1]);
  const diff = v1 - v0;
  const cards: [Item, number, string, number][] = [
    [before, tBefore, fmt(v0 * pBefore, d), (v0 / max) * BAR * pBefore],
    [after, tAfter, fmt(shown, d), (shown / max) * BAR],
  ];
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area style={{ display: "flex", alignItems: "center", gap: 30 }}>
        {cards.map(([it, t, text, w], i) => {
          const color = colorOf(it.c, i === 0 ? C.sub : C.blue);
          return (
            <React.Fragment key={i}>
              {i === 1 ? (
                <div
                  style={{
                    fontSize: 90,
                    fontWeight: 800,
                    color: C.sub,
                    opacity: arrow,
                    translate: `${interpolate(arrow, [0, 1], [-30, 0])}px 0`,
                  }}
                >
                  →
                </div>
              ) : null}
              <Pop delay={t} style={{ flex: 1, position: "relative" }}>
                <Card accent={color} style={{ height: 330 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {it.icon ? (
                      <Icon name={it.icon} size={44} color={color} delay={t + 0.1} motion={it.motion} />
                    ) : null}
                    <div style={{ fontSize: 34, fontWeight: 800, color: C.ink }}>
                      {it.label}
                    </div>
                  </div>
                  {it.s ? (
                    <div style={{ fontSize: 26, color: C.sub, fontWeight: 800 }}>
                      {it.s}
                    </div>
                  ) : null}
                  <div
                    style={{
                      marginTop: 26,
                      height: 60,
                      width: Math.max(0, w),
                      background: color,
                      borderRadius: 14,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 72,
                      fontWeight: 800,
                      color,
                      marginTop: 10,
                    }}
                  >
                    {it.pre ?? ""}
                    {text}
                    {suf}
                  </div>
                </Card>
                {i === 1 ? (
                  <Pop
                    delay={tAfter + 1.9}
                    style={{ position: "absolute", right: 24, top: -26 }}
                  >
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                        color: "#fff",
                        background: C.purple,
                        borderRadius: 30,
                        padding: "4px 22px",
                      }}
                    >
                      差 {diff > 0 ? "+" : ""}
                      {fmt(diff, d)}
                      {suf}
                    </div>
                  </Pop>
                ) : null}
                {i === 1 && scene.stamp ? (
                  <div
                    style={{
                      position: "absolute",
                      right: 24,
                      bottom: -34,
                      rotate: "-10deg",
                      scale: String(interpolate(stamp, [0, 1], [2.2, 1])),
                      opacity: stamp,
                      border: `8px solid ${C.red}`,
                      color: C.red,
                      fontSize: 50,
                      fontWeight: 800,
                      padding: "6px 24px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.92)",
                    }}
                  >
                    {scene.stamp}
                  </div>
                ) : null}
              </Pop>
            </React.Fragment>
          );
        })}
      </Area>
    </AbsoluteFill>
  );
};

// ---------- diagram: 列ごとに箱を並べ、線でつなぐ構成図・フロー図
// items[].to があればその通りにつなぐ。無ければ、前の列のすべての箱から次の列の箱へつなぐ

type Box = { x: number; y: number; w: number; h: number };

const edgePath = (a: Box, b: Box, gapX: number) => {
  if (b.x > a.x) {
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    return { d: `M ${x1} ${y1} C ${x1 + gapX / 2} ${y1}, ${x2 - gapX / 2} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 };
  }
  if (b.x < a.x) {
    // 戻る線は下を回る
    const x1 = a.x + a.w / 2;
    const y1 = a.y + a.h;
    const x2 = b.x + b.w / 2;
    const y2 = b.y + b.h;
    const low = Math.max(y1, y2) + 50;
    return { d: `M ${x1} ${y1} C ${x1} ${low}, ${x2} ${low}, ${x2} ${y2}`, x1, y1, x2, y2 };
  }
  // 同じ列は上から下へ
  const down = b.y > a.y;
  const x1 = a.x + a.w / 2;
  const y1 = down ? a.y + a.h : a.y;
  const x2 = b.x + b.w / 2;
  const y2 = down ? b.y : b.y + b.h;
  return { d: `M ${x1} ${y1} L ${x2} ${y2}`, x1, y1, x2, y2 };
};

export const Diagram: React.FC<KindProps> = ({ scene, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = useLineIndex(at);
  const items = scene.items ?? [];
  const ncol = Math.max(1, ...items.map((it) => (it.g ?? 0) + 1));
  const GAP_X = 130;
  const GAP_Y = 24;
  const w = Math.min(380, (AREA.width - (ncol - 1) * GAP_X) / ncol);
  const left0 = (AREA.width - (ncol * w + (ncol - 1) * GAP_X)) / 2;
  const cols = Array.from({ length: ncol }, (_, g) =>
    items.map((it, i) => ({ it, i })).filter(({ it }) => (it.g ?? 0) === g),
  );
  const pos = new Map<number, Box>();
  cols.forEach((col, g) => {
    const n = Math.max(1, col.length);
    const h = Math.min(130, (AREA.height - (n - 1) * GAP_Y) / n);
    const top0 = (AREA.height - (n * h + (n - 1) * GAP_Y)) / 2;
    col.forEach(({ i }, k) =>
      pos.set(i, { x: left0 + g * (w + GAP_X), y: top0 + k * (h + GAP_Y), w, h }),
    );
  });
  const delayOf = (i: number) =>
    lineAt(at, items[i].l) + 0.25 + (items[i].g ?? 0) * 0.3;
  const colors = [C.blue, C.orange, C.purple, C.accent];
  const explicit = items.some((it) => it.to);
  const edges: { from: number; to: number }[] = explicit
    ? items.flatMap((it, i) => (it.to ?? []).filter((j) => pos.has(j)).map((j) => ({ from: i, to: j })))
    : items.flatMap((it, i) =>
        (it.g ?? 0) > 0 ? cols[(it.g ?? 0) - 1].map(({ i: j }) => ({ from: j, to: i })) : [],
      );
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>
        <svg
          width={AREA.width}
          height={AREA.height}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {edges.map(({ from, to }, k) => {
            const e = edgePath(pos.get(from)!, pos.get(to)!, GAP_X);
            const t = Math.max(delayOf(from) + 0.3, delayOf(to) - 0.35);
            const p = interpolate(frame, [t * fps, (t + 0.5) * fps], [0, 1], {
              ...clamp,
              easing: Easing.inOut(Easing.cubic),
            });
            const len = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) * 1.6 + 60;
            // 線が引き終わったあとも、点が流れ続ける
            const flow = (((frame / fps - t) / 1.6) % 1 + 1) % 1;
            const ease = 3 * flow * flow - 2 * flow ** 3;
            return (
              <g key={k}>
                <path
                  d={e.d}
                  fill="none"
                  stroke={C.muted}
                  strokeWidth={6}
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - p)}
                  strokeLinecap="round"
                />
                {p >= 1 ? (
                  <circle
                    r={9}
                    fill={colors[(items[to].g ?? 0) % 4]}
                    cx={e.x1 + (e.x2 - e.x1) * flow}
                    cy={e.y1 + (e.y2 - e.y1) * ease}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
        {items.map((it, i) => {
          const b = pos.get(i)!;
          const color = colorOf(it.c, colors[(it.g ?? 0) % 4]);
          const active = it.l === now;
          const small = b.h < 90;
          // 箱の幅に1行で収まる文字の大きさ（アイコンの分を引く）
          const room = b.w - 48 - (it.icon ? (small ? 54 : 68) : 0);
          const titleSize = Math.min(small ? 28 : 34, Math.floor(room / Math.max(1, (it.t ?? "").length)));
          return (
            <Pop
              key={i}
              delay={delayOf(i)}
              style={{ position: "absolute", left: b.x, top: b.y, width: b.w }}
            >
              <div
                style={{
                  height: b.h,
                  boxSizing: "border-box",
                  background: C.card,
                  borderRadius: 22,
                  border: `6px solid ${active ? color : "#e4dccd"}`,
                  boxShadow: "0 10px 0 rgba(0,0,0,0.07)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 18px",
                }}
              >
                {it.icon ? (
                  <Icon
                    name={it.icon}
                    size={small ? 40 : 54}
                    color={color}
                    delay={delayOf(i) + 0.15}
                    motion={it.motion}
                  />
                ) : null}
                <div style={{ flex: 1, textAlign: it.icon ? "left" : "center" }}>
                  <div
                    style={{
                      fontSize: titleSize,
                      fontWeight: 800,
                      color: active ? color : C.ink,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {it.t}
                  </div>
                  {it.s && !small ? (
                    <div
                      style={{
                        fontSize: 23,
                        fontWeight: 800,
                        color: C.sub,
                        marginTop: 4,
                      }}
                    >
                      {it.s}
                    </div>
                  ) : null}
                </div>
              </div>
            </Pop>
          );
        })}
      </Area>
    </AbsoluteFill>
  );
};

// ---------- timeline: 期間の帯。帯は始まりから終わりへ伸びる。予定の帯は斜線

const monthIndex = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};

export const Timeline: React.FC<KindProps> = ({ scene, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = useLineIndex(at);
  const items = scene.items ?? [];
  if (!scene.from || !scene.to) return null;
  const m0 = monthIndex(scene.from);
  const m1 = monthIndex(scene.to) + 1; // 終わりの月の末まで
  const LABEL_W = 330;
  const plotW = AREA.width - LABEL_W;
  const x = (m: number) => LABEL_W + ((m - m0) / (m1 - m0)) * plotW;
  const rowH = Math.min(70, 370 / Math.max(1, items.length));
  const axisY = items.length * rowH + 14;
  const span = m1 - m0;
  const step = Math.max(1, Math.ceil(span / 12));
  const ticks = Array.from(
    { length: Math.floor(span / step) + 1 },
    (_, k) => m0 + k * step,
  );
  const axis = interpolate(frame, [0.1 * fps, 0.9 * fps], [0, 1], clamp);
  // その場面の時点を示す縦線（asof の月の末）
  const asofX = scene.asof ? x(monthIndex(scene.asof) + 1) : null;
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area>
        {ticks.map((m, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x(m),
              top: 0,
              height: axisY,
              borderLeft: "2px dashed #e4dccd",
              opacity: axis,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: axisY + 4,
                left: -80,
                width: 160,
                textAlign: "center",
                whiteSpace: "nowrap",
                fontSize: 22,
                fontWeight: 800,
                color: C.sub,
              }}
            >
              {m % 12 === 0 || k === 0 ? `${Math.floor(m / 12)}年` : ""}
              {(m % 12) + 1}月
            </div>
          </div>
        ))}
        {items.map((it, i) => {
          if (!it.start || !it.end) return null;
          const color = colorOf(it.c, C.blue);
          const t = lineAt(at, it.l) + 0.2 + i * 0.1;
          const p = interpolate(frame, [t * fps, (t + 0.9) * fps], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          });
          const a = x(monthIndex(it.start));
          const b = x(monthIndex(it.end) + 1);
          const active = it.l === now;
          return (
            <React.Fragment key={i}>
              <Slide
                delay={t - 0.1}
                from={-40}
                style={{
                  position: "absolute",
                  left: 0,
                  width: LABEL_W - 20,
                  top: i * rowH,
                  height: rowH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                  fontSize: rowH < 56 ? 26 : 30,
                  fontWeight: 800,
                  color: active ? C.ink : C.sub,
                  textAlign: "right",
                }}
              >
                {it.icon ? (
                  <Icon name={it.icon} size={rowH * 0.5} color={color} delay={t} motion={it.motion} />
                ) : null}
                {it.t}
              </Slide>
              <div
                style={{
                  position: "absolute",
                  left: a,
                  top: i * rowH + rowH * 0.16,
                  height: rowH * 0.68,
                  width: Math.max(0, (b - a) * p),
                  borderRadius: 12,
                  background: it.plan
                    ? `repeating-linear-gradient(45deg, ${color}55 0 10px, #fff 10px 20px)`
                    : color,
                  border: it.plan ? `3px dashed ${color}` : "none",
                  boxSizing: "border-box",
                  opacity: active ? 1 : 0.8,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 14,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  fontSize: 22,
                  fontWeight: 800,
                  color: it.plan ? color : "#fff",
                }}
              >
                {p > 0.9 ? (it.s ?? (it.plan ? "予定" : "")) : ""}
              </div>
            </React.Fragment>
          );
        })}
        {asofX !== null ? (
          <div
            style={{
              position: "absolute",
              left: LABEL_W + (asofX - LABEL_W) * axis,
              top: -14,
              height: axisY + 14,
              borderLeft: `4px solid ${C.red}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -34,
                left: -50,
                width: 100,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 800,
                color: C.red,
              }}
            >
              この時点
            </div>
          </div>
        ) : null}
      </Area>
    </AbsoluteFill>
  );
};

// ---------- icons: 大きなアイコンと短い言葉を並べる（概念・役割・道具の紹介）

export const IconGrid: React.FC<KindProps> = ({ scene, at }) => {
  const items = scene.items ?? [];
  const now = useLineIndex(at);
  const perRow = items.length <= 4 ? items.length : 3;
  const big = items.length <= 4;
  return (
    <AbsoluteFill>
      <Title scene={scene} />
      <Area
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: big ? 36 : 22,
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        {items.map((it, i) => {
          const color = colorOf(it.c, [C.blue, C.orange, C.purple, C.accent][i % 4]);
          const delay = lineAt(at, it.l) + 0.2 + i * 0.15;
          const active = it.l === now;
          return (
            <Pop
              key={i}
              delay={delay}
              style={{ width: `calc((100% - ${(perRow - 1) * (big ? 36 : 22)}px) / ${perRow})` }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: big ? "column" : "row",
                  alignItems: "center",
                  gap: big ? 14 : 20,
                  textAlign: big ? "center" : "left",
                  background: C.card,
                  borderRadius: 28,
                  border: `5px solid ${active ? color : "#e4dccd"}`,
                  boxShadow: "0 10px 0 rgba(0,0,0,0.07)",
                  padding: big ? "30px 20px" : "16px 22px",
                }}
              >
                <div
                  style={{
                    width: big ? 150 : 96,
                    height: big ? 150 : 96,
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    background: `${color}1f`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {it.icon ? (
                    <Icon
                      name={it.icon}
                      size={big ? 84 : 54}
                      color={color}
                      delay={delay + 0.15}
                      motion={it.motion}
                    />
                  ) : null}
                </div>
                <div>
                  <div style={{ fontSize: big ? 36 : 30, fontWeight: 800, color: C.ink }}>
                    {it.t}
                  </div>
                  {it.s ? (
                    <div
                      style={{
                        fontSize: big ? 26 : 23,
                        fontWeight: 800,
                        color: C.sub,
                        marginTop: 6,
                        lineHeight: 1.3,
                      }}
                    >
                      {it.s}
                    </div>
                  ) : null}
                </div>
              </div>
            </Pop>
          );
        })}
      </Area>
    </AbsoluteFill>
  );
};

export const CHART_KINDS: Record<ChartKind, React.FC<KindProps>> = {
  ratio: Ratio,
  compare: Compare,
  diagram: Diagram,
  timeline: Timeline,
  icons: IconGrid,
};
