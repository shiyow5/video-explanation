// 経緯を見せる場面：判断（問い・候補・採用・理由・決めた主体）と成果物の年表
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Icon } from "./icons";
import { Area, KindProps, Title, whoColor } from "./layout";
import { Pop, Slide } from "./parts";
import { C } from "./theme";

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
                    alignItems: "center",
                  }}
                >
                  {it.icon ? (
                    <div style={{ marginBottom: 6 }}>
                      <Icon
                        name={it.icon}
                        size={46}
                        color={chosen && decided > 0.5 ? C.accent : C.sub}
                        delay={(at[it.l] ?? 0) + 0.35 + i * 0.18}
                        motion={it.motion}
                      />
                    </div>
                  ) : null}
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
