import neostandard from 'neostandard'

export default [
  ...neostandard(),
  {
    rules: {
      '@stylistic/quotes': 'off',
      '@stylistic/no-trailing-spaces': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      // The Telegram Bot API names every field in snake_case (message_id, file_id, ...)
      camelcase: 'off'
    }
  }
]
