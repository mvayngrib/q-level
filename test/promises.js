
var Q = require('q')
var test = require('tape')
var rimraf = require('rimraf')
var level = require('level')
var sublevel = require('level-sublevel')
var promisify = require('../')
var dbPath = 'test.db'
var db
var SAMPLE_DATA = {
  a: 1,
  b: 2,
  c: 3
}

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
    .done(t.end)
})

test('createReadStream', function(t) {
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
    .done(t.end)
})

test('createKeyStream', function(t) {
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
    .done(t.end)
})

test('createValueStream', function(t) {
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
    .done(t.end)
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
      })

      return Q.allSettled(checks)
    })
    .then(function(results) {
      results.forEach(function(r) {
        t.equal(r.state, 'rejected')
      })
    })
    .done(t.end)
})

test('close', function(t) {
  t.timeoutAfter(5000)
  db.close().then(t.end)
})

test('cleanup', function(t) {
  rimraf(dbPath, t.end)
})


function putSample() {
  return Q.all(Object.keys(SAMPLE_DATA).map(function(key) {
    db.put(key, SAMPLE_DATA[key])
  }))
}
