const allCards = require('../../assets/cah.json')
const _ = require('underscore')

const sendRandomCAH = (ctx) => {
  return ctx.reply(getRandomCardCombo(allCards), {
    parse_mode: 'HTML',
    disable_notification: true
  })
}

const getRandomCardCombo = (cards, randomUpTo = _.random) => {
  const blackCard = cards.blackCards[randomUpTo(cards.blackCards.length - 1)]
  let combo = blackCard.text
  for (let i = 0; i < blackCard.pick; ++i) {
    const whiteCard = cards.whiteCards[randomUpTo(cards.whiteCards.length - 1)]
    combo = combo.includes('_') ? combo.replace('_', whiteCard) : whiteCard
  }
  return combo.replace('&trade;', '')
}

module.exports = {
  sendRandomCAH,
  getRandomCardCombo
}
