const path = require('path');

module.exports = {
    watch: true,
  entry: './src/script.js',
  mode: "development",
  output: {
    filename: 'build.js',
    path: path.resolve(__dirname, 'public'),
  },
};
