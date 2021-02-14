const fetch = require('node-fetch')
const { replyWithOptionalImage } = require('../utils/replyWithOptionalImage')

const sendMinecraftServerStatus = async ctx => {
  const serverAddress = ctx.state.command.args
  const res = await fetch(`https://api.mcsrvstat.us/2/${serverAddress}`)
  const srv = await res.json()

  replyWithOptionalImage(ctx, /*srv.icon ? Buffer.from(srv.icon.replace("data:image/png;base64,", ""), "base64") : */'',
    `Server status: <b>${srv.online ? "ONLINE" : "OFFLINE"}</b>${
      srv.online ?
        `\nMOTD: ${srv.motd.html}\n\nOnline: ${srv.players.list.toString().replace(/,/g, ', ')} (${srv.players.online}/${srv.players.max})\n\n<i>Minecraft ${srv.version}</i>`
        : ''
    }`, {
      reply_to_message_id: ctx.message.message_id,
    })
}
module.exports = {
  sendMinecraftServerStatus
}
