/** 学年ページの Markdown を作る。 */

import {
  codeLink,
  generatedNotice,
  headerLines,
  inlineCode,
  renderDocument,
  topSection,
  type Block,
} from './document.ts';
import {
  bold,
  bullet,
  labelled,
  labelledText,
  link,
  slug,
} from './markdown.ts';
import type {
  CatalogPage,
  CurriculumNode,
  GradePage,
  Source,
  SubjectData,
} from './model.ts';
import {
  dataDisplayPath,
  dataLink,
  pageDocumentName,
  SUBJECT_INDEX_FILE,
} from './paths.ts';
import {
  renderCategorized,
  renderNode,
  renderTermList,
} from './render-node.ts';

const GOALS_TITLE = '目標';
const CONTENTS_TITLE = '内容';
const HANDLING_TITLE = '内容の取扱い';
const WHOLE_LABEL = '全体';
const LEAD_LABEL = '前文';
const TARGET_LABEL = '対象';
const CONTENT_SECTION_LEVEL = 3;
const LIST_SEPARATOR = '、';

export interface PageContext {
  readonly page: GradePage;
  readonly data: SubjectData;
  readonly source: Source;
}

interface HandlingNote {
  readonly label: string;
  readonly refs: readonly string[];
}

/** 本文の番号を上位から連ねた表示名。例は「A(3)ア(ウ)」。 */
function contentLabels(
  nodes: readonly CurriculumNode[],
  parentLabel = '',
): Map<string, string> {
  const labels = new Map<string, string>();
  for (const node of nodes) {
    const label = parentLabel + node.no;
    labels.set(node.id, label);
    contentLabels(node.children ?? [], label).forEach((value, key) =>
      labels.set(key, value),
    );
  }
  return labels;
}

function handlingNotes(
  nodes: readonly CurriculumNode[],
  parentLabel = '',
): HandlingNote[] {
  return nodes.flatMap((node) => {
    const label = parentLabel + node.no;
    return [
      { label, refs: node.refs ?? [] },
      ...handlingNotes(node.children ?? [], label),
    ];
  });
}

function isSection(node: CurriculumNode): boolean {
  return node.kind === 'section';
}

function sectionTitle(parentNo: string, node: CurriculumNode): string {
  return [parentNo + node.no, node.title ?? '']
    .filter((part) => part.length > 0)
    .join(' ');
}

function sectionMetadata(node: CurriculumNode, source: Source): string[] {
  const lead = node.text
    ? labelledText(0, LEAD_LABEL, node.text, node.keywords ?? [])
    : [];
  return [
    ...headerLines([
      ['ID', inlineCode(node.id)],
      ['コード', codeLink(source, node.code)],
    ]),
    ...lead,
  ];
}

function sectionItems(children: readonly CurriculumNode[]): string[] {
  const allTerms =
    children.length > 0 && children.every((child) => child.kind === 'term');
  return allTerms
    ? renderTermList(children, 0)
    : renderCategorized(children, 0);
}

function refersTo(
  note: HandlingNote,
  section: CurriculumNode,
  coversItems: boolean,
): boolean {
  return note.refs.some(
    (ref) =>
      ref === section.id || (coversItems && ref.startsWith(`${section.id}-`)),
  );
}

function handlingPointer(
  section: CurriculumNode,
  notes: readonly HandlingNote[],
  coversItems: boolean,
): string[] {
  const labels = notes
    .filter((note) => refersTo(note, section, coversItems))
    .map((note) => note.label);
  if (labels.length === 0) {
    return [];
  }
  const target = `#${slug(HANDLING_TITLE)}`;
  return [
    bullet(
      0,
      labelled(HANDLING_TITLE, link(labels.join(LIST_SEPARATOR), target)),
    ),
  ];
}

interface HandlingEnvironment {
  readonly depth: number;
  /** 内容のIDから、本文の番号を連ねた表示名を引く。 */
  readonly labels: ReadonlyMap<string, string>;
}

interface SectionEnvironment {
  readonly source: Source;
  readonly notes: readonly HandlingNote[];
}

/** 見出しの深さと、上位のまとまりの番号。 */
interface SectionPlace {
  readonly parentNo: string;
  readonly level: number;
}

function sectionBlock(
  node: CurriculumNode,
  place: SectionPlace,
  env: SectionEnvironment,
): Block {
  const children = node.children ?? [];
  const isUnit = !children.some(isSection);
  const items = children.filter((child) => !isSection(child));
  const title = sectionTitle(place.parentNo, node);
  const lines = [
    ...sectionMetadata(node, env.source),
    ...sectionItems(items),
    ...handlingPointer(node, env.notes, isUnit),
  ];
  return { heading: { level: place.level, title }, lines };
}

