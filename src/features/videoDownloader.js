const { execFile } = require('child_process')
const os = require('os')
const path = require('path')
const { generate } = require('shortid')

// Telegram refuses bot uploads above 50 MB
const MAX_SIZE = '50M'
const TIMEOUT_MS = 120000

// Downloads with yt-dlp, which keeps up with TikTok and Facebook page changes. Resolves to the file path.
const downloadVideo = (url) => new Promise((resolve, reject) => {
  const outputTemplate = path.join(os.tmpdir(), `video_${generate()}.%(ext)s`)
  const args = [
    '--format', `b[filesize<${MAX_SIZE}]/b[filesize_approx<${MAX_SIZE}]/b`,
    '--max-filesize', MAX_SIZE,
    '--no-playlist',
    '--output', outputTemplate,
    '--print', 'after_move:filepath',
    '--no-simulate',
    // "--" stops yt-dlp from reading the URL as an option
    '--', url
  ]
  execFile('yt-dlp', args, { timeout: TIMEOUT_MS }, (err, stdout, stderr) => {
    if (err) return reject(new Error(`yt-dlp failed: ${stderr || err.message}`))
    const filePath = stdout.trim().split('\n').pop()
    if (!filePath) return reject(new Error('yt-dlp downloaded nothing, the video is probably too big'))
    resolve(filePath)
  })
})

module.exports = {
  downloadVideo
}
