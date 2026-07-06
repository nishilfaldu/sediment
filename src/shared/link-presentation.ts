import { PLATFORM_LABELS } from './labels'
import type { Platform } from './types'

export type LinkKind = 'video' | 'social' | 'link'

export interface LinkPresentation {
  kind: LinkKind
  platform?: Platform
  tagLabel: string
}

interface PlatformRule {
  platform: Platform
  kind: LinkKind
  match: (url: URL) => boolean
}

function parseHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url
  } catch {
    return null
  }
}

function hostname(url: URL): string {
  return url.hostname.replace(/^(www|m|mobile|touch|geo)\./, '')
}

function hostIs(url: URL, ...hosts: string[]): boolean {
  return hosts.includes(hostname(url))
}

function hostIncludes(url: URL, fragment: string): boolean {
  return hostname(url).includes(fragment)
}

function youtubeIdFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'embed') {
    return parts[1] ?? null
  }
  return null
}

// ── Short / redirect domains (tag platform without resolving) ────────────────

function isYouTubeShort(url: URL): boolean {
  return hostIs(url, 'youtu.be', 'yt.be') && url.pathname.length > 1
}

function isTikTokShort(url: URL): boolean {
  if (hostIs(url, 'vm.tiktok.com', 'vt.tiktok.com') && url.pathname.length > 1) return true
  return hostIs(url, 'tiktok.com') && url.pathname.startsWith('/t/')
}

function isTwitterShort(url: URL): boolean {
  return hostIs(url, 't.co') && url.pathname.length > 1
}

function isRedditShort(url: URL): boolean {
  return hostIs(url, 'redd.it') && url.pathname.length > 1
}

function isInstagramShort(url: URL): boolean {
  return hostIs(url, 'instagr.am', 'ig.me') && url.pathname.length > 1
}

function isPinterestShort(url: URL): boolean {
  return hostIs(url, 'pin.it') && url.pathname.length > 1
}

function isFacebookShort(url: URL): boolean {
  return hostIs(url, 'fb.watch') && url.pathname.length > 1
}

function isDailymotionShort(url: URL): boolean {
  return hostIs(url, 'dai.ly') && url.pathname.length > 1
}

function isDiscordShort(url: URL): boolean {
  return hostIs(url, 'discord.gg', 'dis.gd') && url.pathname.length > 1
}

function isTelegramShort(url: URL): boolean {
  return hostIs(url, 't.me', 'telegram.me', 'telegram.dog') && url.pathname.length > 1
}

function isSoundCloudShort(url: URL): boolean {
  return hostIs(url, 'snd.sc') && url.pathname.length > 1
}

function isLinkedInShort(url: URL): boolean {
  return hostIs(url, 'lnkd.in') && url.pathname.length > 1
}

function isSpotifyShort(url: URL): boolean {
  return hostIs(url, 'spotify.link') && url.pathname.length > 1
}

// ── Video ───────────────────────────────────────────────────────────────────

function isYouTube(url: URL): boolean {
  const host = hostname(url)
  if (host === 'youtu.be' || host === 'yt.be') return url.pathname.length > 1
  if (host === 'youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch' && url.searchParams.get('v')) return true
    return youtubeIdFromPath(url.pathname) !== null
  }
  return false
}

function isVimeo(url: URL): boolean {
  return hostIs(url, 'vimeo.com') && /^\/\d+/.test(url.pathname)
}

function isTikTok(url: URL): boolean {
  if (hostIs(url, 'vm.tiktok.com', 'vt.tiktok.com') && url.pathname.length > 1) return true
  if (!hostIs(url, 'tiktok.com')) return false
  return /\/video\//.test(url.pathname) || url.pathname.startsWith('/t/')
}

function isTwitch(url: URL): boolean {
  if (hostIs(url, 'clips.twitch.tv') && url.pathname.length > 1) return true
  if (!hostIs(url, 'twitch.tv')) return false
  return url.pathname.startsWith('/videos/') || url.pathname.includes('/clip/')
}

function isDailymotion(url: URL): boolean {
  if (hostIs(url, 'dai.ly') && url.pathname.length > 1) return true
  if (!hostIncludes(url, 'dailymotion.')) return false
  return /\/video\//.test(url.pathname) || url.pathname.startsWith('/embed/video/')
}

function isRumble(url: URL): boolean {
  if (!hostIs(url, 'rumble.com')) return false
  return /^\/v[\w.-]+/.test(url.pathname)
}

