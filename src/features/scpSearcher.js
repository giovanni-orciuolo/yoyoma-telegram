const request = require('request')
const cheerio = require('cheerio')
const { replyWithOptionalImage } = require('../utils/replyWithOptionalImage')

// Adapted from Marv discord.js bot
const fetchScpEntry = (num) => {
  return new Promise((resolve, reject) => {
    num = num.padStart(3, '0')
    const link = `http://www.scp-wiki.net/scp-${num}`
    request(link, (err, res, html) => {
      if (err || res.statusCode !== 200) {
        reject(err)
      }

      const CHAR_TRESHOLD = 300
      let text = ''

      if (html.includes("This page doesn't exist yet!")) {
        reject(err)
      }

      const $ = cheerio.load(html);
      $('p', '#page-content').each((i, element) => {
        if (i === 4) {
          return false // break
        }
        if ($(element).parent().hasClass('scp-image-caption') || $(element).text().includes('Item #:')) {
          return true // continue
        }
        text = text + $(element).text() + '\n\n'
      })

      let image = $('img', '.scp-image-block').first().attr('src')

      if (text.length >= CHAR_TRESHOLD) {
        text = `${text.substr(0, CHAR_TRESHOLD - 3)}...`
      }

      resolve({
        title: 'SCP-' + num,
        image: image,
        description: text,
        url: link
      })
    })
  })
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
