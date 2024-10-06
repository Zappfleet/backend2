const path = require("path");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = { 
  mode: 'development',
  entry: "./src/index.js",
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".ts", ".json", ".js"],
    modules: ["node_modules"],
  },
  stats: {
    errorDetails: true,
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'config/firebase'), // کل پوشه firebase را کپی می‌کند
          to: path.resolve(__dirname, 'dist/config/firebase'), // مقصد برای پوشه firebase
          noErrorOnMissing: true,
        },
        {
          from: path.resolve(__dirname, 'config'), // کل پوشه config را کپی می‌کند
          to: path.resolve(__dirname, 'dist/config'), // مقصد برای پوشه config
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};
