const search = require('youtube-search')
const info = require('youtube-info')
const ytAudioStream = require('youtube-audio-stream')
const { generate } = require('shortid')
const fs = require('fs')

const MAX_VIDEO_LENGTH = 3600 // seconds

const youtubeInfo = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject({ status: 400, message: "ID must have a value" })
    }
    info(id)
      .then((videoInfo) => resolve(videoInfo))
      .catch((err) => reject(err))
  })
}

const youtubeSearch = (terms) => {
  return new Promise((resolve, reject) => {
    if (!terms) {
      reject({ status: 404, message: "Empty search..." })
    }
    search(terms, {
      maxResults: 1,
      key: process.env.GOOGLE_API_TOKEN
    }, (err, results) => {
      if (err) reject(err)
      resolve(results)
    })
  })
}

const downloadYoutubeAudio = (searchTerms) => {
  return new Promise((resolve, reject) => {
    youtubeSearch(searchTerms)
      .then(async (results) => {
        const result = results[0]
        if (!result)
          reject({ status: 404, message: "No video found on Youtube!" })

        const videoInfo = await youtubeInfo(result.id)
        if (videoInfo.duration > MAX_VIDEO_LENGTH) {
          reject({ status: 413, message: "Video is too long!" })
        }

        const dest = `./audio/yt_${result.id}_${generate()}.mp3`
        const writeStream = fs.createWriteStream(dest)

        ytAudioStream(result.link).pipe(writeStream)
        writeStream.on('finish', () => {
          writeStream.close()
          resolve({ path: dest, title: result.title, meta: videoInfo })
        })
      })
      .catch(err => reject(err))
  })
}

const sendYoutubeAudio = async (ctx) => {
  try {
    const data = await downloadYoutubeAudio(ctx.state.command.args)
    await ctx.replyWithAudio({ source: data.path }, {
      title: data.title
    })
    fs.unlink(data.path, () => {})
  } catch (err) {
    console.error("Error while sending youtube audio!", err)
    let what = 'ytaudio__error'
    switch (err.status) {
      case 404: what = 'ytaudio__not_found'; break
      case 413: what = 'ytaudio__too_long'; break
    }
    ctx.reply(ctx.i18n.t(what), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  }
}

module.exports = {
  sendYoutubeAudio
}
