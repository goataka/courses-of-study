/** データから決まる、あるべきファイルの内容を求める。ファイルの読み書きはしない。 */

import { formatJson } from './json-format.ts';
import type { Dataset, Source, SubjectData } from './model.ts';
import {
  CATALOG_FILE,
  DATA_DIRECTORY,
  KANJI_FILE,
  pageDocumentName,
  PLANNING_FILE,
  SUBJECT_INDEX_FILE,
  subjectDocumentPath,
} from './paths.ts';
import { renderKanji } from './render-kanji.ts';
import { renderGradePage } from './render-page.ts';
import { renderPlanning, renderSubjectIndex } from './render-subject.ts';

/** リポジトリ直下からのパスと、その内容。 */
export interface OutputFile {
  readonly path: string;
  readonly content: string;
}

function dataFile(path: string, value: unknown): OutputFile {
  return { path: `${DATA_DIRECTORY}/${path}`, content: formatJson(value) };
}

function subjectDataFiles(data: SubjectData): OutputFile[] {
  const pages = data.pages.flatMap((page, position) => {
    const entry = data.entry.pages[position];
    return entry ? [dataFile(entry.path, page)] : [];
  });
  const kanji =
    data.kanji && data.entry.kanji
      ? [dataFile(data.entry.kanji, data.kanji)]
      : [];
  return [dataFile(data.entry.path, data.subject), ...pages, ...kanji];
}

/** 正規の書式に整えたデータファイル。 */
export function dataFiles(dataset: Dataset): OutputFile[] {
  return [
    dataFile(CATALOG_FILE, dataset.catalog),
    ...dataset.subjects.flatMap(subjectDataFiles),
  ];
}

function subjectDocument(
  data: SubjectData,
  name: string,
  content: string,
): OutputFile {
  return { path: subjectDocumentPath(data.entry, name), content };
}

function pageDocuments(data: SubjectData, source: Source): OutputFile[] {
  return data.pages.flatMap((page, position) => {
    const entry = data.entry.pages[position];
    if (entry === undefined) {
      return [];
    }
    const content = renderGradePage({ page, data, source });
    return [subjectDocument(data, pageDocumentName(entry), content)];
  });
}

function kanjiDocuments(data: SubjectData, source: Source): OutputFile[] {
  if (data.kanji === undefined) {
    return [];
  }
  const content = renderKanji(data.kanji, data, source);
  return [subjectDocument(data, KANJI_FILE, content)];
}

function subjectDocuments(data: SubjectData, source: Source): OutputFile[] {
  const index = renderSubjectIndex(data, source);
  const planning = renderPlanning(data, source);
  return [
    subjectDocument(data, SUBJECT_INDEX_FILE, index),
    subjectDocument(data, PLANNING_FILE, planning),
    ...pageDocuments(data, source),
    ...kanjiDocuments(data, source),
  ];
}

/** データから生成するドキュメント。 */
export function documentFiles(dataset: Dataset): OutputFile[] {
  const { source } = dataset.catalog;
  return dataset.subjects.flatMap((data) => subjectDocuments(data, source));
}

/** データから決まる全てのファイル。 */
export function expectedFiles(dataset: Dataset): OutputFile[] {
  return [...dataFiles(dataset), ...documentFiles(dataset)];
}
