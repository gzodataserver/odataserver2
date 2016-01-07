# odataserver2


ToDo
====

Rewrite the tosql function into a stream. This will make it possible to pass statement by statement to MySQL instead of just returning a string with many statements separated with semicolon. This will make it possible to always send a header in an operation, also before any errors might occur.