function isKick(url: URL): boolean {
  if (!hostIs(url, 'kick.com')) return false
  return (
    url.pathname.startsWith('/video/') ||
    /\/clips\//.test(url.pathname) ||
    /\/videos\//.test(url.pathname)
  )
}

function isFacebookVideo(url: URL): boolean {
  if (hostIs(url, 'fb.watch') && url.pathname.length > 1) return true
  if (!hostIs(url, 'facebook.com')) return false
  return (
    url.pathname.startsWith('/watch') ||
    url.pathname.startsWith('/reel/') ||
    /\/videos\//.test(url.pathname) ||
    url.pathname === '/watch/live'
  )
}

function isMixcloud(url: URL): boolean {
  return hostIs(url, 'mixcloud.com') && url.pathname.split('/').filter(Boolean).length >= 2
}

// ── Social ──────────────────────────────────────────────────────────────────

function isTwitter(url: URL): boolean {
  if (hostIs(url, 't.co') && url.pathname.length > 1) return true
  if (!hostIs(url, 'twitter.com', 'x.com', 'mobile.twitter.com')) return false
  return /\/status\/\d+/.test(url.pathname)
}

function isInstagram(url: URL): boolean {
  if (hostIs(url, 'instagr.am', 'ig.me') && url.pathname.length > 1) return true
  if (!hostIs(url, 'instagram.com')) return false
  return /^\/(p|reel|reels|tv)\//.test(url.pathname)
}

function isBluesky(url: URL): boolean {
  return hostIs(url, 'bsky.app') && /\/post\//.test(url.pathname)
}

function isThreads(url: URL): boolean {
  return hostIs(url, 'threads.net') && /\/post\//.test(url.pathname)
}

function isReddit(url: URL): boolean {
  if (hostIs(url, 'redd.it') && url.pathname.length > 1) return true
  if (!hostIs(url, 'reddit.com', 'old.reddit.com')) return false
  return /\/comments\//.test(url.pathname) || /\/r\/[^/]+\/s\//.test(url.pathname)
}

function isLinkedIn(url: URL): boolean {
  if (hostIs(url, 'lnkd.in') && url.pathname.length > 1) return true
  if (!hostIs(url, 'linkedin.com')) return false
  return (
    /\/posts\//.test(url.pathname) ||
    url.pathname.startsWith('/feed/update/') ||
    url.pathname.startsWith('/pulse/')
  )
}

function isPinterest(url: URL): boolean {
  if (hostIs(url, 'pin.it') && url.pathname.length > 1) return true
  if (!hostIncludes(url, 'pinterest.')) return false
  return url.pathname.startsWith('/pin/')
}

function isTumblr(url: URL): boolean {
  const host = hostname(url)
  if (host.endsWith('.tumblr.com') && url.pathname.length > 1) return true
  return hostIs(url, 'tumblr.com') && /\/post\//.test(url.pathname)
}

function isTelegram(url: URL): boolean {
  return (
    hostIs(url, 't.me', 'telegram.me', 'telegram.dog') &&
    url.pathname.length > 1 &&
    !url.pathname.startsWith('/s/')
  )
}

function isDiscord(url: URL): boolean {
  if (hostIs(url, 'discord.gg', 'dis.gd') && url.pathname.length > 1) return true
  if (!hostIs(url, 'discord.com', 'discordapp.com')) return false
  return (
    url.pathname.startsWith('/invite/') ||
    url.pathname.startsWith('/channels/') ||
    url.pathname.startsWith('/events/')
  )
}

function isMastodon(url: URL): boolean {
  // Fediverse permalink: /@handle/1234567890
  if (hostIs(url, 'bsky.app', 'threads.net')) return false
  return /^\/@[^/]+\/\d+\/?$/.test(url.pathname)
}

function isLemmy(url: URL): boolean {
  if (/\/c\/[^/]+\/post\/\d+/.test(url.pathname)) return true
  return hostIncludes(url, 'lemmy.') && /^\/post\/\d+/.test(url.pathname)
}

function isPatreon(url: URL): boolean {
  if (!hostIs(url, 'patreon.com')) return false
  return url.pathname.startsWith('/posts/') || /\/posts\//.test(url.pathname)
}

