// 動画ごとの台本・音声の秒数一覧・BGM。短編と長編を作るときは、ここに1行ずつ足す
import sampleScript from "../scripts/narration.json";
import sampleManifest from "./voice-manifest.json";
import { Manifest } from "./theme";
import { Script } from "./types";

export type StoryDef = {
  id: string;
  script: Script;
  manifest: Manifest;
  bgm: string;
  bgmVolume: number;
};

export const STORIES: StoryDef[] = [
  {
    id: "ProjectStory",
    script: sampleScript as Script,
    manifest: sampleManifest as Manifest,
    bgm: "bgm.wav",
    bgmVolume: 0.14,
  },
];
