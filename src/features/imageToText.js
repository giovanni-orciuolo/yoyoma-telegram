const { createWorker } = require('tesseract.js')
const Scene = require('telegraf/scenes/base')
const { whileShowing } = require('./chatAction')

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

  try {
    const text = await whileShowing(ctx, 'typing', () => ocr.read(fileLink))
    await ctx.reply(text.trim() || ctx.i18n.t('tesseract__no_text'), replyOptions)
  } catch (err) {
    console.error('[OCR] Failed to read text from image', err)
    await ctx.reply(ctx.i18n.t('tesseract__error'), replyOptions)
  }
}

// Starting the engine takes about a second, so one engine stays running and serves every photo
const createOcr = (startEngine) => {
  let engine

  const read = async (image) => {
    engine = engine || startEngine('eng')
    const current = engine
    try {
      const { data } = await (await current).recognize(image)
      return data.text
    } catch (err) {
      if (engine === current) engine = undefined
      current.then(worker => worker.terminate()).catch(() => {})
      throw err
    }
  }

  return { read }
}

const ocr = createOcr(createWorker)

const enterTesseractScene = (ctx) => ctx.scene.enter('tesseract')

module.exports = {
  sceneTesseract,
  enterTesseractScene,
  createOcr
}
