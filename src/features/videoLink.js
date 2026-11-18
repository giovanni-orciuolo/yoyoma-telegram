const fs = require('fs')
const { downloadVideo } = require('./videoDownloader')

const isTikTokUrl = (text) => hasHost(text, ['tiktok.com'])
const isFacebookUrl = (text) => hasHost(text, ['facebook.com', 'fb.watch'])

const sendVideoFromLink = (isSupportedUrl, invalidUrlMessageKey) => async (ctx) => {
  const replyOptions = {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  }
  const url = ctx.state.command.args.trim()
  if (!isSupportedUrl(url)) {
    return ctx.reply(ctx.i18n.t(invalidUrlMessageKey), replyOptions)
  }

  let videoPath
  try {
    await ctx.replyWithChatAction('upload_video')
    videoPath = await downloadVideo(url)
    await ctx.replyWithVideo({ source: videoPath }, replyOptions)
  } catch (err) {
    console.error('[VIDEO] Failed to download', url, err)
    await ctx.reply(ctx.i18n.t('video__download_failed'), replyOptions)
  } finally {
    if (videoPath) fs.unlink(videoPath, () => {})
  }
}

const hasHost = (text, domains) => {
  const url = parseWebUrl(text)
  if (!url) return false
  return domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
}

const parseWebUrl = (text) => {
  try {
    const url = new URL(text)
    return ['http:', 'https:'].includes(url.protocol) ? url : null
  } catch (err) {
    return null
  }
}

module.exports = {
  isTikTokUrl,
  isFacebookUrl,
  sendTikTokVideo: sendVideoFromLink(isTikTokUrl, 'tiktok__invalid_url'),
  sendFacebookVideo: sendVideoFromLink(isFacebookUrl, 'fbvideo__invalid_url')
}
