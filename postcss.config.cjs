module.exports = {
  plugins: [
    require("postcss-url"),
    require("autoprefixer"),
    require("postcss-combine-media-query"),
    require("postcss-combine-duplicated-selectors")({
      removeDuplicatedProperties: true,
      removeDuplicatedValues: false,
    }),
    require("cssnano"),
    require("postcss-reporter"),
  ],
};
