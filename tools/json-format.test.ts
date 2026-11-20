import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatJson } from './json-format.ts';

const SAMPLE = {
  id: 'math-g1',
  grades: [1],
  contents: [
    {
      id: 'math-g1-A',
      title: '数と計算',
      children: [{ id: 'math-g1-A-1', keywords: ['個数', '順番'] }],
    },
    { id: 'math-g1-B', title: '図形' },
  ],
};

const EXPECTED = `{
  "id": "math-g1",
  "grades": [1],
  "contents": [
    {"id": "math-g1-A", "title": "数と計算", "children": [
      {"id": "math-g1-A-1", "keywords": ["個数", "順番"]}
    ]},
    {"id": "math-g1-B", "title": "図形"}
  ]
}
`;

test('formatJson：最上位のキーは1行ずつ、配列内の項目は1行に1件とする', () => {
  assert.equal(formatJson(SAMPLE), EXPECTED);
});

test('formatJson：整形しても値は変わらない', () => {
  assert.deepEqual(JSON.parse(formatJson(SAMPLE)), SAMPLE);
});

test('formatJson：整形済みの内容を再び整形しても同じになる', () => {
  assert.equal(formatJson(JSON.parse(EXPECTED)), EXPECTED);
});
