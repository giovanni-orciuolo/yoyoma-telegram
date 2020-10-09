const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const isAdmin = require('../utils/isAdmin')

// Global chat configs holder
let ChatConfigs = {}

const getChatConfig = (ctx) => {
  return ChatConfigs ? ChatConfigs[ctx.chat.id] : {}
}

const setChatConfig = (ctx, val) => {
  const chatConfig = getChatConfig(ctx)
  if (!ChatConfigs || !chatConfig) return
  ChatConfigs[ctx.chat.id] = { ...ChatConfigs[ctx.chat.id], ...val }
}

const pushNewChatConfig = (ctx, config) => {
  if (ChatConfigs) {
    ChatConfigs[ctx.chat.id] = config
  }
}

const manageGroupConfig = async (ctx) => {
  function boolTriggerStr(value) {
    // Used for boolean togglers
    return value ? 'disable' : 'enable'
  }
  function buildBooleanTrigger(i18n_text, config_name, config_val) {
    return Markup.callbackButton(
      ctx.i18n.t(i18n_text, { enabled: config_val ? '✅' : '❌'}),
      `config__${boolTriggerStr(config_val)}_${config_name}`
    )
  }

  // Default config
  const DEFAULT_CONFIG = {
    current_config_message: 0,
    transcriber_enabled: true,
    react_to_text_enabled: true,
  }

  try {
    if (ctx.chat.type !== 'private' && !(await isAdmin(ctx))) {
      await ctx.deleteMessage(ctx.message.message_id)
      return
    }

    if (!ChatConfigs) {
      ChatConfigs = {}
    }

    let chatConfig = getChatConfig(ctx)
    if (!chatConfig) {
      // First time setting up config for this chat
      pushNewChatConfig(ctx, DEFAULT_CONFIG)
      chatConfig = DEFAULT_CONFIG
    }

    if (chatConfig && chatConfig.current_config_message !== 0) {
      await ctx.deleteMessage(chatConfig.current_config_message)
    }

    const config_keyboard = await ctx.reply(ctx.i18n.t('config__manage',
      { group_name: ctx.chat.type !== 'private' ? ctx.chat.title : `@${ctx.chat.username}` }
    ), {
      reply_to_message_id: ctx.message ? ctx.message.message_id : null,
      disable_notification: true,
      ...Extra.markup(m =>
        m.inlineKeyboard([
          buildBooleanTrigger('config__transcriber_enabled', 'transcriber', chatConfig.transcriber_enabled),
          m.callbackButton(ctx.i18n.t('config__i18n_locale', { locale: ctx.i18n.locale().toUpperCase() }), 'config__switch_locale'),
          buildBooleanTrigger('config__react_enabled', 'react_to_text', chatConfig.react_to_text_enabled),
        ])
      )
    })

    chatConfig.current_config_message = config_keyboard.message_id
  } catch (err) {
    if (err.description && err.description.includes("message can't be deleted")) {
      // don't need to log this, bot is not admin
      return
    }
    console.error(err)
    return ctx.reply(ctx.i18n.t('config__error'), {
      reply_to_message_id: ctx.message ? ctx.message.message_id : null,
      disable_notification: true
    })
  }
}
module.exports = {
  getChatConfig,
  setChatConfig,
  manageGroupConfig
}
