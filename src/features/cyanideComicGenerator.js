const fetch = require('node-fetch')

const RANDOM_PANELS_URL = 'https://explosm.net/api/get-random-panels'
const PERMALINK_URL = 'https://explosm.net/rcg'
const PANEL_CDN_URL = 'https://rcg-cdn.explosm.net/panels'

const sendRandomComic = async (ctx) => {
  const replyOptions = {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  }
  try {
    const comic = comicFromPanels(await fetchRandomPanels())
    const album = comic.panelUrls.map((url, i) => ({
      type: 'photo',
      media: url,
      caption: i === 0 ? comic.permalink : undefined
    }))
    return await ctx.replyWithMediaGroup(album, replyOptions)
  } catch (err) {
    console.error('[RCG] Failed to generate a random comic', err)
    return ctx.reply(ctx.i18n.t('rcg__error'), replyOptions)
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

module.exports = {
  sendRandomComic,
  comicFromPanels
}
