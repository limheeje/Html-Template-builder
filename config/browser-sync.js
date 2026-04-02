const {HOST} = require('../server.js')
module.exports = {
  proxy: HOST,
  files: ['src/**/*.ejs', 'src/static/**/*.*', 'src/locales/*.json', 'src/data/*.*'],
  port: 5500,
  notify: false,
  reloadDelay: 150
}
