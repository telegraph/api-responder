'use strict'

let args = process.argv.slice(2),
  express = require('express'),
  fs = require('fs-extra'),
  walker = require('klaw-sync'),
  am = require('async-methods'),
  join = require('path').join,
  bodyParser = require('body-parser'),
  platform = require('os').platform(),
  shell = require('shelljs'),
  cookieParser = require('cookie-parser'),
  axios = require('axios'),
  defaultConfig = {
    port: 8081,
    auto: false,
    defaults: {
      response_status: 200,
      method: 'GET',
      attachment: false,
      filename: '',
      type: '',
      CORS: true
    },
    public: 'public',
    apis: []
  }

class ApiResponder {
  constructor(config, port, app, staticFolder) {
    let self = this
    this.config =
      typeof config === 'string'
        ? require(join(__dirname, config))
        : typeof config === 'object' ? config : defaultConfig
    this.config.defaults = this.config.defaults || {}
    for (var attr in defaultConfig.defaults) {
      if (this.config.defaults[attr] === undefined) {
        this.config.defaults[attr] = defaultConfig.defaults[attr]
      }
    }
    self.setPort(port)
    if (staticFolder) {
      this.config.public = staticFolder
    }

    self.autoConfigureRoutes()
    // start server or route only

    let apiResponder = am(function(cb) {
      if (!app) {
        self.initServer(cb)
      } else {
        self.app = app
        self.initRouter(cb)
      }
    })
    this.then = fn => apiResponder.then(fn)
    this.catch = fn => apiResponder.catch(fn)
    return self
  }

  initServer(cb) {
    let self = this,
      app = (self.app = express())
    self.server = require('http').Server(self.app)
    var lsof,
      port = self.port,
      listen = function() {
        // allow posts up to 50MB in size
        app.use(
          bodyParser.json({
            limit: '50mb'
          })
        )
        app.use(
          bodyParser.urlencoded({
            limit: '50mb',
            extended: true
          })
        )

        // provides req.cookies
        app.use(cookieParser())

        // serve everything in 'public' folder as static files
        let staticFolder = (typeof self.config === 'object' && self.config.public) || 'public'
        app.use(express.static(staticFolder))
        self.server.listen(port, '0.0.0.0', function() {
          console.log('    [router] Responder listening on port ' + port)
          console.log('    [router] Static files in ' + join(__dirname, staticFolder))
          console.log()
          self.initRouter(cb)
          console.log()
        })
      }

    // check if port alreay in use
    // don't check in hosted environment or Windows
    if (!process.env.PORT && !process.env.port && (platform === 'darwin' || platform === 'linux')) {
      lsof = shell.exec('lsof -i :' + port, function(id, output) {
        // if a 'node' process is already using requested port, kill process
        if (output.split('\n').length > 1) {
          var listening = false
          output.split('\n').forEach(function(line) {
            if (!listening && line && line.substr(0, 4) === 'node') {
              listening = true
              var pid = line.replace(/\s+/g, '|').split('|')[1]
              shell.exec('kill -9 ' + pid, function() {
                console.log('[router] Killing process ' + pid + ' already usng port ' + port)
                listen()
              })
            }
          })
          if (!listening) {
            listen()
          }
        } else {
          listen()
        }
      })
    } else {
      listen()
    }
  }

