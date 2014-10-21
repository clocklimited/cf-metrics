var Lynx = require('lynx')

module.exports = Metrics

function Metrics(statsdServer, statsdPort, options) {

  this.logger = options.logger || console

  this.scope = this.generateKey(
    options.clientId
  , options.projectId
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
    .join('.')
}

Metrics.prototype.increment = function (section, key1, key2, key3) {
  var key = this.generateKey(section, key1, key2, key3)
  this.logger.info('metrics:increment', key)
  return this.metrics.increment(key)
}

Metrics.prototype.createTimer = function (section, key1, key2) {
  var key = this.generateKey(section, key1, key2)
  this.logger.info('metrics:timer:start', key)
  this.increment(section, key1, key2, 'requested')
  return this.metrics.createTimer(key)
}
