const path = require('path');

module.exports = {
  entry: './src/createAzureGitPRTask/main.ts',
  target: 'node10',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/createAzureGitPRTask'),
  },
};