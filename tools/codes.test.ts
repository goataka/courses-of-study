import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findMalformedCodes } from './codes.ts';

const BASE = 'https://w3id.org/jp-cos/';

test('findMalformedCodes：正しい形なら問題を返さない', () => {
  const content = [
    '- **ID**：`math-g3-A-4`',
    `- **コード**：[8250233140000000](${BASE}8250233140000000)`,
    `  - **[ア(ア)](${BASE}82102A3111000000)**：除法の意味を理解する`,
  ].join('\n');
  assert.deepEqual(findMalformedCodes({ path: 'a.md', content }), []);
});

test('findMalformedCodes：桁数の違うコードと、形の違うIDを報告する', () => {
  const content = [
    '- **ID**：`Math g3`',
    `- **コード**：[825023314](${BASE}825023314)`,
  ].join('\n');
  assert.deepEqual(findMalformedCodes({ path: 'a.md', content }), [
    'a.md: コードの形が正しくない：825023314',
    'a.md: IDの形が正しくない：Math g3',
  ]);
});

test('findMalformedCodes：インラインコードの中の例は検査しない', () => {
  const content = `- **形**：\`**[番号](${BASE}<コード>)**\``;
  assert.deepEqual(findMalformedCodes({ path: 'a.md', content }), []);
});

test('findMalformedCodes：中学校のコードを受け付け、高等学校のコードを報告する', () => {
  const content = [
    `- **コード**：[8350213100000000](${BASE}8350213100000000)`,
    `- **コード**：[8450000000000000](${BASE}8450000000000000)`,
  ].join('\n');
  assert.deepEqual(findMalformedCodes({ path: 'a.md', content }), [
    'a.md: コードの形が正しくない：8450000000000000',
  ]);
});
