// replyWithOptionalImage util function

function replyWithOptionalImage(ctx, image, caption, options = {}) {
  const hasImage = image !== undefined && image !== '' && image !== null
  return hasImage ?
    ctx.replyWithPhoto(image, { caption: caption, parse_mode: 'HTML', ...options }) :
    ctx.reply(caption, { parse_mode: 'HTML', ...options })
}
module.exports = {
  replyWithOptionalImage
}
