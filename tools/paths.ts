/** データと生成ドキュメントの置き場所。 */

import type { CatalogPage, CatalogSubject } from './model.ts';

export const DATA_DIRECTORY = 'data';
export const DOCS_DIRECTORY = 'docs';
export const CATALOG_FILE = 'catalog.json';
export const SUBJECT_INDEX_FILE = 'README.md';
export const PLANNING_FILE = 'planning.md';
export const KANJI_FILE = 'kanji.md';

const DATA_EXTENSION = '.json';
const DOCUMENT_EXTENSION = '.md';
const DOCS_TO_ROOT = '../..';

function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

/** 学年ページの Markdown のファイル名。データファイルと同じ名前にする。 */
export function pageDocumentName(page: CatalogPage): string {
  return fileName(page.path).replace(DATA_EXTENSION, DOCUMENT_EXTENSION);
}

/** リポジトリ直下から見た、教科の生成ドキュメントのパス。 */
export function subjectDocumentPath(
  subject: CatalogSubject,
  name: string,
): string {
  return `${DOCS_DIRECTORY}/${subject.id}/${name}`;
}

/** 教科のドキュメントから見た、データファイルへの相対リンク。 */
export function dataLink(dataPath: string): string {
  return `${DOCS_TO_ROOT}/${DATA_DIRECTORY}/${dataPath}`;
}

/** 教科のドキュメントから見た、リポジトリ直下のファイルへの相対リンク。 */
export function rootLink(name: string): string {
  return `${DOCS_TO_ROOT}/${name}`;
}

/** リポジトリ直下から見たデータファイルの表示名。 */
export function dataDisplayPath(dataPath: string): string {
  return `${DATA_DIRECTORY}/${dataPath}`;
}
