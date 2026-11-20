import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SAMPLE_SOURCE, sampleDataset, samplePage } from './fixtures.ts';
import type { SubjectData } from './model.ts';
import { renderGradePage } from './render-page.ts';

function renderSample(page = samplePage()): string[] {
  const data = sampleDataset().subjects[0] as SubjectData;
  return renderGradePage({ page, data, source: SAMPLE_SOURCE }).split('\n');
}

const EXPECTED_LINES: readonly (readonly [string, string])[] = [
  ['題名', '# 算数：第1学年'],
  ['ID', '- **ID**：`math-g1`'],
  [
    'データへのリンク',
    '- **データ**：[data/math/grade-1.json](../../data/math/grade-1.json)',
  ],
  ['目次の単元', '    - [A(1) 数の構成](#a1-数の構成)'],
  ['目標', '- **(1) 知識及び技能**：数を理解する'],
  ['領域の見出し', '### A 数と計算'],
  ['単元の見出し', '#### A(1) 数の構成'],
  [
    '単元のコード',
    '- **コード**：[0000000000000003](https://example.com/code/0000000000000003)',
  ],
  ['柱のまとまり', '- **思考力、判断力、表現力等**'],
  ['1文の事項', '  - **イ(ア)**：数え方を考える'],
  ['複数の文の事項', '    - **個数**を比べる'],
  ['内容の取扱いへの案内', '- **内容の取扱い**：[(1)](#内容の取扱い)'],
  ['内容の取扱い', '- **(1)**：1万も扱う'],
  ['内容の取扱いの対象', '  - **対象**：A(1)'],
];

for (const [name, line] of EXPECTED_LINES) {
  test(`renderGradePage：${name}を出力する`, () => {
    assert.ok(renderSample().includes(line), `行がない：${line}`);
  });
}

test('renderGradePage：内容の取扱いがない学年では、その節を出力しない', () => {
  const { handling: _handling, ...page } = samplePage();
  assert.ok(!renderSample(page).includes('## 内容の取扱い'));
});

test('renderGradePage：末尾は改行1つで終わる', () => {
  const lines = renderSample();
  assert.equal(lines.at(-1), '');
  assert.notEqual(lines.at(-2), '');
});
