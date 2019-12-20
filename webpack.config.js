const path = require('path');

module.exports = {
    watch: true,
  entry: './public/script.js',
  output: {
    filename: 'build.js',
    path: path.resolve(__dirname, 'public'),
  },
};
