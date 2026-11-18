const fetch = require('node-fetch')

const STATUS_API_URL = 'https://api.mcsrvstat.us/3'

const sendMinecraftServerStatus = async ctx => {
  const replyOptions = { reply_to_message_id: ctx.message.message_id }
  const serverAddress = ctx.state.command.args.trim()
  if (!serverAddress) {
    return ctx.reply(ctx.i18n.t('mc__no_address'), replyOptions)
  }

  try {
    const res = await fetch(`${STATUS_API_URL}/${encodeURIComponent(serverAddress)}`)
    const server = await res.json()
    return ctx.reply(describeServer(server), { parse_mode: 'HTML', ...replyOptions })
  } catch (err) {
    console.error('[MC] Failed to get server status', err)
    return ctx.reply(ctx.i18n.t('mc__error'), replyOptions)
  }
}

const describeServer = server => {
  const status = `Server status: <b>${server.online ? 'ONLINE' : 'OFFLINE'}</b>`
  if (!server.online) return status

  const motd = escapeHtml(server.motd.clean.join('\n'))
  return `${status}\nMOTD: ${motd}\n\nOnline: ${describePlayers(server.players)}\n\n<i>Minecraft ${escapeHtml(server.version)}</i>`
}

// Servers may hide their player list and only report the counts
const describePlayers = ({ online, max, list }) => {
  const count = `${online}/${max}`
  if (!list || list.length === 0) return count

  const names = list.map(player => escapeHtml(player.name)).join(', ')
  return `${names} (${count})`
}

const escapeHtml = text => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

module.exports = {
  sendMinecraftServerStatus,
  describeServer
}
