import { asciiBytes } from "@native-sdk/core";
import { EMPTY, type Bytes } from "./bytes.ts";
import { hostEndsWith, hostEquals, hostnameOf } from "./detect.ts";

/** Specimen tag for a link URL — uppercase field-guide labels. */
export function linkTagLabel(url: Bytes): Bytes {
  const host = hostnameOf(url);
  if (
    hostEquals(host, asciiBytes("youtu.be")) ||
    hostEquals(host, asciiBytes("youtube.com")) ||
    hostEndsWith(host, asciiBytes(".youtube.com"))
  ) {
    return asciiBytes("YOUTUBE");
  }
  if (
    hostEquals(host, asciiBytes("x.com")) ||
    hostEquals(host, asciiBytes("twitter.com")) ||
    hostEquals(host, asciiBytes("t.co"))
  ) {
    return asciiBytes("X");
  }
  if (hostEquals(host, asciiBytes("instagram.com")) || hostEquals(host, asciiBytes("instagr.am"))) {
    return asciiBytes("INSTAGRAM");
  }
  if (hostEquals(host, asciiBytes("linkedin.com")) || hostEquals(host, asciiBytes("lnkd.in"))) {
    return asciiBytes("LINKEDIN");
  }
  if (hostEquals(host, asciiBytes("reddit.com")) || hostEquals(host, asciiBytes("redd.it"))) {
    return asciiBytes("REDDIT");
  }
  if (hostEquals(host, asciiBytes("github.com"))) return asciiBytes("GITHUB");
  if (hostEquals(host, asciiBytes("gitlab.com"))) return asciiBytes("GITLAB");
  if (hostEquals(host, asciiBytes("news.ycombinator.com"))) return asciiBytes("HN");
  if (hostEquals(host, asciiBytes("stackoverflow.com"))) return asciiBytes("SO");
  if (hostEquals(host, asciiBytes("medium.com")) || hostEndsWith(host, asciiBytes(".medium.com"))) {
    return asciiBytes("MEDIUM");
  }
  if (hostEquals(host, asciiBytes("substack.com")) || hostEndsWith(host, asciiBytes(".substack.com"))) {
    return asciiBytes("SUBSTACK");
  }
  if (hostEquals(host, asciiBytes("spotify.com")) || hostEndsWith(host, asciiBytes(".spotify.com"))) {
    return asciiBytes("SPOTIFY");
  }
  if (hostEquals(host, asciiBytes("soundcloud.com")) || hostEquals(host, asciiBytes("snd.sc"))) {
    return asciiBytes("SOUNDCLOUD");
  }
  if (hostEquals(host, asciiBytes("vimeo.com"))) return asciiBytes("VIMEO");
  if (hostEquals(host, asciiBytes("tiktok.com")) || hostEndsWith(host, asciiBytes(".tiktok.com"))) {
    return asciiBytes("TIKTOK");
  }
  if (hostEquals(host, asciiBytes("twitch.tv"))) return asciiBytes("TWITCH");
  if (hostEquals(host, asciiBytes("wikipedia.org")) || hostEndsWith(host, asciiBytes(".wikipedia.org"))) {
    return asciiBytes("WIKIPEDIA");
  }
  if (hostEquals(host, asciiBytes("arxiv.org"))) return asciiBytes("ARXIV");
  if (hostEquals(host, asciiBytes("npmjs.com")) || hostEquals(host, asciiBytes("www.npmjs.com"))) {
    return asciiBytes("NPM");
  }
  if (hostEquals(host, asciiBytes("pypi.org"))) return asciiBytes("PYPI");
  if (hostEquals(host, asciiBytes("figma.com"))) return asciiBytes("FIGMA");
  if (hostEquals(host, asciiBytes("notion.so")) || hostEquals(host, asciiBytes("notion.com"))) {
    return asciiBytes("NOTION");
  }
  if (hostEquals(host, asciiBytes("bsky.app"))) return asciiBytes("BLUESKY");
  if (hostEquals(host, asciiBytes("threads.net"))) return asciiBytes("THREADS");
  if (hostEquals(host, asciiBytes("producthunt.com"))) return asciiBytes("PH");
  return asciiBytes("LINK");
}

export function isVideoTag(tag: Bytes): boolean {
  return (
    tag.length === 7 &&
    tag[0] === 0x59 &&
    tag[1] === 0x4f &&
    tag[2] === 0x55 &&
    tag[3] === 0x54 &&
    tag[4] === 0x55 &&
    tag[5] === 0x42 &&
    tag[6] === 0x45
  ); // YOUTUBE
}

