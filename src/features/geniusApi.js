const fetch = require('node-fetch')

const GENIUS_SEARCH_URL = 'https://api.genius.com/search'

const searchGenius = async (text) => {
  const res = await fetch(`${GENIUS_SEARCH_URL}?q=${encodeURIComponent(text)}`, {
    headers: { Authorization: `Bearer ${process.env.GENIUS_TOKEN}` }
  })
  if (!res.ok) throw new Error(`Genius search failed with status ${res.status}`)
  return (await res.json()).response
}

module.exports = {
  searchGenius
}
