/** Markdown の行数、リンク、コード、漢字配当表を検査する。問題があれば終了コード1で終わる。 */

import { findMalformedCodes } from './codes.ts';
import { checkKanjiTable, parseKanjiTable } from './kanji.ts';
import { findOversizedFiles } from './limits.ts';
import { findBrokenLinks } from './links.ts';
import { listFiles, readFile } from './repository.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const KANJI_PAGE = 'docs/elementary/japanese/kanji.md';
const MARKDOWN_EXTENSION = '.md';

const paths = listFiles(ROOT);
const files = paths
  .filter((path) => path.endsWith(MARKDOWN_EXTENSION))
  .map((path) => readFile(ROOT, path));
const kanji = files.find((file) => file.path === KANJI_PAGE);

const problems = [
  ...findOversizedFiles(files),
  ...findBrokenLinks(files, new Set(paths)),
  ...files.flatMap(findMalformedCodes),
  ...(kanji
    ? checkKanjiTable(parseKanjiTable(kanji.content)).map(
        (problem) => `${KANJI_PAGE}: ${problem}`,
      )
    : [`${KANJI_PAGE}: ファイルがない`]),
];

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${files.length}件の Markdown に問題はない`);
}
