// imports
// =======

var LevelDbWriteStream = require('./leveldbwritestream.js');
var LevelDbReadStream = require('./leveldbreadstream.js');

var levelup = require('levelup');

// Setup logging
// =============

var log = console.log.bind(console);
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

var DEV_MODE = true;
var debug, debugStream;
if (DEV_MODE) {
  debug = console.log.bind(console, 'DEBUG');
  debugStream = process.stdout;
} else {
  debugStream = new require('stream').Writable();
  ws.write = function (d) {};
  debug = function () {};
}


var OD = function (filename) {
  this.db = levelup(filename);
};

var OD.prototype.handleRequest = function (req, res, next) {
  var db = this.db;

  log(req.url, req.method);
  debug(req.headers);

  var key = req.url.substr(1);
  if (key === '') {
    res.end('Key is missing, URL should include a key');
    return;
  }

  if (req.method === 'POST') {
    var ws = new LevelDbWriteStream(null, db, key);
    req.pipe(ws);

    ws.on('finish', function () {
      res.end();
    });

    ws.on('error', function (err) {
      error(err);
    });
  }

  if (req.method === 'GET') {
    var rs = new LevelDbReadStream(null, db, key);

    rs.on('error', function (err) {
      error(err);
      res.end('' + err);
    });

    rs.pipe(res);
  }

};
