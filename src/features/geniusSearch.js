const fetch = require('node-fetch')

const GENIUS_SEARCH_URL = 'https://api.genius.com/search'

const searchGenius = async (text) => {
  const res = await fetch(`${GENIUS_SEARCH_URL}?q=${encodeURIComponent(text)}`, {
    headers: { Authorization: `Bearer ${process.env.GENIUS_TOKEN}` }
  })
  if (!res.ok) throw new Error(`Genius search failed with status ${res.status}`)
  return (await res.json()).response
}

const geniusSearch = async (ctx) => {
  const text = ctx.state.command.args
  if (text === '') {
    ctx.reply(ctx.i18n.t('genius__empty_lyrics'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
    return
  }

  const res = await searchGenius(text)

  const hits = res.hits
  if (hits.length === 0) {
    ctx.reply(ctx.i18n.t('genius__no_song'))
    return
  }

  const htmlizeSong = (song) => {
    return `<a href="${song.url || ''}">${song.full_title}</a>`
  }

  const song = hits[0].result
  await ctx.replyWithPhoto(song.song_art_image_thumbnail_url, {
    caption: htmlizeSong(song) + '\n',
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  })

  let other_songs = ctx.i18n.t('genius__other_songs_found', { amount: hits.length - 1 })
  hits.slice(1).forEach(song => {
    other_songs += `> ${htmlizeSong(song.result)}\n`
  })
  if (hits.length > 1) {
    ctx.reply(other_songs, {
      parse_mode: 'HTML',
      disable_notification: true,
      disable_web_page_preview: true
    }) 
  }
}
module.exports = {
  geniusSearch
}
