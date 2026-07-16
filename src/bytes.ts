import { asciiBytes } from "@native-sdk/core";

export type Bytes = Uint8Array;

export const EMPTY: Bytes = asciiBytes("");

export function concatAll(parts: readonly Bytes[]): Bytes {
  let total = 0;
  for (const part of parts) total += part.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

export function concat2(a: Bytes, b: Bytes): Bytes {
  return concatAll([a, b]);
}

export function concat3(a: Bytes, b: Bytes, c: Bytes): Bytes {
  return concatAll([a, b, c]);
}

export function bytesEqual(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function toLowerAsciiByte(c: number): number {
  return c >= 0x41 && c <= 0x5a ? c + 0x20 : c;
}

export function bytesEqualIgnoreCase(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (toLowerAsciiByte(a[i]) !== toLowerAsciiByte(b[i])) return false;
  }
  return true;
}

export function indexOfBytesIgnoreCase(hay: Bytes, needle: Bytes, from: number): number {
  if (needle.length === 0) return from;
  for (let i = from; i <= hay.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (toLowerAsciiByte(hay[i + j]) !== toLowerAsciiByte(needle[j])) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

function toLowerAscii(b: Bytes): Bytes {
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) {
    out[i] = toLowerAsciiByte(b[i]);
  }
  return out;
}

export function containsIgnoreCaseAscii(hay: Bytes, needle: Bytes): boolean {
  if (needle.length === 0) return true;
  if (needle.length > hay.length) return false;
  const lowerNeedle = toLowerAscii(needle);
  for (let i = 0; i <= hay.length - lowerNeedle.length; i++) {
    let ok = true;
    for (let j = 0; j < lowerNeedle.length; j++) {
      if (toLowerAsciiByte(hay[i + j]) !== lowerNeedle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function decimalBytes(n: number): Bytes {
  if (n <= 0) return asciiBytes("0");
  let v = Math.floor(n);
  const digits: number[] = [];
  while (v > 0) {
    digits.push(0x30 + (v % 10));
    v = Math.floor(v / 10);
  }
  const out = new Uint8Array(digits.length);
  for (let i = 0; i < digits.length; i++) {
    out[i] = digits[digits.length - 1 - i];
  }
  return out;
}

export function parseDecimal(b: Bytes, start: number, end: number): number {
  let n = 0;
  for (let i = start; i < end; i++) {
    const c = b[i];
    if (c < 0x30 || c > 0x39) return -1;
    n = n * 10 + (c - 0x30);
  }
  return n;
}

export function trimAscii(b: Bytes): Bytes {
  let start = 0;
  let end = b.length;
  while (start < end && isSpace(b[start])) start += 1;
  while (end > start && isSpace(b[end - 1])) end -= 1;
  if (start === 0 && end === b.length) return b;
  return b.slice(start, end);
}

function isSpace(c: number): boolean {
  return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
}
