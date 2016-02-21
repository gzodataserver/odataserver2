Example of a curl session
========================

Preparation
-----------

>SERVER=http://localhost:3000
>EMAIL=jonas@gizur.com

HELP: curl $SERVER/help

NOTE: Just run echo if you need to debug a command


Create an  account
-------------------

>curl -d '{"email":"'$EMAIL'"}' $SERVER/create_account)
>ACCOUNTID=...


>curl -d '{"accountId":"'$ACCOUNTID'","email":"'$EMAIL'"}' $SERVER/0b213a639078/s/reset_password
PASSWORD=...


create a bucket 
---------------

>curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" -d '{"bucketName":"b_rootapp"}' $SERVER/$ACCOUNTID/s/create_bucket

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

curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" $SERVER/$ACCOUNTID

curl -H "user: $ACCOUNTID" -H "password: $PASSWORD" $SERVER/0b213a639078/mytable/\$metadata

