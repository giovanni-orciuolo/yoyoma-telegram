const fetch = require('node-fetch')
const ffmpeg = require('fluent-ffmpeg-7')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const { whileShowing } = require('./chatAction')

const RANDOM_PANELS_URL = 'https://explosm.net/api/get-random-panels'
const PERMALINK_URL = 'https://explosm.net/rcg'
const PANEL_CDN_URL = 'https://rcg-cdn.explosm.net/panels'
const PANEL_HEIGHT = 398

// Telegram chooses the layout of an album itself, so the panels are joined into one image to keep them in one row
const sendRandomComic = async (ctx) => {
  const replyOptions = {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  }
  const files = []
  try {
    return await whileShowing(ctx, 'upload_photo', async () => {
      const comic = comicFromPanels(await fetchRandomPanels())
      files.push(...await downloadPanels(comic.panelUrls))
      const comicFile = await joinPanels(files)
      files.push(comicFile)
      return ctx.replyWithPhoto({ source: comicFile }, { caption: comic.permalink, ...replyOptions })
    })
  } catch (err) {
    console.error('[RCG] Failed to generate a random comic', err)
    return ctx.reply(ctx.i18n.t('rcg__error'), replyOptions)
  } finally {
    files.forEach(file => fs.unlink(file, () => {}))
  }
}

const fetchRandomPanels = async () => {
  const res = await fetch(RANDOM_PANELS_URL)
  const body = await res.json()
  if (!res.ok || body.success !== true) {
    throw new Error(`Unexpected response from explosm.net: ${res.status}`)
  }
  return body.panels
}

const comicFromPanels = (panels) => {
  const ordered = [...panels].sort((a, b) => a.column - b.column)
  return {
    permalink: `${PERMALINK_URL}/${ordered.map(panel => panel.slug).join('')}`,
    panelUrls: ordered.map(panel => `${PANEL_CDN_URL}/${panel.filename}`)
  }
}

// Downloads in parallel. If one panel fails, the panels that did arrive are deleted before the error goes on.
const downloadPanels = async (urls) => {
  const results = await Promise.allSettled(urls.map(downloadPanel))
  const failure = results.find(result => result.status === 'rejected')
  if (!failure) return results.map(result => result.value)
  results.filter(result => result.status === 'fulfilled').forEach(result => fs.unlink(result.value, () => {}))
  throw failure.reason
}

// The panel CDN refuses ffmpeg's own HTTP client, so the panels are downloaded first
const downloadPanel = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Panel download failed with status ${res.status}: ${url}`)
  const file = path.join(os.tmpdir(), `rcg_panel_${randomUUID()}.png`)
  fs.writeFileSync(file, await res.buffer())
  return file
}

const joinPanels = (panelFiles) => new Promise((resolve, reject) => {
  const output = path.join(os.tmpdir(), `rcg_${randomUUID()}.png`)
  const scaled = panelFiles.map((_, i) => `[${i}:v]scale=-1:${PANEL_HEIGHT}[p${i}]`)
  const stack = `${panelFiles.map((_, i) => `[p${i}]`).join('')}hstack=inputs=${panelFiles.length}`
  const command = ffmpeg()
  panelFiles.forEach(file => command.input(file))
  command
    .complexFilter([...scaled, stack].join(';'))
    .frames(1)
    .output(output)
    .on('end', () => resolve(output))
    .on('error', reject)
    .run()
})

module.exports = {
  sendRandomComic,
  comicFromPanels,
  joinPanels
}
