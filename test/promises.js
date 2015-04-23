
var Q = require('q')
var test = require('tape')
var rimraf = require('rimraf')
var level = require('level')
var sublevel = require('level-sublevel')
var promisifier = require('../')
var db
var SAMPLE_DATA = {
  a: 1,
  b: 2,
  c: 3
}


module.exports = function(Promise) {
  var hasNotify = require('./hasNotify')(Promise)
  var dbPath = (Math.random() * 1000000 | 0) + 'test.db'
  var promisify = promisifier(Promise)
  test('open', function(t) {
    t.timeoutAfter(5000)
    db = promisify(level(dbPath, { valueEncoding: 'json' }))
    db.open(t.end)
  })

  test('put, get, del', function(t) {
    t.timeoutAfter(5000)

    db.put('a', 1)
      .then(function() {
        return db.get('a')
      })
      .then(function(val) {
        t.equal(val, 1)
        return db.del('a')
      })
      .then(function() {
        return db.get('a')
      })
      .catch(function(err) {
        t.equal(err.name, 'NotFoundError')
      })
      .then(t.end)
  })

  test('createReadStream', function(t) {
    hasNotify
    .then(function() {
      t.timeoutAfter(5000)
      var received = {}
      putSample()
        .then(function() {
          return db.createReadStream()
        })
        .progress(function(data) {
          received[data.key] = data.value
        })
        .then(function() {
          t.deepEqual(received, SAMPLE_DATA)
        })
        .then(t.end)
    })
    .catch(function(err) {
      t.end()
    })
  })

  test('createKeyStream', function(t) {
    hasNotify
    .then(function() {
      t.timeoutAfter(5000)
      var received = []
      putSample()
        .then(function() {
          return db.createKeyStream()
        })
        .progress(function(key) {
          received.push(key)
        })
        .then(function() {
          for (var key in SAMPLE_DATA) {
            t.notEqual(received.indexOf(key), -1)
          }
        })
        .then(t.end)
    })
    .catch(function(err) {
      t.end()
    })
  })

  test('createValueStream', function(t) {
    hasNotify
    .then(function() {
      t.timeoutAfter(5000)
      var received = []
      putSample()
        .then(function() {
          return db.createValueStream()
        })
        .progress(function(val) {
          received.push(val)
        })
        .then(function() {
          for (var key in SAMPLE_DATA) {
            t.notEqual(received.indexOf(SAMPLE_DATA[key]), -1)
          }
        })
        .then(t.end)
    })
    .catch(function(err) {
      t.end()
    })
  })

  test('batch', function(t) {
    t.timeoutAfter(5000)

    var batch = Object.keys(SAMPLE_DATA).map(function(key) {
      return { type: 'del', key: key }
    })

    db.batch(batch)
      .then(function() {
        var checks = Object.keys(SAMPLE_DATA).map(function(key) {
          return db.get(key)
            .then(function() {
              return 'resolved'
            })
            .catch(function() {
              return 'rejected'
            })
        })

        return Promise.all(checks)
      })
      .then(function(results) {
        results.forEach(function(r) {
          t.equal(r, 'rejected')
        })
      })
      .then(t.end)
  })

  test('close', function(t) {
    t.timeoutAfter(5000)
    db.close().then(t.end)
  })

  test('cleanup', function(t) {
    rimraf(dbPath, t.end)
  })


  function putSample() {
    return Promise.all(Object.keys(SAMPLE_DATA).map(function(key) {
      db.put(key, SAMPLE_DATA[key])
    }))
  }
}
