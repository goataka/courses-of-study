import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkKanjiTable, parseKanjiTable } from './kanji.ts';

function page(total: number, grade2: string): string {
  return [
    '# 国語：学年別漢字配当表',
    '',
    `- **総字数**：${total}字`,
    '',
    '## 第1学年',
    '',
    '- **字数**：3字',
    '- **累計**：3字',
    '- **漢字**',
    '  - 一右',
    '  - 雨',
    '',
    '## 第2学年',
    '',
    '- **字数**：2字',
    '- **累計**：5字',
    '- **漢字**',
    `  - ${grade2}`,
    '',
  ].join('\n');
}

test('parseKanjiTable：学年ごとに字数と漢字を読み取る', () => {
  const table = parseKanjiTable(page(5, '引羽'));
  assert.equal(table.total, 5);
  assert.deepEqual(
    table.grades.map((grade) => [grade.grade, grade.count, grade.characters]),
    [
      [1, 3, ['一', '右', '雨']],
      [2, 2, ['引', '羽']],
    ],
  );
});

test('checkKanjiTable：数がそろっていれば問題を返さない', () => {
  assert.deepEqual(checkKanjiTable(parseKanjiTable(page(5, '引羽'))), []);
});

test('checkKanjiTable：字数、累計、総字数のずれを報告する', () => {
  const problems = checkKanjiTable(parseKanjiTable(page(6, '引')));
  assert.deepEqual(problems, [
    '第2学年の漢字が1字で、字数の2字と一致しない',
    '第2学年の累計が5字で、4字と一致しない',
    '総字数が6字で、漢字の合計4字と一致しない',
  ]);
});

test('checkKanjiTable：重複した漢字を報告する', () => {
  const problems = checkKanjiTable(parseKanjiTable(page(5, '引一')));
  assert.deepEqual(problems, ['漢字が重複している：一']);
});
