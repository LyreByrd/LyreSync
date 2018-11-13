var path = require('path');
var SRC_DIR = path.join(__dirname, '/client/src');
var DIST_DIR = path.join(__dirname, '/client/dist');

module.exports = {
  entry: {
    front: `${SRC_DIR}/index.jsx`,
    test: `${SRC_DIR}/test.jsx`
  },
  output: {
    filename: '[name]-bundle.js',
    path: `${DIST_DIR}`
  },
  module : {
    rules : [
      {
        test : /\.jsx?/,
        include : SRC_DIR,
        use : {loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
        }}
      }
    ]
  }
};