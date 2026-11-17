/** ファイルを小さく保つための上限。エージェントや人が一度に読みやすい大きさにする。 */

import type { MarkdownFile } from './links.ts';

/** Markdown の1ファイルあたりの行数の上限。 */
export const MAX_FILE_LINES = 300;

const LINE_BREAK = '\n';

export function countLines(content: string): number {
  const body = content.endsWith(LINE_BREAK)
    ? content.slice(0, -LINE_BREAK.length)
    : content;
  return body.split(LINE_BREAK).length;
}

/** 上限を超えたファイルを、場所と内容の文字列で返す。 */
export function findOversizedFiles(
  files: readonly MarkdownFile[],
  maxLines: number = MAX_FILE_LINES,
): string[] {
  return files
    .map((file) => ({ path: file.path, lines: countLines(file.content) }))
    .filter((file) => file.lines > maxLines)
    .map(
      (file) =>
        `${file.path}: ${file.lines}行あり、上限の${maxLines}行を超えている`,
    );
}
