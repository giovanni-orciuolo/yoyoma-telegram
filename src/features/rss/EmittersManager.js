const RssFeedEmitter = require('rss-feed-emitter')

class EmittersManager {

  constructor() {
    // There must be only 1 feed emitter for each group
    // [{ group: group_id, feeder: [RssFeedEmitter] }, ...]
    this.emitters = []

    this.getEmitter = this.getEmitter.bind(this)
    this.pushEmitter = this.pushEmitter.bind(this)
    this.removeEmitter = this.removeEmitter.bind(this)
    this.getFeeder = this.getFeeder.bind(this)
    this.getAllFeeds = this.getAllFeeds.bind(this)
    this.addFeed = this.addFeed.bind(this)
    this.removeFeed = this.removeFeed.bind(this)
  }

  getEmitter(group_id) {
    return this.emitters.find(emitter => emitter.group === group_id)
  }

  pushEmitter(group_id) {
    const emitter = this.getEmitter(group_id)
    if (emitter) throw {
      message: `Can't push new emitter for group ${group_id}. Emitter already exists.`,
      status: 409
    }

    const feeder = new RssFeedEmitter({ userAgent: 'YoYo-Ma (for Telegram)' })
    this.emitters.push({
      group: group_id,
      feeder: feeder
    })
    return feeder
  }

  removeEmitter(group_id) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw {
      message: `No emitter found for ${group_id}`,
      status: 404
    }

    emitter.feeder.destroy()
    this.emitters = this.emitters.splice(this.emitters.findIndex(e => e === emitter), 1)
  }

  getFeeder(group_id) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw {
      message: `No emitter found for ${group_id}`,
      status: 404
    }

    return emitter.feeder
  }

  getAllFeeds(group_id) {
    return this.getFeeder(group_id).list()
  }

  addFeed(group_id, url, refresh = 60000) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw {
      message: `No emitter found for ${group_id}`,
      status: 404
    }

    const feed = this.getAllFeeds(group_id).find(feed => feed.url === url)
    if (feed) throw {
      message: `Feed with this url already exists in group ${group_id}`,
      status: 409
    }

    emitter.feeder.add({
      url: url, refresh: refresh
    })
    return emitter.feeder
  }

  removeFeed(group_id, url) {
    const emitter = this.getEmitter(group_id)
    if (!emitter) throw {
      message: `No emitter found for ${group_id}`,
      status: 404
    }

    const feed = this.getFeeder(group_id)
    if (!feed) throw {
      message: `No feeder found for ${group_id}`,
      status: 404
    }

    emitter.feeder.remove(url)
  }

}
module.exports = {
  EmittersManager: EmittersManager
}
