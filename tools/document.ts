/** 生成ドキュメントの共通の骨組み。題名、冒頭の情報、目次、本文の順に並べる。 */

import {
  bullet,
  headingLine,
  joinBlocks,
  labelled,
  link,
  tableOfContents,
  type Heading,
} from './markdown.ts';
import type { Source } from './model.ts';

const TITLE_LEVEL = 1;
const TOP_SECTION_LEVEL = 2;
const TABLE_OF_CONTENTS_TITLE = '目次';

/** 見出しと、その下に置く行のまとまり。 */
export interface Block {
  readonly heading?: Heading;
  readonly lines: readonly string[];
}

export interface DocumentParts {
  readonly title: string;
  readonly header: readonly string[];
  readonly blocks: readonly Block[];
}

export function topSection(title: string, lines: readonly string[]): Block {
  return { heading: { level: TOP_SECTION_LEVEL, title }, lines };
}

function blockLines(block: Block): string[][] {
  const heading = block.heading ? [headingLine(block.heading)] : [];
  return [heading, [...block.lines]];
}

/** 題名、冒頭の情報、目次、本文をまとめて Markdown にする。 */
export function renderDocument(parts: DocumentParts): string {
  const headings = parts.blocks.flatMap((block) =>
    block.heading ? [block.heading] : [],
  );
  return joinBlocks([
    [headingLine({ level: TITLE_LEVEL, title: parts.title })],
    parts.header,
    [headingLine({ level: TOP_SECTION_LEVEL, title: TABLE_OF_CONTENTS_TITLE })],
    tableOfContents(headings),
    ...parts.blocks.flatMap(blockLines),
  ]);
}

/** 「ラベル：値」の行を冒頭の情報として並べる。 */
export function headerLines(
  entries: readonly (readonly [string, string])[],
): string[] {
  return entries.map(([label, value]) => bullet(0, labelled(label, value)));
}

export function codeLink(source: Source, code: string): string {
  return link(code, `${source.codeBaseUrl}${code}`);
}

export function inlineCode(text: string): string {
  return `\`${text}\``;
}

/** 生成物であることと、編集先を示す行の値。 */
export function generatedNotice(dataLabel: string, dataTarget: string): string {
  return `自動生成のため、${link(dataLabel, dataTarget)} を編集して再生成する`;
}
