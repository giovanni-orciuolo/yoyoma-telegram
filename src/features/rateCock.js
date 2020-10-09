const sendCockRate = async (ctx) => {
  const toMention = ctx.state.command.args
  const cockRates = [
    `Signor ${toMention} 🗣 venga qui 🏃🏻‍♂️, mi faccia vedere il pisello 🍆
Orsù dunque, il pene 🌽, il membro 🥒, il ciciniello 🌶, come lo vogliamo chiamare 💬, quello insomma
Poffarbacco signor Peppino 😳, alla faccia del bicarbonato di sodio 🌋, questo è un pisello degno di lode 🎉, bellissimo 🤩, che lunghezza 📏!
E queste palle ⚾️, due figliole tonde 🏀, ciacione 🎱, grandi, eloquenti, un piacere da vedere 😍!
Signor Peppino, i miei più sinceri complimenti 🏆, io le do un 9 su 10 e mo lo mettiamo per iscritto 📝!`
  ]

  const rate = cockRates[Math.floor(Math.random() * cockRates.length)]
  await ctx.reply(rate)
}
module.exports = {
  sendCockRate
}
