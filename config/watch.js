const path = require('path')
const chokidar = require('chokidar')

module.exports = chokidar.watch(path.join(__dirname, '../src/pages'), {
  ignored: /^\./,
  persistent: true,
  ignoreInitial: false,
  depth: undefined,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100
  }
})
