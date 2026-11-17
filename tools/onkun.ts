/** 音訓の割り振りのページを読み取り、字数と、学年別漢字配当表との一致を検査する。 */

import type { KanjiTable } from './kanji.ts';
import type { MarkdownFile } from './links.ts';

const KANJI_LINE = /^- \*\*(\S+?)\*\*(?: 第(\d)学年( 改)?)?：(.+)$/;
const READING =
  /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+ [小中高]( 特)?( 改)?$/u;
const COUNT_LINE = /^- \*\*字数\*\*：(\d+)字$/m;
const TOTAL_LINE = /^- \*\*漢字\*\*：(\d+)字$/m;
const READING_TOTAL_LINE = /^- \*\*音訓\*\*：(\d+)$/m;

export interface OnkunKanji {
  readonly kanji: string;
  readonly grade: number | undefined;
  readonly readings: string[];
}

/** 表のページから、漢字の行を読み取る。読み取れない行は問題として返す。 */
export function parseOnkunPage(file: MarkdownFile): {
  kanji: OnkunKanji[];
  problems: string[];
} {
  const kanji: OnkunKanji[] = [];
  const problems: string[] = [];
  for (const line of file.content.split('\n')) {
    if (!line.startsWith('- **') || line.startsWith('- **[')) {
      continue;
    }
    const match = KANJI_LINE.exec(line);
    if (!match || [...(match[1] ?? '')].length !== 1) {
      continue;
    }
    const readings = (match[4] ?? '').split('、');
    const bad = readings.filter((reading) => !READING.test(reading));
    problems.push(
      ...bad.map((reading) => `${file.path}: 音訓の形が正しくない：${reading}`),
    );
    kanji.push({
      kanji: match[1] ?? '',
      grade: match[2] ? Number(match[2]) : undefined,
      readings,
    });
  }
  const count = COUNT_LINE.exec(file.content)?.[1];
  if (count !== undefined && Number(count) !== kanji.length) {
    problems.push(
      `${file.path}: 字数が${count}字で、漢字の行の${kanji.length}字と一致しない`,
    );
  }
  return { kanji, problems };
}

/** 全ページの合計、重複、配当学年の一致を確かめる。 */
export function checkOnkun(
  readme: MarkdownFile,
  kanji: readonly OnkunKanji[],
  table: KanjiTable,
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
  const seen = new Set<string>();
  for (const item of kanji) {
    if (seen.has(item.kanji)) {
      problems.push(`漢字が重複している：${item.kanji}`);
    }
    seen.add(item.kanji);
  }
  const grades = new Map<string, number>();
  for (const grade of table.grades) {
    for (const character of grade.characters) {
      grades.set(character, grade.grade);
    }
  }
  for (const item of kanji) {
    if (item.grade !== grades.get(item.kanji)) {
      problems.push(
        `${item.kanji}の学年が${String(item.grade)}で、配当表の${String(grades.get(item.kanji))}と一致しない`,
      );
    }
  }
  for (const character of grades.keys()) {
    if (!seen.has(character)) {
      problems.push(`配当表の漢字が表にない：${character}`);
    }
  }
  return problems;
}
