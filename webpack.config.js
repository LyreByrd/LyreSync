var path = require('path');
var SRC_DIR = path.join(__dirname, '/client/src');
var DIST_DIR = path.join(__dirname, '/client/dist');

module.exports = {
  entry: {
    front: `${SRC_DIR}/index.jsx`,
    devclient: `${SRC_DIR}/devclient.jsx`,
    ythostwindow: `${SRC_DIR}/ythostwindow.jsx`,
    duplex: `${SRC_DIR}/duplexloader.jsx`,
    ytclientwindow: `${SRC_DIR}/ytclientwindow.jsx`
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