const ffmpeg = require('fluent-ffmpeg-7')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')

const DADO_VIDEO = path.join(__dirname, '../../assets/dadobax.mp4')

const sendDadoText = async (ctx) => {
  const replyOptions = {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  }
  const text = ctx.state.command.args.trim()
  if (!text) {
    return ctx.reply(ctx.i18n.t('dt__no_text'), replyOptions)
  }

  let outputPath
  try {
    outputPath = await writeTextOnVideo(DADO_VIDEO, text)
    await ctx.replyWithAnimation({ source: outputPath }, replyOptions)
  } catch (err) {
    console.error('[DT] Failed to generate DadoText!', err)
    await ctx.reply(ctx.i18n.t('dt__error'), replyOptions)
  } finally {
    if (outputPath) deleteFile(outputPath)
  }
}

// The text goes through a file so that quotes, colons and % in it need no ffmpeg escaping
const writeTextOnVideo = async (videoPath, text) => {
  const id = randomUUID()
  const textPath = path.join(os.tmpdir(), `dadotext_${id}.txt`)
  const outputPath = path.join(os.tmpdir(), `dadotext_${id}.mp4`)
  fs.writeFileSync(textPath, text)
  try {
    await renderText(videoPath, textPath, outputPath)
    return outputPath
  } finally {
    deleteFile(textPath)
  }
}

const renderText = (videoPath, textPath, outputPath) => new Promise((resolve, reject) => {
  ffmpeg(videoPath)
    .videoFilters({
      filter: 'drawtext',
      options: `textfile='${filterPath(textPath)}':expansion=none:x=(w - tw)/2 - 85:y=(h - text_h) / 4:fontsize=32:fontcolor=white:font=Sans:line_spacing=10`
    })
    .output(outputPath)
    .on('end', resolve)
    .on('error', reject)
    .run()
})

// Inside a filter option, Windows drive colons must be escaped and backslashes become slashes
const filterPath = (filePath) => filePath.replace(/\\/g, '/').replace(/:/g, '\\:')

const deleteFile = (filePath) => fs.unlink(filePath, () => {})

module.exports = {
  sendDadoText,
  writeTextOnVideo
}
