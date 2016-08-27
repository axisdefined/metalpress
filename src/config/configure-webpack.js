require("babel-register", {
  presets: [ 'es2015' ]
});

import path from 'path';
import fs from 'fs';
import defaultWebpackDev from './webpack.config';
import defaultWebpackProd from './webpack.prod.config';
import BowerWebpackPlugin from 'bower-webpack-plugin';
import deepAssign from 'deep-assign';

export default function (config) {
  
  var bundle = {
    entry: path.resolve(config.basePath, './src/assets/js/index.js'),
    output: {
      path: path.resolve(config.basePath, './dist/assets/js')
    }
  };
  var customWebpackDev = {};
  var customWebpackProd = {};

  try {
    // attempt to load custom config
    customWebpackDev = require(path.resolve(config.basePath, config.webpack.dev)).default;
    customWebpackProd = require(path.resolve(config.basePath, config.webpack.prod)).default;
    customWebpackDev.resolve = {
      root: [
        path.resolve(config.basePath, 'node_modules'),
        path.resolve(config.basePath, 'src/lib')
      ]
    };
    customWebpackProd.resolve = {
      root: [
        path.resolve(config.basePath, 'node_modules'),
        path.resolve(config.basePath, 'src/lib')
      ]
    };
  } catch (e) {}

  // jquery configuration
  try {
    if (config.jquery) {
      defaultWebpackDev.externals = defaultWebpackProd.externals = {
        'jquery': 'jQuery'
      }
    }
  } catch (e) { console.log(e) }

  // plugins (bower-webpack-plugin)
  try {
    if (config.bower) {
      if (!defaultWebpackDev.plugins || !defaultWebpackDev.plugins.length) {
        defaultWebpackDev.plugins = [];
      }
      if (!defaultWebpackProd.plugins || !defaultWebpackProd.plugins.length) {
        defaultWebpackProd.plugins = [];
      }
      var bowerConfig = new BowerWebpackPlugin({
        modulesDirectories: ['src/lib'],
        manifestFiles: 'bower.json'
      });
      defaultWebpackDev.plugins.push(bowerConfig);
      defaultWebpackProd.plugins.push(bowerConfig);
    }
  } catch (e) { console.log(e) }
  
  // return webpack configuration
  return {
    dev: deepAssign(
      {}, 
      defaultWebpackDev,
      bundle,
      customWebpackDev
    ),
    prod: deepAssign(
      {}, 
      defaultWebpackProd,
      bundle,
      customWebpackProd
    )
  };
  
}

export function omitWebpack (config) {
  var newConfig = {};
  for (let c in config) {
    if (c !== 'webpack') {
      newConfig[c] = config[c];
    }
  }
  return newConfig;
}