function isFacebookPost(url: URL): boolean {
  if (hostIs(url, 'fb.me') && url.pathname.length > 1) return true
  if (!hostIs(url, 'facebook.com')) return false
  if (isFacebookVideo(url)) return false
  return (
    url.pathname.includes('/posts/') ||
    url.pathname.startsWith('/story.php') ||
    url.pathname.startsWith('/photo.php') ||
    url.pathname.startsWith('/permalink.php') ||
    url.pathname.startsWith('/photo/') ||
    url.pathname.startsWith('/photos/')
  )
}

function isSnapchat(url: URL): boolean {
  if (!hostIs(url, 'snapchat.com')) return false
  return url.pathname.startsWith('/add/') || url.pathname.startsWith('/p/')
}

// ── Link-tagged ───────────────────────────────────────────────────────────────

function isGitHub(url: URL): boolean {
  return hostIs(url, 'github.com') && url.pathname.length > 1
}

function isGitLab(url: URL): boolean {
  return hostIs(url, 'gitlab.com') && url.pathname.length > 1
}

function isHackerNews(url: URL): boolean {
  return hostIs(url, 'news.ycombinator.com') && url.pathname === '/item'
}

function isSubstack(url: URL): boolean {
  return hostIncludes(url, 'substack.com') && url.pathname.startsWith('/p/')
}

function isMedium(url: URL): boolean {
  const host = hostname(url)
  return host === 'medium.com' || host.endsWith('.medium.com')
}

function isSpotify(url: URL): boolean {
  if (hostIs(url, 'spotify.link') && url.pathname.length > 1) return true
  return hostIs(url, 'open.spotify.com') && url.pathname.length > 1
}

function isArxiv(url: URL): boolean {
  return hostIs(url, 'arxiv.org') && url.pathname.length > 1
}

function isSoundCloud(url: URL): boolean {
  if (hostIs(url, 'snd.sc') && url.pathname.length > 1) return true
  return hostIs(url, 'soundcloud.com') && url.pathname.split('/').filter(Boolean).length >= 2
}

function isStackOverflow(url: URL): boolean {
  if (!hostIncludes(url, 'stackexchange.com') && !hostIncludes(url, 'stackoverflow.com')) {
    return false
  }
  return url.pathname.includes('/questions/') || url.pathname.includes('/a/')
}

function isDevTo(url: URL): boolean {
  return hostIs(url, 'dev.to') && url.pathname.split('/').filter(Boolean).length >= 2
}

function isNotion(url: URL): boolean {
  return hostIs(url, 'notion.so', 'notion.site') && url.pathname.length > 1
}

function isFigma(url: URL): boolean {
  if (!hostIs(url, 'figma.com')) return false
  return /^\/(file|proto|design|board|slides)\//.test(url.pathname)
}

function isWikipedia(url: URL): boolean {
  if (!hostIncludes(url, 'wikipedia.org')) return false
  return url.pathname.startsWith('/wiki/') && !url.pathname.startsWith('/wiki/Special:')
}

function isNpm(url: URL): boolean {
  return hostIs(url, 'npmjs.com', 'www.npmjs.com') && url.pathname.startsWith('/package/')
}

function isPyPI(url: URL): boolean {
  return hostIs(url, 'pypi.org') && url.pathname.startsWith('/project/')
}

function isBandcamp(url: URL): boolean {
  const host = hostname(url)
  if (host.endsWith('.bandcamp.com') && url.pathname.length > 1) return true
  return hostIs(url, 'bandcamp.com') && /\/(track|album)\//.test(url.pathname)
}

function isProductHunt(url: URL): boolean {
  return hostIs(url, 'producthunt.com') && url.pathname.startsWith('/posts/')
}

function isItch(url: URL): boolean {
  return hostIs(url, 'itch.io') && url.pathname.split('/').filter(Boolean).length >= 2
}

