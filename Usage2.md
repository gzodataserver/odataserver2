Example of a curl session
========================

Preparation
-----------

>SERVER=http://localhost:3000
>EMAIL=john@example.com

HELP: curl $SERVER/help

NOTE: Just run echo if you need to debug a command


Accounts
--------

>curl -d '{"email":"'$EMAIL'"}' $SERVER/create_account
>ACCOUNTID=...

>curl -d '{"accountId":"'$ACCOUNTID'","email":"'$EMAIL'"}' $SERVER/$ACCOUNTID/s/reset_password
>PASSWORD=...

>curl -X POST -H "user: $ACCOUNTID" -H "password: $PASSWORD" -d '{"accountId":"'$ACCOUNTID'","email":"'$EMAIL'"}' $SERVER/$ACCOUNTID/s/delete_account


create a bucket
---------------

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" -d '{"name":"b_rootapp","accountId":"'$ACCOUNTID'","verbs":["select","insert","update","delete"]}' $SERVER/$ACCOUNTID/s/grant_bucket

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" -d 'Just some data to store' $SERVER/$ACCOUNTID/b_rootapp

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" $SERVER/$ACCOUNTID/b_rootapp

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" -d 'log("DYNAMICALLY CREATED SCRIPT!!")' $SERVER/$ACCOUNTID/b_rootapp


create new table
---------------

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" -d '{"tableDef":{"tableName":"mytable","columns":["col1 int","col2 varchar(255)"]}}' $SERVER/$ACCOUNTID/s/create_table

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" -d '{"col1":11,"col2":"11"}' $SERVER/$ACCOUNTID/mytable

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD"  $SERVER/$ACCOUNTID/mytable


get service def.
----------------

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" $SERVER/$ACCOUNTID

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" $SERVER/0b213a639078/mytable/\$metadata


stored procedures
----------------

Create this stored procedure in the datebase (connect from the command line or using phpmyadmin etc.);

    DELIMITER $$
    CREATE DEFINER=`jonas`@`%` PROCEDURE `spTest`(IN p1 VARCHAR(250), IN p2 INT)
    BEGIN
      select p1, p2;
    END$$
    DELIMITER;

Now run the stored procedure like this:

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD"  $SERVER/$ACCOUNTID/s/exec -d '{"procedure":"spTest", "params": ["1",2]}'
