import { Composition } from "remotion";
import { Story, storyFrames } from "./Story";
import { STORIES } from "./stories";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const MyComposition = () => {
  return (
    <>
      {STORIES.map((s) => (
        <Composition
          key={s.id}
          id={s.id}
          component={Story}
          defaultProps={{ storyId: s.id }}
          durationInFrames={Math.max(1, storyFrames(s))}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      ))}
    </>
  );
};
