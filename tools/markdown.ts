/** Markdown の見出しとリンクを扱う小さな部品。 */

/** GitHub が見出しに付けるアンカーを求める。 */
export function slug(title: string): string {
  const kept = title.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\p{Pc}\- ]/gu, '');
  return kept.replaceAll(' ', '-');
}
