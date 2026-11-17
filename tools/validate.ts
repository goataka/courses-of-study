/** データの整合性を検査する。問題があれば、場所と内容を文字列で返す。 */

import {
  CATEGORY_LABELS,
  NODE_KIND_LABELS,
  pageNodes,
  SCHEMA_VERSION,
  SUBJECT_IDS,
  subjectNodes,
  type Catalog,
  type CurriculumNode,
  type Dataset,
  type GradePage,
  type KanjiTable,
  type SubjectData,
} from './model.ts';

const CODE_PATTERN = /^[0-9A-Za-z]{16}$/;
const ID_SUFFIX_PATTERN = /^(?:-[A-Za-z0-9]+)+$/;
const SENTENCE_END = '。';
/** 重要語は文字か数字で始まり、文字か数字で終わる。記号で始めると Markdown の太字にならない。 */
const KEYWORD_PATTERN = /^[\p{L}\p{N}](?:.*[\p{L}\p{N}])?$/u;
const GOAL_ID_PART = 'goal';
const HANDLING_ID_PART = 'handling';
const PLANNING_ID_PART = 'planning';
const CATALOG_LOCATION = 'catalog';

/** title と text に使わない文字。ドキュメントルールと Markdown の書式を守るために禁止する。 */
const FORBIDDEN_CHARACTERS: ReadonlyMap<string, string> = new Map([
  ['（', '全角の開き括弧'],
  ['）', '全角の閉じ括弧'],
  ['，', '全角のコンマ'],
  ['*', 'アスタリスク'],
  ['`', 'バッククォート'],
  ['\n', '改行'],
]);

function problem(location: string, message: string): string {
  return `${location}: ${message}`;
}

function checkIdentity(node: CurriculumNode, parentId: string): string[] {
  const suffix = node.id.startsWith(parentId)
    ? node.id.slice(parentId.length)
    : '';
  const idProblems = ID_SUFFIX_PATTERN.test(suffix)
    ? []
    : [problem(node.id, `ID が「${parentId}-」で始まらない`)];
  const codeProblems = CODE_PATTERN.test(node.code)
    ? []
    : [problem(node.id, `コードの形式が不正：${node.code}`)];
  return [...idProblems, ...codeProblems];
}

function checkClassification(node: CurriculumNode): string[] {
  const kindProblems =
    node.kind in NODE_KIND_LABELS
      ? []
      : [problem(node.id, `未知の kind：${node.kind}`)];
  const hasKnownCategory =
    node.category === undefined || node.category in CATEGORY_LABELS;
  const categoryProblems = hasKnownCategory
    ? []
    : [problem(node.id, `未知の category：${node.category}`)];
  return [...kindProblems, ...categoryProblems];
}

function checkPresence(node: CurriculumNode): string[] {
  if (node.kind === 'section') {
    return node.title ? [] : [problem(node.id, 'section に title がない')];
  }
  const hasContent = Boolean(node.text) || (node.children ?? []).length > 0;
  return hasContent ? [] : [problem(node.id, 'text も children もない')];
}

function checkStyle(location: string, text: string): string[] {
  const forbidden = [...FORBIDDEN_CHARACTERS]
    .filter(([character]) => text.includes(character))
    .map(([, name]) => problem(location, `${name}を含む`));
  const ending = text.endsWith(SENTENCE_END)
    ? [problem(location, '末尾に「。」がある')]
    : [];
  return [...forbidden, ...ending];
}

function isWritten(keyword: string, written: readonly string[]): boolean {
  return written.some((value) => value.includes(keyword));
}

function checkKeywords(
  node: CurriculumNode,
  written: readonly string[],
): string[] {
  const keywords = node.keywords ?? [];
  const missing = keywords
    .filter((keyword) => !isWritten(keyword, written))
    .map((keyword) => `重要語が本文にない：${keyword}`);
  const malformed = keywords
    .filter((keyword) => !KEYWORD_PATTERN.test(keyword))
    .map(
      (keyword) =>
        `重要語が文字や数字で始まらない、または終わらない：${keyword}`,
    );
  return [...missing, ...malformed].map((message) => problem(node.id, message));
}

function checkWording(node: CurriculumNode): string[] {
  const written = [node.title, node.text].filter(
    (value) => value !== undefined,
  );
  const styleProblems = written.flatMap((value) => checkStyle(node.id, value));
  return [...styleProblems, ...checkKeywords(node, written)];
}

function checkNode(node: CurriculumNode, parentId: string): string[] {
  const own = [
    ...checkIdentity(node, parentId),
    ...checkClassification(node),
    ...checkPresence(node),
    ...checkWording(node),
  ];
  return [...own, ...checkNodes(node.children ?? [], node.id)];
}

