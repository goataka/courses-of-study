/** Markdown に書いた学習指導要領コードとIDの形を検査する。 */

import type { MarkdownFile } from './links.ts';

const CODE_LINK = /\]\(https:\/\/w3id\.org\/jp-cos\/([^)]*)\)/g;
const CODE_FORMAT = /^8[23][0-9A-Z]{14}$/;
const ID_LINE = /^- \*\*ID\*\*：`([^`]*)`$/gm;
const INLINE_CODE = /`[^`\n]*`/g;
const ID_FORMAT = /^[a-z]+(?:-[a-z]+)*(?:-[A-Za-z0-9]+)*$/;

/** インラインコードの中は例として扱い、検査しない。
 * コードは小学校か中学校の16桁、IDは英小文字と番号を `-` でつないだ形であることを確かめる。 */
export function findMalformedCodes(file: MarkdownFile): string[] {
  const prose = file.content.replace(INLINE_CODE, '');
  const codes = [...prose.matchAll(CODE_LINK)]
    .map((match) => match[1] ?? '')
    .filter((code) => !CODE_FORMAT.test(code))
    .map((code) => `${file.path}: コードの形が正しくない：${code}`);
  const ids = [...file.content.matchAll(ID_LINE)]
    .map((match) => match[1] ?? '')
    .filter((id) => !ID_FORMAT.test(id))
    .map((id) => `${file.path}: IDの形が正しくない：${id}`);
  return [...codes, ...ids];
}
