/** リポジトリ内のファイルの読み込み。 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MarkdownFile } from './links.ts';

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

export function readFile(root: string, path: string): MarkdownFile {
  return { path, content: readFileSync(join(root, path), 'utf8') };
}
