const path = require('path');
const version = require('./package.json').version;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');

// Custom webpack rules
const rules = [
  { test: /\.tsx?$/, use: ['babel-loader', 'ts-loader'] },
  { test: /\.js$/, loader: 'source-map-loader' },
  { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader']}
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = ['@jupyter-widgets/base'];

const resolve = {
  // Add '.ts' and '.tsx' as resolvable extensions.
  extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".scss"]
};

module.exports = [
  // Jupyter extension
  {
    entry: './src/extension.ts',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'experiment_widgets', 'nbextension', 'static'),
      libraryTarget: 'amd'
    },
    module: {
      rules: rules
    },
    devtool: 'source-map',
    externals,
    resolve,
  },

  // Standalone
  {
    entry: './src/standalone.tsx',
    output: {
      filename: 'standalone.js',
      libraryTarget: 'var'
    },
    module: {
      rules: rules
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/standalone.html',
        filename: 'standalone.html',
        inject: true
      }),
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/standalone.js/]),
    ],
    resolve,
  },
];
