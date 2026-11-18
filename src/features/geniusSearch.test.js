const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const commandParts = require('telegraf-command-parts')
const genius = require('./geniusApi')
const { geniusSearch, sceneLyrics } = require('./geniusSearch')

const USER = { id: 7, first_name: 'Tester' }
const CHAT = { id: -100, type: 'group', title: 'Group' }

let apiCalls, searches, originalCallApi, originalSearch, updateId

beforeEach(() => {
  apiCalls = []
  searches = []
  updateId = 0
  originalCallApi = Telegram.prototype.callApi
  originalSearch = genius.searchGenius
  Telegram.prototype.callApi = async (method, payload) => {
    apiCalls.push({ method, payload })
    return { message_id: 1000 + apiCalls.length, chat: CHAT }
  }
  genius.searchGenius = async (text) => {
    searches.push(text)
    return { hits: [{ result: { full_title: 'Never Gonna Give You Up', url: 'https://genius.com/x', song_art_image_thumbnail_url: 'https://img' } }] }
  }
})

afterEach(() => {
  Telegram.prototype.callApi = originalCallApi
  genius.searchGenius = originalSearch
})

const createBot = () => {
  const bot = new Telegraf('TOKEN')
  bot.use(session())
  bot.use((ctx, next) => { ctx.i18n = { t: key => key }; return next() })
  bot.use(new Stage([sceneLyrics]).middleware())
  bot.use(commandParts())
  bot.command('lyrics', geniusSearch)
  bot.command('coin', ctx => ctx.reply('coin'))
  return bot
}

const send = (bot, text) => {
  updateId++
  const entities = text.startsWith('/') ? [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }] : undefined
  return bot.handleUpdate({
    update_id: updateId,
    message: { message_id: updateId, from: USER, chat: CHAT, date: 0, text, entities }
  })
}

const sentTexts = () => apiCalls.filter(call => call.method === 'sendMessage').map(call => call.payload.text)

test('/lyrics with lyrics searches right away', async () => {
  const bot = createBot()

  await send(bot, '/lyrics never gonna give you up')

  assert.deepEqual(searches, ['never gonna give you up'])
})

test('/lyrics alone asks for the lyrics, with a reply the bot can see in groups', async () => {
  const bot = createBot()

  await send(bot, '/lyrics')

  const ask = apiCalls.find(call => call.payload.text === 'genius__ask_lyrics')
  assert.ok(ask, 'the bot asks for the lyrics')
  assert.equal(ask.payload.reply_markup.force_reply, true)
  assert.deepEqual(searches, [])
})

test('the next message after the question is searched as lyrics', async () => {
  const bot = createBot()

  await send(bot, '/lyrics')
  await send(bot, 'never gonna let you down')

  assert.deepEqual(searches, ['never gonna let you down'])
  assert.ok(apiCalls.some(call => call.method === 'sendPhoto'))
})

test('only one message is taken as lyrics, later chat is ignored', async () => {
  const bot = createBot()

  await send(bot, '/lyrics')
  await send(bot, 'never gonna let you down')
  await send(bot, 'lol')

  assert.deepEqual(searches, ['never gonna let you down'])
})

test('a different command instead of lyrics cancels the question and runs that command', async () => {
  const bot = createBot()

  await send(bot, '/lyrics')
  await send(bot, '/coin')

  assert.deepEqual(searches, [])
  assert.ok(sentTexts().includes('coin'))
})
