/** Markdown の行数、リンク、コード、漢字配当表、音訓の割り振りを検査する。問題があれば終了コード1で終わる。 */

import { findMalformedCodes } from './codes.ts';
import { checkKanjiTable, parseKanjiTable } from './kanji.ts';
import { findOversizedFiles } from './limits.ts';
import { findBrokenLinks } from './links.ts';
import { checkOnkun, parseOnkunPage } from './onkun.ts';
import { listFiles, readFile } from './repository.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const KANJI_PAGE = 'docs/elementary/japanese/kanji.md';
const MARKDOWN_EXTENSION = '.md';
const ONKUN_DIRECTORY = 'docs/reference/onkun/';
const ONKUN_TABLE = /^table-\d+\.md$/;

const paths = listFiles(ROOT);
const files = paths
  .filter((path) => path.endsWith(MARKDOWN_EXTENSION))
  .map((path) => readFile(ROOT, path));
const kanji = files.find((file) => file.path === KANJI_PAGE);
const onkunPages = files
  .filter(
    (file) =>
      file.path.startsWith(ONKUN_DIRECTORY) &&
      ONKUN_TABLE.test(file.path.slice(ONKUN_DIRECTORY.length)),
  )
  .map(parseOnkunPage);
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
  ...onkunPages.flatMap((page) => page.problems),
  ...(kanji && onkunReadme
    ? checkOnkun(
        onkunReadme,
        onkunPages.flatMap((page) => page.kanji),
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
