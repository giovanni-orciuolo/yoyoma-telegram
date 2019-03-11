require('now-env')
require('dotenv').config();

const { Composer, session } = require('micro-bot')
const commandParts = require('telegraf-command-parts')
const geniusSearch = require('./geniusSearch')

const bot = new Composer()

// bot.use(log())
bot.use(session())
bot.use(commandParts())

bot.start(({ reply }) => reply("Welcome, I'm YoYo-Ma! I can execute your commands! Wow!"))

// Meme hears lol
bot.hears(/yo angelo/i, ({ replyWithSticker }) => replyWithSticker('CAADBAADXQADgYLEFulxnwk8dDafAg'))
bot.hears(/nyo-ho ho/i, ({ replyWithSticker }) => replyWithSticker('CAADBAADZQADgYLEFtlofF9toBD-Ag'))
bot.hears(/drugs/i, ({ replyWithSticker }) => replyWithSticker('CAADBAADLwADgYLEFimHsG12ODxiAg'))
bot.hears(/heaven/i, ({ replyWithSticker }) => replyWithSticker('CAADBAADXgADgYLEFnB82EiqvePzAg'))

// Real commands
bot.hears('crunchyroll', async ({ reply, getChat }) => {
  if ((await getChat()).id === process.env.CR_GROUP_ID)
    reply(`Email: ${process.env.CR_EMAIL} | Password: ${process.env.CR_PASS}`)
})
bot.command('lyrics', async (ctx) => {
  geniusSearch(ctx)
})

module.exports = bot
