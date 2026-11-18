// Lets the bot owner post a message in a group from a private chat with the bot.
// Groups are learned from the messages the bot sees, so the list refills after a restart.
const createSay = ({ ownerId }) => {
  const groups = new Map()

  const rememberGroups = (ctx, next) => {
    const chat = ctx.chat
    if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
      groups.set(chat.id, chat.title)
    }
    return next()
  }

  const command = async (ctx) => {
    // Anyone else gets no reply, so the command stays invisible to them
    if (!ownerId || ctx.from.id !== ownerId || ctx.chat.type !== 'private') return

    const request = parseRequest(ctx.message.text.replace(/^\/say(@\S+)?\s*/, ''), groups)
    if (!request) {
      return ctx.reply(ctx.i18n.t('say__usage', { groups: describeGroups(groups) }))
    }

    try {
      await ctx.telegram.sendMessage(request.chatId, request.text)
      return ctx.reply(ctx.i18n.t('say__sent', { group: request.name }))
    } catch (err) {
      console.error('[SAY] Failed to send message', err)
      return ctx.reply(ctx.i18n.t('say__failed', { group: request.name, reason: err.description || err.message }))
    }
  }

  return { rememberGroups, command }
}

// The target is a chat id or the longest known group title the arguments start with
const parseRequest = (args, groups) => {
  const byId = args.match(/^(-\d+)\s+([\s\S]+)$/)
  if (byId) {
    const chatId = Number(byId[1])
    return { chatId, name: groups.get(chatId) || byId[1], text: byId[2] }
  }

  const lowered = args.toLowerCase()
  const matches = [...groups]
    .filter(([, title]) => lowered.startsWith(title.toLowerCase()) && /^\s/.test(args.slice(title.length)))
    .sort(([, a], [, b]) => b.length - a.length)
  if (matches.length === 0) return null

  const [chatId, title] = matches[0]
  const text = args.slice(title.length).trim()
  if (!text) return null
  return { chatId, name: title, text }
}

const describeGroups = (groups) => {
  if (groups.size === 0) return '-'
  return [...groups].map(([id, title]) => `${title} (${id})`).join('\n')
}

module.exports = {
  createSay
}
