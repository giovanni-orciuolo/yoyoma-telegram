require('now-env')
require('dotenv').config()

const path = require('path')
const { Composer, session } = require('micro-bot')
const commandParts = require('telegraf-command-parts')
const telegrafI18N = require('telegraf-i18n')

const geniusSearch = require('./geniusSearch')
const speechToText = require('./speechToText')

const bot = new Composer()
const i18n = new telegrafI18N({
  defaultLanguage: 'en',
  allowMissing: true,
  directory: 'i18n'
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
bot.hears('crunchyroll', async ({ reply, getChat }) => {
  if ((await getChat()).id === process.env.CR_GROUP_ID) {
    reply(`Email: ${process.env.CR_EMAIL} | Password: ${process.env.CR_PASS}`)
  }
})
bot.command('lyrics', async (ctx) => {
  geniusSearch(ctx)
})
bot.command('language', (ctx) => {
  const locale = ctx.state.command.args
  if (locale === 'it' || locale === 'en') {
    ctx.i18n.locale(ctx.state.command.args)
    ctx.reply(ctx.i18n.t('locale_set'))
  } else {
    ctx.reply(ctx.i18n.t('no_locale'))
  }
})
/*bot.on('audio', async (ctx) => {
  speechToText(msg)
})*/

module.exports = bot
