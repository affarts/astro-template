/** @type {import("prettier").Config} */
module.exports = {
  plugins: [require.resolve('prettier-plugin-astro')],
  singleQuote: true,
  quoteProps: 'consistent',
  semi: false,
  trailingComma: 'none',
  jsxSingleQuote: false,
  bracketSpacing: true,
  arrowParens: 'always',
  singleAttributePerLine: false,
  bracketSameLine: false,
  printWidth: 80,
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
        singleQuote: true,
        semi: false
      }
    },
    {
      files: ['**/*.scss', '**/*.css'],
      options: {
        singleQuote: false,
        printWidth: 80,
        proseWrap: 'preserve'
      }
    }
  ]
}
