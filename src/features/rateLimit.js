// Limits how often one user can make the bot work. Plain chat messages are not counted,
// so forwarding a batch of messages or posting an album is never mistaken for spam.
const createRateLimit = ({ window, limit, onLimitExceeded, now = Date.now }) => {
  let windowStart = now()
  let usage = new Map()

  return (ctx, next) => {
    if (!ctx.from || !makesBotWork(ctx)) return next()

    if (now() - windowStart >= window) {
      windowStart = now()
      usage = new Map()
    }

    const hits = (usage.get(ctx.from.id) || 0) + 1
    usage.set(ctx.from.id, hits)
    if (hits <= limit) return next()
    // Warn once per window, not once per extra update, or the warnings become the spam
    if (hits === limit + 1) return onLimitExceeded(ctx)
  }
}

const makesBotWork = (ctx) => {
  if (ctx.callbackQuery) return true
  const message = ctx.message
  if (!message) return false
  if (message.voice || message.audio || message.video_note) return true
  return typeof message.text === 'string' && message.text.startsWith('/')
}

module.exports = {
  createRateLimit
}
