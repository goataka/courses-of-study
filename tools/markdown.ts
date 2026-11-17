/** Markdown を組み立てる小さな部品。ドキュメントルールの書式をここに集約する。 */

const LIST_INDENT = '  ';
const SENTENCE_END = '。';
const LABEL_SEPARATOR = '：';

export interface Heading {
  /** 見出しの深さ。2 は「##」を表す。 */
  readonly level: number;
  readonly title: string;
}

/** GitHub が見出しに付けるアンカーを求める。 */
export function slug(title: string): string {
  const kept = title.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\p{Pc}\- ]/gu, '');
  return kept.replaceAll(' ', '-');
}

export function link(label: string, target: string): string {
  return `[${label}](${target})`;
}

export function bold(text: string): string {
  return `**${text}**`;
}

export function bullet(depth: number, text: string): string {
  return `${LIST_INDENT.repeat(depth)}- ${text}`;
}

export function labelled(label: string, value: string): string {
  return `${bold(label)}${LABEL_SEPARATOR}${value}`;
}

export function headingLine(heading: Heading): string {
  return `${'#'.repeat(heading.level)} ${heading.title}`;
}

/** 文を「。」で区切る。 */
export function splitSentences(text: string): string[] {
  return text.split(SENTENCE_END).filter((sentence) => sentence.length > 0);
}

interface Span {
  readonly start: number;
  readonly end: number;
}

function firstOccurrences(text: string, keywords: readonly string[]): Span[] {
  const spans = keywords
    .map((keyword) => ({
      start: text.indexOf(keyword),
      end: text.indexOf(keyword) + keyword.length,
    }))
    .filter((span) => span.start >= 0);
  return spans.sort((left, right) => left.start - right.start);
}

function withoutOverlaps(spans: readonly Span[]): Span[] {
  const kept: Span[] = [];
  for (const span of spans) {
    const previousEnd = kept.at(-1)?.end ?? 0;
    if (span.start >= previousEnd) {
      kept.push(span);
    }
  }
  return kept;
}

/** 重要語の最初の出現を太字にする。 */
export function emphasize(text: string, keywords: readonly string[]): string {
  const spans = withoutOverlaps(firstOccurrences(text, keywords));
  let result = '';
  let cursor = 0;
  for (const span of spans) {
    result +=
      text.slice(cursor, span.start) + bold(text.slice(span.start, span.end));
    cursor = span.end;
  }
  return result + text.slice(cursor);
}

/**
 * 「ラベル：文」の箇条書きを作る。
 * 文が複数ある場合は、ラベルの下に1文ずつ並べる。
 */
export function labelledText(
  depth: number,
  label: string,
  text: string,
  keywords: readonly string[] = [],
): string[] {
  const sentences = splitSentences(emphasize(text, keywords));
  if (sentences.length <= 1) {
    return [bullet(depth, labelled(label, sentences[0] ?? ''))];
  }
  return [
    bullet(depth, bold(label)),
    ...sentences.map((sentence) => bullet(depth + 1, sentence)),
  ];
}

/** 見出しの一覧から目次を作る。最も浅い見出しを基準に字下げする。 */
export function tableOfContents(headings: readonly Heading[]): string[] {
  const baseLevel = Math.min(...headings.map((heading) => heading.level));
  return headings.map((heading) =>
    bullet(
      heading.level - baseLevel,
      link(heading.title, `#${slug(heading.title)}`),
    ),
  );
}

/** ブロックを空行で区切り、末尾に改行を付けて1つの文書にする。 */
export function joinBlocks(blocks: readonly (readonly string[])[]): string {
  const filled = blocks.filter((block) => block.length > 0);
  return `${filled.map((block) => block.join('\n')).join('\n\n')}\n`;
}