function sectionBlocks(
  node: CurriculumNode,
  place: SectionPlace,
  env: SectionEnvironment,
): Block[] {
  const inner: SectionPlace = { parentNo: node.no, level: place.level + 1 };
  const subsections = (node.children ?? []).filter(isSection);
  const nested = subsections.flatMap((child) =>
    sectionBlocks(child, inner, env),
  );
  return [sectionBlock(node, place, env), ...nested];
}

function goalsBlock(page: GradePage): Block {
  const whole = page.goalsText
    ? labelledText(0, WHOLE_LABEL, page.goalsText)
    : [];
  return topSection(GOALS_TITLE, [
    ...whole,
    ...page.goals.flatMap((goal) => renderNode(goal, 0)),
  ]);
}

function sameRefs(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((ref, position) => ref === right[position])
  );
}

function handlingTarget(
  node: CurriculumNode,
  parentRefs: readonly string[],
  env: HandlingEnvironment,
): string[] {
  const refs = node.refs ?? [];
  if (refs.length === 0 || sameRefs(refs, parentRefs)) {
    return [];
  }
  const targets = refs
    .map((ref) => env.labels.get(ref) ?? ref)
    .join(LIST_SEPARATOR);
  return [bullet(env.depth + 1, labelled(TARGET_LABEL, targets))];
}

function handlingChildren(
  node: CurriculumNode,
  env: HandlingEnvironment,
): string[] {
  const children = node.children ?? [];
  if (children.length > 0 && children.every((child) => child.kind === 'term')) {
    return renderTermList(children, env.depth + 1);
  }
  const inner: HandlingEnvironment = { ...env, depth: env.depth + 1 };
  return children.flatMap((child) =>
    renderHandling(child, node.refs ?? [], inner),
  );
}

/** 内容の取扱い1件を箇条書きにする。対象が親と同じ場合は、対象を省く。 */
function renderHandling(
  node: CurriculumNode,
  parentRefs: readonly string[],
  env: HandlingEnvironment,
): string[] {
  const own = node.text
    ? labelledText(env.depth, node.no, node.text, node.keywords ?? [])
    : [bullet(env.depth, bold(node.no))];
  return [
    ...own,
    ...handlingTarget(node, parentRefs, env),
    ...handlingChildren(node, env),
  ];
}

function handlingBlocks(page: GradePage): Block[] {
  const handling = page.handling ?? [];
  if (handling.length === 0) {
    return [];
  }
  const env: HandlingEnvironment = {
    depth: 0,
    labels: contentLabels(page.contents),
  };
  return [
    topSection(
      HANDLING_TITLE,
      handling.flatMap((node) => renderHandling(node, [], env)),
    ),
  ];
}

function neighbourEntries(
  page: GradePage,
  pages: readonly CatalogPage[],
): [string, string][] {
  const position = pages.findIndex((candidate) => candidate.id === page.id);
  const toEntry = (
    label: string,
    neighbour: CatalogPage | undefined,
  ): [string, string][] =>
    neighbour
      ? [[label, link(neighbour.name, pageDocumentName(neighbour))]]
      : [];
  return [
    ...toEntry('前の学年', pages[position - 1]),
    ...toEntry('次の学年', pages[position + 1]),
  ];
}

function pageHeader(context: PageContext): string[] {
  const { page, data, source } = context;
  const entry = data.entry.pages.find((candidate) => candidate.id === page.id);
  const dataPath = entry?.path ?? '';
  return headerLines([
    ['ID', inlineCode(page.id)],
    ['データ', link(dataDisplayPath(dataPath), dataLink(dataPath))],
    ['コード', codeLink(source, page.code)],
    [
      '出典',
      `${link(source.title, source.url)} ${data.subject.section} ${data.subject.name}`,
    ],
    ['上位ページ', link(data.subject.name, SUBJECT_INDEX_FILE)],
    ...neighbourEntries(page, data.entry.pages),
    ['生成', generatedNotice('データ', dataLink(dataPath))],
  ]);
}

/** 学年ページを Markdown にする。 */
export function renderGradePage(context: PageContext): string {
  const { page, data, source } = context;
  const env: SectionEnvironment = {
    source,
    notes: handlingNotes(page.handling ?? []),
  };
  const place: SectionPlace = { parentNo: '', level: CONTENT_SECTION_LEVEL };
  const contents = page.contents.flatMap((node) =>
    sectionBlocks(node, place, env),
  );
  return renderDocument({
    title: `${data.subject.name}：${page.name}`,
    header: pageHeader(context),
    blocks: [
      goalsBlock(page),
      topSection(CONTENTS_TITLE, []),
      ...contents,
      ...handlingBlocks(page),
    ],
  });
}
