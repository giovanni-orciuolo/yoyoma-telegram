const Scene = require('telegraf/scenes/base')

const sceneSticker = new Scene('sticker_id')
sceneSticker.enter((ctx) => ctx.reply(ctx.i18n.t('sid__start')))
sceneSticker.on('message', async (ctx) => {
  await sendStickerId(ctx)
  ctx.scene.leave()
})

const sendStickerId = async (ctx) => {
  if (!ctx.message.sticker) {
    await ctx.reply(ctx.i18n.t('sid__no_sticker'), {
      reply_to_message_id: ctx.message.message_id
    })
    return
  }

  await ctx.reply(ctx.i18n.t('sid__sticker', { sticker_id: ctx.message.sticker.file_id }), {
    reply_to_message_id: ctx.message.message_id
  })
}

const enterStickerIdScene = (ctx) => ctx.scene.enter('sticker_id')

module.exports = {
  sceneSticker,
  enterStickerIdScene
}
