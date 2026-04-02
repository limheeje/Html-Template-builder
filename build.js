const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const i18n = require('i18n')
const i18nConfig = require('./config/i18n')
const setRoute = require('./config/route')
const prettier = require('prettier')
const _ = require('lodash')
const pagesPath = path.join(__dirname, 'src/pages')
const distPath = path.join(__dirname, 'dist')
const staticSrc = path.join(__dirname, 'src', 'static')
const staticDest = path.join(distPath, 'static')
const {marklistName} = require('./server')
const {LANG_TYPE, LANG_DEFAULT_LOCALE} = i18nConfig
const locales = Object.values(LANG_TYPE).map((lang)=>lang)
const defaultLocale = LANG_DEFAULT_LOCALE

i18n.configure({
  locales, 
  defaultLocale,
  cookie: 'lang',
  autoReload: true,
  directory: path.join(__dirname, './src/locales')
})

// 기존 dist 삭제 및 재생성
fs.rmSync(distPath, {recursive: true, force: true})
fs.mkdirSync(distPath, {recursive: true})
fs.cpSync(staticSrc, staticDest, {recursive: true})



const compileDirectory = async (locale, currentPath, basePath = pagesPath) => {
  const entries = fs.readdirSync(currentPath, {withFileTypes: true})

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry.name)

    if (entry.isDirectory()) {
      await compileDirectory(locale, entryPath, basePath)
    } else if (entry.isFile() && path.extname(entry.name) === '.ejs') {
      const relativePath = path.relative(basePath, entryPath)
      const localeDistPath = locale === defaultLocale ? distPath : path.join(distPath, locale)
      const outputPath = path.join(localeDistPath, relativePath.replace('.ejs', '.html'))
      const outputDir = path.dirname(outputPath)

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true})
      }

      // 정확한 static 경로 계산 (경로 슬래시 통일)
      const depth = outputDir.split(path.sep).length - distPath.split(path.sep).length
      const relativePrefix = depth > 0 ? '../'.repeat(depth) : './'

      const $staticSrc = (aliasPath) => {
        if (aliasPath.startsWith('@/')) {
          return path.join(relativePrefix, aliasPath.substring(2)).replace(/\\/g, '/')
        }
        return aliasPath
      }

      const $rootSrc = (aliasPath) => {
        if (aliasPath.startsWith('@/')) {
          return path.join(__dirname, 'src', aliasPath.substring(2))
        }
        return aliasPath
      }

      // 레이아웃 정보 가져오기
      await setRoute(path.dirname(relativePath), path.basename(relativePath))
      const jsFilePath = path.join(__dirname, '.routes', `${relativePath.replace('.ejs', '')}.js`)
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
      const getFormattedCode = (str) =>
        prettier
          .format(str, {
            parser: 'html',
            semi: false,
            singleQuote: true,
            arrowParens: 'always',
            bracketSpacing: false,
            endOfLine: 'auto',
            jsxBracketSameLine: false,
            printWidth: 200,
            proseWrap: 'preserve',
            tabWidth: 2,
            trailingComma: 'none',
            useTabs: false
          })
          .then((formatCode) => formatCode)

      i18n.setLocale(locale)

      const pageContent = await ejs.renderFile(entryPath, {
        $t: i18n.__.bind(i18n),
        $currentLocale: i18n.getLocale(),
        process,
        _,
        ..._asyncData,
        defineExport: (o) => ({
          bind: () => {
            return o
          }
        }),
        $staticSrc,
        $rootSrc,
        $i18nConfig: i18nConfig,
        layout,
        data: {},
        props: {},
        head: {},
        ...params
      })

      const layoutPath = path.join(__dirname, 'src', 'layouts', `${layout || 'default'}.ejs`)
      ejs.renderFile(
        layoutPath,
        {
          body: pageContent,
          $t: i18n.__.bind(i18n),
          $currentLocale: i18n.getLocale(),
          process,
          ..._asyncData,
          _,
          defineExport: (o) => ({
            bind: () => {
              return o
            }
          }),
          $staticSrc,
          $i18nConfig: i18nConfig,
          $rootSrc,
          data: {},
          props: {},
          head: {},
          ...params
        },
        async (_err, _str) => {
          const code = await getFormattedCode(_str)
          console.log(`${entryPath} >> ${outputPath}`)
          fs.writeFileSync(outputPath, code)
        }
      )
    }
  }
}
console.log('locales----------', locales)

const buildAllLocales = async () => {
  locales.push('')
  for (const locale of locales) {
    await compileDirectory(locale, pagesPath)
  }
  ejs.renderFile(
    path.join(__dirname, `src/${marklistName}.ejs`),
    {
      process,
      layout: 'layouts/markuplist'
    },
    {},
    (err, str) => {
      if (err) throw err
      fs.writeFileSync(path.join(distPath, `${marklistName}.html`), str)
    }
  )
  console.log(`
############################################################
                       EJS 빌드 완료!                      
############################################################
    `)
  process.exit(0)
}

buildAllLocales()
