const { test } = require('node:test')
const assert = require('node:assert/strict')
const { isTikTokUrl, isFacebookUrl } = require('./videoLink')

test('recognizes TikTok share links and full video links', () => {
  assert.ok(isTikTokUrl('https://vm.tiktok.com/ZMabc123/'))
  assert.ok(isTikTokUrl('https://www.tiktok.com/@scout2015/video/6718335390845095173'))
})

test('recognizes Facebook video links, including fb.watch', () => {
  assert.ok(isFacebookUrl('https://www.facebook.com/watch/?v=10153231379946729'))
  assert.ok(isFacebookUrl('https://m.facebook.com/story.php?id=1'))
  assert.ok(isFacebookUrl('https://fb.watch/abc123/'))
})

test('rejects a look-alike domain that only starts with the real one', () => {
  assert.equal(isTikTokUrl('https://tiktok.com.evil.example/video'), false)
  assert.equal(isFacebookUrl('https://notfacebook.com/watch'), false)
})

test('rejects text that is not a web link', () => {
  assert.equal(isTikTokUrl('--exec rm tiktok.com'), false)
  assert.equal(isFacebookUrl(''), false)
  assert.equal(isFacebookUrl('file:///etc/facebook.com'), false)
})
