const path = require('path');
const fs = require('fs');
const version = require('./package.json').version;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const webpack = require('webpack');
const _ = require('lodash');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, options) => {
  const is_prod = options.mode == 'production';

  const babel_loader = {
    loader: 'babel-loader',
    options: {
      plugins: ["lodash", "@babel/plugin-transform-template-literals"],
      presets: ["@babel/preset-env"]
    }
  };

  // Custom webpack rules
  const rules = [
    { test: /\.tsx?$/, use: [babel_loader, 'ts-loader'] },
    { test: /\.js$/, use: [babel_loader, 'source-map-loader'] },
    { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }
  ];

  // Packages that shouldn't be bundled but loaded at runtime
  const externals = ['@jupyter-widgets/base'];

  const resolve = {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".scss"],

    // default to make TSC happy
    alias: { experiment: path.resolve(__dirname, 'src/experiments/variable_cued_recall.tsx') }
  };

  let external_scripts = [
    ["https://unpkg.com/react@16/umd/react.development.js",
     "https://unpkg.com/react@16/umd/react.production.min.js"],
    ["https://unpkg.com/react-dom@16/umd/react-dom.development.js",
     "https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"],
    ["https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.min.js",
     "https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.min.js"],
    ["https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js",
     "https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js"]
  ];

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
          cache: false,
          templateParameters: {
            external_scripts: external_scripts.map(([dev, prod]) =>
              `<script crossorigin src="${is_prod ? prod : dev}"></script>`).join("\n")
          }
        }),
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [`${exp_name}.js`]),
      ],
      ...(is_prod ? {} : {devtool: 'inline-source-map'}),
      resolve: {
        ...resolve,
        alias: { experiment: path.resolve(__dirname, `src/experiments/${fname}`) }
      },
      optimization: {minimizer: [new TerserPlugin()]},
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        axios: 'axios',
        lodash: '_'
      },
    };
  });

  return _.find(experiments, (e) => e.output.filename == 'function_memory.js');

  //module.exports = experiments;

  // module.exports = [
  //   // Jupyter extension
  //   {
  //     entry: './src/extension.ts',
  //     output: {
  //       filename: 'index.js',
  //       path: path.resolve(__dirname, 'experiment_widgets', 'nbextension', 'static'),
  //       libraryTarget: 'amd'
  //     },
  //     module: { rules },
  //     devtool: 'source-map',
  //     externals,
  //     resolve,
  //     optimization
  //   },
  // ] //.concat(experiments);
}
