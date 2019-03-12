require('now-env')
require('dotenv').config()

const telegrafI18N = require('telegraf-i18n')
const { Composer, session } = require('micro-bot')
const commandParts = require('telegraf-command-parts')

const geniusSearch = require('./features/geniusSearch')
const setLocale = require('./features/setLocale')
const speechToText = require('./features/speechToText')
const { searchScp, randomScp } = require('./features/scpCommands')

const bot = new Composer()
const i18n = new telegrafI18N({
  defaultLanguage: 'en',
  directory: 'i18n',
  allowMissing: true,
  useSession: true,
})

// bot.use(log())
bot.use(session())
bot.use(commandParts())
bot.use(i18n.middleware())

bot.start(({ reply, i18n }) => reply(i18n.t('welcome')))

// Meme hears lol
bot.hears(/yo angelo/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADXQADgYLEFulxnwk8dDafAg'))
bot.hears(/nyo-ho ho/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADZQADgYLEFtlofF9toBD-Ag'))
bot.hears(/drugs/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADLwADgYLEFimHsG12ODxiAg'))
bot.hears(/heaven/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADXgADgYLEFnB82EiqvePzAg'))

// Real commands
bot.command('lyrics', (ctx) => geniusSearch(ctx))
bot.command('language', (ctx) => setLocale(ctx))
bot.command('scp', (ctx) => (ctx.state.command.args === '') ? randomScp(ctx) : searchScp(ctx))
bot.on('message', (ctx) => speechToText(ctx))

bot.hears('crunchyroll', async ({ reply, getChat }) => {
  if ((await getChat()).id === process.env.CR_GROUP_ID) {
    reply(`Email: ${process.env.CR_EMAIL} | Password: ${process.env.CR_PASS}`)
  }
})

module.exports = bot
