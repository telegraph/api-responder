let apiResponder = require('../server.js'),
  am = require('async-methods'),
  express = require('express'),
  staticFolder = 'tests/public',
  app = express(),
  server = require('http').Server(app),
  axios = require('axios'),
  chai = require('chai'),
  assert = chai.assert,
  fs = require('fs'),
  join = require('path').join,
  port = 8084

if (global.describe) {
  describe('Use as Router for existing app\n\n', () => {
    before(done => {
      //
      // start tests when server ready
      app.use(express.static(staticFolder))
      server.listen(port, '0.0.0.0', () => {
        console.log('     Server listening on port ' + port)
        console.log('     Static files in ' + join(__dirname, staticFolder))

        // add routes using apiResponder
        apiResponder('tests/configs/test-api-config', app)
          .then(r => {
            console.log()
            console.log('      ---------------------------------')
            console.log()
            console.log('       USE as ROUTER only')
            console.log()

            done()
          })
          .catch(err => {
            console.log(25, err)
            done()
          })
      })
    })
    after(done => {
      console.log()
      console.log('     ---------------------------------')
      console.log()

      console.log('     Closing server on', port)
      server.close(done)
    })

    it('should pass endpoint params and query to promise-based responder via api argument', done => {
      axios({ url: 'http://localhost:8084/params/firstname?type=name' })
        .then(response => {
          assert.equal(response.status, 200)
          assert.ok(response.headers['content-type'].indexOf('application/json') !== -1)
          assert.deepEqual(response.data, {
            params: { field: 'firstname' },
            query: { type: 'name' }
          })
          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
          done()
        })
        .catch(done)
    })
    it('should pass endpoint params and query to generator-based responder via scope', done => {
      axios({ url: 'http://localhost:8084/genparams/firstname?type=name&responder=generator' })
        .then(response => {
          assert.equal(response.status, 200)
          assert.ok(response.headers['content-type'].indexOf('application/json') !== -1)
          assert.deepEqual(response.data, {
            params: { field: 'firstname' },
            query: { type: 'name', responder: 'generator' }
          })
          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
          done()
        })
        .catch(done)
    })

    it('should get valid response from get request to endpoint with promise-based responder', done => {
      axios({ url: 'http://localhost:8084/test' })
        .then(response => {
          assert.equal(response.status, 200)
          assert.ok(response.headers['content-type'].indexOf('application/json') !== -1)
          assert.deepEqual(response.data, { test: 67 })
          done()
        })
        .catch(err => {
          assert.fail()
          done()
        })
        .catch(() => {
          done()
        })
    })
    it('should serve from nominated public folder', done => {
      axios({ url: 'http://localhost:8084/index.html' })
        .then(response => {
          assert.equal(response.status, 200)
          assert.ok(response.headers['content-type'].indexOf('text/html') !== -1)
          assert.ok(response.data.indexOf('<h1>Test static files</h1>') !== -1)
          done()
        })
        .catch(err => {
          assert.fail()
          done()
        })
        .catch(() => {
          done()
        })
    })
    it('should accept post of JSON body', done => {
      axios({ method: 'POST', url: 'http://localhost:8084/post', data: { name: 'Tommy' } })
        .then(response => {
          assert.equal(response.status, 200)
          assert.deepEqual(response.data, { name: 'Tommy' })
          done()
        })
        .catch(err => {
          assert.fail()
          done()
        })
        .catch(() => {
          done()
        })
    })
    it('should accept put of JSON body', done => {
      axios({ method: 'PUT', url: 'http://localhost:8084/put', data: { name: 'Tommy' } })
        .then(response => {
          assert.equal(response.status, 200)
          assert.deepEqual(response.data, { name: 'Tommy' })
          done()
        })
        .catch(err => {
          assert.fail()
          done()
        })
        .catch(() => {
          done()
        })
    })
    it('should get valid response from get request to endpoint with generator-based responder', done => {
      axios({ url: 'http://localhost:8084/gen' })
        .then(response => {
          assert.equal(response.status, 200)
          assert.deepEqual(response.data, { gen: 98 })
          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
        })
        .catch(() => {
          done()
        })
    })
    it('should get valid response from HEAD request', done => {
      axios
        .head('http://localhost:8084/gen')
        .then(response => {
          assert.equal(response.status, 200)
          assert.equal(response.data, '')
          assert.ok(response.headers['content-type'].indexOf('application/json') !== -1)
          assert.equal(response.headers['access-control-allow-origin'], '*')
          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
        })
        .catch(done)
    })
    it('should get valid response with CORS header by default from get request to endpoint ', done => {
      axios({ url: 'http://localhost:8084/gen' })
        .then(response => {
          assert.equal(response.headers['access-control-allow-origin'], '*')
          assert.deepEqual(response.data, { gen: 98 })
          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
        })
        .catch(done)
    })
    it('should get response with no CORS header from get request to endpoint with CORS not set', done => {
      axios({ url: 'http://localhost:8084/noCORS' })
        .then(response => {
          assert.ok(!response.headers['access-control-allow-origin'])
          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
        })
        .catch(done)
    })
    it('should get 500 response from get request to endpoint with error', done => {
      axios({ url: 'http://localhost:8084/throw' })
        .then(response => {
          assert.fail(null, null, err.stack.split('\n')[0])
          done()
        })
        .catch(err => {
          assert.equal(err.response.status, 500)
          done()
        })
        .catch(done)
    })
    it('should allow download of a file attachment', done => {
      axios
        .request({
          responseType: 'arraybuffer',
          url: 'http://localhost:8084/download',
          method: 'get',
          headers: {
            'Content-Type': 'audio/mpeg'
          }
        })
        .then(result => {
          fs.writeFileSync(join(__dirname, 'download.mp3'), result.data)
          done()
        })
        .catch(err => {
          assert.equal(err.response.status, 500)
          done()
        })
        .catch(done)
    })
    it('should get valid response from get request to endpoint with reverse proxy responder with responseTransform', done => {
      axios({ url: 'http://localhost:8084/newsapi/sources' })
        .then(response => {
          assert.equal(response.status, 200)
          assert.ok(Array.isArray(response.data))
          assert.ok(response.data.length > 5)
          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
        })
        .catch(done)
    })
    it('should get valid text/html response from get request to endpoint with reverse proxy responder with requestTransform', done => {
      axios({ url: 'http://localhost:8084/bbc/iplayer' })
        .then(response => {
          assert.equal(response.status, 200)
          assert.ok(response.data.indexOf('iplayer/episode') !== -1)
          assert.ok(response.headers['content-type'].indexOf('text/html') !== -1)

          done()
        })
        .catch(err => {
          assert.fail(null, null, err.stack.split('\n')[0])
        })
        .catch(done)
    })
  })
} else {
  app.use(express.static(staticFolder))
  server.listen(port, '0.0.0.0', function() {
    console.log('Server listening on port ' + port)
    console.log('Static files in ' + join(__dirname, staticFolder))

    // add routes using apiResponder
    apiResponder('tests/configs/test-api-config', app).then(() => {
      console.log(202, 'done')
    })
  })
}
