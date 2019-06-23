# Metrics

[![Greenkeeper badge](https://badges.greenkeeper.io/clocklimited/cf-metrics.svg)](https://greenkeeper.io/)

Log site usage metrics to [statsd](https://github.com/etsy/statsd). Provides a Clock-specific wrapper around
[Lynx](https://github.com/dscape/lynx).

When logging metrics be sure to follow the naming conventions outlined in the
[Statsd Metric Naming Conventions](https://docs.google.com/a/clock.co.uk/document/d/1B2e1FFrGakbqctIYDUu2cEJkUQD2OajqGI0g2xlJTdg) document.

## Usage

```js
var Metrics = require('cf-metrics')
  , metrics = new Metrics(
    '127.0.0.1'
    , 8325
    , { client: 'nuk'
      , platform: 'sunperks'
      , application: 'site'
      , environment: 'production'
      }
    )
```

### Timers

```js
var timer = metrics.createTimer('backend-api', 'Hive', 'get-code')

apiRequest(function(err) {
  timer.stop()
})
```

### Counters

```js
metrics.increment('external-api', 'user', 'login', 'succeeded')
```

There is no need to create a counter if a timer for the same action already
exists. Statsd will automatically create a counter for every timer.

The final argument of a counter should always be a past-tense verb, e.g.:

* succeeded
* failed

#### Useful links

* http://blog.pkhamre.com/2012/07/24/understanding-statsd-and-graphite/
