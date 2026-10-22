// 台本の kind から場面の部品を選ぶ
import React from "react";
import { CHART_KINDS } from "./charts";
import { CUSTOM_KINDS } from "./custom";
import { BASIC_KINDS } from "./kinds";
import { KindProps } from "./layout";
import { PAPER_KINDS } from "./paper";
import { Kind } from "./types";

const BUILT_IN: Record<string, React.FC<KindProps>> = {
  ...BASIC_KINDS,
  ...CHART_KINDS,
  ...PAPER_KINDS,
};

export const kindComponent = (kind: Kind): React.FC<KindProps> => {
  const found = kind.startsWith("custom:")
    ? CUSTOM_KINDS[kind.slice(7)]
    : BUILT_IN[kind];
  if (!found) {
    throw new Error(
      `場面の種類 ${kind} がありません（専用の場面は src/custom/index.ts に登録する）`,
    );
  }
  return found;
};
