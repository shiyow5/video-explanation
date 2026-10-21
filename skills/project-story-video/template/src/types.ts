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
};

export type Kind =
  | "cover"
  | "chapter"
  | "bullets"
  | "stats"
  | "bars"
  | "flow"
  | "decision"
  | "docs";

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
