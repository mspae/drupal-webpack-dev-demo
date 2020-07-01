const DrupalLibrariesPlugin = require("./drupal-libraries-plugin.js");

module.exports = function (env) {
  const isUsingDevServer = !!process.argv.find((v) =>
    v.includes("webpack-dev-server")
  );

  const librariesPathPrefix = !isUsingDevServer
    ? `dist/`
    : `localhost:3000/dist/`;
  const isProdMode = env ? env.production || false : false;

  return {
    entry: "./src/index.js",
    mode: env.development ? "development" : "production",

    devServer: {
      hot: true,
      // Only write files to disk when running the dev server for Drupal files.
      writeToDisk: function writeToDiskCallback(filePath) {
        return /\.(twig|theme|yml|inc|php)$/.test(filePath);
      },
    },
    plugins: [
      // This plugin writes a libraries.yml file with correct URLs to the built
      // files.
      new DrupalLibrariesPlugin({
        librariesFileName: "theme_name.libraries.yml",
        publicPath: librariesPathPrefix,
        fileInfo: {
          css: {},
          js: {
            ...(!isUsingDevServer ? {} : { type: "external" }),
          },
        },
        overrides: {
          core: {
            js: isProdMode
              ? {
                  [`dist/js/drupal-translations.js`]: {},
                }
              : {},
            dependencies: [
              "core/modernizr",
              "core/jquery",
              "core/jquery.once",
              "core/drupal",
              "core/drupalSettings",
              "core/drupalTranslations",
            ],
          },
        },
      }),
    ],
  };
};
