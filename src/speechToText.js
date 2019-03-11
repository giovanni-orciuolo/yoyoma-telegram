const witSpeech = require('node-witai-speech')
const fs = require('fs')
const https = require('https')
const WITAI_TOKEN = process.env.WITAI_TOKEN

const extractSpeech = (stream, contentType) => {
  return new Promise((resolve, reject) => {
    witSpeech.extractSpeechIntent(WITAI_TOKEN, stream, contentType, {}, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}

const speechToText = async (ctx) => {
  if (!ctx.message.voice) return
  try {
    console.log('Trying to parse that...')
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing')

    const voice = await ctx.telegram.getFile(ctx.message.voice.file_id)
    console.log(voice)

    const voicePath = `audio/${voice.file_id}.mp3`
    const voiceFile = fs.createWriteStream(voicePath)
    await new Promise(resolve =>
      https.get(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${voice.file_path}`, res => {
        res.pipe(voiceFile)
        resolve(res)
      })
    )
    const voiceStream = fs.createReadStream(voicePath)

    console.log(voiceStream)
    const parsedSpeech = await extractSpeech(voiceStream, 'audio/mp3')
    console.log(parsedSpeech)
  } catch (err) {
    console.error('Error while parsing speech to text!', err)
    ctx.reply(ctx.i18n.t('s2t__fail'))
  }
}
module.exports = {
  speechToText
}
