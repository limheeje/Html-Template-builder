const http = require('http')
const express = require('express')
const path = require('path')
const setRoute = require('./config/route')
const cookieParser = require('cookie-parser')
const watcher = require('./config/watch')
const _ = require('lodash')
const i18n = require('i18n')
const i18nConfig = require('./config/i18n')
const app = express()
const server = http.createServer(app)
const hostname = 'localhost'
const port = '3000'
const marklistName = '@index_mobile'
const {LANG_TYPE, LANG_DEFAULT_LOCALE} = i18nConfig
const locales = Object.values(LANG_TYPE).map((lang) => lang)

i18n.configure({
  locales,
  defaultLocale: LANG_DEFAULT_LOCALE,
  cookie: 'lang',
  autoReload: true,
  directory: path.join(__dirname, './src/locales')
})

app.use((req, res, next) => {
  const lang = req.path.split('/')[1]
  i18n.init(req, res)
  if (locales.includes(lang)) {
    req.setLocale(lang)
  }
  res.locals.$t = res.__
  res.locals.$currentLocale = res.getLocale()
  res.locals.$i18nConfig = i18nConfig
  res.locals.$staticSrc = (aliasPath) => {
    const crtLocale = res.getLocale()
    const depth = res.req.url.split('/').filter(Boolean).length || 1
    let relativePath = './'
    if (depth > 1) {
      relativePath = '../'.repeat(depth - 1)
    }
    if (crtLocale !== LANG_DEFAULT_LOCALE) {
      relativePath += '../'
    }
    return aliasPath.startsWith('@/') ? aliasPath.replace('@/', relativePath) : aliasPath
  }
  res.locals.$rootSrc = (aliasPath) => {
    if (aliasPath.startsWith('@/')) {
      return path.join(__dirname, 'src', aliasPath.substring(2))
    }
    return aliasPath
  }
  next()
})

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'src')))
app.use(require('express-ejs-layouts'))
app.set('layout', 'layouts/default')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'src'))
app.get('/', (req, res) => {
  res.redirect(`/${marklistName}`)
})

let routes = new Set()

function addRoute(dirPath, filename) {
  const routePath = `${dirPath ? `/${dirPath}` : ``}/${filename.replace('.ejs', '')}`
  const routeCallback = async (req, res) => {
    await setRoute(dirPath, filename)
    const jsFilePath = await path.join(__dirname, '.routes', `${routePath}.js`)
    delete require.cache[require.resolve(jsFilePath)]
    const {layout, asyncData, ...params} = require(jsFilePath)
    const getHtml = (url) => {
      return new Promise((resolve) => {
        fetch(url, {
          headers: {
            'Content-Type': 'text/html'
          }
        })
          .then((res) => res.text())
          .then((html) => resolve(html))
      })
    }
    const _asyncData = asyncData ? await asyncData({getHtml}).then((params) => params) : {}
    res.render(`pages/${routePath}`, {
      _,
      process,
      defineExport: (o) => ({
        bind: () => {
          return o
        }
      }),
      ..._asyncData,
      layout: `layouts/${layout || 'default'}`,
      data: {},
      props: {},
      head: {},
      ...params
    })
  }
  if (!routes.has(routePath)) {
    locales.forEach((lang) => {
      let _v = routePath
      if (lang !== LANG_DEFAULT_LOCALE) {
        _v = `/${lang}${routePath}`
      }
      app.get(_v, async (req, res) => routeCallback(req, res))
      routes.add(_v)
    })
    console.log('routes-----', routes)
  }
}

const fnAddRoute = (filePath) => {
  const filename = path.basename(filePath)
  const dirPath = path.relative(path.join(__dirname, 'src/pages'), path.dirname(filePath)).replace(/\\/g, '/')

  if (filename.endsWith('.ejs')) {
    addRoute(dirPath, filename)
  }
}
watcher.on('add', (filePath) => fnAddRoute(filePath))
watcher.on('change', (filePath) => fnAddRoute(filePath))
watcher.on('addDir', (filePath) => fnAddRoute(filePath))

app.get(`/${marklistName}`, (req, res) => {
  res.render(marklistName, {
    process,
    layout: 'layouts/markuplist'
  })
})

server.listen(port, () => {
  console.log(`http://${hostname}:${port}/`)
})
exports.HOST = `${hostname}:${port}`
exports.marklistName = marklistName
