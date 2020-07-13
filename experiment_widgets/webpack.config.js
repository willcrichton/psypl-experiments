const path = require('path');
const fs = require('fs');
const version = require('./package.json').version;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin')
const _ = require('lodash');

// Custom webpack rules
const rules = [
  { test: /\.tsx?$/, use: ['babel-loader', 'ts-loader'] },
  { test: /\.js$/, loader: 'source-map-loader' },
  { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = ['@jupyter-widgets/base'];

const resolve = {
  // Add '.ts' and '.tsx' as resolvable extensions.
  extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".scss"],

  // default to make TSC happy
  alias: { experiment: path.resolve(__dirname, 'src/experiments/variable_span.tsx') }
};

const optimization = {
  minimizer: [new TerserPlugin()]
};

const experiments = fs.readdirSync('src/experiments').map((fname) => {
  const exp_name = path.basename(fname, '.tsx');
  return {
    entry: './src/standalone.tsx',
    output: {
      filename: `${exp_name}.js`,
      libraryTarget: 'var',
      path: path.resolve(__dirname, '../server/static/experiments_dev')
    },
    module: { rules },
    plugins: [
      new webpack.DefinePlugin({
        EXPERIMENT_NAME: JSON.stringify(exp_name),
        MTURK: false
      }),
      new HtmlWebpackPlugin({
        template: 'src/standalone.html',
        filename: `${exp_name}_experiment.html`,
        inject: true,
        cache: false
      }),
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [`${exp_name}.js`]),
    ],
    resolve: {
      ...resolve,
      alias: { experiment: path.resolve(__dirname, `src/experiments/${fname}`) }
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      axios: 'axios',
      lodash: '_'
    },
    optimization
  };
});

module.exports = _.find(experiments, (e) => e.output.filename == 'function_depth.js');

/* module.exports = [
  *   // Jupyter extension
  *   {
    *     entry: './src/extension.ts',
    *     output: {
      *       filename: 'index.js',
      *       path: path.resolve(__dirname, 'experiment_widgets', 'nbextension', 'static'),
      *       libraryTarget: 'amd'
      *     },
    *     module: { rules },
    *     devtool: 'source-map',
    *     externals,
    *     resolve,
    *     optimization
    *   },
  * ].concat(experiments); */
