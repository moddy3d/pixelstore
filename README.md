pixelstore
==========

pixelstore is a distributed image store.

service pre-requisites
-----------------------

before you set up `pixelstore` as a service, you will need to have an
instances of cassandra and elasticsearch running.  check out `config.json`.

running tests
-------------

until i find a better way...

```bash
cd test
node test <testmodule1> <testmodule2> ...
```

about
-----

this project was a personal exercise to learn express, and the node.js clients for cassandra & elasticsearch.
