const SUPPORTED_LOCALES = {
  'it': ['it', 'italiano', 'italian'],
  'en': ['en', 'inglese', 'english', 'british'] // Quanto cazzo sono british
}
const getSupportedLocale = (locale) => {
  let supported = ''
  Object.keys(SUPPORTED_LOCALES).forEach(key => {
    const locales = SUPPORTED_LOCALES[key]
    if (locales.includes(locale)) {
      supported = locale
    }
  })
  return supported
}

const setLocale = (ctx) => {
  const locale = getSupportedLocale(ctx.state.command.args)
  if (locale === '') {
    return ctx.reply(ctx.i18n.t('no_locale'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  }

  ctx.i18n.locale(locale)
  return ctx.reply(ctx.i18n.t('locale_set'), {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  })
}
module.exports = {
  setLocale
}
