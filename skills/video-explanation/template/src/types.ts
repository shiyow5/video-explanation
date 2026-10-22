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
  // equation: 説明する項（LaTeX）
  tex?: string;
  // table: 1行分のセル（columns と同じ数）
  cells?: string[];
  // figure: 注目する部分の枠（画像に対する割合 0〜100: [左, 上, 幅, 高さ]）
  box?: [number, number, number, number];
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

// 論文の解説で使う場面
export type PaperKind = "equation" | "table" | "figure";

// custom:<名前> は src/custom/index.ts に登録した、案件ごとの専用の場面
export type Kind = BasicKind | ChartKind | PaperKind | `custom:${string}`;

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
  // equation: 式全体（LaTeX）
  tex?: string;
  // table: 列の見出し
  columns?: string[];
  // figure: public/ の中の画像、クレジット、ライセンス
  image?: string;
  credit?: string;
  license?: string;
  // 著者の主張ではなく、解説する側の解釈や見方の場面
  interpretation?: boolean;
  // この場面で初めて出る専門用語・固有名詞（glossary か names の名前）。画面に説明の札が出る
  terms?: string[];
  lines: { text: string; say?: string }[];
};

export type Script = {
  // history: 経緯・進捗（時間の順）。paper: 論文の解説
  mode?: "history" | "paper";
  // true なら上部の進み具合で、まだ来ていない段階の名前も見せる（paper では既定で見せる）
  revealStages?: boolean;
  // paper: 解説する論文の情報（点検で url を確かめる）
  paper?: { title: string; authors: string; venue?: string; url: string };
  speaker: number;
  speedScale: number;
  stages: string[];
  // 作成者・決めた主体ごとの色の名前（theme.ts の COLORS のキー）
  actors?: Record<string, string>;
  // 専門用語 → 短い説明。用語は置き換えずにそのまま使う
  glossary?: Record<string, string>;
  // 固有名詞（手法・モデル・データセットなどの名前）→ 何の名前か（what）と説明（desc）
  names?: Record<string, { what: string; desc: string }>;
  // この動画だけの読み替え（[元の語, 読み]）。固有名詞の読みなど
  // （JSON から読むと組の長さが型に残らないので string[][] にしておく）
  readings?: string[][];
  credits?: string[];
  scenes: SceneDef[];
};
