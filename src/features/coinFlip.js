const coinFlip = (ctx) => {
  const isHeads = Math.random() >= 0.5
  return ctx.reply(ctx.i18n.t(
    isHeads ? 'ct__heads' : 'ct__tails'
  ), {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  })
}
module.exports = {
  coinFlip
}
