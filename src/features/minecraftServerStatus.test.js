const { test } = require('node:test')
const assert = require('node:assert/strict')
const { describeServer } = require('./minecraftServerStatus')

test('an offline server is described as offline only', () => {
  assert.equal(describeServer({ online: false }), 'Server status: <b>OFFLINE</b>')
})

test('an online server that hides its player list still shows the player count', () => {
  const server = {
    online: true,
    version: '1.8',
    motd: { clean: ['Hypixel Network'] },
    players: { online: 3, max: 100 }
  }

  assert.equal(
    describeServer(server),
    'Server status: <b>ONLINE</b>\nMOTD: Hypixel Network\n\nOnline: 3/100\n\n<i>Minecraft 1.8</i>'
  )
})

test('an online server lists its player names', () => {
  const server = {
    online: true,
    version: '1.20',
    motd: { clean: ['Hello'] },
    players: { online: 2, max: 10, list: [{ name: 'Steve' }, { name: 'Alex' }] }
  }

  assert.match(describeServer(server), /Online: Steve, Alex \(2\/10\)/)
})

test('a multi-line MOTD keeps its lines and escapes HTML', () => {
  const server = {
    online: true,
    version: '1.20',
    motd: { clean: ['<Best> server', 'A & B'] },
    players: { online: 0, max: 10 }
  }

  assert.match(describeServer(server), /MOTD: &lt;Best&gt; server\nA &amp; B\n/)
})
