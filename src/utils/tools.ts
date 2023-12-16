import type { EOL } from "@/types/lsp";
import type { ReadonlyRecord } from "@/types/tools";

/**
 * Omit keys from an object
 * @param obj The object to omit keys from.
 * @param keys The keys to omit.
 * @returns
 *
 * @example
 * ```javascript
 * omit({ a: 1, b: 2, c: 3 }, "a"); // => { b: 2, c: 3 }
 * omit({ a: 1, b: 2, c: 3 }, "a", "c"); // => { b: 2 }
 * ```
 */
export const omit = <O extends ReadonlyRecord<PropertyKey, unknown>, KS extends Array<keyof O>>(
  obj: O,
  ...keys: KS
): Omit<O, KS[number]> extends infer U ? { [K in keyof U]: U[K] } : never => {
  const result: Record<PropertyKey, unknown> = {};
  for (const key in obj) if (!keys.includes(key)) result[key] = obj[key];
  return result as never;
};

/**
 * Get a global variable.
 * @param name The name of the global variable.
 * @returns The value of the global variable.
 */
export const getGlobalVar = <K extends keyof typeof global | (string & NonNullable<unknown>)>(
  name: K,
): K extends keyof typeof global ? (typeof global)[K] : unknown =>
  global[name as keyof typeof global];
/**
 * Set a global variable.
 * @param name The name of the global variable.
 * @param value The value of the global variable to set.
 */
export const setGlobalVar = <K extends keyof typeof global | (string & NonNullable<unknown>)>(
  name: K,
  value: K extends keyof typeof global ? (typeof global)[K] : unknown,
) => Object.defineProperty(global, name, { value });

/**
 * Create a CSS string template (Alias of `String.raw`).
 * @param template The template string.
 * @param substitutions The substitutions.
 * @returns The CSS string.
 */
export const css = (
  template: { raw: readonly string[] | ArrayLike<string> },
  ...substitutions: unknown[]
) => String.raw(template, ...substitutions);

/**
 * Register CSS to global context.
 * @param css The CSS string.
 */
export const registerCSS = (css: string) => {
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
};

/**
 * Slice text by range.
 * @param text The text to slice.
 * @param range The range to slice.
 * @param eol The end of line character. Defaults to `"\n"`.
 * @param returnRows Whether to return rows instead of a string. Defaults to `false`.
 * @returns The sliced text or rows determined by `returnRows`.
 */
export const sliceTextByRange = <ReturnRows extends boolean = false>(
  text: string,
  range: { start: { line: number; character: number }; end: { line: number; character: number } },
  eol: EOL = "\n",
  returnRows?: ReturnRows,
): ReturnRows extends true ? string[] : string => {
  const { end, start } = range;
  returnRows = (returnRows ?? false) as ReturnRows;
  const lines = text.split(eol);
  const startLine = lines[start.line]!.slice(start.character);
  if (start.line === end.line)
    return (returnRows ? [startLine] : startLine) as ReturnRows extends true ? string[] : string;

  const endLine = lines[end.line]!.slice(0, end.character);

  if (returnRows)
    return [startLine, ...lines.slice(start.line + 1, end.line), endLine] as ReturnRows extends true
      ? string[]
      : string;
  else
    return [startLine, ...lines.slice(start.line + 1, end.line), endLine].join(
      eol,
    ) as ReturnRows extends true ? string[] : string;
};
/**
 * Replace `text` in `range` with `newText`.
 * @param text The text to replace.
 * @param range The range to replace.
 * @param newText The new text.
 * @param eol The end of line character. Defaults to `"\n"`.
 */
export const replaceTextByRange = (
  text: string,
  range: { start: { line: number; character: number }; end: { line: number; character: number } },
  newText: string,
  eol: EOL = "\n",
) => {
  const { end, start } = range;
  const lines = text.split(eol);
  const startLine = lines[start.line]!;

  if (start.line === end.line)
    return [
      ...lines.slice(0, start.line),
      startLine.slice(0, start.character) + newText + startLine.slice(end.character),
      ...lines.slice(end.line + 1),
    ].join(eol);

  const endLine = lines[end.line]!;
  return [
    ...lines.slice(0, start.line),
    startLine.slice(0, start.character) + newText,
    ...lines.slice(start.line + 1, end.line),
    endLine.slice(end.character),
  ].join(eol);
};