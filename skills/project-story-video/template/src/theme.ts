import { loadFont } from "@remotion/google-fonts/MPLUSRounded1c";

export const { fontFamily } = loadFont("normal", {
  weights: ["500", "800"],
  subsets: ["japanese", "latin"],
});

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const C = {
  bg: "#fffaf0",
  ink: "#26303b",
  sub: "#5c6773",
  accent: "#5bb04a",
  accentDark: "#2f7d32",
  accentPale: "#e3f5d8",
  blue: "#2f6fbf",
  orange: "#e8892b",
  red: "#e0504a",
  purple: "#7b5bc4",
  yellow: "#ffd84d",
  card: "#ffffff",
  line: "#e7dccb",
  muted: "#d9cdb8",
};

// 台本の c（色の名前）から色へ
export const COLORS: Record<string, string> = {
  red: C.red,
  blue: C.blue,
  orange: C.orange,
  purple: C.purple,
  green: C.accent,
  dark: C.accentDark,
  gray: "#9aa3ad",
};
export const colorOf = (c?: string, fallback: string = C.blue) =>
  c ? (COLORS[c] ?? fallback) : fallback;

// 声の前後と文のあいだの間（秒）
const PAD_START = 0.5;
const GAP = 0.35;
const PAD_END = 0.8;
// 動画の最後に足す余白（秒）
export const TAIL_SECONDS = 1.5;

export type Line = { file: string; text: string; seconds: number };
export type Manifest = { scenes: { id: string; lines: Line[] }[] };
export type SceneTiming = {
  id: string;
  from: number;
  durationInFrames: number;
  lines: (Line & { from: number; durationInFrames: number })[];
};

// 音声の秒数から、各シーンと各文の開始フレームを決める
export const buildTimings = (m: Manifest): SceneTiming[] => {
  let cursor = 0;
  return m.scenes.map((sc) => {
    let t = PAD_START;
    const lines = sc.lines.map((ln) => {
      const from = Math.round(t * FPS);
      const durationInFrames = Math.ceil(ln.seconds * FPS);
      t += ln.seconds + GAP;
      return { ...ln, from, durationInFrames };
    });
    const durationInFrames = Math.ceil((t - GAP + PAD_END) * FPS);
    const timing = { id: sc.id, from: cursor, durationInFrames, lines };
    cursor += durationInFrames;
    return timing;
  });
};

export const totalFrames = (timings: SceneTiming[]) =>
  timings.reduce((a, s) => a + s.durationInFrames, 0) +
  Math.round(TAIL_SECONDS * FPS);
