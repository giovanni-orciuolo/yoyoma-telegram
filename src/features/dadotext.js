const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const { generate } = require('shortid')

const deleteFile = (path) => fs.unlink(path, () => {})

const writeTextOnVideo = (videoPath, text) => {
  const outputPath = `video/dadotext_${generate()}.mp4`;
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoFilters({
        filter: "drawtext",
        options: `text='${text}':x=(w - tw)/2 - 85:y=(h - text_h) / 4:fontsize=32:fontcolor=white:font=Arial:line_spacing=10`,
      })
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  });
}

const sendDadoText = async (ctx) => {
  let outputPath;
  try {
    const text = ctx.state.command.args;
    outputPath = await writeTextOnVideo(`assets/dadobax.mp4`, text);
    await ctx.telegram.sendAnimation(ctx.chat.id, { source: outputPath })
    await deleteFile(outputPath)
  } catch (err) {
    console.error('[DT] Failed to generate DadoText!', err)
    ctx.reply(ctx.i18n.t('dt__error'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
    outputPath && await deleteFile(outputPath)
  }
}

module.exports = {
  sendDadoText
}
