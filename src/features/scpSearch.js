const supercrawler = require('supercrawler')
const queryString = require('querystring')
const EventEmitter = require('events')

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

const searchScp = (ctx) => {
  webCrawler.currentContext = ctx
  webCrawler.crawler.getUrlList()
    .insertIfNotExists(new supercrawler.Url(`http://www.scp-wiki.net/search:site/q/${queryString.escape(ctx.state.command.args)}`))
    .then(() => {
      return webCrawler.crawler.start()
    })
}
module.exports = searchScp
