odataserver2
============

[Odataserver](https://github.com/gizur/odataserver) rewritten from scratch. Now modularized
and built using [streams](https://nodejs.org/api/stream.html).


ToDo
====

Rewrite the tosql function into a stream. This will make it possible to pass statement by statement 
to MySQL instead of just returning a string with many statements separated with semicolon. This will 
make it possible to always send a header in an operation, also before any errors might occur.

Troubleshooting
==============

Solutions to some problems:

 * Q: `[Error: `value` required in setHeader("password", value).]`
 * A: Make sure that setenv is correct and used: `source setenv`
