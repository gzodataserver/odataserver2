// Imports
// =======

var OdParser = require('odparser').OdParser;

var Update = require('odparser').json2sql.Update;
var Insert = require('odparser').json2sql.Insert;

var tosql = require('od2mysql');
var MysqlStream = require('mysqlstream');


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
}

var OD = function() {}

OD.prototype.handleRequest = function (req, res, next) {

  var handleError = function (err) {

    if (res.writeHead) {
      res.writeHead(406, {
        "Content-Type": "application/json"
      });
    }

    res.write(err);
    error(err);
  };

  var parseJSON = function (j) {
    try {
      if (j && typeof j === 'string' && j.length) return JSON.parse(j);
      else return null;
    } catch (err) {
      handleError('Error parsing json: ' + err);
    }
  };

  var contentLength = parseInt(req.headers['content-length']);
  contentLength = (!isNaN(contentLength)) ? contentLength : 0;
  var ast = new OdParser().parseReq(req);

  log('processing request: ', req.url, ' content length: ' + contentLength);

  if (!ast) handleError('Unknown operation: ' + req.url);
  if (ast.bucketOp) handleError('Bucket operations not implemented yet!');

  debug(ast);

  var options = {
    host: 'localhost',
  };
  if (ast.adminOp) {
    options.user = process.env.ADMIN_USER;
    options.password = process.env.ADMIN_PASSWORD;
  } else {
    options.user = ast.user;
    options.password = ast.password;
    options.database = ast.user;
  }

  debug('mysql options', options);

  var mysql = new MysqlStream(null, options);
  mysql.on('error', handleError);

  if (ast.queryType === 'insert' && !ast.bucketOp) {
    var ins = new Insert(null, ast.schema, ast.table);
    ins.on('error', handleError);
    req.pipe(ins).pipe(mysql).pipe(res);

    //debug
    req.pipe(debugStream);
    ins.pipe(debugStream);
    mysql.pipe(debugStream);
  } else if (ast.queryType === 'update' && !ast.bucketOp) {
    var upd = new Update(null, ast.schema, ast.table);
    upd.on('error', handleError);
    req.pipe(upd).pipe(mysql).pipe(res);

    // debug
    req.pipe(debugStream);
    upd.pipe(debugStream);
    mysql.pipe(debugStream);
  } else if (!ast.bucketOp) {
    var buffer = '';
    req.on('data', function (chunk) {
      chunk = chunk.toString();
      buffer += chunk;
    });
    req.on('end', function () {
      try {
        var json = parseJSON(buffer);
        var sql = tosql(ast, json, DEV_MODE);

        debug(sql);
        debug(json);
        mysql.pipe(debugStream);

        mysql.pipe(res);
        mysql.write(sql);
        mysql.end();
        if (buffer.length !== contentLength) info('WARNING: data received less that indicated content length');
      } catch (err) {
        var result = {
          error: 'ERROR parsing input, likely malformed/missing JSON: ' + err
        };
        res.write(JSON.stringify(result));
        res.end();
      }
    });
  } else {
    res.end();
  }

  req.on('close', function () {
    log('close in request')
  });
  res.on('finish', function () {
    log('finish in response')
  });

  if (next) next();
};

// exports
// =======OdataServer

module.exports = OD;
