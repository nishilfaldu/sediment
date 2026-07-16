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
  // YOUTUBE
  if (
    tag.length === 7 &&
    tag[0] === 0x59 &&
    tag[1] === 0x4f &&
    tag[2] === 0x55 &&
    tag[3] === 0x54 &&
    tag[4] === 0x55 &&
    tag[5] === 0x42 &&
    tag[6] === 0x45
  ) {
    return true;
  }
  // VIMEO
  if (
    tag.length === 5 &&
    tag[0] === 0x56 &&
    tag[1] === 0x49 &&
    tag[2] === 0x4d &&
    tag[3] === 0x45 &&
    tag[4] === 0x4f
  ) {
    return true;
  }
  // TIKTOK
  if (
    tag.length === 6 &&
    tag[0] === 0x54 &&
    tag[1] === 0x49 &&
    tag[2] === 0x4b &&
    tag[3] === 0x54 &&
    tag[4] === 0x4f &&
    tag[5] === 0x4b
  ) {
    return true;
  }
  return false;
}

/** YouTube watch / share id, or null. */
export function youtubeVideoId(url: Bytes): Bytes | null {
  const host = hostnameOf(url);
  if (hostEquals(host, asciiBytes("youtu.be")) || hostEquals(host, asciiBytes("yt.be"))) {
    return pathFirstSegment(url);
  }
  if (hostEquals(host, asciiBytes("youtube.com")) || hostEndsWith(host, asciiBytes(".youtube.com"))) {
    const v = queryParam(url, asciiBytes("v"));
    if (v !== null && v.length > 0) return v;
    // /shorts/ID, /embed/ID, /live/ID
    const shorts = pathAfter(url, asciiBytes("/shorts/"));
    if (shorts !== null) return shorts;
    const embed = pathAfter(url, asciiBytes("/embed/"));
    if (embed !== null) return embed;
    const live = pathAfter(url, asciiBytes("/live/"));
    if (live !== null) return live;
  }
  return null;
}

function youtubeHqdefault(yt: Bytes): Bytes {
  // https://img.youtube.com/vi/<id>/hqdefault.jpg — small enough for Cmd.fetch's 256 KiB cap
  // and the 512×512 registry pixel bound (480×360).
  const prefix = asciiBytes("https://img.youtube.com/vi/");
  const suffix = asciiBytes("/hqdefault.jpg");
  const out = new Uint8Array(prefix.length + yt.length + suffix.length);
  out.set(prefix, 0);
  out.set(yt, prefix.length);
  out.set(suffix, prefix.length + yt.length);
  return out;
}

function startsWithBytes(hay: Bytes, prefix: Bytes): boolean {
  if (hay.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (hay[i] !== prefix[i]) return false;
  }
  return true;
}

/** owner/repo for github.com/owner/repo (and www.), else null. */
export function githubRepoSlug(url: Bytes): Bytes | null {
  const host = hostnameOf(url);
  if (!(hostEquals(host, asciiBytes("github.com")) || hostEndsWith(host, asciiBytes(".github.com")))) {
    return null;
  }
  const owner = pathFirstSegment(url);
  if (owner === null || owner.length === 0) return null;
  // Skip non-repo roots.
  if (
    bytesEq(owner, asciiBytes("settings")) ||
    bytesEq(owner, asciiBytes("topics")) ||
    bytesEq(owner, asciiBytes("explore")) ||
    bytesEq(owner, asciiBytes("marketplace")) ||
    bytesEq(owner, asciiBytes("orgs")) ||
    bytesEq(owner, asciiBytes("users")) ||
    bytesEq(owner, asciiBytes("login")) ||
    bytesEq(owner, asciiBytes("signup"))
  ) {
    return null;
  }
  const repo = pathSecondSegment(url);
  if (repo === null || repo.length === 0) return null;
  const out = new Uint8Array(owner.length + 1 + repo.length);
  out.set(owner, 0);
  out[owner.length] = 0x2f;
  out.set(repo, owner.length + 1);
  return out;
}

