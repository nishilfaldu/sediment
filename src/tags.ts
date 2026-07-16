import { asciiBytes } from "@native-sdk/core";
import { EMPTY, bytesEqual, concat2, concat3, type Bytes } from "./bytes.ts";
import {
  hostEndsWith,
  hostEquals,
  hostnameOf,
  pathAfter,
  pathFirstSegment,
  pathSecondSegment,
  queryParam,
} from "./detect.ts";

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

/** Video hosts get a play affordance — derived from the URL, not the display tag. */
export function isVideoHost(url: Bytes): boolean {
  const host = hostnameOf(url);
  if (
    hostEquals(host, asciiBytes("youtu.be")) ||
    hostEquals(host, asciiBytes("youtube.com")) ||
    hostEndsWith(host, asciiBytes(".youtube.com"))
  ) {
    return true;
  }
  if (hostEquals(host, asciiBytes("vimeo.com"))) return true;
  if (hostEquals(host, asciiBytes("tiktok.com")) || hostEndsWith(host, asciiBytes(".tiktok.com"))) {
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
  return concat3(
    asciiBytes("https://img.youtube.com/vi/"),
    yt,
    asciiBytes("/hqdefault.jpg"),
  );
}

/** owner/repo for github.com/owner/repo (and www.), else null. */
export function githubRepoSlug(url: Bytes): Bytes | null {
  const host = hostnameOf(url);
  if (!(hostEquals(host, asciiBytes("github.com")) || hostEndsWith(host, asciiBytes(".github.com")))) {
    return null;
  }
  const owner = pathFirstSegment(url);
  if (owner === null || owner.length === 0) return null;
  if (
    bytesEqual(owner, asciiBytes("settings")) ||
    bytesEqual(owner, asciiBytes("topics")) ||
    bytesEqual(owner, asciiBytes("explore")) ||
    bytesEqual(owner, asciiBytes("marketplace")) ||
    bytesEqual(owner, asciiBytes("orgs")) ||
    bytesEqual(owner, asciiBytes("users")) ||
    bytesEqual(owner, asciiBytes("login")) ||
    bytesEqual(owner, asciiBytes("signup"))
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

/** Resize remote art through wsrv so RGBA fits the Native image registry. */
function wsrvResize(imageUrl: Bytes): Bytes {
  return concat3(
    asciiBytes("https://wsrv.nl/?url="),
    imageUrl,
    asciiBytes("&w=480&output=jpg"),
  );
}

function githubOgImageUrl(slug: Bytes): Bytes {
  // opengraph.githubassets.com/<any>/<owner>/<repo> serves the social card.
  // Full-size RGBA exceeds the 1 MiB registry bound, so fetch via wsrv resize.
  return wsrvResize(concat2(asciiBytes("https://opengraph.githubassets.com/1/"), slug));
}

/**
 * Keep remote art inside the Native image registry (≤512×512 / 1 MiB RGBA).
 * YouTube CDN thumbs are already small; GitHub opengraph cards are resized via wsrv.
 */
export function fitThumbUrl(imageUrl: Bytes): Bytes {
  if (imageUrl.length === 0) return EMPTY;
  if (imageUrl.startsWith(asciiBytes("https://img.youtube.com/"))) return imageUrl;
  if (imageUrl.startsWith(asciiBytes("http://img.youtube.com/"))) return imageUrl;
  if (imageUrl.startsWith(asciiBytes("https://wsrv.nl/"))) return imageUrl;
  if (imageUrl.startsWith(asciiBytes("https://opengraph.githubassets.com/"))) {
    return wsrvResize(imageUrl);
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
  if (bytesEqual(dayId, todayId)) return asciiBytes("Today");
  // MM-DD from YYYY-MM-DD — no fractional math (NS1016).
  return dayId.subarray(5, 10);
}

/** "Today" / raw day id for the board heading. */
export function formatDayHeading(dayId: Bytes, todayId: Bytes): Bytes {
  if (dayId.length < 10 || todayId.length < 10) return dayId;
  if (bytesEqual(dayId, todayId)) return asciiBytes("Today");
  return dayId;
}
