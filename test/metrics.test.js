var Metrics = require('../index')
  , sinon = require('sinon')
  , assert = require('assert')
  , noop = function () {}
  , noopLogger = { log: noop, info: noop, error: noop, warn: noop }

describe('Metrics', function () {

  var metrics, spy, statsdMessage

  beforeEach(function () {
    var mockSocket = { send: function () {} }
    spy = sinon.spy(mockSocket, 'send')

    metrics = new Metrics(
      '127.0.0.1'
    , null
    , { clientId: 'Client'
      , projectId: 'Project'
      , application: 'App'
      , environment: 'testing'
      , logger: noopLogger
      }
    )

    metrics.metrics.socket = mockSocket
    statsdMessage = null
  })

  describe('constructor', function () {

    it('should properly generate a default lowercased scope', function () {
      assert.equal(metrics.scope, 'client.project.app.testing')
    })
  })

  describe('increment', function () {

    it('should send a correctly formatted message', function () {
      metrics.increment('testSection', 'testKey1')
      assert(spy.calledOnce)
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.testSection.testKey1:1|c')
    })

    it('should append up to 2 extra keys to the message', function () {

      metrics.increment('testSection', 'testKey1', 'testKey2')
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.testSection.testKey1.testKey2:1|c')

      spy.reset()

      metrics.increment('testSection', 'testKey1', 'testKey2', 'testKey3')
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.testSection.testKey1.testKey2.testKey3:1|c')
    })
  })

  describe('timer', function () {

    it('should increment an associated "requested" counter when created', function () {
      metrics.createTimer('testSection', 'testKey1')
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.testSection.testKey1.requested:1|c')
    })

    it('should send a correctly formatted message when the timer is stopped', function (done) {
      var timer = metrics.createTimer('testSection', 'testKey1')
        , message = /client\.project\.app\.testing\.testSection\.testKey1:[0-9.]+\|ms/

      setTimeout(function () {
        timer.stop()
        assert(spy.calledTwice, 'the socket should have been called once for the counter, and again for the timer')
        statsdMessage = spy.getCall(1).args[0].toString('utf8')
        assert(message.test(statsdMessage))
        done()
      }, 100)
    })

    it('should append up to 1 extra key to the message', function (done) {
      var timer = metrics.createTimer('testSection', 'testKey1', 'testKey2')
        , message = /client\.project\.app\.testing\.testSection\.testKey1\.testKey2:[0-9.]+\|ms/

      setTimeout(function () {
        timer.stop()
        statsdMessage = spy.getCall(1).args[0].toString('utf8')
        assert(message.test(statsdMessage))
        done()
      }, 100)
    })
  })
})
