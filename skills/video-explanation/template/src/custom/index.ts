// 案件ごとの専用の場面。台本では "kind": "custom:<名前>" で使う。
// 作り方は references/custom-scenes.md（KindProps を受け取り、at[] の時刻に合わせて動かす）
import React from "react";
import { KindProps } from "../layout";
import { UnitGrid } from "./UnitGrid";

export const CUSTOM_KINDS: Record<string, React.FC<KindProps>> = {
  UnitGrid,
};
