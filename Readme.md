
# q-level

_originally a fork of [nathan7/level-promise](https://github.com/nathan7/level-promise)_

  Promised LevelUp, using Q

## Installation

    $ npm install q-level

## Warning

  At the application level, promises vs callbacks is yours to choose.
  If you use this in a *LevelUp extension* that isn't explicitly about promises, [nathan7](https://github.com/nathan7) will find you and destroy you.
  Play nice with the rest, use callbacks for your extension.
  If your extension works with level-manifest, it'll work with this.

## Usage

  `LevelPromise(db)` (or `LevelPromise.install(db)`, if that suits your tastes) and you're off!
  Every method marked as async by level-manifest will now return a promise when you don't pass it a callback.
  It recurses into sublevels.

  See tests for examples...

## License

  MIT
