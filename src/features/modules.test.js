const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')

// A missing dependency only shows up when the bot starts, so load every feature here instead
const featureModules = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && !file.endsWith('.test.js'))

for (const file of featureModules) {
  test(`${file} loads with the installed dependencies`, () => {
    assert.doesNotThrow(() => require(`./${file}`))
  })
}
