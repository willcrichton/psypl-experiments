const path = require('path');
const fs = require('fs');
const version = require('./package.json').version;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const webpack = require('webpack');
const _ = require('lodash');
const TerserPlugin = require('terser-webpack-plugin');
const glob = require('glob');

module.exports = (env, options) => {
  const EXPERIMENTS_DIR = 'src/experiments';

  const EXPERIMENT_MTURK = process.env.BUILD_MTURK == '1';
  const EXPERIMENT_IRB = process.env.BUILD_IRB == '1';
  const EXPERIMENT_DEMOGRAPHICS = process.env.BUILD_DEMOGRAPHICS == '1';
  const EXPERIMENT_NO_INSTRUCTIONS = process.env.BUILD_NO_INSTRUCTIONS == '1';
  const BUILD_TARGET = process.env.BUILD_TARGET;
  const BUILD_ONLY = process.env.BUILD_ONLY;

  const is_prod = options.mode == 'production';

  const babel_loader = {
    loader: 'babel-loader',
    options: {
      plugins: ["lodash", "@babel/plugin-transform-template-literals"],
      presets: [["@babel/preset-env", {targets: {esmodules: true}}]]
    }
  };

  // Custom webpack rules
  const rules = [
    { test: /\.tsx?$/, use: [babel_loader, 'ts-loader'] },
    { test: /\.js$/, use: [babel_loader, 'source-map-loader'] },
    { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
  ];

  // Packages that shouldn't be bundled but loaded at runtime
  const externals = ['@jupyter-widgets/base'];

  const resolve = {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".scss"],

    // default to make TSC happy
    alias: { experiment: path.resolve(__dirname, 'src/experiments/variable_cued_recall.tsx') },

    // Allow root imports from src
    modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')]
  };

  let experiment_infos = glob.sync(`${EXPERIMENTS_DIR}/**/*.tsx`).map(pathname => {
    const exp_dir = path.dirname(path.relative(EXPERIMENTS_DIR, pathname));
    const exp_name = path.basename(pathname, '.tsx');
    return {pathname, exp_dir, exp_name}
  }).filter(({exp_name}) => !BUILD_ONLY || exp_name == BUILD_ONLY);

  let jupyter_config = () => {
    let experiment_entry = _.fromPairs(experiment_infos.map(({pathname, exp_name}) => [exp_name, `./${pathname}`]));
    return {
      entry: {
        index: './src/extension.ts',
        //...experiment_entry
      },
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'experiment_widgets', 'nbextension', 'static'),
        libraryTarget: 'amd'
      },
      module: { rules },
      devtool: 'source-map',
      externals,
      resolve,
    };
  };

  let standalone_config = () => {
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

    return experiment_infos.map(({pathname, exp_dir, exp_name}) => {
      return {
        entry: './src/standalone.tsx',
        output: {
          filename: `${exp_name}.js`,
          libraryTarget: 'var',
          path: path.resolve(__dirname, `../server/static/experiments_dev/${exp_dir}`, )
        },
        module: { rules },
        plugins: [
          new webpack.DefinePlugin({
            EXPERIMENT_NAME: JSON.stringify(exp_name),
            EXPERIMENT_MTURK, EXPERIMENT_IRB, EXPERIMENT_DEMOGRAPHICS, EXPERIMENT_NO_INSTRUCTIONS
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
          alias: { experiment: path.resolve(__dirname, pathname) }
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
  };

  if (BUILD_TARGET == 'jupyter') {
    return jupyter_config();
  } else if (BUILD_TARGET == 'standalone') {
    return standalone_config();
  } else {
    throw `Invalid target: ${BUILD_TARGET}`;
  }
}