  initRouter(cb) {
    let self = this,
      config = this.config,
      app = this.app

    if (!config.apis.length) {
      console.log('[router] No endpoints defined yet')
    }

    // add a route for each api response in config
    config.apis.forEach(function(endpointConfig, index) {
      console.log(
        '     ' +
          (index + 1) +
          '. ' +
          (endpointConfig.method || config.defaults.method) +
          ' ' +
          endpointConfig.endpoint
      )
      var method = (endpointConfig.method || config.defaults.method).toLowerCase()
      if (endpointConfig.middleware) {
        app[method](endpointConfig.endpoint, endpointConfig.middleware, function(req, res) {
          self.responder(endpointConfig, req, res)
        })
      } else {
        app[method](endpointConfig.endpoint, function(req, res) {
          // pass route to responder
          self.responder(endpointConfig, req, res)
        })
      }
    })
    cb(null, {
      server: self.server,
      app: self.app,
      config: self.config,
      addPublic: self.addPublic
    })
  }
  rproxy(api) {
    if (typeof api.transformRequest === 'function') {
      api.transformRequest(api)
    }

    let config =
      typeof api.rproxy === 'function'
        ? api.rproxy(api)
        : typeof api.rproxy === 'string' ? { url: api.rproxy } : api.rproxy
    config.headers = config.headers || {}
    config.params = config.params || {}
    config.method = config.method || api.req.method

    for (var attr in api.req.headers) {
      if (attr !== 'host' && attr !== '') {
        config.headers[attr] = api.req.headers[attr]
      }
    }
    for (var attr in api.req.query) {
      config.params[attr] = api.req.query[attr]
    }
    if (api.body) {
      config.data = api.body
    }

    return am(axios(config))
      .next(response => {
        api.response_status = response.status
        if (api.transformResponse) {
          if (am.isGenerator(api.transformResponse)) {
            return am(api.transformResponse, response.data)
          } else {
            return api.transformResponse(response.data)
          }
        } else {
          return response.data
        }
      })
      .error(err => {
        api.res.statusMessage = err.response.statusText
        api.res.response_status = err.response.statusText
        return err.response.data
      })
  }
  responder(endpointConfig, req, res) {
    var api,
      argsHaveClass,
      classArgs = [],
      self = this,
      timer = new Date().getTime(),
      api = { req: req, res: res }

    if (endpointConfig.methodName) {
      classArgs = [endpointConfig.methodName]
    }
    classArgs.push(endpointConfig.responder)
    argsHaveClass = am.argumentsHaveClass(classArgs)
    for (var attr in self.config.defaults) {
      api[attr] = self.config.defaults[attr]
    }

    // endpoint routes can overide default
    for (attr in endpointConfig) {
      api[attr] = endpointConfig[attr]
    }
    ;['query', 'body', 'params', 'cookies', 'headers', 'url'].forEach(attr => {
      api[attr] = req[attr]
    })
    am(
      new Promise(function(resolve, reject) {
        try {
          if (api.rproxy) {
            self
              .rproxy(api)
              .then(resolve)
              .catch(reject)
          } else if (argsHaveClass) {
            if (argsHaveClass.methodName && argsHaveClass.classFn) {
              am.ExtendedPromise._applyResultToClass
                .apply(api, [argsHaveClass])
                .then(result => {
                  resolve(result)
                })
                .catch(reject)
            } else {
              am.ExtendedPromise._applyResultToClass(argsHaveClass, [api])
                .then(resolve)
                .catch(reject)
            }
          } else if (am.isGenerator(api.responder)) {
            am(api.responder.apply(api))
              .then(resolve)
              .catch(reject)
          } else {
            api.responder.apply(this, [api, resolve, reject])
          }
        } catch (e) {
          reject(e)
        }
      })
    )
      .next(response => {
        if (response !== undefined) {
          api.response = response
        }

        timer = new Date().getTime() - timer

        // send the response
        if (api.CORS) {
          res.header('Access-Control-Allow-Origin', '*')
          res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept'
          )
        }
        // if response is a file the api-config should set api.type and api.filepath
        // corresponding to requested file
        if (api.filepath) {
          if (!api.type && api.filepath.lastIndexOf('.') !== -1) {
            api.type = api.filepath.substr(api.filepath.lastIndexOf('.') + 1)
          }
          fs.readFile(api.filepath, function(err, file) {
            // sets mime-type
            res.type(api.type)
            if (api.attachment) {
              // sets content disposition and mime-type
              // eg Content-Disposition: attachment filename="xxx.pdf"
              res.attachment(api.filepath)
            }
            res.status(api.response_status).send(file)
          })
          return
        }
        // send the response
        if (typeof api.response === 'object') {
          res.type(api.type || 'application/json')
        } else if (api.type) {
          res.type(api.type)
        }

        res.status(api.response_status).send(api.response)
      })
      .error(err => {
        res.status(500).send(err)
      })
  }

  addPublic(path) {
    if (typeof path === 'string') {
      this.app.use(express.static(path))
    }
  }
  setPort(port) {
    port = port || null
    this.config.port = this.port =
      process.env.PORT || process.env.port || port || this.config.port || 8081
  }
  autoConfigureRoutes() {
    if (!this.config || !this.config.auto || !this.config.apis) {
      return
    }
    let self = this,
      endpointsDirectory = join(__dirname, self.config.auto),
      endpointFiles = []

    am(fs.access(endpointsDirectory))
      .then(() => {
        endpointFiles = walker(endpointsDirectory, {
          nodir: true,
          filter: file => {
            return file.path.indexOf('.js') !== -1
          }
        })
        let treeBasedRoutes = endpointFiles.map(file => {
          let endpoint = { method: 'get' }
          if (file.path.indexOf('post.js') !== -1) {
            endpoint.method = 'post'
            endpoint.endpoint = file.path.replace(endpointsDirectory, '').replace(/post\.js/i, '')
          } else if (file.path.indexOf('put.js') !== -1) {
            endpoint.method = 'post'
            endpoint.endpoint = file.path.replace(endpointsDirectory, '').replace(/post\.js/i, '')
          } else if (file.path.indexOf('head.js') !== -1) {
            endpoint.method = 'post'
            endpoint.endpoint = file.path.replace(endpointsDirectory, '').replace(/post\.js/i, '')
          } else {
            endpoint.endpoint = file.path.replace(endpointsDirectory, '').replace(/\.js/i, '')
          }
          endpoint.responder = require(file.path)
          self.config.apis.push(endpoint)
        })
      })
      .catch(err => {
        console.log('Nominated auto directory, ', defaultConfig.auto, "doesn't exist")
      })
  }
  static parseArgsAndInit(args) {
    let port, app, config, staticFolder

    try {
      args.forEach((arg, i) => {
        if ((arg.indexOf('-config') === 0 || arg.indexOf('--config') === 0) && args[i + 1]) {
          config = args[i + 1]
        }
        if ((arg.indexOf('-port') === 0 || arg.indexOf('--port') === 0) && args[i + 1]) {
          port = args[i + 1]
        }
        if ((arg.indexOf('-public') === 0 || arg.indexOf('--public') === 0) && args[i + 1]) {
          staticFolder = args[i + 1]
        }
      })
    } catch (e) {}

    let apiResponder = new ApiResponder(config, port, app, staticFolder)
  }
}

// when invoked with node server -port xxx -config xxx -public xxx
// // when invoked via require - define module.exports
if (require.main === module) {
  ApiResponder.parseArgsAndInit(args)
} else {
  exports = function(config, port, app) {
    let apiResponder

    for (var i = 0; i < arguments.length; i++) {
      if (
        arguments[i].constructor &&
        arguments[i].constructor.name &&
        arguments[i].constructor.name === 'EventEmitter'
      ) {
        // app passed
        app = arguments[i]
      }

      if (typeof arguments[i] === 'object' || typeof arguments[i] === 'string') {
        config = arguments[i]
      } else if (typeof arguments[i] === 'number') {
        // app passed
        port = arguments[i]
      }
    }
    apiResponder = new ApiResponder(config, port, app)
    exports.app = apiResponder.app
    if (apiResponder.server) {
      exports.server = apiResponder.server
    }
    return apiResponder
  }
  module.exports = exports
}
