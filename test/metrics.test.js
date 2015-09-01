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
    , { client: 'Client'
      , platform: 'Project'
      , application: 'App'
      , environment: 'testing'
      , logger: noopLogger
      }
    )

    metrics.metrics.socket = mockSocket
    statsdMessage = null
  })

  describe('constructor', function () {

    it('should properly generate a default lower-cased scope', function () {
      assert.equal(metrics.scope, 'client.project.app.testing')
    })

    it('should throw an error if the wrong properties are used', function () {
      var errorMetric
      assert.throws(
        function () {
          errorMetric = new Metrics(
                '127.0.0.1'
              , null
              , { clientId: 'Client'
                , projectId: 'Project'
                , application: 'App'
                , environment: 'testing'
                , logger: noopLogger
                })
        }
      , function (err) {
          if ((err instanceof Error) && err.toString() === 'Error: Missing expected properties: client, platform') {
            return true;
          }
        }
      , 'An unexpected error occurred'
      )
    })
  })

  describe('key generation', function () {

    it('keys should replace reserved characters with a hyphen', function () {
      metrics.increment('test', 'one:two|three.four')
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.test.one-two-three.four:1|c')
    })
  })

  describe('increment', function () {

    it('should send a correctly formatted message', function () {
      metrics.increment('testSection', 'testKey1')
      assert(spy.calledOnce)
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.testSection.testKey1:1|c')
    })

    it('should append unlimited extra keys to the message', function () {

      metrics.increment('testSection', 'testKey1', 'testKey2')
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.testSection.testKey1.testKey2:1|c')

      spy.reset()

      metrics.increment('testSection', 'testKey1', 'testKey2', 'testKey3')
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage, 'client.project.app.testing.testSection.testKey1.testKey2.testKey3:1|c')

      spy.reset()

      metrics.increment('testSection', 'testKey1', 'testKey2', 'testKey3', 'testKey4', 'testKey5', 'testKey6')
      statsdMessage = spy.getCall(0).args[0].toString('utf8')
      assert.equal(statsdMessage
      , 'client.project.app.testing.testSection.testKey1.testKey2.testKey3.testKey4.testKey5.testKey6:1|c')
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
