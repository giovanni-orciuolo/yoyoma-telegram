require('dotenv').config()

const telegraf = require('telegraf')
const telegrafI18N = require('telegraf-i18n')
const commandParts = require('telegraf-command-parts')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')

const { geniusSearch } = require('./features/geniusSearch')
const { setLocale } = require('./features/setLocale')
const { speechToText } = require('./features/speechToText')
const { searchScp } = require('./features/scpSearcher')
const { sendRandomComic } = require('./features/cyanideComicGenerator')
const { manageGroupRSS, sceneListenRss } = require('./features/rss/rssManager')
const { coinFlip } = require('./features/coinFlip')
const { sendYoutubeAudio } = require('./features/youtubeAudio')

const bot = new telegraf(process.env.BOT_TOKEN)
const i18n = new telegrafI18N({
  defaultLanguage: 'en',
  directory: 'i18n',
  allowMissing: true,
  useSession: true,
})
const stage = new Stage([ sceneListenRss ], { ttl: 10 })

bot.use(session())
bot.use(commandParts())
bot.use(i18n.middleware())
bot.use(stage.middleware())

bot.start(({ reply, i18n }) => reply(i18n.t('welcome')))
bot.catch((err) => console.error('Ops! Questo è imbarazzante (cit)', err))

// Meme hears lol
bot.hears(/yo angelo/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADXQADgYLEFulxnwk8dDafAg'))
bot.hears(/nyo-ho ho/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADZQADgYLEFtlofF9toBD-Ag'))
bot.hears(/drugs/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADLwADgYLEFimHsG12ODxiAg'))
bot.hears(/heaven/gi, ({ replyWithSticker }) => replyWithSticker('CAADBAADXgADgYLEFnB82EiqvePzAg'))
bot.hears(/za warudo/gi, ({ replyWithAudio }) => replyWithAudio('https://instaud.io/_/3q1A.mp3'))
bot.hears(/the world/gi, ({ replyWithAudio }) => replyWithAudio('https://instaud.io/_/3q1A.mp3'))

// Real commands
bot.command('lyrics', (ctx) => geniusSearch(ctx))
bot.command('language', (ctx) => setLocale(ctx))
bot.command('scp', (ctx) => searchScp(ctx))
bot.command('cyanide', (ctx) => sendRandomComic(ctx))
bot.command('rss', (ctx) => manageGroupRSS(ctx))
bot.command('coin', (ctx) => coinFlip(ctx))
bot.command('ytaudio', (ctx) => sendYoutubeAudio(ctx));

// Scene commands
bot.command('back', (ctx) => ctx.scene.leave())

// Message listener
bot.on('message', (ctx) => {
  speechToText(ctx) // If needed
})

// Actions
bot.action('rss_new_feed', (ctx) => ctx.scene.enter('listenRSS'))

console.log("Starting YoYo-Ma...")
bot.launch()

module.exports = bot
