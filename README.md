odataserver2
============

[Odataserver](https://github.com/gizur/odataserver) rewritten from scratch. Now modularized
and built using [streams](https://nodejs.org/api/stream.html).

Pre-requisites
-------------

NodeJS and a MySQL (or MariaDB) needs to be installed.


Getting started
--------------

First install the with `npm install`

Make sure that MySQL is running, create `setenv` by copying `setenv.template` and update with
the database credentials. On Windows, create `setenv.bat` using `setenv.template.bat`.

Start the server: `source setenv; node odataserver2`. On Windows run `setenv.bat` followed by `node odataserver2`.

Run the tests to see that everything works: `node test_mysql.js`


Process management
-----------------

There are man different process management tools. I'm using [supervisor](http://supervisord.org).
A NodeJS based alternative is forever.


Here is an example of a supervisor configuration (update the this according to your setup).

```
[program:odataserver2]
directory=/apps
environment =
  DB_HOST="mariadb",
  ADMIN_USER="root",
  ADMIN_PASSWORD="secret",
  MAIL_USER="noreply@gizur.com",
  MAIL_PASSWORD="secret"
command=node /apps/node_modules/odataserver2/odataserver2.js
stdout_logfile=syslog
stderr_logfile=syslog
autorestart=true
```

Basic HTTP authentication
-------------------------

It is now possible to authenticate users with basic HTTP authentication
and build a custom authentication model. See [connectbasicauth](https://github.com/gizur/connectbasicauth)
for details on how this is done.

ToDo
---

Rewrite the `tosql` function into a stream. This will make it possible to pass statement by statement
to MySQL instead of just returning a string with many statements separated with semicolon. This will
make it possible to always send a header in an operation, also before any errors might occur.


Troubleshooting
--------------

Solutions to some problems:

 * Q: `[Error: `value` required in setHeader("password", value).]`
 * A: Make sure that setenv is correct and used: `source setenv`

 * Q: I get an assert error in the mysql unit test: `ERROR { [AssertionError: POST delete_table]`
 * A: The reason is that the `warningCount` is 1 instead of 0 on some installations. Any problems
      due to this has not been observed.
