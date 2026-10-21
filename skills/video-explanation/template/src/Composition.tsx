import { Composition } from "remotion";
import { IconPreview } from "./IconPreview";
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
      <Composition
        id="IconPreview"
        component={IconPreview}
        defaultProps={{ names: ["database", "file-text", "custom:report"] }}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
