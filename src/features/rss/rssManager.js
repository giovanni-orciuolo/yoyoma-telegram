const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = Stage

const { EmittersManager } = require('./EmittersManager')
const emittersManager = new EmittersManager()

const sceneListenRss = new Scene('listenRSS')
sceneListenRss.enter(ctx => ctx.reply(ctx.i18n.t('rss__new_enter')))
sceneListenRss.leave(ctx => ctx.reply(ctx.i18n.t('rss__new_leave')))
sceneListenRss.command('back', leave())
sceneListenRss.on('text', ctx => {
  ctx.reply(ctx.i18n.t('rss__new_listening'))
})

const manageGroupRSS = async (ctx) => {
  try {
    const groupId = (await ctx.getChat()).id

    // If there is no emitter for this group id
    if (!emittersManager.getEmitter(groupId)) {
      // Push a new emitter for this group id without telling the user
      emittersManager.pushEmitter(groupId)
    }

    const feeds = emittersManager.getAllFeeds(groupId)
    if (feeds.length === 0) {
      return ctx.reply(ctx.i18n.t('rss__no_feeds'), {
        reply_to_message_id: ctx.message.message_id,
        disable_notification: true
      })
    }

  } catch (err) {
    console.error('[RSS] Error during manageGroupRSS: ' + err)
    return ctx.reply(ctx.i18n.t('rss__error'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  }
}
module.exports = {
  manageGroupRSS
}
