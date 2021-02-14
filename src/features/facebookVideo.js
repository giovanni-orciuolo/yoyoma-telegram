const request = require('request')

const extractVideoURL = async (url) => {
  return new Promise((resolve, reject) => {
    if (!url.match(/^(https:|)[/][/]www.([^/]+[.])*facebook.com/)) {
      return reject("URL is not from Facebook!")
    }

    request(url, (err, res, html) => {
      if (err || res.statusCode !== 200) {
        return reject(err)
      }

      // Stranamente, qua l'HTML è diverso da quello che mi dava il CURL...
      // Bruh??? Ma che cazz
      const match = html.match(/hd_src:"(https:\/\/scontent[^"]*)/ig)
      if (!match || !match[1]) {
        return reject("Couldn't extract video from URL. Regex not found!")
      }

      return resolve(match[1])
    })
  })
}

const sendFacebookVideo = async (ctx) => {
  const url = ctx.state.command.args
  try {
    const videoURL = await extractVideoURL(url)
    return ctx.replyWithVideo(videoURL, {
      caption: ctx.i18n.t('fbvideo__download_success'),
      reply_to_message_id: ctx.message.message_id
    })
  } catch (err) {
    console.error(err)
    return ctx.reply(ctx.i18n.t('fbvideo__download_failed'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  }
}
module.exports = {
  sendFacebookVideo
}
