/** 学年別漢字配当表のページから、字数と漢字の並びを読み取って検査する。 */

const GRADE_HEADING = /^## 第(\d)学年$/;
const COUNT_LINE = /^- \*\*字数\*\*：(\d+)字$/;
const CUMULATIVE_LINE = /^- \*\*累計\*\*：(\d+)字$/;
const TOTAL_LINE = /^- \*\*総字数\*\*：(\d+)字$/;
const CHARACTERS_LINE = /^ {2}- (\p{Script=Han}+)$/u;

export interface KanjiGrade {
  readonly grade: number;
  readonly count: number | undefined;
  readonly cumulative: number | undefined;
  readonly characters: string[];
}

export interface KanjiTable {
  readonly total: number | undefined;
  readonly grades: KanjiGrade[];
}

interface MutableGrade {
  grade: number;
  count: number | undefined;
  cumulative: number | undefined;
  characters: string[];
}

function numberIn(pattern: RegExp, line: string): number | undefined {
  const match = pattern.exec(line);
  return match ? Number(match[1]) : undefined;
}

/** 漢字配当表のページを読み取る。漢字は学年の見出しの下の箇条書きから集める。 */
export function parseKanjiTable(content: string): KanjiTable {
  let total: number | undefined;
  const grades: MutableGrade[] = [];
  for (const line of content.split('\n')) {
    const heading = GRADE_HEADING.exec(line);
    const current = grades.at(-1);
    if (heading) {
      grades.push({
        grade: Number(heading[1]),
        count: undefined,
        cumulative: undefined,
        characters: [],
      });
    } else if (current === undefined) {
      total ??= numberIn(TOTAL_LINE, line);
    } else {
      current.count ??= numberIn(COUNT_LINE, line);
      current.cumulative ??= numberIn(CUMULATIVE_LINE, line);
      const characters = CHARACTERS_LINE.exec(line)?.[1];
      if (characters) {
        current.characters.push(...characters);
      }
    }
  }
  return { total, grades };
}

function checkGrade(grade: KanjiGrade, cumulative: number): string[] {
  const label = `第${grade.grade}学年`;
  const problems: string[] = [];
  if (grade.characters.length !== grade.count) {
    problems.push(
      `${label}の漢字が${grade.characters.length}字で、字数の${String(grade.count)}字と一致しない`,
    );
  }
  if (grade.cumulative !== cumulative) {
    problems.push(
      `${label}の累計が${String(grade.cumulative)}字で、${cumulative}字と一致しない`,
    );
  }
  return problems;
}

/** 字数、累計、総字数、重複を確かめ、問題を文字列で返す。 */
export function checkKanjiTable(table: KanjiTable): string[] {
  const problems: string[] = [];
  let cumulative = 0;
  table.grades.forEach((grade, position) => {
    if (grade.grade !== position + 1) {
      problems.push(`第${position + 1}学年の見出しがない`);
    }
    cumulative += grade.characters.length;
    problems.push(...checkGrade(grade, cumulative));
  });
  if (table.total !== cumulative) {
    problems.push(
      `総字数が${String(table.total)}字で、漢字の合計${cumulative}字と一致しない`,
    );
  }
  const all = table.grades.flatMap((grade) => grade.characters);
  const repeated = all.filter(
    (character, position) => all.indexOf(character) !== position,
  );
  problems.push(
    ...repeated.map((character) => `漢字が重複している：${character}`),
  );
  return problems;
}
