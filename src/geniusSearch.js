const geniusApi = require('genius-api')
const genius = new geniusApi(process.env.GENIUS_TOKEN)

const geniusSearch = async (ctx) => {
  const text = ctx.state.command.args
  if (text === '') {
    ctx.reply("Lyrics text is empty man")
    return
  }

  const res = await genius.search(text);

  const hits = res.hits
  if (hits.length === 0) {
    ctx.reply("No song found with these lyrics...")
    return
  }

  const song = hits[0].result
  await ctx.replyWithPhoto(song.song_art_image_thumbnail_url, {
    caption: `[${song.full_title}](${song.url || ''})`,
    parse_mode: 'Markdown',
    disable_notification: true
  })

  let other_songs = `${hits.length - 1} other potential songs found:\n`;
  hits.slice(1).forEach(song => {
    other_songs += `> [${song.result.full_title}](${song.result.url})\n`
  });
  if (hits.length > 1)
    ctx.reply(other_songs, {
      parse_mode: 'Markdown',
      disable_notification: true,
      disable_web_page_preview: true
    })
}
module.exports = geniusSearch
