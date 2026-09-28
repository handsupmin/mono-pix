import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const origin = 'https://www.mono-pix.com'
const pages = [
  ['index.html', `${origin}/`],
  ['pixel-snapper/index.html', `${origin}/pixel-snapper/`],
  ['ai-pixel-art-fixer/index.html', `${origin}/ai-pixel-art-fixer/`],
  ['image-to-pixel-art/index.html', `${origin}/image-to-pixel-art/`],
  ['local-pixel-art-converter/index.html', `${origin}/local-pixel-art-converter/`],
  ['transparent-png-sprite-export/index.html', `${origin}/transparent-png-sprite-export/`],
]

const [sitemap, robots, llms, notFound, staticWebAppConfig] = await Promise.all([
  readFile('public/sitemap.xml', 'utf8'),
  readFile('public/robots.txt', 'utf8'),
  readFile('public/llms.txt', 'utf8'),
  readFile('public/404.html', 'utf8'),
  readFile('public/staticwebapp.config.json', 'utf8'),
])

for (const [file, canonical] of pages) {
  const html = await readFile(file, 'utf8')
  assert.match(html, /<html\s[^>]*lang="en"/i, `${file}: language`)
  assert.match(html, /<title>[^<]{20,70}<\/title>/i, `${file}: title`)
  assert.match(html, /<meta\s+name="description"[\s\S]*?content="[^"]{80,180}"/i, `${file}: description`)
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`), `${file}: canonical`)
  assert.match(html, /<meta\s+name="robots"\s+content="index, follow"/i, `${file}: robots`)
  assert.match(html, /<noscript>[\s\S]*?<h1>[^<]+<\/h1>/i, `${file}: crawler-readable h1`)
  assert.doesNotMatch(html, /"@type": "FAQPage"/, `${file}: no invisible FAQ schema`)
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => JSON.parse(match[1]), `${file}: valid JSON-LD`)
  }
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${file}: sitemap`)
}

for (const agent of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Yeti']) {
  assert.ok(robots.includes(`User-agent: ${agent}`), `robots.txt: ${agent}`)
}
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
assert.match(notFound, /name="robots" content="noindex,follow"/)
assert.doesNotMatch(notFound, /rel="canonical"/)
assert.equal(JSON.parse(staticWebAppConfig).responseOverrides?.['404']?.rewrite, '/404.html')
assert.ok(llms.includes(`${origin}/`))

console.log(`SEO contract verified for ${pages.length} MonoPix pages.`)
