const { TesseractWorker } = require('tesseract.js')
const Scene = require('telegraf/scenes/base')

const sceneTesseract = new Scene('tesseract')
sceneTesseract.enter((ctx) => ctx.reply(ctx.i18n.t('tesseract__start')))
sceneTesseract.on('message', async (ctx) => {
  await sendTextFromImage(ctx)
  ctx.scene.leave()
})

const sendTextFromImage = async (ctx) => {
  if (!ctx.message.photo) {
    await ctx.reply(ctx.i18n.t('tesseract__not_photo'), {
      reply_to_message_id: ctx.message.message_id
    })
    return
  }

  const file_link = await ctx.telegram.getFileLink(ctx.message.photo.sort((a, b) => b.file_size - a.file_size)[0])
  let progressMessageId = -1, chatId = ctx.chat.id

  const worker = new TesseractWorker()
  worker
    .recognize(file_link)
    .progress(async ({ status, progress }) => {
      if (status === "recognizing text") {
        // Log progress
        if (progressMessageId === -1) {
          const { message_id } = await ctx.reply(ctx.i18n.t('tesseract__progress', { progress: progress * 100 }), {
            reply_to_message_id: ctx.message.message_id
          })
          progressMessageId = message_id
        } else {
          await ctx.telegram.editMessageText(chatId, progressMessageId, null, ctx.i18n.t('tesseract__progress', { progress: progress * 100 }))
        }
      }
    })
    .then(({ text }) => {
      ctx.reply(text, {
        reply_to_message_id: ctx.message.message_id
      });
    })
}

const enterTesseractScene = (ctx) => ctx.scene.enter('tesseract')

module.exports = {
  sceneTesseract,
  enterTesseractScene
}
