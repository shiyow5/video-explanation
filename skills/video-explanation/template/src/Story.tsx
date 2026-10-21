import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background, Caption, Progress, SourceNote } from "./parts";
import { kindComponent } from "./registry";
import { STORIES, StoryDef } from "./stories";
import { SceneTiming, buildTimings, fontFamily, totalFrames } from "./theme";
import { Script } from "./types";

// シーンの頭で一瞬白く抜けて切り替わる
const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 10], [0.85, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{ background: "#fff", opacity: o, pointerEvents: "none" }}
    />
  );
};

const Scene: React.FC<{ timing: SceneTiming; story: Script }> = ({
  timing,
  story,
}) => {
  const { fps } = useVideoConfig();
  const scene = story.scenes.find((s) => s.id === timing.id);
  if (!scene) {
    throw new Error(
      `音声の一覧にある場面 ${timing.id} が台本にありません。gen_voice.py を実行し直してください`,
    );
  }
  const Body = kindComponent(scene.kind);
  const at = timing.lines.map((l) => l.from / fps);
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Body scene={scene} at={at} story={story} />
      {scene.stage > 0 ? (
        <Progress stages={story.stages} stage={scene.stage} />
      ) : null}
      {timing.lines.map((l, i) => (
        <Sequence
          key={l.file}
          name={`${timing.id} 文${i + 1}`}
          from={l.from}
          durationInFrames={l.durationInFrames + Math.round(0.3 * fps)}
          layout="none"
        >
          <Audio src={staticFile(l.file)} />
          <Caption text={l.text} />
        </Sequence>
      ))}
      {scene.source ? <SourceNote text={scene.source} /> : null}
      <Wipe />
    </AbsoluteFill>
  );
};

export const storyFrames = (def: StoryDef) =>
  totalFrames(buildTimings(def.manifest));

export const Story: React.FC<{ storyId: string }> = ({ storyId }) => {
  const { fps } = useVideoConfig();
  const def = STORIES.find((s) => s.id === storyId);
  if (!def) throw new Error(`stories.ts に ${storyId} がありません`);
  const timings = buildTimings(def.manifest);
  const total = totalFrames(timings);
  return (
    <AbsoluteFill>
      <Background />
      <Audio
        src={staticFile(def.bgm)}
        durationInFrames={total}
        volume={(f) =>
          interpolate(
            f,
            [0, fps, total - 2 * fps, total],
            [0, def.bgmVolume, def.bgmVolume, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      {timings.map((s) => (
        <Sequence
          key={s.id}
          name={s.id}
          from={s.from}
          durationInFrames={s.durationInFrames}
        >
          <Scene timing={s} story={def.script} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
