const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createRateLimit } = require('./rateLimit')

const command = (userId) => ({ from: { id: userId }, message: { text: '/coin' } })
const chatter = (userId) => ({ from: { id: userId }, message: { text: 'lol' } })
const voiceNote = (userId) => ({ from: { id: userId }, message: { voice: {} } })
const buttonPress = (userId) => ({ from: { id: userId }, callbackQuery: {} })

const setup = ({ limit = 2, window = 1000 } = {}) => {
  const clock = { now: 0 }
  const warned = []
  const handled = []
  const rateLimit = createRateLimit({
    window,
    limit,
    onLimitExceeded: ctx => warned.push(ctx.from.id),
    now: () => clock.now
  })
  const send = ctx => rateLimit(ctx, () => handled.push(ctx))
  return { clock, warned, handled, send }
}

test('commands within the limit all reach the bot', () => {
  const { warned, handled, send } = setup({ limit: 2 })

  send(command(1))
  send(command(1))

  assert.equal(handled.length, 2)
  assert.deepEqual(warned, [])
})

test('a burst of 20 commands is warned about once, and the extra commands are dropped', () => {
  const { warned, handled, send } = setup({ limit: 2 })

  for (let i = 0; i < 20; i++) send(command(1))

  assert.equal(handled.length, 2)
  assert.deepEqual(warned, [1])
})

test('a batch of 30 forwarded chat messages is not treated as spam', () => {
  const { warned, handled, send } = setup({ limit: 2 })

  for (let i = 0; i < 30; i++) send(chatter(1))

  assert.equal(handled.length, 30)
  assert.deepEqual(warned, [])
})

test('voice notes and button presses count toward the limit', () => {
  const { warned, handled, send } = setup({ limit: 2 })

  send(voiceNote(1))
  send(buttonPress(1))
  send(command(1))

  assert.equal(handled.length, 2)
  assert.deepEqual(warned, [1])
})

test('after the window passes, a limited user can use the bot again', () => {
  const { clock, handled, send } = setup({ limit: 1, window: 1000 })

  send(command(1))
  send(command(1))
  clock.now = 1000
  send(command(1))

  assert.equal(handled.length, 2)
})

test('one user hitting the limit does not limit another user', () => {
  const { warned, handled, send } = setup({ limit: 1 })

  send(command(1))
  send(command(1))
  send(command(2))

  assert.equal(handled.length, 2)
  assert.deepEqual(warned, [1])
})
