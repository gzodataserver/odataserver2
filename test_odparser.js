var querystring = require("querystring");
var remote = require('gzhelpers').remote;

// Setup logging
// =============

var log = console.log.bind(console);
var debug = console.log.bind(console, 'DEBUG');
var info = console.info.bind(console);
var error = console.error.bind(console);

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

var options = {
  hostname: 'localhost',
  port: 3000,
  headers: {
    user: ACCOUNTID,
    database: ACCOUNTID, // I DON'T THINK THIS IS USED??
    password: PASSWORD
  }
};

console.log('A web server should be running on localhost:3000');

options.path = '/create_account';
options.method = 'POST';
remote.request(options, {
    email: EMAIL
  })
  .then(function (res) {
    console.log(res);

    options.path = '/' + ACCOUNTID + SYS_PATH + '/reset_password';
    options.method = 'POST';
    return remote.request(options, {
      accountId: ACCOUNTID,
      email: EMAIL
    })
  })
  .then(function (res) {
    console.log(res);

    options.path = '/' + ACCOUNTID + SYS_PATH + '/create_table';
    options.method = 'POST';
    return remote.request(options, {
      tableDef: {
        tableName: 'mytable',
        columns: ['col1 int', 'col2 varchar(255)']
      }
    });
  })
  .then(function (res) {
    console.log(res);

    // INSERT INTO
    options.path = '/' + ACCOUNTID + '/mytable';
    options.method = 'POST';
    return remote.request(options, {
      col1: 22,
      col2: '22'
    });
  })
  .then(function (res) {
    console.log(res);

    // SELECT
    options.path = '/' + ACCOUNTID + '/mytable';
    options.method = 'GET';
    return remote.request(options, null);
  })
  .then(function (res) {
    console.log(res);

    // UPDATE
    options.path = '/' + ACCOUNTID + '/mytable';
    options.method = 'PUT';
    return remote.request(options, {
      col2: '33'
    });
  })
  .then(function (res) {
    console.log(res);

    // GRANT
    options.path = '/' + ACCOUNTID + SYS_PATH + '/grant';
    options.method = 'POST';
    return remote.request(options, {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    console.log(res);

    // REVOKE
    options.path = '/' + ACCOUNTID + SYS_PATH + '/revoke';
    options.method = 'POST';
    return remote.request(options, {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    console.log(res);

    // DELETE
    var filter = querystring.stringify({
      $filter: 'col1 eq 22'
    });
    options.path = '/' + ACCOUNTID + '/mytable?' + filter;
    options.method = 'DELETE';
    return remote.request(options, {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    console.log(res);

    // METADATA
    options.path = '/' + ACCOUNTID + '/mytable/$metadata';
    options.method = 'GET';
    return remote.request(options, null);
  })
  .then(function (res) {
    console.log(res);

    // INCORRECT BUCKET ADMIN OP
    options.path = '/' + ACCOUNTID + SYS_PATH + '/create_bucket2';
    options.method = 'POST';
    return remote.request(options, {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    console.log(res);

    // CREATE BUCKET
    options.path = '/' + ACCOUNTID + SYS_PATH + '/create_bucket';
    options.method = 'POST';
    return remote.request(options, {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    console.log(res);

    // WRITE TO BUCKET
    options.path = '/' + ACCOUNTID + '/b_mybucket';
    options.method = 'POST';
    return remote.request(options, 'Some data to write to the bucket...');
  })
  .then(function (res) {
    console.log(res);

    // SELECT FROM BUCKET
    options.path = '/' + ACCOUNTID + '/b_mybucket';
    options.method = 'GET';
    return remote.request(options, null);
  })
  .then(function (res) {
    console.log(res);

    // DROP BUCKET
    options.path = '/' + ACCOUNTID + SYS_PATH + '/drop_bucket';
    options.method = 'POST';
    return remote.request(options, {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    console.log(res);

    // DELETE ACCOUNT
    options.path = '/' + ACCOUNTID + SYS_PATH + '/delete_account';
    options.method = 'POST';
    return remote.request(options, {
      email: EMAIL
    });
  })
  .then(function (res) {
    console.log(res);

    // FILTER & ORDER BY
    var params = querystring.stringify({
      $select: 'col1,col2',
      $filter: 'co1 eq "help"',
      $orderby: 'col2',
      $skip: '10'
    });

    options.path = '/schema/table?' + params;
    options.method = 'GET';
    return remote.request(options, null);
  })
  .then(function (res) {
    console.log(res);

    // FILTER, COLS, ORDER BY
    var params = querystring.stringify({
      $select: 'col1,col2',
      $filter: 'Price add 5 gt 10',
      $orderby: 'col2'
    });
    options.path = '/schema/table?' + params;
    options.method = 'GET';
    return remote.request(options, null);
  })
  .then(function (res) {
    console.log(res);

    // ORDER BY
    var params = querystring.stringify({
      $orderby: 'col2'
    });
    options.path = '/schema/table?' + params;
    options.method = 'GET';
    return remote.request(options, null);
  })
  .then(function (res) {
    console.log(res);

    // DROP TABLE
    options.path = '/' + ACCOUNTID + SYS_PATH + '/delete_table';
    options.method = 'POST';
    return remote.request(options, {
      "tableName": "mytable"
    });
  })
  .then(function (res) {
    console.log(res);

    // SERVICE DEF
    options.path = '/' + ACCOUNTID ;
    options.method = 'GET';
    return remote.request(options, null);
  })
  .done(console.log.bind(console), console.log.bind(console));
