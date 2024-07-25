/* eslint-disable @typescript-eslint/no-explicit-any */

export function isString(val: any): val is string {
  return typeof val === 'string';
}

export function isStack(val: unknown): val is string {
  if (!isString(val)) {
    return false;
  }

  return /^(.)+\n\s+at .+:\d+:\d+/.test(val);
}
