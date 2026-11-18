const fetch = require('node-fetch')
const cheerio = require('cheerio')
const { replyWithOptionalImage } = require('../utils/replyWithOptionalImage')

const CHAR_TRESHOLD = 300

// Adapted from Marv discord.js bot
const fetchScpEntry = async (num) => {
  num = num.padStart(3, '0')
  const link = `https://scp-wiki.wikidot.com/scp-${num}`
  const res = await fetch(link)
  const html = await res.text()
  if (!res.ok || html.includes("This page doesn't exist yet!")) {
    throw new Error(`SCP-${num} not found (${res.status})`)
  }

  let text = ''
  const $ = cheerio.load(html)
  $('p', '#page-content').each((i, element) => {
    if (i === 4) {
      return false // break
    }
    if ($(element).parent().hasClass('scp-image-caption') || $(element).text().includes('Item #:')) {
      return true // continue
    }
    text = text + $(element).text() + '\n\n'
  })

  const image = $('img', '.scp-image-block').first().attr('src')

  if (text.length >= CHAR_TRESHOLD) {
    text = `${text.substr(0, CHAR_TRESHOLD - 3)}...`
  }

  return {
    title: 'SCP-' + num,
    image,
    description: text,
    url: link
  }
}

const randomScpEntry = async () => {
  return fetchScpEntry(Math.floor(Math.random() * 5000).toString())
}

const sendScpMessage = async (ctx, entry) => {
  const caption = `<a href="${entry.url}">${entry.title}</a>\n\n${entry.description}`
  await replyWithOptionalImage(ctx, entry.image, caption, {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true,
    disable_web_page_preview: true
  })
}

const searchScp = async (ctx) => {
  const number = ctx.state.command.args

  if (number.match(/^[1-9][0-9]*$/)) {
    const num = parseInt(number)
    if (num <= 1 || num > 5000) {
      return ctx.reply(ctx.i18n.t('scp__not_valid'), {
        reply_to_message_id: ctx.message.message_id,
        disable_notification: true
      })
    }

    try {
      const entry = await fetchScpEntry(number)
      return sendScpMessage(ctx, entry)
    } catch (err) {
      return ctx.reply(ctx.i18n.t('scp__not_found'), {
        reply_to_message_id: ctx.message.message_id,
        disable_notification: true
      })
    }
  }

  if (number === '') {
    // Just search it randomly lol
    return randomScp(ctx)
  }

  return ctx.reply(ctx.i18n.t('scp__not_valid'), {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  })
}
const randomScp = async (ctx) => {
  try {
    return sendScpMessage(ctx, await randomScpEntry())
  } catch (err) {
    // Not found
    return ctx.reply(ctx.i18n.t('scp__not_found'), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    })
  }
}

module.exports = {
  searchScp
}
