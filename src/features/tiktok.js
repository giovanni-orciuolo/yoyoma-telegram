const request = require('request');

// Utility functions
function encodeURL(url) {
  return encodeURIComponent(String(url))
    .replace("!", "%21")
    .replace("\'", "%27")
    .replace("(", "%27")
    .replace(")", "%28")
    .replace("*", "%2A")
    .replace("%20", "+");
}
function getTikTokBypassCORSUrl(url, extra = "") {
  // Based CORS bypass
  return `https://cors-tiktok.herokuapp.com/?u=${encodeURL(url)}${extra}`;
}
function get(url) {
  return new Promise((resolve, reject) => {
    request(url, (err, res, html) => {
      if (err || res.statusCode !== 200) {
        return reject(err);
      }
      resolve(html);
    });
  })
}

// Bot functions
async function fetchTikTokMetadata(url) {
  const tikTokURL = getTikTokBypassCORSUrl(url);
  const html = await get(tikTokURL);

  const dump = html.split("__NEXT_DATA__")[1];
  const json = dump.substr(dump.indexOf(">") + 1).substr(0, dump.indexOf("</script>"));

  const info = JSON.parse(json.substr(0, json.lastIndexOf("}") + 1));
  return info.props.pageProps.itemInfo.itemStruct;
}
async function sendTikTokVideo(ctx) {
  const url = ctx.state.command.args;
  if (!([
    // Valid URLs
    "https://www.tiktok.com/",
    "https://m.tiktok.com/v/",
    "https://vm.tiktok.com/"
  ].some(u => url.startsWith(u)))) {
    return ctx.reply(ctx.i18n.t("tiktok__invalid_url"), {
      reply_to_message_id: ctx.message.message_id,
      disable_notification: true
    });
  }

  const { desc, createTime, video, stats, authorStats } = await fetchTikTokMetadata(url);
  return ctx.replyWithVideo({
    url: getTikTokBypassCORSUrl(video.downloadAddr, "&d=1"),
    filename: `tiktok-${createTime}`
  }, {
    reply_to_message_id: ctx.message.message_id,
    disable_notification: true
  });
}

module.exports = {
  sendTikTokVideo
}
