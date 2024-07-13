const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    'main': './src/index.js',
    'service-worker': './src/service-worker/index.js',
    'web-worker': './src/web-worker/index.js'
  },
  devServer: {
    static: [
      path.resolve(__dirname, 'public'),
      path.resolve(__dirname, 'node_modules', 'mapserver-wasm', 'dist'),
    ],
    hot: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      chunks: ['main']
    })
  ]
}
