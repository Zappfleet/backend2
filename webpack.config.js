const path = require("path");
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // وارد کردن CleanWebpackPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin'); // وارد کردن CopyWebpackPlugin

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
        test: /\.json$/,
        type: "asset/resource", // اضافه کردن پشتیبانی از فایل‌های JSON
        generator: {
          filename: 'config/firebase/[name].[hash][ext]', // افزودن hash برای جلوگیری از تداخل فایل‌ها
        },
      },
      {
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // استفاده از CleanWebpackPlugin برای پاکسازی پوشه dist
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'config/default.json'),
          to: path.resolve(__dirname, 'dist/config'),
        },
        {
          from: path.resolve(__dirname, 'config/custom-environment-variables.json'),
          to: path.resolve(__dirname, 'dist/config'),
        },
        {
          from: path.resolve(__dirname, 'config/firebase/zapp-passenger-2019-firebase-adminsdk-5p9v8-2ff7de2cf8.json'), // مسیر فایل JSON
          to: path.resolve(__dirname, 'dist/config/firebase'), // محل قرارگیری در خروجی
        },
        {
          from: path.resolve(__dirname, 'config/firebase/zapp-driver-2019-firebase-adminsdk-55mv8-6e41c603e4.json'), // مسیر فایل JSON
          to: path.resolve(__dirname, 'dist/config/firebase'), // محل قرارگیری در خروجی
        },
      ],
    }), // استفاده از CopyWebpackPlugin برای کپی کردن فایل‌های JSON
  ],
};
