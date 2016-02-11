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

    // get the account id also if the account already exists
    if (p.get()[0].accountId) ACCOUNTID = p.get()[0].accountId;
    else if (p.get()[1].accountId) ACCOUNTID = p.get()[1].accountId;
    else throw "Did not get any account id!!";

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

    // SERVICE DEF
    var path = '/' + ACCOUNTID;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // DELETE ACCOUNT
    var path = '/' + ACCOUNTID + SYS_PATH + '/delete_account';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      email: EMAIL
    });
  })
  .done(log, log);