/** YouTube watch / share id, or null. */
export function youtubeVideoId(url: Bytes): Bytes | null {
  const host = hostnameOf(url);
  if (hostEquals(host, asciiBytes("youtu.be"))) {
    return pathFirstSegment(url);
  }
  if (hostEquals(host, asciiBytes("youtube.com")) || hostEndsWith(host, asciiBytes(".youtube.com"))) {
    const v = queryParam(url, asciiBytes("v"));
    if (v !== null && v.length > 0) return v;
    // /shorts/ID or /embed/ID
    const shorts = pathAfter(url, asciiBytes("/shorts/"));
    if (shorts !== null) return shorts;
    const embed = pathAfter(url, asciiBytes("/embed/"));
    if (embed !== null) return embed;
  }
  return null;
}

/** Prefer stored OG thumbnail; else YouTube hqdefault. */
export function resolveThumbnailUrl(sourceUrl: Bytes, stored: Bytes): Bytes {
  if (stored.length > 0) return stored;
  const yt = youtubeVideoId(sourceUrl);
  if (yt === null) return EMPTY;
  // https://img.youtube.com/vi/<id>/hqdefault.jpg
  const prefix = asciiBytes("https://img.youtube.com/vi/");
  const suffix = asciiBytes("/hqdefault.jpg");
  const out = new Uint8Array(prefix.length + yt.length + suffix.length);
  out.set(prefix, 0);
  out.set(yt, prefix.length);
  out.set(suffix, prefix.length + yt.length);
  return out;
}

export function domainLabel(url: Bytes): Bytes {
  return hostnameOf(url);
}

/** "Today" / "07-16" for the history rail (field-guide compact). */
export function formatDaySidebar(dayId: Bytes, todayId: Bytes): Bytes {
  if (dayId.length < 10 || todayId.length < 10) return dayId;
  if (bytesEq(dayId, todayId)) return asciiBytes("Today");
  // MM-DD from YYYY-MM-DD — no fractional math (NS1016).
  return dayId.subarray(5, 10);
}

/** "Today" / raw day id for the board heading. */
export function formatDayHeading(dayId: Bytes, todayId: Bytes): Bytes {
  if (dayId.length < 10 || todayId.length < 10) return dayId;
  if (bytesEq(dayId, todayId)) return asciiBytes("Today");
  return dayId;
}

function bytesEq(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function pathFirstSegment(url: Bytes): Bytes | null {
  let start = 0;
  if (url.startsWith(asciiBytes("https://"))) start = 8;
  else if (url.startsWith(asciiBytes("http://"))) start = 7;
  else return null;
  while (start < url.length && url[start] !== 0x2f) start += 1;
  if (start >= url.length) return null;
  start += 1;
  let end = start;
  while (end < url.length) {
    const c = url[end];
    if (c === 0x2f || c === 0x3f || c === 0x23) break;
    end += 1;
  }
  if (end <= start) return null;
  return url.subarray(start, end);
}

function pathAfter(url: Bytes, marker: Bytes): Bytes | null {
  for (let i = 0; i + marker.length <= url.length; i++) {
    let match = true;
    for (let j = 0; j < marker.length; j++) {
      if (url[i + j] !== marker[j]) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    const start = i + marker.length;
    let end = start;
    while (end < url.length) {
      const c = url[end];
      if (c === 0x2f || c === 0x3f || c === 0x23) break;
      end += 1;
    }
    if (end > start) return url.subarray(start, end);
    return null;
  }
  return null;
}

function queryParam(url: Bytes, key: Bytes): Bytes | null {
  let q = -1;
  for (let i = 0; i < url.length; i++) {
    if (url[i] === 0x3f) {
      q = i + 1;
      break;
    }
  }
  if (q < 0) return null;
  let i = q;
  while (i < url.length) {
    if (url[i] === 0x23) break;
    let eq = i;
    while (eq < url.length && url[eq] !== 0x3d && url[eq] !== 0x26 && url[eq] !== 0x23) eq += 1;
    const name = url.subarray(i, eq);
    if (eq >= url.length || url[eq] !== 0x3d) break;
    let end = eq + 1;
    while (end < url.length && url[end] !== 0x26 && url[end] !== 0x23) end += 1;
    if (name.length === key.length) {
      let same = true;
      for (let k = 0; k < key.length; k++) {
        if (name[k] !== key[k]) {
          same = false;
          break;
        }
      }
      if (same) return url.subarray(eq + 1, end);
    }
    if (end < url.length && url[end] === 0x26) {
      i = end + 1;
    } else {
      break;
    }
  }
  return null;
}
