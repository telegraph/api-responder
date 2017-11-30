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
  port = 8082,
  timeout,
  { exec, spawn } = require('child_process')

if (global.describe) {
  describe('Invoke from CLI\n', () => {
    before(done => {
      // start tests when server ready

      let log = '',
        child = spawn('node', [
          'server',
          '--config',
          'tests/configs/test-api-config.js',
          '--port',
          port
        ])
      child.stdout.on('data', data => {
        if (!timeout) {
          timeout = setTimeout(() => {
            console.log(log)
            done()
          }, 1000)
        }

        log += data
      })
    })
    after(done => {
      let log = ''
      console.log()
      console.log('     ---------------------------------')
      console.log()
      child = spawn('lsof', ['-i', ':' + port])

      child.stdout.on('data', data => {
        log += data
      })
      child.stderr.on('data', data => {
        log += data
      })
      child.on('close', code => {
        log
          .split('\n')
          .slice(1)
          .forEach(line => {
            if (line.substr(0, 4) === 'node') {
              let pid = line.replace(/\s+/g, '|').split('|')[1]
              let killer = spawn('kill', ['-9', pid])
              killer.on('close', () => {
                console.log()
                console.log('      Killed CLI-invoked server on port :', port)
                done()
              })
            }
          })
      })
    })

    it('should pass endpoint params and query to promise-based responder via api argument', done => {
      axios({ url: 'http://localhost:' + port + '/params/firstname?type=name' })
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
      axios({
        url: 'http://localhost:' + port + '/genparams/firstname?type=name&responder=generator'
      })
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
      axios({ url: 'http://localhost:' + port + '/test' })
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
      axios({ url: 'http://localhost:' + port + '/index.html' })
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
      axios({ method: 'POST', url: 'http://localhost:' + port + '/post', data: { name: 'Tommy' } })
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
      axios({ method: 'PUT', url: 'http://localhost:' + port + '/put', data: { name: 'Tommy' } })
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
      axios({ url: 'http://localhost:' + port + '/gen' })
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
        .head('http://localhost:' + port + '/gen')
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
      axios({ url: 'http://localhost:' + port + '/gen' })
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
      axios({ url: 'http://localhost:' + port + '/noCORS' })
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
      axios({ url: 'http://localhost:' + port + '/throw' })
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
          url: 'http://localhost:' + port + '/download',
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
      axios({ url: 'http://localhost:' + port + '/newsapi/sources' })
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
