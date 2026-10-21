// 自作のアイコン。台本では "icon": "custom:<名前>" で使う。
// Lucide と並べて違和感がないよう、viewBox 0 0 24 24、線だけで描き（fill なし）、
// 線の太さと角の丸めは親の <svg> から受け継ぐ。描き方は references/diagrams-and-icons.md。
import React from "react";

export type CustomIcon = React.FC;

// 資料（棒グラフ入りの報告書）
const Report: CustomIcon = () => (
  <>
    <path d="M6 2h9l4 4v16H6z" />
    <path d="M15 2v4h4" />
    <path d="M9 18v-3" />
    <path d="M12.5 18v-6" />
    <path d="M16 18v-4" />
  </>
);

// 判断の分かれ道（1本が2本に分かれる）
const Fork: CustomIcon = () => (
  <>
    <path d="M12 22v-8" />
    <path d="M12 14 6 6" />
    <path d="m12 14 6-8" />
    <path d="M3 7l3-3 3 3" />
    <path d="M15 7l3-3 3 3" />
  </>
);

export const CUSTOM_ICONS: Record<string, CustomIcon> = {
  report: Report,
  fork: Fork,
};
