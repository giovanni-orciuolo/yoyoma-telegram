const request = require('request')

const extractVideoURL = async (url) => {
  return new Promise((resolve, reject) => {
    if (!url.match(/^(https:|)[/][/]www.([^/]+[.])*facebook.com/)) {
      return reject("URL is not from Facebook!")
    }

    request(`https://www.fbvideodownloader.org/data.php?v=${url}`, (err, res, json) => {
      if (err || res.statusCode !== 200) {
        return reject(err)
      }

      const body = JSON.parse(json)
      if (body?.status !== "1") {
        return reject("Invalid status response from fbvideodownloader, body is: " + json)
      }

      return resolve(body.download_url)
    })
  })
}

const sendFacebookVideo = async (ctx) => {
  const url = ctx.state.command.args
  try {
    const videoURL = await extractVideoURL(url)
    return ctx.replyWithVideo(videoURL, {
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
