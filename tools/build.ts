/**
 * データを検査し、正規の書式への整形と、ドキュメントの生成を行う。
 * `--check` を付けると書き込まず、再生成が必要なファイルを報告する。
 */

import { join } from 'node:path';

import { loadDataset } from './dataset.ts';
import { findOversizedFiles } from './limits.ts';
import { findBrokenLinks } from './links.ts';
import { expectedFiles, type OutputFile } from './outputs.ts';
import { DATA_DIRECTORY } from './paths.ts';
import { listFiles, readFile, writeFile } from './repository.ts';
import { validateDataset } from './validate.ts';

const CHECK_FLAG = '--check';
const MARKDOWN_EXTENSION = '.md';
const DATA_PREFIX = `${DATA_DIRECTORY}/`;
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

function findStaleFiles(
  root: string,
  expected: readonly OutputFile[],
  existing: ReadonlySet<string>,
): string[] {
  return expected
    .filter(
      (file) =>
        !existing.has(file.path) ||
        readFile(root, file.path).content !== file.content,
    )
    .map((file) => `${file.path}: 再生成が必要。pnpm run build を実行する`);
}

function findUnlistedData(
  expected: readonly OutputFile[],
  existing: readonly string[],
): string[] {
  const listed = new Set(expected.map((file) => file.path));
  return existing
    .filter((path) => path.startsWith(DATA_PREFIX) && !listed.has(path))
    .map((path) => `${path}: カタログに載っていないデータファイル`);
}

/** 書き込み後のリポジトリを検査する。リンク切れと、大きすぎるファイルを探す。 */
function inspectRepository(
  root: string,
  expected: readonly OutputFile[],
): string[] {
  const paths = listFiles(root);
  const markdown = paths
    .filter((path) => path.endsWith(MARKDOWN_EXTENSION))
    .map((path) => readFile(root, path));
  const data = expected.filter((file) => file.path.startsWith(DATA_PREFIX));
  return [
    ...findUnlistedData(expected, paths),
    ...findBrokenLinks(markdown, new Set(paths)),
    ...findOversizedFiles([...markdown, ...data]),
  ];
}

function synchronize(
  root: string,
  expected: readonly OutputFile[],
  checkOnly: boolean,
): string[] {
  if (checkOnly) {
    return findStaleFiles(root, expected, new Set(listFiles(root)));
  }
  expected.forEach((file) => writeFile(root, file));
  return [];
}

function collectProblems(root: string, checkOnly: boolean): string[] {
  const dataset = loadDataset(join(root, DATA_DIRECTORY));
  const invalid = validateDataset(dataset);
  if (invalid.length > 0) {
    return invalid;
  }
  const expected = expectedFiles(dataset);
  return [
    ...synchronize(root, expected, checkOnly),
    ...inspectRepository(root, expected),
  ];
}

function main(argumentList: readonly string[], root: string): number {
  const checkOnly = argumentList.includes(CHECK_FLAG);
  const problems = collectProblems(root, checkOnly);
  if (problems.length > 0) {
    problems.forEach((message) => console.error(message));
    console.error(`${problems.length}件の問題がある`);
    return EXIT_FAILURE;
  }
  console.log(
    checkOnly
      ? 'データと生成物は最新'
      : 'データを整形し、ドキュメントを生成した',
  );
  return EXIT_SUCCESS;
}

process.exitCode = main(process.argv.slice(2), process.cwd());
