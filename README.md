pixelstore
==========

pixelstore is a distributed image store with a RESTful interface.

service pre-requisites
-----------------------

before you set up `pixelstore` as a service, you will need to have an
instance of cassandra running.  check out `config.json`.

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
