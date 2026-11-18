const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const { createSay } = require('./say')

const OWNER = { id: 381977217, first_name: 'Owner' }
const STRANGER = { id: 42, first_name: 'Stranger' }
const POLTERBOYS = { id: -1003378060286, type: 'supergroup', title: 'PolterBoys' }
const TWO_WORDS = { id: -1002, type: 'group', title: 'Polter Boys Two' }

let apiCalls, originalCallApi, updateId

beforeEach(() => {
  apiCalls = []
  updateId = 0
  originalCallApi = Telegram.prototype.callApi
  Telegram.prototype.callApi = async (method, payload) => {
    apiCalls.push({ method, payload })
    return { message_id: 1, chat: { id: payload.chat_id } }
  }
})

afterEach(() => {
  Telegram.prototype.callApi = originalCallApi
})

const createBot = () => {
  const say = createSay({ ownerId: OWNER.id })
  const bot = new Telegraf('TOKEN')
  bot.use((ctx, next) => { ctx.i18n = { t: (key, vars) => vars ? `${key} ${JSON.stringify(vars)}` : key }; return next() })
  bot.use(say.rememberGroups)
  bot.command('say', say.command)
  return bot
}

const send = (bot, { from, chat, text }) => {
  updateId++
  const entities = text.startsWith('/') ? [{ type: 'bot_command', offset: 0, length: text.split(/\s/)[0].length }] : undefined
  return bot.handleUpdate({ update_id: updateId, message: { message_id: updateId, from, chat, date: 0, text, entities } })
}

const privateChat = (user) => ({ id: user.id, type: 'private', first_name: user.first_name })
const sentTo = (chatId) => apiCalls.filter(call => call.method === 'sendMessage' && call.payload.chat_id === chatId)

test('the owner sends a message to a group the bot has seen, by its name', async () => {
  const bot = createBot()
  await send(bot, { from: STRANGER, chat: POLTERBOYS, text: 'hi all' })

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say polterboys ciao a tutti' })

  assert.deepEqual(sentTo(POLTERBOYS.id).map(call => call.payload.text), ['ciao a tutti'])
  assert.match(sentTo(OWNER.id)[0].payload.text, /^say__sent/)
})

test('a group name with spaces is recognized', async () => {
  const bot = createBot()
  await send(bot, { from: STRANGER, chat: TWO_WORDS, text: 'hi' })

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say Polter Boys Two hello' })

  assert.deepEqual(sentTo(TWO_WORDS.id).map(call => call.payload.text), ['hello'])
})

test('a chat id works even before the bot has seen the group', async () => {
  const bot = createBot()

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say -1003378060286 hello' })

  assert.deepEqual(sentTo(POLTERBOYS.id).map(call => call.payload.text), ['hello'])
})

test('a message on several lines keeps its line breaks', async () => {
  const bot = createBot()
  await send(bot, { from: STRANGER, chat: POLTERBOYS, text: 'hi' })

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say PolterBoys first line\nsecond line' })

  assert.equal(sentTo(POLTERBOYS.id)[0].payload.text, 'first line\nsecond line')
})

test('anyone else gets no reply and nothing is sent', async () => {
  const bot = createBot()
  await send(bot, { from: STRANGER, chat: POLTERBOYS, text: 'hi' })

  await send(bot, { from: STRANGER, chat: privateChat(STRANGER), text: '/say PolterBoys hacked' })

  assert.deepEqual(apiCalls, [])
})

test('the owner using /say inside a group is ignored, so the command never shows there', async () => {
  const bot = createBot()

  await send(bot, { from: OWNER, chat: POLTERBOYS, text: '/say PolterBoys hello' })

  assert.deepEqual(apiCalls, [])
})

test('an unknown group name gets an answer listing the known groups', async () => {
  const bot = createBot()
  await send(bot, { from: STRANGER, chat: POLTERBOYS, text: 'hi' })

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say Nowhere hello' })

  assert.equal(sentTo(POLTERBOYS.id).length, 0)
  const answer = sentTo(OWNER.id)[0].payload.text
  assert.match(answer, /^say__usage/)
  assert.match(answer, /PolterBoys/)
})

test('a name that only starts with a known group name does not match that group', async () => {
  const bot = createBot()
  await send(bot, { from: STRANGER, chat: POLTERBOYS, text: 'hi' })

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say PolterBoysX hello' })

  assert.equal(sentTo(POLTERBOYS.id).length, 0)
})

test('a group name with no message text is not sent', async () => {
  const bot = createBot()
  await send(bot, { from: STRANGER, chat: POLTERBOYS, text: 'hi' })

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say PolterBoys' })

  assert.equal(sentTo(POLTERBOYS.id).length, 0)
  assert.match(sentTo(OWNER.id)[0].payload.text, /^say__usage/)
})

test('without a configured owner nobody can use /say', async () => {
  const say = createSay({ ownerId: undefined })
  const bot = new Telegraf('TOKEN')
  bot.command('say', say.command)

  await send(bot, { from: OWNER, chat: privateChat(OWNER), text: '/say -1003378060286 hello' })

  assert.deepEqual(apiCalls, [])
})
