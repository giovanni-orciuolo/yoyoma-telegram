const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createOcr } = require('./imageToText')

const fakeEngines = ({ failOn } = {}) => {
  const engines = []
  const createWorker = async () => {
    const engine = {
      terminated: false,
      recognize: async (image) => {
        if (image === failOn) throw new Error('unreadable')
        return { data: { text: `text of ${image}` } }
      },
      terminate: async () => { engine.terminated = true }
    }
    engines.push(engine)
    return engine
  }
  return { engines, createWorker }
}

test('the text of a photo is read', async () => {
  const { createWorker } = fakeEngines()
  const ocr = createOcr(createWorker)

  assert.equal(await ocr.read('cat.jpg'), 'text of cat.jpg')
})

test('the engine starts once and is reused for later photos', async () => {
  const { engines, createWorker } = fakeEngines()
  const ocr = createOcr(createWorker)

  await ocr.read('one.jpg')
  await ocr.read('two.jpg')

  assert.equal(engines.length, 1)
})

test('two photos at the same moment still start only one engine', async () => {
  const { engines, createWorker } = fakeEngines()
  const ocr = createOcr(createWorker)

  await Promise.all([ocr.read('one.jpg'), ocr.read('two.jpg')])

  assert.equal(engines.length, 1)
})

test('after a failure the engine is replaced, so one bad photo does not break the next ones', async () => {
  const { engines, createWorker } = fakeEngines({ failOn: 'broken.jpg' })
  const ocr = createOcr(createWorker)

  await assert.rejects(ocr.read('broken.jpg'), /unreadable/)
  assert.equal(await ocr.read('fine.jpg'), 'text of fine.jpg')

  assert.equal(engines.length, 2)
  assert.equal(engines[0].terminated, true)
})
