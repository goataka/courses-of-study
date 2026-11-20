/** Markdown の行数、リンク、コード、漢字配当表、音訓の割り振りを検査する。問題があれば終了コード1で終わる。 */

import { findMalformedCodes } from './codes.ts';
import { checkKanjiTable, parseKanjiTable } from './kanji.ts';
import { findOversizedFiles } from './limits.ts';
import { findBrokenLinks } from './links.ts';
import { checkOnkun, parseOnkunPage } from './onkun.ts';
import type { OnkunRow, Stage } from './onkun.ts';
import { listFiles, readFile } from './repository.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const KANJI_PAGE = 'docs/elementary/japanese/kanji.md';
const MARKDOWN_EXTENSION = '.md';
const ONKUN_DIRECTORY = 'docs/reference/onkun/';
const ONKUN_PAGE = /^(grade|lower-secondary|upper-secondary)-(\d+)\.md$/;
const ONKUN_STAGES = {
  'lower-secondary': '中学校',
  'upper-secondary': '高等学校',
} as const;

const paths = listFiles(ROOT);
const files = paths
  .filter((path) => path.endsWith(MARKDOWN_EXTENSION))
  .map((path) => readFile(ROOT, path));
const kanji = files.find((file) => file.path === KANJI_PAGE);
const onkunGrades = new Map<number, OnkunRow[]>();
const onkunStages = new Map<Stage, OnkunRow[]>();
const onkunProblems: string[] = [];
for (const file of files) {
  const match = file.path.startsWith(ONKUN_DIRECTORY)
    ? ONKUN_PAGE.exec(file.path.slice(ONKUN_DIRECTORY.length))
    : null;
  if (!match) {
    continue;
  }
  const page = parseOnkunPage(file);
  onkunProblems.push(...page.problems);
  const [, kind = '', number = ''] = match;
  if (kind === 'grade') {
    onkunGrades.set(Number(number), page.rows);
  } else {
    const stage = ONKUN_STAGES[kind as keyof typeof ONKUN_STAGES];
    onkunStages.set(stage, [...(onkunStages.get(stage) ?? []), ...page.rows]);
  }
}
const onkunReadme = files.find(
  (file) => file.path === `${ONKUN_DIRECTORY}README.md`,
);

const problems = [
  ...findOversizedFiles(files),
  ...findBrokenLinks(files, new Set(paths)),
  ...files.flatMap(findMalformedCodes),
  ...(kanji
    ? checkKanjiTable(parseKanjiTable(kanji.content)).map(
        (problem) => `${KANJI_PAGE}: ${problem}`,
      )
    : [`${KANJI_PAGE}: ファイルがない`]),
  ...onkunProblems,
  ...(kanji && onkunReadme
    ? checkOnkun(
        { readme: onkunReadme, grades: onkunGrades, stages: onkunStages },
        parseKanjiTable(kanji.content),
      ).map((problem) => `${ONKUN_DIRECTORY}: ${problem}`)
    : [`${ONKUN_DIRECTORY}README.md: ファイルがない`]),
];

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${files.length}件の Markdown に問題はない`);
}
