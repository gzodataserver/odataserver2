odataserver2
============

[Odataserver](https://github.com/gizur/odataserver) rewritten from scratch. Now modularized
and built using [streams](https://nodejs.org/api/stream.html).

Pre-requisites
-------------

NodeJS and a MySQL (or MariaDB) needs to be installed.

NOTE: I'm using MariaDb 10.1.13. I've seen problems with older mysql versions. There seams
to have occured changes in how the password is set in newer versions of MariaDB/MySQL.


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
  CONNECT_FROM_HOST="%"
  DB_HOST="mariadb",
  ADMIN_USER="root",
  ADMIN_PASSWORD="67746de89723d844a031e88d8cba5164",
  MAIL_USER="noreply@gizur.com",
  MAIL_PASSWORD="MX2rFOPvwv1VEGAWSZ20kni2A/cNZ3V33gboTLu9cAg="
command=node /apps/node_modules/odataserver2/odataserver2.js
stdout_logfile=syslog
stderr_logfile=syslog
autorestart=true```


ToDo
---

Rewrite the tosql function into a stream. This will make it possible to pass statement by statement 
to MySQL instead of just returning a string with many statements separated with semicolon. This will 
make it possible to always send a header in an operation, also before any errors might occur.


Troubleshooting
--------------

Solutions to some problems:

 * Q: `[Error: `value` required in setHeader("password", value).]`
 * A: Make sure that setenv is correct and used: `source setenv`
