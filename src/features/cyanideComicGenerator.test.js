const { test } = require('node:test')
const assert = require('node:assert/strict')
const { comicFromPanels } = require('./cyanideComicGenerator')

const panels = [
  { column: 1, filename: 'FD6C165BC35A.png', slug: 'vyr' },
  { column: 2, filename: '77322236C3B5.png', slug: 'jsn' },
  { column: 3, filename: '5E787155329B.png', slug: 'wpa' }
]

test('the permalink joins the panel slugs, as explosm.net does', () => {
  assert.equal(comicFromPanels(panels).permalink, 'https://explosm.net/rcg/vyrjsnwpa')
})

test('each panel image comes from the explosm panel CDN, in column order', () => {
  const shuffled = [panels[2], panels[0], panels[1]]

  assert.deepEqual(comicFromPanels(shuffled).panelUrls, [
    'https://rcg-cdn.explosm.net/panels/FD6C165BC35A.png',
    'https://rcg-cdn.explosm.net/panels/77322236C3B5.png',
    'https://rcg-cdn.explosm.net/panels/5E787155329B.png'
  ])
})
