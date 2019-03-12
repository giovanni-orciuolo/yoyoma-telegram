const supercrawler = require('supercrawler')
const queryString = require('querystring')
const EventEmitter = require('events')
const request = require('request');

const cheerio = require("cheerio")
const urlMod = require("url")

class CustomScpWebCrawler extends EventEmitter {
  constructor() {
    super()
    this.initCrawler = this.initCrawler.bind(this)
    this.customSearchResultsParser = this.customSearchResultsParser.bind(this)

    this.crawler = new supercrawler.Crawler({
      interval: 50,
      concurrentRequestsLimit: 5,
      robotsCacheTime: 360000,
      userAgent: "Mozilla/5.0 (compatible; supercrawler/1.0; +https://github.com/DoubleHub/yoyoma-telegram)"
    })
    this.currentContext = null

    this.initCrawler()
  }

  initCrawler() {
    this.crawler.addHandler("text/html", this.customSearchResultsParser({
      hostnames: ["www.scp-wiki.net"]
    }))
    this.crawler.on('crawlurl', (url) => {
      if (!url.includes('/q/') && !url.includes('robots')) {
        this.crawler.stop()
        this.emit('crawl_end', url)
      }
    })
  }

  customSearchResultsParser(opts = {}) {
    return (context) => {
      const $ = context.$ || cheerio.load(context.body);
      context.$ = $;

      return $(".search-results > .item > .title > a[href]").map(function () {

        const $this = $(this)
        const targetHref = $this.attr("href")
        const absoluteTargetUrl = urlMod.resolve(context.url, targetHref)
        const urlObj = urlMod.parse(absoluteTargetUrl)
        const protocol = urlObj.protocol
        const hostname = urlObj.hostname

        if (protocol !== "http:" && protocol !== "https:") {
          return null
        }

        // Restrict links to a particular group of hostnames.
        if (typeof opts.hostnames !== "undefined") {
          if (opts.hostnames.indexOf(hostname) === -1) {
            return null
          }
        }

        return urlMod.format({
          protocol: urlObj.protocol,
          auth: urlObj.auth,
          host: urlObj.host,
          pathname: urlObj.pathname,
          search: urlObj.search
        })
      }).get()
    }
  }
}

const webCrawler = new CustomScpWebCrawler()

webCrawler.on('crawl_end', (url) => {
  if (!url) return
  webCrawler.currentContext.reply(url, {
    reply_to_message_id: webCrawler.currentContext.message.message_id,
  })
  webCrawler.currentContext = null
})

// Adapted from Marv discord.js bot
const fetchScpEntry = (link, num, title) => {
  const CHAR_TRESHOLD = 300
  return new Promise((resolve, reject) => {
    request(link, (error, response, html) => {
      let text = '', image = ''
      if (error || response.statusCode !== 200)
        return

      const $ = cheerio.load(html);
      $('p', '#page-content').each((i, element) => {
        if (i === 4) return false
        if ($(element).parent().hasClass('scp-image-caption') || $(element).text().includes('Item #:')) return true
        text = text + $(element).text() + '\n\n'
      });
      $('img', '.scp-image-block').each((i, element) => {
        if (i > 0) return false
        image = $(element).attr('src') || ''
      })

      if (text.length >= CHAR_TRESHOLD) text = `${text.substr(0, CHAR_TRESHOLD - 3)}...`
      else if (error === null) text = error
      else text = ""

      if (text == null) {
        reject({ message: "No SCP found!" })
      } else {
        if (!title) title = 'SCP-' + num
        resolve({
          title: title,
          image: image,
          description: text,
          url: link
        })
      }
    });
  })
}
const randomScpEntry = async () => {
  const num = Math.floor(Math.random() * 5000).toString().padStart(3,'0')
  console.log(num)
  return await fetchScpEntry(
    `http://www.scp-wiki.net/scp-${num}`,
    num, ''
  )
}

const sendScpMessage = async (ctx, entry) => {
  await entry.image !== '' ? ctx.replyWithPhoto(entry.image, {
    caption: `<a href="${entry.url}">${entry.title}</a>\n\n${entry.description}`,
    reply_to_message_id: ctx.message.message_id,
    parse_mode: 'HTML',
    disable_notification: true
  }) : ctx.reply(`<a href="${entry.url}">${entry.title}</a>\n\n${entry.description}`, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: 'HTML',
    disable_notification: true
  })
}

const searchScp = async (ctx) => {
  const searchText = ctx.state.command.args
  if (searchText.match(/^[1-9][0-9]*$/)) {
    // This is a whole number, search by exact number instead
    const num = parseInt(searchText)
    if (num <= 1 || num > 5000)
      return ctx.reply(ctx.i18n.t('scp__not_valid'), {
        reply_to_message_id: ctx.message.message_id
      })

    try {
      const entry = await fetchScpEntry(
        `http://www.scp-wiki.net/scp-${searchText}`,
        searchText, ''
      )
      return sendScpMessage(ctx, entry)
    } catch (err) {
      // Not found
      return ctx.reply(ctx.i18n.t('scp__not_found'), {
        reply_to_message_id: ctx.message.message_id
      })
    }
  }

  if (searchText === '') {
    // Just search it randomly lol
    return randomScp(ctx)
  }

  // Web crawl general (but inaccurate) search in SCP wikia
  webCrawler.currentContext = ctx
  webCrawler.crawler.getUrlList()
    .insertIfNotExists(new supercrawler.Url(`http://www.scp-wiki.net/search:site/q/${queryString.escape(ctx.state.command.args)}`))
    .then(() => {
      return webCrawler.crawler.start()
    })
}
const randomScp = async (ctx) => {
  try {
    return sendScpMessage(ctx, await randomScpEntry())
  } catch (err) {
    // Not found
    return ctx.reply(ctx.i18n.t('scp__not_found'), {
      reply_to_message_id: ctx.message.message_id
    })
  }
}

module.exports = {
  searchScp,
  randomScp
}
