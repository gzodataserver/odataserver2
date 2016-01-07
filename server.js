// Imports
// =======

var http = require('http');
var OdParser = require('odparser').OdParser;

var Update = require('odparser').json2sql.Update;
var Insert = require('odparser').json2sql.Insert;

var tosql = require('od2mysql');
var MysqlStream = require('mysqlstream');

// Setup logging
// =============

var log = console.log.bind(console);
var info = console.info.bind(console);
var error = console.error.bind(console, 'ERROR');

var DEV_MODE = true;
var debug, debugStream;
if (DEV_MODE) {
  debug = console.log.bind(console, 'DEBUG');
  debugStream = process.stdout;
} else {
  debugStream = new require('stream').Writable();
  ws.write = function(d){};
}


// HTTP server
// ==========


var server = http.Server();

server.on('request', function (req, res) {

  var handleError = function (err) {
    res.write(err);
    error(err);
  };

  var parseJSON = function (j) {
    try {
      return JSON.parse(j);
    } catch (err) {
      handleError('Error parsing json: ' + err);
    }
  };

  var contentLength = parseInt(req.headers['content-length']);
  var ast = new OdParser().parseReq(req);

  log('processing request: ', req.url, ' content length: ' + contentLength);
  debug(ast);
  
  if (ast.bucketOp) {
    res.write('ERROR bucket operations not implemented yet!');
    res.end();
    return;
  }

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

  if (ast.queryType === 'insert') {
    var ins = new Insert(null, ast.schema, ast.table);
    ins.on('error', handleError);
    req.pipe(ins).pipe(mysql).pipe(res);
    mysql.pipe(debugStream);
  } else if (ast.queryType === 'update') {
    var upd = Update(null, ast.schema, ast.table);
    upd.on('error', handleError);
    req.pipe(upd).pipe(mysql).pipe(res);
    mysql.pipe(debugStream);
  } else {
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
  }

  req.on('close', function () {
    log('close in request')
  });
  res.on('finish', function () {
    log('finish in response')
  });

});


// Plumming below ...
// ===================

server.on('clientError', function (exception, socket) {
  log('clientError occured ', exception);
});

server.on('close', function () {
  log('Closing http server');
});

process.on('SIGINT', function () {
  log("Caught interrupt signal");
  server.close();
  setTimeout(process.exit, 1000);
});

process.on('exit', function (code) {
  log('About to exit with code:', code);
});

var port = 3000;
server.listen(port);
log('listening on port', port);
