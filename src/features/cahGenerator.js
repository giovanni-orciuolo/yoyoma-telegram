const cards = require("../../assets/cah.json")
const _ = require("underscore")

const getRandomCardCombo = () => {
  const blackCard = cards.blackCards[_.random(cards.blackCards.length - 1)]
  let combo = blackCard.text
  for (let i = 0; i < blackCard.pick; ++i) {
    const whiteCard = cards.whiteCards[_.random(cards.blackCards.length - 1)]
    combo = combo.includes("_") ? combo.replace("_", whiteCard) : whiteCard
  }
  return combo.replace("&trade;", "")
}

const sendRandomCAH = (ctx) => {
  return ctx.reply(getRandomCardCombo(), {
    parse_mode: 'HTML',
    disable_notification: true
  })
}
module.exports = {
  sendRandomCAH
}
