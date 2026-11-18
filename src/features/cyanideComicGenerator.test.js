const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const { execFile } = require('child_process')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg-7')
const { comicFromPanels, joinPanels } = require('./cyanideComicGenerator')

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

// Calls ffmpeg directly: fluent-ffmpeg cannot find the lavfi input in the format list of ffmpeg 9
const makePanel = (color, size) => new Promise((resolve, reject) => {
  const file = path.join(os.tmpdir(), `test_panel_${color}_${Date.now()}.png`)
  // rgb24 keeps odd widths like the real 275px panels; the default yuv420p rounds them down
  const args = ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=${color}:s=${size},format=rgb24`, '-frames:v', '1', file]
  execFile('ffmpeg', args, err => err ? reject(err) : resolve(file))
})

const imageSize = (file) => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(file, (err, data) => err ? reject(err) : resolve({ width: data.streams[0].width, height: data.streams[0].height }))
})

test('the three panels are joined side by side into one image', async () => {
  const panelFiles = [await makePanel('red', '275x398'), await makePanel('green', '275x398'), await makePanel('blue', '275x398')]

  const comic = await joinPanels(panelFiles)

  assert.deepEqual(await imageSize(comic), { width: 825, height: 398 })
  for (const file of [...panelFiles, comic]) fs.unlinkSync(file)
})

test('panels of different heights still end up in one row', async () => {
  const panelFiles = [await makePanel('red', '275x398'), await makePanel('green', '200x300'), await makePanel('blue', '275x398')]

  const comic = await joinPanels(panelFiles)

  assert.equal((await imageSize(comic)).height, 398)
  for (const file of [...panelFiles, comic]) fs.unlinkSync(file)
})
