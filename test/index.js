var Q = require('q')
var bluebird = require('bluebird')
;[Q.Promise, bluebird, global.Promise].forEach(function(Promise) {
  require('./promises')(Promise)
  require('./callbacks')(Promise)
  require('./augment')(Promise)
})
