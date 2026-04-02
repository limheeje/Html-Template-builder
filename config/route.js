const path = require('path')
const fs = require('fs').promises

module.exports = async (dirPath, filename) => {
  const ejsFilePath = path.join(__dirname, '../src', 'pages', dirPath, filename)
  const jsonFilePath = path.join(__dirname, '../.routes', dirPath, `${filename.replace('.ejs', '')}.js`)
  const objectRegex = /defineExport\s*\(\s*(\{[\s\S]*?\})\s*\)\.bind\(\)/
  const data = await fs.readFile(ejsFilePath, 'utf-8')
  const match = objectRegex.exec(data) || ['', '{}']
  const jsonContent = `const i18n = require('i18n')\nconst $t = i18n.__\n\nmodule.exports = ${match[1]}`
  const directPath = path.dirname(jsonFilePath)
  await fs.mkdir(directPath, {recursive: true})
  await fs.writeFile(jsonFilePath, jsonContent, 'utf-8')
}