function checkNodes(
  nodes: readonly CurriculumNode[],
  parentId: string,
): string[] {
  return nodes.flatMap((node) => checkNode(node, parentId));
}

function checkReferences(page: GradePage): string[] {
  const contentIds = new Set(
    pageNodes({ ...page, goals: [], handling: [] }).map((node) => node.id),
  );
  return pageNodes(page).flatMap((node) =>
    (node.refs ?? [])
      .filter((ref) => !contentIds.has(ref))
      .map((ref) => problem(node.id, `参照先が同じページの内容にない：${ref}`)),
  );
}

function checkPage(page: GradePage, expectedId: string | undefined): string[] {
  const identity =
    page.id === expectedId
      ? []
      : [problem(page.id, `カタログの ID と一致しない：${expectedId}`)];
  return [
    ...identity,
    ...checkNodes(page.goals, `${page.id}-${GOAL_ID_PART}`),
    ...checkNodes(page.contents, page.id),
    ...checkNodes(page.handling ?? [], `${page.id}-${HANDLING_ID_PART}`),
    ...checkReferences(page),
  ];
}

/** 学年別漢字配当表の字数と重複を検査する。 */
export function checkKanji(table: KanjiTable): string[] {
  const countProblems = table.grades
    .filter((grade) => [...grade.characters].length !== grade.count)
    .map((grade) =>
      problem(table.id, `第${grade.grade}学年の字数が count と一致しない`),
    );
  const total = table.grades.reduce((sum, grade) => sum + grade.count, 0);
  const totalProblems =
    total === table.total
      ? []
      : [problem(table.id, `total が字数の合計と一致しない：${total}`)];
  const all = table.grades.flatMap((grade) => [...grade.characters]);
  const duplicates = all.filter(
    (character, position) => all.indexOf(character) !== position,
  );
  const duplicateProblems = duplicates.map((character) =>
    problem(table.id, `漢字が重複している：${character}`),
  );
  return [...countProblems, ...totalProblems, ...duplicateProblems];
}

function checkSubject(data: SubjectData): string[] {
  const { subject, entry } = data;
  const identity =
    subject.id === entry.id
      ? []
      : [problem(subject.id, `カタログの ID と一致しない：${entry.id}`)];
  return [
    ...identity,
    ...checkNodes(subject.goals, `${subject.id}-${GOAL_ID_PART}`),
    ...checkNodes(subject.planning, `${subject.id}-${PLANNING_ID_PART}`),
    ...data.pages.flatMap((page, position) =>
      checkPage(page, entry.pages[position]?.id),
    ),
    ...(data.kanji ? checkKanji(data.kanji) : []),
  ];
}

function duplicated(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    (seen.has(value) ? repeated : seen).add(value);
  }
  return [...repeated];
}

function checkUniqueness(dataset: Dataset): string[] {
  const nodes = dataset.subjects.flatMap((data) => [
    ...subjectNodes(data.subject),
    ...data.pages.flatMap(pageNodes),
  ]);
  const ids = duplicated(nodes.map((node) => node.id)).map((id) =>
    problem(id, 'ID が重複している'),
  );
  const codes = duplicated(nodes.map((node) => node.code)).map((code) =>
    problem(code, 'コードが重複している'),
  );
  return [...ids, ...codes];
}

function catalogPaths(catalog: Catalog): string[] {
  return catalog.subjects.flatMap((subject) => [
    subject.path,
    ...subject.pages.map((page) => page.path),
  ]);
}

function checkCatalog(catalog: Catalog): string[] {
  const versionMatches = catalog.schemaVersion === SCHEMA_VERSION;
  const version = versionMatches
    ? []
    : [`schemaVersion が ${SCHEMA_VERSION} ではない`];
  const unknown = catalog.subjects
    .filter((subject) => !SUBJECT_IDS.includes(subject.id))
    .map((subject) => `未知の教科 ID：${subject.id}`);
  const repeated = duplicated(catalogPaths(catalog)).map(
    (path) => `パスが重複している：${path}`,
  );
  return [...version, ...unknown, ...repeated].map((message) =>
    problem(CATALOG_LOCATION, message),
  );
}

/** データ全体を検査する。問題がなければ空の配列を返す。 */
export function validateDataset(dataset: Dataset): string[] {
  return [
    ...checkCatalog(dataset.catalog),
    ...dataset.subjects.flatMap(checkSubject),
    ...checkUniqueness(dataset),
  ];
}
