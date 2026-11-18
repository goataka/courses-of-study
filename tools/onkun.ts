/** 音訓の割り振りの表を読み取り、字数、配当学年、学年別ページとの一致を検査する。 */

import type { KanjiTable } from './kanji.ts';
import type { MarkdownFile } from './links.ts';

const HEADER = '| 漢字 | 学年 | 小学校 | 中学校 | 高等学校 |';
/** 学年別ページは学年の列を持たない */
const GRADE_PAGE_HEADER = '| 漢字 | 小学校 | 中学校 | 高等学校 |';
const STAGES = ['小学校', '中学校', '高等学校'] as const;
const GRADE = /^(?:([1-6])(\(改\))?)?$/;
const READING =
  /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+(\(特\))?(\(改\))?$/u;
const COUNT_LINE = /^- \*\*字数\*\*：(\d+)字$/m;
const TOTAL_LINE = /^- \*\*漢字\*\*：(\d+)字$/m;
const READING_TOTAL_LINE = /^- \*\*音訓\*\*：(\d+)$/m;
const CELL_SEPARATOR = '|';
const READING_SEPARATOR = '、';

export interface OnkunKanji {
  readonly kanji: string;
  readonly grade: number | undefined;
  /** 段階と音訓を、ページをまたいで比べるための文字列 */
  readonly signature: string;
  readonly readings: { stage: string; reading: string }[];
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
  withGrade: boolean,
): { item?: OnkunKanji; problems: string[] } {
  const cells = cellsOf(line);
  const kanji = cells[0] ?? '';
  const grade = withGrade ? (cells[1] ?? '') : '';
  const stages = cells.slice(withGrade ? 2 : 1);
  const gradeMatch = GRADE.exec(grade);
  if ([...kanji].length !== 1 || !gradeMatch || stages.length !== 3) {
    return { problems: [`${path}: 表の行の形が正しくない：${line}`] };
  }
  const readings = stages.flatMap((cell, index) =>
    cell === ''
      ? []
      : cell
          .split(READING_SEPARATOR)
          .map((reading) => ({ stage: STAGES[index] ?? '', reading })),
  );
  const problems = readings
    .filter(({ reading }) => !READING.test(reading))
    .map(({ reading }) => `${path}: 音訓の形が正しくない：${reading}`);
  if (readings.length === 0) {
    problems.push(`${path}: 音訓がない：${kanji}`);
  }
  const value = gradeMatch[1];
  return {
    item: {
      kanji,
      grade: value ? Number(value) : undefined,
      signature: stages.join(CELL_SEPARATOR),
      readings,
    },
    problems,
  };
}

/** 表のページから、漢字の行を読み取る。読み取れない行は問題として返す。 */
export function parseOnkunPage(file: MarkdownFile): {
  kanji: OnkunKanji[];
  problems: string[];
} {
  const lines = file.content.split('\n');
  const withGrade = lines.includes(HEADER);
  const start = lines.indexOf(withGrade ? HEADER : GRADE_PAGE_HEADER);
  if (start < 0) {
    return { kanji: [], problems: [`${file.path}: 表の見出し行がない`] };
  }
  const kanji: OnkunKanji[] = [];
  const problems: string[] = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith(CELL_SEPARATOR)) {
      break;
    }
    const parsed = parseRow(file.path, line, withGrade);
    problems.push(...parsed.problems);
    if (parsed.item) {
      kanji.push(parsed.item);
    }
  }
  const count = COUNT_LINE.exec(file.content)?.[1];
  if (count !== undefined && Number(count) !== kanji.length) {
    problems.push(
      `${file.path}: 字数が${count}字で、表の${kanji.length}字と一致しない`,
    );
  }
  return { kanji, problems };
}

function checkTotals(
  readme: MarkdownFile,
  kanji: readonly OnkunKanji[],
): string[] {
  const problems: string[] = [];
  const total = TOTAL_LINE.exec(readme.content)?.[1];
  if (Number(total) !== kanji.length) {
    problems.push(
      `漢字が${String(total)}字で、表の${kanji.length}字と一致しない`,
    );
  }
  const readings = kanji.reduce((sum, item) => sum + item.readings.length, 0);
  const readingTotal = READING_TOTAL_LINE.exec(readme.content)?.[1];
  if (Number(readingTotal) !== readings) {
    problems.push(
      `音訓が${String(readingTotal)}で、表の${readings}と一致しない`,
    );
  }
  return problems;
}

function checkGrades(
  rows: ReadonlyMap<string, OnkunKanji>,
  table: KanjiTable,
): string[] {
  const problems: string[] = [];
  const grades = new Map<string, number>();
  for (const grade of table.grades) {
    for (const character of grade.characters) {
      grades.set(character, grade.grade);
    }
  }
  for (const item of rows.values()) {
    if (item.grade !== grades.get(item.kanji)) {
      problems.push(
        `${item.kanji}の学年が${String(item.grade)}で、配当表の${String(grades.get(item.kanji))}と一致しない`,
      );
    }
  }
  for (const character of grades.keys()) {
    if (!rows.has(character)) {
      problems.push(`配当表の漢字が表にない：${character}`);
    }
  }
  return problems;
}

/** 学年別ページが、配当表の並びどおりで、表のページと同じ音訓であることを確かめる。 */
function checkGradePages(
  rows: ReadonlyMap<string, OnkunKanji>,
  gradePages: ReadonlyMap<number, readonly OnkunKanji[]>,
  table: KanjiTable,
): string[] {
  return table.grades.flatMap((grade) => {
    const page = gradePages.get(grade.grade);
    if (!page) {
      return [`第${grade.grade}学年のページがない`];
    }
    const order = page.map((item) => item.kanji).join('');
    const problems =
      order === grade.characters.join('')
        ? []
        : [`第${grade.grade}学年のページの漢字が、配当表の並びと一致しない`];
    return problems.concat(
      page
        .filter((item) => rows.get(item.kanji)?.signature !== item.signature)
        .map(
          (item) =>
            `第${grade.grade}学年のページの${item.kanji}が、表のページと一致しない`,
        ),
    );
  });
}

/** 全ページの合計、重複、配当学年、学年別ページの一致を確かめる。 */
export function checkOnkun(
  readme: MarkdownFile,
  kanji: readonly OnkunKanji[],
  gradePages: ReadonlyMap<number, readonly OnkunKanji[]>,
  table: KanjiTable,
): string[] {
  const problems = checkTotals(readme, kanji);
  const rows = new Map<string, OnkunKanji>();
  for (const item of kanji) {
    if (rows.has(item.kanji)) {
      problems.push(`漢字が重複している：${item.kanji}`);
    }
    rows.set(item.kanji, item);
  }
  return [
    ...problems,
    ...checkGrades(rows, table),
    ...checkGradePages(rows, gradePages, table),
  ];
}
