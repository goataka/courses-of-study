/** 音訓の割り振りのページを読み取り、字数、配当学年、段階ごとの件数を検査する。 */

import type { KanjiTable } from './kanji.ts';
import type { MarkdownFile } from './links.ts';

/** 小学校の学年別ページの表 */
const GRADE_PAGE_HEADER = '| 漢字 | 音訓 |';
/** 中学校、高等学校のページの表 */
const STAGE_PAGE_HEADER = '| 漢字 | 配当学年 | 音訓 |';
const GRADE = /^(?:([1-6])(\(改\))?)?$/;
const READING =
  /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+(\(特\))?(\(改\))?$/u;
const COUNT_LINE = /^- \*\*字数\*\*：(\d+)字$/m;
const TOTAL_LINE = /^- \*\*漢字\*\*：(\d+)字$/m;
const READING_TOTAL_LINE = /^- \*\*音訓\*\*：(\d+)$/m;
const CELL_SEPARATOR = '|';
const READING_SEPARATOR = '、';

export const STAGES = ['小学校', '中学校', '高等学校'] as const;
export type Stage = (typeof STAGES)[number];

export interface OnkunRow {
  readonly kanji: string;
  /** 中学校、高等学校のページの配当学年。学年別ページでは持たない */
  readonly grade: number | undefined;
  readonly readings: string[];
}

export interface OnkunPage {
  readonly kind: 'grade' | 'stage';
  readonly rows: OnkunRow[];
  readonly problems: string[];
}

function cellsOf(line: string): string[] {
  return line
    .split(CELL_SEPARATOR)
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function parseRow(
  path: string,
  line: string,
  kind: OnkunPage['kind'],
): { row?: OnkunRow; problems: string[] } {
  const cells = cellsOf(line);
  const [kanji = '', grade = '', readingCell = ''] =
    kind === 'stage' ? cells : [cells[0], '', cells[1]];
  const gradeMatch = GRADE.exec(grade);
  const width = kind === 'stage' ? 3 : 2;
  if ([...kanji].length !== 1 || !gradeMatch || cells.length !== width) {
    return { problems: [`${path}: 表の行の形が正しくない：${line}`] };
  }
  const readings =
    readingCell === '' ? [] : readingCell.split(READING_SEPARATOR);
  const problems = readings
    .filter((reading) => !READING.test(reading))
    .map((reading) => `${path}: 音訓の形が正しくない：${reading}`);
  if (kind === 'stage' && readings.length === 0) {
    problems.push(`${path}: 音訓がない：${kanji}`);
  }
  const value = gradeMatch[1];
  return {
    row: { kanji, grade: value ? Number(value) : undefined, readings },
    problems,
  };
}

/** 表のページから行を読み取る。読み取れない行は問題として返す。 */
export function parseOnkunPage(file: MarkdownFile): OnkunPage {
  const lines = file.content.split('\n');
  const kind = lines.includes(STAGE_PAGE_HEADER) ? 'stage' : 'grade';
  const start = lines.indexOf(
    kind === 'stage' ? STAGE_PAGE_HEADER : GRADE_PAGE_HEADER,
  );
  if (start < 0) {
    return { kind, rows: [], problems: [`${file.path}: 表の見出し行がない`] };
  }
  const rows: OnkunRow[] = [];
  const problems: string[] = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith(CELL_SEPARATOR)) {
      break;
    }
    const parsed = parseRow(file.path, line, kind);
    problems.push(...parsed.problems);
    if (parsed.row) {
      rows.push(parsed.row);
    }
  }
  const count = COUNT_LINE.exec(file.content)?.[1];
  if (count !== undefined && Number(count) !== rows.length) {
    problems.push(
      `${file.path}: 字数が${count}字で、表の${rows.length}字と一致しない`,
    );
  }
  return { kind, rows, problems };
}

export interface OnkunSet {
  readonly readme: MarkdownFile;
  /** 小学校の学年別ページ。キーは学年 */
  readonly grades: ReadonlyMap<number, readonly OnkunRow[]>;
  /** 中学校、高等学校のページの行 */
  readonly stages: ReadonlyMap<Stage, readonly OnkunRow[]>;
}

function stageCount(readme: MarkdownFile, stage: Stage): number | undefined {
  const match = new RegExp(`^ {2}- ${stage}：(\\d+)$`, 'm').exec(
    readme.content,
  );
  return match ? Number(match[1]) : undefined;
}

function checkTotals(set: OnkunSet): string[] {
  const problems: string[] = [];
  const rowsByStage = new Map<Stage, readonly OnkunRow[]>([
    ['小学校', [...set.grades.values()].flat()],
    ...set.stages,
  ]);
  let readingTotal = 0;
  const kanji = new Set<string>();
  for (const stage of STAGES) {
    const rows = rowsByStage.get(stage) ?? [];
    const readings = rows.reduce((sum, row) => sum + row.readings.length, 0);
    readingTotal += readings;
    rows.forEach((row) => kanji.add(row.kanji));
    const expected = stageCount(set.readme, stage);
    if (expected !== readings) {
      problems.push(
        `${stage}の音訓が${String(expected)}で、表の${readings}と一致しない`,
      );
    }
  }
  const total = TOTAL_LINE.exec(set.readme.content)?.[1];
  if (Number(total) !== kanji.size) {
    problems.push(
      `漢字が${String(total)}字で、表の${kanji.size}字と一致しない`,
    );
  }
  const expectedReadings = READING_TOTAL_LINE.exec(set.readme.content)?.[1];
  if (Number(expectedReadings) !== readingTotal) {
    problems.push(
      `音訓が${String(expectedReadings)}で、表の${readingTotal}と一致しない`,
    );
  }
  return problems;
}

function checkGradePages(set: OnkunSet, table: KanjiTable): string[] {
  return table.grades.flatMap((grade) => {
    const rows = set.grades.get(grade.grade);
    if (!rows) {
      return [`第${grade.grade}学年のページがない`];
    }
    const order = rows.map((row) => row.kanji).join('');
    return order === grade.characters.join('')
      ? []
      : [`第${grade.grade}学年のページの漢字が、配当表の並びと一致しない`];
  });
}

function checkStagePages(set: OnkunSet, table: KanjiTable): string[] {
  const grades = new Map<string, number>();
  for (const grade of table.grades) {
    for (const character of grade.characters) {
      grades.set(character, grade.grade);
    }
  }
  const problems: string[] = [];
  for (const [stage, rows] of set.stages) {
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.kanji)) {
        problems.push(`${stage}のページで漢字が重複している：${row.kanji}`);
      }
      seen.add(row.kanji);
      if (row.grade !== grades.get(row.kanji)) {
        problems.push(
          `${stage}のページの${row.kanji}の配当学年が${String(row.grade)}で、配当表の${String(grades.get(row.kanji))}と一致しない`,
        );
      }
    }
  }
  return problems;
}

/** 段階ごとの件数、学年別ページの並び、配当学年の一致を確かめる。 */
export function checkOnkun(set: OnkunSet, table: KanjiTable): string[] {
  return [
    ...checkTotals(set),
    ...checkGradePages(set, table),
    ...checkStagePages(set, table),
  ];
}
