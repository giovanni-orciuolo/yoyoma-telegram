// getRandomFusion fork
const { getRandomFusion } = require('pokefusion-api')

process.on('message', async () => {
  const fusion = await getRandomFusion()
  process.send({ pokeFusion: fusion })
})
