// imports
// ========

var ConnectLight = require('connectlight');
var OServerMysql = require('./odservermysql.js');
var OdParser = require('odparser').OdParser;

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
var odsMysql = new OServerMysql();

mws.use('/help', function (req, res, next) {
  res.write('/help matched!!');
  res.end();
  log('Matched /help - got request: ', req.url);
});

mws.use(function (req, res, next) {

  var handleError = function (err) {
    res.writeHead(406, {
      "Content-Type": "application/json"
    });
    res.write(err);
    error(err);
  };

  req.ast = new OdParser().parseReq(req);

  var contentLength = parseInt(req.headers['content-length']);
  contentLength = (!isNaN(contentLength)) ? contentLength : 0;
  log('processing request: ', req.url, ' content length: ' + contentLength);

  if (!req.ast) handleError('Unknown operation: ' + req.url);
  if (req.ast.bucketOp) handleError('Bucket operations not implemented yet!');

  debug(req.ast);

  next();
});

mws.use(function (req, res, next) {
  req.ast = new OdParser().parseReq(req);
  next();
});

mws.use(odsMysql.handleRequest);

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
