var querystring = require("querystring");
var remote = require('gzhelpers').remote;
var jsonParseArray = require('jsonparsearray');

// Setup logging
// =============

var log = console.log.bind(console);
var debug = console.log.bind(console, 'DEBUG');
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

// Tests
// =====

var EMAIL = 'joe@example.com';
var ACCOUNTID = 'accountid';
var PASSWORD = 'password';
var EMAIL2 = 'joe@example.com';
var ACCOUNTID2 = 'accountid';
var PASSWORD2 = 'password2';
var SYS_PATH = '/s';

// Tests
// =====

var createOptions = function (accountId, password, path, method) {
  return {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: {
      user: accountId,
      password: password
    }
  }
};

// json parser
var p = new jsonParseArray();

log('A web server should be running on localhost:3000');

remote.request(createOptions(ACCOUNTID, PASSWORD, '/create_account', 'POST'), {
    email: EMAIL
  })
  .then(function (res) {
    log(res);

    p.write(res);
    ACCOUNTID = p.get()[0].accountId;

    var path = '/' + ACCOUNTID + SYS_PATH + '/reset_password';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      accountId: ACCOUNTID,
      email: EMAIL
    })
  })
  .then(function (res) {
    log(res);

    p.clear();
    p.write(res);
    PASSWORD = p.get()[0].password;

    var path = '/' + ACCOUNTID + SYS_PATH + '/create_table';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      tableDef: {
        tableName: 'mytable',
        columns: ['col1 int', 'col2 varchar(255)']
      }
    });
  })
  .then(function (res) {
    log(res);

    // INSERT INTO
    var path = '/' + ACCOUNTID + '/mytable';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      col1: 22,
      col2: '22'
    });
  })
  .then(function (res) {
    log(res);

    // SELECT
    var path = '/' + ACCOUNTID + '/mytable';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // UPDATE
    var path = '/' + ACCOUNTID + '/mytable';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'PUT'), {
      col2: '33'
    });
  })
  .then(function (res) {
    log(res);

    // GRANT
    var path = '/' + ACCOUNTID + SYS_PATH + '/grant';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    log(res);

    // REVOKE
    var path = '/' + ACCOUNTID + SYS_PATH + '/revoke';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    log(res);

    // DELETE
    var filter = querystring.stringify({
      $filter: 'col1 eq 22'
    });
    var path = '/' + ACCOUNTID + '/mytable?' + filter;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'DELETE'), {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    log(res);

    // METADATA
    var path = '/' + ACCOUNTID + '/mytable/$metadata';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // INCORRECT BUCKET ADMIN OP
    var path = '/' + ACCOUNTID + SYS_PATH + '/create_bucket2';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    log(res);

    // CREATE BUCKET
    var path = '/' + ACCOUNTID + SYS_PATH + '/create_bucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    log(res);

    // WRITE TO BUCKET
    var path = '/' + ACCOUNTID + '/b_mybucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), 'Some data to write to the bucket...');
  })
  .then(function (res) {
    log(res);

    // SELECT FROM BUCKET
    var path = '/' + ACCOUNTID + '/b_mybucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // DROP BUCKET
    var path = '/' + ACCOUNTID + SYS_PATH + '/drop_bucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    log(res);

    // DELETE ACCOUNT
    var path = '/' + ACCOUNTID + SYS_PATH + '/delete_account';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      email: EMAIL
    });
  })
  .then(function (res) {
    log(res);

    // FILTER & ORDER BY
    var params = querystring.stringify({
      $select: 'col1,col2',
      $filter: 'co1 eq "help"',
      $orderby: 'col2',
      $skip: '10'
    });

    var path = '/schema/table?' + params;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // FILTER, COLS, ORDER BY
    var params = querystring.stringify({
      $select: 'col1,col2',
      $filter: 'Price add 5 gt 10',
      $orderby: 'col2'
    });
    var path = '/schema/table?' + params;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // ORDER BY
    var params = querystring.stringify({
      $orderby: 'col2'
    });
    var path = '/schema/table?' + params;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // DROP TABLE
    var path = '/' + ACCOUNTID + SYS_PATH + '/delete_table';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      "tableName": "mytable"
    });
  })
  .then(function (res) {
    log(res);

    // SERVICE DEF
    var path = '/' + ACCOUNTID;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .done(log, log);
