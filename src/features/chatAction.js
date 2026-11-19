// Telegram hides a chat action after 5 seconds, so it is sent again until the work is done
const REPEAT_MS = 4000

// Shows "YoYo-Ma is sending a photo..." (or another action) in the chat while work runs
const whileShowing = async (ctx, action, work) => {
  const show = () => ctx.replyWithChatAction(action).catch(() => {})
  show()
  const timer = setInterval(show, REPEAT_MS)
  try {
    return await work()
  } finally {
    clearInterval(timer)
  }
}

module.exports = {
  whileShowing
}
