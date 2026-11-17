/** データファイルの正規の書式。項目を1行に収め、行数と差分を小さく保つ。 */

const INDENT_UNIT = '  ';

type JsonObject = { readonly [key: string]: unknown };

function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== 'object';
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function indent(depth: number): string {
  return INDENT_UNIT.repeat(depth);
}

function formatArray(values: readonly unknown[], depth: number): string {
  if (values.every(isPrimitive)) {
    return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
  }
  const lines = values.map(
    (value) => indent(depth + 1) + formatValue(value, depth + 1),
  );
  return `[\n${lines.join(',\n')}\n${indent(depth)}]`;
}

function formatEntry(key: string, value: unknown, depth: number): string {
  return `${JSON.stringify(key)}: ${formatValue(value, depth)}`;
}

function formatInlineObject(value: JsonObject, depth: number): string {
  const entries = Object.entries(value).map(([key, entry]) =>
    formatEntry(key, entry, depth),
  );
  return `{${entries.join(', ')}}`;
}

function formatValue(value: unknown, depth: number): string {
  if (Array.isArray(value)) {
    return formatArray(value, depth);
  }
  return isObject(value)
    ? formatInlineObject(value, depth)
    : JSON.stringify(value);
}

function formatRootObject(value: JsonObject): string {
  const entries = Object.entries(value).map(
    ([key, entry]) => indent(1) + formatEntry(key, entry, 1),
  );
  return `{\n${entries.join(',\n')}\n}`;
}

/** 値を正規の書式の JSON 文字列にする。最上位のキーは1行ずつ、配列内の項目は1行に1件とする。 */
export function formatJson(value: unknown): string {
  const body = isObject(value)
    ? formatRootObject(value)
    : formatValue(value, 0);
  return `${body}\n`;
}
