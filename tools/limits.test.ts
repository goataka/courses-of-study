import assert from 'node:assert/strict';
import { test } from 'node:test';

import { countLines, findOversizedFiles } from './limits.ts';

const LINE_CASES: readonly (readonly [string, number])[] = [
  ['1行\n', 1],
  ['1行\n2行\n', 2],
  ['末尾に改行なし', 1],
];

for (const [content, expected] of LINE_CASES) {
  test(`countLines：${JSON.stringify(content)} は${expected}行`, () => {
    assert.equal(countLines(content), expected);
  });
}

test('findOversizedFiles：上限を超えたファイルだけを報告する', () => {
  const files = [
    { path: 'small.md', content: '1\n2\n' },
    { path: 'large.md', content: '1\n2\n3\n' },
  ];
  assert.deepEqual(findOversizedFiles(files, 2), [
    'large.md: 3行あり、上限の2行を超えている',
  ]);
});
