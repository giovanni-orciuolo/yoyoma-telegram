const witSpeech = require('node-witai-speech')
const fs = require('fs')
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
  ctx.telegram.sendChatAction(ctx.chat.id, 'typing')

  const voicePath = (await bot.downloadFile(ctx.message.voice.file_id, __dirname + '/voice')) + '.mp3'
  const voiceStream = fs.createReadStream(voicePath)

  try {
    const parsedSpeech = await extractSpeech(voiceStream, 'audio/mp3')
  } catch (err) {
    console.error('Error while parsing speech to text!', err)
    ctx.reply('')
  }
}
module.exports = {
  speechToText, extractSpeech
}
