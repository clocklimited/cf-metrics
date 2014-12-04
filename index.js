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

Metrics.prototype.increment = function () {
  var key = this.generateKey.apply(this, arguments)
  this.logger.info('metrics:increment', key)
  return this.metrics.increment(key)
}

Metrics.prototype.createTimer = function (section) {
  var args = Array.prototype.slice.call(arguments, 0)
    , key = this.generateKey.apply(this, args)

  this.logger.info('metrics:timer:start', key)

  args.push('requested')
  this.increment.apply(this, args)

  return this.metrics.createTimer(key)
}
