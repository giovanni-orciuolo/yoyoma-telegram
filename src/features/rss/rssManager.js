const Extra = require('telegraf/extra')
const Scene = require('telegraf/scenes/base')
const moment = require('moment')
const { replyWithOptionalImage } = require('../../utils/replyWithOptionalImage')

const { EmittersManager } = require('./EmittersManager')
const emittersManager = new EmittersManager()

// Fired on each new RSS item
const onNewItem = async (item, ctx) => {
  // pubDate must be within an hour of current date
  if (moment().diff(moment(item.pubDate), "hour") <= 1)
    await replyWithOptionalImage(
      ctx, item.image.url,
      ctx.i18n.t('rss__new_item', {
        title: item.meta.title || 'RSS',
        link: item.link,
        item_title: item.title
      })
    )
}

const sceneListenRss = new Scene('listenRSS')
sceneListenRss.enter(ctx => ctx.reply(ctx.i18n.t('rss__new_enter')))
sceneListenRss.on('text', async ctx => {
  try {
    const groupId = (await ctx.getChat()).id, rssUrl = ctx.message.text
    emittersManager.addFeed(groupId, rssUrl).on('new-item', async item => onNewItem(item, ctx))

    await ctx.reply(ctx.i18n.t('rss__new_listening', { url: rssUrl }))
  } catch (err) {
    console.error('[RSS] Error: ' + err)
    let what = 'rss__error';
    switch (err.status) {
      case 404: what = 'rss__no_emitter'; break
      case 409: what = 'rss__conflict'; break
    }
    return ctx.reply(ctx.i18n.t(what), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  } finally {
    ctx.scene.leave()
  }
})
sceneListenRss.leave(ctx => ctx.reply(ctx.i18n.t('scene_end')))

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
        disable_notification: true,
        ...Extra.markup(m =>
          m.inlineKeyboard([
            m.callbackButton(ctx.i18n.t('yes'), 'rss_new_feed')
          ])
        )
      })
    }

    // Just a placeholder to add more than one RSS feed listener. Management will be implemented later...
    return ctx.reply(ctx.i18n.t('rss__no_feeds'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true,
      ...Extra.markup(m =>
        m.inlineKeyboard([
          m.callbackButton(ctx.i18n.t('yes'), 'rss_new_feed')
        ])
      )
    })
    // Build callback buttons
    /*const buttons = []
    feeds.forEach(feed => buttons.push(Markup.callbackButton(feed.url)))

    return ctx.reply(ctx.i18n.t('rss__manage_msg'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true,
      ...Extra.markup(m =>
        m.inlineKeyboard(buttons)
      )
    })*/
  } catch (err) {
    console.error('[RSS] Error during manageGroupRSS: ' + err)
    return ctx.reply(ctx.i18n.t('rss__error'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  }
}
module.exports = {
  manageGroupRSS,
  sceneListenRss
}
