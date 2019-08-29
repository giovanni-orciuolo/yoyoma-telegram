require('dotenv').config()

const telegraf = require('telegraf')
const telegrafI18N = require('telegraf-i18n')
const commandParts = require('telegraf-command-parts')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const fs = require('fs')

const { geniusSearch } = require('./features/geniusSearch')
const { speechToText } = require('./features/speechToText')
const { searchScp } = require('./features/scpSearcher')
const { sendRandomComic } = require('./features/cyanideComicGenerator')
const { manageGroupRSS, sceneListenRss } = require('./features/rss/rssManager')
const { coinFlip } = require('./features/coinFlip')
const { sendYoutubeAudio } = require('./features/youtubeAudio')
const { manageGroupConfig, setChatConfig } = require('./features/configManager')
const { sceneSticker, enterStickerIdScene } = require('./features/stickerId')
const { sceneTesseract, enterTesseractScene } = require('./features/imageToText')
const { sendRandomCAH } = require('./features/cahGenerator')
const { sendMinecraftServerStatus } = require('./features/minecraftServerStatus')

const isAdmin = require('./utils/isAdmin')

const bot = new telegraf(process.env.BOT_TOKEN)
const i18n = new telegrafI18N({
  defaultLanguage: 'en',
  directory: 'i18n',
  allowMissing: true,
  useSession: true,
})
const stage = new Stage([ sceneListenRss, sceneSticker, sceneTesseract ], { ttl: 10 })

bot.use(session())
bot.use(i18n.middleware())
bot.use(stage.middleware())
bot.use(commandParts())

bot.start((ctx) => ctx.reply(ctx.i18n.t('welcome')))
bot.catch((err) => console.error('Ops! Questo è imbarazzante:', err))

// Meme hears lol
bot.hears(/yo angelo/gi, ctx => ctx.replyWithSticker('CAADBAADXQADgYLEFulxnwk8dDafAg'))
bot.hears(/nyo-ho ho/gi, ctx => ctx.replyWithSticker('CAADBAADZQADgYLEFtlofF9toBD-Ag'))
bot.hears(/drugs/gi, ctx => ctx.replyWithSticker('CAADBAADLwADgYLEFimHsG12ODxiAg'))
bot.hears(/heaven/gi, ctx => ctx.replyWithSticker('CAADBAADXgADgYLEFnB82EiqvePzAg'))
bot.hears(/ruru/gi, ctx => ctx.replyWithSticker('CAADBAADggADgYLEFmcYqG7UNZ4KAg'))
bot.hears(/kuyashi/gi, ctx => ctx.replyWithSticker('CAADBAADmwADgYLEFpNmMrKg7JTJFgQ'))
bot.hears(/za warudo/gi, ctx => ctx.replyWithAudio('https://instaud.io/_/3q1A.mp3'))
bot.hears(/the world/gi, ctx => ctx.replyWithAudio('https://instaud.io/_/3q1A.mp3'))
bot.hears('merda', ctx => ctx.replyWithVoice({ source: fs.createReadStream('./assets/merda.ogg') }))

// Real commands
bot.command('lyrics', geniusSearch)
bot.command('scp', searchScp)
bot.command('rss', manageGroupRSS)
bot.command('coin', coinFlip)
bot.command('ytaudio', sendYoutubeAudio)
bot.command('config', manageGroupConfig)
bot.command('stickerid', enterStickerIdScene)
bot.command('tesseract', enterTesseractScene)
bot.command('cah', sendRandomCAH)
bot.command('mcstatus', sendMinecraftServerStatus)
// bot.command('cyanide', sendRandomComic) NOT WORKING
// bot.command('pokefusion', sendRandomPokeFusion) NOT WORKING - Needs Puppeteer on Docker

// Scene commands
bot.command('back', ctx => ctx.scene.leave())

// Message listener
bot.on('message', speechToText)

// Actions
bot.action('rss_new_feed', ctx => ctx.scene.enter('listenRSS'))

// Config actions
bot.action('config__enable_transcriber', async ctx => {
  try {
    if (!await isAdmin(ctx)) return
    setChatConfig(ctx, { transcriber_enabled: true })
    manageGroupConfig(ctx)
  } catch (err) {
    console.error(err)
  }
})
bot.action('config__disable_transcriber', async ctx => {
  try {
    if (!await isAdmin(ctx)) return
    setChatConfig(ctx, { transcriber_enabled: false })
    manageGroupConfig(ctx)
  } catch (err) {
    console.error(err)
  }
})
bot.action('config__switch_locale', async ctx => {
  try {
    if (!await isAdmin(ctx)) return
    ctx.i18n.locale(ctx.i18n.locale() === 'it' ? 'en' : 'it')
    manageGroupConfig(ctx)
  } catch (err) {
    console.error(err)
  }
})

console.log("Starting YoYo-Ma...")
bot.launch()
