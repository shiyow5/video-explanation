// 台本（scripts/*.json）の形。書き方は references/script-format.md を参照

export type Item = {
  t?: string;
  s?: string;
  v?: number;
  d?: number;
  pre?: string;
  suf?: string;
  label?: string;
  // この項目を出す文の番号（lines の添字）
  l: number;
  c?: string;
  // decision: 選ばれた候補。docs: 日付と作成者
  chosen?: boolean;
  date?: string;
  who?: string;
  // アイコン（Lucide の名前か custom:<名前>）と、その動き
  icon?: string;
  motion?: "draw" | "pop" | "pulse" | "spin" | "bounce" | "none";
  // diagram: 何列目に置くか（0 から）と、線でつなぐ先の項目の番号
  g?: number;
  to?: number[];
  // timeline: 期間（YYYY-MM）と、その時点ではまだ予定だったか
  start?: string;
  end?: string;
  plan?: boolean;
};

export type BasicKind =
  | "cover"
  | "chapter"
  | "bullets"
  | "stats"
  | "bars"
  | "flow"
  | "decision"
  | "docs";

export type ChartKind = "ratio" | "compare" | "diagram" | "timeline" | "icons";

// custom:<名前> は src/custom/index.ts に登録した、案件ごとの専用の場面
export type Kind = BasicKind | ChartKind | `custom:${string}`;

export type SceneDef = {
  id: string;
  // 上部の進み具合で何段目か（0 は表示しない）
  stage: number;
  // その場面の内容が、いつの時点までの情報か（YYYY-MM）。未来の情報を出さない確認に使う
  asof?: string;
  // まとめなど、終わった時点から振り返る場面
  retrospective?: boolean;
  kind: Kind;
  label?: string;
  title: string;
  period?: string;
  source?: string;
  // 個人の作業なら担当者の名前
  owner?: string;
  note?: string;
  credits?: boolean;
  unit?: string;
  max?: number;
  suffix?: string;
  items?: Item[];
  // decision の問い・理由・決めた主体と、理由を読む文の番号
  question?: string;
  reason?: string;
  by?: string;
  rl?: number;
  // compare: rl の文で押すスタンプの文字（「ほぼ変化なし」など）
  stamp?: string;
  // timeline: 横軸の始まりと終わり（YYYY-MM）
  from?: string;
  to?: string;
  lines: { text: string; say?: string }[];
};

export type Script = {
  speaker: number;
  speedScale: number;
  stages: string[];
  // 作成者・決めた主体ごとの色の名前（theme.ts の COLORS のキー）
  actors?: Record<string, string>;
  credits?: string[];
  scenes: SceneDef[];
};
