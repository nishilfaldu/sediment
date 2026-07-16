const REPO = 'https://github.com/nishilfaldu/sediment'
const ISSUES = 'https://github.com/nishilfaldu/sediment/issues'
const LINKEDIN = 'https://www.linkedin.com/in/nishilfaldu'

const paragraphs = [
  'hey — nishil here.',
  'thanks for downloading sediment.',
  'quick story, if you care:',
  'social apps are full of stuff worth keeping — articles, posts, little sparks. most of them even have a saves folder now. but those keep growing and growing, and when i actually need something later, it’s still a slog to dig it back up. i don’t want to scroll for hours just to get back to that one thing.',
  'so sediment is an inspiration dashboard for the pieces i already know matter. the ones i’ll want later. the ones that would be a pain to hunt down on the platform where i first saw them — even in that app’s own saves.',
  'copy something → it lands on today’s board. and when i need it, i can search across everything i’ve kept — instead of scrolling.',
  'honestly a big part of why i built this is family and friends. when we’re talking and i think of an article i read, i want to pull it up and share it right then. that’s the whole idea.',
  'if sediment ends up useful, starring the repo helps a lot.',
  'got a feature idea or a bug? open an issue — or a pr. i’ll take a look.',
  'and if you’d be into a small community where people share cool resources with each other — hit me up on linkedin. no pressure. i’m just gauging if anyone wants that.',
  'see u.\n— nishil'
]

function link(href: string, label: string): string {
  return `<a href="${href}">${label}</a>`
}

/** Plain-text fallback (clients that ignore HTML still get the URLs). */
export function welcomeEmailText(): string {
  return [
    paragraphs[0],
    '',
    paragraphs[1],
    '',
    paragraphs[2],
    '',
    paragraphs[3],
    '',
    paragraphs[4],
    '',
    paragraphs[5],
    '',
    paragraphs[6],
    '',
    `${paragraphs[7]} ${REPO}`,
    '',
    `${paragraphs[8]} ${ISSUES}`,
    '',
    `${paragraphs[9]} ${LINKEDIN}`,
    '',
    'see u.',
    '— nishil'
  ].join('\n')
}

/** HTML body with aliased links (what most mail clients show). */
export function welcomeEmailHtml(): string {
  const body = [
    paragraphs[0],
    '',
    paragraphs[1],
    '',
    paragraphs[2],
    '',
    paragraphs[3],
    '',
    paragraphs[4],
    '',
    paragraphs[5],
    '',
    paragraphs[6],
    '',
    `if sediment ends up useful, ${link(REPO, 'starring the repo')} helps a lot.`,
    '',
    `got a feature idea or a bug? ${link(ISSUES, 'open an issue')} — or ${link(REPO, 'a pr')}. i’ll take a look.`,
    '',
    `and if you’d be into a small community where people share cool resources with each other — ${link(LINKEDIN, 'hit me up on linkedin')}. no pressure. i’m just gauging if anyone wants that.`,
    '',
    'see u.',
    '— nishil'
  ]
    .map((line) => (line === '' ? '<br>' : escapeThenBreak(line)))
    .join('\n')

  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #111;">
${body}
</body>
</html>`
}

function escapeThenBreak(line: string): string {
  // Lines that already contain our <a> tags must not be fully escaped.
  if (line.includes('<a href=')) {
    return `<p style="margin: 0 0 12px;">${line.replace(/\n/g, '<br>')}</p>`
  }
  return `<p style="margin: 0 0 12px;">${escapeHtml(line).replace(/\n/g, '<br>')}</p>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
