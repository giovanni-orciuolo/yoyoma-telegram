// isAdmin util function

module.exports = async function(ctx) {
  return (await ctx.getChatAdministrators()).findIndex(admin => admin.user.id === ctx.from.id) !== -1
}
