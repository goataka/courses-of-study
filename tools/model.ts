/** data/ 配下の JSON が従う型。アプリからも同じ型を利用できる。 */

export const SCHEMA_VERSION = 1;

export const SUBJECT_IDS = [
  'japanese',
  'social-studies',
  'math',
  'science',
] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];

/** 資質・能力の三つの柱。値は学習指導要領での呼び名。 */
export const CATEGORY_LABELS = {
  knowledge: '知識及び技能',
  thinking: '思考力、判断力、表現力等',
  attitude: '学びに向かう力、人間性等',
} as const;
export type Category = keyof typeof CATEGORY_LABELS;

/** 項目の種別。値は説明用の呼び名。 */
export const NODE_KIND_LABELS = {
  section: '領域や単元などのまとまり',
  item: '身に付ける事項',
  activity: '数学的活動や言語活動の例',
  term: '用語、記号、人物名',
  goal: '目標',
  handling: '内容の取扱い',
  planning: '指導計画の作成と内容の取扱い',
} as const;
export type NodeKind = keyof typeof NODE_KIND_LABELS;

export interface CurriculumNode {
  /** リポジトリ内で一意なID。本文の項目番号から決まる。 */
  readonly id: string;
  /** 文部科学省の学習指導要領コード。 */
  readonly code: string;
  /** 本文の項目番号。番号がない項目は空文字。 */
  readonly no: string;
  readonly kind: NodeKind;
  /** まとまりの見出し。本文の語句から取る。 */
  readonly title?: string;
  /** 本文に沿って書き直した文。原文そのものではない。 */
  readonly text?: string;
  /** 本文で振り仮名が付く語の、振り仮名付き表記。 */
  readonly ruby?: string;
  readonly category?: Category;
  /** text に含まれる重要語。 */
  readonly keywords?: readonly string[];
  /** 内容の取扱いが対象とする内容のID。 */
  readonly refs?: readonly string[];
  readonly children?: readonly CurriculumNode[];
}

/** 一つの学年、または学年のまとまりの目標と内容。 */
export interface GradePage {
  readonly id: string;
  readonly subject: SubjectId;
  readonly grades: readonly number[];
  readonly name: string;
  readonly code: string;
  readonly goalsText?: string;
  readonly goals: readonly CurriculumNode[];
  readonly contents: readonly CurriculumNode[];
  readonly handling?: readonly CurriculumNode[];
}

/** 教科の目標と、指導計画の作成と内容の取扱い。 */
export interface Subject {
  readonly id: SubjectId;
  readonly name: string;
  readonly code: string;
  readonly section: string;
  readonly goalsText?: string;
  readonly goals: readonly CurriculumNode[];
  readonly planning: readonly CurriculumNode[];
}

export interface KanjiGrade {
  readonly grade: number;
  readonly code: string;
  readonly count: number;
  /** 配当漢字を別表の順に並べた文字列。 */
  readonly characters: string;
}

/** 学年別漢字配当表。 */
export interface KanjiTable {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly total: number;
  readonly grades: readonly KanjiGrade[];
}

export interface CatalogPage {
  readonly id: string;
  readonly grades: readonly number[];
  readonly name: string;
  /** data/ からの相対パス。 */
  readonly path: string;
}

export interface CatalogSubject {
  readonly id: SubjectId;
  readonly name: string;
  readonly path: string;
  readonly pages: readonly CatalogPage[];
  readonly kanji?: string;
}

export interface Source {
  readonly title: string;
  readonly notice: string;
  readonly url: string;
  readonly codeTable: string;
  readonly codeTableUrl: string;
  /** code を後ろに付けると、原文を確認できるURLになる。 */
  readonly codeBaseUrl: string;
}

/** data/catalog.json。データファイルの一覧と出典。 */
export interface Catalog {
  readonly schemaVersion: number;
  readonly source: Source;
  readonly subjects: readonly CatalogSubject[];
}

export interface SubjectData {
  readonly entry: CatalogSubject;
  readonly subject: Subject;
  readonly pages: readonly GradePage[];
  readonly kanji?: KanjiTable;
}

export interface Dataset {
  readonly catalog: Catalog;
  readonly subjects: readonly SubjectData[];
}

/** 木を行きがけ順にたどり、全ての項目を返す。 */
export function flattenNodes(
  nodes: readonly CurriculumNode[],
): CurriculumNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])]);
}

/** ページが持つ全ての項目を返す。 */
export function pageNodes(page: GradePage): CurriculumNode[] {
  return flattenNodes([
    ...page.goals,
    ...page.contents,
    ...(page.handling ?? []),
  ]);
}

/** 教科ファイルが持つ全ての項目を返す。 */
export function subjectNodes(subject: Subject): CurriculumNode[] {
  return flattenNodes([...subject.goals, ...subject.planning]);
}
