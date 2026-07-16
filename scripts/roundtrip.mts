#!/usr/bin/env node
/**
 * Round-trip checks for store encode/decode and OG parsing.
 * Run: bun scripts/roundtrip.mts
 *
 * Byte-text methods (startsWith/…) are compile-time for the native core;
 * under bun we polyfill the few used by tag helpers.
 */
import { parseOg, resolveAbsoluteUrl } from "../src/og.ts";
import { resolveThumbnailUrl, youtubeVideoId } from "../src/tags.ts";
import { decodeStore, encodeStore, type Item } from "../src/store.ts";
import { EMPTY } from "../src/bytes.ts";

function installByteTextPolyfill(): void {
  const proto = Uint8Array.prototype as Uint8Array & {
    startsWith?: (needle: Uint8Array) => boolean;
    endsWith?: (needle: Uint8Array) => boolean;
  };
  if (typeof proto.startsWith !== "function") {
    proto.startsWith = function startsWith(needle: Uint8Array): boolean {
      if (needle.length === 0) return true;
      if (needle.length > this.length) return false;
      for (let i = 0; i < needle.length; i++) {
        if (this[i] !== needle[i]) return false;
      }
      return true;
    };
  }
  if (typeof proto.endsWith !== "function") {
    proto.endsWith = function endsWith(needle: Uint8Array): boolean {
      if (needle.length === 0) return true;
      if (needle.length > this.length) return false;
      const off = this.length - needle.length;
      for (let i = 0; i < needle.length; i++) {
        if (this[off + i] !== needle[i]) return false;
      }
      return true;
    };
  }
}

installByteTextPolyfill();

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

function asText(b: Uint8Array): string {
  return Buffer.from(b).toString();
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
      content: utf8("a note with emoji and newlines"),
      createdAt: 300,
      updatedAt: 300,
    }),
  ];
  const encoded = encodeStore({ nextId: 3, items });
  const decoded = decodeStore(encoded);
  assert(decoded !== null, "decode failed");
  assert(decoded!.nextId === 3, "nextId mismatch");
  assert(decoded!.items.length === 2, "item count");
  assert(decoded!.items[0].type === "link", "link type");
  assert(asText(decoded!.items[0].title) === 'Hello "world"\nline', "title round-trip");
  assert(asText(decoded!.items[0].description) === "desc\twith\ttabs", "description round-trip");
  assert(decoded!.items[1].type === "text", "text type");
  assert(asText(decoded!.items[1].content) === "a note with emoji and newlines", "note content round-trip");
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
  assert(asText(meta.title) === "OG Title", "og:title");
  assert(asText(meta.description) === "Fallback desc", "description");
  assert(asText(meta.thumbnail) === "https://cdn.example/img.png", "og:image");

  const titleOnly = parseOg(utf8("<html><title>Just Title</title></html>"));
  assert(asText(titleOnly.title) === "Just Title", "title tag fallback");
  assert(titleOnly.description.length === 0, "no description");

  const singleQuotes = parseOg(
    utf8("<meta property='og:title' content='Single Title'><meta property='twitter:image' content='https://cdn.example/t.png'>"),
  );
  assert(asText(singleQuotes.title) === "Single Title", "single-quoted og:title");
  assert(asText(singleQuotes.thumbnail) === "https://cdn.example/t.png", "single-quoted image");

  const spaced = parseOg(
    utf8('<meta property = "og:title" content = "Spaced"><meta name = "og:image:secure_url" content = "https://cdn.example/secure.png">'),
  );
  assert(asText(spaced.title) === "Spaced", "spaced attributes");
  assert(asText(spaced.thumbnail) === "https://cdn.example/secure.png", "secure_url");

  const entities = parseOg(
    utf8('<meta property="og:title" content="Tom &amp; Jerry"><meta property="og:image" content="/img/cover.png">'),
  );
  assert(asText(entities.title) === "Tom & Jerry", "entity decode");
  assert(asText(entities.thumbnail) === "/img/cover.png", "relative image kept raw in parse");
}

function testResolveAbsoluteUrl(): void {
  const page = utf8("https://example.com/posts/hello");
  assert(
    asText(resolveAbsoluteUrl(page, utf8("/img/cover.png"))) === "https://example.com/img/cover.png",
    "root-relative",
  );
  assert(
    asText(resolveAbsoluteUrl(page, utf8("cover.png"))) === "https://example.com/posts/cover.png",
    "path-relative",
  );
  assert(
    asText(resolveAbsoluteUrl(page, utf8("//cdn.example/a.png"))) === "https://cdn.example/a.png",
    "protocol-relative",
  );
  assert(
    asText(resolveAbsoluteUrl(page, utf8("https://cdn.example/a.png"))) === "https://cdn.example/a.png",
    "absolute passthrough",
  );
}

function testYoutubeThumbs(): void {
  const watch = utf8("https://www.youtube.com/watch?v=abc123XYZ");
  const id = youtubeVideoId(watch);
  assert(id !== null && asText(id!) === "abc123XYZ", "watch v=");
  assert(
    asText(resolveThumbnailUrl(watch, utf8("https://i.ytimg.com/vi/abc123XYZ/maxresdefault.jpg"))) ===
      "https://img.youtube.com/vi/abc123XYZ/hqdefault.jpg",
    "prefer hqdefault over large OG",
  );

  const live = utf8("https://www.youtube.com/live/liveId99");
  const liveId = youtubeVideoId(live);
  assert(liveId !== null && asText(liveId!) === "liveId99", "live path");

  const shorts = utf8("https://www.youtube.com/shorts/shortId1");
  const shortId = youtubeVideoId(shorts);
  assert(shortId !== null && asText(shortId!) === "shortId1", "shorts");
}

testStoreRoundTrip();
testOgParse();
testResolveAbsoluteUrl();
testYoutubeThumbs();
console.log("roundtrip: ok");
