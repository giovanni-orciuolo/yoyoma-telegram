require('dotenv').config()

const telegraf = require('telegraf')
const telegrafI18N = require('telegraf-i18n')
const commandParts = require('telegraf-command-parts')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const rateLimit = require('telegraf-ratelimit')
const fs = require('fs')

const { geniusSearch } = require('./features/geniusSearch')
const { speechToText } = require('./features/speechToText')
const { searchScp } = require('./features/scpSearcher')
const { sendRandomComic } = require('./features/cyanideComicGenerator')
const { manageGroupRSS, sceneListenRss } = require('./features/rss/rssManager')
const { coinFlip } = require('./features/coinFlip')
// const { sendYoutubeAudio } = require('./features/youtubeAudio')
const { manageGroupConfig, setChatConfig, getChatConfig } = require('./features/configManager')
const { sceneSticker, enterStickerIdScene } = require('./features/stickerId')
const { sceneTesseract, enterTesseractScene } = require('./features/imageToText')
const { sendRandomCAH } = require('./features/cahGenerator')
const { sendCockRate } = require('./features/rateCock')
const { sendMinecraftServerStatus } = require("./features/minecraftServerStatus")
const { sendFacebookVideo } = require('./features/facebookVideo')
const { sendTikTokVideo } = require('./features/tiktok')
const { sendDadoText } = require('./features/dadotext')

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
bot.use(rateLimit({
  window: 1000,
  limit: 10,
  onLimitExceeded: ctx => ctx.reply(ctx.i18n.t('rl__exceeded'))
}))

bot.start((ctx) => ctx.reply(ctx.i18n.t('welcome')))
bot.catch((err) => console.error('Ops! Questo è imbarazzante:', err))

function replyWithSticker(ctx, stickerId) {
  if (getChatConfig().react_to_text_enabled) {
    ctx.replyWithSticker(stickerId)
  }
}
function replyWithVoice(ctx, voicePath) {
  if (getChatConfig().react_to_text_enabled) {
    ctx.replyWithVoice({ source: fs.createReadStream(voicePath) })
  }
}

// Meme hears lol
bot.hears(/yo angelo/gi, ctx => replyWithSticker(ctx, 'CAADBAADXQADgYLEFulxnwk8dDafAg'))
bot.hears(/nyo-ho ho/gi, ctx => replyWithSticker(ctx, 'CAADBAADZQADgYLEFtlofF9toBD-Ag'))
bot.hears(/drugs/gi, ctx => replyWithSticker(ctx, 'CAADBAADLwADgYLEFimHsG12ODxiAg'))
bot.hears(/heaven/gi, ctx => replyWithSticker(ctx, 'CAADBAADXgADgYLEFnB82EiqvePzAg'))
bot.hears(/ruru/gi, ctx => replyWithSticker(ctx, 'CAADBAADggADgYLEFmcYqG7UNZ4KAg'))
bot.hears(/kuyashi/gi, ctx => replyWithSticker(ctx, 'CAADBAADmwADgYLEFpNmMrKg7JTJFgQ'))
bot.hears(/za warudo/gi, ctx => replyWithVoice(ctx, './assets/zawarudo.ogg'))
bot.hears(/the world/gi, ctx => replyWithVoice(ctx, './assets/zawarudo.ogg'))
bot.hears('merda', ctx => replyWithVoice(ctx, './assets/merda.ogg'))

// Real commands
bot.command('config', manageGroupConfig)
bot.command('lyrics', geniusSearch)
bot.command('scp', searchScp)
bot.command('rcg', sendRandomComic)
bot.command('coin', coinFlip)
bot.command('stickerid', enterStickerIdScene)
bot.command('tesseract', enterTesseractScene)
bot.command('cah', sendRandomCAH)
bot.command('ratecock', sendCockRate)
bot.command('mcstatus', sendMinecraftServerStatus)
bot.command('rss', manageGroupRSS) // STILL IN DEVELOPMENT
bot.command('fbvideo', sendFacebookVideo) // STILL IN DEVELOPMENT
// bot.command('ytaudio', sendYoutubeAudio) DISABLED because it causes too much CPU usage on my little VPS
// bot.command('pokefusion', sendRandomPokeFusion) NOT WORKING - Needs Puppeteer on Docker
bot.command('tiktok', sendTikTokVideo)
bot.command('dadotext', sendDadoText)

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
