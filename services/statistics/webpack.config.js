var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './api.js',
  target: 'node',
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: __dirname,
      exclude: /node_modules/,
    }]
  },
  output: {
    libraryTarget: 'commonjs',
    path: __dirname + '/.webpack',
    filename: 'api.js'
  },
  externals: {
    'chrome-aws-lambda': 'chrome-aws-lambda',
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'node_modules/chrome-aws-lambda', to: 'node_modules/chrome-aws-lambda' },
    ])
  ]
};
