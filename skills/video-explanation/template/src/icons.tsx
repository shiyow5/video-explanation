// アイコンを名前で出し、動きを付ける。
// 名前は Lucide（https://lucide.dev/icons/）の表記（例 "file-text"）か、"custom:<名前>"（custom-icons.tsx）。
import React from "react";
// 名前付きの書き出しには旧名（別名）も含まれるので、icons の一覧ではなくこちらから引く
import * as LUCIDE from "lucide-react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUSTOM_ICONS } from "./custom-icons";

export type Motion = "draw" | "pop" | "pulse" | "spin" | "bounce" | "none";

const pascal = (kebab: string) =>
  kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

// 線を引くときの破線の長さ（24 x 24 の中の線は、ほぼこの長さに収まる）
const DASH = 90;

export const Icon: React.FC<{
  name: string;
  size?: number;
  color?: string;
  delay?: number;
  motion?: Motion;
  strokeWidth?: number;
}> = ({ name, size = 64, color = "currentColor", delay = 0, motion = "draw", strokeWidth = 2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - delay;
  const enter = spring({ frame: frame - delay * fps, fps, config: { damping: 11, mass: 0.7 } });
  const draw = interpolate(t, [0, 1.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const style: React.CSSProperties = { display: "block", overflow: "visible" };
  if (motion === "draw") {
    // stroke-dasharray は子の線に受け継がれるので、すべての線が同時に描かれる
    Object.assign(style, {
      strokeDasharray: DASH,
      strokeDashoffset: DASH * (1 - draw),
      opacity: t > 0 ? 1 : 0,
    });
  } else if (motion !== "none") {
    const after = Math.max(0, t - 0.4);
    const extra =
      motion === "pulse"
        ? { scale: String(1 + 0.08 * Math.sin(after * Math.PI * 1.6)) }
        : motion === "spin"
          ? { rotate: `${after * 90}deg` }
          : motion === "bounce"
            ? { translate: `0 ${-10 * Math.abs(Math.sin(after * Math.PI * 1.2))}px` }
            : {};
    Object.assign(style, {
      opacity: Math.min(1, enter * 1.5),
      scale: String(interpolate(enter, [0, 1], [0.4, 1])),
      ...extra,
    });
  }

  const svgProps = {
    width: size,
    height: size,
    color,
    stroke: "currentColor",
    strokeWidth,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
  };

  if (name.startsWith("custom:")) {
    const Custom = CUSTOM_ICONS[name.slice(7)];
    if (!Custom) throw new Error(`自作アイコン ${name} が custom-icons.tsx にありません`);
    return (
      <svg viewBox="0 0 24 24" {...svgProps}>
        <Custom />
      </svg>
    );
  }
  const Lucide = (LUCIDE as unknown as Record<string, React.FC<typeof svgProps>>)[pascal(name)];
  if (typeof Lucide !== "object" && typeof Lucide !== "function") throw new Error(`アイコン ${name} が Lucide にありません（https://lucide.dev/icons/ で名前を確かめる）`);
  return <Lucide {...svgProps} />;
};

// 色付きの丸の中に白いアイコン（箇条の番号の代わりなど）
export const IconBadge: React.FC<{
  name: string;
  background: string;
  size?: number;
  delay?: number;
  motion?: Motion;
}> = ({ name, background, size = 62, delay = 0, motion = "draw" }) => (
  <div
    style={{
      flex: "0 0 auto",
      width: size,
      height: size,
      borderRadius: "50%",
      background,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Icon name={name} size={size * 0.58} color="#fff" delay={delay} motion={motion} strokeWidth={2.4} />
  </div>
);
