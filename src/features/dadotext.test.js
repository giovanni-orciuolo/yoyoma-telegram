const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { writeTextOnVideo } = require('./dadotext')

const VIDEO = path.join(__dirname, '../../assets/dadobax.mp4')

test('writes text with quotes, colons and percent signs onto the video', async () => {
  const output = await writeTextOnVideo(VIDEO, "it's 100%: dado's text")

  assert.ok(fs.statSync(output).size > 0)
  fs.unlinkSync(output)
})
