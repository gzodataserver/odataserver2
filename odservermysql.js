// Imports
// =======


var Update = require('odparser').json2sql.Update;
var Insert = require('odparser').json2sql.Insert;

var tosql = require('od2mysql');
var MysqlStream = require('mysqlstream');

var CheckHashStream = require('checkhashstream');

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

var OD = function () {}

OD.prototype.handleRequest = function () {
  return function (req, res, next) {

    var handleError = function (err) {
      res.writeHead(406, {
        "Content-Type": "application/json"
      });
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
    var ast = req.ast;


    var options = {
      host: process.env.DB_HOST
    };

    if (ast.adminOp) {
      options.user = process.env.ADMIN_USER;
      options.password = process.env.ADMIN_PASSWORD;
    } else {
      options.user = ast.user;
      options.password = ast.password;
      options.database = ast.user;
    }

    // setup mysqlstream
    if (ast.etagCols) ast.etagCols.push('queryType');
    var etagOptions = (ast.etagCols) ? {
      etagAlg: 'md5',
      etagDigest: 'hex',
      etagCols: ast.etagCols
    } : null;
    var mysql = new MysqlStream(etagOptions, options);
    debug('mysql options', options, 'etag options', etagOptions);

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

          if (buffer.length !== contentLength) info('WARNING: data received less that indicated content length');

          // Answer with 304 if the etag matches
          if (req.headers['if-none-match']) {
            var ws = new CheckHashStream({
              hashAlg: 'md5',
              hashDigest: 'hex'
            }, req.headers['if-none-match']);

            mysql.pipe(ws
              /*, {
                            end: false
                          }*/
            );

            mysql.write(sql);
            mysql.end();

            if (!ws.get()) {
              debug('NOT MODIFIED')
              res.writeHead(304);
              res.end();
              return;
            }

            res.end(ws.get());
          }

          // Do not check against etag
          else {
            mysql.pipe(debugStream);

            mysql.pipe(res);
            mysql.write(sql);
            mysql.end();

          }

        } catch (err) {
          var result = {
            error: 'ERROR parsing input, likely malformed/missing JSON: ' + err
          };
          res.write(JSON.stringify(result));
          res.end();
        }
      });
    } else {
      if (next) next();
    }

    req.on('close', function () {
      log('close in request')
    });
    res.on('finish', function () {
      log('finish in response')
    });

  }
};

// exports
// =======

module.exports = OD;
