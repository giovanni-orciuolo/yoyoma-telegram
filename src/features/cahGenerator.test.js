const { test } = require('node:test')
const assert = require('node:assert/strict')
const { getRandomCardCombo } = require('./cahGenerator')

const cards = {
  blackCards: [{ text: 'I love _.', pick: 1 }],
  whiteCards: ['cats', 'dogs', 'the last white card']
}
const pickLast = (max) => max

test('any white card can be drawn, not only the first few', () => {
  assert.equal(getRandomCardCombo(cards, pickLast), 'I love the last white card.')
})

test('a black card with two blanks fills both', () => {
  const twoBlanks = { blackCards: [{ text: '_ and _', pick: 2 }], whiteCards: ['salt'] }

  assert.equal(getRandomCardCombo(twoBlanks, pickLast), 'salt and salt')
})
