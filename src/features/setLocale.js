const setLocale = (ctx) => {
  const locale = ctx.state.command.args
  if (locale === 'it' || locale === 'en') {
    ctx.i18n.locale(ctx.state.command.args)
    ctx.reply(ctx.i18n.t('locale_set'))
  } else {
    ctx.reply(ctx.i18n.t('no_locale'))
  }
}
module.exports = {
  setLocale
}
