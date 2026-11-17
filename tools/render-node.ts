/** 項目を箇条書きにする部品。学年ページと教科ページで共用する。 */

import {
  bold,
  bullet,
  labelled,
  labelledText,
  splitSentences,
  emphasize,
} from './markdown.ts';
import {
  CATEGORY_LABELS,
  type Category,
  type CurriculumNode,
} from './model.ts';

const NAME_SEPARATOR = '、';
const TERM_LIST_LABEL = '一覧';

function nodeLabel(node: CurriculumNode): string {
  const category =
    node.kind === 'goal' && node.category ? CATEGORY_LABELS[node.category] : '';
  return [node.no, node.title ?? '', category]
    .filter((part) => part.length > 0)
    .join(' ');
}

function isTermList(children: readonly CurriculumNode[]): boolean {
  return (
    children.length > 0 && children.every((child) => child.kind === 'term')
  );
}

/** 用語や人物名の並びを1行にまとめる。 */
export function renderTermList(
  children: readonly CurriculumNode[],
  depth: number,
): string[] {
  const names = children.map((child) => child.text ?? '').join(NAME_SEPARATOR);
  return [bullet(depth, labelled(TERM_LIST_LABEL, names))];
}

function renderChildren(
  children: readonly CurriculumNode[],
  depth: number,
): string[] {
  return isTermList(children)
    ? renderTermList(children, depth)
    : renderCategorized(children, depth);
}

function renderOwnSentences(node: CurriculumNode, depth: number): string[] {
  const text = emphasize(node.text ?? '', node.keywords ?? []);
  return splitSentences(text).map((sentence) => bullet(depth, sentence));
}

/** 項目1件を箇条書きにする。子を持つ項目は、自身の文と子を下に並べる。 */
export function renderNode(node: CurriculumNode, depth: number): string[] {
  const children = node.children ?? [];
  if (children.length === 0) {
    return labelledText(
      depth,
      nodeLabel(node),
      node.text ?? '',
      node.keywords ?? [],
    );
  }
  const head = bullet(depth, bold(nodeLabel(node)));
  return [
    head,
    ...renderOwnSentences(node, depth + 1),
    ...renderChildren(children, depth + 1),
  ];
}

interface CategoryRun {
  readonly category: Category | undefined;
  readonly nodes: CurriculumNode[];
}

function groupByCategory(nodes: readonly CurriculumNode[]): CategoryRun[] {
  const runs: CategoryRun[] = [];
  for (const node of nodes) {
    const category = node.kind === 'item' ? node.category : undefined;
    const last = runs.at(-1);
    if (last && last.category === category) {
      last.nodes.push(node);
    } else {
      runs.push({ category, nodes: [node] });
    }
  }
  return runs;
}

function renderRun(run: CategoryRun, depth: number): string[] {
  if (run.category === undefined) {
    return run.nodes.flatMap((node) => renderNode(node, depth));
  }
  const head = bullet(depth, bold(CATEGORY_LABELS[run.category]));
  return [head, ...run.nodes.flatMap((node) => renderNode(node, depth + 1))];
}

/** 事項を資質・能力の柱ごとにまとめて箇条書きにする。 */
export function renderCategorized(
  nodes: readonly CurriculumNode[],
  depth: number,
): string[] {
  return groupByCategory(nodes).flatMap((run) => renderRun(run, depth));
}
