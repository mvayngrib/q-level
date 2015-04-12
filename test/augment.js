
var Q = require('q')
var test = require('tape')
var rimraf = require('rimraf')
var level = require('level')
var sublevel = require('level-sublevel')
var queryEngine = require('level-queryengine')
var jsonQueryEngine = require('jsonquery-engine')
var promisify = require('../')
var dbPath = 'test.db'
var db
var SAMPLE_DATA = {
  a: {
    happy: 1
  },
  b: {
    happy: 2
  },
  c: {
    happy: 3
  }
}

test('open', function(t) {
  t.timeoutAfter(5000)
  db = queryEngine(level(dbPath, { valueEncoding: 'json' }))
  db.query.use(jsonQueryEngine())
  promisify(db)
  promisify(db, 'query', { type: 'readable' })

  Q.all(Object.keys(SAMPLE_DATA).map(function(key) {
    return db.put(key, SAMPLE_DATA[key])
  }))
  .done(function() {
    t.end()
  })
})

test('query', function(t) {
  var results = []
  db.query({ happy: { $in: [1, 2] }})
    .progress(function(val) {
      results.push(val)
      t.ok(val.happy === 1 || val.happy === 2)
    })
    .then(function() {
      t.equal(results.length, 2)
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
