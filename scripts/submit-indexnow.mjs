import { readFile, readdir } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const siteOrigin = 'https://www.mono-pix.com'
const publicDir = resolve(import.meta.dirname, '../public')
const sitemapPath = resolve(publicDir, 'sitemap.xml')
const keyFiles = (await readdir(publicDir)).filter((file) => /^[a-f0-9]{32}\.txt$/.test(file))

if (keyFiles.length !== 1) {
  throw new Error(`Expected exactly one 32-character IndexNow key file, found ${keyFiles.length}.`)
}

const keyFile = keyFiles[0]
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const suppliedUrls = args.filter((value) => value !== '--dry-run')
const sitemap = suppliedUrls.length ? '' : await readFile(sitemapPath, 'utf8')
const candidates = suppliedUrls.length
  ? suppliedUrls
  : [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const urlList = [...new Set(candidates)].filter((value) => {
  try {
    return new URL(value).origin === siteOrigin
  } catch {
    return false
  }
})

if (!urlList.length) throw new Error('No valid MonoPix URLs to submit.')

if (dryRun) {
  console.log(`IndexNow dry run: ${urlList.length} MonoPix URLs are valid.`)
} else {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'www.mono-pix.com',
      key: basename(keyFile, '.txt'),
      keyLocation: `${siteOrigin}/${keyFile}`,
      urlList,
    }),
  })

  if (!response.ok) {
    throw new Error(`IndexNow submission failed: ${response.status} ${await response.text()}`)
  }

  console.log(`IndexNow accepted ${urlList.length} MonoPix URLs (${response.status}).`)
}