// First match wins — short domains and specific paths before broad host checks.
const PLATFORM_RULES: PlatformRule[] = [
  // Short / redirect
  { platform: 'youtube', kind: 'video', match: isYouTubeShort },
  { platform: 'tiktok', kind: 'video', match: isTikTokShort },
  { platform: 'twitter', kind: 'social', match: isTwitterShort },
  { platform: 'reddit', kind: 'social', match: isRedditShort },
  { platform: 'instagram', kind: 'social', match: isInstagramShort },
  { platform: 'pinterest', kind: 'social', match: isPinterestShort },
  { platform: 'facebook', kind: 'video', match: isFacebookShort },
  { platform: 'dailymotion', kind: 'video', match: isDailymotionShort },
  { platform: 'discord', kind: 'social', match: isDiscordShort },
  { platform: 'telegram', kind: 'social', match: isTelegramShort },
  { platform: 'soundcloud', kind: 'link', match: isSoundCloudShort },
  { platform: 'linkedin', kind: 'social', match: isLinkedInShort },
  { platform: 'spotify', kind: 'link', match: isSpotifyShort },
  // Video
  { platform: 'youtube', kind: 'video', match: isYouTube },
  { platform: 'vimeo', kind: 'video', match: isVimeo },
  { platform: 'tiktok', kind: 'video', match: isTikTok },
  { platform: 'twitch', kind: 'video', match: isTwitch },
  { platform: 'dailymotion', kind: 'video', match: isDailymotion },
  { platform: 'rumble', kind: 'video', match: isRumble },
  { platform: 'kick', kind: 'video', match: isKick },
  { platform: 'facebook', kind: 'video', match: isFacebookVideo },
  { platform: 'mixcloud', kind: 'link', match: isMixcloud },
  // Social
  { platform: 'twitter', kind: 'social', match: isTwitter },
  { platform: 'instagram', kind: 'social', match: isInstagram },
  { platform: 'bluesky', kind: 'social', match: isBluesky },
  { platform: 'threads', kind: 'social', match: isThreads },
  { platform: 'reddit', kind: 'social', match: isReddit },
  { platform: 'linkedin', kind: 'social', match: isLinkedIn },
  { platform: 'pinterest', kind: 'social', match: isPinterest },
  { platform: 'tumblr', kind: 'social', match: isTumblr },
  { platform: 'telegram', kind: 'social', match: isTelegram },
  { platform: 'discord', kind: 'social', match: isDiscord },
  { platform: 'mastodon', kind: 'social', match: isMastodon },
  { platform: 'lemmy', kind: 'social', match: isLemmy },
  { platform: 'patreon', kind: 'social', match: isPatreon },
  { platform: 'facebook', kind: 'social', match: isFacebookPost },
  { platform: 'snapchat', kind: 'social', match: isSnapchat },
  // Link-tagged
  { platform: 'github', kind: 'link', match: isGitHub },
  { platform: 'gitlab', kind: 'link', match: isGitLab },
  { platform: 'hackernews', kind: 'link', match: isHackerNews },
  { platform: 'substack', kind: 'link', match: isSubstack },
  { platform: 'medium', kind: 'link', match: isMedium },
  { platform: 'spotify', kind: 'link', match: isSpotify },
  { platform: 'arxiv', kind: 'link', match: isArxiv },
  { platform: 'soundcloud', kind: 'link', match: isSoundCloud },
  { platform: 'stackoverflow', kind: 'link', match: isStackOverflow },
  { platform: 'devto', kind: 'link', match: isDevTo },
  { platform: 'notion', kind: 'link', match: isNotion },
  { platform: 'figma', kind: 'link', match: isFigma },
  { platform: 'wikipedia', kind: 'link', match: isWikipedia },
  { platform: 'npm', kind: 'link', match: isNpm },
  { platform: 'pypi', kind: 'link', match: isPyPI },
  { platform: 'bandcamp', kind: 'link', match: isBandcamp },
  { platform: 'producthunt', kind: 'link', match: isProductHunt },
  { platform: 'itch', kind: 'link', match: isItch }
]

/** Classify a saved URL for display only — never persisted to the database. */
export function getLinkPresentation(sourceUrl: string): LinkPresentation {
  const url = parseHttpUrl(sourceUrl)
  if (!url) return { kind: 'link', tagLabel: 'link' }

  for (const rule of PLATFORM_RULES) {
    if (rule.match(url)) {
      return {
        kind: rule.kind,
        platform: rule.platform,
        tagLabel: PLATFORM_LABELS[rule.platform]
      }
    }
  }

  return { kind: 'link', tagLabel: 'link' }
}

export function youtubeVideoId(sourceUrl: string): string | null {
  const url = parseHttpUrl(sourceUrl)
  if (!url) return null

  const host = hostname(url)
  if (host === 'youtu.be' || host === 'yt.be') return url.pathname.slice(1).split('?')[0] || null
  if (host === 'youtube.com' || host === 'music.youtube.com') {
    const fromPath = youtubeIdFromPath(url.pathname)
    if (fromPath) return fromPath
    return url.searchParams.get('v')
  }
  return null
}
