const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const TelegrafI18n = require('telegraf-i18n')
const session = require('telegraf/session')
const { createChatConfig } = require('./configManager')

const ADMIN = { id: 1, first_name: 'Admin', language_code: 'en' }
const MEMBER = { id: 2, first_name: 'Member', language_code: 'en' }
const GROUP = { id: -100, type: 'group', title: 'Group' }
const OTHER_GROUP = { id: -200, type: 'group', title: 'Other' }

let apiCalls, originalCallApi, updateId, nextMessageId, failDeletes

beforeEach(() => {
  apiCalls = []
  updateId = 0
  nextMessageId = 500
  failDeletes = false
  originalCallApi = Telegram.prototype.callApi
  Telegram.prototype.callApi = async (method, payload) => {
    apiCalls.push({ method, payload })
    if (method === 'getChatAdministrators') return [{ user: ADMIN }]
    if (method === 'deleteMessage' && failDeletes) {
      throw Object.assign(new Error('400'), { description: 'Bad Request: message to delete not found' })
    }
    return { message_id: ++nextMessageId, chat: { id: payload.chat_id } }
  }
})

afterEach(() => {
  Telegram.prototype.callApi = originalCallApi
})

const createBot = () => {
  const config = createChatConfig()
  const bot = new Telegraf('TOKEN')
  bot.use(session())
  bot.use(new TelegrafI18n({ defaultLanguage: 'en', directory: path.join(__dirname, '../../i18n'), useSession: true }).middleware())
  bot.use(config.applyChatLocale)
  bot.command('config', config.manageGroupConfig)
  bot.action(/^config__/, config.handleConfigButton)
  bot.command('hello', ctx => ctx.reply(ctx.i18n.t('welcome')))
  return { bot, config }
}

const send = (bot, { from, chat, text }) => {
  updateId++
  const entities = text.startsWith('/') ? [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }] : undefined
  return bot.handleUpdate({ update_id: updateId, message: { message_id: updateId, from, chat, date: 0, text, entities } })
}

const press = (bot, { from, chat, data, menuId = 501 }) => {
  updateId++
  return bot.handleUpdate({
    update_id: updateId,
    callback_query: { id: String(updateId), from, data, chat_instance: '1', message: { message_id: menuId, chat, date: 0, text: 'menu' } }
  })
}

const privateChat = (user) => ({ id: user.id, type: 'private', first_name: user.first_name })
const calls = (method) => apiCalls.filter(call => call.method === method)
const buttonsOf = (call) => call.payload.reply_markup.inline_keyboard.flat()
const lastMenuButtons = () => {
  const menu = [...calls('sendMessage'), ...calls('editMessageReplyMarkup')].filter(call => call.payload.reply_markup).pop()
  return buttonsOf(menu)
}
const buttonFor = (text) => lastMenuButtons().find(button => button.text.startsWith(text))

test('/config in a private chat shows every setting with its current state', async () => {
  const { bot } = createBot()

  await send(bot, { from: ADMIN, chat: privateChat(ADMIN), text: '/config' })

  assert.deepEqual(lastMenuButtons().map(button => button.text), ['Transcriber ✅', 'Reaction to text ✅', 'Language: EN'])
})

test('turning off the transcriber in a private chat updates the menu in place', async () => {
  const { bot, config } = createBot()
  const chat = privateChat(ADMIN)
  await send(bot, { from: ADMIN, chat, text: '/config' })

  await press(bot, { from: ADMIN, chat, data: buttonFor('Transcriber').callback_data })

  assert.equal(config.getChatConfig({ chat }).transcriber_enabled, false)
  assert.equal(buttonFor('Transcriber').text, 'Transcriber ❌')
  assert.equal(calls('answerCallbackQuery').length, 1)
})

test('changing one setting keeps the others', async () => {
  const { bot, config } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  await press(bot, { from: ADMIN, chat: GROUP, data: buttonFor('Transcriber').callback_data })

  assert.equal(config.getChatConfig({ chat: GROUP }).react_to_text_enabled, true)
})

test('the reaction to text button turns sticker replies off', async () => {
  const { bot, config } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  await press(bot, { from: ADMIN, chat: GROUP, data: buttonFor('Reaction').callback_data })

  assert.equal(config.getChatConfig({ chat: GROUP }).react_to_text_enabled, false)
  assert.equal(buttonFor('Reaction').text, 'Reaction to text ❌')
})

