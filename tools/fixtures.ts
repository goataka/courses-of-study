/** テスト用の小さなデータ。1教科、1学年、1単元だけを持つ。 */

import type {
  CatalogSubject,
  CurriculumNode,
  Dataset,
  GradePage,
  KanjiTable,
  Source,
  Subject,
} from './model.ts';

const CODE_LENGTH = 16;

export const SAMPLE_SOURCE: Source = {
  title: '小学校学習指導要領 平成29年告示',
  notice: '平成29年文部科学省告示第63号',
  url: 'https://example.com/source.pdf',
  codeTable: '小学校学習指導要領コード',
  codeTableUrl: 'https://example.com/codes',
  codeBaseUrl: 'https://example.com/code/',
};

export const SAMPLE_KANJI: KanjiTable = {
  id: 'japanese-kanji',
  name: '学年別漢字配当表',
  code: sampleCode(90),
  total: 5,
  grades: [
    { grade: 1, code: sampleCode(91), count: 3, characters: '一右雨' },
    { grade: 2, code: sampleCode(92), count: 2, characters: '引羽' },
  ],
};

/** 部分的に差し替えたい項目。指定しない項目は妥当な値になる。 */
export interface SampleOverrides {
  readonly item?: Partial<CurriculumNode>;
  readonly unit?: Partial<CurriculumNode>;
  readonly handling?: Partial<CurriculumNode>;
  readonly kanji?: KanjiTable;
}

export function sampleCode(serial: number): string {
  return String(serial).padStart(CODE_LENGTH, '0');
}

function knowledgeItem(overrides: SampleOverrides): CurriculumNode {
  return {
    id: 'math-g1-A-1-a-a',
    code: sampleCode(4),
    no: 'ア(ア)',
    kind: 'item',
    category: 'knowledge',
    text: '個数を比べる。順番を数える',
    keywords: ['個数'],
    ...overrides.item,
  };
}

function thinkingItem(): CurriculumNode {
  return {
    id: 'math-g1-A-1-i-a',
    code: sampleCode(5),
    no: 'イ(ア)',
    kind: 'item',
    category: 'thinking',
    text: '数え方を考える',
  };
}

function unit(overrides: SampleOverrides): CurriculumNode {
  return {
    id: 'math-g1-A-1',
    code: sampleCode(3),
    no: '(1)',
    kind: 'section',
    title: '数の構成',
    children: [knowledgeItem(overrides), thinkingItem()],
    ...overrides.unit,
  };
}

function domain(overrides: SampleOverrides): CurriculumNode {
  return {
    id: 'math-g1-A',
    code: sampleCode(2),
    no: 'A',
    kind: 'section',
    title: '数と計算',
    children: [unit(overrides)],
  };
}

function handlingNote(overrides: SampleOverrides): CurriculumNode {
  return {
    id: 'math-g1-handling-1',
    code: sampleCode(6),
    no: '(1)',
    kind: 'handling',
    text: '1万も扱う',
    refs: ['math-g1-A-1'],
    ...overrides.handling,
  };
}

function goal(id: string, serial: number, text: string): CurriculumNode {
  return {
    id,
    code: sampleCode(serial),
    no: '(1)',
    kind: 'goal',
    category: 'knowledge',
    text,
  };
}

export function samplePage(overrides: SampleOverrides = {}): GradePage {
  return {
    id: 'math-g1',
    subject: 'math',
    grades: [1],
    name: '第1学年',
    code: sampleCode(0),
    goals: [goal('math-g1-goal-1', 1, '数を理解する')],
    contents: [domain(overrides)],
    handling: [handlingNote(overrides)],
  };
}

function planningNote(): CurriculumNode {
  return {
    id: 'math-planning-1',
    code: sampleCode(12),
    no: '1',
    kind: 'planning',
    text: '計画的に指導する',
  };
}

export function sampleSubject(): Subject {
  return {
    id: 'math',
    name: '算数',
    code: sampleCode(10),
    section: '第2章 第3節',
    goalsText: '数学的に考える資質と能力を育成する',
    goals: [goal('math-goal-1', 11, '概念を理解する')],
    planning: [planningNote()],
  };
}

export function sampleEntry(withKanji: boolean): CatalogSubject {
  const page = {
    id: 'math-g1',
    grades: [1],
    name: '第1学年',
    path: 'math/grade-1.json',
  };
  const entry: CatalogSubject = {
    id: 'math',
    name: '算数',
    path: 'math/subject.json',
    pages: [page],
  };
  return withKanji ? { ...entry, kanji: 'math/kanji.json' } : entry;
}

/** 妥当なデータ一式を作る。overrides で一部を不正な値に差し替えられる。 */
export function sampleDataset(overrides: SampleOverrides = {}): Dataset {
  const entry = sampleEntry(overrides.kanji !== undefined);
  const pages = [samplePage(overrides)];
  const base = { entry, subject: sampleSubject(), pages };
  const data = overrides.kanji ? { ...base, kanji: overrides.kanji } : base;
  const catalog = {
    schemaVersion: 1,
    source: SAMPLE_SOURCE,
    subjects: [entry],
  };
  return { catalog, subjects: [data] };
}