function pathSecondSegment(url: Bytes): Bytes | null {
  let start = 0;
  if (url.startsWith(asciiBytes("https://"))) start = 8;
  else if (url.startsWith(asciiBytes("http://"))) start = 7;
  else return null;
  while (start < url.length && url[start] !== 0x2f) start += 1;
  if (start >= url.length) return null;
  start += 1; // past host /
  // skip first segment
  while (start < url.length && url[start] !== 0x2f && url[start] !== 0x3f && url[start] !== 0x23) {
    start += 1;
  }
  if (start >= url.length || url[start] !== 0x2f) return null;
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

function githubOgImageUrl(slug: Bytes): Bytes {
  // opengraph.githubassets.com/<any>/<owner>/<repo> serves the social card.
  // Full-size RGBA exceeds the 1 MiB registry bound, so fetch via wsrv resize.
  // Nested URL is unreserved ASCII (no query), so it can sit unencoded in ?url=.
  const prefix = asciiBytes("https://wsrv.nl/?url=https://opengraph.githubassets.com/1/");
  const suffix = asciiBytes("&w=480&output=jpg");
  const out = new Uint8Array(prefix.length + slug.length + suffix.length);
  out.set(prefix, 0);
  out.set(slug, prefix.length);
  out.set(suffix, prefix.length + slug.length);
  return out;
}

/**
 * Keep remote art inside the Native image registry (≤512×512 / 1 MiB RGBA).
 * YouTube CDN thumbs are already small; GitHub opengraph cards are resized via wsrv.
 */
export function fitThumbUrl(imageUrl: Bytes): Bytes {
  if (imageUrl.length === 0) return EMPTY;
  if (startsWithBytes(imageUrl, asciiBytes("https://img.youtube.com/"))) return imageUrl;
  if (startsWithBytes(imageUrl, asciiBytes("http://img.youtube.com/"))) return imageUrl;
  if (startsWithBytes(imageUrl, asciiBytes("https://wsrv.nl/"))) return imageUrl;
  if (startsWithBytes(imageUrl, asciiBytes("https://opengraph.githubassets.com/"))) {
    const prefix = asciiBytes("https://wsrv.nl/?url=");
    const suffix = asciiBytes("&w=480&output=jpg");
    const out = new Uint8Array(prefix.length + imageUrl.length + suffix.length);
    out.set(prefix, 0);
    out.set(imageUrl, prefix.length);
    out.set(suffix, prefix.length + imageUrl.length);
    return out;
  }
  return imageUrl;
}

/**
 * HTTP URL to fetch for title/description metadata.
 * YouTube watch HTML is multi‑MB; oEmbed fits the 256 KiB Cmd.fetch cap.
 */
export function metaFetchUrl(sourceUrl: Bytes): Bytes {
  const yt = youtubeVideoId(sourceUrl);
  if (yt !== null) {
    const prefix = asciiBytes("https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=");
    const out = new Uint8Array(prefix.length + yt.length);
    out.set(prefix, 0);
    out.set(yt, prefix.length);
    return out;
  }
  return sourceUrl;
}

/**
 * Resolve the thumbnail URL to fetch for a link.
 * YouTube → hqdefault; GitHub repos → resized opengraph card; else stored OG art
 * (resized to fit the registry).
 */
export function resolveThumbnailUrl(sourceUrl: Bytes, stored: Bytes): Bytes {
  const yt = youtubeVideoId(sourceUrl);
  if (yt !== null) return youtubeHqdefault(yt);
  const slug = githubRepoSlug(sourceUrl);
  if (slug !== null) return githubOgImageUrl(slug);
  if (stored.length > 0) return fitThumbUrl(stored);
  return EMPTY;
}
export function domainLabel(url: Bytes): Bytes {
  return hostnameOf(url);
}

/** Prefer OG title; for GitHub repos without meta, show `GitHub - owner/repo`. */
export function linkDisplayTitle(sourceUrl: Bytes, storedTitle: Bytes): Bytes {
  if (storedTitle.length > 0) return storedTitle;
  const slug = githubRepoSlug(sourceUrl);
  if (slug !== null) {
    const prefix = asciiBytes("GitHub - ");
    const out = new Uint8Array(prefix.length + slug.length);
    out.set(prefix, 0);
    out.set(slug, prefix.length);
    return out;
  }
  return sourceUrl;
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
