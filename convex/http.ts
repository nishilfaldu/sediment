import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { auth } from './auth'
import { welcomeEmailHtml, welcomeEmailText } from './lib/welcomeEmail'

const http = httpRouter()

auth.addHttpRoutes(http)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_ORIGINS = new Set([
  'https://nishilfaldu.site',
  'https://www.nishilfaldu.site',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173'
])

function corsHeaders(origin: string | null): HeadersInit {
  const allow =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://nishilfaldu.site'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  }
}

function json(origin: string | null, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json'
    }
  })
}

type GithubAsset = {
  name: string
  browser_download_url: string
}

type GithubRelease = {
  tag_name: string
  html_url: string
  assets: GithubAsset[]
}

async function resolveMacDownloads(): Promise<{
  arm64: string | null
  x64: string | null
  page: string
}> {
  const page = 'https://github.com/nishilfaldu/sediment/releases/latest'
  try {
    const res = await fetch(
      'https://api.github.com/repos/nishilfaldu/sediment/releases/latest',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'sediment-download-gate'
        }
      }
    )
    if (!res.ok) {
      return { arm64: null, x64: null, page }
    }
    const release = (await res.json()) as GithubRelease
    const dmgs = release.assets.filter((a) => a.name.endsWith('.dmg'))
    const arm64 =
      dmgs.find((a) => a.name.includes('arm64'))?.browser_download_url ?? null
    const x64 = dmgs.find((a) => a.name.includes('x64'))?.browser_download_url ?? null
    return {
      arm64,
      x64,
      page: release.html_url || page
    }
  } catch {
    return { arm64: null, x64: null, page }
  }
}

http.route({
  path: '/download',
  method: 'OPTIONS',
  handler: httpAction(async (_ctx, req) => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get('Origin'))
    })
  })
})

http.route({
  path: '/download',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const origin = req.headers.get('Origin')

    let email = ''
    try {
      const body = (await req.json()) as { email?: unknown }
      email = typeof body.email === 'string' ? body.email.trim() : ''
    } catch {
      return json(origin, { error: 'invalid request' }, 400)
    }

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return json(origin, { error: 'enter a valid email' }, 400)
    }

    await ctx.runMutation(internal.download.recordSignup, { email })

    const apiKey = process.env.AUTH_RESEND_KEY
    if (!apiKey) {
      return json(origin, { error: 'email not configured' }, 500)
    }

    // Welcome email must not block the DMG; run email + GitHub lookup together.
    const [, downloads] = await Promise.all([
      sendWelcomeEmail(apiKey, email),
      resolveMacDownloads()
    ])

    return json(origin, {
      ok: true,
      downloads
    })
  })
})

async function sendWelcomeEmail(apiKey: string, email: string): Promise<void> {
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Separate identity from OTP (`auth@`) so mailbox filters can treat
        // sign-in mail as transactional and this note as a personal/intro mail.
        from: 'Nishil <hello@nishilfaldu.site>',
        to: [email],
        subject: 'Thanks for downloading Sediment',
        text: welcomeEmailText(),
        html: welcomeEmailHtml(),
        reply_to: 'Nishil Faldu <hello@nishilfaldu.site>'
      })
    })
    if (!resendRes.ok) {
      console.error('welcome email failed', await resendRes.text())
    }
  } catch (err) {
    console.error('welcome email failed', err)
  }
}

export default http
