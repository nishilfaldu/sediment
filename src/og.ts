import { asciiBytes } from "@native-sdk/core";
import {
  EMPTY,
  bytesEqualIgnoreCase,
  indexOfBytesIgnoreCase,
  type Bytes,
} from "./bytes.ts";

export interface OgMeta {
  readonly title: Bytes;
  readonly description: Bytes;
  readonly thumbnail: Bytes;
}

const EMPTY_META: OgMeta = {
  title: EMPTY,
  description: EMPTY,
  thumbnail: EMPTY,
};

function findMetaContent(html: Bytes, property: Bytes): Bytes {
  const propKey = asciiBytes('property="');
  const nameKey = asciiBytes('name="');
  const contentKey = asciiBytes('content="');

  let i = 0;
  while (i < html.length) {
    const tagStart = indexOfBytesIgnoreCase(html, asciiBytes("<meta"), i);
    if (tagStart < 0) break;
    const tagEnd = indexOfBytesIgnoreCase(html, asciiBytes(">"), tagStart);
    if (tagEnd < 0) break;
    const tag = html.slice(tagStart, tagEnd + 1);

    const prop = attrValue(tag, propKey);
    const name = attrValue(tag, nameKey);
    const content = attrValue(tag, contentKey);
    if (content.length > 0) {
      if (bytesEqualIgnoreCase(prop, property) || bytesEqualIgnoreCase(name, property)) {
        return content;
      }
    }
    i = tagEnd + 1;
  }
  return EMPTY;
}

function attrValue(tag: Bytes, key: Bytes): Bytes {
  const at = indexOfBytesIgnoreCase(tag, key, 0);
  if (at < 0) return EMPTY;
  const start = at + key.length;
  let end = start;
  while (end < tag.length && tag[end] !== 0x22) end += 1;
  if (end >= tag.length) return EMPTY;
  return tag.slice(start, end);
}

function titleTag(html: Bytes): Bytes {
  const open = indexOfBytesIgnoreCase(html, asciiBytes("<title"), 0);
  if (open < 0) return EMPTY;
  const gt = indexOfBytesIgnoreCase(html, asciiBytes(">"), open);
  if (gt < 0) return EMPTY;
  const close = indexOfBytesIgnoreCase(html, asciiBytes("</title>"), gt);
  if (close < 0) return EMPTY;
  return html.slice(gt + 1, close);
}

/** Best-effort Open Graph / Twitter / title extraction from an HTML body. */
export function parseOg(html: Bytes): OgMeta {
  let title = findMetaContent(html, asciiBytes("og:title"));
  if (title.length === 0) title = findMetaContent(html, asciiBytes("twitter:title"));
  if (title.length === 0) title = titleTag(html);

  let description = findMetaContent(html, asciiBytes("og:description"));
  if (description.length === 0) description = findMetaContent(html, asciiBytes("twitter:description"));
  if (description.length === 0) description = findMetaContent(html, asciiBytes("description"));

  let thumbnail = findMetaContent(html, asciiBytes("og:image"));
  if (thumbnail.length === 0) thumbnail = findMetaContent(html, asciiBytes("twitter:image"));

  if (title.length === 0 && description.length === 0 && thumbnail.length === 0) {
    return EMPTY_META;
  }
  return { title: title, description: description, thumbnail: thumbnail };
}
