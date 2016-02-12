// imports
// ========

var ConnectLight = require('connectlight');
var ODServerMysql = require('./odservermysql.js');
var ODServerLevelDb = require('./odserverleveldb.js');
var OdParser = require('odparser').OdParser;
var OdAcl = require('odacl');

// constants
// =========

var LEVELDB_PATH = './mydb'

// Setup logging
// =============

var log = console.log.bind(console);
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

var DEV_MODE = true;
var debug;
if (DEV_MODE) {
  debug = console.log.bind(console, 'DEBUG');
} else {
  debug = function () {};
}

// Setup Odata Server Modules
// ==========================

var mws = new ConnectLight();
var odsMysql = new ODServerMysql();
var odsLevelDb = new ODServerLevelDb(LEVELDB_PATH);

mws.use('/help', function (req, res, next) {
  res.write('/help matched!!');
  res.end();
  log('Matched /help - got request: ', req.url);
});

mws.use(OdParser.handleRequest);

var handleError = function (req, res, next, err) {
  res.writeHead(406, {
    "Content-Type": "application/json"
  });
  res.write(JSON.stringify({
    err: err
  }));
  error(err);
  next();
};

mws.use(function (req, res, next) {

  var contentLength = parseInt(req.headers['content-length']);
  contentLength = (!isNaN(contentLength)) ? contentLength : 0;
  log('processing request: ', req.url, ' content length: ' + contentLength);

  if (!req.ast) handleError(req, res, next, 'Unknown operation: ' + req.url);

  debug(req.ast);

  next();
});

mws.use(odsMysql.handleRequest());

var acl = new OdAcl('perms', {
  host: 'localhost'
}, handleError);
mws.use(acl.handleRequest());
mws.use(odsLevelDb.handleRequest());

mws.listen(3000);

process.on('SIGINT', function () {
  log("Caught interrupt signal");
  mws.close();
  setTimeout(process.exit, 1000);
});

process.on('exit', function (code) {
  log('About to exit with code:', code);
});

log('server running on port 3000');
