import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SAMPLE_KANJI, sampleDataset } from './fixtures.ts';
import { findBrokenLinks } from './links.ts';
import { documentFiles, expectedFiles } from './outputs.ts';

const ROOT_README = 'README.md';

test('expectedFiles：データとドキュメントのパスを返す', () => {
  const paths = expectedFiles(sampleDataset({ kanji: SAMPLE_KANJI })).map(
    (file) => file.path,
  );
  assert.deepEqual(paths, [
    'data/catalog.json',
    'data/math/subject.json',
    'data/math/grade-1.json',
    'data/math/kanji.json',
    'docs/math/README.md',
    'docs/math/planning.md',
    'docs/math/grade-1.md',
    'docs/math/kanji.md',
  ]);
});

test('documentFiles：生成したドキュメントのリンクは切れていない', () => {
  const dataset = sampleDataset({ kanji: SAMPLE_KANJI });
  const existing = new Set([
    ROOT_README,
    ...expectedFiles(dataset).map((file) => file.path),
  ]);
  assert.deepEqual(findBrokenLinks(documentFiles(dataset), existing), []);
});

test('documentFiles：漢字配当表は20字ごとの行に分け、累計を示す', () => {
  const kanji = documentFiles(sampleDataset({ kanji: SAMPLE_KANJI })).find(
    (file) => file.path.endsWith('kanji.md'),
  );
  const lines = kanji?.content.split('\n') ?? [];
  assert.ok(lines.includes('  - 一右雨'));
  assert.ok(lines.includes('- **累計**：5字'));
});
