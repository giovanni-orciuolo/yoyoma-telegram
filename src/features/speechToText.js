const witSpeech = require('node-witai-speech')
const fs = require('fs')
const https = require('https')
const mime = require('mime-types')
const ffmpeg = require('fluent-ffmpeg')

const WITAI_TOKEN = process.env.WITAI_TOKEN
const TELEGRAM_FILE_URL = "https://api.telegram.org/file"

const downloadTelegramAudio = (audio, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(`${TELEGRAM_FILE_URL}/bot${process.env.BOT_TOKEN}/${audio.file_path}`, res => {
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

const convertAudio = (input, output) => {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .on('end', () => resolve())
      .on('error', e => reject(e))
      .run()
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

  await ctx.telegram.sendChatAction(ctx.chat.id, 'typing')

  const voiceFile = await ctx.telegram.getFile(ctx.message.voice.file_id)
  const voicePath = `audio/download_${voiceFile.file_id}.${mime.extension(ctx.message.voice.mime_type)}`

  try {
    await downloadTelegramAudio(voiceFile, voicePath)
  } catch (err) {
    console.error('[S2T] Failed to download audio file!', err)
    ctx.reply(ctx.i18n.t('s2t__download_fail'), {
      reply_to_message_id: ctx.message.message_id
    })
  }

  const convertedPath = `audio/converted_${voiceFile.file_id}.mp3`
  try {
    await convertAudio(voicePath, convertedPath)
  } catch (err) {
    console.error('[S2T] Error while converting audio to mp3!', err)
    ctx.reply(ctx.i18n.t('s2t__conversion_fail'), {
      reply_to_message_id: ctx.message.message_id
    })
  }

  try {
    const voiceStreamConverted = fs.createReadStream(convertedPath)
    const parsedSpeech = await extractSpeech(voiceStreamConverted, 'audio/mpeg3')
    ctx.reply(parsedSpeech._text, {
      reply_to_message_id: ctx.message.message_id
    })
  } catch (err) {
    console.error('[S2T] Error while parsing speech to text!', err)
    let what; // What went wrong
    switch (err.substring(err.length - 3, err.length)) {
      case '400': what = 's2t__transcribe_fail'
        break
      case '401': what = 's2t__transcribe_fail_auth'
        break
      case '408': what = 's2t__transcribe_timeout'
        break
      case '500': case '503': what = 's2t__transcribe_error'
        break
      default: what = 's2t__transcribe_error'
    }
    ctx.reply(ctx.i18n.t(what), {
      reply_to_message_id: ctx.message.message_id
    })
  }
}
module.exports = speechToText
