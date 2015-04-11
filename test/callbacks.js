
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

  db.put('a', 1, function(err) {
    if (err) throw err

    db.get('a', function(err, val) {
      if (err) throw err

      t.equal(val, 1)
      db.del('a', function(err) {
        if (err) throw err

        db.get('a', function(err, val) {
          t.equal(err && err.name, 'NotFoundError')
          t.end()
        })
      })
    })
  })
})

test('createReadStream', function(t) {
  t.timeoutAfter(5000)
  var received = {}
  putSample(function() {
    db.createReadStream()
      .on('data', function(data) {
        received[data.key] = data.value
      })
      .on('error', function(err) {
        throw err
      })
      .on('close', function(err) {
        t.deepEqual(received, SAMPLE_DATA)
        t.end()
      })
  })
})

test('createKeyStream', function(t) {
  t.timeoutAfter(5000)
  var received = []
  putSample(function() {
    db.createKeyStream()
      .on('data', function(key) {
        received.push(key)
      })
      .on('error', function(err) {
        throw err
      })
      .on('close', function(err) {
        for (var key in SAMPLE_DATA) {
          t.notEqual(received.indexOf(key), -1)
        }

        t.end()
      })
  })
})

test('createValueStream', function(t) {
  t.timeoutAfter(5000)
  var received = []
  putSample(function() {
    db.createValueStream()
      .on('data', function(val) {
        received.push(val)
      })
      .on('error', function(err) {
        throw err
      })
      .on('close', function(err) {
        for (var key in SAMPLE_DATA) {
          t.notEqual(received.indexOf(SAMPLE_DATA[key]), -1)
        }

        t.end()
      })
  })
})

test('batch', function(t) {
  t.plan(3)
  t.timeoutAfter(5000)

  var keys = Object.keys(SAMPLE_DATA)
  var batch = keys.map(function(key) {
    return { type: 'del', key: key }
  })

  db.batch(batch, function(err) {
    if (err) throw err

    keys.forEach(function(key) {
      db.get(key, function(err) {
        t.equal(err && err.name, 'NotFoundError')
      })
    })
  })
})

test('close', function(t) {
  t.timeoutAfter(5000)
  db.close(t.end)
})

test('cleanup', function(t) {
  rimraf(dbPath, t.end)
})


function putSample(cb) {
  var keys = Object.keys(SAMPLE_DATA)
  var finish = finisher(keys.length, cb)
  keys.forEach(function(key) {
    db.put(key, SAMPLE_DATA[key], finish)
  })
}

function finisher(times, cb) {
  var err
  return function(e) {
    err = err || e
    if (--times === 0) cb(err)
  }
}
