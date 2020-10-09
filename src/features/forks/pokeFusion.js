// getRandomFusion fork
const { getRandomFusion } = require('pokefusion-api')

process.on('message', async () => {
  const fusion = await getRandomFusion('/usr/bin/chromium-browser')
  process.send({ pokeFusion: fusion })
})
