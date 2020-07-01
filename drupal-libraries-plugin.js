const validateOptions = require("schema-utils");
const yaml = require("js-yaml");
const _ = require("lodash");

const schema = {
  type: "object",
  properties: {
    publicPath: {
      type: "string",
    },
    librariesFileName: {
      type: "string",
    },
    fileInfo: {
      type: "object",
      properties: {
        css: {
          type: "object",
        },
        js: {
          type: "object",
        },
      },
    },
    overrides: {
      type: "object",
    },
  },
};

function DrupalLibrariesPlugin(options) {
  validateOptions(schema, options, "Drupal Libraries Plugin");

  this.options = { overrides: {}, ...options };
}

DrupalLibrariesPlugin.prototype.apply = function (compiler) {
  const _this = this;

  compiler.hooks.emit.tapAsync("DrupalLibrariesPlugin", function (
    compilation,
    callback
  ) {
    // Prefix a filename with the publicPath we passed in as option.
    const pathPrefixer = function (filename) {
      if (_this.options.publicPath) {
        return _this.options.publicPath + filename;
      }
      return filename;
    };

    // Turns an array of file names into an object with file infos as properties
    // and the filenames as keys.
    const makeLibraryFileListFromArray = function (fileList, type) {
      return fileList.reduce(function (acc, filename) {
        return { ...acc, [filename]: { ..._this.options.fileInfo[type] } };
      }, {});
    };

    // Construct the actual libraries data
    const libraries = compilation.chunks.reduce(function (acc, chunk) {
      const jsFiles = chunk.files
        .filter((file) => /\.js$/.test(file))
        .map(pathPrefixer);
      const cssFiles = chunk.files
        .filter((file) => /\.css$/.test(file))
        .map(pathPrefixer);
      const chunkInfo = {};
      if (jsFiles.length) {
        chunkInfo.js = makeLibraryFileListFromArray(jsFiles, "js");
      }
      if (cssFiles.length) {
        chunkInfo.css = {
          theme: makeLibraryFileListFromArray(cssFiles, "css"),
        };
      }

      return {
        ...acc,
        // Put in this chunk's info adding overrides if they exist
        [chunk.name]: _.merge(
          chunkInfo,
          _this.options.overrides[chunk.name] || {}
        ),
      };
    }, {});

    // Create yaml string data from our JS object
    const source = yaml.safeDump(libraries, {
      flowLevel: -1,
    });

    // Add the libraries file to the output graph
    compilation.assets[_this.options.librariesFileName] = {
      source: function () {
        return source;
      },
      size: function () {
        return source.length;
      },
    };

    callback();
  });
};

module.exports = DrupalLibrariesPlugin;
