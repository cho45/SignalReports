SignalReports
=============

SignalReports is a ham radio logger application developed as web application.

SignalReports:

 1. Works any platform if modern browser works
 2. Short and sweet interface

Instalation
===========

SignalReports is local install application.

```
$ sudo gem install bundle
$ git clone https://github.com/cho45/SignalReports
$ ./signalreports
```

Access http://localhost:9876/ to use this application.


Import
======

todo

Export
======

todo


Development
===========

## Development Server

Use foreman directly:

```
PORT=5000 foreman start
```

## Migration

By default, migrations are run automatically.
But if you want to migrate explicitly, run as following:

```
bundle exec sequel -E -m migrations/ -M $version sqlite://debug.db
```
