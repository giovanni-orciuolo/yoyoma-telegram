const Scene = require('telegraf/scenes/base')
const genius = require('./geniusApi')
const { whileShowing } = require('./chatAction')

// Long enough to type a line of lyrics; the stage default of 10 seconds is not
const LYRICS_SCENE_TTL = 120

const geniusSearch = async (ctx) => {
  const text = ctx.state.command.args.trim()
  if (!text) return ctx.scene.enter('lyrics')
  return whileShowing(ctx, 'upload_photo', () => searchLyrics(ctx, text))
}

const sceneLyrics = new Scene('lyrics', { ttl: LYRICS_SCENE_TTL })
// force_reply makes the answer a reply to the bot, which the bot receives even in groups with privacy mode on
sceneLyrics.enter((ctx) => ctx.reply(ctx.i18n.t('genius__ask_lyrics'), {
  reply_to_message_id: ctx.message.message_id,
  reply_markup: { force_reply: true, selective: true }
}))
sceneLyrics.on('text', async (ctx, next) => {
  await ctx.scene.leave()
  if (ctx.message.text.startsWith('/')) return next()
  return whileShowing(ctx, 'upload_photo', () => searchLyrics(ctx, ctx.message.text))
})

const searchLyrics = async (ctx, text) => {
  const res = await genius.searchGenius(text)

  const hits = res.hits
  if (hits.length === 0) {
    return ctx.reply(ctx.i18n.t('genius__no_song'))
  }

  const song = hits[0].result
  await ctx.replyWithPhoto(song.song_art_image_thumbnail_url, {
    caption: htmlizeSong(song) + '\n',
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  })

  if (hits.length === 1) return
  let otherSongs = ctx.i18n.t('genius__other_songs_found', { amount: hits.length - 1 })
  hits.slice(1).forEach(hit => {
    otherSongs += `> ${htmlizeSong(hit.result)}\n`
  })
  return ctx.reply(otherSongs, {
    parse_mode: 'HTML',
    disable_notification: true,
    disable_web_page_preview: true
  })
}

const htmlizeSong = (song) => `<a href="${song.url || ''}">${song.full_title}</a>`

module.exports = {
  geniusSearch,
  sceneLyrics
}
