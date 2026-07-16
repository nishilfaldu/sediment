#!/usr/bin/env node
/**
 * Round-trip checks for store encode/decode and OG parsing.
 * Run: node --experimental-strip-types scripts/roundtrip.mts
 * (or: bun scripts/roundtrip.mts)
 */
import { parseOg } from "../src/og.ts";
import { decodeStore, encodeStore, type Item } from "../src/store.ts";
import { EMPTY } from "../src/bytes.ts";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function item(partial: Partial<Item> & Pick<Item, "id" | "dayId" | "type">): Item {
  return {
    id: partial.id,
    dayId: partial.dayId,
    type: partial.type,
    content: partial.content ?? EMPTY,
    sourceUrl: partial.sourceUrl ?? EMPTY,
    title: partial.title ?? EMPTY,
    description: partial.description ?? EMPTY,
    thumbnail: partial.thumbnail ?? EMPTY,
    createdAt: partial.createdAt ?? 1,
    updatedAt: partial.updatedAt ?? 1,
  };
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function testStoreRoundTrip(): void {
  const items: Item[] = [
    item({
      id: utf8("1"),
      dayId: utf8("2026-07-16"),
      type: "link",
      sourceUrl: utf8("https://example.com/a?q=1"),
      title: utf8('Hello "world"\nline'),
      description: utf8("desc\twith\ttabs"),
      createdAt: 100,
      updatedAt: 200,
    }),
    item({
      id: utf8("2"),
      dayId: utf8("2026-07-16"),
      type: "text",
      content: utf8("a note with emoji ✨ and\nnewlines"),
      createdAt: 300,
      updatedAt: 300,
    }),
  ];
  const encoded = encodeStore({ nextId: 3, items });
  const decoded = decodeStore(encoded);
  assert(decoded !== null, "decode failed");
  assert(decoded.nextId === 3, "nextId mismatch");
  assert(decoded.items.length === 2, "item count");
  assert(decoded.items[0].type === "link", "link type");
  assert(
    Buffer.from(decoded.items[0].title).toString() === 'Hello "world"\nline',
    "title round-trip",
  );
  assert(
    Buffer.from(decoded.items[0].description).toString() === "desc\twith\ttabs",
    "description round-trip",
  );
  assert(decoded.items[1].type === "text", "text type");
  assert(
    Buffer.from(decoded.items[1].content).toString() === "a note with emoji ✨ and\nnewlines",
    "note content round-trip",
  );
  assert(decodeStore(utf8("not-a-store")) === null, "rejects garbage");
  assert(decodeStore(utf8("")) === null, "rejects empty");
}

function testOgParse(): void {
  const html = utf8(`
    <html><head>
      <meta property="og:title" content="OG Title">
      <meta name="description" content="Fallback desc">
      <meta property="og:image" content="https://cdn.example/img.png">
      <title>Page Title</title>
    </head></html>
  `);
  const meta = parseOg(html);
  assert(Buffer.from(meta.title).toString() === "OG Title", "og:title");
  assert(Buffer.from(meta.description).toString() === "Fallback desc", "description");
  assert(Buffer.from(meta.thumbnail).toString() === "https://cdn.example/img.png", "og:image");

  const titleOnly = parseOg(utf8("<html><title>Just Title</title></html>"));
  assert(Buffer.from(titleOnly.title).toString() === "Just Title", "title tag fallback");
  assert(titleOnly.description.length === 0, "no description");
}

testStoreRoundTrip();
testOgParse();
console.log("roundtrip: ok");
