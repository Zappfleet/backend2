const path = require("path");

module.exports = {
  entry: "./index.js",
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".ts", ".ts", ".json", ".js"],
    modules: ["node_modules"],
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
      },
    ],
  },
};
