/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/questionnaires/get-deep.ts
export function getDeep(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((cursor, key) => (cursor == null ? undefined : cursor[key]), obj);
}