require('now-env')
require('dotenv').config();

const { Composer, session } = require('micro-bot')

const bot = new Composer()

// bot.use(log())
bot.use(session())

bot.start(({ reply }) => reply("Welcome, I'm YoYo-Ma! I can execute your commands! Wow!"))

// Meme hears lol
bot.hears('yo angelo', ({ replyWithSticker }) => replyWithSticker('CAADBAADXQADgYLEFulxnwk8dDafAg'))
bot.hears('nyo-ho ho', ({ replyWithSticker }) => replyWithSticker('CAADBAADZQADgYLEFtlofF9toBD-Ag'))
bot.hears('drugs', ({ replyWithSticker }) => replyWithSticker('CAADBAADLwADgYLEFimHsG12ODxiAg'))
bot.hears('crunchyroll', ({ reply }) => reply(`Email: ${process.env.CR_EMAIL} | Password: ${process.env.CR_PASS}`))

bot.command('date', ({ reply }) => reply(`The time is: ${Date()}`))

module.exports = bot
