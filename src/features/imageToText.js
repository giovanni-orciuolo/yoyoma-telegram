const { createWorker } = require('tesseract.js')
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

  const replyOptions = { reply_to_message_id: ctx.message.message_id }
  const largestPhoto = [...ctx.message.photo].sort((a, b) => b.file_size - a.file_size)[0]
  const fileLink = await ctx.telegram.getFileLink(largestPhoto)
  await ctx.replyWithChatAction('typing')

  const worker = await createWorker('eng')
  try {
    const { data } = await worker.recognize(fileLink)
    await ctx.reply(data.text.trim() || ctx.i18n.t('tesseract__no_text'), replyOptions)
  } catch (err) {
    console.error('[OCR] Failed to read text from image', err)
    await ctx.reply(ctx.i18n.t('tesseract__error'), replyOptions)
  } finally {
    await worker.terminate()
  }
}

const enterTesseractScene = (ctx) => ctx.scene.enter('tesseract')

module.exports = {
  sceneTesseract,
  enterTesseractScene
}
