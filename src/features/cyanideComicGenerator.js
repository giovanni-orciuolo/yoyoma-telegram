const request = require('request')
const cheerio = require('cheerio')

const RCG_URL = "http://explosm.net/rcg"

const randomCyanideComic = () => {
  return new Promise((resolve, reject) => {
    request(RCG_URL, (err, res, html) => {
      if (err || res.statusCode !== 200)
        reject()

      const $ = cheerio.load(html)
      const permalink = $('#permalink').attr('value')

      resolve({
        permalink: permalink
      })
    })
  })
}
const sendRandomComic = async (ctx) => {
  try {
    const comic = await randomCyanideComic()
    return ctx.reply(comic.permalink, {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  } catch (err) {
    return ctx.reply(ctx.i18n.t('rcg__error'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  }
}

module.exports = {
  sendRandomComic
}
