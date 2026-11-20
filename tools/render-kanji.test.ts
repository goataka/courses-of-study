import assert from 'node:assert/strict';
import { test } from 'node:test';

import { splitRows } from './render-kanji.ts';

const ROW_CASES: readonly (readonly [string, number, readonly string[]])[] = [
  ['一右雨円王', 2, ['一右', '雨円', '王']],
  ['一右雨円', 2, ['一右', '雨円']],
  ['', 2, []],
];

for (const [characters, rowLength, expected] of ROW_CASES) {
  test(`splitRows：「${characters}」を${rowLength}字ごとに分ける`, () => {
    assert.deepEqual(splitRows(characters, rowLength), expected);
  });
}
