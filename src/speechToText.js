const witSpeech = require('node-witai-speech')
const fs = require('fs')
const https = require('https')
const WITAI_TOKEN = process.env.WITAI_TOKEN

const TG_FILE_URL = "https://api.telegram.org/file"

const downloadTelegramAudio = (audio, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(`${TG_FILE_URL}/bot${process.env.BOT_TOKEN}/${audio.file_path}`, res => {
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', err => {
      fs.unlink(dest)
      reject(err.message)
    })
  })
}

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
  console.log('Trying to parse that...')
  await ctx.telegram.sendChatAction(ctx.chat.id, 'typing')

  const voiceFile = await ctx.telegram.getFile(ctx.message.voice.file_id)
  const voicePath = `audio/${voiceFile.file_id}.mp3`

  try {
    await downloadTelegramAudio(voiceFile, voicePath)
  } catch (err) {
    console.error('Error while parsing speech to text!', err)
    ctx.reply(ctx.i18n.t('s2t__download_fail'), {
      reply_to_message_id: ctx.message.message_id
    })
  }

  try {
    const voiceStream = fs.createReadStream(voicePath)
    const parsedSpeech = await extractSpeech(voiceStream, ctx.message.voice.mime_type)
    console.log(parsedSpeech)
  } catch (err) {
    console.error('Error while parsing speech to text!', err)
    ctx.reply(ctx.i18n.t('s2t__transcribe_fail'), {
      reply_to_message_id: ctx.message.message_id
    })
  }
}
module.exports = {
  speechToText
}
