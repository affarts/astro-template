import path from 'path'
import glob from 'fast-glob'
import fs from 'fs'
import crypto from 'crypto'
import { pathToFileURL } from 'url'

function prevToFsPath(prev) {
  if (!prev) return process.cwd()
  try {
    // prev может быть уже URL-строкой (file://...), или URL-объект
    if (typeof prev === 'object' && prev.pathname) return prev.pathname
    if (typeof prev === 'string') {
      if (prev.startsWith('file://')) return new URL(prev).pathname
      if (prev.includes('://')) return new URL(prev).pathname // другие схемы
      // иначе — обычный id/путь
      return prev
    }
    return String(prev)
  } catch (err) {
    // парсинг как URL упал — fallback
    return String(prev)
  }
}

export function sassGlobPlugin() {
  return {
    name: 'sass-glob-plugin',
    enforce: 'pre',
    async findFileUrl(url, prev) {
      // обрабатываем только scss-глобы
      if (!url || !url.includes('*') || !url.endsWith('.scss')) return null

      // console.log(
      //   '[sass-glob-plugin] Importer called for:',
      //   url,
      //   'prev:',
      //   String(prev).slice(0, 200)
      // )

      // вычисляем директорию, откуда искать (на основе prev)
      let prevFs = prevToFsPath(prev)

      // если prev это что-то вроде '<stdin>' или некорректно, ставим cwd
      if (!prevFs || prevFs === '<stdin>' || prevFs.startsWith('data:')) {
        prevFs = process.cwd()
      }

      // если prevFs — не абсолютный путь, делаем его относительным к cwd
      if (!path.isAbsolute(prevFs)) {
        prevFs = path.resolve(process.cwd(), prevFs)
      }

      const basedir = path.dirname(prevFs)

      // console.log('cwd:', process.cwd())
      // нормализуем glob-путь: если начинается с '/', строим абсолютный путь от cwd
      let globPattern = url
      if (globPattern.startsWith('/')) {
        // относительный к проекту
        globPattern = path.join(process.cwd(), globPattern.slice(1))
      } else if (!path.isAbsolute(globPattern)) {
        // относительный к файлу, откуда импортировали
        globPattern = path.join(basedir, globPattern)
      }

      globPattern = globPattern.replace(/\\/g, '/')

      // console.log('[sass-glob-plugin] Resolved glob pattern:', globPattern)

      const files = await glob(globPattern, { absolute: true, dot: true })
      // console.log('[sass-glob-plugin] found files:', files)

      if (!files || files.length === 0) return null

      // создаём содержимое виртуального файла: импорт абсолютными путями
      const imports = files
        .map((f) => `@use "${f.replace(/\\/g, '/')}";`)
        .join('\n')

      // кешируем виртуальный файл на диске чтобы относительные импорты внутри файлов работали корректно
      const cacheDir = path.join(process.cwd(), '.saglob')
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

      const hash = crypto
        .createHash('sha1')
        .update(files.join(','))
        .digest('hex')
        .slice(0, 10)
      const outFile = path.join(cacheDir, `${hash}.scss`)

      // Записываем только если изменился (оптимизация)
      try {
        const prevContent = fs.existsSync(outFile)
          ? fs.readFileSync(outFile, 'utf8')
          : null
        if (prevContent !== imports) {
          fs.writeFileSync(outFile, imports, 'utf8')
          // console.log('[sass-glob-plugin] wrote virtual file:', outFile)
        }
      } catch (err) {
        console.warn('[sass-glob-plugin] failed to write virtual file:', err)
        return null
      }

      return pathToFileURL(outFile)
    }
  }
}
