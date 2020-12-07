const path = require('path');

module.exports = {
  entry: {
    createAzureGitPRTask: './src/createAzureGitPRTask/main.ts',
    createAzureGitTagTask: './src/createAzureGitTagTask/main.ts',
    deleteAzureGitTagTask: './src/deleteAzureGitTagTask/main.ts'
  },
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
    filename: '[name]/bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};