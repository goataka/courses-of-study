/** data/ 配下の JSON を読み込む。 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  Catalog,
  CatalogSubject,
  Dataset,
  GradePage,
  KanjiTable,
  Subject,
  SubjectData,
} from './model.ts';
import { CATALOG_FILE } from './paths.ts';

function readJson<Document>(path: string): Document {
  return JSON.parse(readFileSync(path, 'utf8')) as Document;
}

function loadSubject(
  dataDirectory: string,
  entry: CatalogSubject,
): SubjectData {
  const subject = readJson<Subject>(join(dataDirectory, entry.path));
  const pages = entry.pages.map((page) =>
    readJson<GradePage>(join(dataDirectory, page.path)),
  );
  if (entry.kanji === undefined) {
    return { entry, subject, pages };
  }
  return {
    entry,
    subject,
    pages,
    kanji: readJson<KanjiTable>(join(dataDirectory, entry.kanji)),
  };
}

/** カタログに載っている全てのデータファイルを読み込む。 */
export function loadDataset(dataDirectory: string): Dataset {
  const catalog = readJson<Catalog>(join(dataDirectory, CATALOG_FILE));
  return {
    catalog,
    subjects: catalog.subjects.map((entry) =>
      loadSubject(dataDirectory, entry),
    ),
  };
}
