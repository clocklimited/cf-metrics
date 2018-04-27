var Lynx = require('lynx')

module.exports = Metrics

function Metrics(statsdServer, statsdPort, options) {
  var expectedProperties =
        [ 'client'
        , 'platform'
        , 'application'
        , 'environment'
        ]
    , missingProperties = []

  expectedProperties.forEach(function (property) {
    if (!options.hasOwnProperty(property)) {
      missingProperties.push(property)
    }
  })
  if (missingProperties.length > 0) {
    throw new Error('Missing expected properties: ' + missingProperties.join(', '))
  }

  this.logger = options.logger || console

  this.scope = this.generateKey(
    options.client
  , options.platform
  , options.application
  , options.environment
  ).toLowerCase()

  this.metrics = new Lynx(
    statsdServer
  , statsdPort
  , { scope: this.scope
    /*jshint camelcase: false */
    , on_error: this.logger.warn
    }
  )
}

Metrics.prototype.generateKey = function () {
  return Array.prototype.slice.call(arguments)
    .filter(function (value) { if (value) return value })

    // statsd will replace spaces with underscores, and strip all other special
    // chars from keys automatically. we need to manually strip colons and pipes
    // as they have special meaning in statsd messages and will cause the whole
    // message to be rejected if they are in the wrong place.
    .map(function (value) { return String(value).replace(/[:|]/g, '-') })
    .join('.')
}

Metrics.prototype.generateKeyValue = function () {
  var key = this.generateKey.apply(this, arguments)
    , keyParts = key.split('.')
    , value = keyParts.pop()
  return { key: keyParts.join('.'), value: value }
}

Metrics.prototype.increment = function () {
  var key = this.generateKey.apply(this, arguments)
  this.logger.info('metrics:increment', key)
  return this.metrics.increment(key)
}

Metrics.prototype.gauge = function () {
  var data = this.generateKeyValue.apply(this, arguments)
  this.logger.info('metrics:gauge', data.key, data.value)
  return this.metrics.gauge(data.key, data.value)
}

Metrics.prototype.timing = function () {
  var data = this.generateKeyValue.apply(this, arguments)
  this.logger.info('metrics:timing', data.key, data.value)
  return this.metrics.timing(data.key, data.value)
}

Metrics.prototype.createTimer = function () {
  var args = Array.prototype.slice.call(arguments, 0)
    , key = this.generateKey.apply(this, args)

  this.logger.info('metrics:timer:start', key)

  args.push('requested')
  this.increment.apply(this, args)

  return this.metrics.createTimer(key)
}
