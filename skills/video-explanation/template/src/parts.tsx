import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, fontFamily } from "./theme";

// 入場のばね（0→1）。delay は秒
export const useEnter = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay * fps,
    fps,
    config: { damping, mass: 0.7 },
  });
};

// ふわっと拡大しながら出る
export const Pop: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const p = useEnter(delay, 11);
  return (
    <div
      style={{
        ...style,
        opacity: Math.min(1, p * 1.5),
        scale: String(interpolate(p, [0, 1], [0.6, 1])),
        translate: `0 ${interpolate(p, [0, 1], [40, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

// 横から滑り込む
export const Slide: React.FC<{
  delay?: number;
  from?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, from = -120, children, style }) => {
  const p = useEnter(delay, 16);
  return (
    <div
      style={{
        ...style,
        opacity: p,
        translate: `${interpolate(p, [0, 1], [from, 0])}px 0`,
      }}
    >
      {children}
    </div>
  );
};

// 数字のカウントアップ
export const Counter: React.FC<{
  to: number;
  decimals?: number;
  delay?: number;
  dur?: number;
  suffix?: string;
  prefix?: string;
}> = ({ to, decimals = 0, delay = 0, dur = 1.2, suffix = "", prefix = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = interpolate(frame, [delay * fps, (delay + dur) * fps], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span>
      {prefix}
      {v.toLocaleString("ja-JP", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

// 伸びる棒
export const Bar: React.FC<{
  ratio: number;
  color: string;
  delay?: number;
  height?: number;
  max?: number;
}> = ({ ratio, color, delay = 0, height = 56, max = 900 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = interpolate(
    frame,
    [delay * fps, (delay + 1) * fps],
    [0, ratio * max],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
  return (
    <div style={{ width: w, height, background: color, borderRadius: 14 }} />
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}> = ({ children, style, accent = C.accent }) => (
  <div
    style={{
      background: C.card,
      borderRadius: 32,
      border: `5px solid ${accent}`,
      boxShadow: "0 14px 0 rgba(0,0,0,0.08)",
      padding: "28px 36px",
      ...style,
    }}
  >
    {children}
  </div>
);

const Pill: React.FC<{ text: string; background: string }> = ({
  text,
  background,
}) => (
  <div
    style={{
      display: "inline-block",
      background,
      color: "#fff",
      fontSize: 34,
      fontWeight: 800,
      padding: "6px 22px",
      borderRadius: 40,
    }}
  >
    {text}
  </div>
);

// シーンの見出し（時期のラベル＋担当者＋タイトル）
export const SceneTitle: React.FC<{
  label?: string;
  owner?: string;
  title: string;
}> = ({ label, owner, title }) => {
  const p = useEnter(0.1, 15);
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 150,
        opacity: p,
        translate: `${interpolate(p, [0, 1], [-80, 0])}px 0`,
      }}
    >
      <div style={{ display: "flex", gap: 14 }}>
        {label ? <Pill text={label} background={C.accentDark} /> : null}
        {owner ? <Pill text={`担当：${owner}`} background={C.purple} /> : null}
      </div>
      <div
        style={{
          fontSize: 78,
          fontWeight: 800,
          color: C.ink,
          marginTop: 10,
          letterSpacing: 2,
        }}
      >
        {title}
      </div>
    </div>
  );
};

// 背景（方眼＋ゆっくり動く丸）
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 2px, transparent 2px), linear-gradient(90deg, ${C.line} 2px, transparent 2px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `${(frame * 0.4) % 80}px ${(frame * 0.4) % 80}px`,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: C.accentPale,
          right: -160,
          top: -180 + Math.sin(frame / 50) * 20,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "#fff0cc",
          left: -140,
          bottom: -150 + Math.cos(frame / 60) * 20,
        }}
      />
    </AbsoluteFill>
  );
};

// 上部の進み具合。まだ来ていない段階は名前を伏せる（未来の情報を先に出さない）
export const Progress: React.FC<{ stages: string[]; stage: number }> = ({
  stages,
  stage,
}) => (
  <div
    style={{
      position: "absolute",
      top: 36,
      left: 120,
      right: 120,
      display: "flex",
      gap: 12,
      fontFamily,
    }}
  >
    {stages.map((s, i) => {
      const active = i + 1 === stage;
      const done = i + 1 < stage;
      const future = i + 1 > stage;
      return (
        <div
          key={i}
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 24,
            fontWeight: 800,
            padding: "10px 0",
            borderRadius: 30,
            color: active ? "#fff" : done ? C.accentDark : "#b3b9bf",
            background: active ? C.accent : done ? "#dff0d6" : "#eee8dd",
            scale: active ? "1.06" : "1",
          }}
        >
          {future ? `${i + 1}. ？` : `${i + 1}. ${s}`}
        </div>
      );
    })}
  </div>
);

// 右上の出典（その場面の数字がどの資料のものか）
export const SourceNote: React.FC<{ text: string }> = ({ text }) => {
  const p = useEnter(0.3, 18);
  return (
    <div
      style={{
        position: "absolute",
        right: 120,
        top: 112,
        maxWidth: 900,
        textAlign: "right",
        fontFamily,
        fontSize: 24,
        color: C.sub,
        opacity: p,
      }}
    >
      出典：{text}
    </div>
  );
};

// 下部の字幕
export const Caption: React.FC<{ text: string; size?: number }> = ({
  text,
  size = 40,
}) => {
  const p = useEnter(0, 18);
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 50,
        minHeight: 120,
        display: "flex",
        alignItems: "center",
        fontFamily,
        opacity: p,
        translate: `0 ${interpolate(p, [0, 1], [20, 0])}px`,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.96)",
          border: `5px solid ${C.accent}`,
          borderRadius: 26,
          padding: "18px 34px",
          fontSize: size,
          fontWeight: 800,
          color: C.ink,
          lineHeight: 1.4,
          boxShadow: "0 8px 0 rgba(0,0,0,0.08)",
        }}
      >
        {text}
      </div>
    </div>
  );
};
