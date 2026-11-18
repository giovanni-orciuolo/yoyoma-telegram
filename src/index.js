require('dotenv').config()

const Telegraf = require('telegraf')
const TelegrafI18n = require('telegraf-i18n')
const commandParts = require('telegraf-command-parts')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const fs = require('fs')

const { geniusSearch, sceneLyrics } = require('./features/geniusSearch')
const { speechToText } = require('./features/speechToText')
const { searchScp } = require('./features/scpSearcher')
const { sendRandomComic } = require('./features/cyanideComicGenerator')
const { manageGroupRSS, sceneListenRss } = require('./features/rss/rssManager')
const { coinFlip } = require('./features/coinFlip')
const { manageGroupConfig, setChatConfig, getChatConfig } = require('./features/configManager')
const { sceneSticker, enterStickerIdScene } = require('./features/stickerId')
const { sceneTesseract, enterTesseractScene } = require('./features/imageToText')
const { sendRandomCAH } = require('./features/cahGenerator')
const { sendCockRate } = require('./features/rateCock')
const { sendMinecraftServerStatus } = require("./features/minecraftServerStatus")
const { sendTikTokVideo, sendFacebookVideo } = require('./features/videoLink')
const { createRateLimit } = require('./features/rateLimit')
const { createSay } = require('./features/say')
const { sendDadoText } = require('./features/dadotext')

const isAdmin = require('./utils/isAdmin')

const bot = new Telegraf(process.env.BOT_TOKEN)
const i18n = new TelegrafI18n({
  defaultLanguage: 'en',
  directory: 'i18n',
  allowMissing: true,
  useSession: true
})
const stage = new Stage([sceneListenRss, sceneSticker, sceneTesseract, sceneLyrics], { ttl: 10 })

const say = createSay({ ownerId: Number(process.env.OWNER_ID) || undefined })

bot.use(session())
bot.use(say.rememberGroups)
bot.use(i18n.middleware())
bot.use(stage.middleware())
bot.use(commandParts())
bot.use(createRateLimit({
  window: 1000,
  limit: 10,
  onLimitExceeded: ctx => ctx.reply(ctx.i18n.t('rl__exceeded'))
}))

bot.start((ctx) => ctx.reply(ctx.i18n.t('welcome')))
bot.catch((err) => console.error('Ops! Questo è imbarazzante:', err))

function replyWithSticker (ctx, stickerId) {
  if (getChatConfig(ctx).react_to_text_enabled) {
    ctx.replyWithSticker(stickerId)
  }
}
function replyWithVoice (ctx, voicePath) {
  if (getChatConfig(ctx).react_to_text_enabled) {
    ctx.replyWithVoice({ source: fs.createReadStream(voicePath) })
  }
}

// Meme hears lol
bot.hears('yo angelo', ctx => replyWithSticker(ctx, 'CAADBAADXQADgYLEFulxnwk8dDafAg'))
// bot.hears('nyo-ho ho', ctx => replyWithSticker(ctx, 'CAADBAADZQADgYLEFtlofF9toBD-Ag'))
// bot.hears('drugs', ctx => replyWithSticker(ctx, 'CAADBAADLwADgYLEFimHsG12ODxiAg'))
// bot.hears('heaven', ctx => replyWithSticker(ctx, 'CAADBAADXgADgYLEFnB82EiqvePzAg'))
// bot.hears('ruru', ctx => replyWithSticker(ctx, 'CAADBAADggADgYLEFmcYqG7UNZ4KAg'))
bot.hears('kuyashi', ctx => replyWithSticker(ctx, 'CAADBAADmwADgYLEFpNmMrKg7JTJFgQ'))
// bot.hears('za warudo', ctx => replyWithVoice(ctx, './assets/zawarudo.ogg'))
// bot.hears('the world', ctx => replyWithVoice(ctx, './assets/zawarudo.ogg'))
// bot.hears('merda', ctx => replyWithVoice(ctx, './assets/merda.ogg'))
bot.hears('mini pekka', ctx => replyWithVoice(ctx, './assets/minipekka.ogg'))

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
bot.command('fbvideo', sendFacebookVideo)
bot.command('tiktok', sendTikTokVideo)
bot.command('dadotext', sendDadoText)
bot.command('say', say.command)

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
