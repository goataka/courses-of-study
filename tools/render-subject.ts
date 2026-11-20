/** 教科ページと、指導計画ページの Markdown を作る。 */

import {
  codeLink,
  generatedNotice,
  headerLines,
  inlineCode,
  renderDocument,
  topSection,
  type Block,
} from './document.ts';
import { bold, bullet, labelledText, link } from './markdown.ts';
import type {
  CurriculumNode,
  GradePage,
  Source,
  SubjectData,
} from './model.ts';
import {
  dataDisplayPath,
  dataLink,
  KANJI_FILE,
  pageDocumentName,
  PLANNING_FILE,
  rootLink,
  SUBJECT_INDEX_FILE,
} from './paths.ts';
import { renderNode } from './render-node.ts';

const SUBJECT_GOALS_TITLE = '教科の目標';
const PAGES_TITLE = '学年別ページ';
const RELATED_TITLE = '関連ページ';
const PLANNING_TITLE = '指導計画の作成と内容の取扱い';
const KANJI_TITLE = '学年別漢字配当表';
const PLANNING_SECTION_TITLE = '配慮する事項';
const WHOLE_LABEL = '全体';
const ROOT_README = 'README.md';
const ROOT_LABEL = 'トップ';
const TITLE_SEPARATOR = '、';
const LABEL_SEPARATOR = '：';

function sectionSummary(section: CurriculumNode): string {
  const label = [section.no, section.title ?? '']
    .filter((part) => part.length > 0)
    .join(' ');
  const units = (section.children ?? []).filter(
    (child) => child.kind === 'section',
  );
  if (units.length === 0) {
    return label;
  }
  return `${label}${LABEL_SEPARATOR}${units.map((unit) => unit.title ?? '').join(TITLE_SEPARATOR)}`;
}

function pageSummary(page: GradePage, documentName: string): string[] {
  const head = bullet(0, bold(link(page.name, documentName)));
  return [
    head,
    ...page.contents.map((section) => bullet(1, sectionSummary(section))),
  ];
}

function pagesBlock(data: SubjectData): Block {
  const lines = data.pages.flatMap((page, position) => {
    const entry = data.entry.pages[position];
    return entry ? pageSummary(page, pageDocumentName(entry)) : [];
  });
  return topSection(PAGES_TITLE, lines);
}

function goalsBlock(data: SubjectData): Block {
  const { subject } = data;
  const whole = subject.goalsText
    ? labelledText(0, WHOLE_LABEL, subject.goalsText)
    : [];
  return topSection(SUBJECT_GOALS_TITLE, [
    ...whole,
    ...subject.goals.flatMap((goal) => renderNode(goal, 0)),
  ]);
}

function relatedBlock(data: SubjectData): Block {
  const planning = bullet(0, bold(link(PLANNING_TITLE, PLANNING_FILE)));
  const kanji = data.kanji
    ? [bullet(0, bold(link(KANJI_TITLE, KANJI_FILE)))]
    : [];
  return topSection(RELATED_TITLE, [planning, ...kanji]);
}

function sourceEntry(data: SubjectData, source: Source): [string, string] {
  return [
    '出典',
    `${link(source.title, source.url)} ${data.subject.section} ${data.subject.name}`,
  ];
}

function subjectHeader(
  data: SubjectData,
  source: Source,
  parent: [string, string],
): string[] {
  const dataPath = data.entry.path;
  return headerLines([
    ['ID', inlineCode(data.subject.id)],
    ['データ', link(dataDisplayPath(dataPath), dataLink(dataPath))],
    ['コード', codeLink(source, data.subject.code)],
    sourceEntry(data, source),
    parent,
    ['生成', generatedNotice('データ', dataLink(dataPath))],
  ]);
}

/** 教科ページを Markdown にする。教科の目標と、学年別ページへの案内を載せる。 */
export function renderSubjectIndex(data: SubjectData, source: Source): string {
  return renderDocument({
    title: data.subject.name,
    header: subjectHeader(data, source, [
      '上位ページ',
      link(ROOT_LABEL, rootLink(ROOT_README)),
    ]),
    blocks: [goalsBlock(data), pagesBlock(data), relatedBlock(data)],
  });
}

/** 指導計画の作成と内容の取扱いを Markdown にする。 */
export function renderPlanning(data: SubjectData, source: Source): string {
  const lines = data.subject.planning.flatMap((node) => renderNode(node, 0));
  return renderDocument({
    title: `${data.subject.name}${LABEL_SEPARATOR}${PLANNING_TITLE}`,
    header: subjectHeader(data, source, [
      '上位ページ',
      link(data.subject.name, SUBJECT_INDEX_FILE),
    ]),
    blocks: [topSection(PLANNING_SECTION_TITLE, lines)],
  });
}
