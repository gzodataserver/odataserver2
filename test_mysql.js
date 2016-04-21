var assert = require('assert');
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

var assertJSON = function (jsonArray, res, expected, message) {
  jsonArray.clear();
  jsonArray.write(res);
  try {
    assert.deepEqual(jsonArray.get(), expected, message);
  } catch (err) {
    error(err);
  }
}

log('A web server should be running on localhost:3000');
log('\n!!No assertion errors means everything is ok!"\n')

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

    var path = '/' + ACCOUNTID + SYS_PATH + '/create_table';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      tableDef: {
        tableName: 'mytable',
        columns: ['col1 int', 'col2 varchar(255)']
      }
    });
  })
  .then(function (res) {
    assertJSON(p, res, [{
        queryType: 'create_table'
      },
      {
        fieldCount: 0,
        affectedRows: 0,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '',
        protocol41: true,
        changedRows: 0
      }], 'create_table');

    // INSERT INTO
    var path = '/' + ACCOUNTID + '/mytable';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      col1: 22,
      col2: '22'
    });
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "fieldCount": 0,
      "affectedRows": 1,
      "insertId": 0,
      "serverStatus": 2,
      "warningCount": 0,
      "message": "",
      "protocol41": true,
      "changedRows": 0
    }], 'POST mytable')


    // SELECT
    var path = '/' + ACCOUNTID + '/mytable';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "select"
    }, {
      "col1": 22,
      "col2": "22"
    }], 'GET mytable')

    // UPDATE
    var path = '/' + ACCOUNTID + '/mytable';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'PUT'), {
      col2: '33'
    });
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "fieldCount": 0,
      "affectedRows": 1,
      "insertId": 0,
      "serverStatus": 34,
      "warningCount": 0,
      "message": "(Rows matched: 1  Changed: 1  Warnings: 0",
      "protocol41": true,
      "changedRows": 1
    }], 'PUT mytable');

    // GRANT
    var path = '/' + ACCOUNTID + SYS_PATH + '/grant';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "grant"
    }, {
      "fieldCount": 0,
      "affectedRows": 0,
      "insertId": 0,
      "serverStatus": 2,
      "warningCount": 0,
      "message": "",
      "protocol41": true,
      "changedRows": 0
    }], 'grant');

    // REVOKE
    var path = '/' + ACCOUNTID + SYS_PATH + '/revoke';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      tableName: 'mytable',
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "revoke"
    }, {
      "fieldCount": 0,
      "affectedRows": 0,
      "insertId": 0,
      "serverStatus": 2,
      "warningCount": 0,
      "message": "",
      "protocol41": true,
      "changedRows": 0
    }], 'revoke');

    // METADATA
    var path = '/' + ACCOUNTID + '/mytable/$metadata';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "metadata"
    }, {
      "column_name": "col1",
      "data_type": "int",
      "is_nullable": "YES",
      "numeric_precision": 10,
      "numeric_scale": 0
    }, {
      "column_name": "col2",
      "data_type": "varchar",
      "is_nullable": "YES",
      "numeric_precision": null,
      "numeric_scale": null
    }], 'metdata');

    // INCORRECT BUCKET ADMIN OP
    var path = '/' + ACCOUNTID + SYS_PATH + '/create_bucket2';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .catch(function (res) {
    assert(res, 'problem with request: Parse Error', 'incorrect bucket admin op');

    // FILTER & ORDER BY
    var params = querystring.stringify({
      $select: 'col1, col2',
      $filter: 'col1 eq "help"',
      $orderby: 'col2',
      $skip: '10'
    });

    var path = '/' + ACCOUNTID + '/mytable?' + params;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "select"
    }], 'GET mytable with filter');

    // FILTER, COLS, ORDER BY
    var params = querystring.stringify({
      $select: 'col1,col2',
      $filter: 'col1 add 5 gt 10',
      $orderby: 'col2'
    });
    var path = '/' + ACCOUNTID + '/mytable?' + params;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "select"
    }, {
      "col1": 22,
      "col2": "33"
    }], 'GET mytable with filter');

    // FILTER, COLS, ORDER BY
    var params = querystring.stringify({
      $select: 'col1,@odata.etag',
      $filter: 'col1 add 5 gt 10',
      $orderby: 'col2'
    });
    var path = '/' + ACCOUNTID + '/mytable?' + params;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
      assertJSON(p, res, [{
          '@odata.etag': '99938282f04071859941e18f16efcf42',
          queryType: 'select'
        },
        {
          '@odata.etag': 'e0f7a4d0ef9b84b83b693bbf3feb8e6e',
          col1: 22
        }], 'GET mytable etag with filter');

    // ORDER BY
    var params = querystring.stringify({
      $orderby: 'col2'
    });
    var path = '/' + ACCOUNTID + '/mytable?' + params;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
.then(function (res) {
    assertJSON(p, res, [{
      "queryType": "select"
    }, {
      "col1": 22,
      "col2": "33"
    }], 'GET mytable with filter');

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
    assertJSON(p, res, [{
      "queryType": "delete"
    }, {
      "fieldCount": 0,
      "affectedRows": 1,
      "insertId": 0,
      "serverStatus": 34,
      "warningCount": 0,
      "message": "",
      "protocol41": true,
      "changedRows": 0
    }], 'DELTE mytable');

    // DROP TABLE
    var path = '/' + ACCOUNTID + SYS_PATH + '/delete_table';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      "tableName": "mytable"
    });
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "delete_table"
    }, {
      "fieldCount": 0,
      "affectedRows": 0,
      "insertId": 0,
      "serverStatus": 2,
      "warningCount": 0,
      "message": "",
      "protocol41": true,
      "changedRows": 0
    }], 'POST delete_table');

    // SERVICE DEF
    var path = '/' + ACCOUNTID;
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    assertJSON(p, res, [{
      "queryType": "service_def"
    }], 'GET / (service def)');

    // DELETE ACCOUNT
    var path = '/' + ACCOUNTID + SYS_PATH + '/delete_account';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      email: EMAIL
    });
  })
  .done(log, log);
