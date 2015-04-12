
# q-level

_originally a fork of [nathan7/level-promise](https://github.com/nathan7/level-promise)_

  Promisified level API with Q

## Installation

    $ npm install q-level

## Warning

  At the application level, promises vs callbacks is yours to choose.
  If you use this in a *LevelUp extension* that isn't explicitly about promises, [nathan7](https://github.com/nathan7) will find you and destroy you.
  Play nice with the rest, use callbacks for your extension.
  If your extension works with level-manifest, it'll work with this.

## What it does

  Every method marked as async by level-manifest will now return a promise when you don't pass it a callback. The methods that return readable streams will return streams augmented with Q's promise interface.

  It recurses into sublevels.

## Usage

### Promises

```js
var level = require('level')
var promisify = require('q-level')
var db = promisify(level('my.db'), { valueEncoding: 'json' })
var contents = {}

db.put('a', 1)
  .then(function() {
    return db.batch([
      { type: 'put', key: 'b', value: 2 },
      { type: 'put', key: 'c', value: 3 }
    ])
  })
  .then(function() {
    return db.createReadStream()
  })
  .progress(function(data) {
    contents[data.key] = data.value
  })
  .catch(function(err) {
    console.log('Error reading stream', err)
  })
  .then(function() {
    console.log('Contents:', contents)
    return db.close()
  })
  .done(function() {
    console.log('Closed')
  })

```

### Callbacks

_same example as above, but with callbacks_

```js
var level = require('level')
var promisify = require('q-level')
var db = promisify(level('my.db'), { valueEncoding: 'json' })
var contents = {}

db.put('a', 1, function(err) {
  db.batch([
    { type: 'put', key: 'b', value: 2 },
    { type: 'put', key: 'c', value: 3 }
  ], function(err) {
    return db.createReadStream()
      .on('data', function(data) {
        contents[data.key] = data.value
      })
      .on('error', function(err) {
        console.log('Error reading stream', err)
      })
      .on('close', function(err) {
        console.log('Contents:', contents)
        db.close(function(err) {
          console.log('Closed')
        })
      })
  })
})
```

### Query engine support

```js
var level = require('level')
var levelQuery = require('level-queryengine')
var jsonQueryEngine = require('jsonquery-engine')
var promisify = require('q-level')

db = levelQuery(level('my.db', { valueEncoding: 'json' }))
db.query.use(jsonQueryEngine())
// IMPORTANT TO PROMISIFY LAST!
promisify(db)
promisify(db, 'query', { type: 'readable' })

db.query({ happy: { $in: ['very', 'not so much'] }})
  .progress(function(val) {
    // do stuff
  })
  .done(function() {
    // do other stuff
  })
```

## License

  MIT
