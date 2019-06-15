const { fork } = require('child_process')

const sendRandomPokeFusion = async (ctx) => {
  console.log(__dirname)
  const process = fork(__dirname + '/forks/pokefusion.js')
  process.send('POKEFUSION')

  process.on('message', async (message) => {
    await ctx.replyWithPhoto({ source: Buffer.from(message.pokeFusion.pokedexBase64, 'base64') }, {
      caption: ctx.i18n.t('fusion__generated', { fusion_name: message.pokeFusion.fusionName }),
      reply_to_message_id: ctx.message.message_id,
    })
  })

  await ctx.reply(ctx.i18n.t('fusion__generating'), {
    reply_to_message_id: ctx.message.message_id,
  })
}
module.exports = {
  sendRandomPokeFusion
}
