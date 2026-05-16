const fs = require('fs')
const https = require('https')
const path = require('path')
const mime = require('mime-types')
const ffmpeg = require('fluent-ffmpeg')
const fetch = require('node-fetch')
const { getAudioDurationInSeconds } = require('get-audio-duration')
const { getChatConfig } = require('./configManager')
const { TELEGRAM_FILE_URL } = require('../utils/constants')

const WITAI_TOKEN = process.env.WITAI_TOKEN
const AUDIO_SIZE_LIMIT = 500 * 1000 * 1000 // in MB
const AUDIO_DURATION_LIMIT = 5 * 60 // in secs
const SEGMENT_TIME = 15 // in secs

const deleteAudioFile = (path) => {
  fs.unlink(path, () => {})
}

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
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

const splitAudioByDuration = async (audioPath, audioFileName, segmentTime = SEGMENT_TIME) => {
  const audioDuration = await getAudioDurationInSeconds(audioPath)
  if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
    throw new Error(`Invalid audio duration (${audioDuration}) for file ${audioPath}`)
  }
  const segmentsCount = Math.max(1, Math.ceil(audioDuration / segmentTime))

  for (let i = 0; i < segmentsCount; i++) {
    const startTime = i * segmentTime
    const currentSegmentDuration = Math.min(segmentTime, audioDuration - startTime)
    const output = `audio/split_${audioFileName}_${String(i).padStart(3, '0')}.mp3`
    await new Promise((resolve, reject) => {
      ffmpeg(audioPath)
        .setStartTime(startTime)
        .duration(currentSegmentDuration)
        .output(output)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
  }
}

const isMissingFfmpegError = (err) => {
  const errorMessage = String(err?.message ?? err ?? '')
  return errorMessage.includes('ffmpeg exited with code 127') ||
    errorMessage.includes('spawn ffmpeg ENOENT') ||
    errorMessage.includes('Cannot find ffmpeg')
}

const extractSpeech = (stream, contentType) => {
  return new Promise((resolve, reject) => {
    fetch("https://api.wit.ai/speech?v=20210701", {
      method: "POST",
      body: stream,
      headers: {
        "Authorization": `Bearer ${WITAI_TOKEN}`,
        "Content-Type": contentType
      }
    }).then(res => res.json())
      .then(resolve)
      .catch(reject)
  })
}

const speechToText = async (ctx) => {
  if (!ctx.message.voice && !ctx.message.audio && !ctx.message.video_note) return

  // Extract variables from the present container
  const {
    file_id,
    mime_type,
  } = ctx.message.voice || ctx.message.audio || ctx.message.video_note

  const STR_IS_TRANSCRIBING = " [...]";

  const cfg = getChatConfig(ctx)
  if (cfg && !cfg.transcriber_enabled) return

  const voiceFile = await ctx.telegram.getFile(file_id)
  if (voiceFile.file_size >= AUDIO_SIZE_LIMIT) {
    ctx.reply(ctx.i18n.t('s2t__too_big'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
    return
  }

  await ctx.telegram.sendChatAction(ctx.chat.id, 'typing')
  const voicePath = `audio/download_${voiceFile.file_id}.${mime.extension(mime_type)}`

  try {
    await downloadTelegramAudio(voiceFile, voicePath)

    // Check if audio file isn't too long
    const voiceDuration = await getAudioDurationInSeconds(voicePath)
    if (voiceDuration >= AUDIO_DURATION_LIMIT) {
      ctx.reply(ctx.i18n.t('s2t__too_big'), {
        reply_to_message_id: ctx.message.message_id,
        disable_notification: true
      })
      deleteAudioFile(voicePath)
      return;
    }
  } catch (err) {
    console.error('[S2T] Failed to download audio file!', err)
    ctx.reply(ctx.i18n.t('s2t__download_fail'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
    deleteAudioFile(voicePath)
    return;
  }

  const convertedPath = `audio/converted_${voiceFile.file_id}.mp3`
  const needsConversion = mime_type !== 'audio/mpeg3'
  let audioPathForTranscription
  let splitContentType

  if (needsConversion) {
    try {
      await convertAudio(voicePath, convertedPath)
      audioPathForTranscription = convertedPath
      splitContentType = 'audio/mpeg3'
    } catch (err) {
      if (isMissingFfmpegError(err)) {
        console.error('[S2T] ffmpeg not available, falling back to direct transcription!', err)
        audioPathForTranscription = voicePath
        splitContentType = mime_type || 'audio/mpeg3'
      } else {
        console.error('[S2T] Error while converting audio to mp3!', err)
        ctx.reply(ctx.i18n.t('s2t__conversion_fail'), {
          reply_to_message_id: ctx.message.message_id,
          disable_notification: true
        })
        deleteAudioFile(voicePath)
        return;
      }
    }
  } else {
    audioPathForTranscription = voicePath
    splitContentType = mime_type || 'audio/mpeg3'
  }

  let splitFiles = []
  try {
    // Split audio into little chunks for transcription
    await splitAudioByDuration(audioPathForTranscription, voiceFile.file_id)
    splitFiles = fs.readdirSync('audio/').filter(file => file.startsWith(`split_${voiceFile.file_id}`))
  } catch (err) {
    if (isMissingFfmpegError(err)) {
      console.error('[S2T] ffmpeg not available, transcribing audio without split!', err)
      splitFiles = [path.basename(audioPathForTranscription)]
    } else {
      console.error('[S2T] Error while splitting audio file!', err)
      ctx.reply(ctx.i18n.t('s2t__split_fail'), {
        reply_to_message_id: ctx.message.message_id,
        disable_notification: true
      })
      deleteAudioFile(voicePath)
      if (needsConversion) {
        deleteAudioFile(convertedPath)
      }
      return
    }
  }
  let firstTime = true, chatId = -1, messageId = -1, messageText = '', extractionAttempts = 0

  for (let i = 0; i < splitFiles.length; ++i) {
    const file = splitFiles[i];
    const voiceStreamConverted = fs.createReadStream(`audio/${file}`)
    let success = false

    let extractedText = ''
    while (!success) {
      try {
        const { text } = await extractSpeech(voiceStreamConverted, splitContentType)
        extractedText = text
        success = true
      } catch (err) {
        console.error('[S2T] Error while parsing speech to text!', err)
        if (extractionAttempts < 3) {
          extractionAttempts++
        } else {
          console.error('[S2T] Max attempts reached, quitting extraction', err)
          deleteAudioFile(voicePath)
          if (needsConversion) {
            deleteAudioFile(convertedPath)
          }
          splitFiles.forEach(file => deleteAudioFile(`audio/${file}`))
          return
        }
      }
    }

    if (firstTime) {
      try {
        extractedText += (splitFiles.length === 1) ? "" : STR_IS_TRANSCRIBING
        const { message_id, chat } = await ctx.reply(extractedText || "Non ho capito", {
          reply_to_message_id: ctx.message.message_id,
          disable_notification: true
        })
        messageId = message_id
        chatId = chat.id
        messageText = extractedText
      } catch (err) {
        console.error("Error while adding text to speech message: ", err)
        continue
      }
    } else {
      messageText = messageText.replace(STR_IS_TRANSCRIBING, "")
      messageText += !!extractedText ? ` ${extractedText}` : ""
      messageText += (i !== splitFiles.length - 1) ? STR_IS_TRANSCRIBING : ""
      try {
        await ctx.telegram.editMessageText(chatId, messageId, null, messageText)
      } catch (err) {
        console.error("Error while adding text to speech message: ", err)
        continue
      }
    }

    firstTime = false
  }

  deleteAudioFile(voicePath)
  if (needsConversion) {
    deleteAudioFile(convertedPath)
  }
  splitFiles.forEach(file => deleteAudioFile(`audio/${file}`))
}
module.exports = {
  speechToText
}
