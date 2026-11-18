const { test, mock } = require('node:test')
const assert = require('node:assert/strict')
const { whileShowing } = require('./chatAction')

const fakeChat = () => {
  const actions = []
  return { actions, ctx: { replyWithChatAction: async (action) => { actions.push(action) } } }
}

const deferred = () => {
  let finish
  const promise = new Promise(resolve => { finish = resolve })
  return { promise, resolve: () => finish() }
}

test('the chat shows the action as soon as the work starts', async () => {
  const { ctx, actions } = fakeChat()

  await whileShowing(ctx, 'upload_photo', async () => {})

  assert.deepEqual(actions, ['upload_photo'])
})

test('long work keeps the action visible, because Telegram hides it after 5 seconds', async () => {
  mock.timers.enable({ apis: ['setInterval'] })
  try {
    const { ctx, actions } = fakeChat()
    const work = deferred()
    const done = whileShowing(ctx, 'upload_video', () => work.promise)

    mock.timers.tick(4000)
    mock.timers.tick(4000)
    work.resolve()
    await done

    assert.deepEqual(actions, ['upload_video', 'upload_video', 'upload_video'])
  } finally {
    mock.timers.reset()
  }
})

test('the action stops once the work is done', async () => {
  mock.timers.enable({ apis: ['setInterval'] })
  try {
    const { ctx, actions } = fakeChat()

    await whileShowing(ctx, 'typing', async () => {})
    mock.timers.tick(20000)

    assert.deepEqual(actions, ['typing'])
  } finally {
    mock.timers.reset()
  }
})

test('the action stops when the work fails, and the failure reaches the caller', async () => {
  mock.timers.enable({ apis: ['setInterval'] })
  try {
    const { ctx, actions } = fakeChat()

    await assert.rejects(whileShowing(ctx, 'typing', async () => { throw new Error('boom') }), /boom/)
    mock.timers.tick(20000)

    assert.deepEqual(actions, ['typing'])
  } finally {
    mock.timers.reset()
  }
})

test('the work result is returned', async () => {
  const { ctx } = fakeChat()

  assert.equal(await whileShowing(ctx, 'typing', async () => 42), 42)
})

test('a failure to show the action does not stop the work', async () => {
  const ctx = { replyWithChatAction: async () => { throw new Error('chat action refused') } }

  assert.equal(await whileShowing(ctx, 'typing', async () => 'done'), 'done')
})
