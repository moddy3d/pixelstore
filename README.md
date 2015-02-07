pixelstore
==========

pixelstore is a distributed image store with a RESTful interface.

service pre-requisites
-----------------------

before you set up `pixelstore` as a service, you will need to have an
instance of cassandra running.  check out `config.json`.

package dependencies
--------------------

```
async: ^0.9.0,
body-parser: ~1.10.2,
cassandra-client: ^0.15.2,
cassandra-driver: ^1.0.3,
cookie-parser: ~1.3.3,
debug: ~2.1.1,
express: ~4.11.1,
install: ^0.1.8,
jade: ~1.9.1,
lodash: ^2.4.1,
morgan: ~1.5.1,
node-uuid: ^1.4.2,
nodeunit: ^0.9.0,
npm: ^2.2.0,
request: ^2.51.0,
serve-favicon: ~2.2.0
```

installing
----------

```bash
git clone https://github.com/moddy3d/pixelstore.git
cd pixelstore
npm install
```

running tests
-------------

until i find a better way...

```bash
cd test
node test <testmodule1> <testmodule2> ...
```

about
-----

this project was a personal exercise to learn node, express, and clients such as that for cassandra.
