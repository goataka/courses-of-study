/** 学年別漢字配当表の Markdown を作る。 */

import {
  codeLink,
  generatedNotice,
  headerLines,
  inlineCode,
  renderDocument,
  topSection,
  type Block,
} from './document.ts';
import { bold, bullet, labelled, link } from './markdown.ts';
import type { KanjiGrade, KanjiTable, Source, SubjectData } from './model.ts';
import { dataDisplayPath, dataLink, SUBJECT_INDEX_FILE } from './paths.ts';

const CHARACTERS_PER_ROW = 20;
const TABLE_SECTION_NAME = '別表';
const LABEL_SEPARATOR = '：';

function countLabel(count: number): string {
  return `${count}字`;
}

function gradeName(grade: number): string {
  return `第${grade}学年`;
}

/** 文字列を決まった字数ごとの行に分ける。 */
export function splitRows(characters: string, rowLength: number): string[] {
  const all = [...characters];
  const rowCount = Math.ceil(all.length / rowLength);
  return Array.from({ length: rowCount }, (_, row) =>
    all.slice(row * rowLength, (row + 1) * rowLength).join(''),
  );
}

function cumulativeCount(table: KanjiTable, grade: KanjiGrade): number {
  const upToGrade = table.grades.filter(
    (candidate) => candidate.grade <= grade.grade,
  );
  return upToGrade.reduce((sum, candidate) => sum + candidate.count, 0);
}

function gradeBlock(
  table: KanjiTable,
  grade: KanjiGrade,
  source: Source,
): Block {
  const rows = splitRows(grade.characters, CHARACTERS_PER_ROW).map((row) =>
    bullet(1, row),
  );
  return topSection(gradeName(grade.grade), [
    bullet(0, labelled('字数', countLabel(grade.count))),
    bullet(0, labelled('累計', countLabel(cumulativeCount(table, grade)))),
    bullet(0, labelled('コード', codeLink(source, grade.code))),
    bullet(0, bold('漢字')),
    ...rows,
  ]);
}

function kanjiHeader(
  table: KanjiTable,
  data: SubjectData,
  source: Source,
): string[] {
  const dataPath = data.entry.kanji ?? '';
  const section = `${data.subject.section} ${data.subject.name} ${TABLE_SECTION_NAME}`;
  return headerLines([
    ['ID', inlineCode(table.id)],
    ['データ', link(dataDisplayPath(dataPath), dataLink(dataPath))],
    ['コード', codeLink(source, table.code)],
    ['出典', `${link(source.title, source.url)} ${section}`],
    ['上位ページ', link(data.subject.name, SUBJECT_INDEX_FILE)],
    ['総字数', countLabel(table.total)],
    ['並び', '別表の掲載順'],
    ['生成', generatedNotice('データ', dataLink(dataPath))],
  ]);
}

/** 学年別漢字配当表を Markdown にする。 */
export function renderKanji(
  table: KanjiTable,
  data: SubjectData,
  source: Source,
): string {
  return renderDocument({
    title: `${data.subject.name}${LABEL_SEPARATOR}${table.name}`,
    header: kanjiHeader(table, data, source),
    blocks: table.grades.map((grade) => gradeBlock(table, grade, source)),
  });
}