test('the settings of one group do not change another group', async () => {
  const { bot, config } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })
  await press(bot, { from: ADMIN, chat: GROUP, data: buttonFor('Transcriber').callback_data })

  assert.equal(config.getChatConfig({ chat: OTHER_GROUP }).transcriber_enabled, true)
})

test('the language button switches the language for everyone in the chat', async () => {
  const { bot } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  await press(bot, { from: ADMIN, chat: GROUP, data: buttonFor('Language').callback_data })
  await send(bot, { from: MEMBER, chat: GROUP, text: '/hello' })

  assert.equal(calls('sendMessage').pop().payload.text, 'Ciao, sono YoYo-Ma! Posso eseguire i tuoi comandi! Wow!')
})

test('a member who is not an admin cannot change a group setting', async () => {
  const { bot, config } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  await press(bot, { from: MEMBER, chat: GROUP, data: buttonFor('Transcriber').callback_data })

  assert.equal(config.getChatConfig({ chat: GROUP }).transcriber_enabled, true)
  assert.equal(calls('answerCallbackQuery')[0].payload.text, 'Only the group admins can change the settings')
})

test('a member who is not an admin gets no menu in a group', async () => {
  const { bot } = createBot()

  await send(bot, { from: MEMBER, chat: GROUP, text: '/config' })

  assert.equal(calls('sendMessage').length, 0)
})

test('a new menu replaces the previous one of the same chat', async () => {
  const { bot } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })
  const firstMenuId = nextMessageId

  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  assert.deepEqual(calls('deleteMessage').map(call => call.payload), [{ chat_id: GROUP.id, message_id: firstMenuId }])
})

test('the menu of one group is never deleted from another group', async () => {
  const { bot } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  await send(bot, { from: ADMIN, chat: OTHER_GROUP, text: '/config' })

  assert.equal(calls('deleteMessage').length, 0)
})

const tempSettingsFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'yoyo-config-')), 'chat-settings.json')

test('settings survive a restart of the bot', async () => {
  const file = tempSettingsFile()
  const before = createChatConfig({ file })
  before.setChatConfig({ chat: GROUP }, { transcriber_enabled: false, locale: 'it' })

  const after = createChatConfig({ file })

  assert.deepEqual(after.getChatConfig({ chat: GROUP }), { transcriber_enabled: false, react_to_text_enabled: true, locale: 'it' })
})

test('a button press is saved too', async () => {
  const file = tempSettingsFile()
  const bot = new Telegraf('TOKEN')
  const config = createChatConfig({ file })
  bot.use(session())
  bot.use(new TelegrafI18n({ defaultLanguage: 'en', directory: path.join(__dirname, '../../i18n'), useSession: true }).middleware())
  bot.command('config', config.manageGroupConfig)
  bot.action(/^config__/, config.handleConfigButton)
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  await press(bot, { from: ADMIN, chat: GROUP, data: buttonFor('Reaction').callback_data })

  assert.equal(createChatConfig({ file }).getChatConfig({ chat: GROUP }).react_to_text_enabled, false)
})

test('with no saved settings yet, every chat starts from the defaults', () => {
  const config = createChatConfig({ file: tempSettingsFile() })

  assert.equal(config.getChatConfig({ chat: GROUP }).transcriber_enabled, true)
})

test('a damaged settings file does not stop the bot, the chats start from the defaults', () => {
  const file = tempSettingsFile()
  fs.writeFileSync(file, '{ not json')

  const config = createChatConfig({ file, onLoadError: () => {} })

  assert.equal(config.getChatConfig({ chat: GROUP }).transcriber_enabled, true)
})

test('the settings file is created along with its folder', () => {
  const file = path.join(path.dirname(tempSettingsFile()), 'missing', 'chat-settings.json')

  createChatConfig({ file }).setChatConfig({ chat: GROUP }, { transcriber_enabled: false })

  assert.equal(fs.existsSync(file), true)
})

test('a previous menu that was already deleted does not stop the new one', async () => {
  const { bot } = createBot()
  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })
  failDeletes = true

  await send(bot, { from: ADMIN, chat: GROUP, text: '/config' })

  assert.equal(calls('sendMessage').length, 2)
})
