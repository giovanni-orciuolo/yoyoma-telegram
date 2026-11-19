const fs = require('fs')
const path = require('path')
const isAdmin = require('../utils/isAdmin')

const DEFAULT_CONFIG = Object.freeze({
  transcriber_enabled: true,
  react_to_text_enabled: true,
  locale: undefined
})

const TOGGLES = [
  { setting: 'transcriber_enabled', label: 'config__transcriber_enabled' },
  { setting: 'react_to_text_enabled', label: 'config__react_enabled' }
]
const TOGGLE_PREFIX = 'config__toggle_'
const SWITCH_LOCALE = 'config__switch_locale'

// One entry per chat. With a file, the settings are saved on every change and survive restarts.
const createChatConfig = ({ file, onLoadError = logLoadError } = {}) => {
  const configs = file ? loadSettings(file, onLoadError) : new Map()
  const menus = new Map()

  const getChatConfig = (ctx) => ({ ...DEFAULT_CONFIG, ...configs.get(ctx.chat.id) })

  const setChatConfig = (ctx, change) => {
    configs.set(ctx.chat.id, { ...configs.get(ctx.chat.id), ...change })
    if (file) saveSettings(file, configs)
  }

  // The chat language wins over the language of each user's Telegram app
  const applyChatLocale = (ctx, next) => {
    const locale = ctx.chat && configs.has(ctx.chat.id) && configs.get(ctx.chat.id).locale
    if (locale) ctx.i18n.locale(locale)
    return next()
  }

  const manageGroupConfig = async (ctx) => {
    if (!await canConfigure(ctx)) {
      // Needs the bot to be an admin; without that the command just stays
      return ctx.deleteMessage().catch(() => {})
    }
    const previousMenu = menus.get(ctx.chat.id)
    if (previousMenu) await ctx.deleteMessage(previousMenu).catch(() => {})

    const menu = await ctx.reply(ctx.i18n.t('config__manage', { group_name: chatName(ctx.chat) }), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true,
      reply_markup: menuKeyboard(ctx, getChatConfig(ctx))
    })
    menus.set(ctx.chat.id, menu.message_id)
  }

  const handleConfigButton = async (ctx) => {
    if (!await canConfigure(ctx)) {
      return ctx.answerCbQuery(ctx.i18n.t('config__admins_only'))
    }
    applyButton(ctx, ctx.callbackQuery.data)
    await ctx.answerCbQuery()
    return ctx.editMessageReplyMarkup(menuKeyboard(ctx, getChatConfig(ctx))).catch(() => {})
  }

  const applyButton = (ctx, data) => {
    if (data === SWITCH_LOCALE) {
      const locale = ctx.i18n.locale() === 'it' ? 'en' : 'it'
      ctx.i18n.locale(locale)
      return setChatConfig(ctx, { locale })
    }
    const toggle = TOGGLES.find(({ setting }) => data === TOGGLE_PREFIX + setting)
    if (toggle) setChatConfig(ctx, { [toggle.setting]: !getChatConfig(ctx)[toggle.setting] })
  }

  return { getChatConfig, setChatConfig, applyChatLocale, manageGroupConfig, handleConfigButton }
}

const canConfigure = async (ctx) => ctx.chat.type === 'private' || await isAdmin(ctx)

const menuKeyboard = (ctx, config) => ({
  inline_keyboard: [
    ...TOGGLES.map(({ setting, label }) => [{
      text: ctx.i18n.t(label, { enabled: config[setting] ? '✅' : '❌' }),
      callback_data: TOGGLE_PREFIX + setting
    }]),
    [{ text: ctx.i18n.t('config__i18n_locale', { locale: ctx.i18n.locale().toUpperCase() }), callback_data: SWITCH_LOCALE }]
  ]
})

const chatName = (chat) => chat.title || (chat.username ? `@${chat.username}` : chat.first_name)

const loadSettings = (file, onLoadError) => {
  try {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(file, 'utf8'))).map(([chatId, config]) => [Number(chatId), config]))
  } catch (err) {
    if (err.code !== 'ENOENT') onLoadError(err)
    return new Map()
  }
}

// Writes a temporary file and renames it, so a crash mid-write never leaves half a file
const saveSettings = (file, configs) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const temporary = `${file}.tmp`
  fs.writeFileSync(temporary, JSON.stringify(Object.fromEntries(configs), null, 2))
  fs.renameSync(temporary, file)
}

const logLoadError = (err) => console.error('[CONFIG] Could not read the chat settings, starting from the defaults', err)

const chatConfig = createChatConfig({ file: process.env.CHAT_SETTINGS_FILE || path.join(__dirname, '../../data/chat-settings.json') })

module.exports = {
  createChatConfig,
  getChatConfig: chatConfig.getChatConfig,
  applyChatLocale: chatConfig.applyChatLocale,
  manageGroupConfig: chatConfig.manageGroupConfig,
  handleConfigButton: chatConfig.handleConfigButton
}
