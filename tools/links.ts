/** Markdown の相対リンクとページ内リンクの切れを検査する。ファイルの読み書きはしない。 */

import { posix } from 'node:path';

import { slug } from './markdown.ts';

const LINK_PATTERN = /\]\(([^)\s]+)\)/g;
const HEADING_PATTERN = /^#+ (.+)$/gm;
const EXTERNAL_LINK_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const ANCHOR_SEPARATOR = '#';

export interface MarkdownFile {
  /** リポジトリ直下からのパス。 */
  readonly path: string;
  readonly content: string;
}

/** 文書内の見出しに GitHub が付けるアンカー。同じ見出しには連番が付く。 */
export function headingAnchors(content: string): Set<string> {
  const counts = new Map<string, number>();
  const anchors = new Set<string>();
  for (const match of content.matchAll(HEADING_PATTERN)) {
    const base = slug(match[1] ?? '');
    const count = counts.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    counts.set(base, count + 1);
  }
  return anchors;
}

function linkTargets(content: string): string[] {
  return [...content.matchAll(LINK_PATTERN)].map((match) => match[1] ?? '');
}

function resolveTarget(fromPath: string, targetPath: string): string {
  return targetPath === ''
    ? fromPath
    : posix.normalize(posix.join(posix.dirname(fromPath), targetPath));
}

interface LinkContext {
  readonly anchorsByPath: ReadonlyMap<string, ReadonlySet<string>>;
  readonly existingPaths: ReadonlySet<string>;
}

function checkLink(
  file: MarkdownFile,
  target: string,
  context: LinkContext,
): string[] {
  const [targetPath = '', anchor] = target.split(ANCHOR_SEPARATOR);
  const resolved = resolveTarget(file.path, targetPath);
  if (!context.existingPaths.has(resolved)) {
    return [`${file.path}: リンク先のファイルがない：${target}`];
  }
  const anchors = context.anchorsByPath.get(resolved);
  const anchorMissing =
    anchor !== undefined &&
    anchors !== undefined &&
    !anchors.has(decodeURIComponent(anchor));
  return anchorMissing
    ? [`${file.path}: リンク先の見出しがない：${target}`]
    : [];
}

/** 切れているリンクを、場所と内容の文字列で返す。外部へのリンクは検査しない。 */
export function findBrokenLinks(
  files: readonly MarkdownFile[],
  existingPaths: ReadonlySet<string>,
): string[] {
  const anchorsByPath = new Map(
    files.map((file) => [file.path, headingAnchors(file.content)]),
  );
  const context: LinkContext = { anchorsByPath, existingPaths };
  return files.flatMap((file) =>
    linkTargets(file.content)
      .filter((target) => !EXTERNAL_LINK_PATTERN.test(target))
      .flatMap((target) => checkLink(file, target, context)),
  );
}
