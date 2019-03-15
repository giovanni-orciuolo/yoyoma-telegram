const RssFeedEmitter = require('rss-feed-emitter')

class EmittersManager {

  constructor() {
    // There must be only 1 feed emitter for each group
    // [{ group: group_id, feeder: [RssFeedEmitter] }, ...]
    this.emitters = []

    this.getEmitter = this.getEmitter.bind(this)
    this.pushEmitter = this.pushEmitter.bind(this)
    this.removeEmitter = this.removeEmitter.bind(this)
    this.getAllFeeds = this.getAllFeeds.bind(this)
    this.getFeed = this.getFeed.bind(this)
    this.addFeed = this.addFeed.bind(this)
    this.removeFeed = this.removeFeed.bind(this)
  }

  getEmitter(group_id) {
    return this.emitters.find(emitter => emitter.group === group_id)
  }

  pushEmitter(group_id) {
    const emitter = this.getEmitter(group_id)
    if (emitter) throw `Can't push new emitter for group ${group_id}. Emitter already exists.`

    const feeder = new RssFeedEmitter({ userAgent: 'YoYo-Ma (for Telegram)' })
    this.emitters.push({
      group: group_id,
      feeder: feeder
    })
    return feeder
  }

  removeEmitter(group_id) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw `No emitter found for ${group_id}`

    emitter.feeder.destroy()
    this.emitters = this.emitters.splice(this.emitters.findIndex(e => e === emitter), 1)
  }

  getAllFeeds(group_id) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw `No emitter found for ${group_id}`

    return emitter.feeder.list()
  }

  getFeed(group_id, url) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw `No emitter found for ${group_id}`

    return this.getAllFeeds(group_id).find(feed => feed.url === url)
  }

  addFeed(group_id, url, refresh = 60000) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw `No emitter found for ${group_id}`

    const feed = this.getFeed(group_id, url)
    if (feed) throw `Feed with this url already exists in group ${group_id}`

    emitter.feeder.add({
      url: url, refresh: refresh
    })
  }

  removeFeed(group_id, url) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw `No emitter found for ${group_id}`

    const feed = this.getFeed(group_id, url)
    if (!feed) throw `No feed for this url found for ${group_id}`

    emitter.feeder.remove(url)
  }

}
module.exports = {
  EmittersManager: EmittersManager
}
