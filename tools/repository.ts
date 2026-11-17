/** リポジトリ内のファイルの読み書き。 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { OutputFile } from './outputs.ts';

const IGNORED_DIRECTORIES: ReadonlySet<string> = new Set([
  '.git',
  'node_modules',
]);
const PATH_SEPARATOR = '/';

/** リポジトリ直下からのパスで、全てのファイルを返す。 */
export function listFiles(root: string, directory = ''): string[] {
  const entries = readdirSync(join(root, directory), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path =
      directory === ''
        ? entry.name
        : `${directory}${PATH_SEPARATOR}${entry.name}`;
    if (!entry.isDirectory()) {
      return [path];
    }
    return IGNORED_DIRECTORIES.has(entry.name) ? [] : listFiles(root, path);
  });
}

export function readFile(root: string, path: string): OutputFile {
  return { path, content: readFileSync(join(root, path), 'utf8') };
}

export function writeFile(root: string, file: OutputFile): void {
  const target = join(root, file.path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, file.content);
}
